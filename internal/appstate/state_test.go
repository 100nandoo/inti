package appstate

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/100nandoo/inti/internal/config"
)

func TestAPIKeyStoreCreateValidateAndDelete(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("INTI_CONFIG_DIR", dir)

	store := LoadAPIKeyStore()
	entry, raw, err := store.Create("test")
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if entry.ID == "" || raw == "" {
		t.Fatalf("expected created entry and raw key, got %#v %q", entry, raw)
	}
	if gotID, ok := store.Validate(raw); !ok || gotID != entry.ID {
		t.Fatalf("Validate() = %q, %t, want %q, true", gotID, ok, entry.ID)
	}
	if !store.HasID(entry.ID) {
		t.Fatalf("HasID(%q) = false, want true", entry.ID)
	}
	found, err := store.Delete(entry.ID)
	if err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if !found {
		t.Fatal("Delete() = false, want true")
	}
	if _, ok := store.Validate(raw); ok {
		t.Fatal("Validate() succeeded after delete")
	}
}

func TestActiveSummarizerConfigPersists(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("INTI_CONFIG_DIR", dir)

	cfg := &config.Config{
		GeminiAPIKey:       "g",
		GroqAPIKey:         "gr",
		OpenRouterAPIKey:   "or",
		SummarizerProvider: "groq",
		GroqModel:          "groq-model",
		OpenRouterModel:    "or-model",
	}
	err := SaveActiveSummarizerConfig("openrouter", "custom-model", map[string]string{
		"gemini":     "g2",
		"groq":       "gr2",
		"openrouter": "or2",
	}, &StoredRateLimits{RemainingRequests: "10"})
	if err != nil {
		t.Fatalf("SaveActiveSummarizerConfig() error = %v", err)
	}

	state := LoadActiveSummarizerConfig(cfg)
	provider, model, keys, limits := state.Get()
	if provider != "openrouter" || model != "custom-model" {
		t.Fatalf("Get() provider/model = %q/%q", provider, model)
	}
	if keys["openrouter"] != "or2" || keys["groq"] != "gr2" {
		t.Fatalf("Get() keys = %#v", keys)
	}
	if limits == nil || limits.RemainingRequests != "10" {
		t.Fatalf("Get() limits = %#v, want RemainingRequests=10", limits)
	}
}

func TestTelegramSessionStorePersistenceAndAuthorization(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("INTI_CONFIG_DIR", dir)

	store := LoadAPIKeyStore()
	entry, _, err := store.Create("session-key")
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	sessions := LoadTelegramSessionStore()
	session := TelegramSession{
		ChatID:       42,
		UserID:       7,
		APIKeyID:     entry.ID,
		Voice:        "Kore",
		Model:        "gemini-3.1-flash-tts-preview",
		AuthorizedAt: time.Now().UTC(),
	}
	if err := sessions.Save(session); err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	reloaded := LoadTelegramSessionStore()
	got, ok := reloaded.Authorized(42, store)
	if !ok {
		t.Fatal("Authorized() = false, want true")
	}
	if got.APIKeyID != entry.ID || got.Voice != "Kore" {
		t.Fatalf("Authorized() session = %#v", got)
	}

	found, err := store.Delete(entry.ID)
	if err != nil || !found {
		t.Fatalf("Delete() = %t, %v", found, err)
	}
	if _, ok := reloaded.Authorized(42, store); ok {
		t.Fatal("Authorized() succeeded after backing API key deletion")
	}
}

func TestThemePersistence(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("INTI_CONFIG_DIR", dir)
	if err := SaveTheme("dark"); err != nil {
		t.Fatalf("SaveTheme() error = %v", err)
	}
	if got := LoadTheme(); got != "dark" {
		t.Fatalf("LoadTheme() = %q, want dark", got)
	}
	if _, err := os.Stat(filepath.Join(dir, "inti.toml")); err != nil {
		t.Fatalf("expected inti.toml to exist: %v", err)
	}
}
