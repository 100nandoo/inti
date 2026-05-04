package appstate

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/100nandoo/inti/internal/config"
	"github.com/BurntSushi/toml"
)

type FileConfig struct {
	Summarizer SummarizerSection `toml:"summarizer"`
	Appearance AppearanceSection `toml:"appearance"`
	APIKeys    []StoredKey       `toml:"api_keys"`
	Telegram   TelegramSection   `toml:"telegram"`
}

type SummarizerSection struct {
	Provider         string            `toml:"provider"`
	Model            string            `toml:"model"`
	APIKey           string            `toml:"api_key"`
	GeminiAPIKey     string            `toml:"gemini_api_key"`
	GroqAPIKey       string            `toml:"groq_api_key"`
	OpenRouterAPIKey string            `toml:"openrouter_api_key"`
	GroqLimits       *StoredRateLimits `toml:"groq_limits"`
}

type AppearanceSection struct {
	Theme string `toml:"theme"`
}

type TelegramSection struct {
	Sessions []TelegramSession `toml:"sessions"`
}

type StoredRateLimits struct {
	LimitRequests     string `toml:"limit_requests" json:"limitRequests"`
	LimitTokens       string `toml:"limit_tokens" json:"limitTokens"`
	RemainingRequests string `toml:"remaining_requests" json:"remainingRequests"`
	RemainingTokens   string `toml:"remaining_tokens" json:"remainingTokens"`
	ResetRequests     string `toml:"reset_requests" json:"resetRequests"`
	ResetTokens       string `toml:"reset_tokens" json:"resetTokens"`
	CapturedAt        int64  `toml:"captured_at" json:"capturedAt"`
	ResetRequestsAt   int64  `toml:"reset_requests_at" json:"resetRequestsAt"`
	ResetTokensAt     int64  `toml:"reset_tokens_at" json:"resetTokensAt"`
}

type StoredKey struct {
	ID         string     `toml:"id" json:"id"`
	Name       string     `toml:"name" json:"name"`
	Prefix     string     `toml:"prefix" json:"prefix"`
	Hash       string     `toml:"hash" json:"hash"`
	CreatedAt  time.Time  `toml:"created_at" json:"createdAt"`
	LastUsedAt *time.Time `toml:"last_used_at" json:"lastUsedAt,omitempty"`
}

type TelegramSession struct {
	ChatID       int64     `toml:"chat_id"`
	UserID       int64     `toml:"user_id"`
	APIKeyID     string    `toml:"api_key_id"`
	Voice        string    `toml:"voice"`
	Model        string    `toml:"model"`
	AuthorizedAt time.Time `toml:"authorized_at"`
	UpdatedAt    time.Time `toml:"updated_at"`
}

type RuntimeState struct {
	ActiveSummarizer *ActiveSummarizerConfig
	APIKeys          *APIKeyStore
	TelegramSessions *TelegramSessionStore
}

type ActiveSummarizerConfig struct {
	mu         sync.RWMutex
	Provider   string
	Model      string
	Keys       map[string]string
	GroqLimits *StoredRateLimits
}

type APIKeyStore struct {
	mu   sync.RWMutex
	keys []StoredKey
}

type TelegramSessionStore struct {
	mu       sync.RWMutex
	sessions map[int64]TelegramSession
}

var fileMu sync.Mutex

func LoadRuntimeState(cfg *config.Config) *RuntimeState {
	return &RuntimeState{
		ActiveSummarizer: LoadActiveSummarizerConfig(cfg),
		APIKeys:          LoadAPIKeyStore(),
		TelegramSessions: LoadTelegramSessionStore(),
	}
}

func intiConfigPath() string {
	if dir := os.Getenv("INTI_CONFIG_DIR"); dir != "" {
		return filepath.Join(dir, "inti.toml")
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "inti.toml"
	}
	return filepath.Join(base, "inti", "inti.toml")
}

func readConfigUnlocked() FileConfig {
	var cfg FileConfig
	data, err := os.ReadFile(intiConfigPath())
	if err == nil {
		_ = toml.Unmarshal(data, &cfg)
	}
	return cfg
}

func writeConfigUnlocked(cfg FileConfig) error {
	path := intiConfigPath()
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	tmp := path + ".tmp"
	f, err := os.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o600)
	if err != nil {
		return err
	}
	enc := toml.NewEncoder(f)
	encErr := enc.Encode(cfg)
	f.Close()
	if encErr != nil {
		_ = os.Remove(tmp)
		return encErr
	}
	return os.Rename(tmp, path)
}

