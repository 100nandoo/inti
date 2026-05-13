package server

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/100nandoo/inti/internal/settings"
)

func newSecondaryPageHandler(t *testing.T) http.Handler {
	t.Helper()

	webRootPath := filepath.Join("..", "..", "web")
	unauthorizedHTML, err := os.ReadFile(filepath.Join(webRootPath, "401.html"))
	if err != nil {
		t.Fatalf("read unauthorized page: %v", err)
	}

	webRoot := os.DirFS(webRootPath)
	fileServer := http.FileServer(http.FS(webRoot))

	return requireAPIKey(
		"main-secret",
		settings.NewAPIKeys(nil),
		unauthorizedHTML,
		fileServer,
	)
}

func TestProtectedSettingsRouteServesBuiltEntry(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/settings.html?key=main-secret", nil)
	rec := httptest.NewRecorder()

	newSecondaryPageHandler(t).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, `<div id="app"></div>`) {
		t.Fatalf("expected settings shell app mount, got %q", body)
	}
	if !strings.Contains(body, `/assets/settings.js`) {
		t.Fatalf("expected settings page to reference built Svelte entry, got %q", body)
	}
}

func TestProtectedAPIKeysRouteServesBuiltEntry(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api-keys.html?key=main-secret", nil)
	rec := httptest.NewRecorder()

	newSecondaryPageHandler(t).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, `<div id="app"></div>`) {
		t.Fatalf("expected API keys shell app mount, got %q", body)
	}
	if !strings.Contains(body, `/assets/api-keys.js`) {
		t.Fatalf("expected API keys page to reference built Svelte entry, got %q", body)
	}
}

func TestProtectedSecondaryRoutesRenderUnauthorizedPage(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/settings.html", nil)
	rec := httptest.NewRecorder()

	newSecondaryPageHandler(t).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "401 Unauthorized") {
		t.Fatalf("expected unauthorized heading, got %q", body)
	}
	if !strings.Contains(body, "Missing API key") {
		t.Fatalf("expected unauthorized page to include the auth failure reason, got %q", body)
	}
	if !strings.Contains(body, "?key=...") {
		t.Fatalf("expected unauthorized page recovery hint, got %q", body)
	}
}
