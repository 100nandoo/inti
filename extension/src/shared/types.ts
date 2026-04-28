export type ActionName =
  | 'TRIGGER_SUMMARY'
  | 'EXTRACT'
  | 'SHOW_LOADING'
  | 'SHOW_OVERLAY'
  | 'HIDE_OVERLAY'
  | 'SUMMARY_READY'
  | 'ERROR';

export interface Message {
  action: ActionName;
  payload?: unknown;
}

export interface ArticleData {
  title: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  length: number;
}

export interface SummaryData {
  summary: string;
  articleTitle: string;
  timestamp: number;
  provider?: string;
  model?: string;
}

export type UIState = 'idle' | 'loading' | 'done' | 'error';

export interface Settings {
  apiUrl: string;
  apiKey?: string;
  instruction?: string;
  theme?: 'light' | 'dark';
}

export interface RateLimits {
  limitRequests?: string;
  limitTokens?: string;
  remainingRequests?: string;
  remainingTokens?: string;
  resetRequests?: string;
  resetTokens?: string;
}

export interface SummaryResponse {
  summary: string;
  provider?: string;
  model?: string;
  rateLimits?: RateLimits;
}
