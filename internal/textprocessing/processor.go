package textprocessing

import (
	"context"
	"net/http"

	"github.com/100nandoo/inti/internal/config"
)

type Processor struct {
	cfg        *config.Config
	httpClient *http.Client

	synthesizeGeminiFn      func(context.Context, speechResolver) (SpeechResult, error)
	synthesizeKokoroHeartFn func(context.Context, speechResolver) (SpeechResult, error)
}

func New(cfg *config.Config) *Processor {
	return &Processor{
		cfg:        cfg,
		httpClient: http.DefaultClient,
	}
}
