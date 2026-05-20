import express from 'express';
import { getLatestDigest } from '../services/newsScheduler.js';

const router = express.Router();

function getAvailableTopics() {
  const digest = getLatestDigest();
  const clusters = Array.isArray(digest?.clusters) ? digest.clusters : [];

  return clusters.map((cluster) => cluster?.topic).filter(Boolean);
}

function findMatchingClusters(searchTerm) {
  const digest = getLatestDigest();
  const clusters = Array.isArray(digest?.clusters) ? digest.clusters : [];

  return clusters.filter((cluster) => {
    const topic = String(cluster?.topic ?? '').toLowerCase();
    const keywords = Array.isArray(cluster?.keywords) ? cluster.keywords.map((keyword) => String(keyword).toLowerCase()) : [];

    return topic.includes(searchTerm) || keywords.some((keyword) => keyword.includes(searchTerm));
  });
}

router.get('/topics', (request, response) => {
  const topics = getAvailableTopics();

  return response.json({
    success: true,
    topics
  });
});

router.get('/topic/:name', (request, response) => {
  const searchTerm = decodeURIComponent(String(request.params.name ?? '')).trim().toLowerCase();
  const digest = getLatestDigest();
  const matchedClusters = findMatchingClusters(searchTerm);

  if (!matchedClusters.length) {
    return response.status(404).json({
      success: false,
      message: 'Topic not found',
      availableTopics: getAvailableTopics()
    });
  }

  const articleCount = matchedClusters.reduce((total, cluster) => total + (Array.isArray(cluster.articles) ? cluster.articles.length : 0), 0);

  return response.json({
    success: true,
    topic: searchTerm,
    clusters: matchedClusters,
    articleCount,
    lastUpdated: digest?.lastUpdated ?? null
  });
});

export default router;
