package cmd

import (
	"fmt"

	"github.com/100nandoo/inti/internal/config"
	"github.com/100nandoo/inti/internal/textprocessing"
	"github.com/spf13/cobra"
)

var speakCmd = &cobra.Command{
	Use:   "speak <text>",
	Short: "Synthesize and play text",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		provider, _ := cmd.Flags().GetString("provider")
		voice, _ := cmd.Flags().GetString("voice")
		model, _ := cmd.Flags().GetString("model")
		processor := textprocessing.New(cfg)
		return runSpeechSynthesis(cmd, processor, textprocessing.SpeechRequest{
			Text:     args[0],
			Provider: provider,
			Voice:    voice,
			Model:    model,
			APIKey:   cfg.GeminiAPIKey,
		})
	},
}

func init() {
	speakCmd.Flags().String("provider", "", fmt.Sprintf("speech provider (%v)", config.ValidSpeechProviders()))
	speakCmd.Flags().String("voice", "", "voice name (default from config)")
	speakCmd.Flags().String("model", "", fmt.Sprintf("TTS model (default: %s)", config.DefaultModelName))
	speakCmd.Flags().String("export", "", "save audio to this .opus file path")
	speakCmd.Flags().Bool("play", false, "play audio even when --export is set")
}

func mustBool(v bool, _ error) bool { return v }
