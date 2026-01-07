// Profile page script: load current user and handle edit/save
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // View elements
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profilePhone = document.getElementById('profile-phone');
  const profileGender = document.getElementById('profile-gender');
  const profileAddress = document.getElementById('profile-address');
  const profileView = document.getElementById('profile-view');
  const profileEdit = document.getElementById('profile-edit');

  // Edit form elements
  const editName = document.getElementById('edit-name');
  const editEmail = document.getElementById('edit-email');
  const editPhone = document.getElementById('edit-phone');
  const editGender = document.getElementById('edit-gender');
  const editAddress = document.getElementById('edit-address');
  const profileForm = document.getElementById('profile-form');

  // Buttons
  const editToggleBtn = document.getElementById('edit-toggle-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const msgEl = document.getElementById('profile-message');

  let currentUser = null;

  function showMessage(text, isError = false) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.classList.remove('error', 'success');
    if (text) {
      msgEl.classList.add(isError ? 'error' : 'success');
    }
  }

  function formatGender(gender) {
    const map = { male: 'Nam', female: 'Nữ', other: 'Khác', '': 'Chưa cập nhật' };
    return map[gender] || gender || 'Chưa cập nhật';
  }

  function setProfileView(user) {
    if (!user) return;
    profileName.textContent = user.name || '-';
    profileEmail.textContent = user.email || '-';
    profilePhone.textContent = user.phone || 'Chưa cập nhật';
    profileGender.textContent = formatGender(user.gender);
    profileAddress.textContent = user.address || 'Chưa cập nhật';
  }

  function setProfileEditForm(user) {
    if (!user) return;
    editName.value = user.name || '';
    editEmail.value = user.email || '';
    editPhone.value = user.phone || '';
    editGender.value = user.gender || '';
    editAddress.value = user.address || '';
  }

  function showEditMode(show) {
    if (show) {
      profileView.style.display = 'none';
      profileEdit.style.display = 'block';
      editToggleBtn.textContent = 'Hủy';
    } else {
      profileView.style.display = 'block';
      profileEdit.style.display = 'none';
      editToggleBtn.textContent = 'Chỉnh sửa';
    }
  }

  async function loadUserFromServer() {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      const json = await res.json().catch(()=>({}));
      if (res.ok && json && json.success && json.user) {
        currentUser = json.user;
        try { localStorage.setItem('currentUser', JSON.stringify(json.user)); } catch(e){}
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error loading profile:', err);
      return false;
    }
  }

  function loadUserFromLocalStorage() {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!currentUser) {
      showMessage('Không tìm thấy người dùng', true);
      return;
    }

    const phone = editPhone.value.trim();
    const gender = editGender.value.trim();
    const address = editAddress.value.trim();

    // Validate phone
    if (phone && !/^0\d{9,10}$/.test(phone)) {
      showMessage('Số điện thoại không hợp lệ', true);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          phone,
          gender,
          address
        })
      });

      const json = await res.json().catch(()=>({}));

      if (!res.ok) {
        showMessage(json.message || 'Lỗi cập nhật hồ sơ', true);
        return;
      }

      // Update currentUser with new data
      currentUser = json.user || currentUser;
      try { localStorage.setItem('currentUser', JSON.stringify(currentUser)); } catch(e){}

      setProfileView(currentUser);
      showMessage('Hồ sơ đã được cập nhật thành công!', false);
      showEditMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      showMessage('Lỗi kết nối server', true);
    }
  }

  async function init() {
    showMessage('');
    
    // Try server first
    const ok = await loadUserFromServer();
    if (ok && currentUser) {
      setProfileView(currentUser);
      setProfileEditForm(currentUser);
      return;
    }

    // Fallback to localStorage
    currentUser = loadUserFromLocalStorage();
    if (currentUser && (currentUser.name || currentUser.email)) {
      setProfileView(currentUser);
      setProfileEditForm(currentUser);
      return;
    }

    // No user -> redirect to login
    window.location.href = 'login.html';
  }

  function handleLogout() {
    try { localStorage.removeItem('currentUser'); } catch(e){}
    window.location.href = 'login.html';
  }

  // Event listeners
  editToggleBtn.addEventListener('click', () => {
    const isEditing = profileEdit.style.display !== 'none';
    showEditMode(!isEditing);
    if (!isEditing) {
      setProfileEditForm(currentUser);
    }
  });

  cancelEditBtn.addEventListener('click', () => {
    showEditMode(false);
  });

  profileForm.addEventListener('submit', saveProfile);
  logoutBtn.addEventListener('click', handleLogout);

  init();
});