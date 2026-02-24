/**
 * Health check endpoint.
 */

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns success and data null', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body).toEqual({
      status: 'success',
      message: 'OK',
      data: null,
    });
  });
});
