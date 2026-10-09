/**
 * ConnectHub - Dedicated Create Post Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('createPostForm');
  const contentInput = document.getElementById('postContent');
  const imageInput = document.getElementById('postImageUrl');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const charCounter = document.getElementById('charCounter');
  const submitBtn = document.getElementById('createPostSubmitBtn');

  // Character counter
  if (contentInput && charCounter) {
    contentInput.addEventListener('input', () => {
      const length = contentInput.value.length;
      charCounter.textContent = `${length} / 2000`;
      if (length > 1900) {
        charCounter.style.color = 'var(--danger)';
      } else {
        charCounter.style.color = 'var(--text-dim)';
      }
    });
  }

  // Image URL Preview
  if (imageInput && imagePreviewContainer && imagePreview) {
    imageInput.addEventListener('input', () => {
      const url = imageInput.value.trim();
      if (url) {
        imagePreview.src = url;
        imagePreviewContainer.style.display = 'block';
        imagePreview.onerror = () => {
          imagePreviewContainer.style.display = 'none';
        };
      } else {
        imagePreviewContainer.style.display = 'none';
      }
    });
  }

  // Submit Handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const content = contentInput.value.trim();
      const image = imageInput ? imageInput.value.trim() : '';

      if (!content) {
        showToast('Please write something in your post', 'error');
        return;
      }

      if (content.length > 2000) {
        showToast('Post exceeds maximum length of 2000 characters', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span> Publishing...';

      const res = await apiFetch('/api/posts', {
        method: 'POST',
        body: { content, image }
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🚀</span> Publish Post';

      if (res.success && res.data) {
        showToast('Post published successfully!', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } else {
        showToast(res.message || 'Failed to publish post', 'error');
      }
    });
  }
});
