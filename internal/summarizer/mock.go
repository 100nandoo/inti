package summarizer

import (
	"context"
	"fmt"
	"time"
)

// MockClient is a summarizer that returns a fake response.
type MockClient struct{}

func (m *MockClient) Summarize(ctx context.Context, text, instruction string) (string, error) {
	// Simulate some latency
	select {
	case <-time.After(500 * time.Millisecond):
	case <-ctx.Done():
		return "", ctx.Err()
	}

	return fmt.Sprintf("This is a mock summary of the provided text.\n\nOriginal text length: %d characters.\nInstruction: %q", len(text), instruction), nil
}
