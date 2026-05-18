package settings

import "github.com/100nandoo/inti/internal/appstate"

type SpeechSettings struct {
	store *appstate.ActiveSpeechConfig
}

func NewSpeechSettings(store *appstate.ActiveSpeechConfig) *SpeechSettings {
	return &SpeechSettings{store: store}
}

func (s *SpeechSettings) Get() (provider, voice, model string) {
	return s.store.Get()
}

func (s *SpeechSettings) Update(provider, voice, model string) error {
	s.store.Set(provider, voice, model)
	return appstate.SaveActiveSpeechConfig(provider, voice, model)
}
