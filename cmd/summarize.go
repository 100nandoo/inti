package cmd

import (
	"fmt"

	"github.com/100nandoo/inti/internal/textprocessing"
	"github.com/spf13/cobra"
)

var summarizeCmd = &cobra.Command{
	Use:   "summarize <text>",
	Short: "Summarize text using a configured AI provider",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		instruction, _ := cmd.Flags().GetString("instruction")
		provider, _ := cmd.Flags().GetString("provider")
		apiKey, _ := cmd.Flags().GetString("api-key")
		processor := textprocessing.New(cfg)

		fmt.Println("summarizing…")
		result, err := processor.Summarize(cmd.Context(), textprocessing.SummaryRequest{
			Text:        args[0],
			Instruction: instruction,
			Provider:    provider,
			APIKey:      apiKey,
		})
		if err != nil {
			if textprocessing.IsRateLimited(err) {
				return fmt.Errorf("rate limited — wait a moment and try again")
			}
			return err
		}

		fmt.Println("\n--- Summary ---")
		fmt.Println(result.Summary)

		return nil
	},
}

func init() {
	summarizeCmd.Flags().String("instruction", "", "custom summarization instruction (optional)")
	summarizeCmd.Flags().String("provider", "", "AI provider: gemini, groq, openrouter (overrides config)")
	summarizeCmd.Flags().String("api-key", "", "API key for the provider (overrides env var)")
}
