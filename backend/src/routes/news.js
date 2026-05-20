import express from 'express';
import { fetchFromRss } from '../services/rssCollector.js';

const router = express.Router();

// Simple in-memory cache to avoid repeated requests
const cache = new Map(); // key -> { expiresAt, data }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function now() {
  return Date.now();
}

function getFeedsForCategory(category) {
  const feeds = {
    local: [
      { url: 'https://news.google.com/rss/search?q=Vellore', name: 'Google News - Vellore' },
      { url: 'https://news.google.com/rss/search?q=Katpadi', name: 'Google News - Katpadi' }
    ],
    state: [
      { url: 'https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss', name: 'The Hindu - Tamil Nadu' },
      { url: 'https://www.dinamalar.com/rss.asp', name: 'Dinamalar' },
      { url: 'https://news.google.com/rss/search?q=Tamil+Nadu', name: 'Google News - Tamil Nadu' }
    ],
    national: [
      { url: 'https://news.google.com/rss/search?q=India', name: 'Google News - India' },
      { url: 'https://education.economictimes.indiatimes.com/news?utm_source=main_menu&utm_medium=staticpage', name: 'Economic Times' }
    ],
    international: [
      { url: 'http://feeds.bbci.co.uk/news/rss.xml', name: 'BBC' },
      { url: 'https://feeds.reuters.com/reuters/topNews', name: 'Reuters' },
      { url: 'https://rss.cnn.com/rss/edition.rss', name: 'CNN' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera' }
    ]
  };

  return feeds[category] || [];
}

function normalizeArticle(item, sourceName) {
  return {
    title: String(item?.title ?? '').trim(),
    summary: String(item?.description ?? item?.contentSnippet ?? item?.content ?? '').trim(),
    source: sourceName,
    sourceUrl: String(item?.link ?? item?.guid ?? '').trim(),
    publishedAt: item?.isoDate ? new Date(item.isoDate).toISOString() : (item?.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()),
    category: null
  };
}

function dedupeArticles(items) {
  const seen = new Set();
  const result = [];

  for (const it of items) {
    const key = String(it.title ?? '').trim().toLowerCase().slice(0, 100);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(it);
  }

  return result;
}

async function aggregateFeeds(feedList, categoryTag) {
  const collected = [];

  for (const feed of feedList) {
    try {
      const articles = await fetchFromRss(feed.url, feed.name);
      if (Array.isArray(articles) && articles.length) {
        for (const a of articles) {
          const normalized = normalizeArticle(a, feed.name);
          normalized.category = categoryTag;
          collected.push(normalized);
        }
      }
    } catch (err) {
      // skip failing feed (rssCollector already warns)
      console.warn('[newsRoute] Feed failed', feed.url, String(err?.message ?? ''));
    }
  }

  // dedupe and sort
  const deduped = dedupeArticles(collected);

  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return deduped;
}

router.get('/news/:category', async (req, res) => {
  try {
    const category = String(req.params.category ?? '').trim().toLowerCase();

    if (!['local', 'state', 'national', 'international'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    const cacheKey = `news_${category}`;
    const entry = cache.get(cacheKey);

    if (entry && entry.expiresAt > now()) {
      return res.json({ success: true, source: 'cache', category, articles: entry.data });
    }

    const feeds = getFeedsForCategory(category);
    const articles = await aggregateFeeds(feeds, category);

    cache.set(cacheKey, { data: articles, expiresAt: now() + CACHE_TTL_MS });

    return res.json({ success: true, source: 'live', category, articles });
  } catch (error) {
    console.warn('[newsRoute] Aggregation error', String(error?.message ?? ''));
    return res.status(500).json({ success: false, error: 'Failed to aggregate news' });
  }
});

// Generic news endpoint returning combined categories when no category specified
router.get('/news', async (req, res) => {
  try {
    const categories = ['local', 'state', 'national', 'international'];
    const all = [];

    for (const cat of categories) {
      const cacheKey = `news_${cat}`;
      const entry = cache.get(cacheKey);
      if (entry && entry.expiresAt > now()) {
        all.push(...entry.data);
        continue;
      }
      const feeds = getFeedsForCategory(cat);
      const articles = await aggregateFeeds(feeds, cat);
      cache.set(cacheKey, { data: articles, expiresAt: now() + CACHE_TTL_MS });
      all.push(...articles);
    }

    const deduped = dedupeArticles(all);
    deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return res.json({ success: true, categories: ['local', 'state', 'national', 'international'], articles: deduped });
  } catch (error) {
    console.warn('[newsRoute] Aggregation error', String(error?.message ?? ''));
    return res.status(500).json({ success: false, error: 'Failed to aggregate news' });
  }
});

// Trending endpoint: return top 10 recent articles across categories
router.get('/trending', async (req, res) => {
  try {
    const categories = ['local', 'state', 'national', 'international'];
    const all = [];

    for (const cat of categories) {
      const cacheKey = `news_${cat}`;
      const entry = cache.get(cacheKey);
      if (entry && entry.expiresAt > now()) {
        all.push(...entry.data);
        continue;
      }
      const feeds = getFeedsForCategory(cat);
      const articles = await aggregateFeeds(feeds, cat);
      cache.set(cacheKey, { data: articles, expiresAt: now() + CACHE_TTL_MS });
      all.push(...articles);
    }

    const deduped = dedupeArticles(all);
    deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return res.json({ success: true, articles: deduped.slice(0, 10) });
  } catch (error) {
    console.warn('[newsRoute] Trending error', String(error?.message ?? ''));
    return res.status(500).json({ success: false, error: 'Failed to compute trending' });
  }
});

export default router;
