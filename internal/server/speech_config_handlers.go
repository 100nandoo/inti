package server

import (
	"encoding/json"
	"net/http"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/settings"
)

type speechConfigRequest struct {
	Provider string `json:"provider"`
	Voice    string `json:"voice"`
	Model    string `json:"model"`
}

type speechConfigResponse struct {
	Provider string `json:"provider"`
	Voice    string `json:"voice"`
	Model    string `json:"model"`
}

func handleSpeechConfig(ss *settings.SpeechSettings, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			provider, voice, model := ss.Get()
			if provider == "" {
				provider = cfg.SpeechProvider
			}
			if provider == "" {
				provider = config.SpeechProviderGemini
			}
			if voice == "" || !config.IsValidVoiceForProvider(provider, voice) {
				voice = config.DefaultVoiceForProvider(provider)
			}
			if !config.IsValidModelForProvider(provider, model) {
				model = config.DefaultModelForProvider(provider)
			}
			if provider == config.SpeechProviderKokoroHeart {
				model = ""
			}
			writeJSON(w, http.StatusOK, speechConfigResponse{
				Provider: provider,
				Voice:    voice,
				Model:    model,
			})
		case http.MethodPost:
			var req speechConfigRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
				return
			}
			if !config.IsValidSpeechProvider(req.Provider) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid provider"})
				return
			}
			if !config.IsValidVoiceForProvider(req.Provider, req.Voice) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid voice"})
				return
			}
			if !config.IsValidModelForProvider(req.Provider, req.Model) {
				writeJSON(w, http.StatusBadRequest, errResponse{"invalid model"})
				return
			}
			if err := ss.Update(req.Provider, req.Voice, req.Model); err != nil {
				_ = err
			}
			writeJSON(w, http.StatusOK, speechConfigResponse{
				Provider: req.Provider,
				Voice:    req.Voice,
				Model:    req.Model,
			})
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
		}
	}
}
