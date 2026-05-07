package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/summarizer"
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
	Provider   string                     `json:"provider"`
	Model      string                     `json:"model"`
	Keys       map[string]string          `json:"keys"`
	GroqLimits *appstate.StoredRateLimits `json:"groqLimits,omitempty"`
}

func handleSummarize(asc *appstate.ActiveSummarizerConfig, cfg *config.Config) http.HandlerFunc {
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

		usedProvider := cfg.SummarizerProvider
		requestedModel := ""
		requestedAPIKey := ""

		if req.Provider != "" || req.Model != "" {
			usedProvider = req.Provider
			if usedProvider == "" {
				usedProvider = cfg.SummarizerProvider
			}
			requestedModel = requestModelForProvider(usedProvider, req.Model)
			requestedAPIKey = asc.KeyForProvider(usedProvider)
		} else {
			activeProvider, activeModel, activeKeys, _ := asc.Get()
			if activeProvider != "" {
				usedProvider = activeProvider
			}
			requestedModel = requestModelForProvider(usedProvider, activeModel)
			requestedAPIKey = activeKeys[usedProvider]
		}

		s, err := summarizer.NewFromRequest(usedProvider, requestedAPIKey, requestedModel, cfg)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, errResponse{err.Error()})
			return
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

		usedModel := requestedModel
		if usedModel == "" {
			usedModel = modelForProvider(usedProvider, cfg)
		}
		if resolved, ok := s.(summarizer.ModelResolver); ok && resolved.ResolvedModel() != "" {
			usedModel = resolved.ResolvedModel()
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

func handleSummarizerConfig(asc *appstate.ActiveSummarizerConfig, cfg *config.Config) http.HandlerFunc {
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

func requestModelForProvider(provider, model string) string {
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
