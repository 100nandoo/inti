package telegrambot

import (
	"strings"
	"testing"
	"time"

	"github.com/100nandoo/inti/internal/appstate"
	tele "gopkg.in/telebot.v4"
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

func TestActionMarkupUsesCopyButtonFirstForShortOCR(t *testing.T) {
	menu := &tele.ReplyMarkup{}
	svc := &Service{
		btnSummary: menu.Data("Summarize", "inti_summarize"),
		btnSpeak:   menu.Data("Speak", "inti_speak"),
		btnBoth:    menu.Data("Summarize + Speak", "inti_both"),
		btnShowOCR: menu.Data("Show OCR Text", "inti_show_ocr"),
		btnClear:   menu.Data("Clear", "inti_clear"),
	}

	markup := svc.actionMarkup("short text", true)
	if got := len(markup.InlineKeyboard); got != 2 {
		t.Fatalf("expected 2 keyboard rows, got %d", got)
	}
	firstRow := markup.InlineKeyboard[0]
	if len(firstRow) != 3 {
		t.Fatalf("expected 3 buttons in first row, got %d", len(firstRow))
	}
	if firstRow[0].CopyText == nil {
		t.Fatal("expected first button to be copy_text")
	}
	if firstRow[0].Text != "Copy OCR" {
		t.Fatalf("copy button text = %q, want %q", firstRow[0].Text, "Copy OCR")
	}
}

func TestActionMarkupUsesShowOCRFallbackForLongOCR(t *testing.T) {
	menu := &tele.ReplyMarkup{}
	svc := &Service{
		btnSummary: menu.Data("Summarize", "inti_summarize"),
		btnSpeak:   menu.Data("Speak", "inti_speak"),
		btnBoth:    menu.Data("Summarize + Speak", "inti_both"),
		btnShowOCR: menu.Data("Show OCR Text", "inti_show_ocr"),
		btnClear:   menu.Data("Clear", "inti_clear"),
	}

	markup := svc.actionMarkup(strings.Repeat("a", telegramCopyTextLimit+1), true)
	firstRow := markup.InlineKeyboard[0]
	if firstRow[0].Text != "Show OCR Text" {
		t.Fatalf("first button text = %q, want %q", firstRow[0].Text, "Show OCR Text")
	}
	if firstRow[0].CopyText != nil {
		t.Fatal("expected fallback button instead of copy_text")
	}
}

func TestSplitTelegramMessage(t *testing.T) {
	text := "alpha\nbeta\ngamma\ndelta"
	chunks := splitTelegramMessage(text, 10)
	if len(chunks) < 2 {
		t.Fatalf("expected multiple chunks, got %d", len(chunks))
	}
	for _, chunk := range chunks {
		if len([]rune(chunk)) > 10 {
			t.Fatalf("chunk %q exceeded limit", chunk)
		}
	}
	if strings.Join(chunks, "\n") != text {
		t.Fatalf("rejoined chunks = %q, want %q", strings.Join(chunks, "\n"), text)
	}
}
