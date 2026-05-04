package server

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/audio"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/ocr"
	"github.com/100nandoo/inti/internal/summarizer"
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

type errResponse struct {
	Error string `json:"error"`
}

type summarizeRequest struct {
	Text        string `json:"text"`
	Instruction string `json:"instruction"`
	Provider    string `json:"provider"` // optional: override server-configured provider
	Model       string `json:"model"`    // optional: override provider default model
	Mock        bool   `json:"mock"`     // optional: return a mock summary
}

type summarizerConfigResponse struct {
	Provider   string                     `json:"provider"`
	Model      string                     `json:"model"`
	Keys       map[string]string          `json:"keys"`
	GroqLimits *appstate.StoredRateLimits `json:"groqLimits,omitempty"`
}

type themeConfigRequest struct {
	Theme string `json:"theme"`
}

type themeConfigResponse struct {
	Theme string `json:"theme"`
}

type summarizeResponse struct {
	Summary    string                 `json:"summary"`
	Provider   string                 `json:"provider"`
	Model      string                 `json:"model"`
	RateLimits *summarizer.RateLimits `json:"rateLimits,omitempty"`
}

func handleSpeak(g *gemini.Client, cfg *config.Config) http.HandlerFunc {
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

		pcm, err := g.GenerateSpeech(r.Context(), req.Text, voice, model)
		if err != nil {
			if gemini.IsRateLimit(err) {
				writeJSON(w, http.StatusTooManyRequests, errResponse{"rate limited — wait a moment and try again"})
			} else {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			}
			return
		}

		opusBytes, err := audio.EncodePCMToOpus(pcm, 24000)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, speakResponse{
			Opus: base64.StdEncoding.EncodeToString(opusBytes),
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

func handleOCR() http.HandlerFunc {
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
			text, err := ocr.ExtractText(imageBytes)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
				return
			}
			if text != "" {
				parts = append(parts, text)
			}
		}

		writeJSON(w, http.StatusOK, ocrResponse{Text: strings.Join(parts, "\n\n")})
	}
}

func handleSummarize(serverSum summarizer.Summarizer, asc *appstate.ActiveSummarizerConfig, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
			return
		}

		var req summarizeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
			return
		}

		if req.Text == "" {
			writeJSON(w, http.StatusBadRequest, errResponse{"text is required"})
			return
		}

		if req.Mock {
			writeJSON(w, http.StatusOK, summarizeResponse{
				Summary:  fmt.Sprintf("This is a mock summary of the provided text.\n\nOriginal text length: %d characters.\nInstruction: %q", len(req.Text), req.Instruction),
				Provider: "mock",
				Model:    "mock-model",
			})
			return
		}

		s := serverSum
		usedProvider := cfg.SummarizerProvider
		if req.Provider != "" || req.Model != "" {
			overrideProvider := req.Provider
			if overrideProvider == "" {
				overrideProvider = cfg.SummarizerProvider
			}
			overrideAPIKey := asc.KeyForProvider(overrideProvider)
			var err error
			s, err = summarizer.NewFromRequest(overrideProvider, overrideAPIKey, req.Model, cfg)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, errResponse{err.Error()})
				return
			}
			if overrideProvider != "" {
				usedProvider = overrideProvider
			}
		} else {
			activeProvider, activeModel, activeKeys, _ := asc.Get()
			activeAPIKey := activeKeys[activeProvider]
			if activeProvider != "" || activeAPIKey != "" || activeModel != "" {
				var err error
				s, err = summarizer.NewFromRequest(activeProvider, activeAPIKey, activeModel, cfg)
				if err != nil {
					writeJSON(w, http.StatusBadRequest, errResponse{err.Error()})
					return
				}
				if activeProvider != "" {
					usedProvider = activeProvider
				}
			}
		}
		if s == nil {
			writeJSON(w, http.StatusServiceUnavailable, errResponse{"no summarizer configured — set a provider and API key"})
			return
		}

		summary, err := s.Summarize(r.Context(), req.Text, req.Instruction)
		if err != nil {
			if gemini.IsRateLimit(err) || strings.Contains(err.Error(), "rate limited") {
				writeJSON(w, http.StatusTooManyRequests, errResponse{"rate limited — wait a moment and try again"})
			} else {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			}
			return
		}

		usedModel := req.Model
		if usedModel == "" {
			usedModel = modelForProvider(usedProvider, cfg)
		}
		var rateLimits *summarizer.RateLimits
		if rl, ok := s.(summarizer.RateLimiter); ok {
			rateLimits = rl.GetLastRateLimits()
			if rateLimits != nil && usedProvider == "groq" {
				stored := captureGroqLimits(rateLimits)
				provider, model, keys, _ := asc.Get()
				asc.SetGroqLimits(stored)
				if err := appstate.SaveActiveSummarizerConfig(provider, model, keys, stored); err != nil {
					_ = err
				}
			}
		}
		writeJSON(w, http.StatusOK, summarizeResponse{
			Summary:    summary,
			Provider:   usedProvider,
			Model:      usedModel,
			RateLimits: rateLimits,
		})
	}
}

