/**
 * ConnectHub - Feed, Posts, Likes, and Comments Management
 */

let currentFeedMode = 'personalized'; // 'personalized' or 'explore'
let activeEditPostId = null;
let activeDeletePostId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // If not logged in, redirect to login page
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Populate left sidebar user widget
  loadCurrentUserWidget();

  // Load right sidebar suggested users
  loadSuggestedUsers();

  // Load initial feed
  loadFeed();

  // Handle quick post form submission
  setupQuickPost();
});

// Load Current User Widget in left sidebar
async function loadCurrentUserWidget() {
  const container = document.getElementById('currentUserWidget');
  if (!container) return;

  const res = await apiFetch('/api/auth/me');
  if (res.success && res.data) {
    const user = res.data;
    setUser(user); // refresh stored user

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    const avatarUrl = user.profileImage || defaultAvatar;

    container.innerHTML = `
      <div class="profile-widget-hero">
        <a href="profile.html?id=${user._id}">
          <img src="${avatarUrl}" alt="${escapeHTML(user.name)}" class="avatar-md" onerror="this.src='${defaultAvatar}'">
        </a>
        <a href="profile.html?id=${user._id}" class="profile-widget-name">${escapeHTML(user.name)}</a>
        <span class="profile-widget-handle">@${escapeHTML(user.username)}</span>
      </div>
      <div class="profile-widget-stats">
        <a href="profile.html?id=${user._id}" class="stat-item">
          <span class="stat-value">${user.postsCount || 0}</span>
          <span class="stat-label">Posts</span>
        </a>
        <a href="following.html?tab=followers" class="stat-item">
          <span class="stat-value">${user.followersCount || 0}</span>
          <span class="stat-label">Followers</span>
        </a>
        <a href="following.html?tab=following" class="stat-item">
          <span class="stat-value">${user.followingCount || 0}</span>
          <span class="stat-label">Following</span>
        </a>
      </div>
    `;
  }
}

// Load Suggested Users in right sidebar
async function loadSuggestedUsers() {
  const container = document.getElementById('suggestedUsersList');
  if (!container) return;

  const res = await apiFetch('/api/users?limit=5');
  if (res.success && res.data && res.data.length > 0) {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    container.innerHTML = res.data
      .map((u) => `
        <div class="user-row-card" id="user-suggest-${u._id}">
          <div class="user-row-info">
            <a href="profile.html?id=${u._id}">
              <img src="${u.profileImage || defaultAvatar}" alt="${escapeHTML(u.name)}" class="avatar-sm" onerror="this.src='${defaultAvatar}'">
            </a>
            <div class="user-row-details">
              <a href="profile.html?id=${u._id}" class="user-row-name">${escapeHTML(u.name)}</a>
              <span class="user-row-handle">@${escapeHTML(u.username)}</span>
            </div>
          </div>
          <button class="btn-follow ${u.isFollowing ? 'following' : ''}" onclick="handleFollowToggle('${u._id}', ${u.isFollowing}, this)">
            ${u.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      `)
      .join('');
  } else {
    container.innerHTML = '<p style="color: var(--text-dim); font-size: 0.85rem; text-align: center;">No suggestions available right now.</p>';
  }
}

// Switch Feed Tab (Personalized vs Explore)
function switchFeedTab(mode) {
  currentFeedMode = mode;
  document.getElementById('tabPersonalized').classList.toggle('active', mode === 'personalized');
  document.getElementById('tabExplore').classList.toggle('active', mode === 'explore');
  loadFeed();
}

