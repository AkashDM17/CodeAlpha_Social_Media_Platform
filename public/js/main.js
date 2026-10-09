/**
 * ConnectHub - Main Shared Frontend Utilities & API Handlers
 */

// Local Storage Keys
const TOKEN_KEY = 'connecthub_token';
const USER_KEY = 'connecthub_user';

// Auth State Helpers
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return !!getToken();
}

function logout() {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 400);
}

// Toast Notification System
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Universal API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: 'Failed to parse JSON response'
    }));

    if (res.status === 401 && !endpoint.includes('/api/auth/login')) {
      // Token expired or invalid
      clearAuth();
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        showToast('Session expired. Please log in again.', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);
      }
    }

    return { ok: res.ok, status: res.status, ...data };
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    return {
      success: false,
      message: error.message || 'Network error occurred. Please check server connection.'
    };
  }
}

// Format Relative Time
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Escape HTML for XSS prevention
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render Global Navbar
function renderNavbar() {
  const navContainer = document.getElementById('navbarContainer');
  if (!navContainer) return;

  const user = getUser();
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const avatarUrl = user && user.profileImage ? user.profileImage : defaultAvatar;

  let authSection = '';
  if (user) {
    authSection = `
      <div class="nav-links">
        <a href="index.html" class="nav-btn ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">
          <span>🏠</span> Home
        </a>
        <a href="users.html" class="nav-btn ${currentPage === 'users.html' ? 'active' : ''}">
          <span>🔍</span> Search
        </a>
        <a href="following.html" class="nav-btn ${currentPage === 'following.html' ? 'active' : ''}">
          <span>👥</span> Following
        </a>
        <a href="create-post.html" class="nav-btn create-btn">
          <span>✍️</span> Create Post
        </a>
        <div class="dropdown-container">
          <button id="userMenuBtn" class="nav-avatar-btn" onclick="toggleUserDropdown(event)">
            <img src="${avatarUrl}" alt="${escapeHTML(user.name)}" class="avatar-sm" onerror="this.src='${defaultAvatar}'">
            <span style="font-weight: 600; font-size: 0.9rem;">${escapeHTML(user.name.split(' ')[0])}</span>
            <span>▾</span>
          </button>
          <div id="userDropdownMenu" class="dropdown-menu">
            <a href="profile.html?id=${user._id}" class="dropdown-item">
              <span>👤</span> My Profile
            </a>
            <a href="following.html?tab=following" class="dropdown-item">
              <span>✨</span> Following
            </a>
            <a href="following.html?tab=followers" class="dropdown-item">
              <span>🌟</span> Followers
            </a>
            <button onclick="logout()" class="dropdown-item danger" style="width: 100%; text-align: left;">
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    authSection = `
      <div class="nav-links">
        <a href="login.html" class="nav-btn ${currentPage === 'login.html' ? 'active' : ''}">Log In</a>
        <a href="register.html" class="nav-btn create-btn">Sign Up</a>
      </div>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="index.html" class="nav-brand">
          <div class="brand-icon">⚡</div>
          <span>Connect<span class="brand-gradient">Hub</span></span>
        </a>
        <div class="nav-search-bar">
          <form onsubmit="handleGlobalSearch(event)" class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="globalSearchInput" placeholder="Search users by name or username..." autocomplete="off">
          </form>
        </div>
        ${authSection}
      </div>
    </nav>
  `;

  // Render mobile bottom navigation if logged in
  if (user) {
    let mobileNav = document.getElementById('mobileBottomNav');
    if (!mobileNav) {
      mobileNav = document.createElement('div');
      mobileNav.id = 'mobileBottomNav';
      mobileNav.className = 'mobile-bottom-nav';
      document.body.appendChild(mobileNav);
    }
    mobileNav.innerHTML = `
      <a href="index.html" class="nav-btn ${currentPage === 'index.html' ? 'active' : ''}" style="flex-direction: column; font-size: 0.72rem; gap: 2px;">
        <span style="font-size: 1.2rem;">🏠</span> Feed
      </a>
      <a href="users.html" class="nav-btn ${currentPage === 'users.html' ? 'active' : ''}" style="flex-direction: column; font-size: 0.72rem; gap: 2px;">
        <span style="font-size: 1.2rem;">🔍</span> Search
      </a>
      <a href="create-post.html" class="nav-btn" style="flex-direction: column; font-size: 0.72rem; gap: 2px; color: var(--primary);">
        <span style="font-size: 1.4rem;">➕</span> Post
      </a>
      <a href="following.html" class="nav-btn ${currentPage === 'following.html' ? 'active' : ''}" style="flex-direction: column; font-size: 0.72rem; gap: 2px;">
        <span style="font-size: 1.2rem;">👥</span> Network
      </a>
      <a href="profile.html?id=${user._id}" class="nav-btn ${currentPage === 'profile.html' ? 'active' : ''}" style="flex-direction: column; font-size: 0.72rem; gap: 2px;">
        <img src="${avatarUrl}" class="avatar-sm" style="width: 24px; height: 24px;"> Profile
      </a>
    `;
  }
}

// User dropdown toggle handler
function toggleUserDropdown(event) {
  event.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userDropdownMenu');
  if (menu && !e.target.closest('#userMenuBtn')) {
    menu.classList.remove('show');
  }
});

// Global Search form handler
function handleGlobalSearch(event) {
  event.preventDefault();
  const input = document.getElementById('globalSearchInput');
  const query = input ? input.value.trim() : '';
  if (query) {
    window.location.href = `users.html?q=${encodeURIComponent(query)}`;
  }
}

// Toggle Follow/Unfollow User Handler
async function handleFollowToggle(userId, isFollowing, btnElement) {
  if (!isAuthenticated()) {
    showToast('Please log in to follow users', 'error');
    setTimeout(() => (window.location.href = 'login.html'), 1000);
    return;
  }

  if (btnElement) {
    btnElement.disabled = true;
    btnElement.textContent = '...';
  }

  const endpoint = `/api/users/${userId}/follow`;
  const method = isFollowing ? 'DELETE' : 'POST';

  const res = await apiFetch(endpoint, { method });

  if (res.success) {
    const nowFollowing = !isFollowing;
    showToast(res.message, 'success');

    if (btnElement) {
      btnElement.disabled = false;
      if (nowFollowing) {
        btnElement.className = 'btn-follow following';
        btnElement.textContent = 'Following';
      } else {
        btnElement.className = 'btn-follow';
        btnElement.textContent = 'Follow';
      }
      btnElement.setAttribute('onclick', `handleFollowToggle('${userId}', ${nowFollowing}, this)`);
    }

    // Refresh current user data in background if needed
    refreshCurrentUserProfile();
  } else {
    showToast(res.message || 'Action failed', 'error');
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = isFollowing ? 'Following' : 'Follow';
    }
  }
}

// Background sync current user profile
async function refreshCurrentUserProfile() {
  if (!isAuthenticated()) return;
  const res = await apiFetch('/api/auth/me');
  if (res.success && res.data) {
    setUser(res.data);
  }
}

// Run navbar initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
