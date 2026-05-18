package settings

import (
	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/config"
)

type Runtime struct {
	Summarizer *SummarizerSettings
	Speech     *SpeechSettings
	Appearance *AppearanceSettings
	APIKeys    *APIKeys
	Telegram   *TelegramSessions
}

func LoadRuntime(cfg *config.Config) *Runtime {
	state := appstate.LoadRuntimeState(cfg)
	return &Runtime{
		Summarizer: NewSummarizerSettings(state.ActiveSummarizer),
		Speech:     NewSpeechSettings(state.ActiveSpeech),
		Appearance: NewAppearanceSettings(),
		APIKeys:    NewAPIKeys(state.APIKeys),
		Telegram:   NewTelegramSessions(state.TelegramSessions),
	}
}