// Fetch and render feed posts
async function loadFeed() {
  const container = document.getElementById('feedPostsContainer');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  const endpoint = currentFeedMode === 'explore' ? '/api/posts/feed?explore=true' : '/api/posts/feed';
  const res = await apiFetch(endpoint);

  if (res.success && res.data) {
    if (res.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📰</div>
          <h3>Your feed is empty</h3>
          <p>${currentFeedMode === 'personalized' ? 'Follow other creators or switch to "Explore" to discover posts from the community!' : 'No posts found in the community yet. Be the first to share something!'}</p>
          <div style="margin-top: 16px;">
            ${currentFeedMode === 'personalized' ? '<button class="btn-primary" style="display: inline-flex; width: auto; padding: 8px 18px;" onclick="switchFeedTab(\'explore\')">Explore All Posts</button>' : ''}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = res.data.map((post) => renderPostCardHTML(post)).join('');
  } else {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load feed</h3>
        <p>${escapeHTML(res.message || 'Please check your connection and try again.')}</p>
        <button class="btn-secondary" style="margin-top: 14px;" onclick="loadFeed()">Retry</button>
      </div>
    `;
  }
}

// Generate Post Card HTML
function renderPostCardHTML(post) {
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  const author = post.user || { name: 'Unknown User', username: 'unknown', profileImage: defaultAvatar };
  const authorAvatar = author.profileImage || defaultAvatar;

  const imageHTML = post.image
    ? `<div class="post-image-wrapper">
         <img src="${escapeHTML(post.image)}" alt="Post image" class="post-image" loading="lazy" onerror="this.parentElement.style.display='none'">
       </div>`
    : '';

  const dropdownHTML = post.isOwner
    ? `
      <div class="dropdown-container">
        <button class="menu-btn" onclick="togglePostDropdown('${post._id}', event)">⋯</button>
        <div id="postDropdown-${post._id}" class="dropdown-menu">
          <button class="dropdown-item" onclick="openEditPostModal('${post._id}')">
            <span>✏️</span> Edit Post
          </button>
          <button class="dropdown-item danger" onclick="openDeletePostModal('${post._id}')">
            <span>🗑️</span> Delete Post
          </button>
        </div>
      </div>
    `
    : '';

  return `
    <article class="post-card" id="post-${post._id}">
      <div class="post-header">
        <div class="post-author-info">
          <a href="profile.html?id=${author._id}">
            <img src="${authorAvatar}" alt="${escapeHTML(author.name)}" class="avatar-md" onerror="this.src='${defaultAvatar}'">
          </a>
          <div>
            <a href="profile.html?id=${author._id}" class="post-author-name">
              ${escapeHTML(author.name)}
            </a>
            <div>
              <span class="post-author-handle">@${escapeHTML(author.username)}</span>
              <span style="color: var(--text-dim); margin: 0 4px;">•</span>
              <span class="post-time">${formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div class="post-header-actions">
          ${dropdownHTML}
        </div>
      </div>

      <div class="post-text" id="post-content-${post._id}">${escapeHTML(post.content)}</div>
      ${imageHTML}

      <div class="post-stats-row">
        <span id="post-likes-count-${post._id}">${post.likesCount} ${post.likesCount === 1 ? 'like' : 'likes'}</span>
        <span id="post-comments-count-${post._id}">${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}</span>
      </div>

      <div class="post-actions-bar">
        <button class="action-btn like-btn ${post.isLiked ? 'liked' : ''}" id="like-btn-${post._id}" onclick="toggleLikePost('${post._id}')">
          <span class="like-icon">${post.isLiked ? '❤️' : '🤍'}</span>
          <span class="like-label">${post.isLiked ? 'Liked' : 'Like'}</span>
        </button>
        <button class="action-btn comment-btn" onclick="toggleCommentsSection('${post._id}')">
          <span class="icon">💬</span>
          <span>Comment</span>
        </button>
      </div>

      <div class="comments-section" id="comments-section-${post._id}" style="display: none;">
        <div class="comment-input-row">
          <input type="text" id="comment-input-${post._id}" placeholder="Write a thoughtful comment..." maxlength="500" onkeydown="handleCommentKeydown(event, '${post._id}')">
          <button class="comment-submit-btn" onclick="submitComment('${post._id}')">Post</button>
        </div>
        <div class="comments-list" id="comments-list-${post._id}">
          <div class="spinner"></div>
        </div>
      </div>
    </article>
  `;
}

// Toggle Post options dropdown
function togglePostDropdown(postId, event) {
  event.stopPropagation();
  // Close any other open menus
  document.querySelectorAll('.dropdown-menu').forEach((menu) => {
    if (menu.id !== `postDropdown-${postId}`) menu.classList.remove('show');
  });
  const menu = document.getElementById(`postDropdown-${postId}`);
  if (menu) menu.classList.toggle('show');
}

// Quick Post form setup
function setupQuickPost() {
  const form = document.getElementById('quickPostForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contentInput = document.getElementById('quickPostContent');
    const imageInput = document.getElementById('quickPostImage');
    const submitBtn = document.getElementById('quickPostSubmitBtn');

    const content = contentInput.value.trim();
    const image = imageInput ? imageInput.value.trim() : '';

    if (!content) {
      showToast('Please write something in your post', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Posting...';

    const res = await apiFetch('/api/posts', {
      method: 'POST',
      body: { content, image }
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>🚀</span> Post';

    if (res.success && res.data) {
      contentInput.value = '';
      if (imageInput) imageInput.value = '';
      showToast('Post created successfully!', 'success');

      // Prepend post to feed
      const feedContainer = document.getElementById('feedPostsContainer');
      const emptyState = feedContainer.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      feedContainer.insertAdjacentHTML('afterbegin', renderPostCardHTML(res.data));

      // Refresh left widget post count
      loadCurrentUserWidget();
    } else {
      showToast(res.message || 'Failed to create post', 'error');
    }
  });
}

// Toggle Like / Unlike Post
async function toggleLikePost(postId) {
  const btn = document.getElementById(`like-btn-${postId}`);
  const likesCountSpan = document.getElementById(`post-likes-count-${postId}`);
  if (!btn) return;

  const isCurrentlyLiked = btn.classList.contains('liked');
  const endpoint = `/api/posts/${postId}/like`;
  const method = isCurrentlyLiked ? 'DELETE' : 'POST';

  // Optimistic UI update
  const nowLiked = !isCurrentlyLiked;
  btn.classList.toggle('liked', nowLiked);
  btn.querySelector('.like-icon').textContent = nowLiked ? '❤️' : '🤍';
  btn.querySelector('.like-label').textContent = nowLiked ? 'Liked' : 'Like';

  const res = await apiFetch(endpoint, { method });

  if (res.success && res.data) {
    const count = res.data.likesCount;
    likesCountSpan.textContent = `${count} ${count === 1 ? 'like' : 'likes'}`;
  } else {
    // Revert on error
    btn.classList.toggle('liked', isCurrentlyLiked);
    btn.querySelector('.like-icon').textContent = isCurrentlyLiked ? '❤️' : '🤍';
    btn.querySelector('.like-label').textContent = isCurrentlyLiked ? 'Liked' : 'Like';
    showToast(res.message || 'Could not update like status', 'error');
  }
}

// Toggle Comments Panel and load comments
async function toggleCommentsSection(postId) {
  const section = document.getElementById(`comments-section-${postId}`);
  if (!section) return;

  if (section.style.display === 'none' || !section.style.display) {
    section.style.display = 'flex';
    loadCommentsForPost(postId);
  } else {
    section.style.display = 'none';
  }
}

// Load Comments for a specific post
async function loadCommentsForPost(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  if (!list) return;

  list.innerHTML = '<div class="spinner"></div>';

  const res = await apiFetch(`/api/posts/${postId}/comments`);

  if (res.success && res.data) {
    if (res.data.length === 0) {
      list.innerHTML = '<p style="color: var(--text-dim); font-size: 0.84rem; text-align: center; padding: 8px;">No comments yet. Be the first to share your thoughts!</p>';
      return;
    }

    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    list.innerHTML = res.data
      .map((c) => {
        const u = c.user || { name: 'User', username: 'user', profileImage: defaultAvatar };
        return `
          <div class="comment-item" id="comment-${c._id}">
            <a href="profile.html?id=${u._id}">
              <img src="${u.profileImage || defaultAvatar}" alt="${escapeHTML(u.name)}" class="avatar-sm" style="width: 28px; height: 28px;" onerror="this.src='${defaultAvatar}'">
            </a>
            <div class="comment-body">
              <div class="comment-header">
                <a href="profile.html?id=${u._id}" class="comment-user-name">${escapeHTML(u.name)}</a>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="comment-time">${formatTimeAgo(c.createdAt)}</span>
                  ${c.isOwner ? `<button class="comment-delete-btn" onclick="deleteComment('${c._id}', '${postId}')" title="Delete comment">🗑️</button>` : ''}
                </div>
              </div>
              <div class="comment-text">${escapeHTML(c.text)}</div>
            </div>
          </div>
        `;
      })
      .join('');
  } else {
    list.innerHTML = '<p style="color: var(--danger); font-size: 0.84rem;">Failed to load comments</p>';
  }
}

// Handle Enter key for comments
function handleCommentKeydown(event, postId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitComment(postId);
  }
}

// Submit a new comment
async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    showToast('Please enter a comment', 'error');
    return;
  }

  input.disabled = true;

  const res = await apiFetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: { text }
  });

  input.disabled = false;

  if (res.success && res.data) {
    input.value = '';
    showToast('Comment added!', 'success');

    // Reload comments
    loadCommentsForPost(postId);

    // Update comment count
    const countSpan = document.getElementById(`post-comments-count-${postId}`);
    if (countSpan) {
      const currentCount = parseInt(countSpan.textContent) || 0;
      const newCount = currentCount + 1;
      countSpan.textContent = `${newCount} ${newCount === 1 ? 'comment' : 'comments'}`;
    }
  } else {
    showToast(res.message || 'Could not post comment', 'error');
  }
}

// Delete comment
async function deleteComment(commentId, postId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;

  const res = await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });

  if (res.success) {
    showToast('Comment deleted', 'success');
    const commentEl = document.getElementById(`comment-${commentId}`);
    if (commentEl) commentEl.remove();

    // Update count
    const countSpan = document.getElementById(`post-comments-count-${postId}`);
    if (countSpan) {
      const currentCount = parseInt(countSpan.textContent) || 1;
      const newCount = Math.max(0, currentCount - 1);
      countSpan.textContent = `${newCount} ${newCount === 1 ? 'comment' : 'comments'}`;
    }
  } else {
    showToast(res.message || 'Failed to delete comment', 'error');
  }
}

// Open Edit Post Modal
async function openEditPostModal(postId) {
  activeEditPostId = postId;
  const res = await apiFetch(`/api/posts/${postId}`);

  if (res.success && res.data) {
    const post = res.data;
    document.getElementById('editPostContent').value = post.content || '';
    document.getElementById('editPostImage').value = post.image || '';

    const modal = document.getElementById('editPostModal');
    if (modal) modal.classList.add('active');
  } else {
    showToast('Unable to fetch post details for editing', 'error');
  }
}

function closeEditPostModal() {
  activeEditPostId = null;
  const modal = document.getElementById('editPostModal');
  if (modal) modal.classList.remove('active');
}

// Submit Edit Post
async function submitEditPost() {
  if (!activeEditPostId) return;

  const content = document.getElementById('editPostContent').value.trim();
  const image = document.getElementById('editPostImage').value.trim();

  if (!content) {
    showToast('Post content cannot be empty', 'error');
    return;
  }

  const res = await apiFetch(`/api/posts/${activeEditPostId}`, {
    method: 'PUT',
    body: { content, image }
  });

  if (res.success && res.data) {
    showToast('Post updated successfully!', 'success');
    // Save ID before closeEditPostModal() nullifies it
    const editedPostId = activeEditPostId;
    closeEditPostModal();

    // Replace post card in place
    const oldCard = document.getElementById(`post-${editedPostId}`);
    if (oldCard) {
      oldCard.outerHTML = renderPostCardHTML(res.data);
    }
  } else {
    showToast(res.message || 'Failed to update post', 'error');
  }
}

// Open Delete Post Confirmation Modal
function openDeletePostModal(postId) {
  activeDeletePostId = postId;
  const modal = document.getElementById('deletePostModal');
  if (modal) modal.classList.add('active');
}

function closeDeletePostModal() {
  activeDeletePostId = null;
  const modal = document.getElementById('deletePostModal');
  if (modal) modal.classList.remove('active');
}

// Confirm Delete Post
async function confirmDeletePost() {
  if (!activeDeletePostId) return;

  const res = await apiFetch(`/api/posts/${activeDeletePostId}`, { method: 'DELETE' });

  if (res.success) {
    showToast('Post deleted successfully', 'success');
    const card = document.getElementById(`post-${activeDeletePostId}`);
    if (card) {
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      setTimeout(() => card.remove(), 300);
    }
    closeDeletePostModal();
    loadCurrentUserWidget();
  } else {
    showToast(res.message || 'Failed to delete post', 'error');
  }
}