func LoadActiveSummarizerConfig(cfg *config.Config) *ActiveSummarizerConfig {
	asc := &ActiveSummarizerConfig{
		Keys: map[string]string{
			"gemini":     cfg.GeminiAPIKey,
			"groq":       cfg.GroqAPIKey,
			"openrouter": cfg.OpenRouterAPIKey,
		},
		Provider: cfg.SummarizerProvider,
	}
	fileMu.Lock()
	vc := readConfigUnlocked()
	fileMu.Unlock()
	if vc.Summarizer.Provider != "" {
		asc.Provider = vc.Summarizer.Provider
	}
	asc.Model = vc.Summarizer.Model
	if vc.Summarizer.GeminiAPIKey != "" {
		asc.Keys["gemini"] = vc.Summarizer.GeminiAPIKey
	}
	if vc.Summarizer.GroqAPIKey != "" {
		asc.Keys["groq"] = vc.Summarizer.GroqAPIKey
	}
	if vc.Summarizer.OpenRouterAPIKey != "" {
		asc.Keys["openrouter"] = vc.Summarizer.OpenRouterAPIKey
	}
	if vc.Summarizer.APIKey != "" && asc.Provider != "" && asc.Keys[asc.Provider] == "" {
		asc.Keys[asc.Provider] = vc.Summarizer.APIKey
	}
	asc.GroqLimits = vc.Summarizer.GroqLimits
	return asc
}

func (a *ActiveSummarizerConfig) Get() (provider, model string, keys map[string]string, groqLimits *StoredRateLimits) {
	a.mu.RLock()
	defer a.mu.RUnlock()
	keys = map[string]string{
		"gemini":     a.Keys["gemini"],
		"groq":       a.Keys["groq"],
		"openrouter": a.Keys["openrouter"],
	}
	if a.GroqLimits != nil {
		limitsCopy := *a.GroqLimits
		groqLimits = &limitsCopy
	}
	return a.Provider, a.Model, keys, groqLimits
}

func (a *ActiveSummarizerConfig) KeyForProvider(provider string) string {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.Keys[provider]
}

func (a *ActiveSummarizerConfig) Set(provider, model string, keys map[string]string, groqLimits *StoredRateLimits) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.Provider = provider
	a.Model = model
	a.Keys = map[string]string{
		"gemini":     keys["gemini"],
		"groq":       keys["groq"],
		"openrouter": keys["openrouter"],
	}
	a.GroqLimits = groqLimits
}

func (a *ActiveSummarizerConfig) SetGroqLimits(groqLimits *StoredRateLimits) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.GroqLimits = groqLimits
}

func SaveActiveSummarizerConfig(provider, model string, keys map[string]string, groqLimits *StoredRateLimits) error {
	fileMu.Lock()
	defer fileMu.Unlock()
	vc := readConfigUnlocked()
	vc.Summarizer = SummarizerSection{
		Provider:         provider,
		Model:            model,
		GeminiAPIKey:     keys["gemini"],
		GroqAPIKey:       keys["groq"],
		OpenRouterAPIKey: keys["openrouter"],
		GroqLimits:       groqLimits,
	}
	return writeConfigUnlocked(vc)
}

func LoadTheme() string {
	fileMu.Lock()
	defer fileMu.Unlock()
	vc := readConfigUnlocked()
	if !IsValidTheme(vc.Appearance.Theme) {
		return ""
	}
	return vc.Appearance.Theme
}

func SaveTheme(theme string) error {
	fileMu.Lock()
	defer fileMu.Unlock()
	vc := readConfigUnlocked()
	vc.Appearance.Theme = theme
	return writeConfigUnlocked(vc)
}

func IsValidTheme(theme string) bool {
	return theme == "" || theme == "light" || theme == "dark"
}

func LoadAPIKeyStore() *APIKeyStore {
	fileMu.Lock()
	vc := readConfigUnlocked()
	fileMu.Unlock()
	return &APIKeyStore{keys: vc.APIKeys}
}

func generateKey() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "inti_" + hex.EncodeToString(b), nil
}

func generateID() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func HashKey(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func (s *APIKeyStore) HasKeys() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.keys) > 0
}

func (s *APIKeyStore) Validate(raw string) (id string, ok bool) {
	return s.ValidateHash(HashKey(raw))
}

