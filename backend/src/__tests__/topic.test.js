import request from 'supertest';
import app from '../index.js';
import { jest } from '@jest/globals';
import env from '../config/env.js';

jest.mock('../services/newsScheduler.js', () => ({
  getLatestDigest: jest.fn(() => ({
    lastUpdated: new Date().toISOString(),
    clusters: [
      {
        topic: 'Space Exploration',
        keywords: ['NASA', 'Mars'],
        articles: [
          { title: 'Mars Rover', sentiment: 'positive' }
        ]
      }
    ]
  })),
  getDigestStore: jest.fn(() => new Map()),
  startScheduler: jest.fn().mockResolvedValue(undefined)
}));

describe('Topic API', () => {
  it('GET /api/topics - should return available topics', async () => {
    const response = await request(app).get('/api/topics').set('x-api-key', env.API_SECRET_KEY);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.topics).toContain('Space Exploration');
  });

  it('GET /api/topic/space - should return matching clusters', async () => {
    const response = await request(app).get('/api/topic/space').set('x-api-key', env.API_SECRET_KEY);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.clusters[0].topic).toBe('Space Exploration');
  });

  it('GET /api/topic/unknown - should return 404 for unknown topic', async () => {
    const response = await request(app).get('/api/topic/unknown').set('x-api-key', env.API_SECRET_KEY);
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
