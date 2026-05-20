import request from 'supertest';
import app from '../index.js';
import { jest } from '@jest/globals';
import env from '../config/env.js';

jest.mock('../services/newsScheduler.js', () => ({
  getDigestStore: jest.fn(() => new Map()),
  getLatestDigest: jest.fn(() => ({
    lastUpdated: new Date().toISOString(),
    clusters: [
      {
        topic: 'Technology',
        keywords: ['AI', 'Tech'],
        articles: [
          { title: 'Tech news 1', sentiment: 'positive' },
          { title: 'Tech news 2', sentiment: 'neutral' }
        ]
      }
    ]
  })),
  startScheduler: jest.fn().mockResolvedValue(undefined)
}));

describe('Digest API', () => {
  it('GET /api/digest - should return the latest digest', async () => {
    const response = await request(app).get('/api/digest').set('x-api-key', env.API_SECRET_KEY);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.clusterCount).toBe(1);
    expect(response.body.articleCount).toBe(2);
  });

  it('GET /api/digest?sentiment=positive - should filter by sentiment', async () => {
    const response = await request(app).get('/api/digest?sentiment=positive').set('x-api-key', env.API_SECRET_KEY);
    expect(response.status).toBe(200);
    expect(response.body.clusters[0].articles.length).toBe(1);
    expect(response.body.clusters[0].articles[0].sentiment).toBe('positive');
  });
});
