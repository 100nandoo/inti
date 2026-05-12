package textprocessing

import (
	"errors"
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

	_, err := p.SynthesizeSpeech(t.Context(), SpeechRequest{Text: "hello", Voice: "Kore", Model: "gemini-3.1-flash-tts-preview"})
	if !errors.Is(err, ErrTTSUnavailable) {
		t.Fatalf("SynthesizeSpeech() error = %v, want ErrTTSUnavailable", err)
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
