import { summarizeArticle } from '../services/articleSummarizer.js';
import { clusterArticles } from '../services/clusterer.js';

const CONCURRENCY_LIMIT = 3;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function buildDisplayTitle(article) {
  return normalizeText(article?.title) || 'Untitled article';
}

function filterArticles(articles) {
  if (!Array.isArray(articles)) {
    return [];
  }

  return articles.filter((article) => {
    const title = normalizeText(article?.title);
    const description = normalizeText(article?.description);

    return Boolean(title && description);
  });
}

async function runWithConcurrencyLimit(items, limit, handler) {
  const safeLimit = Math.max(1, Number.parseInt(String(limit), 10) || 1);
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      results[currentIndex] = await handler(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(safeLimit, items.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Process news articles by summarizing them and clustering the enriched results.
 *
 * @param {Array<{title?: string, description?: string, content?: string}>} articles - Articles to process.
 * @returns {Promise<Array<{clusterId: string, topic: string, articles: Array<object>, keywords: string[]}>>}
 */
export async function processArticles(articles) {
  const startedAt = Date.now();
  const cleanedArticles = filterArticles(articles);

  if (!cleanedArticles.length) {
    console.log('[processors] No valid articles to process');
    console.log(`[processors] Total time taken: ${Date.now() - startedAt}ms`);
    return clusterArticles([]);
  }

  await runWithConcurrencyLimit(cleanedArticles, CONCURRENCY_LIMIT, async (article, index) => {
    const position = index + 1;
    const total = cleanedArticles.length;

    console.log(`Processing article ${position} of ${total}: ${buildDisplayTitle(article)}...`);

    const summaryResult = await summarizeArticle(article);

    article.summary = summaryResult?.summary ?? normalizeText(article?.description);
    article.sentiment = summaryResult?.sentiment ?? 'neutral';

    return article;
  });

  const clusters = await clusterArticles(cleanedArticles);

  console.log(`[processors] Total time taken: ${Date.now() - startedAt}ms`);

  return clusters;
}