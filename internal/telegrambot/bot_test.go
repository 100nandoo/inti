package telegrambot

import (
	"strings"
	"testing"
	"time"

	"github.com/100nandoo/inti/internal/appstate"
)

func TestSupportedImageDocument(t *testing.T) {
	tests := []struct {
		name     string
		mimeType string
		fileName string
		want     bool
	}{
		{name: "mime image", mimeType: "image/png", fileName: "scan.bin", want: true},
		{name: "extension image", mimeType: "application/octet-stream", fileName: "scan.jpg", want: true},
		{name: "pdf", mimeType: "application/pdf", fileName: "scan.pdf", want: false},
		{name: "svg", mimeType: "image/svg+xml", fileName: "vector.svg", want: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isSupportedImageDocument(tt.mimeType, tt.fileName); got != tt.want {
				t.Fatalf("isSupportedImageDocument(%q, %q) = %t, want %t", tt.mimeType, tt.fileName, got, tt.want)
			}
		})
	}
}

func TestWorkingTextStoreSetGetAndPrune(t *testing.T) {
	store := newWorkingTextStore()
	store.Set(10, "hello")
	if got, ok := store.Get(10); !ok || got != "hello" {
		t.Fatalf("Get() = %q, %t, want hello, true", got, ok)
	}

	store.mu.Lock()
	store.items[11] = workingTextEntry{Text: "old", UpdatedAt: time.Now().UTC().Add(-workingTextTTL - time.Minute)}
	store.mu.Unlock()
	if _, ok := store.Get(11); ok {
		t.Fatal("expected expired entry to be pruned")
	}
}

func TestPreviewMessageTruncates(t *testing.T) {
	msg := previewMessage("Stored text", strings.Repeat("a", 600))
	if len(msg) <= len("Stored text:\n\n") {
		t.Fatalf("previewMessage() returned empty preview: %q", msg)
	}
}

func TestRequireSessionInvalidatesDeletedKey(t *testing.T) {
	store := &appstate.APIKeyStore{}
	sessions := &appstate.TelegramSessionStore{}
	_ = sessions.Save(appstate.TelegramSession{
		ChatID:       100,
		UserID:       5,
		APIKeyID:     "missing",
		Voice:        "Kore",
		Model:        "gemini-3.1-flash-tts-preview",
		AuthorizedAt: time.Now().UTC(),
	})
	if _, ok := sessions.Authorized(100, store); ok {
		t.Fatal("Authorized() = true with missing key id")
	}
}
