package cmd

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/100nandoo/inti/internal/appstate"
	"github.com/100nandoo/inti/internal/server"
	"github.com/100nandoo/inti/internal/telegrambot"
	"github.com/spf13/cobra"
	"golang.org/x/sync/errgroup"
)

// WebFS is set by main package via embed.go
var WebFS embed.FS

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start HTTP server with web UI",
	RunE: func(cmd *cobra.Command, args []string) error {
		port, _ := cmd.Flags().GetInt("port")
		if port != 0 {
			cfg.Port = port
		}
		host, _ := cmd.Flags().GetString("host")
		if host != "" {
			cfg.Host = host
		}
		state := appstate.LoadRuntimeState(cfg)
		httpServer, err := server.New(cfg, WebFS, state)
		if err != nil {
			return err
		}

		ctx, stop := signal.NotifyContext(cmd.Context(), syscall.SIGINT, syscall.SIGTERM)
		defer stop()

		var bot *telegrambot.Service
		if telegrambot.Enabled(cfg) {
			bot, err = telegrambot.New(cfg, state)
			if err != nil {
				return err
			}
		}

		fmt.Printf("starting web server at http://%s:%d\n", cfg.Host, cfg.Port)
		if bot != nil {
			fmt.Println("starting telegram bot")
		} else {
			fmt.Println("telegram bot disabled (TELEGRAM_BOT_TOKEN not set)")
		}

		group, groupCtx := errgroup.WithContext(ctx)
		group.Go(func() error {
			err := httpServer.ListenAndServe()
			if errors.Is(err, http.ErrServerClosed) {
				return nil
			}
			if err != nil {
				return fmt.Errorf("web server: %w", err)
			}
			return nil
		})
		if bot != nil {
			group.Go(func() error {
				if err := bot.Run(groupCtx); err != nil && !errors.Is(err, context.Canceled) {
					return fmt.Errorf("telegram bot: %w", err)
				}
				return nil
			})
		}

		go func() {
			<-groupCtx.Done()
			shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			_ = httpServer.Shutdown(shutdownCtx)
			if bot != nil {
				bot.Stop()
			}
		}()

		if err := group.Wait(); err != nil && !errors.Is(err, context.Canceled) {
			return err
		}
		return nil
	},
}

func init() {
	serveCmd.Flags().Int("port", 0, "HTTP port (default 8282)")
	serveCmd.Flags().String("host", "", "HTTP host (default 127.0.0.1)")
}
