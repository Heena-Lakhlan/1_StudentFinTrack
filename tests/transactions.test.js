const request = require('supertest');
const path = require('path');

const app = require(path.join(__dirname, '..', 'server'));
const prisma = (() => {
  try { return require('../server/db'); } catch (e) { return null; }
})();

describe('Transactions API (integration)', () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    // login demo user via existing in-memory users
    await agent.post('/api/login').send({ email: 'demo@studentfintrack.app', password: 'demo123' });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.transaction.deleteMany({});
      // keep demo user
      await prisma.$disconnect();
    }
  });

  test('unauthorized cannot get transactions', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  test('CRUD transactions for authenticated user', async () => {
    // Create
    const createRes = await agent.post('/api/transactions').send({ amount: 12.5, date: new Date().toISOString(), category: 'food_dining', description: 'test meal' });
    expect([201, 200]).toContain(createRes.status);
    expect(createRes.body.ok).toBe(true);
    const tx = createRes.body.tx;

    // Read
    const listRes = await agent.get('/api/transactions');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // Update
    const updRes = await agent.put(`/api/transactions/${tx.id}`).send({ amount: 15.0 });
    expect(updRes.status).toBe(200);
    expect(updRes.body.tx.amount).toBeCloseTo(15.0);

    // Delete
    const delRes = await agent.delete(`/api/transactions/${tx.id}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.ok).toBe(true);
  });
});
