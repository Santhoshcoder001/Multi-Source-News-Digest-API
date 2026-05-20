import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';
import providerManager from './providerManager.js';

const RETRY_ATTEMPTS = 1;

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 8000;
const GEMINI_RETRIES = 2;

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

function normalizeText(value) {
  return String(value ?? '').trim();
}

function stripCodeFences(text) {
  return String(text ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
}

function generateFallbackSummary(article) {
  // Priority: description > content > title > fallback message
  let text = normalizeText(article?.description) || normalizeText(article?.content) || normalizeText(article?.title) || '';

  if (!text) {
    return 'No summary available.';
  }

  // Extract first 2-3 sentences by splitting on periods, exclamation marks, and question marks
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ').trim();
  
  if (!sentences) {
    return text.slice(0, 200) + (text.length > 200 ? '...' : '');
  }

  return sentences;
}

function buildFallback(article) {
  // Generate fallback summary from description/content/title
  const summary = generateFallbackSummary(article);
  
  // Detect sentiment from full article text
  const text = (
    normalizeText(article?.description) + ' ' + normalizeText(article?.content) + ' ' + normalizeText(article?.title)
  ).toLowerCase();

  const positiveKeywords = ['good', 'great', 'success', 'wins', 'up', 'rise', 'benefit', 'gain', 'achieve', 'record'];
  const negativeKeywords = ['fail', 'crash', 'loss', 'down', 'decline', 'attack', 'dead', 'death', 'crisis', 'disaster', 'worst'];

  let sentiment = 'neutral';
  for (const kw of positiveKeywords) if (text.includes(kw)) { sentiment = 'positive'; break; }
  if (sentiment === 'neutral') for (const kw of negativeKeywords) if (text.includes(kw)) { sentiment = 'negative'; break; }

  return {
    summary,
    sentiment,
    summaryProvider: 'fallback',
    fallbackUsed: true
  };
}

function buildPrompt(article) {
  const title = normalizeText(article?.title);
  const description = normalizeText(article?.description);
  const content = normalizeText(article?.content);

  return [
    'You are an article summarizer.',
    'Return ONLY valid JSON in this exact shape: {"summary": string, "sentiment": "positive" | "neutral" | "negative"}.',
    'The summary must be EXACTLY 2 sentences.',
    'Sentence 1 must state what happened using factual language only.',
    'Sentence 2 must explain why it matters, including context or impact.',
    'Do not add markdown, code fences, or extra keys.',
    '',
    `Title: ${title || 'N/A'}`,
    `Description: ${description || 'N/A'}`,
    `Content: ${content || 'N/A'}`
  ].join('\n');
}

function timeoutPromise(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

function getGeminiModel() {
  return genAI.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } });
}

async function summarizeWithGemini(article) {
  const prompt = buildPrompt(article);

  for (let attempt = 1; attempt <= GEMINI_RETRIES; attempt += 1) {
    try {
      console.log('[articleSummarizer] Sending article to Gemini', { title: normalizeText(article?.title), attempt });

      const op = getGeminiModel().generateContent(prompt);
      const result = await Promise.race([op, timeoutPromise(GEMINI_TIMEOUT_MS)]);

      const response = await result.response;
      const rawText = await response.text();

      const cleaned = stripCodeFences(rawText);
      let parsed;
      try { parsed = JSON.parse(cleaned); } catch (err) { throw new Error('Invalid JSON from Gemini'); }

      const summary = normalizeText(parsed?.summary);
      const sentiment = normalizeText(parsed?.sentiment).toLowerCase();

      if (!summary || !['positive','neutral','negative'].includes(sentiment)) throw new Error('Gemini returned invalid shape');

      console.log('[Gemini Success]', normalizeText(article?.title));

      return { summary, sentiment, summaryProvider: 'gemini', fallbackUsed: false };
    } catch (err) {
      console.warn('[Gemini Error]', normalizeText(article?.title), String(err?.message ?? ''));
      if (attempt < GEMINI_RETRIES) await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw new Error('Gemini failed after retries');
}

async function summarizeWithOpenAI(article) {
  const prompt = buildPrompt(article);

  console.log('[articleSummarizer] Sending article to OpenAI', { title: normalizeText(article?.title) });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [ { role: 'system', content: 'You summarize news articles.' }, { role: 'user', content: prompt } ],
    max_tokens: 150,
    temperature: 0.2
  });

  const rawText = completion?.choices?.[0]?.message?.content;

  let parsed;
  try { parsed = JSON.parse(rawText); } catch (err) { throw new Error('Invalid JSON from OpenAI'); }

  const summary = normalizeText(parsed?.summary);
  const sentiment = normalizeText(parsed?.sentiment).toLowerCase();

  if (!summary) throw new Error('OpenAI returned empty summary');
  if (!['positive','neutral','negative'].includes(sentiment)) throw new Error('OpenAI returned invalid sentiment');

  console.log('[OpenAI Success]', normalizeText(article?.title));

  return { summary, sentiment, summaryProvider: 'openai', fallbackUsed: false };
}

/**
 * Summarize an article using provider priority: Gemini -> OpenAI -> local fallback
 * Always returns: { summary, sentiment, summaryProvider, fallbackUsed }
 */
export async function summarizeArticle(article) {
  try {
    // 1) Try Gemini
    try {
      const geminiResult = await summarizeWithGemini(article);
      return geminiResult;
    } catch (gemErr) {
      console.warn('[Gemini Failed]', normalizeText(article?.title), String(gemErr?.message ?? ''));
    }

    // 2) Try OpenAI if enabled
    if (providerManager.isOpenAIEnabled()) {
      try {
        const openaiResult = await summarizeWithOpenAI(article);
        return openaiResult;
      } catch (openErr) {
        const msg = String(openErr?.message ?? '');
        if (/429|quota exceeded|too many requests|rate limit|rate-limited/i.test(msg)) {
          providerManager.disableOpenAI(msg);
          console.warn('[OpenAI Disabled]', msg);
        } else {
          console.warn('[OpenAI Error]', msg);
        }
      }
    } else {
      console.warn('[OpenAI Skipped] provider disabled');
    }

    // 3) Local fallback
    const fallback = buildFallback(article);
    console.warn('[Fallback Summary Generated]', normalizeText(article?.title));
    return fallback;
  } catch (err) {
    console.error('[summarizeArticle] Unexpected error', String(err?.message ?? ''));
    return buildFallback(article);
  }
}