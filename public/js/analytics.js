/**
 * Analytics:
 * - Filters (Last 7 days default, other ranges + custom)
 * - Pie: spending by category
 * - Line: spending trend by day
 * - Bar: shared by friend
 */
let _pie, _line, _bar;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('analytics');
  initFilters();
  applyFilters();

  document.getElementById('applyBtn')?.addEventListener('click', applyFilters);
});

function initFilters() {
  // Range defaults to last 7 days
  document.getElementById('rangeSelect').value = 'last7';
  const end = new Date();
  const start = new Date(Date.now() - 6*24*3600*1000);
  document.getElementById('startDate').value = toISODateString(start);
  document.getElementById('endDate').value = toISODateString(end);

  // Category list
  const sel = document.getElementById('catSelect');
  sel.innerHTML = '<option value="all">All</option>' + SFT.CATEGORIES.map(c=>`<option value="${c.key}">${c.label}</option>`).join('');
}

function resolveRange() {
  const sel = document.getElementById('rangeSelect').value;
  const today = new Date();
  let start, end;
  if (sel === 'last7') { end = new Date(); start = new Date(Date.now()-6*24*3600*1000); }
  else if (sel === 'thisMonth') { start = new Date(today.getFullYear(), today.getMonth(), 1); end = new Date(today.getFullYear(), today.getMonth()+1, 0); }
  else if (sel === 'lastMonth') { start = new Date(today.getFullYear(), today.getMonth()-1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); }
  else if (sel === 'thisYear') { start = new Date(today.getFullYear(), 0, 1); end = new Date(today.getFullYear(), 11, 31); }
  else { start = new Date(document.getElementById('startDate').value || Date.now()); end = new Date(document.getElementById('endDate').value || Date.now()); }
  return { startISO: toISODateString(start), endISO: toISODateString(end) };
}

function applyFilters() {
  const { startISO, endISO } = resolveRange();
  const cat = document.getElementById('catSelect').value;
  const splitFriend = document.getElementById('splitByFriend').checked;
  const splitCat = document.getElementById('splitByCategory').checked;

  let txs = SFT.txBetween(startISO, endISO);
  if (cat !== 'all') txs = txs.filter(t => t.category === cat);

  // Pie by category
  const perCat = SFT.sumByCategory(txs);
  const pieLabels = SFT.CATEGORIES.map(c => c.label);
  const pieValues = SFT.CATEGORIES.map(c => Number(perCat[c.key] || 0));
  if (_pie) _pie.destroy();
  _pie = makePieChart(document.getElementById('vizPie').getContext('2d'), pieLabels, pieValues);

  // Trend by day (line)
  const dateMap = {};
  for (let d=new Date(startISO); d<=new Date(endISO); d.setDate(d.getDate()+1)) {
    const k = toISODateString(d); dateMap[k] = 0;
  }
  txs.forEach(t => { if (dateMap[t.date] !== undefined) dateMap[t.date] += Number(t.amount || 0); });
  const lineLabels = Object.keys(dateMap).map(fmtDateISOToMDY);
  const lineValues = Object.values(dateMap);
  if (_line) _line.destroy();
  _line = makeLineChart(document.getElementById('vizLine').getContext('2d'), lineLabels, lineValues);

  // Shared by friend (bar)
  const shared = SFT.getShared().filter(s => s.date >= startISO && s.date <= endISO);
  const currentName = getUsers().find(u => u.email === getCurrentUserEmail())?.name || 'You';
  const friends = SFT.getFriends();
  const people = [currentName, ...friends];
  const perFriend = {}; people.forEach(p => perFriend[p]=0);
  shared.forEach(e => {
    const share = Number(e.amount || 0) / (e.participants?.length || 1);
    e.participants?.forEach(p => { if (perFriend[p] !== undefined) perFriend[p] += share; });
  });
  const barLabels = Object.keys(perFriend);
  const barValues = Object.values(perFriend).map(v => Math.round(v*100)/100);
  if (_bar) _bar.destroy();
  _bar = makeBarChart(document.getElementById('vizBar').getContext('2d'), barLabels, barValues, 'Shared by Friend');

  // Show/hide sections per toggles to keep layout tidy
  document.getElementById('pieSection').style.display = splitCat ? '' : 'none';
  document.getElementById('barSection').style.display = splitFriend ? '' : 'none';
}