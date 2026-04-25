package server

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type storedKey struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Prefix     string     `json:"prefix"`
	Hash       string     `json:"hash"`
	CreatedAt  time.Time  `json:"createdAt"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
}

type apiKeyStore struct {
	mu   sync.RWMutex
	keys []storedKey
}

func apiKeysFilePath() string {
	if dir := os.Getenv("VOCALIZE_CONFIG_DIR"); dir != "" {
		return filepath.Join(dir, "api_keys.json")
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "api_keys.json"
	}
	return filepath.Join(base, "vocalize", "api_keys.json")
}

func generateKey() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "voc_" + hex.EncodeToString(b), nil
}

func generateID() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func hashKey(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func (s *apiKeyStore) hasKeys() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.keys) > 0
}

func (s *apiKeyStore) validate(raw string) (id string, ok bool) {
	h := hashKey(raw)
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, k := range s.keys {
		if k.Hash == h {
			return k.ID, true
		}
	}
	return "", false
}

func (s *apiKeyStore) list() []storedKey {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cp := make([]storedKey, len(s.keys))
	copy(cp, s.keys)
	return cp
}

func (s *apiKeyStore) create(name string) (storedKey, string, error) {
	raw, err := generateKey()
	if err != nil {
		return storedKey{}, "", err
	}
	id, err := generateID()
	if err != nil {
		return storedKey{}, "", err
	}
	entry := storedKey{
		ID:        id,
		Name:      name,
		Prefix:    raw[:12],
		Hash:      hashKey(raw),
		CreatedAt: time.Now().UTC(),
	}
	s.mu.Lock()
	s.keys = append(s.keys, entry)
	s.mu.Unlock()
	if err := s.save(); err != nil {
		// Non-fatal: key is in memory, just failed to persist.
		_ = err
	}
	return entry, raw, nil
}

func (s *apiKeyStore) delete(id string) (bool, error) {
	s.mu.Lock()
	found := false
	filtered := s.keys[:0]
	for _, k := range s.keys {
		if k.ID == id {
			found = true
		} else {
			filtered = append(filtered, k)
		}
	}
	s.keys = filtered
	s.mu.Unlock()
	if !found {
		return false, nil
	}
	return true, s.save()
}

func (s *apiKeyStore) touchLastUsed(id string) {
	now := time.Now().UTC()
	s.mu.Lock()
	for i := range s.keys {
		if s.keys[i].ID == id {
			s.keys[i].LastUsedAt = &now
			break
		}
	}
	s.mu.Unlock()
	_ = s.save()
}

func (s *apiKeyStore) save() error {
	s.mu.RLock()
	data, err := json.Marshal(s.keys)
	s.mu.RUnlock()
	if err != nil {
		return err
	}
	path := apiKeysFilePath()
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func loadAPIKeyStore() *apiKeyStore {
	store := &apiKeyStore{}
	data, err := os.ReadFile(apiKeysFilePath())
	if err != nil {
		return store
	}
	_ = json.Unmarshal(data, &store.keys)
	return store
}
