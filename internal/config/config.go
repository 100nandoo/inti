package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	GeminiAPIKey     string
	DefaultVoice     string
	DefaultModel     string
	Port             int
	Host             string
	MainKey          string
	TelegramBotToken string

	SummarizerProvider string // "gemini" | "groq" | "openrouter"
	GroqAPIKey         string
	GroqModel          string
	OpenRouterAPIKey   string
	OpenRouterModel    string
}

var validVoices = []string{
	"Zephyr", "Puck", "Charon", "Kore", "Fenrir",
	"Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe",
	"Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina",
	"Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
	"Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird",
	"Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
}

var validModels = []string{
	"gemini-2.5-flash-preview-tts",
	"gemini-2.5-pro-preview-tts",
	"gemini-3.1-flash-tts-preview",
}

const DefaultModelName = "gemini-3.1-flash-tts-preview"

var placeholderSecretValues = map[string]struct{}{
	"":                 {},
	"put_api_key_here": {},
	"your_api_key":     {},
	"changeme":         {},
	"change_me":        {},
}

func ValidVoices() []string { return validVoices }

func IsValidVoice(name string) bool {
	for _, v := range validVoices {
		if v == name {
			return true
		}
	}
	return false
}

func ValidModels() []string { return validModels }

func IsValidModel(name string) bool {
	for _, m := range validModels {
		if m == name {
			return true
		}
	}
	return false
}

func loadSecret(names ...string) string {
	for _, name := range names {
		value := normalizeSecret(os.Getenv(name))
		if value != "" {
			return value
		}
	}
	return ""
}

func normalizeSecret(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, `"'`)
	if _, isPlaceholder := placeholderSecretValues[strings.ToLower(value)]; isPlaceholder {
		return ""
	}
	return value
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	key := loadSecret("GEMINI_API_KEY", "GOOGLE_API_KEY")

	port := 8282
	if p := os.Getenv("PORT"); p != "" {
		if n, err := strconv.Atoi(p); err == nil {
			port = n
		}
	}

	host := "127.0.0.1"
	if h := os.Getenv("HOST"); h != "" {
		host = h
	}

	voice := "Kore"
	if v := os.Getenv("DEFAULT_VOICE"); v != "" && IsValidVoice(v) {
		voice = v
	}

	model := DefaultModelName
	if m := os.Getenv("DEFAULT_MODEL"); m != "" && IsValidModel(m) {
		model = m
	}

	// Auto-detect summarizer provider if not explicitly set.
	summarizerProvider := os.Getenv("SUMMARIZER_PROVIDER")
	if summarizerProvider == "" {
		switch {
		case key != "":
			summarizerProvider = "gemini"
		case loadSecret("GROQ_API_KEY") != "":
			summarizerProvider = "groq"
		case loadSecret("OPENROUTER_API_KEY") != "":
			summarizerProvider = "openrouter"
		}
	}

	groqModel := "llama-3.3-70b-versatile"
	if m := os.Getenv("GROQ_MODEL"); m != "" {
		groqModel = m
	}

	openRouterModel := "google/gemma-3-27b-it:free"
	if m := os.Getenv("OPENROUTER_MODEL"); m != "" {
		openRouterModel = m
	}

	mainKey := os.Getenv("INTI_MAIN_KEY")
	if mainKey == "" {
		mainKey = os.Getenv("INTI_MASTER_KEY")
	}

	return &Config{
		GeminiAPIKey:       key,
		DefaultVoice:       voice,
		DefaultModel:       model,
		Port:               port,
		Host:               host,
		MainKey:            mainKey,
		TelegramBotToken:   os.Getenv("TELEGRAM_BOT_TOKEN"),
		SummarizerProvider: summarizerProvider,
		GroqAPIKey:         loadSecret("GROQ_API_KEY"),
		GroqModel:          groqModel,
		OpenRouterAPIKey:   loadSecret("OPENROUTER_API_KEY"),
		OpenRouterModel:    openRouterModel,
	}, nil
}
