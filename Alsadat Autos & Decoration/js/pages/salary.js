import { DB } from '../db.js';

export const SalaryPage = {
  render(container) {
    this.container = container;
    this.activeTab = 'expenses'; // Default tab
    this.refresh();
  },

  refresh() {
    const expenses = DB.getExpenses();
    const salaries = DB.getSalaries();
    const settings = DB.getSettings();
    const currency = settings.currency;

    // Calculate totals
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalSalaries = salaries.reduce((acc, curr) => acc + Number(curr.amount), 0);

    this.container.innerHTML = `
      <div class="fade-in">
        <!-- Dashboard Widgets -->
        <div class="dashboard-grid">
          <div class="kpi-card">
            <div class="kpi-details">
              <h3>Total Business Expenses</h3>
              <div class="kpi-value">${currency} ${totalExpenses.toLocaleString()}</div>
            </div>
            <div class="kpi-icon expense">
              <i class="fa-solid fa-receipt"></i>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-details">
              <h3>Total Salaries Paid</h3>
              <div class="kpi-value">${currency} ${totalSalaries.toLocaleString()}</div>
            </div>
            <div class="kpi-icon profit">
              <i class="fa-solid fa-user-tie"></i>
            </div>
          </div>
          <div class="kpi-card" style="grid-column: span 1;">
            <div class="kpi-details">
              <h3>Total Outflow (Combined)</h3>
              <div class="kpi-value">${currency} ${(totalExpenses + totalSalaries).toLocaleString()}</div>
            </div>
            <div class="kpi-icon stock">
              <i class="fa-solid fa-money-bill-trend-up"></i>
            </div>
          </div>
        </div>

        <!-- Tab Selection Menu -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
          <button class="btn ${this.activeTab === 'expenses' ? 'btn-primary' : 'btn-secondary'}" id="tab-expenses-btn">
            <i class="fa-solid fa-file-invoice-dollar"></i> Business Expenses
          </button>
          <button class="btn ${this.activeTab === 'salaries' ? 'btn-primary' : 'btn-secondary'}" id="tab-salaries-btn">
            <i class="fa-solid fa-users-gear"></i> Employee Salaries
          </button>
        </div>

        <!-- Tab content container -->
        <div id="tab-content-area">
          <!-- Injected dynamically based on tab -->
        </div>
      </div>
    `;

    this.renderTabContent();
    this.bindEvents();
  },

  renderTabContent() {
    const contentArea = document.getElementById('tab-content-area');
    const currency = DB.getSettings().currency;

    if (this.activeTab === 'expenses') {
      const expenses = DB.getExpenses();
      contentArea.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title">
              <i class="fa-solid fa-receipt"></i>
              <span>Operational Expense Ledger</span>
            </div>
            <button id="add-expense-btn" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i> Record New Expense
            </button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.length === 0 ? `
                  <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">
                      No expenses logged for this period.
                    </td>
                  </tr>
                ` : expenses.map(e => `
                  <tr>
                    <td>${new Date(e.date).toLocaleDateString()}</td>
                    <td><span class="badge badge-info">${e.category}</span></td>
                    <td>${e.description}</td>
                    <td style="font-weight: bold; color: var(--accent-red);">${currency} ${Number(e.amount).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('add-expense-btn').addEventListener('click', () => this.openAddExpenseModal());
    } else {
      const salaries = DB.getSalaries();
      contentArea.innerHTML = `
        <div class="table-card">
          <div class="table-header-bar">
            <div class="table-title">
              <i class="fa-solid fa-user-tie"></i>
              <span>Employee Salary Disbursals</span>
            </div>
            <button id="add-salary-btn" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i> Pay Employee Salary
            </button>
          </div>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee / Designation</th>
                  <th>Salary Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${salaries.length === 0 ? `
                  <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">
                      No salary records found.
                    </td>
                  </tr>
                ` : salaries.map(s => `
                  <tr>
                    <td>${new Date(s.date).toLocaleDateString()}</td>
                    <td style="font-weight: 600; color: var(--text-white);">${s.employeeName}</td>
                    <td style="font-weight: bold;">${currency} ${Number(s.amount).toLocaleString()}</td>
                    <td><span class="badge badge-success">${s.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('add-salary-btn').addEventListener('click', () => this.openPaySalaryModal());
    }
  },

  bindEvents() {
    // Tab togglers
    document.getElementById('tab-expenses-btn').addEventListener('click', () => {
      this.activeTab = 'expenses';
      this.refresh();
    });

    document.getElementById('tab-salaries-btn').addEventListener('click', () => {
      this.activeTab = 'salaries';
      this.refresh();
    });
  },

  openAddExpenseModal() {
    const categories = ['Utility', 'Rent', 'Maintenance', 'Tea & Refreshments', 'Stationery', 'Fuel', 'Miscellaneous'];
    const bodyHTML = `
      <form id="add-expense-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group-row">
          <div class="form-group">
            <label for="exp-form-category">Expense Category *</label>
            <select id="exp-form-category" class="select-filter" style="width: 100%;" required>
              ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="exp-form-amount">Amount (${DB.getSettings().currency}) *</label>
            <input type="number" id="exp-form-amount" class="form-control" style="padding-left: 14px;" min="1" required placeholder="Amount spent">
          </div>
        </div>

        <div class="form-group">
          <label for="exp-form-desc">Expense Description / Remarks *</label>
          <input type="text" id="exp-form-desc" class="form-control" style="padding-left: 14px;" required placeholder="e.g. Electric meter bill paid">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="add-expense-form" class="btn btn-primary">
        <i class="fa-solid fa-save"></i> Save Expense
      </button>
    `;

    window.showModal('Log Business Expense', bodyHTML, footerHTML);

    document.getElementById('add-expense-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const expenseData = {
        date: new Date().toISOString().split('T')[0],
        category: document.getElementById('exp-form-category').value,
        amount: Number(document.getElementById('exp-form-amount').value),
        description: document.getElementById('exp-form-desc').value.trim()
      };

      const res = DB.addExpense(expenseData);
      if (res.success) {
        window.showToast('Expense recorded successfully.', 'success');
        window.closeModal();
        this.refresh();
      } else {
        window.showToast('Error recording expense', 'danger');
      }
    });
  },

  openPaySalaryModal() {
    const bodyHTML = `
      <form id="pay-salary-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label for="sal-form-name">Employee Name & Designation *</label>
          <input type="text" id="sal-form-name" class="form-control" style="padding-left: 14px;" required placeholder="e.g. Sajid Mahmood (Sales Manager)">
        </div>

        <div class="form-group">
          <label for="sal-form-amount">Disbursed Salary Amount (${DB.getSettings().currency}) *</label>
          <input type="number" id="sal-form-amount" class="form-control" style="padding-left: 14px;" min="1" required placeholder="Salary amount in cash">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="pay-salary-form" class="btn btn-success">
        <i class="fa-solid fa-save"></i> Disburse Salary
      </button>
    `;

    window.showModal('Disburse Employee Salary', bodyHTML, footerHTML);

    document.getElementById('pay-salary-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const salaryData = {
        date: new Date().toISOString().split('T')[0],
        employeeName: document.getElementById('sal-form-name').value.trim(),
        amount: Number(document.getElementById('sal-form-amount').value),
        status: 'Paid'
      };

      const res = DB.addSalary(salaryData);
      if (res.success) {
        window.showToast('Employee salary logged as paid.', 'success');
        window.closeModal();
        this.refresh();
      } else {
        window.showToast('Error logging salary payment.', 'danger');
      }
    });
  }
};
