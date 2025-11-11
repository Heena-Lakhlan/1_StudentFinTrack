const request = require('supertest');
const path = require('path');

const app = require(path.join(__dirname, '..', 'server'));

describe('Server endpoints', () => {
  test('serves index.html at root', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Welcome to StudentFinTrack/);
  });

  test('login endpoint accepts demo credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'demo@studentfintrack.app', password: 'demo123' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'demo@studentfintrack.app');
  });
});
