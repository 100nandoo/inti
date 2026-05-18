package cmd

import (
	"fmt"
	"os"
	"strings"

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

		provider, _ := cmd.Flags().GetString("provider")
		voice, _ := cmd.Flags().GetString("voice")
		model, _ := cmd.Flags().GetString("model")
		return runSpeechSynthesis(cmd, processor, textprocessing.SpeechRequest{
			Text:     text,
			Provider: provider,
			Voice:    voice,
			Model:    model,
			APIKey:   cfg.GeminiAPIKey,
		})
	},
}

func init() {
	ocrCmd.Flags().Bool("speak", false, "synthesize extracted text with TTS")
	ocrCmd.Flags().String("provider", "", fmt.Sprintf("speech provider (%v)", config.ValidSpeechProviders()))
	ocrCmd.Flags().String("voice", "", "voice name (default from config)")
	ocrCmd.Flags().String("model", "", fmt.Sprintf("TTS model (default: %s)", config.DefaultModelName))
	ocrCmd.Flags().String("export", "", "save audio to this .opus file path")
	ocrCmd.Flags().Bool("play", false, "play audio even when --export is set")
}
