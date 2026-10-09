/**
 * ConnectHub - User Search, Discovery, and Followers/Following Lists
 */

let searchDebounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const path = window.location.pathname;

  if (path.endsWith('users.html')) {
    initUsersSearchPage();
  } else if (path.endsWith('following.html')) {
    initFollowingPage();
  }
});

/* ==========================================================================
   Users Search Page Logic
   ========================================================================== */
function initUsersSearchPage() {
  const searchInput = document.getElementById('userSearchInput');
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');

  if (searchInput) {
    if (initialQuery) {
      searchInput.value = initialQuery;
      performUserSearch(initialQuery);
    } else {
      loadAllUsers();
    }

    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      const query = searchInput.value.trim();
      searchDebounceTimer = setTimeout(() => {
        if (query) {
          performUserSearch(query);
        } else {
          loadAllUsers();
        }
      }, 300);
    });
  }
}

// Fetch all users
async function loadAllUsers() {
  const container = document.getElementById('usersGridContainer');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  const res = await apiFetch('/api/users');

  if (res.success && res.data) {
    renderUserCards(res.data, container, 'No other users found on the platform yet.');
  } else {
    container.innerHTML = '<p style="color: var(--danger); text-align: center;">Failed to load users.</p>';
  }
}

// Search users by query
async function performUserSearch(query) {
  const container = document.getElementById('usersGridContainer');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`);

  if (res.success && res.data) {
    renderUserCards(res.data, container, `No users matching "${escapeHTML(query)}". Try another search term.`);
  } else {
    container.innerHTML = '<p style="color: var(--danger); text-align: center;">Error searching users.</p>';
  }
}

// Render cards into grid
function renderUserCards(users, container, emptyMessage) {
  if (!users || users.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">👥</div>
        <h3>No users found</h3>
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }

  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  container.innerHTML = users
    .map((u) => {
      const avatarUrl = u.profileImage || defaultAvatar;
      let followBtn = '';

      if (!u.isSelf) {
        followBtn = `
          <button class="btn-follow ${u.isFollowing ? 'following' : ''}" style="width: 100%; margin-top: 6px;" onclick="handleFollowToggle('${u._id}', ${u.isFollowing}, this)">
            ${u.isFollowing ? 'Following' : 'Follow'}
          </button>
        `;
      } else {
        followBtn = `
          <span style="font-size: 0.8rem; color: var(--text-dim); padding: 6px 0;">(You)</span>
        `;
      }

      return `
        <div class="user-profile-card">
          <a href="profile.html?id=${u._id}">
            <img src="${avatarUrl}" alt="${escapeHTML(u.name)}" class="avatar-md" style="width: 72px; height: 72px;" onerror="this.src='${defaultAvatar}'">
          </a>
          <div>
            <a href="profile.html?id=${u._id}" style="font-weight: 700; font-size: 1.05rem; display: block;">${escapeHTML(u.name)}</a>
            <span style="font-size: 0.85rem; color: var(--text-muted);">@${escapeHTML(u.username)}</span>
          </div>
          <p class="user-card-bio">${u.bio ? escapeHTML(u.bio) : 'ConnectHub member'}</p>
          <div class="user-card-stats">
            <div class="stat-item">
              <span class="stat-value" style="font-size: 0.95rem;">${u.followersCount || 0}</span>
              <span class="stat-label" style="font-size: 0.7rem;">Followers</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="font-size: 0.95rem;">${u.followingCount || 0}</span>
              <span class="stat-label" style="font-size: 0.7rem;">Following</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; width: 100%;">
            <a href="profile.html?id=${u._id}" class="btn-secondary" style="flex: 1; text-align: center; font-size: 0.85rem; padding: 7px 10px;">
              View Profile
            </a>
          </div>
          ${followBtn}
        </div>
      `;
    })
    .join('');
}

/* ==========================================================================
   Followers & Following Page Logic
   ========================================================================== */
let activeNetworkTab = 'following'; // 'following' or 'followers'
let networkTargetUserId = null;

async function initFollowingPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const currentUser = getUser();
  networkTargetUserId = urlParams.get('id') || (currentUser ? currentUser._id : null);
  const requestedTab = urlParams.get('tab');

  if (requestedTab === 'followers') {
    activeNetworkTab = 'followers';
  } else {
    activeNetworkTab = 'following';
  }

  // Update tabs
  updateNetworkTabsUI();
  loadNetworkUsers();
}

function switchNetworkTab(tab) {
  activeNetworkTab = tab;
  updateNetworkTabsUI();
  loadNetworkUsers();
}

function updateNetworkTabsUI() {
  const tabFollowing = document.getElementById('tabFollowing');
  const tabFollowers = document.getElementById('tabFollowers');

  if (tabFollowing && tabFollowers) {
    tabFollowing.classList.toggle('active', activeNetworkTab === 'following');
    tabFollowers.classList.toggle('active', activeNetworkTab === 'followers');
  }
}

async function loadNetworkUsers() {
  const container = document.getElementById('networkGridContainer');
  const titleSpan = document.getElementById('networkTitleSpan');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  if (titleSpan) {
    titleSpan.textContent = activeNetworkTab === 'following' ? 'People Being Followed' : 'Followers';
  }

  const endpoint = `/api/users/${networkTargetUserId}/${activeNetworkTab}`;
  const res = await apiFetch(endpoint);

  if (res.success && res.data) {
    const emptyMsg = activeNetworkTab === 'following'
      ? 'Not following any users yet. Search for people to follow!'
      : 'No followers yet. Share your profile and connect with others!';

    renderUserCards(res.data, container, emptyMsg);
  } else {
    container.innerHTML = '<p style="color: var(--danger); text-align: center;">Failed to load user list.</p>';
  }
}
