/**
 * Account/Profile:
 * - Update display name (local only)
 * - Change password (validates current)
 * - Avatar upload stored as data URL per user
 */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar(''); // not part of center links; accessible via user dropdown

  const user = getCurrentUser();
  if (!user) return;

  document.getElementById('name').value = user.name || '';
  document.getElementById('email').value = user.email || '';
  const avatar = localStorage.getItem(`sft_${user.email}_avatar`);
  if (avatar) document.getElementById('avatarImg').src = avatar;

  // Save profile name
  document.getElementById('profileForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const users = getUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx >= 0) {
      users[idx].name = name;
      localStorage.setItem('sft_users', JSON.stringify(users));
      alert('Profile updated');
      // refresh navbar to show new name in dropdown
      renderNavbar('');
    }
  });

  // Avatar upload
  document.getElementById('avatarFile').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const dataUrl = await fileToDataURL(file);
    localStorage.setItem(`sft_${user.email}_avatar`, dataUrl);
    document.getElementById('avatarImg').src = dataUrl;
  });

  // Password change
  document.getElementById('pwdForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const cur = document.getElementById('curPwd').value;
    const neu = document.getElementById('newPwd').value;
    const users = getUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx < 0) return alert('User not found');
    if (users[idx].password !== cur) return alert('Current password incorrect');
    users[idx].password = neu;
    localStorage.setItem('sft_users', JSON.stringify(users));
    alert('Password updated');
    document.getElementById('curPwd').value = '';
    document.getElementById('newPwd').value = '';
  });

  // Extra logout button on this page
  document.getElementById('logoutBtn2')?.addEventListener('click', () => {
    localStorage.removeItem('sft_currentUserEmail');
    location.href = 'index.html';
  });
});

function fileToDataURL(file) {
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}