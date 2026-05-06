package telegrambot

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/audio"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/gemini"
	"github.com/100nandoo/inti/internal/ocr"
	"github.com/100nandoo/inti/internal/summarizer"
	tele "gopkg.in/telebot.v4"
)

const workingTextTTL = 24 * time.Hour
const pollTimeout = 10 * time.Second
const telegramCopyTextLimit = 256
const telegramMessageChunkLimit = 4000

type Service struct {
	bot        *tele.Bot
	cfg        *config.Config
	state      *appstate.RuntimeState
	working    *workingTextStore
	btnSummary tele.Btn
	btnSpeak   tele.Btn
	btnBoth    tele.Btn
	btnShowOCR tele.Btn
	btnClear   tele.Btn
}

type workingTextStore struct {
	mu    sync.Mutex
	items map[int64]workingTextEntry
}

type workingTextEntry struct {
	Text      string
	UpdatedAt time.Time
}

func Enabled(cfg *config.Config) bool {
	return cfg != nil && cfg.TelegramBotToken != ""
}

func New(cfg *config.Config, state *appstate.RuntimeState) (*Service, error) {
	if cfg == nil {
		return nil, fmt.Errorf("telegram bot config is required")
	}
	if cfg.TelegramBotToken == "" {
		return nil, fmt.Errorf("TELEGRAM_BOT_TOKEN is required")
	}
	if state == nil {
		state = appstate.LoadRuntimeState(cfg)
	}

	bot, err := tele.NewBot(tele.Settings{
		Token:  cfg.TelegramBotToken,
		Poller: &tele.LongPoller{Timeout: pollTimeout},
	})
	if err != nil {
		return nil, fmt.Errorf("init telegram bot: %w", err)
	}

	menu := &tele.ReplyMarkup{}
	btnSummary := menu.Data("Summarize", "inti_summarize")
	btnSpeak := menu.Data("Speak", "inti_speak")
	btnBoth := menu.Data("Summarize + Speak", "inti_both")
	btnShowOCR := menu.Data("Show OCR Text", "inti_show_ocr")
	btnClear := menu.Data("Clear", "inti_clear")
	menu.Inline(menu.Row(btnSummary, btnSpeak), menu.Row(btnBoth, btnClear))

	s := &Service{
		bot:        bot,
		cfg:        cfg,
		state:      state,
		working:    newWorkingTextStore(),
		btnSummary: btnSummary,
		btnSpeak:   btnSpeak,
		btnBoth:    btnBoth,
		btnShowOCR: btnShowOCR,
		btnClear:   btnClear,
	}
	s.registerHandlers()
	return s, nil
}

func (s *Service) Run(ctx context.Context) error {
	done := make(chan struct{})
	go func() {
		select {
		case <-ctx.Done():
			s.bot.Stop()
		case <-done:
		}
	}()
	s.bot.Start()
	close(done)
	if err := ctx.Err(); err != nil && err != context.Canceled {
		return err
	}
	return nil
}

func (s *Service) Stop() {
	if s != nil && s.bot != nil {
		s.bot.Stop()
	}
}

func (s *Service) registerHandlers() {
	s.bot.Handle("/start", s.handleStart)
	s.bot.Handle("/help", s.handleHelp)
	s.bot.Handle("/auth", s.handleAuth)
	s.bot.Handle("/logout", s.handleLogout)
	s.bot.Handle("/voice", s.handleVoice)
	s.bot.Handle("/model", s.handleModel)
	s.bot.Handle("/status", s.handleStatus)
	s.bot.Handle(tele.OnText, s.handleText)
	s.bot.Handle(tele.OnPhoto, s.handlePhoto)
	s.bot.Handle(tele.OnDocument, s.handleDocument)
	s.bot.Handle(&s.btnSummary, s.handleSummarizeAction)
	s.bot.Handle(&s.btnSpeak, s.handleSpeakAction)
	s.bot.Handle(&s.btnBoth, s.handleBothAction)
	s.bot.Handle(&s.btnShowOCR, s.handleShowOCRAction)
	s.bot.Handle(&s.btnClear, s.handleClearAction)
}

func (s *Service) handleStart(c tele.Context) error {
	return c.Send("Inti bot is ready.\n\nUse /auth <inti_api_key> first, then send text or an image to summarize or synthesize it.")
}

