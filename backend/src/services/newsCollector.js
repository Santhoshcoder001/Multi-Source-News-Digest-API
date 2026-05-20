import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';

const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';
const ALLOWED_CATEGORIES = new Set(['technology', 'science', 'business', 'health']);

/**
 * Normalize a NewsAPI article into the app's internal shape.
 *
 * @param {object} article - Raw article object returned by NewsAPI.
 * @param {string} category - The requested news category.
 * @returns {{id: string, title: string, description: string, content: string, url: string, source: string, publishedAt: string, category: string}}
 */
function normalizeArticle(article, category) {
  return {
    id: uuidv4(),
    title: article?.title ?? '',
    description: article?.description ?? '',
    content: article?.content ?? '',
    url: article?.url ?? '',
    source: article?.source?.name ?? '',
    publishedAt: article?.publishedAt ?? '',
    category
  };
}

/**
 * Fetch top headlines from NewsAPI and normalize the response.
 *
 * @param {string} category - One of technology, science, business, or health.
 * @param {number} [pageSize=10] - Maximum number of articles to request.
 * @returns {Promise<Array<{id: string, title: string, description: string, content: string, url: string, source: string, publishedAt: string, category: string}>>}
 */
export async function fetchFromNewsApi(category, pageSize = 10) {
  try {
    if (!ALLOWED_CATEGORIES.has(category)) {
      console.error(`[newsCollector] Invalid category: ${category}`);
      return [];
    }

    const normalizedPageSize = Number.parseInt(String(pageSize), 10);

    if (Number.isNaN(normalizedPageSize) || normalizedPageSize <= 0) {
      console.error(`[newsCollector] Invalid pageSize: ${pageSize}`);
      return [];
    }

    const response = await axios.get(NEWS_API_URL, {
      params: {
        category,
        pageSize: normalizedPageSize,
        apiKey: env.NEWS_API_KEY
      }
    });

    const articles = response?.data?.articles ?? [];

    if (!Array.isArray(articles)) {
      console.error('[newsCollector] Unexpected NewsAPI response shape');
      return [];
    }

    return articles.map((article) => normalizeArticle(article, category));
  } catch (error) {
    console.error('[newsCollector] Failed to fetch articles from NewsAPI', error);
    return [];
  }
}