import { DB } from '../db.js';

export const PurchasesPage = {
  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    const purchases = DB.getPurchases();
    const suppliers = DB.getSuppliers();
    const currency = DB.getSettings().currency;

    this.container.innerHTML = `
      <div class="table-card fade-in">
        <div class="table-header-bar">
          <div class="table-title">
            <i class="fa-solid fa-truck-ramp-box"></i>
            <span>Purchases History & Stock Inflow</span>
          </div>
          <div class="table-actions">
            <button id="new-purchase-btn" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i> Record New Purchase
            </button>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Purchase Ref</th>
                <th>Supplier Name</th>
                <th>Items Quantity</th>
                <th>Total Cost</th>
                <th>Amount Paid</th>
                <th>Status / Balance</th>
                <th style="width: 80px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="purchases-list">
              ${purchases.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No purchase history found.
                  </td>
                </tr>
              ` : purchases.map(pur => {
                const supplier = suppliers.find(s => s.id === pur.supplierId) || { name: 'Unknown Supplier' };
                const totalItems = pur.items.reduce((acc, item) => acc + Number(item.qty), 0);
                const isPaid = pur.balance === 0;
                const dateStr = new Date(pur.date).toLocaleString();
                
                // Exclude simple payments
                if (pur.totalCost === 0 && pur.paid > 0) {
                  return `
                    <tr>
                      <td>${dateStr}</td>
                      <td style="font-family: monospace;">ASA-SPMT-${pur.id.split('-')[1]}</td>
                      <td style="font-weight: 600;">${supplier.name}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>${currency} ${Number(pur.paid).toLocaleString()}</td>
                      <td><span class="badge badge-success">Cash Payment Sent</span></td>
                      <td style="text-align: center;">
                        <button class="btn btn-secondary btn-icon view-purchase-btn" data-id="${pur.id}">
                          <i class="fa-solid fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  `;
                }

                return `
                  <tr>
                    <td>${dateStr}</td>
                    <td style="font-family: monospace;">ASA-PUR-${pur.id.split('-')[1]}</td>
                    <td style="font-weight: 600;">${supplier.name}</td>
                    <td>${totalItems} units</td>
                    <td style="font-weight: bold; color: var(--text-white);">${currency} ${Number(pur.totalCost).toLocaleString()}</td>
                    <td>${currency} ${Number(pur.paid).toLocaleString()}</td>
                    <td>
                      <span class="badge ${isPaid ? 'badge-success' : 'badge-danger'}">
                        ${isPaid ? 'Fully Paid' : 'Credit / Balance: ' + currency + ' ' + Math.abs(pur.balance).toLocaleString()}
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <button class="btn btn-secondary btn-icon view-purchase-btn" data-id="${pur.id}">
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
    // Record purchase trigger
    document.getElementById('new-purchase-btn').addEventListener('click', () => this.openPurchaseFormModal());

    // Delegate view purchase
    const tableBody = document.getElementById('purchases-list');
    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.view-purchase-btn');
      if (btn) {
        const id = btn.getAttribute('data-id');
        this.openPurchaseDetailsModal(id);
      }
    });
  },

  openPurchaseDetailsModal(id) {
    const db = DB._getDB();
    const purchase = db.purchases.find(p => p.id === id);
    if (!purchase) return;

    const supplier = db.suppliers.find(s => s.id === purchase.supplierId) || { name: 'Unknown Supplier', phone: 'N/A' };
    const settings = DB.getSettings();

    let bodyHTML = '';
    if (purchase.totalCost === 0 && purchase.paid > 0) {
      bodyHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <div><strong>Supplier:</strong> ${supplier.name} (${supplier.phone})</div>
          <div><strong>Payment Date:</strong> ${new Date(purchase.date).toLocaleString()}</div>
          <div><strong>Type:</strong> Manual Ledger Payment (Outflow)</div>
          <div style="border-top: 1px dashed var(--border-color); padding-top: 12px; font-size: 1.1rem; color: var(--accent-green); font-weight: bold;">
            Amount Paid: ${settings.currency} ${Number(purchase.paid).toLocaleString()}
          </div>
        </div>
      `;
    } else {
      bodyHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Supplier:</strong> ${supplier.name}<br><small style="color: var(--text-muted);">${supplier.phone}</small></div>
            <div><strong>Date:</strong> ${new Date(purchase.date).toLocaleString()}</div>
          </div>
          
          <table class="data-table" style="font-size: 0.85rem; margin-top: 10px;">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Product Name</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items.map(item => `
                <tr>
                  <td>${item.sku}</td>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>${settings.currency} ${Number(item.cost).toLocaleString()}</td>
                  <td>${settings.currency} ${Number(item.total).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; border-top: 1px dashed var(--border-color); padding-top: 12px; font-size: 0.9rem;">
            <div>Subtotal: <strong>${settings.currency} ${Number(purchase.totalCost).toLocaleString()}</strong></div>
            <div>Paid: <strong style="color: var(--accent-green);">${settings.currency} ${Number(purchase.paid).toLocaleString()}</strong></div>
            <div>Balance: <strong style="color: ${purchase.balance === 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${settings.currency} ${Number(purchase.balance).toLocaleString()}</strong></div>
          </div>
        </div>
      `;
    }

    window.showModal(`Purchase details: ASA-PUR-${purchase.id.split('-')[1]}`, bodyHTML, `<button class="btn btn-secondary close-modal-trigger">Close</button>`);
  },

  openPurchaseFormModal() {
    const suppliers = DB.getSuppliers();
    const products = DB.getProducts();
    
    if (suppliers.length === 0) {
      window.showToast('Please add at least one Supplier first before recording purchases.', 'warning');
      return;
    }
    if (products.length === 0) {
      window.showToast('Please add products to your inventory first before recording purchases.', 'warning');
      return;
    }

    const bodyHTML = `
      <form id="purchase-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label for="pur-form-supplier">Select Supplier *</label>
          <select id="pur-form-supplier" class="select-filter" style="width: 100%;" required>
            <option value="" disabled selected>Select Supplier</option>
            ${suppliers.map(s => `<option value="${s.id}">${s.name} (Bal: ${DB.getSettings().currency} ${s.balance})</option>`).join('')}
          </select>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 15px;">
          <h4 style="color: var(--text-white); font-weight: 600; margin-bottom: 10px;">Purchase Cart</h4>
          
          <div style="display: flex; gap: 10px; margin-bottom: 12px;">
            <select id="pur-cart-product-select" class="select-filter" style="flex: 1;">
              <option value="" disabled selected>Choose product to add...</option>
              ${products.map(p => `<option value="${p.id}" data-cost="${p.cost}" data-sku="${p.sku}">${p.name} (${p.sku})</option>`).join('')}
            </select>
            <button type="button" id="pur-cart-add-btn" class="btn btn-secondary">
              <i class="fa-solid fa-cart-plus"></i> Add
            </button>
          </div>

          <!-- Purchase Cart Table -->
          <table class="data-table" style="font-size: 0.85rem;" id="pur-cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="width: 90px;">Cost Price</th>
                <th style="width: 80px;">Qty</th>
                <th style="width: 90px;">Subtotal</th>
                <th style="width: 40px; text-align: center;"></th>
              </tr>
            </thead>
            <tbody id="pur-cart-list">
              <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
                  Cart is empty. Add a product above.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <div style="font-size: 1.1rem; color: var(--text-white); font-weight: bold; margin-bottom: 10px;">
              Grand Total: <span id="pur-grand-total" style="color: var(--accent-red);">${DB.getSettings().currency} 0</span>
            </div>
            <div class="form-group">
              <label for="pur-form-paid">Amount Paid *</label>
              <input type="number" id="pur-form-paid" class="form-control" style="padding-left: 14px;" value="0" min="0" required>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; gap: 6px; font-size: 0.9rem; color: var(--text-muted);">
            <div>Total Cost: <span id="pur-calc-total">0</span></div>
            <div>Remaining Due: <span id="pur-calc-due" style="color: var(--accent-red); font-weight: bold;">0</span></div>
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="purchase-form" class="btn btn-success">
        <i class="fa-solid fa-file-invoice"></i> Save Stock Purchase
      </button>
    `;

    window.showModal('Record Inbound Inventory Purchase', bodyHTML, footerHTML);

    // Cart memory list
    const cart = [];
    const updateCartUI = () => {
      const list = document.getElementById('pur-cart-list');
      const currency = DB.getSettings().currency;
      
      if (cart.length === 0) {
        list.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
              Cart is empty. Add a product above.
            </td>
          </tr>
        `;
        document.getElementById('pur-grand-total').innerText = `${currency} 0`;
        document.getElementById('pur-calc-total').innerText = '0';
        document.getElementById('pur-calc-due').innerText = '0';
        return;
      }

      let grandTotal = 0;
      list.innerHTML = cart.map((item, idx) => {
        const itemTotal = item.cost * item.qty;
        grandTotal += itemTotal;
        return `
          <tr data-index="${idx}">
            <td>
              <div style="font-weight: 600; color: var(--text-white);">${item.name}</div>
              <small style="color: var(--text-muted); font-family: monospace;">${item.sku}</small>
            </td>
            <td>
              <input type="number" class="form-control cart-cost-input" style="padding-left: 8px; font-size: 0.8rem; width: 80px;" value="${item.cost}" min="0">
            </td>
            <td>
              <input type="number" class="form-control cart-qty-input" style="padding-left: 8px; font-size: 0.8rem; width: 70px;" value="${item.qty}" min="1">
            </td>
            <td style="font-weight: 600;">${currency} ${itemTotal.toLocaleString()}</td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-secondary btn-icon cart-del-btn" style="color: var(--accent-red); width: 26px; height: 26px;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      document.getElementById('pur-grand-total').innerText = `${currency} ${grandTotal.toLocaleString()}`;
      document.getElementById('pur-calc-total').innerText = `${currency} ${grandTotal.toLocaleString()}`;
      
      const paid = Number(document.getElementById('pur-form-paid').value) || 0;
      const due = grandTotal - paid;
      document.getElementById('pur-calc-due').innerText = `${currency} ${due.toLocaleString()}`;
    };

    // Add to cart listener
    document.getElementById('pur-cart-add-btn').addEventListener('click', () => {
      const select = document.getElementById('pur-cart-product-select');
      const opt = select.options[select.selectedIndex];
      if (!select.value) {
        window.showToast('Please select a product to add.', 'warning');
        return;
      }
      
      const productId = select.value;
      const name = opt.text.split(' (')[0];
      const sku = opt.getAttribute('data-sku');
      const cost = Number(opt.getAttribute('data-cost'));

      // Check if already in cart
      const existing = cart.find(x => x.productId === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ productId, name, sku, cost, qty: 1 });
      }

      updateCartUI();
      select.value = ''; // reset
    });

    // Delegate changes in cart inputs
    document.getElementById('pur-cart-list').addEventListener('input', (e) => {
      const tr = e.target.closest('tr');
      const idx = tr.getAttribute('data-index');
      
      if (e.target.classList.contains('cart-cost-input')) {
        cart[idx].cost = Number(e.target.value) || 0;
      } else if (e.target.classList.contains('cart-qty-input')) {
        cart[idx].qty = Math.max(1, Number(e.target.value)) || 1;
      }
      updateCartUI();
    });

    // Delegate remove item
    document.getElementById('pur-cart-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.cart-del-btn');
      if (btn) {
        const tr = btn.closest('tr');
        const idx = tr.getAttribute('data-index');
        cart.splice(idx, 1);
        updateCartUI();
      }
    });

    // Paid input updates dues
    document.getElementById('pur-form-paid').addEventListener('input', () => {
      const total = cart.reduce((acc, x) => acc + (x.cost * x.qty), 0);
      const paid = Number(document.getElementById('pur-form-paid').value) || 0;
      const due = total - paid;
      document.getElementById('pur-calc-due').innerText = `${DB.getSettings().currency} ${due.toLocaleString()}`;
    });

    // Save purchase listener
    document.getElementById('purchase-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (cart.length === 0) {
        window.showToast('Your purchase cart is empty. Please add items.', 'warning');
        return;
      }

      const supplierId = document.getElementById('pur-form-supplier').value;
      const paid = Number(document.getElementById('pur-form-paid').value) || 0;
      const totalCost = cart.reduce((acc, x) => acc + (x.cost * x.qty), 0);

      const purchaseData = {
        supplierId,
        items: cart.map(x => ({
          productId: x.productId,
          sku: x.sku,
          name: x.name,
          qty: x.qty,
          cost: x.cost,
          total: x.cost * x.qty
        })),
        totalCost,
        paid
      };

      const res = DB.addPurchase(purchaseData);
      if (res.success) {
        window.showToast('Purchase recorded successfully. Stock quantities and product unit costs updated.', 'success');
        window.closeModal();
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  }
};
