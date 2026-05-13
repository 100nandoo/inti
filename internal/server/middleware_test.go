package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/100nandoo/inti/internal/settings"
)

func TestProtectedHTMLUsesUnauthorizedTemplateMessage(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/settings.html", nil)
	rec := httptest.NewRecorder()

	handler := requireAPIKey(
		"main-secret",
		settings.NewAPIKeys(nil),
		[]byte("<html><body><p>__MESSAGE__</p></body></html>"),
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
	)

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "Missing API key") {
		t.Fatalf("expected unauthorized page to contain the injected message, got %q", rec.Body.String())
	}
}
