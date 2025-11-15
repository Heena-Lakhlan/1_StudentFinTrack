const fs = require('fs');
const path = require('path');

function loadCommonAndData(window) {
  const commonSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'common.js'), 'utf8');
  const dataSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'data.js'), 'utf8');
  // Evaluate common then data in the jsdom window
  // eslint-disable-next-line no-new-func
  return new Function('window', commonSrc + '\n' + dataSrc + '\nreturn { openAddTxModal, SFT };')(window);
}

describe('UI - Add Transaction modal', () => {
  let openAddTxModal, SFT;
  beforeEach(() => {
    document.body.innerHTML = '<div id="modalRoot"></div>';
    window.localStorage.clear();
    window.localStorage.setItem('sft_users', JSON.stringify([{ email: 'demo@studentfintrack.app', name: 'Demo User' }]));
    window.localStorage.setItem('sft_currentUserEmail', 'demo@studentfintrack.app');
    const loaded = loadCommonAndData(window);
    openAddTxModal = loaded.openAddTxModal;
    SFT = loaded.SFT;
  });

  test('can open modal, submit and transaction saved', () => {
    expect(SFT.getTransactions()).toHaveLength(0);
    openAddTxModal();
    // modal should render form
    const amountInput = document.getElementById('txAmount');
    const dateInput = document.getElementById('txDate');
    const catInput = document.getElementById('txCategory');
    expect(amountInput).toBeTruthy();
    amountInput.value = '15.25';
    dateInput.value = '2025-11-14';
    catInput.value = catInput.options[0].value;

    // submit the form
    const form = document.getElementById('addTxForm');
    const ev = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);

    const txs = SFT.getTransactions();
    expect(txs).toHaveLength(1);
    expect(Number(txs[0].amount)).toBeCloseTo(15.25);
    // modal closed
    expect(document.getElementById('modalRoot').innerHTML).toBe('');
  });
});
