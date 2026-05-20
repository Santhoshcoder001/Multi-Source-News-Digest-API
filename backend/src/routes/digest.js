import express from 'express';
import { getDigestStore, getLatestDigest } from '../services/newsScheduler.js';

const router = express.Router();

function parseLimit(value) {
  if (value === undefined) {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function filterClustersBySentiment(clusters, sentiment) {
  if (!sentiment) {
    return clusters;
  }

  return clusters
    .map((cluster) => ({
      ...cluster,
      articles: Array.isArray(cluster.articles)
        ? cluster.articles.filter((article) => article?.sentiment === sentiment)
        : []
    }))
    .filter((cluster) => cluster.articles.length > 0);
}

function buildDigestResponse(entry, query) {
  const sentiment = String(query?.sentiment ?? '').trim().toLowerCase();
  const limit = parseLimit(query?.limit);
  let clusters = Array.isArray(entry?.clusters) ? entry.clusters : [];

  if (['positive', 'neutral', 'negative'].includes(sentiment)) {
    clusters = filterClustersBySentiment(clusters, sentiment);
  }

  if (limit !== null) {
    clusters = clusters.slice(0, limit);
  }

  const articleCount = clusters.reduce((total, cluster) => total + (Array.isArray(cluster.articles) ? cluster.articles.length : 0), 0);

  return {
    success: true,
    lastUpdated: entry?.lastUpdated ?? null,
    clusterCount: clusters.length,
    articleCount,
    clusters
  };
}

router.get('/digest', (request, response) => {
  const startedAt = Date.now();
  const requestedDate = String(request.query?.date ?? '').trim();
  const storeEntry = requestedDate ? getDigestStore().get(requestedDate) ?? null : getLatestDigest();

  if (!storeEntry) {
    return response.status(503).json({
      success: false,
      message: 'Digest is not available yet. Please try again later.'
    });
  }

  const payload = buildDigestResponse(storeEntry, request.query);
  const responseTime = `${Date.now() - startedAt}ms`;

  response.setHeader('X-Response-Time', responseTime);
  console.log('[digest] GET /api/digest', {
    query: request.query,
    responseTime
  });

  return response.json(payload);
});

export default router;