func (s *Service) handleHelp(c tele.Context) error {
	return c.Send("Commands:\n/auth <inti_api_key>\n/logout\n/voice <name>\n/model <name>\n/status\n\nAfter auth, send text or an image. The bot will keep the latest working text and show action buttons.")
}

func (s *Service) handleAuth(c tele.Context) error {
	args := c.Args()
	if len(args) != 1 {
		return c.Send("Usage: /auth <inti_api_key>")
	}
	keyID, ok := s.state.APIKeys.Validate(strings.TrimSpace(args[0]))
	if !ok {
		return c.Send("Invalid Inti API key.")
	}
	session, _ := s.state.TelegramSessions.Get(c.Chat().ID)
	session.ChatID = c.Chat().ID
	if sender := c.Sender(); sender != nil {
		session.UserID = sender.ID
	}
	session.APIKeyID = keyID
	if session.Voice == "" {
		session.Voice = s.cfg.DefaultVoice
	}
	if session.Model == "" {
		session.Model = s.cfg.DefaultModel
	}
	if err := s.state.TelegramSessions.Save(session); err != nil {
		return fmt.Errorf("save telegram session: %w", err)
	}
	go s.state.APIKeys.TouchLastUsed(keyID)
	return c.Send("Authenticated. Send text or an image to continue.")
}

func (s *Service) handleLogout(c tele.Context) error {
	_ = s.state.TelegramSessions.Delete(c.Chat().ID)
	s.working.Delete(c.Chat().ID)
	return c.Send("Logged out.")
}

func (s *Service) handleVoice(c tele.Context) error {
	session, ok, err := s.requireSession(c)
	if err != nil || !ok {
		return err
	}
	args := c.Args()
	if len(args) != 1 {
		return c.Send("Usage: /voice <name>")
	}
	voice := strings.TrimSpace(args[0])
	if !config.IsValidVoice(voice) {
		return c.Send(fmt.Sprintf("Invalid voice %q.", voice))
	}
	session.Voice = voice
	if err := s.state.TelegramSessions.Save(session); err != nil {
		return fmt.Errorf("save telegram session: %w", err)
	}
	return c.Send("Voice updated to " + voice + ".")
}

func (s *Service) handleModel(c tele.Context) error {
	session, ok, err := s.requireSession(c)
	if err != nil || !ok {
		return err
	}
	args := c.Args()
	if len(args) != 1 {
		return c.Send("Usage: /model <name>")
	}
	model := strings.TrimSpace(args[0])
	if !config.IsValidModel(model) {
		return c.Send(fmt.Sprintf("Invalid model %q.", model))
	}
	session.Model = model
	if err := s.state.TelegramSessions.Save(session); err != nil {
		return fmt.Errorf("save telegram session: %w", err)
	}
	return c.Send("Model updated to " + model + ".")
}

func (s *Service) handleStatus(c tele.Context) error {
	session, ok := s.state.TelegramSessions.Authorized(c.Chat().ID, s.state.APIKeys)
	if !ok {
		return c.Send("Not authenticated. Use /auth <inti_api_key>.")
	}
	_, hasText := s.working.Get(c.Chat().ID)
	return c.Send(fmt.Sprintf("Authenticated.\nVoice: %s\nModel: %s\nWorking text loaded: %t", session.Voice, session.Model, hasText))
}

func (s *Service) handleText(c tele.Context) error {
	if c.Message() != nil && c.Message().Private() && strings.HasPrefix(c.Text(), "/") {
		return nil
	}
	_, ok, err := s.requireSession(c)
	if err != nil || !ok {
		return err
	}
	text := strings.TrimSpace(c.Text())
	if text == "" {
		return c.Send("Text is empty.")
	}
	s.working.Set(c.Chat().ID, text)
	return c.Send(previewMessage("Stored text", text), s.actionMarkup("", false))
}

func (s *Service) handlePhoto(c tele.Context) error {
	_, ok, err := s.requireSession(c)
	if err != nil || !ok {
		return err
	}
	if c.Message() == nil || c.Message().Photo == nil {
		return c.Send("No photo received.")
	}
	reader, err := s.bot.File(&c.Message().Photo.File)
	if err != nil {
		return fmt.Errorf("download photo: %w", err)
	}
	defer reader.Close()
	imageBytes, err := io.ReadAll(reader)
	if err != nil {
		return fmt.Errorf("read photo: %w", err)
	}
	text, err := ocr.ExtractText(imageBytes)
	if err != nil {
		return fmt.Errorf("ocr photo: %w", err)
	}
	if strings.TrimSpace(text) == "" {
		return c.Send("No text found in the image.")
	}
	s.working.Set(c.Chat().ID, text)
	return c.Send(previewMessage("OCR complete", text), s.actionMarkup(text, true))
}

