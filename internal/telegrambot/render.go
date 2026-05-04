package telegrambot

import (
	"regexp"
	"strings"
)

var (
	orderedListRe = regexp.MustCompile(`^(\d+)\.\s+(.+)$`)
	linkRe        = regexp.MustCompile(`\[(.+?)\]\((https?://[^\s)]+)\)`)
	boldRe        = regexp.MustCompile(`\*\*(.+?)\*\*`)
	italicRe      = regexp.MustCompile(`(?m)(^|[\s(>])\*(\S(?:.*?\S)?)\*`)
	inlineCodeRe  = regexp.MustCompile("`([^`]+)`")
)

func renderTelegramMarkdown(markdown string) string {
	markdown = strings.ReplaceAll(markdown, "\r\n", "\n")
	markdown = strings.ReplaceAll(markdown, "\r", "\n")

	lines := strings.Split(markdown, "\n")
	var out []string
	var paragraph []string
	var codeBlock []string
	inCodeBlock := false

	flushParagraph := func() {
		if len(paragraph) == 0 {
			return
		}
		out = append(out, renderInlineTelegramMarkdown(strings.Join(paragraph, " ")))
		paragraph = nil
	}
	flushCodeBlock := func() {
		if !inCodeBlock {
			return
		}
		out = append(out, "```\n"+escapeTelegramCode(strings.Join(codeBlock, "\n"))+"\n```")
		codeBlock = nil
		inCodeBlock = false
	}

	for _, rawLine := range lines {
		line := strings.TrimRight(rawLine, " \t")
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "```") {
			flushParagraph()
			if inCodeBlock {
				flushCodeBlock()
			} else {
				inCodeBlock = true
				codeBlock = nil
			}
			continue
		}

		if inCodeBlock {
			codeBlock = append(codeBlock, line)
			continue
		}

		if trimmed == "" {
			flushParagraph()
			out = append(out, "")
			continue
		}

		if strings.HasPrefix(trimmed, "#") {
			flushParagraph()
			heading := strings.TrimSpace(strings.TrimLeft(trimmed, "#"))
			out = append(out, "*"+escapeTelegramText(heading)+"*")
			continue
		}

		if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
			flushParagraph()
			item := strings.TrimSpace(trimmed[2:])
			out = append(out, "• "+renderInlineTelegramMarkdown(item))
			continue
		}

		if match := orderedListRe.FindStringSubmatch(trimmed); match != nil {
			flushParagraph()
			out = append(out, escapeTelegramText(match[1])+"\\. "+renderInlineTelegramMarkdown(match[2]))
			continue
		}

		paragraph = append(paragraph, trimmed)
	}

	flushParagraph()
	flushCodeBlock()
	return strings.Join(compactBlankLines(out), "\n")
}

func renderInlineTelegramMarkdown(text string) string {
	var out strings.Builder
	for len(text) > 0 {
		loc := nextInlineToken(text)
		if loc == nil {
			out.WriteString(escapeTelegramText(text))
			break
		}

		start, end, kind := loc[0], loc[1], loc[2]
		if start > 0 {
			out.WriteString(escapeTelegramText(text[:start]))
		}

		token := text[start:end]
		switch kind {
		case 0:
			parts := linkRe.FindStringSubmatch(token)
			out.WriteString("[")
			out.WriteString(escapeTelegramText(parts[1]))
			out.WriteString("](")
			out.WriteString(escapeTelegramURL(parts[2]))
			out.WriteString(")")
		case 1:
			parts := inlineCodeRe.FindStringSubmatch(token)
			out.WriteString("`")
			out.WriteString(escapeTelegramCode(parts[1]))
			out.WriteString("`")
		case 2:
			parts := boldRe.FindStringSubmatch(token)
			out.WriteString("*")
			out.WriteString(escapeTelegramText(parts[1]))
			out.WriteString("*")
		case 3:
			parts := italicRe.FindStringSubmatch(token)
			out.WriteString(parts[1])
			out.WriteString("_")
			out.WriteString(escapeTelegramText(parts[2]))
			out.WriteString("_")
		}

		text = text[end:]
	}
	return out.String()
}

// Returns start, end, token kind: 0 link, 1 code, 2 bold, 3 italic.
func nextInlineToken(text string) []int {
	candidates := [][]int{
		withKind(linkRe.FindStringIndex(text), 0),
		withKind(inlineCodeRe.FindStringIndex(text), 1),
		withKind(boldRe.FindStringIndex(text), 2),
		withKind(italicRe.FindStringIndex(text), 3),
	}
	var best []int
	for _, candidate := range candidates {
		if candidate == nil {
			continue
		}
		if best == nil || candidate[0] < best[0] {
			best = candidate
		}
	}
	return best
}

func withKind(loc []int, kind int) []int {
	if loc == nil {
		return nil
	}
	return []int{loc[0], loc[1], kind}
}

func compactBlankLines(lines []string) []string {
	var out []string
	prevBlank := false
	for _, line := range lines {
		blank := strings.TrimSpace(line) == ""
		if blank && prevBlank {
			continue
		}
		out = append(out, line)
		prevBlank = blank
	}
	return out
}

func escapeTelegramText(text string) string {
	replacer := strings.NewReplacer(
		`\\`, `\\\\`,
		"_", `\_`,
		"*", `\*`,
		"[", `\[`,
		"]", `\]`,
		"(", `\(`,
		")", `\)`,
		"~", `\~`,
		"`", "\\`",
		">", `\>`,
		"#", `\#`,
		"+", `\+`,
		"-", `\-`,
		"=", `\=`,
		"|", `\|`,
		"{", `\{`,
		"}", `\}`,
		".", `\.`,
		"!", `\!`,
	)
	return replacer.Replace(text)
}

func escapeTelegramCode(text string) string {
	return strings.NewReplacer(`\\`, `\\\\`, "`", "\\`").Replace(text)
}

func escapeTelegramURL(text string) string {
	return strings.NewReplacer(`\`, `\\`, ")", `\)`).Replace(text)
}
