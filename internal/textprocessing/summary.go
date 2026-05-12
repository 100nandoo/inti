package textprocessing

import (
	"context"
	"fmt"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/summarizer"
)

type SummaryRequest struct {
	Text        string
	Instruction string
	Provider    string
	Model       string
	APIKey      string
	Mock        bool
}

type SummaryResult struct {
	Summary    string
	Provider   string
	Model      string
	RateLimits *summarizer.RateLimits
}

func (p *Processor) Summarize(ctx context.Context, req SummaryRequest) (SummaryResult, error) {
	if req.Mock {
		return SummaryResult{
			Summary:  fmt.Sprintf("This is a mock summary of the provided text.\n\nOriginal text length: %d characters.\nInstruction: %q", len(req.Text), req.Instruction),
			Provider: "mock",
			Model:    "mock-model",
		}, nil
	}

	provider, apiKey, model := p.resolveSummaryRequest(req)
	sum, err := summarizer.NewFromRequest(provider, apiKey, requestModelForProvider(provider, model), p.cfg)
	if err != nil {
		if provider == "" || (apiKey == "" && provider != "mock") {
			return SummaryResult{}, fmt.Errorf("%w: %v", ErrSummarizerUnavailable, err)
		}
		return SummaryResult{}, fmt.Errorf("init summarizer: %w", err)
	}
	if sum == nil {
		return SummaryResult{}, fmt.Errorf("%w", ErrSummarizerUnavailable)
	}

	summary, err := sum.Summarize(ctx, req.Text, req.Instruction)
	if err != nil {
		if isUpstreamRateLimited(err) {
			return SummaryResult{}, fmt.Errorf("%w: %v", ErrRateLimited, err)
		}
		return SummaryResult{}, fmt.Errorf("summarize: %w", err)
	}

	resolvedModel := model
	if resolvedModel == "" {
		resolvedModel = defaultSummaryModel(provider, p.cfg)
	}
	if resolver, ok := sum.(summarizer.ModelResolver); ok && resolver.ResolvedModel() != "" {
		resolvedModel = resolver.ResolvedModel()
	}

	var rateLimits *summarizer.RateLimits
	if rl, ok := sum.(summarizer.RateLimiter); ok {
		rateLimits = rl.GetLastRateLimits()
	}

	return SummaryResult{
		Summary:    summary,
		Provider:   provider,
		Model:      resolvedModel,
		RateLimits: rateLimits,
	}, nil
}

func (p *Processor) resolveSummaryRequest(req SummaryRequest) (provider, apiKey, model string) {
	provider = req.Provider
	if provider == "" && p.cfg != nil {
		provider = p.cfg.SummarizerProvider
	}

	apiKey = req.APIKey
	if apiKey == "" && p.cfg != nil {
		switch provider {
		case "gemini":
			apiKey = p.cfg.GeminiAPIKey
		case "groq":
			apiKey = p.cfg.GroqAPIKey
		case "openrouter":
			apiKey = p.cfg.OpenRouterAPIKey
		}
	}

	return provider, apiKey, req.Model
}

func defaultSummaryModel(provider string, cfg *config.Config) string {
	switch provider {
	case "gemini":
		return "gemini-2.0-flash"
	case "groq":
		if cfg != nil {
			return cfg.GroqModel
		}
	case "openrouter":
		if cfg != nil {
			return cfg.OpenRouterModel
		}
	case "mock":
		return "mock-model"
	}
	return ""
}

func requestModelForProvider(provider, model string) string {
	if provider == "openrouter" {
		return ""
	}
	return model
}
