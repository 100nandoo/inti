package textprocessing

import (
	"context"
	"encoding/binary"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/100nandoo/inti/internal/config"
)

func TestSummarizeReturnsUnavailableWhenNoProviderConfigured(t *testing.T) {
	p := New(&config.Config{})

	_, err := p.Summarize(t.Context(), SummaryRequest{Text: "hello"})
	if !errors.Is(err, ErrSummarizerUnavailable) {
		t.Fatalf("Summarize() error = %v, want ErrSummarizerUnavailable", err)
	}
}

func TestSummarizeMockReturnsMetadata(t *testing.T) {
	p := New(&config.Config{})

	result, err := p.Summarize(t.Context(), SummaryRequest{Text: "hello", Instruction: "brief", Mock: true})
	if err != nil {
		t.Fatalf("Summarize() error = %v", err)
	}
	if result.Provider != "mock" || result.Model != "mock-model" {
		t.Fatalf("Summarize() provider/model = %q/%q", result.Provider, result.Model)
	}
	if result.Summary == "" {
		t.Fatal("Summarize() returned empty summary")
	}
}

func TestSynthesizeSpeechReturnsUnavailableWhenNoAPIKeyConfigured(t *testing.T) {
	p := New(&config.Config{})

	_, err := p.SynthesizeSpeech(t.Context(), SpeechRequest{
		Text:     "hello",
		Provider: config.SpeechProviderGemini,
		Voice:    "Kore",
		Model:    "gemini-3.1-flash-tts-preview",
	})
	if !errors.Is(err, ErrTTSUnavailable) {
		t.Fatalf("SynthesizeSpeech() error = %v, want ErrTTSUnavailable", err)
	}
}

func TestResolveSpeechRequestUsesProviderSpecificDefaults(t *testing.T) {
	p := New(&config.Config{
		SpeechProvider: config.SpeechProviderKokoroHeart,
		DefaultVoice:   config.DefaultKokoroHeartVoice,
		DefaultModel:   config.DefaultModelName,
	})

	resolved, err := p.resolveSpeechRequest(SpeechRequest{Text: "hello"})
	if err != nil {
		t.Fatalf("resolveSpeechRequest() error = %v", err)
	}
	if resolved.provider != config.SpeechProviderKokoroHeart {
		t.Fatalf("provider = %q, want %q", resolved.provider, config.SpeechProviderKokoroHeart)
	}
	if resolved.voice != config.DefaultKokoroHeartVoice {
		t.Fatalf("voice = %q, want %q", resolved.voice, config.DefaultKokoroHeartVoice)
	}
	if resolved.model != "" {
		t.Fatalf("model = %q, want empty", resolved.model)
	}
}

func TestResolveSpeechRequestRejectsProviderSpecificModel(t *testing.T) {
	p := New(&config.Config{SpeechProvider: config.SpeechProviderKokoroHeart})

	_, err := p.resolveSpeechRequest(SpeechRequest{
		Text:     "hello",
		Provider: config.SpeechProviderKokoroHeart,
		Voice:    config.DefaultKokoroHeartVoice,
		Model:    config.DefaultModelName,
	})
	if err == nil || !strings.Contains(err.Error(), "invalid model") {
		t.Fatalf("resolveSpeechRequest() error = %v, want invalid model", err)
	}
}

func TestSynthesizeSpeechKokoroHeartNormalizesWAVToOpus(t *testing.T) {
	var requestBody string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("method = %s, want POST", r.Method)
		}
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read body: %v", err)
		}
		requestBody = string(body)
		w.Header().Set("Content-Type", "audio/wav")
		_, _ = w.Write(testWAVBytes())
	}))
	defer server.Close()

	p := New(&config.Config{
		SpeechProvider: config.SpeechProviderKokoroHeart,
		KokoroHeartURL: server.URL,
		DefaultVoice:   config.DefaultKokoroHeartVoice,
	})
	p.httpClient = server.Client()

	result, err := p.SynthesizeSpeech(t.Context(), SpeechRequest{
		Text:     "hello from kokoro",
		Provider: config.SpeechProviderKokoroHeart,
		Voice:    config.DefaultKokoroHeartVoice,
	})
	if err != nil {
		t.Fatalf("SynthesizeSpeech() error = %v", err)
	}
	if result.Provider != config.SpeechProviderKokoroHeart {
		t.Fatalf("provider = %q, want %q", result.Provider, config.SpeechProviderKokoroHeart)
	}
	if result.Voice != config.DefaultKokoroHeartVoice {
		t.Fatalf("voice = %q, want %q", result.Voice, config.DefaultKokoroHeartVoice)
	}
	if result.Model != "" {
		t.Fatalf("model = %q, want empty", result.Model)
	}
	if len(result.Opus) == 0 {
		t.Fatal("expected non-empty opus payload")
	}
	if !strings.Contains(requestBody, `"voice":"cheery"`) || !strings.Contains(requestBody, `"response_format":"wav"`) {
		t.Fatalf("unexpected request body: %s", requestBody)
	}
}

