package server

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/settings"
	"github.com/100nandoo/inti/internal/textprocessing"
)

type speakRequest struct {
	Text     string `json:"text"`
	Provider string `json:"provider"`
	Voice    string `json:"voice"`
	Model    string `json:"model"`
}

type speakResponse struct {
	Opus string `json:"opus"`
}

type voicesResponse struct {
	Provider string   `json:"provider"`
	Voices   []string `json:"voices"`
	Default  string   `json:"default"`
}

type modelsResponse struct {
	Provider string   `json:"provider"`
	Models   []string `json:"models"`
	Default  string   `json:"default"`
}

type healthResponse struct {
	Status string `json:"status"`
}

type errResponse struct {
	Error string `json:"error"`
}

type themeConfigRequest struct {
	Theme                    string `json:"theme"`
	SummaryDownloadFormat    string `json:"summaryDownloadFormat"`
	OCRPromotionBehavior     string `json:"ocrPromotionBehavior"`
	SummaryPromotionBehavior string `json:"summaryPromotionBehavior"`
}

type themeConfigResponse struct {
	Theme                    string `json:"theme"`
	SummaryDownloadFormat    string `json:"summaryDownloadFormat"`
	OCRPromotionBehavior     string `json:"ocrPromotionBehavior"`
	SummaryPromotionBehavior string `json:"summaryPromotionBehavior"`
}

func handleSpeak(cfg *config.Config, speechSettings *settings.SpeechSettings, processor *textprocessing.Processor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
			return
		}

		var req speakRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
			return
		}

		if req.Text == "" {
			writeJSON(w, http.StatusBadRequest, errResponse{"text is required"})
			return
		}

		storedProvider, storedVoice, storedModel := "", "", ""
		if speechSettings != nil {
			storedProvider, storedVoice, storedModel = speechSettings.Get()
		}

		provider := req.Provider
		if provider == "" {
			provider = storedProvider
		}
		if provider == "" {
			provider = cfg.SpeechProvider
		}
		if provider == "" {
			provider = config.SpeechProviderGemini
		}
		if !config.IsValidSpeechProvider(provider) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid provider: " + provider})
			return
		}

		voice := req.Voice
		if voice == "" {
			if storedVoice != "" && config.IsValidVoiceForProvider(provider, storedVoice) {
				voice = storedVoice
			} else if cfg.DefaultVoice != "" && config.IsValidVoiceForProvider(provider, cfg.DefaultVoice) {
				voice = cfg.DefaultVoice
			} else {
				voice = config.DefaultVoiceForProvider(provider)
			}
		}
		if !config.IsValidVoiceForProvider(provider, voice) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid voice: " + voice})
			return
		}

		model := req.Model
		if model == "" && provider == config.SpeechProviderGemini {
			if storedModel != "" && config.IsValidModelForProvider(provider, storedModel) {
				model = storedModel
			} else if cfg.DefaultModel != "" && config.IsValidModelForProvider(provider, cfg.DefaultModel) {
				model = cfg.DefaultModel
			} else {
				model = config.DefaultModelForProvider(provider)
			}
		}
		if !config.IsValidModelForProvider(provider, model) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid model: " + model})
			return
		}

		result, err := processor.SynthesizeSpeech(r.Context(), textprocessing.SpeechRequest{
			Text:     req.Text,
			Provider: provider,
			Voice:    voice,
			Model:    model,
			APIKey:   cfg.GeminiAPIKey,
		})
		if err != nil {
			if textprocessing.IsRateLimited(err) {
				writeJSON(w, http.StatusTooManyRequests, errResponse{"rate limited — wait a moment and try again"})
			} else if textprocessing.IsTTSUnavailable(err) {
				writeJSON(w, http.StatusServiceUnavailable, errResponse{err.Error()})
			} else {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			}
			return
		}

		writeJSON(w, http.StatusOK, speakResponse{
			Opus: base64.StdEncoding.EncodeToString(result.Opus),
		})
	}
}

func handleVoices(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		provider := r.URL.Query().Get("provider")
		if provider == "" {
			provider = cfg.SpeechProvider
		}
		if provider == "" {
			provider = config.SpeechProviderGemini
		}
		if !config.IsValidSpeechProvider(provider) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid provider: " + provider})
			return
		}

		defaultVoice := config.DefaultVoiceForProvider(provider)
		if cfg.DefaultVoice != "" && config.IsValidVoiceForProvider(provider, cfg.DefaultVoice) {
			defaultVoice = cfg.DefaultVoice
		}

		writeJSON(w, http.StatusOK, voicesResponse{
			Provider: provider,
			Voices:   config.ValidVoicesForProvider(provider),
			Default:  defaultVoice,
		})
	}
}

