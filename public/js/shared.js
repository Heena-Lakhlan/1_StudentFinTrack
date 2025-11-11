/**
 * Shared Expenses:
 * - Manage friends list
 * - Add/Edit/Delete split expenses (equal split across selected participants)
 * - Settlement suggestions via minimum cash flow algorithm
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('shared');
  renderShared();
  renderSettlements();

  document.getElementById('addSharedBtn')?.addEventListener('click', openAddSharedModal);
  document.getElementById('manageFriendsBtn')?.addEventListener('click', openManageFriendsModal);
  document.getElementById('recalcBtn')?.addEventListener('click', renderSettlements);
});

function renderShared() {
  const list = SFT.getShared().sort((a,b)=> a.date < b.date ? 1 : -1);
  const wrap = document.getElementById('sharedList');
  wrap.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'box';
    empty.textContent = 'No shared expenses yet. Use "Add Split Expense" to create one.';
    wrap.appendChild(empty);
    return;
  }

  list.forEach(e => {
    const cat = SFT.CATEGORIES.find(c=>c.key===e.category)?.label || e.category;
    const item = document.createElement('div');
    item.className = 'box';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;gap:6px;min-width:260px">
          <strong>${e.description || '(No description)'} • ${cat}</strong>
          <span class="text-muted">${fmtDateISOToMDY(e.date)} • ${fmtUSD(e.amount)} • Payer: ${e.payer}</span>
          <span class="text-muted">Participants: ${e.participants.join(', ')}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" data-edit="${e.id}">Edit</button>
          <button class="btn-secondary" data-del="${e.id}">Delete</button>
        </div>
      </div>
    `;
    wrap.appendChild(item);
  });

  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    const id = b.getAttribute('data-del');
    if (confirm('Delete this shared expense?')) {
      SFT.deleteShared(id);
      renderShared(); renderSettlements();
    }
  }));

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEditSharedModal(b.getAttribute('data-edit'))));
}

function renderSettlements() {
  const list = SFT.calcSettlements();
  const wrap = document.getElementById('settlements');
  wrap.innerHTML = '';

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'box';
    empty.textContent = 'Everyone is settled up.';
    wrap.appendChild(empty);
    return;
  }

  list.forEach(s => {
    const item = document.createElement('div');
    item.className = 'box';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div><strong>${s.from}</strong> pays <strong>${s.to}</strong></div>
        <div>${fmtUSD(s.amount)}</div>
      </div>
    `;
    wrap.appendChild(item);
  });
}

function allPeopleOptions(selected = []) {
  const currentName = getUsers().find(u => u.email === getCurrentUserEmail())?.name || 'You';
  const friends = SFT.getFriends();
  const all = [currentName, ...friends];
  return all.map(n => `<option value="${n}" ${selected.includes(n)?'selected':''}>${n}</option>`).join('');
}

function openAddSharedModal() {
  const today = toISODateString(new Date());
  const catOpts = SFT.CATEGORIES.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
  openModal(`
    <div class="box">
      <h3>Add Split Expense</h3>
      <form id="sharedForm" class="row">
        <div class="box" style="flex:1 1 200px">
          <label>Amount (USD)</label>
          <input id="shAmount" type="number" step="0.01" class="input" required>
        </div>
        <div class="box" style="flex:1 1 200px">
          <label>Date</label>
          <input id="shDate" type="date" class="input" value="${today}" required>
        </div>
        <div class="box" style="flex:1 1 240px">
          <label>Category</label>
          <select id="shCategory" class="input">${catOpts}</select>
        </div>
        <div class="box" style="flex:1 1 100%">
          <label>Description</label>
          <input id="shDesc" type="text" class="input" placeholder="e.g., Pizza night">
        </div>
        <div class="box" style="flex:1 1 280px">
          <label>Payer</label>
          <select id="shPayer" class="input">${allPeopleOptions()}</select>
        </div>
        <div class="box" style="flex:1 1 280px">
          <label>Participants</label>
          <select id="shParticipants" class="input" multiple size="5">${allPeopleOptions()}</select>
          <span class="text-muted">Hold Ctrl/Cmd to select multiple.</span>
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('sharedForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const amount = Number(document.getElementById('shAmount').value);
    const date = document.getElementById('shDate').value;
    const category = document.getElementById('shCategory').value;
    const description = document.getElementById('shDesc').value.trim();
    const payer = document.getElementById('shPayer').value;
    const participants = Array.from(document.getElementById('shParticipants').selectedOptions).map(o=>o.value);
    if (amount<=0) return alert('Amount must be greater than 0');
    if (participants.length===0) return alert('Select at least one participant');
    SFT.addShared({ amount, date, category, description, payer, participants });
    closeModal(); renderShared(); renderSettlements();
  });
}

function openEditSharedModal(id) {
  const e = SFT.getShared().find(x=>x.id===id); if(!e) return;
  const catOpts = SFT.CATEGORIES.map(c => `<option value="${c.key}" ${e.category===c.key?'selected':''}>${c.label}</option>`).join('');
  openModal(`
    <div class="box">
      <h3>Edit Split Expense</h3>
      <form id="sharedForm" class="row">
        <div class="box" style="flex:1 1 200px">
          <label>Amount (USD)</label>
          <input id="shAmount" type="number" step="0.01" class="input" value="${e.amount}" required>
        </div>
        <div class="box" style="flex:1 1 200px">
          <label>Date</label>
          <input id="shDate" type="date" class="input" value="${e.date}" required>
        </div>
        <div class="box" style="flex:1 1 240px">
          <label>Category</label>
          <select id="shCategory" class="input">${catOpts}</select>
        </div>
        <div class="box" style="flex:1 1 100%">
          <label>Description</label>
          <input id="shDesc" type="text" class="input" value="${e.description || ''}">
        </div>
        <div class="box" style="flex:1 1 280px">
          <label>Payer</label>
          <select id="shPayer" class="input">${allPeopleOptions([e.payer])}</select>
        </div>
        <div class="box" style="flex:1 1 280px">
          <label>Participants</label>
          <select id="shParticipants" class="input" multiple size="5">${allPeopleOptions(e.participants)}</select>
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('sharedForm')?.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const amount = Number(document.getElementById('shAmount').value);
    const date = document.getElementById('shDate').value;
    const category = document.getElementById('shCategory').value;
    const description = document.getElementById('shDesc').value.trim();
    const payer = document.getElementById('shPayer').value;
    const participants = Array.from(document.getElementById('shParticipants').selectedOptions).map(o=>o.value);
    SFT.updateShared(id, { amount, date, category, description, payer, participants });
    closeModal(); renderShared(); renderSettlements();
  });
}

function openManageFriendsModal() {
  const friends = SFT.getFriends();
  openModal(`
    <div class="box">
      <h3>Manage Friends</h3>
      <div id="friendsWrap" class="row">
        ${friends.map((f,i)=>`
          <div class="box" style="flex:1 1 260px; display:flex;gap:8px;align-items:center">
            <input type="text" class="input" value="${f}" data-i="${i}">
            <button class="btn-secondary" data-del="${i}">Remove</button>
          </div>`).join('')}
      </div>
      <div class="row">
        <div class="box" style="flex:1 1 260px; display:flex;gap:8px;align-items:center">
          <input id="newFriend" type="text" class="input" placeholder="Friend name">
          <button id="addFriend" class="btn">Add</button>
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; justify-content:flex-end">
          <button id="closeFriends" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `);
  document.getElementById('addFriend')?.addEventListener('click', ()=>{
    const name = document.getElementById('newFriend').value.trim();
    if (!name) return;
    const list = SFT.getFriends(); list.push(name); SFT.saveFriends(list);
    closeModal(); openManageFriendsModal();
  });
  document.getElementById('friendsWrap')?.addEventListener('click', (e)=>{
    if (e.target.matches('[data-del]')) {
      const i = Number(e.target.getAttribute('data-del')); const l=SFT.getFriends(); l.splice(i,1); SFT.saveFriends(l);
      closeModal(); openManageFriendsModal();
    }
  });
  document.getElementById('friendsWrap')?.addEventListener('change', (e)=>{
    if (e.target.matches('input[data-i]')) {
      const i = Number(e.target.getAttribute('data-i')); const l=SFT.getFriends(); l[i]=e.target.value; SFT.saveFriends(l);
    }
  });
  document.getElementById('closeFriends')?.addEventListener('click', closeModal);
}