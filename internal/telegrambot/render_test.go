package telegrambot

import (
	"strings"
	"testing"
)

func TestRenderTelegramMarkdown(t *testing.T) {
	input := "# Title\n\n- first item\n- **bold** and *italic*\n\nParagraph with `code` and [link](https://example.com).\n\n```go\nfmt.Println(\"hi\")\n```"
	got := renderTelegramMarkdown(input)

	wantParts := []string{
		`*Title*`,
		`• first item`,
		`• *bold* and _italic_`,
		"Paragraph with `code` and [link](https://example.com)\\.",
		"```\nfmt.Println(\"hi\")\n```",
	}
	for _, want := range wantParts {
		if !strings.Contains(got, want) {
			t.Fatalf("renderTelegramMarkdown() missing %q in output:\n%s", want, got)
		}
	}
}
