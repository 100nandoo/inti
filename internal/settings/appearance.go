package settings

import "github.com/100nandoo/inti/internal/appstate"

type AppearanceSettings struct{}

func NewAppearanceSettings() *AppearanceSettings {
	return &AppearanceSettings{}
}

func (a *AppearanceSettings) Get() (theme, summaryDownloadFormat, ocrPromotionBehavior, summaryPromotionBehavior string) {
	return appstate.LoadTheme(),
		appstate.LoadSummaryDownloadFormat(),
		appstate.LoadOCRPromotionBehavior(),
		appstate.LoadSummaryPromotionBehavior()
}

func (a *AppearanceSettings) Update(theme, summaryDownloadFormat, ocrPromotionBehavior, summaryPromotionBehavior string) error {
	if err := appstate.SaveTheme(theme); err != nil {
		return err
	}
	if err := appstate.SaveSummaryDownloadFormat(summaryDownloadFormat); err != nil {
		return err
	}
	if err := appstate.SaveOCRPromotionBehavior(ocrPromotionBehavior); err != nil {
		return err
	}
	return appstate.SaveSummaryPromotionBehavior(summaryPromotionBehavior)
}

func IsValidTheme(theme string) bool {
	return appstate.IsValidTheme(theme)
}

func IsValidSummaryDownloadFormat(format string) bool {
	return appstate.IsValidSummaryDownloadFormat(format)
}

func IsValidPromotionBehavior(behavior string) bool {
	return appstate.IsValidPromotionBehavior(behavior)
}
