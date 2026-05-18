export type TextResultKind = 'summary' | 'ocr' | '';
export type TextResultFormat = 'plain' | 'markdown';
export type PromotionBehavior = 'append' | 'replace';
export type SummaryDownloadFormat = 'md' | 'txt';
export type AllowedImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/tiff';

export interface TextResult {
  kind: TextResultKind;
  title: string;
  format: TextResultFormat;
  rawText: string;
  plainText: string;
}

export interface TextResultUpdate {
  kind?: TextResultKind;
  title?: string;
  format?: TextResultFormat;
  rawText?: string;
  plainText?: string;
}

export interface AppearanceConfig {
  summaryDownloadFormat: SummaryDownloadFormat;
  ocrPromotionBehavior: PromotionBehavior;
  summaryPromotionBehavior: PromotionBehavior;
}

export interface AppearanceConfigInput {
  summaryDownloadFormat?: string;
  ocrPromotionBehavior?: string;
  summaryPromotionBehavior?: string;
}

export interface SummarizerKeys {
  gemini: string;
  groq: string;
  openrouter: string;
}

export interface GroqRateLimitPayload {
  limitRequests?: string;
  limitTokens?: string;
  remainingRequests?: string;
  remainingTokens?: string;
  resetRequests?: string;
  resetTokens?: string;
}

export interface GroqRateLimits extends GroqRateLimitPayload {
  capturedAt?: number;
  resetRequestsAt?: number;
  resetTokensAt?: number;
}

export interface SummarizerConfig {
  provider: string;
  model: string;
  keys: SummarizerKeys;
  groqLimits: GroqRateLimits | null;
}

export interface SummarizerConfigInput {
  provider?: string;
  model?: string;
  keys?: Partial<SummarizerKeys>;
  groqLimits?: GroqRateLimits | null;
}

export interface SpeechConfig {
  provider: string;
  voice: string;
  model: string;
}

export interface SpeechConfigInput {
  provider?: string;
  voice?: string;
  model?: string;
}

export interface WorkspaceState {
  processing: boolean;
  lastAudioBlob: Blob | null;
  lastAudioSourceText: string;
  lastAudioSourceLabel: string;
  stagedFiles: File[];
  dragSrcIndex: number | null;
  isPointerOverOcrCard: boolean;
  workingText: string;
  latestTextResult: TextResult;
  appearanceConfig: AppearanceConfig;
  summarizerConfig: SummarizerConfig;
  speechConfig: SpeechConfig;
  selectedSummarizerProvider: string;
  selectedSummarizerModel: string;
  selectedSpeechProvider: string;
  selectedSpeechVoice: string;
  selectedSpeechModel: string;
}

export interface AllowedImageFilesResult {
  allowedFiles: File[];
  rejectedCount: number;
}

export interface ClipboardImageFilesResult {
  files: File[];
  rejectedCount: number;
}

export interface OCRClipboardOptions {
  now?: () => number;
}

export interface SummaryRequestInput {
  apiURL: (path: string) => string;
  fetchImpl?: typeof fetch;
  text: string;
  provider: string;
  model: string;
  now?: () => number;
}

export interface SummaryResponsePayload {
  summary?: string;
  provider?: string;
  model?: string;
  rateLimits?: GroqRateLimitPayload | null;
}

export interface SummaryFlowResult {
  summaryResult: TextResult;
  model: string;
  provider: string;
  rateLimits: GroqRateLimits | null;
}

export interface SpeechRequestInput {
  apiURL: (path: string) => string;
  provider: string;
  text: string;
  voice: string;
  model: string;
  fetchImpl?: typeof fetch;
}

export interface SpeechResponsePayload {
  opus?: string;
}

export interface SpeechSynthesisResult {
  blob: Blob;
  bytes: Uint8Array<ArrayBuffer>;
}

export interface SpeechPanelWorkspace {
  processing: boolean;
  workingText: string;
  latestTextResult: TextResult;
  lastAudioBlob: Blob | null;
  lastAudioSourceLabel: string;
  lastAudioSourceText: string;
}

export interface SpeechPanelViewModel {
  hasWorkingText: boolean;
  hasResult: boolean;
  hasAudio: boolean;
  speechPreviewHtml: string;
  speechPreviewLength: string;
  controlsDisabled: boolean;
  audioMeta: string;
  audioCardHtml: string;
}

export interface ResultSurfaceWorkspace {
  latestTextResult: TextResult;
}

export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

export interface ResultSurfaceViewModel {
  hasResult: boolean;
  hasSpeakableText: boolean;
  kindChip: string;
  title: string;
  contentHtml: string;
  defaultPromotionLabel: string;
}
