package textprocessing

import (
	"context"
	"fmt"
	"strings"

	"github.com/100nandoo/inti/internal/audio"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/kokoroheart"
)

const defaultSpeechSampleRate = 24000

type speechResolver struct {
	provider string
	text     string
	voice    string
	model    string
	apiKey   string
}

type SpeechRequest struct {
	Provider string
	Text     string
	Voice    string
	Model    string
	APIKey   string
}

type SpeechResult struct {
	Provider string
	Opus     []byte
	Voice    string
	Model    string
}

func (p *Processor) SynthesizeSpeech(ctx context.Context, req SpeechRequest) (SpeechResult, error) {
	resolved, err := p.resolveSpeechRequest(req)
	if err != nil {
		return SpeechResult{}, err
	}

	switch resolved.provider {
	case config.SpeechProviderGemini:
		return p.synthesizeGeminiSpeech(ctx, resolved)
	case config.SpeechProviderKokoroHeart:
		return p.synthesizeKokoroHeartSpeech(ctx, resolved)
	default:
		return SpeechResult{}, fmt.Errorf("%w: unknown speech provider %q", ErrTTSUnavailable, resolved.provider)
	}
}

func (p *Processor) resolveSpeechRequest(req SpeechRequest) (speechResolver, error) {
	provider := strings.TrimSpace(req.Provider)
	if provider == "" && p.cfg != nil {
		provider = p.cfg.SpeechProvider
	}
	if provider == "" {
		provider = config.SpeechProviderGemini
	}
	if !config.IsValidSpeechProvider(provider) {
		return speechResolver{}, fmt.Errorf("invalid speech provider %q", provider)
	}

	voice := strings.TrimSpace(req.Voice)
	if voice == "" {
		if p.cfg != nil && p.cfg.DefaultVoice != "" && config.IsValidVoiceForProvider(provider, p.cfg.DefaultVoice) {
			voice = p.cfg.DefaultVoice
		} else {
			voice = config.DefaultVoiceForProvider(provider)
		}
	}
	if !config.IsValidVoiceForProvider(provider, voice) {
		return speechResolver{}, fmt.Errorf("invalid voice %q for provider %q", voice, provider)
	}

	model := strings.TrimSpace(req.Model)
	if model == "" {
		if provider == config.SpeechProviderGemini {
			if p.cfg != nil && p.cfg.DefaultModel != "" && config.IsValidModelForProvider(provider, p.cfg.DefaultModel) {
				model = p.cfg.DefaultModel
			} else {
				model = config.DefaultModelForProvider(provider)
			}
		}
	}
	if !config.IsValidModelForProvider(provider, model) {
		return speechResolver{}, fmt.Errorf("invalid model %q for provider %q", model, provider)
	}

	apiKey := strings.TrimSpace(req.APIKey)
	if apiKey == "" && provider == config.SpeechProviderGemini && p.cfg != nil {
		apiKey = p.cfg.GeminiAPIKey
	}

	return speechResolver{
		provider: provider,
		text:     req.Text,
		voice:    voice,
		model:    model,
		apiKey:   apiKey,
	}, nil
}

func (p *Processor) synthesizeGeminiSpeech(ctx context.Context, req speechResolver) (SpeechResult, error) {
	if req.apiKey == "" {
		return SpeechResult{}, fmt.Errorf("%w: GEMINI_API_KEY not configured", ErrTTSUnavailable)
	}

	client, err := gemini.New(req.apiKey)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("init gemini: %w", err)
	}

	pcm, err := client.GenerateSpeech(ctx, req.text, req.voice, req.model)
	if err != nil {
		if isUpstreamRateLimited(err) {
			return SpeechResult{}, fmt.Errorf("%w: %v", ErrRateLimited, err)
		}
		return SpeechResult{}, fmt.Errorf("generate speech: %w", err)
	}

	opusBytes, err := audio.EncodePCMToOpus(pcm, defaultSpeechSampleRate)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("encode opus: %w", err)
	}

	return SpeechResult{
		Provider: config.SpeechProviderGemini,
		Opus:     opusBytes,
		Voice:    req.voice,
		Model:    req.model,
	}, nil
}

func (p *Processor) synthesizeKokoroHeartSpeech(ctx context.Context, req speechResolver) (SpeechResult, error) {
	if p.cfg == nil || strings.TrimSpace(p.cfg.KokoroHeartURL) == "" {
		return SpeechResult{}, fmt.Errorf("%w: KOKORO_HEART_URL not configured", ErrTTSUnavailable)
	}

	client := kokoroheart.New(p.cfg.KokoroHeartURL, p.httpClient)
	wavBytes, err := client.GenerateSpeechWAV(ctx, req.text, req.voice)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("generate speech: %w", err)
	}

	pcm, sampleRate, err := audio.DecodeWAVPCM(wavBytes)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("decode wav: %w", err)
	}

	opusBytes, err := audio.EncodePCMToOpus(pcm, sampleRate)
	if err != nil {
		return SpeechResult{}, fmt.Errorf("encode opus: %w", err)
	}

	return SpeechResult{
		Provider: config.SpeechProviderKokoroHeart,
		Opus:     opusBytes,
		Voice:    req.voice,
		Model:    "",
	}, nil
}
