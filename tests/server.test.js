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

  test('invalid credentials return 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'noone@example.com', password: 'wrong' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('ok', false);
    expect(res.body).toHaveProperty('message');
  });

  test('protected /api/me unauthorized without session', async () => {
    const res = await request(app).get('/api/me');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('ok', false);
  });

  test('session persists via agent and logout clears session', async () => {
    const agent = request.agent(app);

    // Login with agent
    const login = await agent
      .post('/api/login')
      .send({ email: 'demo@studentfintrack.app', password: 'demo123' })
      .set('Accept', 'application/json');
    expect(login.statusCode).toBe(200);
    expect(login.body).toHaveProperty('ok', true);

    // Should be able to GET /api/me
    const me = await agent.get('/api/me');
    expect(me.statusCode).toBe(200);
    expect(me.body).toHaveProperty('ok', true);
    expect(me.body.user).toHaveProperty('email', 'demo@studentfintrack.app');

    // Logout
    const out = await agent.post('/api/logout');
    expect(out.statusCode).toBe(200);

    // Now /api/me should be unauthorized
    const me2 = await agent.get('/api/me');
    expect(me2.statusCode).toBe(401);
  });
});
