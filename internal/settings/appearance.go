package settings

import "github.com/100nandoo/inti/internal/appstate"

type AppearanceSettings struct{}

func NewAppearanceSettings() *AppearanceSettings {
	return &AppearanceSettings{}
}

func (a *AppearanceSettings) Get() (theme, summaryDownloadFormat string) {
	return appstate.LoadTheme(), appstate.LoadSummaryDownloadFormat()
}

func (a *AppearanceSettings) Update(theme, summaryDownloadFormat string) error {
	if err := appstate.SaveTheme(theme); err != nil {
		return err
	}
	return appstate.SaveSummaryDownloadFormat(summaryDownloadFormat)
}

func IsValidTheme(theme string) bool {
	return appstate.IsValidTheme(theme)
}

func IsValidSummaryDownloadFormat(format string) bool {
	return appstate.IsValidSummaryDownloadFormat(format)
}
