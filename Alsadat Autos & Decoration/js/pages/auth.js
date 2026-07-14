import { DB } from '../db.js';

export const AuthPage = {
  render(container, route) {
    // Hide main wrapper, show auth container
    document.getElementById('app-container').classList.add('hidden');
    const authContainer = document.getElementById('auth-container');
    authContainer.classList.remove('hidden');

    if (route === 'login') {
      this.renderLogin(authContainer);
    } else if (route === 'register') {
      this.renderRegister(authContainer);
    } else if (route === 'forgot-password') {
      this.renderForgotPassword(authContainer);
    } else if (route === 'reset-password') {
      this.renderResetPassword(authContainer);
    }
  },

  renderLogin(container) {
    container.innerHTML = `
      <div class="auth-card fade-in">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fa-solid fa-gears"></i>
            <span>AL-SADAT AUTO</span>
          </div>
          <div class="auth-subtitle">Business Management & POS Platform</div>
        </div>
        <h2>Sign In to Account</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="login-username">Username</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-user"></i>
              <input type="text" id="login-username" class="form-control" placeholder="Enter username" required autocomplete="username">
            </div>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="login-password" class="form-control" placeholder="Enter password" required autocomplete="current-password">
            </div>
          </div>
          <div class="auth-action-row">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="remember-me"> Remember me
            </label>
            <a href="#/forgot-password" class="forgot-link">Forgot Password?</a>
          </div>
          <button type="submit" class="btn-primary-block">
            <i class="fa-solid fa-right-to-bracket"></i> Login Securely
          </button>
        </form>
        <div class="auth-footer">
          Don't have an account? <a href="#/register">Create one here</a>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value;
      const res = DB.login(u, p);
      if (res.success) {
        window.showToast('Login successful! Welcome back.', 'success');
        window.location.hash = '#/sales';
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  },

  renderRegister(container) {
    container.innerHTML = `
      <div class="auth-card fade-in">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fa-solid fa-gears"></i>
            <span>AL-SADAT AUTO</span>
          </div>
          <div class="auth-subtitle">Register New Staff Account</div>
        </div>
        <h2>Create Account</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="reg-fullname">Full Name</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-signature"></i>
              <input type="text" id="reg-fullname" class="form-control" placeholder="Enter full name" required>
            </div>
          </div>
          <div class="form-group">
            <label for="reg-email">Email Address</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-envelope"></i>
              <input type="email" id="reg-email" class="form-control" placeholder="staff@alsadat.com" required>
            </div>
          </div>
          <div class="form-group">
            <label for="reg-username">Choose Username</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-user"></i>
              <input type="text" id="reg-username" class="form-control" placeholder="e.g. zain123" required autocomplete="username">
            </div>
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="reg-password" class="form-control" placeholder="At least 6 characters" required autocomplete="new-password">
            </div>
          </div>
          <button type="submit" class="btn-primary-block">
            <i class="fa-solid fa-user-plus"></i> Register Member
          </button>
        </form>
        <div class="auth-footer">
          Already have an account? <a href="#/login">Login here</a>
        </div>
      </div>
    `;

    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const username = document.getElementById('reg-username').value.trim();
      const password = document.getElementById('reg-password').value;

      if (password.length < 6) {
        window.showToast('Password must be at least 6 characters.', 'warning');
        return;
      }

      const res = DB.registerUser({ name, email, username, password });
      if (res.success) {
        window.showToast('Account registered successfully! Please login.', 'success');
        window.location.hash = '#/login';
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  },

  renderForgotPassword(container) {
    container.innerHTML = `
      <div class="auth-card fade-in">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fa-solid fa-gears"></i>
            <span>AL-SADAT AUTO</span>
          </div>
          <div class="auth-subtitle">Password Recovery Assistant</div>
        </div>
        <h2>Forgot Password</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; margin-bottom: 20px; line-height: 1.4;">
          Please enter your registered username. If found, we will direct you to reset your password.
        </p>
        <form id="forgot-form">
          <div class="form-group">
            <label for="forgot-username">Username</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-user"></i>
              <input type="text" id="forgot-username" class="form-control" placeholder="Enter username" required>
            </div>
          </div>
          <button type="submit" class="btn-primary-block">
            <i class="fa-solid fa-key"></i> Recover Password
          </button>
        </form>
        <div class="auth-footer">
          <a href="#/login"><i class="fa-solid fa-arrow-left"></i> Back to Login</a>
        </div>
      </div>
    `;

    document.getElementById('forgot-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('forgot-username').value.trim();
      const db = DB._getDB();
      const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        window.showToast('Username matched. Directing to password reset.', 'success');
        localStorage.setItem('alsadat_reset_user', username);
        setTimeout(() => {
          window.location.hash = '#/reset-password';
        }, 1000);
      } else {
        window.showToast('Username not found in system records.', 'danger');
      }
    });
  },

  renderResetPassword(container) {
    const resetUser = localStorage.getItem('alsadat_reset_user');
    if (!resetUser) {
      window.location.hash = '#/login';
      return;
    }

    container.innerHTML = `
      <div class="auth-card fade-in">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fa-solid fa-gears"></i>
            <span>AL-SADAT AUTO</span>
          </div>
          <div class="auth-subtitle">Reset Password for <strong>${resetUser}</strong></div>
        </div>
        <h2>Reset Password</h2>
        <form id="reset-form">
          <div class="form-group">
            <label for="reset-password">New Password</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="reset-password" class="form-control" placeholder="At least 6 characters" required autocomplete="new-password">
            </div>
          </div>
          <div class="form-group">
            <label for="reset-confirm">Confirm Password</label>
            <div class="form-control-icon-wrapper">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="reset-confirm" class="form-control" placeholder="Repeat password" required autocomplete="new-password">
            </div>
          </div>
          <button type="submit" class="btn-primary-block">
            <i class="fa-solid fa-lock-open"></i> Reset Password
          </button>
        </form>
        <div class="auth-footer">
          <a href="#/login"><i class="fa-solid fa-arrow-left"></i> Cancel and Login</a>
        </div>
      </div>
    `;

    document.getElementById('reset-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = document.getElementById('reset-password').value;
      const p2 = document.getElementById('reset-confirm').value;

      if (p1.length < 6) {
        window.showToast('Password must be at least 6 characters.', 'warning');
        return;
      }
      if (p1 !== p2) {
        window.showToast('Passwords do not match.', 'danger');
        return;
      }

      const res = DB.resetPassword(resetUser, p1);
      if (res.success) {
        window.showToast('Password reset successfully! Please login.', 'success');
        localStorage.removeItem('alsadat_reset_user');
        window.location.hash = '#/login';
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  }
};
