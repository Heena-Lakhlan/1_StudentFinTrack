/**
 * Data access layer over LocalStorage.
 * All keys are namespaced by the current user's email.
 * Also contains shared helpers for summaries and algorithms.
 */
const SFT = (() => {
  // Predefined categories as requested
  const CATEGORIES = [
    { key: 'food_dining',     label: 'Food & dining' },
    { key: 'grocery',         label: 'Grocery' },
    { key: 'transportation',  label: 'Transportation' },
    { key: 'entertainment',   label: 'Entertainment' },
    { key: 'shopping',        label: 'Shopping' },
    { key: 'housing',         label: 'Housing' },
    { key: 'education',       label: 'Education' },
    { key: 'health_fitness',  label: 'Health & fitness' },
    { key: 'personal_care',   label: 'Personal care' },
    { key: 'others',          label: 'Others' }
  ];

  function userKey(prefix) {
    const email = localStorage.getItem('sft_currentUserEmail');
    if (!email) throw new Error('Not authenticated');
    return `sft_${email}_${prefix}`;
  }

  // Transactions
  function getTransactions() {
    return JSON.parse(localStorage.getItem(userKey('transactions')) || '[]');
  }
  function saveTransactions(list) {
    localStorage.setItem(userKey('transactions'), JSON.stringify(list));
  }
  function addTransaction(tx) {
    const list = getTransactions();
    const id = tx.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const entry = { ...tx, id };
    list.push(entry);
    saveTransactions(list);
    // Notify UI that a network attempt will start
    try { document.dispatchEvent(new CustomEvent('sft:net:start', { detail: { op: 'add', tx: entry } })); } catch (e) {}
    // Try to persist to server in background; fall back silently
    (async () => {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(tx.amount), date: tx.date, category: tx.category, description: tx.description || '' })
        });
        try { document.dispatchEvent(new CustomEvent('sft:net:done', { detail: { op: 'add', tx: entry } })); } catch (e) {}
      } catch (e) {
        try { document.dispatchEvent(new CustomEvent('sft:net:error', { detail: { op: 'add', tx: entry, error: e } })); } catch (err) {}
        // ignore - offline or server not available
      }
    })();
    return entry;
  }
  function updateTransaction(id, patch) {
    const list = getTransactions();
    const i = list.findIndex(t => t.id === id);
    if (i >= 0) {
      list[i] = { ...list[i], ...patch };
      saveTransactions(list);
      try { document.dispatchEvent(new CustomEvent('sft:net:start', { detail: { op: 'update', id, patch } })); } catch (e) {}
      (async () => {
        try {
          await fetch('/api/transactions/' + id, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
          });
          try { document.dispatchEvent(new CustomEvent('sft:net:done', { detail: { op: 'update', id, patch } })); } catch (e) {}
        } catch (e) { try { document.dispatchEvent(new CustomEvent('sft:net:error', { detail: { op: 'update', id, patch, error: e } })); } catch (err) {} }
      })();
    }
  }
  function deleteTransaction(id) {
    saveTransactions(getTransactions().filter(t => t.id !== id));
    try { document.dispatchEvent(new CustomEvent('sft:net:start', { detail: { op: 'delete', id } })); } catch (e) {}
    (async () => {
      try {
        await fetch('/api/transactions/' + id, { method: 'DELETE', credentials: 'same-origin' });
        try { document.dispatchEvent(new CustomEvent('sft:net:done', { detail: { op: 'delete', id } })); } catch (e) {}
      } catch (e) { try { document.dispatchEvent(new CustomEvent('sft:net:error', { detail: { op: 'delete', id, error: e } })); } catch (err) {} }
    })();
  }
  function txBetween(startISO, endISO) {
    return getTransactions().filter(t => t.date >= startISO && t.date <= endISO);
  }
  function txInCurrentPeriod(cadence) {
    const { start, end } = periodRange(cadence);
    return getTransactions().filter(t => t.date >= toISODateString(start) && t.date < toISODateString(end));
  }
  function sumByCategory(txs) {
    const map = {};
    CATEGORIES.forEach(c => map[c.key] = 0);
    txs.forEach(t => { map[t.category] = (map[t.category] || 0) + Number(t.amount || 0); });
    return map;
  }

  // Budgets
  function getBudgets() {
    return JSON.parse(localStorage.getItem(userKey('budgets')) || '{}');
  }
  function saveBudgets(b) {
    localStorage.setItem(userKey('budgets'), JSON.stringify(b));
  }

  // Friends for shared expenses
  function getFriends() { return JSON.parse(localStorage.getItem(userKey('friends')) || '[]'); }
  function saveFriends(list) { localStorage.setItem(userKey('friends'), JSON.stringify(list)); }

  // Shared expenses
  function getShared() { return JSON.parse(localStorage.getItem(userKey('shared')) || '[]'); }
  function saveShared(list) { localStorage.setItem(userKey('shared'), JSON.stringify(list)); }
  function addShared(exp) {
    const list = getShared();
    list.push({ ...exp, id: exp.id || `${Date.now()}_${Math.random().toString(36).slice(2)}` });
    saveShared(list);
  }
  function updateShared(id, patch) {
    const list = getShared();
    const i = list.findIndex(e => e.id === id);
    if (i >= 0) {
      list[i] = { ...list[i], ...patch };
      saveShared(list);
    }
  }
  function deleteShared(id) { saveShared(getShared().filter(e => e.id !== id)); }

  // Savings Goals
  function getGoals() { return JSON.parse(localStorage.getItem(userKey('goals')) || '[]'); }
  function saveGoals(list) { localStorage.setItem(userKey('goals'), JSON.stringify(list)); }
  function addGoal(g) { const list = getGoals(); list.push({ ...g, id: g.id || `${Date.now()}_${Math.random().toString(36).slice(2)}` }); saveGoals(list); }
  function updateGoal(id, patch) { const l=getGoals(); const i=l.findIndex(x=>x.id===id); if(i>=0){ l[i]={...l[i],...patch}; saveGoals(l);} }
  function deleteGoal(id) { saveGoals(getGoals().filter(x => x.id !== id)); }

  // Minimum cash flow settlement suggestions for shared expenses
  function calcSettlements() {
    const currentName = getUsers().find(u => u.email === getCurrentUserEmail())?.name || 'You';
    const people = [currentName, ...getFriends()];
    // Net balance: positive means owed money; negative means owes money
    const net = {}; people.forEach(p => net[p] = 0);

    getShared().forEach(e => {
      const amount = Number(e.amount || 0);
      if (!amount || !Array.isArray(e.participants) || e.participants.length === 0) return;
      const share = amount / e.participants.length;
      e.participants.forEach(p => { net[p] -= share; }); // participants owe
      net[e.payer] = (net[e.payer] || 0) + amount;      // payer fronted cost
    });

    // Round to cents
    Object.keys(net).forEach(k => net[k] = Math.round(net[k] * 100) / 100);

    const debtors = Object.entries(net).filter(([_,v])=>v<0).map(([p,v])=>({p, amt:-v})).sort((a,b)=>b.amt-a.amt);
    const creditors = Object.entries(net).filter(([_,v])=>v>0).map(([p,v])=>({p, amt:v})).sort((a,b)=>b.amt-a.amt);

    const txs = [];
    let i=0, j=0;
    while (i<debtors.length && j<creditors.length) {
      const pay = Math.min(debtors[i].amt, creditors[j].amt);
      if (pay > 0.009) txs.push({ from: debtors[i].p, to: creditors[j].p, amount: Math.round(pay*100)/100 });
      debtors[i].amt -= pay; creditors[j].amt -= pay;
      if (debtors[i].amt < 0.01) i++;
      if (creditors[j].amt < 0.01) j++;
    }
    return txs;
  }

  // Simple rule-based suggestions for savings goals (no external AI)
  function goalSuggestions() {
    const end = new Date();
    const start = new Date(Date.now() - 30*24*3600*1000);
    const txs = txBetween(toISODateString(start), toISODateString(end));
    const perCat = sumByCategory(txs);
    const top = Object.entries(perCat).sort((a,b)=>b[1]-a[1]).slice(0,2);
    const labelFor = (k)=> CATEGORIES.find(c=>c.key===k)?.label || k;

    const sugs = [];
    if (top[0]) sugs.push({
      name: `Reduce ${labelFor(top[0][0])} spending`,
      target: Math.max(100, Math.round(top[0][1]*0.2)),
      weeks: 8,
      reason: `Set aside ~20% of your last 30 days' ${labelFor(top[0][0])} spending.`
    });
    if (top[1]) sugs.push({
      name: `Buffer for ${labelFor(top[1][0])}`,
      target: Math.max(80, Math.round(top[1][1]*0.15)),
      weeks: 6,
      reason: `Build a buffer for ${labelFor(top[1][0])} to smooth future expenses.`
    });
    sugs.push({
      name: 'Emergency fund',
      target: 500, weeks: 12,
      reason: 'Start a $500 emergency fund with small weekly contributions.'
    });
    return sugs;
  }

  // Migration helper: push LocalStorage transactions to server (idempotent)
  async function migrateLocalToServer() {
    if (!window.fetch) return;
    const txs = getTransactions();
    if (!txs || !txs.length) return;
    for (const t of txs) {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(t.amount), date: t.date, category: t.category, description: t.description || '' })
        });
      } catch (e) {
        // stop on failure to avoid partial migration
        return;
      }
    }
    // if all succeeded, clear local transactions
    try { saveTransactions([]); } catch (e) {}
  }

  return {
    CATEGORIES,
    // Transactions
    getTransactions, saveTransactions, addTransaction, updateTransaction, deleteTransaction, txBetween, txInCurrentPeriod, sumByCategory,
    // Budgets
    getBudgets, saveBudgets,
    // Friends + Shared
    getFriends, saveFriends, getShared, saveShared, addShared, updateShared, deleteShared, calcSettlements,
    // Goals
    getGoals, saveGoals, addGoal, updateGoal, deleteGoal, goalSuggestions
  };
})();