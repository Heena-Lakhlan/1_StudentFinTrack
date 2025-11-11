/**
 * Savings Goals:
 * - Add/Edit/Delete goals
 * - Track saved amount and progress
 * - Rule-based suggestions (add with one click)
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('saving');
  renderGoals();
  renderSuggestions();

  document.getElementById('addGoalBtn')?.addEventListener('click', openAddGoalModal);
  document.getElementById('refreshSugBtn')?.addEventListener('click', renderSuggestions);
});

function renderGoals() {
  const list = SFT.getGoals().sort((a,b)=> (a.deadline||'') < (b.deadline||'') ? -1 : 1);
  const wrap = document.getElementById('goalsList');
  wrap.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'box';
    empty.textContent = 'No goals yet. Click "Add Goal" to create one.';
    wrap.appendChild(empty);
    return;
  }

  list.forEach(g => {
    const pct = g.target>0 ? Math.min(100, Math.round((Number(g.saved||0)/Number(g.target))*100)) : 0;
    const card = document.createElement('div');
    card.className = 'box';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <strong>${g.name}</strong>
          <div class="text-muted">${fmtUSD(g.saved||0)} / ${fmtUSD(g.target||0)}${g.deadline?` • Due: ${fmtDateISOToMDY(g.deadline)}`:''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary" data-add="${g.id}">Add $</button>
          <button class="btn-secondary" data-edit="${g.id}">Edit</button>
          <button class="btn-secondary" data-del="${g.id}">Delete</button>
        </div>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    const id=b.getAttribute('data-del'); if(confirm('Delete this goal?')){ SFT.deleteGoal(id); renderGoals(); }
  }));
  wrap.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=> openEditGoalModal(b.getAttribute('data-edit'))));
  wrap.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click', ()=> openContributeModal(b.getAttribute('data-add'))));
}

function openAddGoalModal() {
  const today = toISODateString(new Date());
  openModal(`
    <div class="box">
      <h3>Add Goal</h3>
      <form id="goalForm" class="row">
        <div class="box" style="flex:1 1 240px">
          <label>Name</label>
          <input id="gName" class="input" required placeholder="e.g., Laptop">
        </div>
        <div class="box" style="flex:1 1 200px">
          <label>Target (USD)</label>
          <input id="gTarget" type="number" step="0.01" class="input" required>
        </div>
        <div class="box" style="flex:1 1 200px">
          <label>Deadline</label>
          <input id="gDeadline" type="date" class="input" value="${today}">
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button class="btn">Save</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('goalForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('gName').value.trim();
    const target = Number(document.getElementById('gTarget').value);
    const deadline = document.getElementById('gDeadline').value;
    SFT.addGoal({ name, target, deadline, saved: 0, createdAt: toISODateString(new Date()) });
    closeModal(); renderGoals();
  });
}

function openEditGoalModal(id) {
  const g = SFT.getGoals().find(x=>x.id===id); if(!g) return;
  openModal(`
    <div class="box">
      <h3>Edit Goal</h3>
      <form id="goalForm" class="row">
        <div class="box" style="flex:1 1 240px">
          <label>Name</label>
          <input id="gName" class="input" required value="${g.name}">
        </div>
        <div class="box" style="flex:1 1 200px">
          <label>Target (USD)</label>
          <input id="gTarget" type="number" step="0.01" class="input" required value="${g.target}">
        </div>
        <div class="box" style="flex:1 1 200px">
          <label>Deadline</label>
          <input id="gDeadline" type="date" class="input" value="${g.deadline||''}">
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button class="btn">Save</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('goalForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('gName').value.trim();
    const target = Number(document.getElementById('gTarget').value);
    const deadline = document.getElementById('gDeadline').value;
    SFT.updateGoal(id, { name, target, deadline });
    closeModal(); renderGoals();
  });
}

function openContributeModal(id) {
  const g = SFT.getGoals().find(x=>x.id===id); if(!g) return;
  openModal(`
    <div class="box">
      <h3>Add Contribution</h3>
      <form id="contribForm" class="row">
        <div class="box" style="flex:1 1 240px">
          <label>Amount (USD)</label>
          <input id="cAmt" type="number" step="0.01" class="input" required>
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button class="btn">Add</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('contribForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const amt = Number(document.getElementById('cAmt').value);
    SFT.updateGoal(id, { saved: Number(g.saved||0) + amt });
    closeModal(); renderGoals();
  });
}

function renderSuggestions() {
  const sugs = SFT.goalSuggestions();
  const wrap = document.getElementById('suggestions');
  wrap.innerHTML = '';

  sugs.forEach(s => {
    const card = document.createElement('div');
    card.className = 'box';
    card.innerHTML = `
      <strong>${s.name}</strong>
      <div class="text-muted">${s.reason}</div>
      <div class="text-muted">Target: ${fmtUSD(s.target)} • Plan: ~${s.weeks} weeks (${fmtUSD(Math.round(s.target/s.weeks))}/week)</div>
      <div style="display:flex;justify-content:flex-end">
        <button class="btn" data-accept="${s.name}" data-target="${s.target}" data-weeks="${s.weeks}">Add this goal</button>
      </div>
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('[data-accept]').forEach(b => b.addEventListener('click', ()=>{
    const name = b.getAttribute('data-accept');
    const target = Number(b.getAttribute('data-target'));
    const weeks = Number(b.getAttribute('data-weeks'));
    const deadline = toISODateString(new Date(Date.now() + weeks*7*24*3600*1000));
    SFT.addGoal({ name, target, deadline, saved: 0, createdAt: toISODateString(new Date()) });
    renderGoals();
    alert('Goal added.');
  }));
}