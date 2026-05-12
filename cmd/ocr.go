package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/100nandoo/inti/internal/audio"
	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/textprocessing"
	"github.com/spf13/cobra"
)

var ocrCmd = &cobra.Command{
	Use:   "ocr <image-path> [image-path...]",
	Short: "Extract text from one or more images and optionally synthesize it",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		processor := textprocessing.New(cfg)
		var parts []string
		for i, path := range args {
			if len(args) > 1 {
				fmt.Printf("[%d/%d] extracting text from %s...\n", i+1, len(args), path)
			} else {
				fmt.Println("extracting text from image...")
			}

			imageBytes, err := os.ReadFile(path)
			if err != nil {
				return fmt.Errorf("read %s: %w", path, err)
			}

			result, err := processor.ExtractText(cmd.Context(), textprocessing.OCRRequest{ImageBytes: imageBytes})
			if err != nil {
				if textprocessing.IsNoTextFound(err) {
					continue
				}
				return fmt.Errorf("ocr %s: %w", path, err)
			}
			parts = append(parts, result.Text)
		}

		var combined []string
		for _, t := range parts {
			if t != "" {
				combined = append(combined, t)
			}
		}

		if len(combined) == 0 {
			fmt.Println("no text found in any image")
			return nil
		}

		text := strings.Join(combined, "\n\n")
		fmt.Println(text)

		speak, _ := cmd.Flags().GetBool("speak")
		if !speak {
			return nil
		}

		voice, _ := cmd.Flags().GetString("voice")
		if voice == "" {
			voice = cfg.DefaultVoice
		}
		if !config.IsValidVoice(voice) {
			return fmt.Errorf("invalid voice %q, valid voices: %v", voice, config.ValidVoices())
		}

		model, _ := cmd.Flags().GetString("model")
		if model == "" {
			model = cfg.DefaultModel
		}
		if !config.IsValidModel(model) {
			return fmt.Errorf("invalid model %q, valid models: %v", model, config.ValidModels())
		}

		fmt.Printf("synthesizing with voice %s (model: %s)...\n", voice, model)
		result, err := processor.SynthesizeSpeech(cmd.Context(), textprocessing.SpeechRequest{
			Text:   text,
			Voice:  voice,
			Model:  model,
			APIKey: cfg.GeminiAPIKey,
		})
		if err != nil {
			if textprocessing.IsRateLimited(err) {
				return fmt.Errorf("rate limited — wait a moment and try again")
			}
			return err
		}

		exportPath, _ := cmd.Flags().GetString("export")
		if exportPath != "" {
			if err := os.WriteFile(exportPath, result.Opus, 0o644); err != nil {
				return fmt.Errorf("write opus: %w", err)
			}
			fmt.Printf("saved to %s\n", exportPath)
		}

		if exportPath == "" || mustBool(cmd.Flags().GetBool("play")) {
			fmt.Println("playing...")
			if err := audio.PlayOpus(result.Opus); err != nil {
				return fmt.Errorf("play audio: %w", err)
			}
		}

		return nil
	},
}

func init() {
	ocrCmd.Flags().Bool("speak", false, "synthesize extracted text with TTS")
	ocrCmd.Flags().String("voice", "", "voice name (default from config)")
	ocrCmd.Flags().String("model", "", fmt.Sprintf("TTS model (default: %s)", config.DefaultModelName))
	ocrCmd.Flags().String("export", "", "save audio to this .opus file path")
	ocrCmd.Flags().Bool("play", false, "play audio even when --export is set")
}
