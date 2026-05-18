package cmd

import (
	"context"
	"encoding/binary"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/textprocessing"
	"github.com/spf13/cobra"
)

func TestSpeakAndOCRCommandsExposeProviderFlag(t *testing.T) {
	if speakCmd.Flags().Lookup("provider") == nil {
		t.Fatal("speak command is missing --provider")
	}
	if ocrCmd.Flags().Lookup("provider") == nil {
		t.Fatal("ocr command is missing --provider")
	}
}

func TestRunSpeechSynthesisUsesConfigDefaultProviderAndProviderSpecificDefaults(t *testing.T) {
	var requestBody string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read body: %v", err)
		}
		requestBody = string(body)
		w.Header().Set("Content-Type", "audio/wav")
		_, _ = w.Write(testCommandWAVBytes())
	}))
	defer server.Close()

	processor := textprocessing.New(&config.Config{
		SpeechProvider: config.SpeechProviderKokoroHeart,
		KokoroHeartURL: server.URL,
		DefaultVoice:   config.DefaultGeminiVoice,
		DefaultModel:   config.DefaultModelName,
	})
	exportPath := filepath.Join(t.TempDir(), "speech.opus")

	cmd := &cobra.Command{}
	cmd.SetContext(context.Background())
	cmd.Flags().String("export", "", "")
	cmd.Flags().Bool("play", false, "")
	if err := cmd.Flags().Set("export", exportPath); err != nil {
		t.Fatalf("set export: %v", err)
	}

	if err := runSpeechSynthesis(cmd, processor, textprocessing.SpeechRequest{Text: "hello from cli"}); err != nil {
		t.Fatalf("runSpeechSynthesis() error = %v", err)
	}

	if _, err := os.Stat(exportPath); err != nil {
		t.Fatalf("expected export file: %v", err)
	}
	if !strings.Contains(requestBody, `"voice":"cheery"`) {
		t.Fatalf("request body missing kokoro default voice: %s", requestBody)
	}
	if strings.Contains(requestBody, config.DefaultModelName) {
		t.Fatalf("request body should not use a Gemini model for kokoro-heart: %s", requestBody)
	}
}

func TestRunSpeechSynthesisRejectsInvalidProviderSpecificModel(t *testing.T) {
	cmd := &cobra.Command{}
	cmd.SetContext(context.Background())
	cmd.Flags().String("export", "", "")
	cmd.Flags().Bool("play", false, "")

	processor := textprocessing.New(&config.Config{
		SpeechProvider: config.SpeechProviderGemini,
	})

	err := runSpeechSynthesis(cmd, processor, textprocessing.SpeechRequest{
		Text:     "hello",
		Provider: config.SpeechProviderKokoroHeart,
		Voice:    config.DefaultKokoroHeartVoice,
		Model:    config.DefaultModelName,
	})
	if err == nil || !strings.Contains(err.Error(), "invalid model") {
		t.Fatalf("runSpeechSynthesis() error = %v, want invalid model", err)
	}
}

func testCommandWAVBytes() []byte {
	samples := []int16{0, 1200, -1200, 400, -400, 0, 800, -800}
	pcm := make([]byte, 0, len(samples)*2)
	for _, sample := range samples {
		pcm = binary.LittleEndian.AppendUint16(pcm, uint16(sample))
	}

	const sampleRate = 24000
	byteRate := uint32(sampleRate * 2)
	blockAlign := uint16(2)
	dataLen := uint32(len(pcm))
	riffSize := uint32(36) + dataLen

	wav := make([]byte, 0, 44+len(pcm))
	wav = append(wav, 'R', 'I', 'F', 'F')
	wav = binary.LittleEndian.AppendUint32(wav, riffSize)
	wav = append(wav, 'W', 'A', 'V', 'E')
	wav = append(wav, 'f', 'm', 't', ' ')
	wav = binary.LittleEndian.AppendUint32(wav, 16)
	wav = binary.LittleEndian.AppendUint16(wav, 1)
	wav = binary.LittleEndian.AppendUint16(wav, 1)
	wav = binary.LittleEndian.AppendUint32(wav, sampleRate)
	wav = binary.LittleEndian.AppendUint32(wav, byteRate)
	wav = binary.LittleEndian.AppendUint16(wav, blockAlign)
	wav = binary.LittleEndian.AppendUint16(wav, 16)
	wav = append(wav, 'd', 'a', 't', 'a')
	wav = binary.LittleEndian.AppendUint32(wav, dataLen)
	wav = append(wav, pcm...)
	return wav
}
