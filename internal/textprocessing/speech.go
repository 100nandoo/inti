package textprocessing

import (
	"context"
	"fmt"

	"github.com/100nandoo/inti/internal/audio"
	"github.com/100nandoo/inti/internal/gemini"
)

const sampleRate = 24000

type SpeechRequest struct {
	Text   string
	Voice  string
	Model  string
	APIKey string
}

type SpeechResult struct {
	Opus  []byte
	Voice string
	Model string
}

func (p *Processor) SynthesizeSpeech(ctx context.Context, req SpeechRequest) (SpeechResult, error) {
	apiKey := req.APIKey
	if apiKey == "" && p.cfg != nil {
		apiKey = p.cfg.GeminiAPIKey
	}
	if apiKey == "" {
		return SpeechResult{}, fmt.Errorf("%w: GEMINI_API_KEY not configured", ErrTTSUnavailable)
	}

	client, err := gemini.New(apiKey)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("init gemini: %w", err)
	}

	pcm, err := client.GenerateSpeech(ctx, req.Text, req.Voice, req.Model)
	if err != nil {
		if isUpstreamRateLimited(err) {
			return SpeechResult{}, fmt.Errorf("%w: %v", ErrRateLimited, err)
		}
		return SpeechResult{}, fmt.Errorf("generate speech: %w", err)
	}

	opusBytes, err := audio.EncodePCMToOpus(pcm, sampleRate)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("encode opus: %w", err)
	}

	return SpeechResult{
		Opus:  opusBytes,
		Voice: req.Voice,
		Model: req.Model,
	}, nil
}
