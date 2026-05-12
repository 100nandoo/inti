package textprocessing

import "github.com/100nandoo/inti/internal/config"

type Processor struct {
	cfg *config.Config
}

func New(cfg *config.Config) *Processor {
	return &Processor{cfg: cfg}
}
