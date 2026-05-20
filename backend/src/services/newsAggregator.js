import { fetchFromNewsApi } from './newsCollector.js';
import { DEFAULT_RSS_FEEDS, fetchFromRss } from './rssCollector.js';

const TITLE_LIMIT = 60;

/**
 * Normalize a title for deduplication by trimming, lowercasing, and limiting to the first 60 characters.
 *
 * @param {string} title - Article title.
 * @returns {string}
 */
function buildDedupeKey(title) {
  return String(title ?? '')
    .trim()
    .toLowerCase()
    .slice(0, TITLE_LIMIT);
}

/**
 * Collect articles from all configured sources, deduplicate them, and return the combined result.
 *
 * Collectors are executed in parallel and partial failures are ignored.
 *
 * @returns {Promise<Array<{id: string, title: string, description: string, content: string, url: string, source: string, publishedAt: string, category: string}>>}
 */
export async function collectAllNews() {
  const jobs = [
    {
      label: 'NewsAPI technology',
      promise: fetchFromNewsApi('technology')
    },
    {
      label: 'NewsAPI science',
      promise: fetchFromNewsApi('science')
    },
    {
      label: 'NewsAPI business',
      promise: fetchFromNewsApi('business')
    },
    {
      label: 'BBC RSS',
      promise: fetchFromRss(DEFAULT_RSS_FEEDS.BBC_NEWS, 'BBC News')
    },
    {
      label: 'Reuters RSS',
      promise: fetchFromRss(DEFAULT_RSS_FEEDS.REUTERS_TOP_NEWS, 'Reuters')
    }
  ];

  const settledResults = await Promise.allSettled(jobs.map(({ promise }) => promise));
  const collectedArticles = [];

  settledResults.forEach((result, index) => {
    const { label } = jobs[index];

    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      console.log(`[newsAggregator] ${label}: ${result.value.length} articles`);
      collectedArticles.push(...result.value);
      return;
    }

    const reason = result.status === 'rejected' ? result.reason : new Error('Collector returned a non-array result');
    console.error(`[newsAggregator] ${label} failed`, reason);
    console.log(`[newsAggregator] ${label}: 0 articles`);
  });

  const dedupedArticles = [];
  const seenTitles = new Set();

  for (const article of collectedArticles) {
    const titleKey = buildDedupeKey(article?.title);

    if (!titleKey || seenTitles.has(titleKey)) {
      continue;
    }

    seenTitles.add(titleKey);
    dedupedArticles.push(article);
  }

  return dedupedArticles;
}