package cmd

import (
	"fmt"
	"os"

	"github.com/100nandoo/inti/internal/config"
	"github.com/spf13/cobra"
)

var cfg *config.Config

var rootCmd = &cobra.Command{
	Use:   "inti",
	Short: "Text-to-speech powered by Gemini",
	Long:  "Inti converts text to speech using Google Gemini.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return cmd.Help()
	},
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.AddCommand(speakCmd)
	rootCmd.AddCommand(serveCmd)
	rootCmd.AddCommand(pdfCmd)
	rootCmd.AddCommand(ocrCmd)
	rootCmd.AddCommand(summarizeCmd)
}

func initConfig() {
	var err error
	cfg, err = config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
