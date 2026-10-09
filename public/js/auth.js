/**
 * ConnectHub - Authentication Handler (Login & Register)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already authenticated
  const isAuth = isAuthenticated();
  const path = window.location.pathname;

  if (isAuth && (path.endsWith('login.html') || path.endsWith('register.html'))) {
    window.location.href = 'index.html';
    return;
  }

  // Handle Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById('loginSubmitBtn');

      if (!identifier || !password) {
        showToast('Please enter both email/username and password', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { identifier, password }
      });

      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';

      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Welcome back to ConnectHub!', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } else {
        showToast(res.message || 'Invalid credentials', 'error');
      }
    });
  }

  // Handle Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = document.getElementById('registerSubmitBtn');

      // Validation
      if (!name || !username || !email || !password || !confirmPassword) {
        showToast('Please fill out all required fields', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
      }

      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        showToast('Please provide a valid email address', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { name, username, email, password, confirmPassword }
      });

      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';

      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Account created successfully! Welcome to ConnectHub!', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);
      } else {
        showToast(res.message || 'Registration failed', 'error');
      }
    });
  }
});

// Demo Account Auto-Fill Helper
function fillDemoCredentials() {
  const idInput = document.getElementById('identifier');
  const pwdInput = document.getElementById('password');
  if (idInput && pwdInput) {
    idInput.value = 'demo@connecthub.com';
    pwdInput.value = 'Demo123';
    showToast('Demo credentials filled. Click "Log In"!', 'info');
  }
}
