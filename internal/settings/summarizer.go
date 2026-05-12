package settings

import "github.com/100nandoo/inti/internal/appstate"

type RateLimits = appstate.StoredRateLimits

type SummarizerSettings struct {
	store *appstate.ActiveSummarizerConfig
}

func NewSummarizerSettings(store *appstate.ActiveSummarizerConfig) *SummarizerSettings {
	return &SummarizerSettings{store: store}
}

func (s *SummarizerSettings) Get() (provider, model string, keys map[string]string, groqLimits *RateLimits) {
	return s.store.Get()
}

func (s *SummarizerSettings) KeyForProvider(provider string) string {
	return s.store.KeyForProvider(provider)
}

func (s *SummarizerSettings) Update(provider, model string, keys map[string]string, groqLimits *RateLimits) error {
	s.store.Set(provider, model, keys, groqLimits)
	return appstate.SaveActiveSummarizerConfig(provider, model, keys, groqLimits)
}

func (s *SummarizerSettings) StoreGroqLimits(groqLimits *RateLimits) error {
	provider, model, keys, _ := s.store.Get()
	s.store.SetGroqLimits(groqLimits)
	return appstate.SaveActiveSummarizerConfig(provider, model, keys, groqLimits)
}
