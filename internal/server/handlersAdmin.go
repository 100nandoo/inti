package server

import (
	"encoding/json"
	"net/http"
	"time"
)

type keyListItem struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Prefix     string     `json:"prefix"`
	CreatedAt  time.Time  `json:"createdAt"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
}

func toListItem(k storedKey) keyListItem {
	return keyListItem{
		ID:         k.ID,
		Name:       k.Name,
		Prefix:     k.Prefix,
		CreatedAt:  k.CreatedAt,
		LastUsedAt: k.LastUsedAt,
	}
}

func handleAdminListKeys(store *apiKeyStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		keys := store.list()
		items := make([]keyListItem, len(keys))
		for i, k := range keys {
			items[i] = toListItem(k)
		}
		writeJSON(w, http.StatusOK, map[string]any{"keys": items})
	}
}

func handleAdminCreateKey(store *apiKeyStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Name string `json:"name"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.Name == "" {
			req.Name = "Unnamed key"
		}
		entry, raw, err := store.create(req.Name)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errResponse{"failed to create key"})
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{
			"key": toListItem(entry),
			"raw": raw,
		})
	}
}

func handleAdminDeleteKey(store *apiKeyStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		id := r.PathValue("id")
		if id == "" {
			writeJSON(w, http.StatusBadRequest, errResponse{"missing key id"})
			return
		}
		found, err := store.delete(id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errResponse{"failed to delete key"})
			return
		}
		if !found {
			writeJSON(w, http.StatusNotFound, errResponse{"key not found"})
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