func TestSynthesizeSpeechWithKokoroFallbackOnGeminiRateLimit(t *testing.T) {
	p := New(&config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
		KokoroHeartURL: "http://example.test",
	})
	p.synthesizeGeminiFn = func(context.Context, speechResolver) (SpeechResult, error) {
		return SpeechResult{}, ErrRateLimited
	}
	p.synthesizeKokoroHeartFn = func(_ context.Context, req speechResolver) (SpeechResult, error) {
		if req.provider != config.SpeechProviderKokoroHeart {
			t.Fatalf("provider = %q, want %q", req.provider, config.SpeechProviderKokoroHeart)
		}
		if req.voice != config.DefaultKokoroHeartVoice {
			t.Fatalf("voice = %q, want %q", req.voice, config.DefaultKokoroHeartVoice)
		}
		if req.model != "" {
			t.Fatalf("model = %q, want empty", req.model)
		}
		return SpeechResult{Provider: req.provider, Voice: req.voice}, nil
	}

	result, err := p.SynthesizeSpeechWithKokoroFallback(t.Context(), SpeechRequest{
		Provider: config.SpeechProviderGemini,
		Text:     "hello",
		Voice:    config.DefaultGeminiVoice,
		Model:    config.DefaultModelName,
		APIKey:   "test-key",
	})
	if err != nil {
		t.Fatalf("SynthesizeSpeechWithKokoroFallback() error = %v", err)
	}
	if result.Provider != config.SpeechProviderKokoroHeart {
		t.Fatalf("provider = %q, want %q", result.Provider, config.SpeechProviderKokoroHeart)
	}
	if result.Voice != config.DefaultKokoroHeartVoice {
		t.Fatalf("voice = %q, want %q", result.Voice, config.DefaultKokoroHeartVoice)
	}
}

func TestSynthesizeSpeechWithKokoroFallbackPreservesBothErrors(t *testing.T) {
	p := New(&config.Config{
		SpeechProvider: config.SpeechProviderGemini,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
		KokoroHeartURL: "http://example.test",
	})
	p.synthesizeGeminiFn = func(context.Context, speechResolver) (SpeechResult, error) {
		return SpeechResult{}, ErrRateLimited
	}
	p.synthesizeKokoroHeartFn = func(context.Context, speechResolver) (SpeechResult, error) {
		return SpeechResult{}, errors.New("kokoro unavailable")
	}

	_, err := p.SynthesizeSpeechWithKokoroFallback(t.Context(), SpeechRequest{
		Provider: config.SpeechProviderGemini,
		Text:     "hello",
		Voice:    config.DefaultGeminiVoice,
		Model:    config.DefaultModelName,
		APIKey:   "test-key",
	})
	if err == nil {
		t.Fatal("expected fallback error")
	}
	if !strings.Contains(err.Error(), "gemini rate limited") || !strings.Contains(err.Error(), "kokoro unavailable") {
		t.Fatalf("error = %v, want both gemini and kokoro context", err)
	}
}

func TestResolveSummaryRequestUsesConfigDefaults(t *testing.T) {
	p := New(&config.Config{
		SummarizerProvider: "groq",
		GroqAPIKey:         "groq-key",
	})

	provider, apiKey, model := p.resolveSummaryRequest(SummaryRequest{})
	if provider != "groq" || apiKey != "groq-key" || model != "" {
		t.Fatalf("resolveSummaryRequest() = %q/%q/%q", provider, apiKey, model)
	}
}

func testWAVBytes() []byte {
	samples := []int16{0, 1200, -1200, 400, -400, 0, 800, -800}
	pcm := make([]byte, 0, len(samples)*2)
	for _, sample := range samples {
		pcm = binary.LittleEndian.AppendUint16(pcm, uint16(sample))
	}

	byteRate := uint32(defaultSpeechSampleRate * 2)
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
	wav = binary.LittleEndian.AppendUint32(wav, defaultSpeechSampleRate)
	wav = binary.LittleEndian.AppendUint32(wav, byteRate)
	wav = binary.LittleEndian.AppendUint16(wav, blockAlign)
	wav = binary.LittleEndian.AppendUint16(wav, 16)
	wav = append(wav, 'd', 'a', 't', 'a')
	wav = binary.LittleEndian.AppendUint32(wav, dataLen)
	wav = append(wav, pcm...)
	return wav
}
