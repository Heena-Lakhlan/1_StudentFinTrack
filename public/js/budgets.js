/**
 * Budgets page:
 * - Set cadence (monthly, weekly, annual), total budget, and category budgets
 * - Show overall + per-category progress
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('budgets');
  renderForm();
  renderProgress();
});

function renderForm() {
  const b = SFT.getBudgets();
  document.getElementById('cadence').value = b.cadence || 'monthly';
  document.getElementById('totalBudget').value = b.totalBudget || '';

  // Category inputs
  const wrap = document.getElementById('categoryBudgetInputs');
  wrap.innerHTML = '';
  SFT.CATEGORIES.forEach(c => {
    const val = b.categoryBudgets?.[c.key] || '';
    const item = document.createElement('div');
    item.className = 'box';
    item.style.flex = '1 1 240px';
    item.innerHTML = `
      <label>${c.label}</label>
      <input type="number" step="0.01" class="input" data-cat="${c.key}" placeholder="0.00" value="${val}">
    `;
    wrap.appendChild(item);
  });

  // Save total + cadence
  document.getElementById('budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const cadence = document.getElementById('cadence').value;
    const totalBudget = Number(document.getElementById('totalBudget').value || 0);
    const current = SFT.getBudgets();
    SFT.saveBudgets({ ...current, cadence, totalBudget });
    alert('Budget saved');
    renderProgress();
  });

  // Save per-category
  document.getElementById('saveCatBudgets').addEventListener('click', () => {
    const inputs = wrap.querySelectorAll('input[data-cat]');
    const map = {};
    inputs.forEach(inp => map[inp.getAttribute('data-cat')] = Number(inp.value || 0));
    const current = SFT.getBudgets();
    SFT.saveBudgets({ ...current, categoryBudgets: map });
    alert('Category budgets saved');
    renderProgress();
  });
}

function renderProgress() {
  const b = SFT.getBudgets();
  const cadence = b.cadence || 'monthly';
  const txs = SFT.txInCurrentPeriod(cadence);
  const spent = txs.reduce((s, t) => s + Number(t.amount || 0), 0);
  const total = Number(b.totalBudget || 0);
  const util = total > 0 ? spent / total : 0;

  const wrap = document.getElementById('budgetProgress');
  wrap.innerHTML = '';

  // Overall progress
  const overall = document.createElement('div');
  overall.className = 'box';
  overall.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong>Overall (${cadence})</strong>
      <span class="text-muted">${fmtUSD(spent)}${total ? ' / ' + fmtUSD(total) : ''}</span>
    </div>
    <div class="progress"><span id="overallBar" style="width:${Math.min(100, Math.round(util*100))}%"></span></div>
  `;
  wrap.appendChild(overall);

  // Per category progress
  const perCat = SFT.sumByCategory(txs);
  SFT.CATEGORIES.forEach(cat => {
    const budget = Number(b.categoryBudgets?.[cat.key] || 0);
    const used = Number(perCat[cat.key] || 0);
    const ratio = budget > 0 ? used / budget : 0;
    const pct = Math.min(100, Math.round(ratio * 100));

    const item = document.createElement('div');
    item.className = 'box';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${cat.label}</strong>
        <span class="text-muted">${fmtUSD(used)}${budget ? ' / ' + fmtUSD(budget) : ''}</span>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    `;
    wrap.appendChild(item);
  });
}