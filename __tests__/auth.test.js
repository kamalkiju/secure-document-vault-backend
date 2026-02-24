/**
 * Security-focused tests: register, login, unauthorized, RBAC.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Auth & Security', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    role: 'member',
  };

  describe('POST /api/auth/register', () => {
    it('registers and returns user and token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toMatchObject({
        email: testUser.email,
        role: testUser.role,
      });
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe('string');
    });

    it('rejects duplicate email with 409', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('returns generic "Invalid credentials" for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword1!' })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns generic "Invalid credentials" for unknown user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'AnyPass1!' })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('Unauthorized access', () => {
    it('GET /api/documents returns 401 without token', async () => {
      const res = await request(app)
        .get('/api/documents')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/auth|token/i);
    });

    it('POST /api/documents (upload) returns 401 without token', async () => {
      await request(app)
        .post('/api/documents')
        .attach('file', Buffer.from('fake'), { filename: 'test.pdf', contentType: 'application/pdf' })
        .expect(401);
    });

    it('GET /api/folders returns 401 without token', async () => {
      await request(app)
        .get('/api/folders')
        .expect(401);
    });
  });

  describe('RBAC', () => {
    let viewerToken;
    let adminToken;

    beforeAll(async () => {
      const adminEmail = `admin-${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({ email: adminEmail, password: 'AdminPass123!', role: 'admin' });

      const viewerEmail = `viewer-${Date.now()}@example.com`;
      const viewerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: viewerEmail, password: 'ViewerPass123!', role: 'viewer' });
      viewerToken = viewerRes.body.data.token;

      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password: 'AdminPass123!' });
      adminToken = adminRes.body.data.token;
    });

    it('viewer cannot access GET /api/audit/export (admin only)', async () => {
      const res = await request(app)
        .get('/api/audit/export?startDate=2020-01-01&endDate=2030-01-01')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/permission|insufficient/i);
    });

    it('admin can access GET /api/audit/export', async () => {
      const res = await request(app)
        .get('/api/audit/export?startDate=2020-01-01&endDate=2030-01-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });
  });
});