func handleModels(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		provider := r.URL.Query().Get("provider")
		if provider == "" {
			provider = cfg.SpeechProvider
		}
		if provider == "" {
			provider = config.SpeechProviderGemini
		}
		if !config.IsValidSpeechProvider(provider) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid provider: " + provider})
			return
		}

		defaultModel := ""
		if provider == config.SpeechProviderGemini {
			defaultModel = config.DefaultModelForProvider(provider)
			if cfg.DefaultModel != "" && config.IsValidModelForProvider(provider, cfg.DefaultModel) {
				defaultModel = cfg.DefaultModel
			}
		}

		writeJSON(w, http.StatusOK, modelsResponse{
			Provider: provider,
			Models:   config.ValidModelsForProvider(provider),
			Default:  defaultModel,
		})
	}
}

func handleHealth() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
			return
		}

		writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
	}
}

type ocrResponse struct {
	Text string `json:"text"`
}

func isDisallowedSVGUpload(filename, contentType string, data []byte) bool {
	if strings.EqualFold(contentType, "image/svg+xml") {
		return true
	}
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == ".svg" || ext == ".svgz" {
		return true
	}

	trimmed := bytes.TrimSpace(data)
	if len(trimmed) == 0 {
		return false
	}
	sniffLen := len(trimmed)
	if sniffLen > 512 {
		sniffLen = 512
	}
	snippet := strings.ToLower(string(trimmed[:sniffLen]))
	return strings.HasPrefix(snippet, "<svg") ||
		strings.HasPrefix(snippet, "<?xml") && strings.Contains(snippet, "<svg")
}

func handleOCR(processor *textprocessing.Processor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
			return
		}

		if err := r.ParseMultipartForm(50 << 20); err != nil {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid multipart form"})
			return
		}

		// Accept "files" (multi-upload) with "file" as a fallback for single-file requests.
		fileHeaders := r.MultipartForm.File["files"]
		if len(fileHeaders) == 0 {
			fileHeaders = r.MultipartForm.File["file"]
		}
		if len(fileHeaders) == 0 {
			writeJSON(w, http.StatusBadRequest, errResponse{"at least one file is required"})
			return
		}

		var parts []string
		for _, fh := range fileHeaders {
			f, err := fh.Open()
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{"open file: " + err.Error()})
				return
			}
			imageBytes, err := io.ReadAll(f)
			f.Close()
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{"read file: " + err.Error()})
				return
			}
			if isDisallowedSVGUpload(fh.Filename, fh.Header.Get("Content-Type"), imageBytes) {
				writeJSON(w, http.StatusBadRequest, errResponse{"svg uploads are not allowed"})
				return
			}
			result, err := processor.ExtractText(r.Context(), textprocessing.OCRRequest{ImageBytes: imageBytes})
			if err != nil {
				if textprocessing.IsNoTextFound(err) {
					continue
				}
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
				return
			}
			parts = append(parts, result.Text)
		}

		writeJSON(w, http.StatusOK, ocrResponse{Text: strings.Join(parts, "\n\n")})
	}
}

func handleThemeConfig(appearance *settings.AppearanceSettings) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			theme, summaryDownloadFormat, ocrPromotionBehavior, summaryPromotionBehavior := appearance.Get()
			writeJSON(w, http.StatusOK, themeConfigResponse{
				Theme:                    theme,
				SummaryDownloadFormat:    summaryDownloadFormat,
				OCRPromotionBehavior:     ocrPromotionBehavior,
				SummaryPromotionBehavior: summaryPromotionBehavior,
			})
		case http.MethodPost:
			var req themeConfigRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
				return
			}
			if !isValidTheme(req.Theme) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid theme"})
				return
			}
			if !isValidSummaryDownloadFormat(req.SummaryDownloadFormat) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid summary download format"})
				return
			}
			if !isValidPromotionBehavior(req.OCRPromotionBehavior) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid OCR promotion behavior"})
				return
			}
			if !isValidPromotionBehavior(req.SummaryPromotionBehavior) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid summary promotion behavior"})
				return
			}
			if err := appearance.Update(req.Theme, req.SummaryDownloadFormat, req.OCRPromotionBehavior, req.SummaryPromotionBehavior); err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, themeConfigResponse{
				Theme:                    req.Theme,
				SummaryDownloadFormat:    req.SummaryDownloadFormat,
				OCRPromotionBehavior:     req.OCRPromotionBehavior,
				SummaryPromotionBehavior: req.SummaryPromotionBehavior,
			})
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
		}
	}
}

func isValidTheme(theme string) bool {
	return settings.IsValidTheme(theme)
}

func isValidSummaryDownloadFormat(format string) bool {
	return settings.IsValidSummaryDownloadFormat(format)
}

func isValidPromotionBehavior(behavior string) bool {
	return settings.IsValidPromotionBehavior(behavior)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
