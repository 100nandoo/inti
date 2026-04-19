package gemini

import (
	"context"
	"fmt"
	"strings"

	"google.golang.org/genai"
)

type Client struct {
	inner *genai.Client
}

func New(apiKey string) (*Client, error) {
	c, err := genai.NewClient(context.Background(), &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, fmt.Errorf("create genai client: %w", err)
	}
	return &Client{inner: c}, nil
}

// GenerateSpeech returns raw PCM bytes (16-bit LE mono 24kHz) for the given text.
func (c *Client) GenerateSpeech(ctx context.Context, text, voice, model string) ([]byte, error) {
	contents := []*genai.Content{
		{Parts: []*genai.Part{{Text: text}}},
	}

	cfg := &genai.GenerateContentConfig{
		ResponseModalities: []string{"AUDIO"},
		SpeechConfig: &genai.SpeechConfig{
			VoiceConfig: &genai.VoiceConfig{
				PrebuiltVoiceConfig: &genai.PrebuiltVoiceConfig{
					VoiceName: voice,
				},
			},
		},
	}

	resp, err := c.inner.Models.GenerateContent(ctx, model, contents, cfg)
	if err != nil {
		if IsRateLimit(err) {
			return nil, fmt.Errorf("rate limited: %w", err)
		}
		return nil, fmt.Errorf("generate content: %w", err)
	}

	if len(resp.Candidates) == 0 ||
		resp.Candidates[0].Content == nil ||
		len(resp.Candidates[0].Content.Parts) == 0 ||
		resp.Candidates[0].Content.Parts[0].InlineData == nil {
		return nil, fmt.Errorf("no audio data in response")
	}

	return resp.Candidates[0].Content.Parts[0].InlineData.Data, nil
}

// IsRateLimit reports whether err is a quota / rate-limit error from the API.
func IsRateLimit(err error) bool {
	if err == nil {
		return false
	}
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "429") ||
		strings.Contains(s, "resource_exhausted") ||
		strings.Contains(s, "quota") ||
		strings.Contains(s, "rate limit") ||
		strings.Contains(s, "ratelimit")
}
