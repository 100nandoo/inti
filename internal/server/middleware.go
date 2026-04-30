package server

import (
	"net/http"
	"strings"
)

const contentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob: data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

func authKey(r *http.Request) string {
	raw := r.Header.Get("X-API-Key")
	if raw == "" {
		raw = r.URL.Query().Get("key")
	}
	return raw
}

func validateAPIKey(mainKey string, store *apiKeyStore, raw string) bool {
	if mainKey != "" && raw == mainKey {
		return true
	}
	id, ok := store.validate(raw)
	if ok {
		go store.touchLastUsed(id)
	}
	return ok
}

func requireAPIKey(mainKey string, store *apiKeyStore, unauthorizedHTML []byte, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !requiresAuth(r) {
			next.ServeHTTP(w, r)
			return
		}
		raw := authKey(r)
		if raw == "" {
			writeUnauthorized(w, r, unauthorizedHTML, "Missing API key")
			return
		}
		if !validateAPIKey(mainKey, store, raw) {
			writeUnauthorized(w, r, unauthorizedHTML, "Invalid API key")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", contentSecurityPolicy)
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}

func writeUnauthorized(w http.ResponseWriter, r *http.Request, unauthorizedHTML []byte, msg string) {
	if isAPIRequest(r) {
		writeJSON(w, http.StatusUnauthorized, errResponse{msg + " (?key= query or X-API-Key header required)"})
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusUnauthorized)
	page := strings.ReplaceAll(string(unauthorizedHTML), "__MESSAGE__", msg)
	_, _ = w.Write([]byte(page))
}

func isAPIRequest(r *http.Request) bool {
	return len(r.URL.Path) >= 5 && r.URL.Path[:5] == "/api/"
}

func requiresAuth(r *http.Request) bool {
	if isAPIRequest(r) {
		return true
	}
	return r.URL.Path == "/" || strings.HasSuffix(r.URL.Path, ".html")
}
