import { DB } from './db.js';
import { AuthPage } from './pages/auth.js';
import { ProductsPage } from './pages/products.js';
import { PurchasesPage } from './pages/purchases.js';
import { SalesPage } from './pages/sales.js';
import { ReturnsPage } from './pages/returns.js';
import { CustomersPage } from './pages/customers.js';
import { SuppliersPage } from './pages/suppliers.js';
import { SalaryPage } from './pages/salary.js';
import { ReportsPage } from './pages/reports.js';
import { SettingsPage } from './pages/settings.js';
import { Verify } from './verify.js';

// Global UI utility triggers
window.showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  else if (type === 'danger') iconClass = 'fa-circle-xmark';
  else if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 3s
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
};

window.showModal = (title, bodyHTML, footerHTML = '') => {
  const overlay = document.getElementById('modal-container');
  const content = document.getElementById('modal-content');
  
  content.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close-btn close-modal-trigger">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="modal-body">
      ${bodyHTML}
    </div>
    ${footerHTML ? `
      <div class="modal-footer">
        ${footerHTML}
      </div>
    ` : ''}
  `;
  
  overlay.classList.remove('hidden');

  // Attach modal close actions
  const closeTriggers = content.querySelectorAll('.close-modal-trigger');
  closeTriggers.forEach(btn => {
    btn.addEventListener('click', () => window.closeModal());
  });
};

window.closeModal = () => {
  const overlay = document.getElementById('modal-container');
  overlay.classList.add('hidden');
};

const AppRouter = {
  routes: {
    'login': { page: AuthPage, title: 'Login' },
    'register': { page: AuthPage, title: 'Register' },
    'forgot-password': { page: AuthPage, title: 'Forgot Password' },
    'reset-password': { page: AuthPage, title: 'Reset Password' },
    'sales': { page: SalesPage, title: 'Sales Invoice & POS' },
    'products': { page: ProductsPage, title: 'Products Stock Inventory' },
    'purchases': { page: PurchasesPage, title: 'Purchases & Supplier Dues' },
    'returns': { page: ReturnsPage, title: 'Customer Sales Returns' },
    'customers': { page: CustomersPage, title: 'Customer Account Ledger' },
    'suppliers': { page: SuppliersPage, title: 'Supplier Account Ledger' },
    'salary': { page: SalaryPage, title: 'Expenses & Salaries' },
    'reports': { page: ReportsPage, title: 'Reports & Analytics' },
    'settings': { page: SettingsPage, title: 'System Settings' }
  },

  init() {
    DB.init();
    Verify.run();
    
    // Register routing listener
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Initial routing pass
    this.handleRouting();
    
    // Sidebar navigation clicks
    this.bindSidebarEvents();

    // Start Live Clock
    this.startClock();
  },

  handleRouting() {
    const hash = window.location.hash || '#/sales';
    const routePath = hash.replace('#/', '');
    
    // Resolve route
    const route = this.routes[routePath] || this.routes['sales'];
    const user = DB.getCurrentUser();
    
    const isAuthRoute = ['login', 'register', 'forgot-password', 'reset-password'].includes(routePath);
    
    // Auth Guard Locks
    if (!user && !isAuthRoute) {
      window.location.hash = '#/login';
      return;
    }
    
    if (user && isAuthRoute) {
      window.location.hash = '#/sales';
      return;
    }

    if (isAuthRoute) {
      // Auth screen rendering
      route.page.render(document.getElementById('auth-container'), routePath);
    } else {
      // Main Application Screen rendering
      document.getElementById('auth-container').classList.add('hidden');
      const appContainer = document.getElementById('app-container');
      appContainer.classList.remove('hidden');

      // Update sidebar profiles
      document.getElementById('sidebar-user-name').innerText = user.name;
      document.getElementById('sidebar-user-role').innerText = user.role.toUpperCase() + ' ACCOUNT';
      document.getElementById('sidebar-user-avatar').innerText = user.name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase();

      // Update Settings Header
      document.getElementById('topbar-business-name').innerText = DB.getSettings().businessName;

      // Update title
      document.getElementById('current-page-title').innerText = route.title;

      // Highlight active sidebar navigation
      document.querySelectorAll('.nav-item').forEach(el => {
        if (el.getAttribute('data-page') === routePath) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });

      // Render module
      route.page.render(document.getElementById('page-content'));
    }
  },

  bindSidebarEvents() {
    // Sidebar toggle (desktop collapse)
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const icon = toggleBtn.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.className = 'fa-solid fa-chevron-right';
      } else {
        icon.className = 'fa-solid fa-chevron-left';
      }
    });

    // Mobile Hamburger Toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });

    // Close mobile menu on clicking nav items
    document.querySelector('.sidebar-nav').addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
    });

    // Close modal on click overlay outside card
    document.getElementById('modal-container').addEventListener('click', (e) => {
      if (e.target.id === 'modal-container') {
        window.closeModal();
      }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        DB.logout();
        window.location.hash = '#/login';
        window.showToast('Logout successful.', 'info');
      }
    });
  },

  startClock() {
    const clock = document.getElementById('clock-time');
    const tick = () => {
      const d = new Date();
      clock.innerText = d.toLocaleTimeString();
    };
    tick();
    setInterval(tick, 1000);
  }
};

// Bootstrap application on load
AppRouter.init();
export { AppRouter };
