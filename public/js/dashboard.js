/**
 * Dashboard page logic:
 * - Summary cards (budget remaining, total spending, utilization, transactions count)
 * - Category progress list
 * - Spending by category pie chart
 * - Floating "Add Expense" button (opens reusable modal from common.js)
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('dashboard');
  refreshDashboard();

  document.getElementById('fabAdd')?.addEventListener('click', () => {
    openAddTxModal(refreshDashboard);
  });
});

function refreshDashboard() {
  const b = SFT.getBudgets();
  const cadence = b.cadence || 'monthly';
  const txs = SFT.txInCurrentPeriod(cadence);
  const spent = txs.reduce((s, t) => s + Number(t.amount || 0), 0);
  const total = Number(b.totalBudget || 0);
  const remaining = Math.max(0, total - spent);
  const utilization = total > 0 ? (spent / total) : 0;

  // Summary cards
  document.getElementById('cardRemaining').textContent = fmtUSD(remaining);
  document.getElementById('cardSpending').textContent = fmtUSD(spent);
  document.getElementById('cardTxCount').textContent = String(txs.length);
  document.getElementById('cardPeriod').textContent = cadence === 'weekly' ? 'This week' : (cadence === 'annual' ? 'This year' : 'This month');

  // Utilization progress
  const pct = Math.min(100, Math.round(utilization * 100));
  const bar = document.getElementById('utilBar');
  bar.style.width = pct + '%';

  // Category progress
  const perCat = SFT.sumByCategory(txs);
  const wrap = document.getElementById('categoryProgress');
  wrap.innerHTML = '';
  SFT.CATEGORIES.forEach(cat => {
    const budget = Number(b.categoryBudgets?.[cat.key] || 0);
    const used = Number(perCat[cat.key] || 0);
    const u = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;

    const item = document.createElement('div');
    item.className = 'box';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <strong>${cat.label}</strong>
        <span class="text-muted">${fmtUSD(used)}${budget ? ' / ' + fmtUSD(budget) : ''}</span>
      </div>
      <div class="progress"><span style="width:${u}%"></span></div>
    `;
    wrap.appendChild(item);
  });

  // Pie chart
  const labels = SFT.CATEGORIES.map(c => c.label);
  const values = SFT.CATEGORIES.map(c => Number(perCat[c.key] || 0));
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (window._pie) window._pie.destroy();
  window._pie = makePieChart(ctx, labels, values);
}