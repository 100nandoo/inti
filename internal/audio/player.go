package audio

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

const sampleRate = 24000

// Play writes PCM to a temp WAV file and plays it via the platform audio player.
func Play(pcm []byte) error {
	player, args, err := platformPlayer()
	if err != nil {
		return err
	}

	tmp, err := os.CreateTemp("", "vocalize-*.wav")
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	tmpPath := tmp.Name()

	if _, err := tmp.Write(EncodePCMToWAV(pcm, sampleRate)); err != nil {
		tmp.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("write wav: %w", err)
	}
	tmp.Close()

	cmdArgs := append(args, tmpPath)
	if err := exec.Command(player, cmdArgs...).Run(); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("play audio: %w", err)
	}

	os.Remove(tmpPath)
	return nil
}

func platformPlayer() (string, []string, error) {
	switch runtime.GOOS {
	case "darwin":
		return "afplay", nil, nil
	case "linux":
		for _, p := range []string{"aplay", "paplay", "mplayer"} {
			if _, err := exec.LookPath(p); err == nil {
				return p, nil, nil
			}
		}
		return "", nil, fmt.Errorf("no audio player found (install aplay, paplay, or mplayer)")
	default:
		if _, err := exec.LookPath("mplayer"); err == nil {
			return "mplayer", nil, nil
		}
		return "", nil, fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}
