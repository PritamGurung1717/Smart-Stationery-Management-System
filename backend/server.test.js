import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './server.js';
import mongoose from 'mongoose';

beforeAll(async () => {
  // Wait for MongoDB connection (optional for health check test, but good practice)
  if (mongoose.connection.readyState === 0) {
    await new Promise(resolve => mongoose.connection.once('open', resolve));
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Backend API Health Check', () => {
  test('GET /api/health should return 200 OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});

describe('Products API', () => {
  test('GET /api/products should return products list', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.products)).toBe(true);
  });
});
