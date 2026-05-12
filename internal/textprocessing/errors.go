package textprocessing

import "errors"

var (
	ErrRateLimited           = errors.New("rate limited")
	ErrNoTextFound           = errors.New("no text found")
	ErrSummarizerUnavailable = errors.New("summarizer unavailable")
	ErrTTSUnavailable        = errors.New("tts unavailable")
)
