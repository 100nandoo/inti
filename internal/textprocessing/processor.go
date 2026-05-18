package textprocessing

import (
	"net/http"

	"github.com/100nandoo/inti/internal/config"
)

type Processor struct {
	cfg        *config.Config
	httpClient *http.Client
}

func New(cfg *config.Config) *Processor {
	return &Processor{
		cfg:        cfg,
		httpClient: http.DefaultClient,
	}
}
