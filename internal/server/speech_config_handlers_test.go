package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/settings"
)

func TestHandleSpeechConfigGetReturnsStoredConfig(t *testing.T) {
	t.Setenv("INTI_CONFIG_DIR", t.TempDir())
	cfg := &config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
	}
	speechSettings := settings.NewSpeechSettings(&appstate.ActiveSpeechConfig{
		Provider: config.SpeechProviderKokoroHeart,
		Voice:    config.DefaultKokoroHeartVoice,
		Model:    "",
	})
	req := httptest.NewRequest(http.MethodGet, "/api/speech-config", nil)
	rec := httptest.NewRecorder()

	handleSpeechConfig(speechSettings, cfg)(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var resp speechConfigResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Provider != config.SpeechProviderKokoroHeart || resp.Voice != config.DefaultKokoroHeartVoice || resp.Model != "" {
		t.Fatalf("response = %#v", resp)
	}
}

func TestHandleSpeechConfigPostRejectsInvalidModelForKokoro(t *testing.T) {
	t.Setenv("INTI_CONFIG_DIR", t.TempDir())
	cfg := &config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
	}
	speechSettings := settings.NewSpeechSettings(&appstate.ActiveSpeechConfig{
		Provider: config.SpeechProviderGemini,
		Voice:    config.DefaultGeminiVoice,
		Model:    config.DefaultModelName,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/speech-config", strings.NewReader(`{"provider":"kokoro-heart","voice":"cheery","model":"gemini-3.1-flash-tts-preview"}`))
	rec := httptest.NewRecorder()

	handleSpeechConfig(speechSettings, cfg)(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}