func (s *APIKeyStore) ValidateHash(hash string) (id string, ok bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, k := range s.keys {
		if k.Hash == hash {
			return k.ID, true
		}
	}
	return "", false
}

func (s *APIKeyStore) List() []StoredKey {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cp := make([]StoredKey, len(s.keys))
	copy(cp, s.keys)
	return cp
}

func (s *APIKeyStore) Create(name string) (StoredKey, string, error) {
	raw, err := generateKey()
	if err != nil {
		return StoredKey{}, "", err
	}
	id, err := generateID()
	if err != nil {
		return StoredKey{}, "", err
	}
	entry := StoredKey{
		ID:        id,
		Name:      name,
		Prefix:    raw[:12],
		Hash:      HashKey(raw),
		CreatedAt: time.Now().UTC(),
	}
	s.mu.Lock()
	s.keys = append(s.keys, entry)
	s.mu.Unlock()
	if err := s.save(); err != nil {
		_ = err
	}
	return entry, raw, nil
}

func (s *APIKeyStore) Delete(id string) (bool, error) {
	s.mu.Lock()
	found := false
	filtered := s.keys[:0]
	for _, k := range s.keys {
		if k.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, k)
	}
	s.keys = filtered
	s.mu.Unlock()
	if !found {
		return false, nil
	}
	return true, s.save()
}

func (s *APIKeyStore) TouchLastUsed(id string) {
	now := time.Now().UTC()
	s.mu.Lock()
	for i := range s.keys {
		if s.keys[i].ID == id {
			s.keys[i].LastUsedAt = &now
			break
		}
	}
	s.mu.Unlock()
	_ = s.save()
}

func (s *APIKeyStore) save() error {
	s.mu.RLock()
	keys := make([]StoredKey, len(s.keys))
	copy(keys, s.keys)
	s.mu.RUnlock()

	fileMu.Lock()
	defer fileMu.Unlock()
	vc := readConfigUnlocked()
	vc.APIKeys = keys
	return writeConfigUnlocked(vc)
}

func LoadTelegramSessionStore() *TelegramSessionStore {
	fileMu.Lock()
	vc := readConfigUnlocked()
	fileMu.Unlock()
	sessions := make(map[int64]TelegramSession, len(vc.Telegram.Sessions))
	for _, session := range vc.Telegram.Sessions {
		sessions[session.ChatID] = session
	}
	return &TelegramSessionStore{sessions: sessions}
}

func (s *TelegramSessionStore) Get(chatID int64) (TelegramSession, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, ok := s.sessions[chatID]
	return session, ok
}

func (s *TelegramSessionStore) Save(session TelegramSession) error {
	session.UpdatedAt = time.Now().UTC()
	if session.AuthorizedAt.IsZero() {
		session.AuthorizedAt = session.UpdatedAt
	}
	s.mu.Lock()
	if s.sessions == nil {
		s.sessions = make(map[int64]TelegramSession)
	}
	s.sessions[session.ChatID] = session
	s.mu.Unlock()
	return s.save()
}

func (s *TelegramSessionStore) Delete(chatID int64) error {
	s.mu.Lock()
	delete(s.sessions, chatID)
	s.mu.Unlock()
	return s.save()
}

func (s *TelegramSessionStore) Authorized(chatID int64, keys *APIKeyStore) (TelegramSession, bool) {
	session, ok := s.Get(chatID)
	if !ok {
		return TelegramSession{}, false
	}
	if session.APIKeyID == "" {
		return TelegramSession{}, false
	}
	if keys == nil || keys.HasID(session.APIKeyID) {
		return session, true
	}
	return TelegramSession{}, false
}

func (s *TelegramSessionStore) HasID(chatID int64) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.sessions[chatID]
	return ok
}

func (s *TelegramSessionStore) save() error {
	s.mu.RLock()
	sessions := make([]TelegramSession, 0, len(s.sessions))
	for _, session := range s.sessions {
		sessions = append(sessions, session)
	}
	s.mu.RUnlock()

	fileMu.Lock()
	defer fileMu.Unlock()
	vc := readConfigUnlocked()
	vc.Telegram.Sessions = sessions
	return writeConfigUnlocked(vc)
}

func (s *APIKeyStore) HasID(id string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, key := range s.keys {
		if key.ID == id {
			return true
		}
	}
	return false
}