func (s *Service) handleDocument(c tele.Context) error {
	_, ok, err := s.requireSession(c)
	if err != nil || !ok {
		return err
	}
	if c.Message() == nil || c.Message().Document == nil {
		return c.Send("No document received.")
	}
	doc := c.Message().Document
	if !isSupportedImageDocument(doc.MIME, doc.FileName) {
		return c.Send("Only image documents are supported for OCR.")
	}
	reader, err := s.bot.File(&doc.File)
	if err != nil {
		return fmt.Errorf("download document: %w", err)
	}
	defer reader.Close()
	imageBytes, err := io.ReadAll(reader)
	if err != nil {
		return fmt.Errorf("read document: %w", err)
	}
	text, err := ocr.ExtractText(imageBytes)
	if err != nil {
		return fmt.Errorf("ocr document: %w", err)
	}
	if strings.TrimSpace(text) == "" {
		return c.Send("No text found in the image.")
	}
	s.working.Set(c.Chat().ID, text)
	return c.Send(previewMessage("OCR complete", text), s.actionMarkup(text, true))
}

func (s *Service) handleSummarizeAction(c tele.Context) error {
	c.Respond()
	return s.processSummary(c, false)
}

func (s *Service) handleSpeakAction(c tele.Context) error {
	c.Respond()
	text, ok := s.working.Get(c.Chat().ID)
	if !ok {
		return c.Send("No working text loaded. Send text or an image first.")
	}
	return s.sendSpeech(c, text)
}

func (s *Service) handleBothAction(c tele.Context) error {
	c.Respond()
	return s.processSummary(c, true)
}

func (s *Service) handleShowOCRAction(c tele.Context) error {
	c.Respond()
	text, ok := s.working.Get(c.Chat().ID)
	if !ok {
		return c.Send("No working text loaded. Send text or an image first.")
	}
	return s.sendTextChunks(c.Chat(), text)
}

func (s *Service) handleClearAction(c tele.Context) error {
	c.Respond()
	s.working.Delete(c.Chat().ID)
	return c.Edit("Working text cleared.")
}

func (s *Service) processSummary(c tele.Context, speak bool) error {
	text, ok := s.working.Get(c.Chat().ID)
	if !ok {
		return c.Send("No working text loaded. Send text or an image first.")
	}
	summary, err := s.summarize(c, text)
	if err != nil {
		return err
	}
	s.working.Set(c.Chat().ID, summary)
	if err := c.Send(renderTelegramMarkdown(summary), tele.ModeMarkdownV2, s.actionMarkup("", false)); err != nil {
		return err
	}
	if speak {
		return s.sendSpeech(c, summary)
	}
	return nil
}

func (s *Service) summarize(c tele.Context, text string) (string, error) {
	provider, model, keys, _ := s.state.ActiveSummarizer.Get()
	var sum summarizer.Summarizer
	var err error
	if provider != "" || keys[provider] != "" || model != "" {
		sum, err = summarizer.NewFromRequest(provider, keys[provider], model, s.cfg)
	} else {
		sum, err = summarizer.New(s.cfg)
	}
	if err != nil {
		return "", fmt.Errorf("init summarizer: %w", err)
	}
	if sum == nil {
		return "", fmt.Errorf("no summarizer configured")
	}
	summary, err := sum.Summarize(context.Background(), text, "")
	if err != nil {
		return "", fmt.Errorf("summarize: %w", err)
	}
	return summary, nil
}

func (s *Service) sendSpeech(c tele.Context, text string) error {
	session, ok := s.state.TelegramSessions.Authorized(c.Chat().ID, s.state.APIKeys)
	if !ok {
		return c.Send("Not authenticated. Use /auth <inti_api_key>.")
	}
	if s.cfg.GeminiAPIKey == "" {
		return c.Send("TTS unavailable: GEMINI_API_KEY is not configured.")
	}
	client, err := gemini.New(s.cfg.GeminiAPIKey)
	if err != nil {
		return fmt.Errorf("init gemini: %w", err)
	}
	pcm, err := client.GenerateSpeech(context.Background(), text, session.Voice, session.Model)
	if err != nil {
		return fmt.Errorf("generate speech: %w", err)
	}
	opusBytes, err := audio.EncodePCMToOpus(pcm, 24000)
	if err != nil {
		return fmt.Errorf("encode opus: %w", err)
	}
	voice := &tele.Voice{File: tele.FromReader(bytes.NewReader(opusBytes))}
	audioFile := &tele.Audio{File: tele.FromReader(bytes.NewReader(opusBytes))}
	if _, err := s.bot.Send(c.Chat(), voice); err != nil {
		return fmt.Errorf("send voice note: %w", err)
	}
	if _, err := s.bot.Send(c.Chat(), audioFile); err != nil {
		return fmt.Errorf("send audio file: %w", err)
	}
	return nil
}

