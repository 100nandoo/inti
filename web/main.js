import { initFeed } from './js/feed.js';
import { updateTextMetrics } from './js/metrics.js';
import { initOCR } from './js/ocr.js';
import { initProviders } from './js/providers.js';
import { initSummarizer } from './js/summarizer.js';
import { initTTS, synthesizeText } from './js/tts.js';
import { initVoices } from './js/voices.js';

async function bootstrap() {
  initFeed();
  initProviders();
  await initVoices();
  initOCR();
  initSummarizer({ synthesizeText });
  initTTS();
  updateTextMetrics();
}

bootstrap();
