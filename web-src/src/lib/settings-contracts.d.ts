import type {
  GroqRateLimits,
  PromotionBehavior,
  SummaryDownloadFormat,
  SummarizerKeys,
} from './workspace-contracts';

export type SummarizerProvider = '' | 'gemini' | 'groq' | 'openrouter' | 'mock';
export type ThemeChoice = 'light' | 'dark';
export type ProviderDisplayName = 'Gemini' | 'Groq' | 'OpenRouter';

export interface SettingsOption<T extends string> {
  value: T;
  label: string;
}

export interface SummarizerModelOption extends SettingsOption<string> {}

export interface AppearanceSettingsPayload {
  theme: ThemeChoice;
  summaryDownloadFormat: SummaryDownloadFormat;
  ocrPromotionBehavior: PromotionBehavior;
  summaryPromotionBehavior: PromotionBehavior;
}

export interface AppearanceSettingsInput {
  theme?: string;
  summaryDownloadFormat?: string;
  ocrPromotionBehavior?: string;
  summaryPromotionBehavior?: string;
}

export interface SummarizerSettingsPayload {
  provider: SummarizerProvider;
  model: string;
  keys: SummarizerKeys;
  groqLimits: GroqRateLimits | null;
}

export interface SummarizerSettingsInput {
  provider?: string;
  model?: string;
  keys?: Partial<SummarizerKeys>;
  groqLimits?: GroqRateLimits | null;
}

export interface SettingsLoadResult {
  summarizerConfig: SummarizerSettingsPayload;
  appearanceConfig: AppearanceSettingsPayload;
}

export interface LoadSettingsInput {
  apiURL: (path: string) => string;
  fetchImpl?: typeof fetch;
}

export interface SaveSettingsInput extends LoadSettingsInput {
  provider: SummarizerProvider;
  model: string;
  keys: SummarizerKeys;
  appearanceConfig: AppearanceSettingsPayload;
}
