package textprocessing

import (
	"context"
	"errors"
	"fmt"
	"strings"

	intiocr "github.com/100nandoo/inti/internal/ocr"
)

type OCRRequest struct {
	ImageBytes []byte
}

type OCRResult struct {
	Text string
}

func (p *Processor) ExtractText(ctx context.Context, req OCRRequest) (OCRResult, error) {
	_ = ctx

	text, err := intiocr.ExtractText(req.ImageBytes)
	if err != nil {
		return OCRResult{}, err
	}
	if strings.TrimSpace(text) == "" {
		return OCRResult{}, fmt.Errorf("%w", ErrNoTextFound)
	}
	return OCRResult{Text: text}, nil
}

func IsNoTextFound(err error) bool {
	return errors.Is(err, ErrNoTextFound)
}
