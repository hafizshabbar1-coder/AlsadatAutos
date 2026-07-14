import { DB } from '../db.js';

export const CustomersPage = {
  render(container) {
    this.container = container;
    this.selectedCustomerId = null;
    this.refresh();
  },

  refresh() {
    const customers = DB.getCustomers();
    const currency = DB.getSettings().currency;

    this.container.innerHTML = `
      <div class="ledger-dashboard fade-in">
        <!-- Left Panel: Customers List -->
        <div class="table-card" style="margin-bottom: 0;">
          <div class="table-header-bar" style="padding: 15px;">
            <div class="table-title" style="font-size: 0.95rem;">
              <i class="fa-solid fa-users"></i>
              <span>Customer Accounts</span>
            </div>
            <button id="add-customer-btn" class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;">
              <i class="fa-solid fa-plus"></i> New Customer
            </button>
          </div>
          <div style="padding: 10px 15px; border-bottom: 1px solid var(--border-color);">
            <div class="search-input-wrapper" style="width: 100%;">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="cust-search" class="search-input" placeholder="Search customer name..." style="width: 100%;">
            </div>
          </div>
          
          <div style="max-height: 480px; overflow-y: auto;" id="customers-list-panel">
            <!-- Customer list injected here -->
          </div>
        </div>

        <!-- Right Panel: Customer Ledger Details -->
        <div id="ledger-details-panel" class="table-card" style="margin-bottom: 0; min-height: 400px; display: flex; flex-direction: column;">
          <!-- Active ledger statement injected here -->
        </div>
      </div>
    `;

    this.renderCustomersList();
    this.renderLedgerDetails();
    this.bindEvents();
  },

  renderCustomersList() {
    const query = document.getElementById('cust-search').value.toLowerCase().trim();
    const listPanel = document.getElementById('customers-list-panel');
    const currency = DB.getSettings().currency;

    let customers = DB.getCustomers();
    if (query) {
      customers = customers.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));
    }

    if (customers.length === 0) {
      listPanel.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No customers found.</div>`;
      return;
    }

    listPanel.innerHTML = customers.map(c => {
      const isSelected = c.id === this.selectedCustomerId;
      const isDue = c.balance < 0;
      const balColor = c.balance === 0 ? 'var(--text-muted)' : (isDue ? 'var(--accent-red)' : 'var(--accent-green)');
      const balText = c.balance === 0 ? 'Clear' : (isDue ? `Owes: ${currency} ${Math.abs(c.balance).toLocaleString()}` : `Credit: ${currency} ${c.balance.toLocaleString()}`);

      return `
        <div class="cust-list-item" data-id="${c.id}" style="padding: 12px 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; background: ${isSelected ? 'var(--bg-card-hover)' : 'transparent'}; border-left: 3px solid ${isSelected ? 'var(--accent-red)' : 'transparent'}; display: flex; justify-content: space-between; align-items: center; transition: all var(--transition-fast);">
          <div>
            <div style="font-weight: 600; color: var(--text-white); font-size: 0.9rem;">${c.name}</div>
            <small style="color: var(--text-muted); font-size: 0.75rem;"><i class="fa-solid fa-phone" style="font-size: 0.7rem; margin-right: 4px;"></i>${c.phone}</small>
          </div>
          <div style="font-size: 0.8rem; font-weight: 700; color: ${balColor}; text-align: right;">
            ${balText}
          </div>
        </div>
      `;
    }).join('');

    // Highlight hovering styling natively
    const items = listPanel.querySelectorAll('.cust-list-item');
    items.forEach(el => {
      el.addEventListener('mouseenter', () => { if (el.getAttribute('data-id') !== this.selectedCustomerId) el.style.background = 'rgba(255,255,255,0.02)'; });
      el.addEventListener('mouseleave', () => { if (el.getAttribute('data-id') !== this.selectedCustomerId) el.style.background = 'transparent'; });
    });
  },

  renderLedgerDetails() {
    const panel = document.getElementById('ledger-details-panel');
    const currency = DB.getSettings().currency;

    if (!this.selectedCustomerId) {
      panel.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); padding: 40px; text-align: center;">
          <i class="fa-solid fa-address-book" style="font-size: 3rem; opacity: 0.2; margin-bottom: 15px;"></i>
          <h3>Customer Ledger Statement</h3>
          <p style="font-size: 0.85rem; max-width: 300px; margin-top: 5px;">Select a customer from the left list to view transactions, invoices, payments, and outstanding balances.</p>
        </div>
      `;
      return;
    }

    const { customer, ledger } = DB.getCustomerLedger(this.selectedCustomerId);
    const isDue = customer.balance < 0;
    const balColor = customer.balance === 0 ? 'var(--text-muted)' : (isDue ? 'var(--accent-red)' : 'var(--accent-green)');
    const balStatus = customer.balance === 0 ? 'Balanced' : (isDue ? 'Outstanding Dues' : 'Advance Credit Balance');

    // Calculate running balance logs
    let running = 0;
    const ledgerRows = ledger.map(log => {
      // Invoices debit customer (decrease balance/make it negative), payments/returns credit customer (increase balance)
      // Wait, in our database:
      // sale.balance = Paid - GrandTotal.
      // If customer buys parts worth 10k, pays 6k. sale.balance = 6k - 10k = -4k. customer owes 4k.
      // Thus, Invoice Amount is the debit (grandTotal). Paid is the credit.
      // Let's show Debit (Amount charged), Credit (Amount paid), and running balance.
      // Customer Ledger starts with balance 0.
      // Invoice increases what they owe: running -= (grandTotal - paid).
      // Return reduces what they owe: running += refund.
      // Cash payment reduces what they owe: running += payment.
      
      const debit = log.type === 'Invoice' ? log.amount : 0;
      const credit = log.type === 'Invoice' ? log.paid : (log.type === 'Return' ? Math.abs(log.amount) : log.paid);
      
      running += log.balanceEffect;

      return `
        <tr>
          <td>${new Date(log.date).toLocaleString()}</td>
          <td>
            <span class="badge ${log.type === 'Invoice' ? 'badge-info' : (log.type === 'Return' ? 'badge-purple' : 'badge-success')}">
              ${log.type}
            </span>
          </td>
          <td style="font-family: monospace; font-weight: 600;">${log.ref}</td>
          <td style="color: var(--accent-red);">${debit > 0 ? currency + ' ' + debit.toLocaleString() : '-'}</td>
          <td style="color: var(--accent-green);">${credit > 0 ? currency + ' ' + credit.toLocaleString() : '-'}</td>
          <td style="font-weight: 700; color: ${running < 0 ? 'var(--accent-red)' : (running > 0 ? 'var(--accent-green)' : 'var(--text-white)')};">
            ${currency} ${running.toLocaleString()}
          </td>
        </tr>
      `;
    }).join('');

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
        <div>
          <h2 style="color: var(--text-white); font-weight: 700;">${customer.name}</h2>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
            <span><i class="fa-solid fa-phone" style="width: 16px;"></i> ${customer.phone}</span>
            <span><i class="fa-solid fa-map-location-dot" style="width: 16px;"></i> ${customer.address}</span>
          </div>
        </div>

        <div style="display: flex; gap: 15px; align-items: center;">
          <div class="ledger-balance-box" style="padding: 10px 20px; min-width: 180px;">
            <div class="ledger-balance-label">${balStatus}</div>
            <div class="ledger-balance-value ${isDue ? 'negative' : (customer.balance > 0 ? 'positive' : '')}">
              ${currency} ${Math.abs(customer.balance).toLocaleString()}
            </div>
          </div>
          <button id="record-payment-btn" class="btn btn-success" style="padding: 12px 18px;">
            <i class="fa-solid fa-hand-holding-dollar"></i> Record Payment
          </button>
        </div>
      </div>

      <div class="data-table-container" style="flex: 1;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction Type</th>
              <th>Reference ID</th>
              <th>Debit (Charged)</th>
              <th>Credit (Paid)</th>
              <th>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            ${ledger.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                  No transactions on record for this customer.
                </td>
              </tr>
            ` : ledgerRows}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('record-payment-btn').addEventListener('click', () => this.openRecordPaymentModal(customer));
  },

  bindEvents() {
    // Search Customer
    document.getElementById('cust-search').addEventListener('input', () => this.renderCustomersList());

    // Add Customer
    document.getElementById('add-customer-btn').addEventListener('click', () => this.openAddCustomerModal());

    // Select Customer delegator
    document.getElementById('customers-list-panel').addEventListener('click', (e) => {
      const item = e.target.closest('.cust-list-item');
      if (item) {
        this.selectedCustomerId = item.getAttribute('data-id');
        this.renderCustomersList();
        this.renderLedgerDetails();
      }
    });
  },

  openAddCustomerModal() {
    const bodyHTML = `
      <form id="add-cust-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label for="ac-name">Customer Name *</label>
          <input type="text" id="ac-name" class="form-control" style="padding-left: 14px;" required placeholder="Workshop or client name">
        </div>
        <div class="form-group-row">
          <div class="form-group">
            <label for="ac-phone">Phone Number *</label>
            <input type="text" id="ac-phone" class="form-control" style="padding-left: 14px;" required placeholder="e.g. 0300-1234567">
          </div>
          <div class="form-group">
            <label for="ac-email">Email Address</label>
            <input type="email" id="ac-email" class="form-control" style="padding-left: 14px;" placeholder="customer@gmail.com">
          </div>
        </div>
        <div class="form-group">
          <label for="ac-address">Shop/Billing Address</label>
          <input type="text" id="ac-address" class="form-control" style="padding-left: 14px;" placeholder="Street address details">
        </div>
        <div class="form-group">
          <label for="ac-balance">Opening Balance (${DB.getSettings().currency})</label>
          <input type="number" id="ac-balance" class="form-control" style="padding-left: 14px;" value="0" placeholder="Positive for credit, negative for outstanding debt">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="add-cust-form" class="btn btn-primary">Create Customer Account</button>
    `;

    window.showModal('Create Customer Ledger Account', bodyHTML, footerHTML);

    document.getElementById('add-cust-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('ac-name').value.trim();
      const phone = document.getElementById('ac-phone').value.trim();
      const email = document.getElementById('ac-email').value.trim() || 'N/A';
      const address = document.getElementById('ac-address').value.trim() || 'Walk-in';
      const balance = Number(document.getElementById('ac-balance').value) || 0;

      const res = DB.saveCustomer({ name, phone, email, address, balance });
      if (res.success) {
        window.showToast('Customer account created successfully!', 'success');
        window.closeModal();
        this.selectedCustomerId = res.customer.id;
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  },

  openRecordPaymentModal(customer) {
    const currency = DB.getSettings().currency;
    const bodyHTML = `
      <form id="record-payment-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.9rem;">
          <div>Customer: <strong>${customer.name}</strong></div>
          <div style="margin-top: 6px;">Current Balance: <strong class="${customer.balance < 0 ? 'color: var(--accent-red)' : ''}">${currency} ${customer.balance.toLocaleString()}</strong></div>
        </div>
        <div class="form-group">
          <label for="rp-amount">Amount Paid Received (${currency}) *</label>
          <input type="number" id="rp-amount" class="form-control" style="padding-left: 14px;" min="1" required placeholder="Enter cash paid amount">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="record-payment-form" class="btn btn-success">
        <i class="fa-solid fa-save"></i> Save Cash Receipt
      </button>
    `;

    window.showModal('Record Customer Cash Receipt', bodyHTML, footerHTML);

    document.getElementById('record-payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const amt = Number(document.getElementById('rp-amount').value) || 0;
      
      const res = DB.recordCustomerPayment(customer.id, amt);
      if (res.success) {
        window.showToast('Customer payment received and ledger balance updated.', 'success');
        window.closeModal();
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  }
};
