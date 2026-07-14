import { DB } from '../db.js';

export const SuppliersPage = {
  render(container) {
    this.container = container;
    this.selectedSupplierId = null;
    this.refresh();
  },

  refresh() {
    const suppliers = DB.getSuppliers();
    const currency = DB.getSettings().currency;

    this.container.innerHTML = `
      <div class="ledger-dashboard fade-in">
        <!-- Left Panel: Suppliers List -->
        <div class="table-card" style="margin-bottom: 0;">
          <div class="table-header-bar" style="padding: 15px;">
            <div class="table-title" style="font-size: 0.95rem;">
              <i class="fa-solid fa-handshake"></i>
              <span>Supplier Accounts</span>
            </div>
            <button id="add-supplier-btn" class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem;">
              <i class="fa-solid fa-plus"></i> New Supplier
            </button>
          </div>
          <div style="padding: 10px 15px; border-bottom: 1px solid var(--border-color);">
            <div class="search-input-wrapper" style="width: 100%;">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="supp-search" class="search-input" placeholder="Search supplier name..." style="width: 100%;">
            </div>
          </div>
          
          <div style="max-height: 480px; overflow-y: auto;" id="suppliers-list-panel">
            <!-- Supplier list injected here -->
          </div>
        </div>

        <!-- Right Panel: Supplier Ledger Details -->
        <div id="supplier-ledger-details-panel" class="table-card" style="margin-bottom: 0; min-height: 400px; display: flex; flex-direction: column;">
          <!-- Active ledger statement injected here -->
        </div>
      </div>
    `;

    this.renderSuppliersList();
    this.renderLedgerDetails();
    this.bindEvents();
  },

  renderSuppliersList() {
    const query = document.getElementById('supp-search').value.toLowerCase().trim();
    const listPanel = document.getElementById('suppliers-list-panel');
    const currency = DB.getSettings().currency;

    let suppliers = DB.getSuppliers();
    if (query) {
      suppliers = suppliers.filter(s => s.name.toLowerCase().includes(query) || s.phone.includes(query));
    }

    if (suppliers.length === 0) {
      listPanel.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No suppliers found.</div>`;
      return;
    }

    listPanel.innerHTML = suppliers.map(s => {
      const isSelected = s.id === this.selectedSupplierId;
      const weOwe = s.balance < 0; // negative means we owe them money
      const balColor = s.balance === 0 ? 'var(--text-muted)' : (weOwe ? 'var(--accent-red)' : 'var(--accent-green)');
      const balText = s.balance === 0 ? 'Balanced' : (weOwe ? `We Owe: ${currency} ${Math.abs(s.balance).toLocaleString()}` : `Credit: ${currency} ${s.balance.toLocaleString()}`);

      return `
        <div class="supp-list-item" data-id="${s.id}" style="padding: 12px 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; background: ${isSelected ? 'var(--bg-card-hover)' : 'transparent'}; border-left: 3px solid ${isSelected ? 'var(--accent-red)' : 'transparent'}; display: flex; justify-content: space-between; align-items: center; transition: all var(--transition-fast);">
          <div>
            <div style="font-weight: 600; color: var(--text-white); font-size: 0.9rem;">${s.name}</div>
            <small style="color: var(--text-muted); font-size: 0.75rem;"><i class="fa-solid fa-phone" style="font-size: 0.7rem; margin-right: 4px;"></i>${s.phone}</small>
          </div>
          <div style="font-size: 0.8rem; font-weight: 700; color: ${balColor}; text-align: right;">
            ${balText}
          </div>
        </div>
      `;
    }).join('');

    // Highlight hovering styling natively
    const items = listPanel.querySelectorAll('.supp-list-item');
    items.forEach(el => {
      el.addEventListener('mouseenter', () => { if (el.getAttribute('data-id') !== this.selectedSupplierId) el.style.background = 'rgba(255,255,255,0.02)'; });
      el.addEventListener('mouseleave', () => { if (el.getAttribute('data-id') !== this.selectedSupplierId) el.style.background = 'transparent'; });
    });
  },

  renderLedgerDetails() {
    const panel = document.getElementById('supplier-ledger-details-panel');
    const currency = DB.getSettings().currency;

    if (!this.selectedSupplierId) {
      panel.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); padding: 40px; text-align: center;">
          <i class="fa-solid fa-handshake-angle" style="font-size: 3rem; opacity: 0.2; margin-bottom: 15px;"></i>
          <h3>Supplier Ledger Statement</h3>
          <p style="font-size: 0.85rem; max-width: 300px; margin-top: 5px;">Select a supplier from the left list to view purchase logs, payments sent, and outstanding liability statements.</p>
        </div>
      `;
      return;
    }

    const { supplier, ledger } = DB.getSupplierLedger(this.selectedSupplierId);
    const weOwe = supplier.balance < 0;
    const balColor = supplier.balance === 0 ? 'var(--text-muted)' : (weOwe ? 'var(--accent-red)' : 'var(--accent-green)');
    const balStatus = supplier.balance === 0 ? 'Balanced' : (weOwe ? 'Outstanding Liability (We Owe)' : 'Advance Payment Credit');

    // Calculate running balance logs
    let running = 0;
    const ledgerRows = ledger.map(log => {
      // In purchases:
      // totalCost: cost of inventory we bought (debit to us / increases what we owe)
      // paid: cash we paid (credit to us / decreases what we owe)
      // balance: paid - totalCost (negative means we owe them).
      // Let's show: Cost of goods bought (Debit), Amount we paid (Credit), and the running balance.
      const debit = log.amount; // what we bought
      const credit = log.paid;   // what we paid
      
      running += log.balanceEffect;

      return `
        <tr>
          <td>${new Date(log.date).toLocaleString()}</td>
          <td>
            <span class="badge ${log.type === 'Purchase' && log.amount > 0 ? 'badge-info' : 'badge-success'}">
              ${log.type === 'Purchase' && log.amount === 0 ? 'Payment Sent' : log.type}
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
          <h2 style="color: var(--text-white); font-weight: 700;">${supplier.name}</h2>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
            <span><i class="fa-solid fa-phone" style="width: 16px;"></i> ${supplier.phone}</span>
            <span><i class="fa-solid fa-map-location-dot" style="width: 16px;"></i> ${supplier.address}</span>
          </div>
        </div>

        <div style="display: flex; gap: 15px; align-items: center;">
          <div class="ledger-balance-box" style="padding: 10px 20px; min-width: 180px;">
            <div class="ledger-balance-label">${balStatus}</div>
            <div class="ledger-balance-value ${weOwe ? 'negative' : (supplier.balance > 0 ? 'positive' : '')}">
              ${currency} ${Math.abs(supplier.balance).toLocaleString()}
            </div>
          </div>
          <button id="supp-record-payment-btn" class="btn btn-success" style="padding: 12px 18px;">
            <i class="fa-solid fa-hand-holding-dollar"></i> Send Cash Payment
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
              <th>Debit (We Bought)</th>
              <th>Credit (We Paid)</th>
              <th>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            ${ledger.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                  No transactions on record for this supplier.
                </td>
              </tr>
            ` : ledgerRows}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('supp-record-payment-btn').addEventListener('click', () => this.openRecordPaymentModal(supplier));
  },

  bindEvents() {
    // Search Supplier
    document.getElementById('supp-search').addEventListener('input', () => this.renderSuppliersList());

    // Add Supplier
    document.getElementById('add-supplier-btn').addEventListener('click', () => this.openAddSupplierModal());

    // Select Supplier delegator
    document.getElementById('suppliers-list-panel').addEventListener('click', (e) => {
      const item = e.target.closest('.supp-list-item');
      if (item) {
        this.selectedSupplierId = item.getAttribute('data-id');
        this.renderSuppliersList();
        this.renderLedgerDetails();
      }
    });
  },

  openAddSupplierModal() {
    const bodyHTML = `
      <form id="add-supp-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label for="as-name">Supplier / Distributor Name *</label>
          <input type="text" id="as-name" class="form-control" style="padding-left: 14px;" required placeholder="e.g. Bosch Pakistan Dist.">
        </div>
        <div class="form-group-row">
          <div class="form-group">
            <label for="as-phone">Phone Number *</label>
            <input type="text" id="as-phone" class="form-control" style="padding-left: 14px;" required placeholder="e.g. 021-1234567">
          </div>
          <div class="form-group">
            <label for="as-email">Email Address</label>
            <input type="email" id="as-email" class="form-control" style="padding-left: 14px;" placeholder="supplier@bosch.com">
          </div>
        </div>
        <div class="form-group">
          <label for="as-address">Office/Warehouse Address</label>
          <input type="text" id="as-address" class="form-control" style="padding-left: 14px;" placeholder="Street address details">
        </div>
        <div class="form-group">
          <label for="as-balance">Opening Balance (${DB.getSettings().currency})</label>
          <input type="number" id="as-balance" class="form-control" style="padding-left: 14px;" value="0" placeholder="Positive for advance paid, negative for unpaid liability">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="add-supp-form" class="btn btn-primary">Create Supplier Account</button>
    `;

    window.showModal('Create Supplier Ledger Account', bodyHTML, footerHTML);

    document.getElementById('add-supp-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('as-name').value.trim();
      const phone = document.getElementById('as-phone').value.trim();
      const email = document.getElementById('as-email').value.trim() || 'N/A';
      const address = document.getElementById('as-address').value.trim() || 'N/A';
      const balance = Number(document.getElementById('as-balance').value) || 0;

      const res = DB.saveSupplier({ name, phone, email, address, balance });
      if (res.success) {
        window.showToast('Supplier account created successfully!', 'success');
        window.closeModal();
        this.selectedSupplierId = res.supplier.id;
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  },

  openRecordPaymentModal(supplier) {
    const currency = DB.getSettings().currency;
    const bodyHTML = `
      <form id="supp-record-payment-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="background: var(--bg-input); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.9rem;">
          <div>Supplier: <strong>${supplier.name}</strong></div>
          <div style="margin-top: 6px;">Current Balance: <strong class="${supplier.balance < 0 ? 'color: var(--accent-red)' : ''}">${currency} ${supplier.balance.toLocaleString()}</strong></div>
        </div>
        <div class="form-group">
          <label for="srp-amount">Amount Sent Paid (${currency}) *</label>
          <input type="number" id="srp-amount" class="form-control" style="padding-left: 14px;" min="1" required placeholder="Enter payment amount sent">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="supp-record-payment-form" class="btn btn-success">
        <i class="fa-solid fa-save"></i> Save Payment Record
      </button>
    `;

    window.showModal('Record Cash Payment Sent to Supplier', bodyHTML, footerHTML);

    document.getElementById('supp-record-payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const amt = Number(document.getElementById('srp-amount').value) || 0;
      
      const res = DB.recordSupplierPayment(supplier.id, amt);
      if (res.success) {
        window.showToast('Supplier payment logged and ledger balance updated.', 'success');
        window.closeModal();
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  }
};
