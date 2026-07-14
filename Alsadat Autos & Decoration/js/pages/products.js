import { DB } from '../db.js';

export const ProductsPage = {
  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    const products = DB.getProducts();
    const categories = [...new Set(products.map(p => p.category))];

    this.container.innerHTML = `
      <div class="table-card fade-in">
        <div class="table-header-bar">
          <div class="table-title">
            <i class="fa-solid fa-boxes-stacked"></i>
            <span>Inventory Stock Control</span>
          </div>
          <div class="table-actions">
            <div class="search-input-wrapper">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="prod-search" class="search-input" placeholder="Search by SKU or Name...">
            </div>
            <select id="prod-category-filter" class="select-filter">
              <option value="">All Categories</option>
              ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
            <button id="export-products-btn" class="btn btn-secondary" title="Export Products to CSV">
              <i class="fa-solid fa-file-export"></i> Export CSV
            </button>
            <button id="import-products-btn" class="btn btn-secondary" title="Import Products from CSV">
              <i class="fa-solid fa-file-import"></i> Import CSV
            </button>
            <input type="file" id="import-products-file" class="hidden" accept=".csv">
            <button id="add-product-btn" class="btn btn-primary">
              <i class="fa-solid fa-plus"></i> Add New Product
            </button>
          </div>
        </div>
        
        <div class="data-table-container">
          <table class="data-table" id="products-table">
            <thead>
              <tr>
                <th>Product Image</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Wholesale (A)</th>
                <th>Retail (B)</th>
                <th>Stock</th>
                <th style="width: 140px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody id="products-list">
              <!-- Dynamic entries injected here -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.renderProductsList();
    this.bindEvents();
  },

  renderProductsList() {
    const query = document.getElementById('prod-search').value.toLowerCase().trim();
    const category = document.getElementById('prod-category-filter').value;
    const currency = DB.getSettings().currency;

    let products = DB.getProducts();

    // Filters
    if (query) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      );
    }
    if (category) {
      products = products.filter(p => p.category === category);
    }

    const tbody = document.getElementById('products-list');
    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">
            <i class="fa-solid fa-circle-info" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
            No products found matching the criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const isLow = p.stock < 5;
      return `
        <tr data-id="${p.id}">
          <td>
            <img src="${p.image || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80'}" class="product-img-col" alt="${p.name}" onerror="this.src='https://placehold.co/150x150/1b263b/f1f5f9?text=Parts'">
          </td>
          <td style="font-family: monospace; font-weight: 600;">${p.sku}</td>
          <td style="font-weight: 600; color: var(--text-white);">${p.name}</td>
          <td><span class="badge badge-info">${p.category}</span></td>
          <td>${currency} ${Number(p.cost).toLocaleString()}</td>
          <td>${currency} ${Number(p.wholesale).toLocaleString()}</td>
          <td>${currency} ${Number(p.retail).toLocaleString()}</td>
          <td>
            <span class="badge ${isLow ? 'badge-danger' : 'badge-success'}" style="font-size: 0.85rem;">
              ${p.stock} units
            </span>
            ${isLow ? '<span style="color: var(--accent-red); font-size: 0.75rem; display: block; font-weight: 600; margin-top: 4px;">Low Stock!</span>' : ''}
          </td>
          <td>
            <div style="display: flex; gap: 6px; justify-content: center;">
              <button class="btn btn-secondary btn-icon view-prod-btn" title="View details">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="btn btn-secondary btn-icon edit-prod-btn" style="color: var(--accent-blue);" title="Edit product">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn btn-secondary btn-icon delete-prod-btn" style="color: var(--accent-red);" title="Delete product">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  bindEvents() {
    // Search
    document.getElementById('prod-search').addEventListener('input', () => this.renderProductsList());
    
    // Category Filter
    document.getElementById('prod-category-filter').addEventListener('change', () => this.renderProductsList());

    // Add Product Button
    document.getElementById('add-product-btn').addEventListener('click', () => this.openFormModal());

    // Export CSV
    document.getElementById('export-products-btn').addEventListener('click', () => this.exportCSV());

    // Import CSV file selection binding
    const fileInput = document.getElementById('import-products-file');
    document.getElementById('import-products-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.importCSV(e.target.files[0]);
        fileInput.value = ''; // reset
      }
    });

    // Table action events delegation
    const tbody = document.getElementById('products-list');
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const tr = btn.closest('tr');
      const id = tr.getAttribute('data-id');

      if (btn.classList.contains('view-prod-btn')) {
        this.openViewModal(id);
      } else if (btn.classList.contains('edit-prod-btn')) {
        this.openFormModal(id);
      } else if (btn.classList.contains('delete-prod-btn')) {
        this.deleteProduct(id);
      }
    });
  },

  openViewModal(id) {
    const p = DB.getProduct(id);
    if (!p) return;
    const settings = DB.getSettings();

    const bodyHTML = `
      <div style="display: flex; gap: 20px; align-items: start;">
        <img src="${p.image || ''}" style="width: 150px; height: 150px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.src='https://placehold.co/150x150/1b263b/f1f5f9?text=Parts'">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <h2 style="color: var(--text-white); font-weight: 700;">${p.name}</h2>
          <div style="font-family: monospace; font-size: 0.9rem; color: var(--accent-red); font-weight: 600;">SKU: ${p.sku}</div>
          <div style="font-size: 0.9rem;"><span style="color: var(--text-muted);">Category:</span> <span class="badge badge-info">${p.category}</span></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <div><span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Purchase Cost</span><strong>${settings.currency} ${Number(p.cost).toLocaleString()}</strong></div>
            <div><span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Current Stock</span><span class="badge ${p.stock < 5 ? 'badge-danger' : 'badge-success'}">${p.stock} Units</span></div>
            <div><span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Wholesale Price (A)</span><strong>${settings.currency} ${Number(p.wholesale).toLocaleString()}</strong></div>
            <div><span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Retail Price (B)</span><strong>${settings.currency} ${Number(p.retail).toLocaleString()}</strong></div>
          </div>
        </div>
      </div>
    `;

    const footerHTML = `<button class="btn btn-secondary close-modal-trigger">Close Details</button>`;
    window.showModal(`Product Details`, bodyHTML, footerHTML);
  },

  openFormModal(id = null) {
    const isEdit = id !== null;
    const p = isEdit ? DB.getProduct(id) : { sku: '', name: '', category: '', cost: '', wholesale: '', retail: '', stock: '', image: '' };
    
    const bodyHTML = `
      <form id="product-form" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 15px;">
          <div class="form-group">
            <label for="prod-form-image">Product Image URL</label>
            <input type="url" id="prod-form-image" class="form-control" style="padding-left: 14px;" value="${p.image}" placeholder="https://image-url.com">
          </div>
          <div class="form-group">
            <label for="prod-form-sku">SKU Code *</label>
            <input type="text" id="prod-form-sku" class="form-control" style="padding-left: 14px;" value="${p.sku}" required ${isEdit ? 'disabled' : ''}>
          </div>
          <div class="form-group">
            <label for="prod-form-category">Category *</label>
            <input type="text" id="prod-form-category" class="form-control" style="padding-left: 14px;" value="${p.category}" placeholder="e.g. Brakes, Ignition" required list="categories-list">
            <datalist id="categories-list">
              ${[...new Set(DB.getProducts().map(x => x.category))].map(cat => `<option value="${cat}">`).join('')}
            </datalist>
          </div>
        </div>

        <div class="form-group">
          <label for="prod-form-name">Product Name *</label>
          <input type="text" id="prod-form-name" class="form-control" style="padding-left: 14px;" value="${p.name}" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
          <div class="form-group">
            <label for="prod-form-cost">Cost Price (${DB.getSettings().currency}) *</label>
            <input type="number" id="prod-form-cost" class="form-control" style="padding-left: 14px;" value="${p.cost}" min="0" required>
          </div>
          <div class="form-group">
            <label for="prod-form-wholesale">Wholesale A (${DB.getSettings().currency}) *</label>
            <input type="number" id="prod-form-wholesale" class="form-control" style="padding-left: 14px;" value="${p.wholesale}" min="0" required>
          </div>
          <div class="form-group">
            <label for="prod-form-retail">Retail B (${DB.getSettings().currency}) *</label>
            <input type="number" id="prod-form-retail" class="form-control" style="padding-left: 14px;" value="${p.retail}" min="0" required>
          </div>
          <div class="form-group">
            <label for="prod-form-stock">Initial Stock *</label>
            <input type="number" id="prod-form-stock" class="form-control" style="padding-left: 14px;" value="${p.stock}" min="0" required ${isEdit ? 'disabled' : ''}>
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary close-modal-trigger">Cancel</button>
      <button type="submit" form="product-form" class="btn btn-primary">
        <i class="fa-solid fa-save"></i> Save Product
      </button>
    `;

    window.showModal(isEdit ? 'Edit Product Details' : 'Add New Product to Inventory', bodyHTML, footerHTML);

    document.getElementById('product-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const productData = {
        id: isEdit ? id : undefined,
        sku: document.getElementById('prod-form-sku').value.trim().toUpperCase(),
        name: document.getElementById('prod-form-name').value.trim(),
        category: document.getElementById('prod-form-category').value.trim(),
        cost: Number(document.getElementById('prod-form-cost').value),
        wholesale: Number(document.getElementById('prod-form-wholesale').value),
        retail: Number(document.getElementById('prod-form-retail').value),
        stock: Number(document.getElementById('prod-form-stock').value),
        image: document.getElementById('prod-form-image').value.trim()
      };

      const res = DB.saveProduct(productData);
      if (res.success) {
        window.showToast(isEdit ? 'Product updated successfully!' : 'Product added to inventory!', 'success');
        window.closeModal();
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    });
  },

  deleteProduct(id) {
    const p = DB.getProduct(id);
    if (!p) return;

    if (confirm(`Are you absolutely sure you want to delete product "${p.name}" (SKU: ${p.sku})? This action cannot be undone.`)) {
      const res = DB.deleteProduct(id);
      if (res.success) {
        window.showToast('Product deleted successfully from inventory.', 'success');
        this.refresh();
      } else {
        window.showToast(res.message, 'danger');
      }
    }
  },

  // Export to Excel-compatible CSV format
  exportCSV() {
    const products = DB.getProducts();
    let csv = 'SKU,Product Name,Category,Cost,Wholesale,Retail,Stock,Image\n';
    
    products.forEach(p => {
      const nameEscaped = `"${p.name.replace(/"/g, '""')}"`;
      const catEscaped = `"${p.category.replace(/"/g, '""')}"`;
      csv += `${p.sku},${nameEscaped},${catEscaped},${p.cost},${p.wholesale},${p.retail},${p.stock},${p.image}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `alsadat_products_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast('Inventory exported successfully as CSV.', 'success');
  },

  // Import from Excel-compatible CSV format
  importCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      if (lines.length <= 1) {
        window.showToast('CSV file is empty.', 'warning');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV fields supporting nested double quotes
        const values = [];
        let currentVal = '';
        let insideQuotes = false;
        
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim());

        if (values.length < 3) continue;

        const sku = values[0].toUpperCase();
        const name = values[1].replace(/^"|"$/g, '').replace(/""/g, '"');
        const category = values[2].replace(/^"|"$/g, '').replace(/""/g, '"');
        const cost = Number(values[3]) || 0;
        const wholesale = Number(values[4]) || 0;
        const retail = Number(values[5]) || 0;
        const stock = Number(values[6]) || 0;
        const image = values[7] || '';

        // Add or update matching by SKU
        const existing = DB.getProductBySKU(sku);
        const productData = {
          id: existing ? existing.id : undefined,
          sku,
          name,
          category,
          cost,
          wholesale,
          retail,
          stock: existing ? existing.stock + stock : stock, // increment if exists
          image
        };

        const res = DB.saveProduct(productData);
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      window.showToast(`Import summary: ${successCount} products imported successfully.${failCount > 0 ? ` ${failCount} rows skipped.` : ''}`, 'success');
      this.refresh();
    };
    reader.readAsText(file);
  }
};
