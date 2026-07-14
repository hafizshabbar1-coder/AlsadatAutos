import { DB } from '../db.js';

export const SettingsPage = {
  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    const s = DB.getSettings();

    this.container.innerHTML = `
      <div class="table-card fade-in" style="max-width: 700px; margin: 0 auto;">
        <div class="table-header-bar">
          <div class="table-title">
            <i class="fa-solid fa-sliders"></i>
            <span>General Platform Configurations</span>
          </div>
        </div>

        <div style="padding: 30px;">
          <form id="settings-form" style="display: flex; flex-direction: column; gap: 20px;">
            
            <h3 style="color: var(--text-white); font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <i class="fa-solid fa-building" style="color: var(--accent-red); margin-right: 6px;"></i> Business Details
            </h3>

            <div class="form-group">
              <label for="set-name">Business Store Name *</label>
              <input type="text" id="set-name" class="form-control" style="padding-left: 14px;" value="${s.businessName}" required>
            </div>

            <div class="form-group-row">
              <div class="form-group">
                <label for="set-phone">Contact Phone Number *</label>
                <input type="text" id="set-phone" class="form-control" style="padding-left: 14px;" value="${s.phone}" required>
              </div>
              <div class="form-group">
                <label for="set-email">Email Address</label>
                <input type="email" id="set-email" class="form-control" style="padding-left: 14px;" value="${s.email}">
              </div>
            </div>

            <div class="form-group">
              <label for="set-address">Market Shop Address *</label>
              <input type="text" id="set-address" class="form-control" style="padding-left: 14px;" value="${s.address}" required>
            </div>

            <h3 style="color: var(--text-white); font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-top: 10px;">
              <i class="fa-solid fa-calculator" style="color: var(--accent-blue); margin-right: 6px;"></i> Rates & Currencies
            </h3>

            <div class="form-group-row">
              <div class="form-group">
                <label for="set-currency">Currency Symbol *</label>
                <input type="text" id="set-currency" class="form-control" style="padding-left: 14px;" value="${s.currency}" placeholder="Rs., $, etc." required>
              </div>
              <div class="form-group">
                <label for="set-tax">Sales Tax Rate (%) *</label>
                <input type="number" id="set-tax" class="form-control" style="padding-left: 14px;" value="${s.taxRate}" min="0" max="100" required>
              </div>
            </div>

            <h3 style="color: var(--text-white); font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-top: 10px;">
              <i class="fa-solid fa-receipt" style="color: var(--accent-purple); margin-right: 6px;"></i> Receipt Print Templates
            </h3>

            <div class="form-group">
              <label for="set-header">Receipt Header Template</label>
              <textarea id="set-header" class="form-control" style="padding: 12px; height: 80px; resize: vertical; line-height: 1.4; font-family: monospace;">${s.receiptHeader}</textarea>
              <small style="color: var(--text-muted); display: block; margin-top: 4px;">Lines separated by press Enter will align centered on receipt output.</small>
            </div>

            <div class="form-group">
              <label for="set-footer">Receipt Footer Template</label>
              <textarea id="set-footer" class="form-control" style="padding: 12px; height: 80px; resize: vertical; line-height: 1.4; font-family: monospace;">${s.receiptFooter}</textarea>
              <small style="color: var(--text-muted); display: block; margin-top: 4px;">Printed at the bottom of customer invoices.</small>
            </div>

            <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 20px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary" style="padding: 12px 24px; font-size: 0.95rem;">
                <i class="fa-solid fa-save"></i> Save Configurations
              </button>
            </div>

          </form>
        </div>
      </div>
    `;

    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const settingsData = {
        businessName: document.getElementById('set-name').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        email: document.getElementById('set-email').value.trim(),
        address: document.getElementById('set-address').value.trim(),
        currency: document.getElementById('set-currency').value.trim(),
        taxRate: Number(document.getElementById('set-tax').value) || 0,
        receiptHeader: document.getElementById('set-header').value.trim(),
        receiptFooter: document.getElementById('set-footer').value.trim()
      };

      const res = DB.saveSettings(settingsData);
      if (res.success) {
        window.showToast('Application configurations updated successfully.', 'success');
        
        // Dynamic redraw of business badges in index.html
        document.getElementById('topbar-business-name').innerText = res.settings.businessName;
        this.refresh();
      } else {
        window.showToast('Error saving settings.', 'danger');
      }
    });
  }
};
