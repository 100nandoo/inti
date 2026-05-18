package server

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/settings"
	"github.com/100nandoo/inti/internal/textprocessing"
)

func New(cfg *config.Config, webFS embed.FS, state *settings.Runtime) (*http.Server, error) {
	if state == nil {
		state = settings.LoadRuntime(cfg)
	}
	processor := textprocessing.New(cfg)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/speak", handleSpeak(cfg, processor))
	mux.HandleFunc("/api/voices", handleVoices(cfg))
	mux.HandleFunc("/api/models", handleModels(cfg))
	mux.HandleFunc("/health", handleHealth())
	mux.HandleFunc("/api/ocr", handleOCR(processor))
	mux.HandleFunc("/api/summarize", handleSummarize(state.Summarizer, cfg, processor))
	mux.HandleFunc("/api/summarizer-config", handleSummarizerConfig(state.Summarizer, cfg))
	mux.HandleFunc("/api/theme-config", handleThemeConfig(state.Appearance))
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
