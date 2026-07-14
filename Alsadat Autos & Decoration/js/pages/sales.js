import { DB } from '../db.js';

export const SalesPage = {
  render(container) {
    this.container = container;
    this.cart = [];
    this.priceType = 'Retail (B)'; // Default to Retail
    this.selectedCustomerId = 'c3'; // Default to General Customer (c3)
    this.discount = 0;
    this.paidAmount = 0;

    this.refresh();
  },

  refresh() {
    const products = DB.getProducts();
    const customers = DB.getCustomers();
    const settings = DB.getSettings();

    this.container.innerHTML = `
      <div class="pos-container fade-in">
        <!-- Left Catalog Panel -->
        <div class="pos-catalog-panel">
          <div class="pos-search-header">
            <div class="pos-search-input-wrapper">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="pos-search" class="pos-search-input" placeholder="Search by product SKU or Name... (Type SKU for fast scan)">
            </div>
            <button id="clear-search-btn" class="btn btn-secondary">Clear</button>
          </div>
          
          <div class="pos-catalog-grid" id="pos-catalog-grid">
            <!-- Dynamic products injected here -->
          </div>
        </div>

        <!-- Right Cart Panel -->
        <div class="pos-cart-panel">
          <div class="pos-cart-header">
            <div style="font-weight: 700; color: var(--text-white);">
              <i class="fa-solid fa-cart-shopping"></i> Active Cart
            </div>
            <div class="price-type-toggle">
              <button class="price-type-btn ${this.priceType === 'Wholesale (A)' ? 'active' : ''}" id="toggle-wholesale">Wholesale (A)</button>
              <button class="price-type-btn ${this.priceType === 'Retail (B)' ? 'active' : ''}" id="toggle-retail">Retail (B)</button>
            </div>
          </div>

          <div class="pos-cart-items" id="pos-cart-list">
            <!-- Cart items injected here -->
          </div>

          <!-- Checkout Details -->
          <div class="pos-checkout-section">
            <div class="pos-customer-select-row">
              <label for="pos-customer-select">Customer (Ledger Linked)</label>
              <div class="customer-select-container">
                <select id="pos-customer-select" class="select-filter">
                  ${customers.map(c => `<option value="${c.id}" ${c.id === this.selectedCustomerId ? 'selected' : ''}>${c.name} (Bal: ${settings.currency} ${c.balance})</option>`).join('')}
                </select>
                <button type="button" id="pos-quick-cust-btn" class="btn btn-secondary" title="Add New Customer" style="padding: 0 10px;">
                  <i class="fa-solid fa-user-plus"></i>
                </button>
              </div>
            </div>

            <table class="pos-totals-table">
              <tr>
                <td>Subtotal</td>
                <td id="pos-subtotal">${settings.currency} 0</td>
              </tr>
              <tr>
                <td>Tax (${settings.taxRate}%)</td>
                <td id="pos-tax">${settings.currency} 0</td>
              </tr>
              <tr>
                <td>Discount Price</td>
                <td>
                  <input type="number" id="pos-discount" class="pos-checkout-input" style="width: 80px; text-align: right; display: inline-block; padding: 2px 6px;" value="${this.discount}" min="0">
                </td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total</td>
                <td id="pos-grand-total">${settings.currency} 0</td>
              </tr>
            </table>

            <div class="pos-checkout-inputs">
              <div class="pos-checkout-input-group">
                <label for="pos-paid-input">Cash Paid</label>
                <input type="number" id="pos-paid-input" class="pos-checkout-input" value="${this.paidAmount}" min="0">
              </div>
              <div class="pos-checkout-input-group">
                <label id="pos-due-label">Change Due</label>
                <div style="font-weight: 800; font-size: 1.1rem; padding: 6px 0;" id="pos-due-val">
                  ${settings.currency} 0
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
              <button id="pos-clear-cart" class="btn btn-secondary">
                <i class="fa-solid fa-trash-arrow-up"></i> Clear
              </button>
              <button id="pos-pay-print" class="btn btn-primary" style="background: linear-gradient(135deg, var(--accent-green), #20bf6b);">
                <i class="fa-solid fa-print"></i> Pay & Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Hidden Print Template placeholder -->
      <div id="invoice-print-area"></div>
    `;

    this.renderCatalog();
    this.renderCart();
    this.bindEvents();
  },

  renderCatalog() {
    const grid = document.getElementById('pos-catalog-grid');
    const query = document.getElementById('pos-search').value.toLowerCase().trim();
    const products = DB.getProducts();
    const settings = DB.getSettings();

    let filtered = products;
    if (query) {
      filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">
          <i class="fa-solid fa-box-open" style="font-size: 2.5rem; opacity: 0.3; margin-bottom: 10px;"></i>
          <div>No products matching catalog search.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const price = this.priceType === 'Wholesale (A)' ? p.wholesale : p.retail;
      const isLow = p.stock < 5;
      const isOut = p.stock <= 0;
      
      return `
        <div class="pos-product-card ${isOut ? 'disabled' : ''}" data-id="${p.id}" style="${isOut ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
          <img src="${p.image || ''}" class="pos-prod-img" onerror="this.src='https://placehold.co/150x150/1b263b/f1f5f9?text=Parts'">
          <div class="pos-prod-name">${p.name}</div>
          <div class="pos-prod-sku">${p.sku}</div>
          <div class="pos-prod-footer">
            <div class="pos-prod-price">${settings.currency} ${price.toLocaleString()}</div>
            <div class="pos-prod-stock ${isLow ? 'low-stock' : ''}">
              ${isOut ? 'Out of stock' : `${p.stock} units`}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // If exact SKU code matches during scan and catalog has only 1 product, auto-add it!
    if (query && filtered.length === 1 && filtered[0].sku.toLowerCase() === query) {
      const match = filtered[0];
      if (match.stock > 0) {
        this.addToCart(match.id);
        document.getElementById('pos-search').value = '';
        this.renderCatalog();
      }
    }
  },

  renderCart() {
    const list = document.getElementById('pos-cart-list');
    const settings = DB.getSettings();
    
    if (this.cart.length === 0) {
      list.innerHTML = `
        <div class="empty-cart-view">
          <i class="fa-solid fa-basket-shopping"></i>
          <div>POS Cart is empty. Click catalog items or type SKU code to scan.</div>
        </div>
      `;
      this.calculateTotals();
      return;
    }

    list.innerHTML = this.cart.map((item, idx) => {
      const price = this.priceType === 'Wholesale (A)' ? item.wholesale : item.retail;
      const total = price * item.qty;
      
      return `
        <div class="cart-item" data-index="${idx}">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">
              <span>SKU: ${item.sku}</span> | <span style="color: var(--accent-red); font-weight: bold;">Stock: ${item.stock}</span>
            </div>
            <div class="cart-item-price-info">
              <span style="font-weight: 600;">${settings.currency} ${price.toLocaleString()}</span>
            </div>
          </div>
          <div class="cart-item-qty-actions">
            <button class="cart-qty-btn cart-minus">-</button>
            <input type="number" class="form-control cart-qty-val" style="padding: 2px; width: 40px; text-align: center; font-size: 0.8rem; background: var(--bg-input); border-color: var(--border-color);" value="${item.qty}">
            <button class="cart-qty-btn cart-plus">+</button>
          </div>
          <div class="cart-item-total">
            ${settings.currency} ${total.toLocaleString()}
          </div>
          <button class="cart-item-remove" title="Remove item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');

    this.calculateTotals();
  },

  addToCart(productId) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      window.showToast('This product is out of stock.', 'warning');
      return;
    }

    const existing = this.cart.find(item => item.id === productId);
    if (existing) {
      if (existing.qty >= product.stock) {
        window.showToast(`Insufficient stock. Maximum available is ${product.stock}.`, 'warning');
        return;
      }
      existing.qty += 1;
    } else {
      this.cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        cost: product.cost,
        wholesale: product.wholesale,
        retail: product.retail,
        stock: product.stock,
        qty: 1
      });
    }

    this.renderCart();
    window.showToast(`${product.name} added to cart`, 'info');
  },

  calculateTotals() {
    const settings = DB.getSettings();
    let subtotal = 0;

    this.cart.forEach(item => {
      const price = this.priceType === 'Wholesale (A)' ? item.wholesale : item.retail;
      subtotal += price * item.qty;
    });

    const tax = Math.round(subtotal * (settings.taxRate / 100));
    const grandTotal = Math.max(0, subtotal + tax - this.discount);

    document.getElementById('pos-subtotal').innerText = `${settings.currency} ${subtotal.toLocaleString()}`;
    document.getElementById('pos-tax').innerText = `${settings.currency} ${tax.toLocaleString()}`;
    document.getElementById('pos-grand-total').innerText = `${settings.currency} ${grandTotal.toLocaleString()}`;

    // Update Change Due / Ledger Balance
    const changeVal = document.getElementById('pos-due-val');
    const changeLabel = document.getElementById('pos-due-label');
    const remaining = this.paidAmount - grandTotal;

    if (remaining >= 0) {
      changeLabel.innerText = 'Change Due';
      changeVal.innerText = `${settings.currency} ${remaining.toLocaleString()}`;
      changeVal.style.color = 'var(--accent-green)';
    } else {
      changeLabel.innerText = 'Add Dues to Ledger';
      changeVal.innerText = `${settings.currency} ${Math.abs(remaining).toLocaleString()}`;
      changeVal.style.color = 'var(--accent-red)';
    }
  },

  bindEvents() {
    // Product Search Filter
    document.getElementById('pos-search').addEventListener('input', () => this.renderCatalog());
    document.getElementById('clear-search-btn').addEventListener('click', () => {
      document.getElementById('pos-search').value = '';
      this.renderCatalog();
    });

    // Catalog item select
    document.getElementById('pos-catalog-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.pos-product-card');
      if (card) {
        const id = card.getAttribute('data-id');
        this.addToCart(id);
      }
    });

    // Cart Quantity updates + delete delegation
    const cartList = document.getElementById('pos-cart-list');
    
    cartList.addEventListener('click', (e) => {
      const itemRow = e.target.closest('.cart-item');
      if (!itemRow) return;
      const idx = itemRow.getAttribute('data-index');

      if (e.target.classList.contains('cart-minus')) {
        this.cart[idx].qty = Math.max(1, this.cart[idx].qty - 1);
        this.renderCart();
      } else if (e.target.classList.contains('cart-plus')) {
        const max = this.cart[idx].stock;
        if (this.cart[idx].qty >= max) {
          window.showToast(`Insufficient stock. Only ${max} units available.`, 'warning');
          return;
        }
        this.cart[idx].qty += 1;
        this.renderCart();
      } else if (e.target.closest('.cart-item-remove')) {
        this.cart.splice(idx, 1);
        this.renderCart();
      }
    });

    // Manual quantity value inputs
    cartList.addEventListener('change', (e) => {
      if (e.target.classList.contains('cart-qty-val')) {
        const itemRow = e.target.closest('.cart-item');
        const idx = itemRow.getAttribute('data-index');
        const max = this.cart[idx].stock;
        let val = Math.max(1, parseInt(e.target.value) || 1);
        
        if (val > max) {
          window.showToast(`Insufficient stock. Reverting to maximum (${max}).`, 'warning');
          val = max;
        }
        this.cart[idx].qty = val;
        this.renderCart();
      }
    });

    // Toggle pricing types
    document.getElementById('toggle-wholesale').addEventListener('click', () => {
      this.priceType = 'Wholesale (A)';
      document.getElementById('toggle-wholesale').classList.add('active');
      document.getElementById('toggle-retail').classList.remove('active');
      this.renderCatalog();
      this.renderCart();
    });

    document.getElementById('toggle-retail').addEventListener('click', () => {
      this.priceType = 'Retail (B)';
      document.getElementById('toggle-retail').classList.add('active');
      document.getElementById('toggle-wholesale').classList.remove('active');
      this.renderCatalog();
      this.renderCart();
    });

    // Discount input change
    document.getElementById('pos-discount').addEventListener('input', (e) => {
      this.discount = Math.max(0, Number(e.target.value) || 0);
      this.calculateTotals();
    });

    // Customer selection
    document.getElementById('pos-customer-select').addEventListener('change', (e) => {
      this.selectedCustomerId = e.target.value;
    });

    // Cash Paid input change
    document.getElementById('pos-paid-input').addEventListener('input', (e) => {
      this.paidAmount = Math.max(0, Number(e.target.value) || 0);
      this.calculateTotals();
    });

    // Clear Cart
    document.getElementById('pos-clear-cart').addEventListener('click', () => {
      if (confirm('Clear entire cart?')) {
        this.cart = [];
        this.discount = 0;
        this.paidAmount = 0;
        this.refresh();
      }
    });

    // Quick Add Customer trigger
    document.getElementById('pos-quick-cust-btn').addEventListener('click', () => this.openQuickCustomerModal());

    // Pay & Print Invoice
    document.getElementById('pos-pay-print').addEventListener('click', () => this.processCheckout());
  },

  openQuickCustomerModal() {
    const bodyHTML = `
      <form id="quick-cust-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div class="form-group">
          <label for="qc-name">Customer Name *</label>
          <input type="text" id="qc-name" class="form-control" style="padding-left: 14px;" required placeholder="Workshop or person name">
        </div>
        <div class="form-group">
          <label for="qc-phone">Phone Number</label>
          <input type="text" id="qc-phone" class="form-control" style="padding-left: 14px;" placeholder="e.g. 0300-1234567">
        </div>
        <div class="form-group">
          <label for="qc-address">Billing Address</label>
          <input type="text" id="qc-address" class="form-control" style="padding-left: 14px;" placeholder="Address details">
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="quick-cust-form" class="btn btn-primary">Save Customer</button>
    `;

    window.showModal('Register Customer', bodyHTML, footerHTML);

    document.getElementById('quick-cust-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('qc-name').value.trim();
      const phone = document.getElementById('qc-phone').value.trim() || 'N/A';
      const address = document.getElementById('qc-address').value.trim() || 'Walk-in';

      const res = DB.saveCustomer({ name, phone, address, balance: 0 });
      if (res.success) {
        window.showToast('Customer registered successfully!', 'success');
        window.closeModal();
        
        // Update selection in active page
        this.selectedCustomerId = res.customer.id;
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  },

  processCheckout() {
    if (this.cart.length === 0) {
      window.showToast('Cart is empty. Add products to create invoice.', 'warning');
      return;
    }

    const settings = DB.getSettings();
    let subtotal = 0;
    const saleItems = this.cart.map(item => {
      const price = this.priceType === 'Wholesale (A)' ? item.wholesale : item.retail;
      const total = price * item.qty;
      subtotal += total;

      return {
        productId: item.id,
        sku: item.sku,
        name: item.name,
        qty: item.qty,
        price: price,
        total: total
      };
    });

    const tax = Math.round(subtotal * (settings.taxRate / 100));
    const grandTotal = Math.max(0, subtotal + tax - this.discount);
    
    // Save to DB
    const saleData = {
      customerId: this.selectedCustomerId,
      priceType: this.priceType,
      items: saleItems,
      total: subtotal,
      tax: tax,
      discount: this.discount,
      grandTotal: grandTotal,
      paid: this.paidAmount
    };

    const res = DB.addSale(saleData);
    if (!res.success) {
      window.showToast(res.message, 'danger');
      return;
    }

    const sale = res.sale;
    window.showToast(`Invoice generated: ${sale.invoiceNo}.`, 'success');

    // Create the Receipt Print Layout in background for standard window.print()
    const customer = DB.getCustomer(this.selectedCustomerId) || { name: 'General Walk-in', phone: '' };
    const printArea = document.getElementById('invoice-print-area');
    
    printArea.innerHTML = `
      <div class="invoice-print-container">
        <div class="invoice-print-header">
          <h2>${settings.businessName}</h2>
          <div>${settings.receiptHeader.replace(/\n/g, '<br>')}</div>
          <div style="font-size: 0.75rem; margin-top: 6px;">
            Phone: ${settings.phone} | Email: ${settings.email}
          </div>
        </div>
        
        <div class="invoice-print-divider"></div>
        
        <table style="width: 100%; font-size: 0.8rem; line-height: 1.3;">
          <tr>
            <td><strong>Invoice No:</strong></td>
            <td style="text-align: right;">${sale.invoiceNo}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong></td>
            <td style="text-align: right;">${new Date(sale.date).toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Customer:</strong></td>
            <td style="text-align: right;">${customer.name}</td>
          </tr>
          <tr>
            <td><strong>Price Mode:</strong></td>
            <td style="text-align: right;">${this.priceType}</td>
          </tr>
        </table>
        
        <div class="invoice-print-divider"></div>
        
        <table class="invoice-print-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">${item.price}</td>
                <td style="text-align: right;">${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="invoice-print-divider"></div>
        
        <table class="invoice-print-totals">
          <tr>
            <td>Subtotal:</td>
            <td>${settings.currency} ${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td>GST Tax (${settings.taxRate}%):</td>
            <td>${settings.currency} ${tax.toLocaleString()}</td>
          </tr>
          ${this.discount > 0 ? `
            <tr>
              <td>Discount Applied:</td>
              <td>-${settings.currency} ${this.discount.toLocaleString()}</td>
            </tr>
          ` : ''}
          <tr style="font-weight: bold; font-size: 0.9rem;">
            <td>Grand Total:</td>
            <td>${settings.currency} ${grandTotal.toLocaleString()}</td>
          </tr>
          <tr style="border-top: 1px dashed #000; padding-top: 4px;">
            <td>Amount Paid:</td>
            <td>${settings.currency} ${this.paidAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>${this.paidAmount >= grandTotal ? 'Change Given:' : 'Ledger Due Balance:'}</td>
            <td style="font-weight: bold;">
              ${settings.currency} ${Math.abs(this.paidAmount - grandTotal).toLocaleString()}
            </td>
          </tr>
        </table>
        
        <div class="invoice-print-divider"></div>
        
        <div class="invoice-print-footer">
          ${settings.receiptFooter}
        </div>
      </div>
    `;

    // Build WhatsApp Invoice Text
    let whatsappText = `*${settings.businessName}*\n`;
    whatsappText += `*Invoice No:* ${sale.invoiceNo}\n`;
    whatsappText += `*Date:* ${new Date(sale.date).toLocaleString()}\n`;
    whatsappText += `*Customer:* ${customer.name}\n`;
    whatsappText += `--------------------------\n`;
    sale.items.forEach((item, idx) => {
      whatsappText += `${idx+1}. ${item.name} x ${item.qty} = ${settings.currency} ${item.total.toLocaleString()}\n`;
    });
    whatsappText += `--------------------------\n`;
    whatsappText += `*Subtotal:* ${settings.currency} ${subtotal.toLocaleString()}\n`;
    whatsappText += `*Tax (${settings.taxRate}%):* ${settings.currency} ${tax.toLocaleString()}\n`;
    if (this.discount > 0) {
      whatsappText += `*Discount:* -${settings.currency} ${this.discount.toLocaleString()}\n`;
    }
    whatsappText += `*Grand Total:* ${settings.currency} ${grandTotal.toLocaleString()}\n`;
    whatsappText += `*Paid:* ${settings.currency} ${this.paidAmount.toLocaleString()}\n`;
    whatsappText += `*${this.paidAmount >= grandTotal ? 'Change' : 'Dues'}:* ${settings.currency} ${Math.abs(this.paidAmount - grandTotal).toLocaleString()}\n`;
    whatsappText += `--------------------------\n`;
    whatsappText += `${settings.receiptFooter}`;

    const encodedText = encodeURIComponent(whatsappText);
    const cleanedPhone = customer.phone && customer.phone !== 'N/A' ? customer.phone.replace(/\D/g, '') : '';
    // Format to international format for Pakistan (+92) if not already formatted
    const formattedPhone = cleanedPhone ? (cleanedPhone.startsWith('92') || cleanedPhone.startsWith('1') ? cleanedPhone : '92' + cleanedPhone.replace(/^0/, '')) : '';
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // Show Success dialog modal
    const successModalBody = `
      <div style="text-align: center; display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
        <div style="font-size: 3rem; color: var(--accent-green);">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h3 style="color: var(--text-white); font-weight: 700;">Invoice Generated Successfully</h3>
        <div style="font-family: monospace; font-size: 1.15rem; color: var(--accent-red); font-weight: 700;">
          No: ${sale.invoiceNo}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">
          The sale of <strong>${sale.items.reduce((acc, x) => acc + x.qty, 0)} items</strong> totaling <strong>${settings.currency} ${grandTotal.toLocaleString()}</strong> has been committed to database.
        </div>
      </div>
    `;

    const successModalFooter = `
      <button id="pos-modal-print-btn" class="btn btn-secondary" style="flex: 1; justify-content: center;">
        <i class="fa-solid fa-print"></i> Print Receipt
      </button>
      <a href="${whatsappUrl}" target="_blank" id="pos-modal-wa-btn" class="btn" style="flex: 1; text-align: center; display: inline-flex; justify-content: center; align-items: center; gap: 8px; text-decoration: none; background-color: #25D366; color: white; font-weight: 600; font-size: 0.85rem; border-radius: 6px;">
        <i class="fa-brands fa-whatsapp" style="font-size: 1.1rem;"></i> Share WhatsApp
      </a>
      <button id="pos-modal-close-btn" class="btn btn-primary" style="flex: 1; justify-content: center;">
        <i class="fa-solid fa-circle-plus"></i> New Sale
      </button>
    `;

    window.showModal('Transaction Complete', successModalBody, successModalFooter);

    // Bind Print button inside modal
    document.getElementById('pos-modal-print-btn').addEventListener('click', () => {
      window.print();
    });

    // Bind Close / Reset action
    const resetPOS = () => {
      this.cart = [];
      this.discount = 0;
      this.paidAmount = 0;
      window.closeModal();
      this.refresh();
    };

    document.getElementById('pos-modal-close-btn').addEventListener('click', resetPOS);
    // Overwrite closing button handler in modal header
    const modalHeaderCloseBtn = document.querySelector('.modal-close-btn');
    if (modalHeaderCloseBtn) {
      modalHeaderCloseBtn.outerHTML = modalHeaderCloseBtn.outerHTML; // clear existing listeners
      document.querySelector('.modal-close-btn').addEventListener('click', resetPOS);
    }
  }
};
