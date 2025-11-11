const fs = require('fs');
const path = require('path');

describe('SFT data layer (LocalStorage)', () => {
  beforeEach(() => {
    // ensure a fresh jsdom localStorage
    window.localStorage.clear();
    // Set a current user so SFT.userKey() won't throw
    window.localStorage.setItem('sft_currentUserEmail', 'demo@studentfintrack.app');
  });

  test('getTransactions returns stored transactions', () => {
    const sample = [{ id: 't1', amount: 12.34 }];
    // Pre-seed storage for this user
    window.localStorage.setItem('sft_demo@studentfintrack.app_transactions', JSON.stringify(sample));

    // Load the script into the jsdom environment
    const dataSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'data.js'), 'utf8');
    // Evaluate in the window scope
    // eslint-disable-next-line no-new-func
    const run = new Function('window', dataSrc + '\nreturn SFT;');
    const SFT = run(window);

    const tx = SFT.getTransactions();
    expect(Array.isArray(tx)).toBe(true);
    expect(tx).toHaveLength(1);
    expect(tx[0].amount).toBeCloseTo(12.34);
  });
});
