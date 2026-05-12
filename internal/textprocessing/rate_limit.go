package textprocessing

import (
	"errors"
	"strings"

	"github.com/100nandoo/inti/internal/gemini"
)

func IsRateLimited(err error) bool {
	return errors.Is(err, ErrRateLimited)
}

func isUpstreamRateLimited(err error) bool {
	if gemini.IsRateLimit(err) {
		return true
	}
	if err == nil {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "rate limited")
}
