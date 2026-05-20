import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

const MODEL_CANDIDATES = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 200;

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
let activeModelIndex = 0;

function getActiveModelName() {
  return MODEL_CANDIDATES[activeModelIndex] ?? MODEL_CANDIDATES[0];
}

function getModel() {
  return genAI.getGenerativeModel({
    model: getActiveModelName(),
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  });
}

function advanceModelFallback(error) {
  const message = String(error?.message ?? '');

  if (!/not found|not supported|404/i.test(message)) {
    return false;
  }

  if (activeModelIndex >= MODEL_CANDIDATES.length - 1) {
    return false;
  }

  activeModelIndex += 1;

  console.warn('[articleSummarizer] Falling back to alternate Gemini model', {
    nextModel: getActiveModelName(),
    reason: message
  });

  return true;
}

let rateLimitQueue = Promise.resolve();

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function queueRateLimitedTask(task) {
  const nextTask = rateLimitQueue
    .then(() => delay(RATE_LIMIT_DELAY_MS))
    .then(task);

  rateLimitQueue = nextTask.catch(() => {});

  return nextTask;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function buildFallback(article) {
  return {
    summary: normalizeText(article?.description),
    sentiment: 'neutral'
  };
}

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
}

function parseResponseJson(rawText) {
  if (!rawText) {
    throw new Error('Gemini returned an empty response');
  }

  const cleanedText = stripCodeFences(rawText);
  const parsed = JSON.parse(cleanedText);
  const summary = normalizeText(parsed?.summary);
  const sentiment = normalizeText(parsed?.sentiment).toLowerCase();

  if (!summary) {
    throw new Error('Gemini response is missing a summary');
  }

  if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
    throw new Error(`Gemini response returned an invalid sentiment: ${parsed?.sentiment}`);
  }

  return {
    summary,
    sentiment
  };
}

function buildPrompt(article) {
  const title = normalizeText(article?.title);
  const description = normalizeText(article?.description);
  const content = normalizeText(article?.content);

  return [
    'You are an article summarizer.',
    'Return ONLY valid JSON in this exact shape: {"summary": string, "sentiment": "positive" | "neutral" | "negative" }.',
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

async function summarizeOnce(article) {
  const prompt = buildPrompt(article);

  console.log('[articleSummarizer] Sending article to Gemini', {
    title: normalizeText(article?.title),
    hasDescription: Boolean(normalizeText(article?.description)),
    hasContent: Boolean(normalizeText(article?.content))
  });

  const result = await queueRateLimitedTask(() => getModel().generateContent(prompt));

  const response = await result.response;
  const rawText = response.text();

  console.log('[articleSummarizer] Gemini response received', {
    responseLength: rawText?.length ?? 0
  });

  return parseResponseJson(rawText);
}

/**
 * Summarize an article using Gemini and return a JSON payload with summary and sentiment.
 *
 * @param {{title?: string, description?: string, content?: string}} article - Article object to summarize.
 * @returns {Promise<{summary: string, sentiment: 'positive' | 'neutral' | 'negative'}>}
 */
export async function summarizeArticle(article) {
  const fallback = buildFallback(article);

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      console.log('[articleSummarizer] Attempt starting', {
        attempt,
        totalAttempts: RETRY_ATTEMPTS,
        title: normalizeText(article?.title)
      });

      return await summarizeOnce(article);
    } catch (error) {
      advanceModelFallback(error);

      console.error('[articleSummarizer] Summarization attempt failed', {
        attempt,
        totalAttempts: RETRY_ATTEMPTS,
        title: normalizeText(article?.title),
        model: getActiveModelName(),
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      });

      if (attempt < RETRY_ATTEMPTS) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  console.error('[articleSummarizer] Falling back to article description', {
    title: normalizeText(article?.title),
    fallback
  });

  return fallback;
}