package audio

import (
	"encoding/binary"
	"fmt"
)

// DecodeWAVPCM extracts PCM bytes and sample rate from a RIFF/WAVE PCM-16 stream.
func DecodeWAVPCM(wav []byte) ([]byte, int, error) {
	if len(wav) < 12 || string(wav[:4]) != "RIFF" || string(wav[8:12]) != "WAVE" {
		return nil, 0, fmt.Errorf("invalid wav header")
	}

	var (
		audioFormat   uint16
		channels      uint16
		sampleRate    uint32
		bitsPerSample uint16
		data          []byte
		foundFmt      bool
		foundData     bool
	)

	for offset := 12; offset+8 <= len(wav); {
		chunkID := string(wav[offset : offset+4])
		chunkSize := int(binary.LittleEndian.Uint32(wav[offset+4 : offset+8]))
		chunkStart := offset + 8
		chunkEnd := chunkStart + chunkSize
		if chunkEnd > len(wav) {
			return nil, 0, fmt.Errorf("invalid wav chunk size")
		}

		switch chunkID {
		case "fmt ":
			if chunkSize < 16 {
				return nil, 0, fmt.Errorf("invalid wav fmt chunk")
			}
			audioFormat = binary.LittleEndian.Uint16(wav[chunkStart : chunkStart+2])
			channels = binary.LittleEndian.Uint16(wav[chunkStart+2 : chunkStart+4])
			sampleRate = binary.LittleEndian.Uint32(wav[chunkStart+4 : chunkStart+8])
			bitsPerSample = binary.LittleEndian.Uint16(wav[chunkStart+14 : chunkStart+16])
			foundFmt = true
		case "data":
			data = append([]byte(nil), wav[chunkStart:chunkEnd]...)
			foundData = true
		}

		offset = chunkEnd
		if chunkSize%2 == 1 {
			offset++
		}
	}

	if !foundFmt || !foundData {
		return nil, 0, fmt.Errorf("missing wav fmt or data chunk")
	}
	if audioFormat != 1 {
		return nil, 0, fmt.Errorf("unsupported wav format %d", audioFormat)
	}
	if bitsPerSample != 16 {
		return nil, 0, fmt.Errorf("unsupported wav bit depth %d", bitsPerSample)
	}
	if channels == 0 {
		return nil, 0, fmt.Errorf("invalid wav channel count")
	}

	if channels == 1 {
		return data, int(sampleRate), nil
	}

	if channels != 2 || len(data)%4 != 0 {
		return nil, 0, fmt.Errorf("unsupported wav channel layout")
	}

	mono := make([]byte, 0, len(data)/2)
	for i := 0; i+3 < len(data); i += 4 {
		left := int32(int16(binary.LittleEndian.Uint16(data[i : i+2])))
		right := int32(int16(binary.LittleEndian.Uint16(data[i+2 : i+4])))
		mixed := int16((left + right) / 2)
		mono = binary.LittleEndian.AppendUint16(mono, uint16(mixed))
	}

	return mono, int(sampleRate), nil
}
