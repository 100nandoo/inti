package server

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/settings"
	"github.com/100nandoo/inti/internal/summarizer"
	"github.com/100nandoo/inti/internal/textprocessing"
)

type summarizeRequest struct {
	Text        string `json:"text"`
	Instruction string `json:"instruction"`
	Provider    string `json:"provider"` // optional: override server-configured provider
	Model       string `json:"model"`    // optional: override provider default model
	Mock        bool   `json:"mock"`     // optional: return a mock summary
}

type summarizeResponse struct {
	Summary    string                 `json:"summary"`
	Provider   string                 `json:"provider"`
	Model      string                 `json:"model"`
	RateLimits *summarizer.RateLimits `json:"rateLimits,omitempty"`
}

type summarizerConfigRequest struct {
	Provider string            `json:"provider"`
	Model    string            `json:"model"`
	Keys     map[string]string `json:"keys"`
}

type summarizerConfigResponse struct {
	Provider   string               `json:"provider"`
	Model      string               `json:"model"`
	Keys       map[string]string    `json:"keys"`
	GroqLimits *settings.RateLimits `json:"groqLimits,omitempty"`
}

func handleSummarize(asc *settings.SummarizerSettings, cfg *config.Config, processor *textprocessing.Processor) http.HandlerFunc {
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

		usedProvider := cfg.SummarizerProvider
		requestedModel := ""
		requestedAPIKey := ""

		if req.Provider != "" || req.Model != "" {
			usedProvider = req.Provider
			if usedProvider == "" {
				usedProvider = cfg.SummarizerProvider
			}
			requestedModel = summarizeRequestModelForProvider(usedProvider, req.Model)
			requestedAPIKey = asc.KeyForProvider(usedProvider)
		} else {
			activeProvider, activeModel, activeKeys, _ := asc.Get()
			if activeProvider != "" {
				usedProvider = activeProvider
			}
			requestedModel = summarizeRequestModelForProvider(usedProvider, activeModel)
			requestedAPIKey = activeKeys[usedProvider]
		}

		result, err := processor.Summarize(r.Context(), textprocessing.SummaryRequest{
			Text:        req.Text,
			Instruction: req.Instruction,
			Provider:    usedProvider,
			Model:       requestedModel,
			APIKey:      requestedAPIKey,
			Mock:        req.Mock,
		})
		if err != nil {
			if textprocessing.IsRateLimited(err) {
				writeJSON(w, http.StatusTooManyRequests, errResponse{"rate limited — wait a moment and try again"})
			} else if errors.Is(err, textprocessing.ErrSummarizerUnavailable) {
				writeJSON(w, http.StatusBadRequest, errResponse{err.Error()})
			} else {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			}
			return
		}

		if result.RateLimits != nil && result.Provider == "groq" {
			stored := captureGroqLimits(result.RateLimits)
			if err := asc.StoreGroqLimits(stored); err != nil {
				_ = err
			}
		}

		writeJSON(w, http.StatusOK, summarizeResponse{
			Summary:    result.Summary,
			Provider:   result.Provider,
			Model:      result.Model,
			RateLimits: result.RateLimits,
		})
	}
}

func handleSummarizerConfig(asc *settings.SummarizerSettings, cfg *config.Config) http.HandlerFunc {
	validProviders := map[string]bool{"gemini": true, "groq": true, "openrouter": true, "mock": true, "": true}
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			provider, model, keys, groqLimits := asc.Get()
			model = storedModelForProvider(provider, model)
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
			req.Model = storedModelForProvider(req.Provider, req.Model)
			_, _, currentKeys, groqLimits := asc.Get()
			if req.Keys["groq"] == "" || req.Keys["groq"] != currentKeys["groq"] {
				groqLimits = nil
			}
			if err := asc.Update(req.Provider, req.Model, req.Keys, groqLimits); err != nil {
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

func captureGroqLimits(rateLimits *summarizer.RateLimits) *settings.RateLimits {
	if rateLimits == nil {
		return nil
	}
	now := time.Now().UnixMilli()
	return &settings.RateLimits{
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

func summarizeRequestModelForProvider(provider, model string) string {
	if provider == "openrouter" {
		return ""
	}
	return model
}

func storedModelForProvider(provider, model string) string {
	if provider == "openrouter" {
		return ""
	}
	return model
}
