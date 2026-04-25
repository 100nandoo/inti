package server

import (
	"net/http"
	"strings"
)

// requireAPIKey protects all /api/* paths.
//
// When masterKey is set, auth is always enforced: the master key or any stored
// key will pass. When masterKey is empty, the old setup-mode applies: requests
// pass through until at least one key has been created in the store.
func requireAPIKey(masterKey string, store *apiKeyStore, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next.ServeHTTP(w, r)
			return
		}
		// Setup mode: no master key configured and store is empty.
		if masterKey == "" && !store.hasKeys() {
			next.ServeHTTP(w, r)
			return
		}
		raw := r.Header.Get("X-API-Key")
		if raw == "" {
			writeJSON(w, http.StatusUnauthorized, errResponse{"missing X-API-Key header"})
			return
		}
		// Master key always authenticates.
		if masterKey != "" && raw == masterKey {
			next.ServeHTTP(w, r)
			return
		}
		id, ok := store.validate(raw)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, errResponse{"invalid API key"})
			return
		}
		go store.touchLastUsed(id)
		next.ServeHTTP(w, r)
	})
}
