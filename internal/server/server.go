package server

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"sync"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/summarizer"
)

type activeSumConfig struct {
	mu         sync.RWMutex
	Provider   string
	Model      string
	Keys       map[string]string
	GroqLimits *storedRateLimits
}

func (a *activeSumConfig) get() (provider, model string, keys map[string]string, groqLimits *storedRateLimits) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	keys = map[string]string{
		"gemini":     a.Keys["gemini"],
		"groq":       a.Keys["groq"],
		"openrouter": a.Keys["openrouter"],
	}
	if a.GroqLimits != nil {
		limitsCopy := *a.GroqLimits
		groqLimits = &limitsCopy
	}
	return a.Provider, a.Model, keys, groqLimits
}

func (a *activeSumConfig) keyForProvider(provider string) string {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.Keys[provider]
}

func (a *activeSumConfig) set(provider, model string, keys map[string]string, groqLimits *storedRateLimits) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.Provider = provider
	a.Model = model
	a.Keys = map[string]string{
		"gemini":     keys["gemini"],
		"groq":       keys["groq"],
		"openrouter": keys["openrouter"],
	}
	a.GroqLimits = groqLimits
}

func (a *activeSumConfig) setGroqLimits(groqLimits *storedRateLimits) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.GroqLimits = groqLimits
}

func loadActiveConfig(cfg *config.Config) *activeSumConfig {
	asc := &activeSumConfig{
		Keys: map[string]string{
			"gemini":     cfg.GeminiAPIKey,
			"groq":       cfg.GroqAPIKey,
			"openrouter": cfg.OpenRouterAPIKey,
		},
		Provider: cfg.SummarizerProvider,
	}
	fileMu.Lock()
	vc := readIntiConfigUnlocked()
	fileMu.Unlock()
	if vc.Summarizer.Provider != "" {
		asc.Provider = vc.Summarizer.Provider
	}
	asc.Model = vc.Summarizer.Model
	if vc.Summarizer.GeminiAPIKey != "" {
		asc.Keys["gemini"] = vc.Summarizer.GeminiAPIKey
	}
	if vc.Summarizer.GroqAPIKey != "" {
		asc.Keys["groq"] = vc.Summarizer.GroqAPIKey
	}
	if vc.Summarizer.OpenRouterAPIKey != "" {
		asc.Keys["openrouter"] = vc.Summarizer.OpenRouterAPIKey
	}
	if vc.Summarizer.APIKey != "" && asc.Provider != "" && asc.Keys[asc.Provider] == "" {
		asc.Keys[asc.Provider] = vc.Summarizer.APIKey
	}
	asc.GroqLimits = vc.Summarizer.GroqLimits
	return asc
}

func saveActiveConfig(provider, model string, keys map[string]string, groqLimits *storedRateLimits) error {
	fileMu.Lock()
	defer fileMu.Unlock()
	vc := readIntiConfigUnlocked()
	vc.Summarizer = summarizerSection{
		Provider:         provider,
		Model:            model,
		GeminiAPIKey:     keys["gemini"],
		GroqAPIKey:       keys["groq"],
		OpenRouterAPIKey: keys["openrouter"],
		GroqLimits:       groqLimits,
	}
	return writeIntiConfigUnlocked(vc)
}

func Start(cfg *config.Config, webFS embed.FS) error {

	var g *gemini.Client
	if cfg.GeminiAPIKey != "" {
		var err error
		g, err = gemini.New(cfg.GeminiAPIKey)
		if err != nil {
			return fmt.Errorf("init gemini: %w", err)
		}
	}

	sum, err := summarizer.New(cfg)
	if err != nil {
		// Non-fatal: summarize endpoint will return an error per-request.
		sum = nil
	}

	asc := loadActiveConfig(cfg)
	ks := loadAPIKeyStore()

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/speak", handleSpeak(g, cfg))
	mux.HandleFunc("/api/voices", handleVoices(cfg))
	mux.HandleFunc("/api/models", handleModels(cfg))
	mux.HandleFunc("/api/ocr", handleOCR())
	mux.HandleFunc("/api/summarize", handleSummarize(sum, asc, cfg))
	mux.HandleFunc("/api/summarizer-config", handleSummarizerConfig(asc, cfg))

	// API key management routes
	mux.HandleFunc("GET /api/admin/keys", handleAdminListKeys(ks))
	mux.HandleFunc("POST /api/admin/keys", handleAdminCreateKey(ks))
	mux.HandleFunc("DELETE /api/admin/keys/{id}", handleAdminDeleteKey(ks))

	// Static files — strip the "web/" prefix from the embedded FS
	webRoot, err := fs.Sub(webFS, "web")
	if err != nil {
		return fmt.Errorf("embed sub: %w", err)
	}
	unauthorizedHTML, err := fs.ReadFile(webRoot, "401.html")
	if err != nil {
		return fmt.Errorf("read unauthorized page: %w", err)
	}
	mux.Handle("/", http.FileServer(http.FS(webRoot)))

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	return http.ListenAndServe(addr, requireAPIKey(cfg.MainKey, ks, unauthorizedHTML, mux))
}
