package server

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/summarizer"
)

func New(cfg *config.Config, webFS embed.FS, state *appstate.RuntimeState) (*http.Server, error) {
	var g *gemini.Client
	if cfg.GeminiAPIKey != "" {
		var err error
		g, err = gemini.New(cfg.GeminiAPIKey)
		if err != nil {
			return nil, fmt.Errorf("init gemini: %w", err)
		}
	}

	sum, err := summarizer.New(cfg)
	if err != nil {
		sum = nil
	}

	if state == nil {
		state = appstate.LoadRuntimeState(cfg)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/speak", handleSpeak(g, cfg))
	mux.HandleFunc("/api/voices", handleVoices(cfg))
	mux.HandleFunc("/api/models", handleModels(cfg))
	mux.HandleFunc("/api/ocr", handleOCR())
	mux.HandleFunc("/api/summarize", handleSummarize(sum, state.ActiveSummarizer, cfg))
	mux.HandleFunc("/api/summarizer-config", handleSummarizerConfig(state.ActiveSummarizer, cfg))
	mux.HandleFunc("/api/theme-config", handleThemeConfig())
	mux.HandleFunc("GET /api/admin/keys", handleAdminListKeys(state.APIKeys))
	mux.HandleFunc("POST /api/admin/keys", handleAdminCreateKey(state.APIKeys))
	mux.HandleFunc("DELETE /api/admin/keys/{id}", handleAdminDeleteKey(state.APIKeys))

	webRoot, err := fs.Sub(webFS, "web")
	if err != nil {
		return nil, fmt.Errorf("embed sub: %w", err)
	}
	unauthorizedHTML, err := fs.ReadFile(webRoot, "401.html")
	if err != nil {
		return nil, fmt.Errorf("read unauthorized page: %w", err)
	}
	mux.Handle("/", http.FileServer(http.FS(webRoot)))

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	return &http.Server{
		Addr:    addr,
		Handler: securityHeaders(requireAPIKey(cfg.MainKey, state.APIKeys, unauthorizedHTML, mux)),
	}, nil
}
