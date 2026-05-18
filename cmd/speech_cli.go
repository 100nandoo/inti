package cmd

import (
	"fmt"
	"os"

	"github.com/100nandoo/inti/internal/audio"
	"github.com/100nandoo/inti/internal/textprocessing"
	"github.com/spf13/cobra"
)

var writeSpeechFile = os.WriteFile
var playSpeechAudio = audio.PlayOpus

func runSpeechSynthesis(cmd *cobra.Command, processor *textprocessing.Processor, req textprocessing.SpeechRequest) error {
	resolved, err := processor.PrepareSpeechRequest(req)
	if err != nil {
		return err
	}

	modelLabel := resolved.Model
	if modelLabel == "" {
		modelLabel = "none"
	}

	fmt.Printf(
		"synthesizing with provider %s, voice %s (model: %s)...\n",
		resolved.Provider,
		resolved.Voice,
		modelLabel,
	)

	result, err := processor.SynthesizeSpeech(cmd.Context(), resolved)
	if err != nil {
		if textprocessing.IsRateLimited(err) {
			return fmt.Errorf("rate limited — wait a moment and try again")
		}
		return err
	}

	exportPath, _ := cmd.Flags().GetString("export")
	if exportPath != "" {
		if err := writeSpeechFile(exportPath, result.Opus, 0o644); err != nil {
			return fmt.Errorf("write opus: %w", err)
		}
		fmt.Printf("saved to %s\n", exportPath)
	}

	if exportPath == "" || mustBool(cmd.Flags().GetBool("play")) {
		fmt.Println("playing...")
		if err := playSpeechAudio(result.Opus); err != nil {
			return fmt.Errorf("play audio: %w", err)
		}
	}

	return nil
}
