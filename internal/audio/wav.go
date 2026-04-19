package audio

import (
	"bytes"
	"encoding/binary"
	"os"
)

// EncodePCMToWAV wraps 16-bit LE mono PCM bytes in a RIFF/WAVE header.
func EncodePCMToWAV(pcm []byte, sampleRate int) []byte {
	channels := uint16(1)
	bitsPerSample := uint16(16)
	byteRate := uint32(sampleRate) * uint32(channels) * uint32(bitsPerSample) / 8
	blockAlign := channels * bitsPerSample / 8
	dataLen := uint32(len(pcm))

	buf := &bytes.Buffer{}

	buf.WriteString("RIFF")
	binary.Write(buf, binary.LittleEndian, uint32(36+dataLen))
	buf.WriteString("WAVE")

	buf.WriteString("fmt ")
	binary.Write(buf, binary.LittleEndian, uint32(16))           // subchunk size
	binary.Write(buf, binary.LittleEndian, uint16(1))            // PCM format
	binary.Write(buf, binary.LittleEndian, channels)             // mono
	binary.Write(buf, binary.LittleEndian, uint32(sampleRate))
	binary.Write(buf, binary.LittleEndian, byteRate)
	binary.Write(buf, binary.LittleEndian, blockAlign)
	binary.Write(buf, binary.LittleEndian, bitsPerSample)

	buf.WriteString("data")
	binary.Write(buf, binary.LittleEndian, dataLen)
	buf.Write(pcm)

	return buf.Bytes()
}

func WriteWAVFile(path string, pcm []byte, sampleRate int) error {
	return os.WriteFile(path, EncodePCMToWAV(pcm, sampleRate), 0644)
}
