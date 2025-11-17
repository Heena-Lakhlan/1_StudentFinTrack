const request = require('supertest');
const path = require('path');

const app = require(path.join(__dirname, '..', 'server'));

describe('Protected API endpoints', () => {
  test('GET /api/protected is unauthorized without session', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('ok', false);
  });

  test('GET /api/protected returns data when authenticated', async () => {
    const agent = request.agent(app);
    const login = await agent
      .post('/api/login')
      .send({ email: 'demo@studentfintrack.app', password: 'demo123' })
      .set('Accept', 'application/json');
    expect(login.statusCode).toBe(200);
    expect(login.body).toHaveProperty('ok', true);

    const res = await agent.get('/api/protected');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('secret', 'this-is-protected');
  });
});
