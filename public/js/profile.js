/**
 * ConnectHub - User Profile Management & User Posts
 */

let targetUserId = null;
let isOwnerProfile = false;
let currentProfileData = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Get user ID from URL query param, default to logged in user ID
  const urlParams = new URLSearchParams(window.location.search);
  const loggedInUser = getUser();
  targetUserId = urlParams.get('id') || (loggedInUser ? loggedInUser._id : null);

  if (!targetUserId) {
    showToast('User not found', 'error');
    window.location.href = 'index.html';
    return;
  }

  await loadUserProfile();
  await loadUserPosts();
  setupEditProfileForm();
});

// Load Profile Information
async function loadUserProfile() {
  const container = document.getElementById('profileHeaderContainer');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  const res = await apiFetch(`/api/users/${targetUserId}`);

  if (res.success && res.data) {
    currentProfileData = res.data;
    const user = res.data;
    const currentUser = getUser();
    isOwnerProfile = user.isSelf || (currentUser && currentUser._id === user._id);

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    const avatarUrl = user.profileImage || defaultAvatar;

    let actionBtnHTML = '';
    if (isOwnerProfile) {
      actionBtnHTML = `
        <button class="btn-secondary" onclick="openEditProfileModal()">
          <span>✏️</span> Edit Profile
        </button>
      `;
    } else {
      actionBtnHTML = `
        <button class="btn-follow ${user.isFollowing ? 'following' : ''}" style="padding: 8px 22px; font-size: 0.92rem;" onclick="handleProfileFollowToggle('${user._id}', ${user.isFollowing}, this)">
          ${user.isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    }

    container.innerHTML = `
      <div class="profile-header-card">
        <div class="profile-banner"></div>
        <div class="profile-header-body">
          <div class="profile-avatar-row">
            <img src="${avatarUrl}" alt="${escapeHTML(user.name)}" class="avatar-lg" onerror="this.src='${defaultAvatar}'">
            <div style="display: flex; gap: 10px;">
              ${actionBtnHTML}
            </div>
          </div>

          <h1 class="profile-header-name">${escapeHTML(user.name)}</h1>
          <div class="profile-header-handle">@${escapeHTML(user.username)}</div>

          <p class="profile-header-bio">${user.bio ? escapeHTML(user.bio) : '<span style="color: var(--text-dim); font-style: italic;">No bio added yet.</span>'}</p>

          <div class="profile-metrics-bar">
            <div class="profile-metric-link">
              <strong>${user.postsCount || 0}</strong> Posts
            </div>
            <a href="following.html?id=${user._id}&tab=followers" class="profile-metric-link">
              <strong id="profileFollowersCount">${user.followersCount || 0}</strong> Followers
            </a>
            <a href="following.html?id=${user._id}&tab=following" class="profile-metric-link">
              <strong id="profileFollowingCount">${user.followingCount || 0}</strong> Following
            </a>
          </div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>User Not Found</h3>
        <p>${escapeHTML(res.message || 'The requested user profile does not exist.')}</p>
        <a href="index.html" class="btn-primary" style="display: inline-flex; width: auto; margin-top: 14px;">Return Home</a>
      </div>
    `;
  }
}

// Follow toggle on profile page
async function handleProfileFollowToggle(userId, isFollowing, btnElement) {
  btnElement.disabled = true;
  btnElement.textContent = '...';

  const endpoint = `/api/users/${userId}/follow`;
  const method = isFollowing ? 'DELETE' : 'POST';

  const res = await apiFetch(endpoint, { method });

  btnElement.disabled = false;

  if (res.success && res.data) {
    const nowFollowing = !isFollowing;
    showToast(res.message, 'success');

    btnElement.className = `btn-follow ${nowFollowing ? 'following' : ''}`;
    btnElement.style.padding = '8px 22px';
    btnElement.style.fontSize = '0.92rem';
    btnElement.textContent = nowFollowing ? 'Following' : 'Follow';
    btnElement.setAttribute('onclick', `handleProfileFollowToggle('${userId}', ${nowFollowing}, this)`);

    // Update followers count display
    const countEl = document.getElementById('profileFollowersCount');
    if (countEl && res.data.followersCount !== undefined) {
      countEl.textContent = res.data.followersCount;
    }

    refreshCurrentUserProfile();
  } else {
    btnElement.textContent = isFollowing ? 'Following' : 'Follow';
    showToast(res.message || 'Action failed', 'error');
  }
}

// Load posts created by this user
async function loadUserPosts() {
  const container = document.getElementById('userPostsContainer');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  const res = await apiFetch(`/api/posts/user/${targetUserId}`);

  if (res.success && res.data) {
    if (res.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No posts yet</h3>
          <p>${isOwnerProfile ? 'You haven\'t created any posts yet. Share something with the community!' : 'This user hasn\'t posted anything yet.'}</p>
          ${isOwnerProfile ? '<a href="create-post.html" class="btn-primary" style="display: inline-flex; width: auto; margin-top: 14px;">Create First Post</a>' : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = res.data.map((post) => renderPostCardHTML(post)).join('');
  } else {
    container.innerHTML = '<p style="color: var(--danger); text-align: center;">Failed to load user posts</p>';
  }
}

// Open Edit Profile Modal
function openEditProfileModal() {
  if (!currentProfileData) return;

  document.getElementById('editName').value = currentProfileData.name || '';
  document.getElementById('editUsername').value = currentProfileData.username || '';
  document.getElementById('editBio').value = currentProfileData.bio || '';
  document.getElementById('editProfileImage').value = currentProfileData.profileImage || '';

  const modal = document.getElementById('editProfileModal');
  if (modal) modal.classList.add('active');
}

function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) modal.classList.remove('active');
}

// Setup Edit Profile Form Submit
function setupEditProfileForm() {
  const form = document.getElementById('editProfileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('editName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const profileImage = document.getElementById('editProfileImage').value.trim();
    const submitBtn = document.getElementById('editProfileSubmitBtn');

    if (!name || !username) {
      showToast('Name and username are required', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Saving...';

    const res = await apiFetch(`/api/users/${targetUserId}`, {
      method: 'PUT',
      body: { name, username, bio, profileImage }
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Save Changes';

    if (res.success && res.data) {
      showToast('Profile updated successfully!', 'success');
      closeEditProfileModal();

      // Update stored user
      setUser(res.data);
      renderNavbar();

      // Reload profile
      await loadUserProfile();
    } else {
      showToast(res.message || 'Failed to update profile', 'error');
    }
  });
}
