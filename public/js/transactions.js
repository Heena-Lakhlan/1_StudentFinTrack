/**
 * Transactions page:
 * - Shows list of transactions grouped by date
 * - Add (uses common modal), Edit, Delete
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('transaction');
  renderTxList();

  document.getElementById('addTxBtn')?.addEventListener('click', () => {
    openAddTxModal(renderTxList);
  });
});

function renderTxList() {
  const list = SFT.getTransactions().sort((a,b)=> a.date < b.date ? 1 : -1);
  const wrap = document.getElementById('txList');
  wrap.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'box';
    empty.textContent = 'No transactions yet. Use "Add Transaction" to record your first expense.';
    wrap.appendChild(empty);
    return;
  }

  // Group by date (MM/DD/YYYY)
  const groups = {};
  list.forEach(t => {
    const d = fmtDateISOToMDY(t.date);
    groups[d] = groups[d] || [];
    groups[d].push(t);
  });

  Object.keys(groups).forEach(day => {
    const box = document.createElement('div');
    box.className = 'box';
    box.innerHTML = `<h3>${day}</h3>`;
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
      <thead>
        <tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th style="width:150px">Actions</th></tr>
      </thead>
      <tbody>
        ${groups[day].map(t => `
          <tr data-id="${t.id}">
            <td>${SFT.CATEGORIES.find(c=>c.key===t.category)?.label || t.category}</td>
            <td>${t.description || '-'}</td>
            <td>${fmtUSD(t.amount)}</td>
            <td>${fmtDateISOToMDY(t.date)}</td>
            <td>
              <button class="btn-secondary btn-sm" data-edit="${t.id}">Edit</button>
              <button class="btn-secondary btn-sm" data-del="${t.id}">Delete</button>
            </td>
          </tr>`).join('')}
      </tbody>
    `;
    box.appendChild(table);
    wrap.appendChild(box);
  });

  // Wire up edit/delete
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      if (confirm('Delete this transaction?')) {
        SFT.deleteTransaction(id);
        renderTxList();
      }
    });
  });

  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditTxModal(btn.getAttribute('data-edit')));
  });
}

// Edit modal (similar to add)
function openEditTxModal(id) {
  const tx = SFT.getTransactions().find(t => t.id === id);
  if (!tx) return;
  const options = SFT.CATEGORIES.map(c => `<option value="${c.key}" ${tx.category===c.key?'selected':''}>${c.label}</option>`).join('');
  openModal(`
    <div class="box">
      <h3>Edit Expense</h3>
      <form id="editTxForm" class="row">
        <div class="box" style="flex:1 1 180px">
          <label>Amount (USD)</label>
          <input id="txAmount" type="number" step="0.01" class="input" value="${tx.amount}" required>
        </div>
        <div class="box" style="flex:1 1 180px">
          <label>Date</label>
          <input id="txDate" type="date" class="input" value="${tx.date}" required>
        </div>
        <div class="box" style="flex:1 1 220px">
          <label>Category</label>
          <select id="txCategory" class="input">${options}</select>
        </div>
        <div class="box" style="flex:1 1 100%">
          <label>Description</label>
          <input id="txDesc" type="text" class="input" value="${tx.description || ''}">
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('editTxForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('txAmount').value);
    const date = document.getElementById('txDate').value;
    const category = document.getElementById('txCategory').value;
    const description = document.getElementById('txDesc').value.trim();
    SFT.updateTransaction(id, { amount, date, category, description });
    closeModal(); renderTxList();
  });
}