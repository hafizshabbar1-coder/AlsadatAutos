import { DB } from '../db.js';

export const ReturnsPage = {
  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    const returns = DB.getReturns();
    const sales = DB.getSales();
    const customers = DB.getCustomers();
    const currency = DB.getSettings().currency;

    this.container.innerHTML = `
      <div class="table-card fade-in">
        <div class="table-header-bar">
          <div class="table-title">
            <i class="fa-solid fa-rotate-left"></i>
            <span>Customer Sales Returns</span>
          </div>
          <div class="table-actions">
            <button id="new-return-btn" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i> Process Customer Return
            </button>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Return Date</th>
                <th>Return Ref</th>
                <th>Invoice Ref</th>
                <th>Customer Name</th>
                <th>Restocked Items</th>
                <th>Refund Total</th>
                <th style="width: 80px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="returns-list">
              ${returns.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No sales returns found.
                  </td>
                </tr>
              ` : returns.map(ret => {
                const sale = sales.find(s => s.id === ret.saleId) || { invoiceNo: 'N/A' };
                const customer = customers.find(c => c.id === ret.customerId) || { name: 'General Customer' };
                const totalItems = ret.items.reduce((acc, item) => acc + Number(item.qty), 0);
                const dateStr = new Date(ret.date).toLocaleString();

                return `
                  <tr>
                    <td>${dateStr}</td>
                    <td style="font-family: monospace;">ASA-RET-${ret.id.split('-')[1]}</td>
                    <td style="font-family: monospace; font-weight: 600;">${sale.invoiceNo}</td>
                    <td style="font-weight: 600;">${customer.name}</td>
                    <td>${totalItems} units</td>
                    <td style="font-weight: bold; color: var(--accent-red);">${currency} ${Number(ret.totalRefund).toLocaleString()}</td>
                    <td style="text-align: center;">
                      <button class="btn btn-secondary btn-icon view-return-btn" data-id="${ret.id}">
                        <i class="fa-solid fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Process new return trigger
    document.getElementById('new-return-btn').addEventListener('click', () => this.openReturnWorkflowModal());

    // Delegate view return details
    const listBody = document.getElementById('returns-list');
    listBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-return-btn');
      if (btn) {
        const id = btn.getAttribute('data-id');
        this.openReturnDetailsModal(id);
      }
    });
  },

  openReturnDetailsModal(id) {
    const db = DB._getDB();
    const ret = db.returns.find(r => r.id === id);
    if (!ret) return;

    const sale = db.sales.find(s => s.id === ret.saleId) || { invoiceNo: 'Unknown Invoice' };
    const customer = db.customers.find(c => c.id === ret.customerId) || { name: 'General Customer' };
    const settings = DB.getSettings();

    const bodyHTML = `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div><strong>Customer:</strong> ${customer.name}</div>
          <div><strong>Invoice Ref:</strong> ${sale.invoiceNo}</div>
          <div><strong>Return Date:</strong> ${new Date(ret.date).toLocaleString()}</div>
          <div><strong>Return Ref:</strong> ASA-RET-${ret.id.split('-')[1]}</div>
        </div>

        <table class="data-table" style="font-size: 0.85rem; margin-top: 10px;">
          <thead>
            <tr>
              <th>Returned SKU</th>
              <th>Product Name</th>
              <th>Qty Returned</th>
              <th>Refund Value</th>
            </tr>
          </thead>
          <tbody>
            ${ret.items.map(item => {
              const product = db.products.find(p => p.id === item.productId) || { sku: 'N/A', name: 'Unknown Product' };
              return `
                <tr>
                  <td>${product.sku}</td>
                  <td>${product.name}</td>
                  <td>${item.qty}</td>
                  <td>${settings.currency} ${Number(item.refundAmount).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div style="text-align: right; border-top: 1px dashed var(--border-color); padding-top: 12px; font-size: 1.1rem; color: var(--accent-red); font-weight: bold;">
          Total Refund Value: ${settings.currency} ${Number(ret.totalRefund).toLocaleString()}
        </div>
      </div>
    `;

    window.showModal(`Return transaction details`, bodyHTML, `<button class="btn btn-secondary close-modal-trigger">Close</button>`);
  },

  openReturnWorkflowModal() {
    const bodyHTML = `
      <div id="return-search-step" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label for="ret-search-invoice">Enter Sales Invoice Number (e.g. ASA-INV-1001) *</label>
          <div class="search-input-wrapper" style="width: 100%;">
            <i class="fa-solid fa-receipt" style="left: 14px;"></i>
            <input type="text" id="ret-search-invoice" class="form-control" placeholder="ASA-INV-XXXX" required style="width: 100%;">
          </div>
        </div>
        <button type="button" id="ret-find-invoice-btn" class="btn-primary-block">
          <i class="fa-solid fa-magnifying-glass"></i> Search Invoice
        </button>
      </div>

      <div id="return-items-step" class="hidden" style="display: flex; flex-direction: column; gap: 15px;">
        <!-- Injected dynamically on finding invoice -->
      </div>
    `;

    window.showModal('Process Product Return', bodyHTML, `<button class="btn btn-secondary close-modal-trigger">Cancel</button>`);

    document.getElementById('ret-find-invoice-btn').addEventListener('click', () => {
      const invNo = document.getElementById('ret-search-invoice').value.trim().toUpperCase();
      if (!invNo) {
        window.showToast('Please input an invoice number.', 'warning');
        return;
      }

      const db = DB._getDB();
      const sale = db.sales.find(s => s.invoiceNo === invNo);
      if (!sale) {
        window.showToast('Invoice number not found.', 'danger');
        return;
      }

      const customer = db.customers.find(c => c.id === sale.customerId) || { name: 'General Walk-in' };
      const currency = DB.getSettings().currency;

      // Render items step
      document.getElementById('return-search-step').classList.add('hidden');
      const itemsStep = document.getElementById('return-items-step');
      itemsStep.classList.remove('hidden');

      itemsStep.innerHTML = `
        <div style="background-color: var(--bg-input); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 0.85rem;">
          <div><strong>Invoice Ref:</strong> ${sale.invoiceNo}</div>
          <div><strong>Customer:</strong> ${customer.name}</div>
          <div><strong>Invoice Date:</strong> ${new Date(sale.date).toLocaleString()}</div>
        </div>

        <h4 style="color: var(--text-white); font-weight: 600; margin-top: 10px;">Select Items to Return:</h4>

        <table class="data-table" style="font-size: 0.85rem;" id="ret-items-table">
          <thead>
            <tr>
              <th style="width: 30px;"></th>
              <th>Product</th>
              <th>Price paid</th>
              <th>Qty bought</th>
              <th style="width: 80px;">Qty to return</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((item, idx) => `
              <tr data-product-id="${item.productId}" data-price="${item.price}" data-name="${item.name}">
                <td>
                  <input type="checkbox" class="ret-item-check" data-idx="${idx}" style="cursor: pointer; transform: scale(1.2);">
                </td>
                <td>
                  <div style="font-weight:600; color:var(--text-white);">${item.name}</div>
                  <small style="color: var(--text-muted); font-family: monospace;">${item.sku}</small>
                </td>
                <td>${currency} ${Number(item.price).toLocaleString()}</td>
                <td class="bought-qty">${item.qty} units</td>
                <td>
                  <input type="number" class="form-control ret-qty-input" style="padding-left: 8px; font-size: 0.8rem; width: 70px;" min="1" max="${item.qty}" value="1" disabled>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="border-top: 1px solid var(--border-color); padding-top: 15px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:1.1rem; color:var(--text-white); font-weight:bold;">
            Refund Value: <span id="ret-total-refund" style="color: var(--accent-red);">${currency} 0</span>
          </div>
          <label style="cursor:pointer; font-size: 0.85rem; display:flex; align-items:center; gap: 6px;">
            <input type="checkbox" id="ret-restock-check" checked style="transform: scale(1.1);"> Auto-restock returned units
          </label>
        </div>

        <div style="display:flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
          <button type="button" id="ret-back-btn" class="btn btn-secondary">Back</button>
          <button type="button" id="ret-confirm-btn" class="btn btn-danger">
            <i class="fa-solid fa-rotate-left"></i> Confirm Return & Refund
          </button>
        </div>
      `;

      // Back button listener
      document.getElementById('ret-back-btn').addEventListener('click', () => {
        itemsStep.classList.add('hidden');
        document.getElementById('return-search-step').classList.remove('hidden');
      });

      // Checkbox changes enable/disable input quantity
      const checks = document.querySelectorAll('.ret-item-check');
      const calculateRefund = () => {
        let totalRefund = 0;
        checks.forEach(chk => {
          if (chk.checked) {
            const tr = chk.closest('tr');
            const price = Number(tr.getAttribute('data-price'));
            const qty = Number(tr.querySelector('.ret-qty-input').value) || 0;
            totalRefund += price * qty;
          }
        });
        document.getElementById('ret-total-refund').innerText = `${currency} ${totalRefund.toLocaleString()}`;
      };

      checks.forEach(chk => {
        chk.addEventListener('change', (e) => {
          const tr = e.target.closest('tr');
          const qtyInput = tr.querySelector('.ret-qty-input');
          qtyInput.disabled = !e.target.checked;
          if (e.target.checked) qtyInput.value = 1;
          calculateRefund();
        });
      });

      // Quantity change updates refund total
      const qtyInputs = document.querySelectorAll('.ret-qty-input');
      qtyInputs.forEach(input => {
        input.addEventListener('input', () => {
          const max = Number(input.getAttribute('max'));
          let val = Number(input.value);
          if (val > max) {
            window.showToast(`Cannot return more than purchased (${max}).`, 'warning');
            input.value = max;
          }
          calculateRefund();
        });
      });

      // Confirm Return trigger
      document.getElementById('ret-confirm-btn').addEventListener('click', () => {
        const returnedItems = [];
        let totalRefund = 0;
        let selectedCount = 0;

        checks.forEach(chk => {
          if (chk.checked) {
            selectedCount++;
            const tr = chk.closest('tr');
            const productId = tr.getAttribute('data-product-id');
            const price = Number(tr.getAttribute('data-price'));
            const qty = Number(tr.querySelector('.ret-qty-input').value) || 0;
            const refundAmount = price * qty;
            totalRefund += refundAmount;

            returnedItems.push({
              productId,
              qty,
              refundAmount
            });
          }
        });

        if (selectedCount === 0) {
          window.showToast('Please select at least one item to return.', 'warning');
          return;
        }

        const autoRestock = document.getElementById('ret-restock-check').checked;

        const returnData = {
          saleId: sale.id,
          items: returnedItems,
          totalRefund,
          autoRestock
        };

        const res = DB.addReturn(returnData);
        if (res.success) {
          window.showToast('Customer return processed successfully. Ledger and stock levels updated.', 'success');
          window.closeModal();
          this.refresh();
        } else {
          window.showToast(res.message, 'danger');
        }
      });
    });
  }
};
