package config

import (
	"errors"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	GeminiAPIKey string
	DefaultVoice string
	DefaultModel string
	Port         int
	Host         string
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

const DefaultModelName = "gemini-2.5-flash-preview-tts"

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

func Load() (*Config, error) {
	_ = godotenv.Load()

	key := os.Getenv("GEMINI_API_KEY")
	if key == "" {
		return nil, errors.New("GEMINI_API_KEY is not set")
	}

	port := 8080
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

	return &Config{
		GeminiAPIKey: key,
		DefaultVoice: voice,
		DefaultModel: model,
		Port:         port,
		Host:         host,
	}, nil
}
