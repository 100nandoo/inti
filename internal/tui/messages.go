package tui

type speechReadyMsg struct {
	pcm   []byte
	voice string
}

type speechErrMsg struct{ err error }

type playbackDoneMsg struct{}

type exportDoneMsg struct{ path string }

type pdfDoneMsg struct {
	outputDir string
	pages     int
}

type pdfErrMsg struct{ err error }
