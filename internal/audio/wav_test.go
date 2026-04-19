package audio

import (
	"encoding/binary"
	"testing"
)

func TestEncodePCMToWAV(t *testing.T) {
	pcm := make([]byte, 48000) // 1 second of silence at 24kHz 16-bit
	wav := EncodePCMToWAV(pcm, 24000)

	if string(wav[0:4]) != "RIFF" {
		t.Errorf("expected RIFF header, got %q", wav[0:4])
	}
	if string(wav[8:12]) != "WAVE" {
		t.Errorf("expected WAVE, got %q", wav[8:12])
	}
	if string(wav[12:16]) != "fmt " {
		t.Errorf("expected fmt , got %q", wav[12:16])
	}
	if string(wav[36:40]) != "data" {
		t.Errorf("expected data chunk, got %q", wav[36:40])
	}

	fileSize := binary.LittleEndian.Uint32(wav[4:8])
	if fileSize != uint32(36+len(pcm)) {
		t.Errorf("expected file size %d, got %d", 36+len(pcm), fileSize)
	}

	dataLen := binary.LittleEndian.Uint32(wav[40:44])
	if dataLen != uint32(len(pcm)) {
		t.Errorf("expected data length %d, got %d", len(pcm), dataLen)
	}

	sampleRate := binary.LittleEndian.Uint32(wav[24:28])
	if sampleRate != 24000 {
		t.Errorf("expected sample rate 24000, got %d", sampleRate)
	}

	channels := binary.LittleEndian.Uint16(wav[22:24])
	if channels != 1 {
		t.Errorf("expected 1 channel, got %d", channels)
	}
}