type summarizerConfigRequest struct {
	Provider string            `json:"provider"`
	Model    string            `json:"model"`
	Keys     map[string]string `json:"keys"`
}

func handleSummarizerConfig(asc *appstate.ActiveSummarizerConfig, cfg *config.Config) http.HandlerFunc {
	validProviders := map[string]bool{"gemini": true, "groq": true, "openrouter": true, "mock": true, "": true}
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			provider, model, keys, groqLimits := asc.Get()
			if model == "" {
				model = modelForProvider(provider, cfg)
			}
			writeJSON(w, http.StatusOK, summarizerConfigResponse{Provider: provider, Model: model, Keys: keys, GroqLimits: groqLimits})
		case http.MethodPost:
			var req summarizerConfigRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
				return
			}
			if !validProviders[req.Provider] {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid provider"})
				return
			}
			_, _, currentKeys, groqLimits := asc.Get()
			if req.Keys["groq"] == "" || req.Keys["groq"] != currentKeys["groq"] {
				groqLimits = nil
			}
			asc.Set(req.Provider, req.Model, req.Keys, groqLimits)
			if err := appstate.SaveActiveSummarizerConfig(req.Provider, req.Model, req.Keys, groqLimits); err != nil {
				// non-fatal: config will still work in-memory this session
				_ = err
			}
			model := req.Model
			if model == "" {
				model = modelForProvider(req.Provider, cfg)
			}
			writeJSON(w, http.StatusOK, summarizerConfigResponse{Provider: req.Provider, Model: model, Keys: req.Keys, GroqLimits: groqLimits})
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
		}
	}
}

func handleThemeConfig() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			writeJSON(w, http.StatusOK, themeConfigResponse{Theme: appstate.LoadTheme()})
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
			if err := appstate.SaveTheme(req.Theme); err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, themeConfigResponse{Theme: req.Theme})
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
		}
	}
}

func isValidTheme(theme string) bool {
	return appstate.IsValidTheme(theme)
}

func captureGroqLimits(rateLimits *summarizer.RateLimits) *appstate.StoredRateLimits {
	if rateLimits == nil {
		return nil
	}
	now := time.Now().UnixMilli()
	return &appstate.StoredRateLimits{
		LimitRequests:     rateLimits.LimitRequests,
		LimitTokens:       rateLimits.LimitTokens,
		RemainingRequests: rateLimits.RemainingRequests,
		RemainingTokens:   rateLimits.RemainingTokens,
		ResetRequests:     rateLimits.ResetRequests,
		ResetTokens:       rateLimits.ResetTokens,
		CapturedAt:        now,
		ResetRequestsAt:   now + parseGroqDuration(rateLimits.ResetRequests),
		ResetTokensAt:     now + parseGroqDuration(rateLimits.ResetTokens),
	}
}

func parseGroqDuration(raw string) int64 {
	if raw == "" {
		return 0
	}
	if d, err := time.ParseDuration(raw); err == nil {
		return d.Milliseconds()
	}
	return 0
}

func modelForProvider(provider string, cfg *config.Config) string {
	switch provider {
	case "gemini":
		return "gemini-2.0-flash"
	case "groq":
		return cfg.GroqModel
	case "openrouter":
		return cfg.OpenRouterModel
	case "mock":
		return "mock-model"
	default:
		return ""
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
