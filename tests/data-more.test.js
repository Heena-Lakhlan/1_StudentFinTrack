const fs = require('fs');
const path = require('path');

// Helper to load common.js then data.js into the jsdom window and return SFT
function loadSFT(window) {
  const commonSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'common.js'), 'utf8');
  const dataSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'data.js'), 'utf8');
  // Evaluate common (defines getUsers/getCurrentUserEmail etc) then data
  // eslint-disable-next-line no-new-func
  const run = new Function('window', commonSrc + '\n' + dataSrc + '\nreturn SFT;');
  return run(window);
}

describe('SFT data layer - additional tests', () => {
  let SFT;
  beforeEach(() => {
    window.localStorage.clear();
    // seed current user and users list used by common.js helpers
    window.localStorage.setItem('sft_currentUserEmail', 'demo@studentfintrack.app');
    const users = [
      { email: 'demo@studentfintrack.app', password: 'demo123', name: 'Demo User' },
      { email: 'alex@studentfintrack.app', password: 'alex123', name: 'Alex' }
    ];
    window.localStorage.setItem('sft_users', JSON.stringify(users));
    SFT = loadSFT(window);
  });

  test('add, update and delete transactions', () => {
    expect(SFT.getTransactions()).toHaveLength(0);

    SFT.addTransaction({ amount: 10.5, date: '2025-11-01', category: 'grocery' });
    let txs = SFT.getTransactions();
    expect(txs).toHaveLength(1);
    expect(Number(txs[0].amount)).toBeCloseTo(10.5);

    const id = txs[0].id;
    SFT.updateTransaction(id, { amount: 12.0 });
    txs = SFT.getTransactions();
    expect(Number(txs[0].amount)).toBeCloseTo(12.0);

    SFT.deleteTransaction(id);
    expect(SFT.getTransactions()).toHaveLength(0);
  });

  test('sumByCategory aggregates correctly', () => {
    const sample = [
      { id: 'a', amount: 5, category: 'grocery' },
      { id: 'b', amount: 7.5, category: 'grocery' },
      { id: 'c', amount: 3, category: 'entertainment' }
    ];
    const sums = SFT.sumByCategory(sample);
    expect(sums.grocery).toBeCloseTo(12.5);
    expect(sums.entertainment).toBeCloseTo(3);
  });

  test('save and get budgets', () => {
    const b = { grocery: 200, entertainment: 100 };
    SFT.saveBudgets(b);
    expect(SFT.getBudgets()).toEqual(b);
  });

  test('shared expense settlements produce expected suggestion', () => {
    // friends list stores names (common.js render uses getFriends elsewhere)
    window.localStorage.setItem('sft_demo@studentfintrack.app_friends', JSON.stringify(['Alex']));
    // add a shared expense: Demo User paid $20 for Alex and Demo User
    SFT.addShared({ payer: 'Demo User', participants: ['Alex', 'Demo User'], amount: 20 });
    const settles = SFT.calcSettlements();
    // Alex should pay Demo User $10
    expect(settles.some(s => s.from === 'Alex' && s.to === 'Demo User' && s.amount === 10)).toBe(true);
  });

  test('goalSuggestions returns sensible suggestions', () => {
    // seed some recent transactions to make food_dining top category
    const now = new Date();
    const iso = (d) => d.toISOString().slice(0,10);
    SFT.saveTransactions([
      { id: 't1', amount: 120, date: iso(new Date(now - 5*24*3600*1000)), category: 'food_dining' },
      { id: 't2', amount: 80, date: iso(new Date(now - 10*24*3600*1000)), category: 'food_dining' },
      { id: 't3', amount: 50, date: iso(new Date(now - 3*24*3600*1000)), category: 'grocery' }
    ]);
    const sugs = SFT.goalSuggestions();
    expect(Array.isArray(sugs)).toBe(true);
    expect(sugs.length).toBeGreaterThanOrEqual(1);
    // first suggestion should reference reducing a category
    expect(sugs[0].name.toLowerCase()).toContain('reduce');
  });
});
