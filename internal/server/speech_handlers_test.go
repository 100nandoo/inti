package server

import (
	"encoding/binary"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/settings"
	"github.com/100nandoo/inti/internal/textprocessing"
)

func TestHandleVoicesReturnsProviderAwareCatalog(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/voices?provider=kokoro-heart", nil)
	rec := httptest.NewRecorder()

	handleVoices(&config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
	})(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var resp voicesResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Provider != config.SpeechProviderKokoroHeart {
		t.Fatalf("provider = %q, want %q", resp.Provider, config.SpeechProviderKokoroHeart)
	}
	if len(resp.Voices) != 1 || resp.Voices[0] != config.DefaultKokoroHeartVoice {
		t.Fatalf("voices = %#v, want [cheery]", resp.Voices)
	}
	if resp.Default != config.DefaultKokoroHeartVoice {
		t.Fatalf("default = %q, want %q", resp.Default, config.DefaultKokoroHeartVoice)
	}
}

func TestHandleModelsReturnsEmptyCatalogForKokoroHeart(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/models?provider=kokoro-heart", nil)
	rec := httptest.NewRecorder()

	handleModels(&config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultModel:   config.DefaultModelName,
	})(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var resp modelsResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Provider != config.SpeechProviderKokoroHeart {
		t.Fatalf("provider = %q, want %q", resp.Provider, config.SpeechProviderKokoroHeart)
	}
	if len(resp.Models) != 0 {
		t.Fatalf("models = %#v, want empty", resp.Models)
	}
	if resp.Default != "" {
		t.Fatalf("default = %q, want empty", resp.Default)
	}
}

func TestHandleSpeakRejectsInvalidProviderSpecificModel(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/speak", strings.NewReader(`{"text":"hello","provider":"kokoro-heart","voice":"cheery","model":"gemini-3.1-flash-tts-preview"}`))
	rec := httptest.NewRecorder()

	handleSpeak(&config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
	}, settings.NewSpeechSettings(&appstate.ActiveSpeechConfig{
		Provider: config.SpeechProviderGemini,
		Voice:    config.DefaultGeminiVoice,
		Model:    config.DefaultModelName,
	}), textprocessing.New(&config.Config{}))(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestHandleSpeakReturnsUnavailableForGeminiWithoutKey(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/speak", strings.NewReader(`{"text":"hello","provider":"gemini","voice":"Kore","model":"gemini-3.1-flash-tts-preview"}`))
	rec := httptest.NewRecorder()

	cfg := &config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
	}
	handleSpeak(cfg, settings.NewSpeechSettings(&appstate.ActiveSpeechConfig{
		Provider: config.SpeechProviderGemini,
		Voice:    config.DefaultGeminiVoice,
		Model:    config.DefaultModelName,
	}), textprocessing.New(cfg))(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
}

func TestHandleSpeakReturnsResolvedProviderMetadata(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "audio/wav")
		_, _ = w.Write(testWAVBytes())
	}))
	defer upstream.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/speak", strings.NewReader(`{"text":"hello","provider":"kokoro-heart","voice":"cheery"}`))
	rec := httptest.NewRecorder()

	cfg := &config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
		KokoroHeartURL: upstream.URL,
	}
	processor := textprocessing.New(cfg)

	handleSpeak(cfg, settings.NewSpeechSettings(&appstate.ActiveSpeechConfig{
		Provider: config.SpeechProviderGemini,
		Voice:    config.DefaultGeminiVoice,
		Model:    config.DefaultModelName,
	}), processor)(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", rec.Code, rec.Body.String())
	}

	var resp speakResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Provider != config.SpeechProviderKokoroHeart {
		t.Fatalf("provider = %q, want %q", resp.Provider, config.SpeechProviderKokoroHeart)
	}
	if resp.Voice != config.DefaultKokoroHeartVoice {
		t.Fatalf("voice = %q, want %q", resp.Voice, config.DefaultKokoroHeartVoice)
	}
	if resp.Model != "" {
		t.Fatalf("model = %q, want empty", resp.Model)
	}
	if resp.Opus == "" {
		t.Fatal("opus = empty, want base64 payload")
	}
}

func testWAVBytes() []byte {
	samples := []int16{0, 1200, -1200, 400, -400, 0, 800, -800}
	pcm := make([]byte, 0, len(samples)*2)
	for _, sample := range samples {
		pcm = binary.LittleEndian.AppendUint16(pcm, uint16(sample))
	}

	const sampleRate = 24000
	byteRate := uint32(sampleRate * 2)
	blockAlign := uint16(2)
	dataLen := uint32(len(pcm))
	riffSize := uint32(36) + dataLen

	wav := make([]byte, 0, 44+len(pcm))
	wav = append(wav, 'R', 'I', 'F', 'F')
	wav = binary.LittleEndian.AppendUint32(wav, riffSize)
	wav = append(wav, 'W', 'A', 'V', 'E')
	wav = append(wav, 'f', 'm', 't', ' ')
	wav = binary.LittleEndian.AppendUint32(wav, 16)
	wav = binary.LittleEndian.AppendUint16(wav, 1)
	wav = binary.LittleEndian.AppendUint16(wav, 1)
	wav = binary.LittleEndian.AppendUint32(wav, sampleRate)
	wav = binary.LittleEndian.AppendUint32(wav, byteRate)
	wav = binary.LittleEndian.AppendUint16(wav, blockAlign)
	wav = binary.LittleEndian.AppendUint16(wav, 16)
	wav = append(wav, 'd', 'a', 't', 'a')
	wav = binary.LittleEndian.AppendUint32(wav, dataLen)
	wav = append(wav, pcm...)
	return wav
}
