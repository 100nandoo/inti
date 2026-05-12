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
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/settings"
	"github.com/100nandoo/inti/internal/textprocessing"
)

type speakRequest struct {
	Text  string `json:"text"`
	Voice string `json:"voice"`
	Model string `json:"model"`
}

type speakResponse struct {
	Opus string `json:"opus"`
}

type voicesResponse struct {
	Voices  []string `json:"voices"`
	Default string   `json:"default"`
}

type modelsResponse struct {
	Models  []string `json:"models"`
	Default string   `json:"default"`
}

type healthResponse struct {
	Status string `json:"status"`
}

type errResponse struct {
	Error string `json:"error"`
}

type themeConfigRequest struct {
	Theme                 string `json:"theme"`
	SummaryDownloadFormat string `json:"summaryDownloadFormat"`
}

type themeConfigResponse struct {
	Theme                 string `json:"theme"`
	SummaryDownloadFormat string `json:"summaryDownloadFormat"`
}

func handleSpeak(g *gemini.Client, cfg *config.Config, processor *textprocessing.Processor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if g == nil {
			writeJSON(w, http.StatusServiceUnavailable, errResponse{"TTS unavailable — GEMINI_API_KEY not configured"})
			return
		}
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

		voice := req.Voice
		if voice == "" {
			voice = cfg.DefaultVoice
		}
		if !config.IsValidVoice(voice) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid voice: " + voice})
			return
		}

		model := req.Model
		if model == "" {
			model = cfg.DefaultModel
		}
		if !config.IsValidModel(model) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid model: " + model})
			return
		}

		result, err := processor.SynthesizeSpeech(r.Context(), textprocessing.SpeechRequest{
			Text:   req.Text,
			Voice:  voice,
			Model:  model,
			APIKey: cfg.GeminiAPIKey,
		})
		if err != nil {
			if textprocessing.IsRateLimited(err) {
				writeJSON(w, http.StatusTooManyRequests, errResponse{"rate limited — wait a moment and try again"})
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
		writeJSON(w, http.StatusOK, voicesResponse{
			Voices:  config.ValidVoices(),
			Default: cfg.DefaultVoice,
		})
	}
}

func handleModels(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, modelsResponse{
			Models:  config.ValidModels(),
			Default: cfg.DefaultModel,
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
			theme, summaryDownloadFormat := appearance.Get()
			writeJSON(w, http.StatusOK, themeConfigResponse{
				Theme:                 theme,
				SummaryDownloadFormat: summaryDownloadFormat,
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
			if err := appearance.Update(req.Theme, req.SummaryDownloadFormat); err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, themeConfigResponse{
				Theme:                 req.Theme,
				SummaryDownloadFormat: req.SummaryDownloadFormat,
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

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