func (s *Service) sendTextChunks(chat *tele.Chat, text string) error {
	for _, chunk := range splitTelegramMessage(text, telegramMessageChunkLimit) {
		if _, err := s.bot.Send(chat, chunk); err != nil {
			return fmt.Errorf("send text chunk: %w", err)
		}
	}
	return nil
}

func (s *Service) requireSession(c tele.Context) (appstate.TelegramSession, bool, error) {
	session, ok := s.state.TelegramSessions.Authorized(c.Chat().ID, s.state.APIKeys)
	if ok {
		return session, true, nil
	}
	if s.state.TelegramSessions.HasID(c.Chat().ID) {
		_ = s.state.TelegramSessions.Delete(c.Chat().ID)
	}
	return appstate.TelegramSession{}, false, c.Send("Authenticate first with /auth <inti_api_key>.")
}

func newWorkingTextStore() *workingTextStore {
	return &workingTextStore{items: make(map[int64]workingTextEntry)}
}

func (s *workingTextStore) Set(chatID int64, text string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked()
	s.items[chatID] = workingTextEntry{Text: text, UpdatedAt: time.Now().UTC()}
}

func (s *workingTextStore) Get(chatID int64) (string, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pruneLocked()
	entry, ok := s.items[chatID]
	if !ok {
		return "", false
	}
	entry.UpdatedAt = time.Now().UTC()
	s.items[chatID] = entry
	return entry.Text, true
}

func (s *workingTextStore) Delete(chatID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, chatID)
}

func (s *workingTextStore) pruneLocked() {
	cutoff := time.Now().UTC().Add(-workingTextTTL)
	for chatID, entry := range s.items {
		if entry.UpdatedAt.Before(cutoff) {
			delete(s.items, chatID)
		}
	}
}

func previewMessage(prefix, text string) string {
	text = strings.TrimSpace(text)
	if len(text) > 500 {
		text = text[:500] + "…"
	}
	return prefix + ":\n\n" + text
}

func (s *Service) actionMarkup(copyText string, includeCopy bool) *tele.ReplyMarkup {
	menu := &tele.ReplyMarkup{}
	firstRow := []tele.Btn{}
	copyText = strings.TrimSpace(copyText)
	if includeCopy && copyText != "" {
		if len([]rune(copyText)) <= telegramCopyTextLimit {
			firstRow = append(firstRow, menu.CopyText("Copy OCR", copyText))
		} else {
			firstRow = append(firstRow, s.btnShowOCR)
		}
	}
	firstRow = append(firstRow, s.btnSummary, s.btnSpeak)
	menu.Inline(
		menu.Row(firstRow...),
		menu.Row(s.btnBoth, s.btnClear),
	)
	return menu
}

func splitTelegramMessage(text string, limit int) []string {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}

	runes := []rune(text)
	var chunks []string
	for len(runes) > 0 {
		if len(runes) <= limit {
			chunks = append(chunks, string(runes))
			break
		}

		splitAt := limit
		for i := limit; i >= limit/2; i-- {
			if runes[i] == '\n' {
				splitAt = i + 1
				break
			}
		}
		chunk := strings.TrimSpace(string(runes[:splitAt]))
		if chunk == "" {
			chunk = string(runes[:limit])
			splitAt = limit
		}
		chunks = append(chunks, chunk)
		runes = []rune(strings.TrimSpace(string(runes[splitAt:])))
	}
	return chunks
}

func isSupportedImageDocument(mimeType, fileName string) bool {
	if strings.EqualFold(mimeType, "image/svg+xml") {
		return false
	}
	if strings.HasPrefix(strings.ToLower(mimeType), "image/") {
		return true
	}
	switch strings.ToLower(filepath.Ext(fileName)) {
	case ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp", ".gif":
		return true
	default:
		return false
	}
}
