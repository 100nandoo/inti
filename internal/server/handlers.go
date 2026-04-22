package server

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/100nandoo/vocalize/internal/audio"
	"github.com/100nandoo/vocalize/internal/config"
	"github.com/100nandoo/vocalize/internal/gemini"
	"github.com/100nandoo/vocalize/internal/ocr"
)

type speakRequest struct {
	Text  string `json:"text"`
	Voice string `json:"voice"`
	Model string `json:"model"`
}

type speakResponse struct {
	Opus string `json:"opus"`
}

type voicesResponse struct {
	Voices  []string `json:"voices"`
	Default string   `json:"default"`
}

type modelsResponse struct {
	Models  []string `json:"models"`
	Default string   `json:"default"`
}

type errResponse struct {
	Error string `json:"error"`
}

func handleSpeak(g *gemini.Client, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
			return
		}

		var req speakRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid request body"})
			return
		}

		if req.Text == "" {
			writeJSON(w, http.StatusBadRequest, errResponse{"text is required"})
			return
		}

		voice := req.Voice
		if voice == "" {
			voice = cfg.DefaultVoice
		}
		if !config.IsValidVoice(voice) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid voice: " + voice})
			return
		}

		model := req.Model
		if model == "" {
			model = cfg.DefaultModel
		}
		if !config.IsValidModel(model) {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid model: " + model})
			return
		}

		pcm, err := g.GenerateSpeech(r.Context(), req.Text, voice, model)
		if err != nil {
			if gemini.IsRateLimit(err) {
				writeJSON(w, http.StatusTooManyRequests, errResponse{"rate limited — wait a moment and try again"})
			} else {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			}
			return
		}

		opusBytes, err := audio.EncodePCMToOpus(pcm, 24000)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, speakResponse{
			Opus: base64.StdEncoding.EncodeToString(opusBytes),
		})
	}
}

func handleVoices(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, voicesResponse{
			Voices:  config.ValidVoices(),
			Default: cfg.DefaultVoice,
		})
	}
}

func handleModels(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, modelsResponse{
			Models:  config.ValidModels(),
			Default: cfg.DefaultModel,
		})
	}
}

type ocrResponse struct {
	Text string `json:"text"`
}

func handleOCR() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errResponse{"method not allowed"})
			return
		}

		if err := r.ParseMultipartForm(50 << 20); err != nil {
			writeJSON(w, http.StatusBadRequest, errResponse{"invalid multipart form"})
			return
		}

		// Accept "files" (multi-upload) with "file" as a fallback for single-file requests.
		fileHeaders := r.MultipartForm.File["files"]
		if len(fileHeaders) == 0 {
			fileHeaders = r.MultipartForm.File["file"]
		}
		if len(fileHeaders) == 0 {
			writeJSON(w, http.StatusBadRequest, errResponse{"at least one file is required"})
			return
		}

		var parts []string
		for _, fh := range fileHeaders {
			f, err := fh.Open()
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{"open file: " + err.Error()})
				return
			}
			imageBytes, err := io.ReadAll(f)
			f.Close()
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{"read file: " + err.Error()})
				return
			}
			text, err := ocr.ExtractText(imageBytes)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errResponse{err.Error()})
				return
			}
			if text != "" {
				parts = append(parts, text)
			}
		}

		writeJSON(w, http.StatusOK, ocrResponse{Text: strings.Join(parts, "\n\n")})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
