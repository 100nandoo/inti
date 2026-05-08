import { initFeed } from './js/feed.js';
import { updateTextMetrics } from './js/metrics.js';
import { initOCR } from './js/ocr.js';
import { initProviders } from './js/providers.js';
import { initSummarizer, resetSummaryResult, summarizeText } from './js/summarizer.js';
import { clearGeneratedAudio, initTTS, synthesizeText } from './js/tts.js';
import { initVoices } from './js/voices.js';

initFeed();
initProviders();
initVoices();
initOCR({ resetSummaryResult });
initSummarizer({ synthesizeText, clearGeneratedAudio });
initTTS({ summarizeText });
updateTextMetrics();
