package pdf

import (
	"fmt"
	"image/png"
	"os"
	"path/filepath"

	"github.com/gen2brain/go-fitz"
)

func Convert(pdfPath, outputDir string) (int, error) {
	doc, err := fitz.New(pdfPath)
	if err != nil {
		return 0, fmt.Errorf("open pdf: %w", err)
	}
	defer doc.Close()

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return 0, fmt.Errorf("create output dir: %w", err)
	}

	n := doc.NumPage()
	for i := range n {
		img, err := doc.Image(i)
		if err != nil {
			return 0, fmt.Errorf("render page %d: %w", i+1, err)
		}

		f, err := os.Create(filepath.Join(outputDir, fmt.Sprintf("%d.png", i+1)))
		if err != nil {
			return 0, fmt.Errorf("create image file: %w", err)
		}

		if err := png.Encode(f, img); err != nil {
			f.Close()
			return 0, fmt.Errorf("encode page %d: %w", i+1, err)
		}
		f.Close()
	}

	return n, nil
}
