package settings

import "github.com/100nandoo/inti/internal/appstate"

type APIKey = appstate.StoredKey

type APIKeys struct {
	store *appstate.APIKeyStore
}

func NewAPIKeys(store *appstate.APIKeyStore) *APIKeys {
	if store == nil {
		store = &appstate.APIKeyStore{}
	}
	return &APIKeys{store: store}
}

func (s *APIKeys) HasKeys() bool {
	return s.store.HasKeys()
}

func (s *APIKeys) Validate(raw string) (id string, ok bool) {
	return s.store.Validate(raw)
}

func (s *APIKeys) List() []APIKey {
	return s.store.List()
}

func (s *APIKeys) Create(name string) (APIKey, string, error) {
	return s.store.Create(name)
}

func (s *APIKeys) Delete(id string) (bool, error) {
	return s.store.Delete(id)
}

func (s *APIKeys) TouchLastUsed(id string) {
	s.store.TouchLastUsed(id)
}

func (s *APIKeys) HasID(id string) bool {
	return s.store.HasID(id)
}
