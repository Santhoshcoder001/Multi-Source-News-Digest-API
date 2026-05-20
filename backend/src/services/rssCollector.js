import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';

const parser = new Parser();

/**
 * Default RSS feeds that can be used when selecting a news source.
 */
export const DEFAULT_RSS_FEEDS = {
  BBC_NEWS: 'http://feeds.bbci.co.uk/news/rss.xml',
  REUTERS_TOP_NEWS: 'https://feeds.reuters.com/reuters/topNews'
};

/**
 * Convert a feed item into the app's normalized article shape.
 *
 * @param {object} item - Raw RSS feed item.
 * @param {string} sourceName - Human-readable source name.
 * @returns {{id: string, title: string, description: string, content: string, url: string, source: string, publishedAt: string, category: 'general'}}
 */
function normalizeItem(item, sourceName) {
  const publishedAt = item?.isoDate ?? item?.pubDate ?? new Date().toISOString();

  return {
    id: uuidv4(),
    title: item?.title ?? '',
    description: item?.contentSnippet ?? item?.summary ?? '',
    content: item?.content ?? item?.contentSnippet ?? '',
    url: item?.link ?? '',
    source: sourceName,
    publishedAt: new Date(publishedAt).toISOString(),
    category: 'general'
  };
}

/**
 * Fetch and normalize articles from an RSS feed.
 *
 * @param {string} feedUrl - RSS feed URL.
 * @param {string} sourceName - Human-readable source name.
 * @returns {Promise<Array<{id: string, title: string, description: string, content: string, url: string, source: string, publishedAt: string, category: 'general'}>>}
 */
export async function fetchFromRss(feedUrl, sourceName) {
  try {
    if (!feedUrl || !sourceName) {
      return [];
    }

    const feed = await parser.parseURL(feedUrl);
    const items = Array.isArray(feed?.items) ? feed.items : [];

    return items
      .map((item) => ({
        item,
        publishedTime: new Date(item?.isoDate ?? item?.pubDate ?? 0).getTime() || 0
      }))
      .sort((left, right) => right.publishedTime - left.publishedTime)
      .slice(0, 15)
      .map(({ item }) => normalizeItem(item, sourceName));
  } catch (error) {
    console.error(`[rssCollector] Failed to fetch or parse RSS feed from ${feedUrl}`, error);
    return [];
  }
}