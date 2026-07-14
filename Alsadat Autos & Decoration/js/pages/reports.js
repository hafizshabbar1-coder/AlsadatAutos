import { DB } from '../db.js';

export const ReportsPage = {
  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    const data = DB.getReportsData();
    const currency = DB.getSettings().currency;
    const { totalSales, cogs, grossProfit, totalExpenses, netProfit, lowStockCount } = data.widgets;

    this.container.innerHTML = `
      <div class="reports-layout fade-in">
        
        <!-- KPI Dashboard Header -->
        <div class="dashboard-grid">
          <div class="kpi-card">
            <div class="kpi-details">
              <h3>Net Sales Revenue</h3>
              <div class="kpi-value">${currency} ${Math.max(0, Math.round(totalSales)).toLocaleString()}</div>
            </div>
            <div class="kpi-icon sales"><i class="fa-solid fa-sack-dollar"></i></div>
          </div>
          
          <div class="kpi-card">
            <div class="kpi-details">
              <h3>Cost of Goods (COGS)</h3>
              <div class="kpi-value">${currency} ${Math.round(cogs).toLocaleString()}</div>
            </div>
            <div class="kpi-icon cogs"><i class="fa-solid fa-boxes-packing"></i></div>
          </div>

          <div class="kpi-card">
            <div class="kpi-details">
              <h3>Gross Profit</h3>
              <div class="kpi-value" style="color: var(--accent-green);">${currency} ${Math.round(grossProfit).toLocaleString()}</div>
            </div>
            <div class="kpi-icon profit"><i class="fa-solid fa-circle-dollar-to-slot"></i></div>
          </div>

          <div class="kpi-card">
            <div class="kpi-details">
              <h3>Operating Expenses</h3>
              <div class="kpi-value">${currency} ${Math.round(totalExpenses).toLocaleString()}</div>
            </div>
            <div class="kpi-icon expense"><i class="fa-solid fa-receipt"></i></div>
          </div>

          <div class="kpi-card" style="border: 1px solid ${netProfit >= 0 ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 71, 87, 0.3)'};">
            <div class="kpi-details">
              <h3>Net Profit / (Loss)</h3>
              <div class="kpi-value" style="color: ${netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                ${netProfit < 0 ? '-' : ''}${currency} ${Math.abs(Math.round(netProfit)).toLocaleString()}
              </div>
            </div>
            <div class="kpi-icon" style="background: ${netProfit >= 0 ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)'}; color: ${netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
              <i class="fa-solid fa-chart-line"></i>
            </div>
          </div>
        </div>

        <!-- Charts and Alerts Grid Row -->
        <div class="reports-charts-row">
          <!-- Sales Trend Bar Chart -->
          <div class="chart-card">
            <h3 style="color: var(--text-white); font-weight: 700; margin-bottom: 15px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-chart-simple" style="color: var(--accent-red); margin-right: 6px;"></i> Last 7 Days Sales Trend
            </h3>
            <div class="chart-container" style="height: 250px;">
              ${this.generateSVGBarChart(data.chartData)}
            </div>
          </div>

          <!-- Expense Category Donut Chart -->
          <div class="chart-card">
            <h3 style="color: var(--text-white); font-weight: 700; margin-bottom: 15px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-chart-pie" style="color: var(--accent-blue); margin-right: 6px;"></i> Expense Categories
            </h3>
            <div class="chart-container" style="height: 250px; display: flex; align-items: center; justify-content: center;">
              ${this.generateSVGDonutChart(data.expenseSummary)}
            </div>
          </div>
        </div>

        <!-- Details Grid: Profit & Loss Statement & Low Stock alerts -->
        <div class="reports-charts-row" style="margin-top: 10px;">
          <!-- Profit & Loss Statement -->
          <div class="chart-card">
            <h3 style="color: var(--text-white); font-weight: 700; margin-bottom: 15px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-file-invoice-dollar" style="color: var(--accent-green); margin-right: 6px;"></i> Profit & Loss Statement
            </h3>
            <div style="background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; font-size: 0.9rem;">
              <table style="width: 100%; border-collapse: collapse; line-height: 2;">
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="font-weight: 600;">Gross Sales Revenue</td>
                  <td style="text-align: right; font-weight: 700; color: var(--text-white);">${currency} ${Math.round(totalSales).toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="font-weight: 600; padding-left: 15px; color: var(--text-muted);">Less: Cost of Goods Sold (COGS)</td>
                  <td style="text-align: right; color: var(--accent-red); font-weight: 600;">-${currency} ${Math.round(cogs).toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 2px solid var(--border-color); background: rgba(255,255,255,0.02);">
                  <td style="font-weight: bold; color: var(--text-white);">Total Gross Profit</td>
                  <td style="text-align: right; font-weight: bold; color: var(--accent-green);">${currency} ${Math.round(grossProfit).toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="font-weight: 600;">Operating Expenses</td>
                  <td></td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
                  <td style="padding-left: 20px; color: var(--text-muted);">Utilities & Bills</td>
                  <td style="text-align: right;">${currency} ${data.expenseSummary.Utilities.toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
                  <td style="padding-left: 20px; color: var(--text-muted);">Rent & Maintenance</td>
                  <td style="text-align: right;">${currency} ${data.expenseSummary.Maintenance.toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
                  <td style="padding-left: 20px; color: var(--text-muted);">Employee Payrolls</td>
                  <td style="text-align: right;">${currency} ${data.expenseSummary.Salaries.toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
                  <td style="padding-left: 20px; color: var(--text-muted);">Tea & Miscellaneous</td>
                  <td style="text-align: right;">${currency} ${data.expenseSummary.Miscellaneous.toLocaleString()}</td>
                </tr>
                <tr style="border-bottom: 2px solid var(--border-color); background: rgba(255,255,255,0.02);">
                  <td style="font-weight: bold; color: var(--text-white); padding-left: 15px;">Total Operating Outflow</td>
                  <td style="text-align: right; font-weight: bold; color: var(--accent-red);">${currency} ${Math.round(totalExpenses).toLocaleString()}</td>
                </tr>
                <tr style="background: rgba(255, 71, 87, 0.05); font-size: 1.05rem; font-weight: bold; border-radius: 4px;">
                  <td style="padding: 4px 10px; color: ${netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">Net Income / Profit</td>
                  <td style="padding: 4px 10px; text-align: right; color: ${netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${netProfit < 0 ? '-' : ''}${currency} ${Math.abs(Math.round(netProfit)).toLocaleString()}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Low Stock Alert Box -->
          <div class="chart-card">
            <h3 style="color: var(--text-white); font-weight: 700; margin-bottom: 15px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-orange); margin-right: 6px;"></i> Inventory Stock Alerts
            </h3>
            <div class="low-stock-box" style="border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-input);">
              ${data.lowStockAlerts.length === 0 ? `
                <div style="text-align: center; color: var(--accent-green); padding: 40px; font-size: 0.9rem;">
                  <i class="fa-solid fa-circle-check" style="font-size: 2.2rem; display: block; margin-bottom: 10px;"></i>
                  All stock items are healthy.
                </div>
              ` : data.lowStockAlerts.map(p => `
                <div class="low-stock-item">
                  <div>
                    <div class="low-stock-name" style="color: var(--text-white);">${p.name}</div>
                    <small style="color: var(--text-muted); font-family: monospace;">SKU: ${p.sku}</small>
                  </div>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="low-stock-qty">${p.stock} Left</span>
                    <a href="#/purchases" class="btn btn-secondary btn-icon" style="width: 26px; height: 26px; font-size: 0.75rem;" title="Restock item">
                      <i class="fa-solid fa-cart-plus"></i>
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;
  },

  generateSVGBarChart(chartData) {
    const maxVal = Math.max(...chartData.data, 10000);
    const labels = chartData.labels;
    const values = chartData.data;

    // SVG parameters
    const width = 500;
    const height = 210;
    const padding = 30;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = 35;
    const gap = (chartWidth - barWidth * values.length) / (values.length - 1);

    let barsHTML = '';
    let xLabelsHTML = '';
    let gridLinesHTML = '';

    // Draw Y-axis gridlines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      const val = Math.round(maxVal - (maxVal / 4) * i);
      gridLinesHTML += `
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3,3" />
        <text x="${padding - 5}" y="${y + 4}" fill="var(--text-muted)" font-size="8" text-anchor="end">${val.toLocaleString()}</text>
      `;
    }

    // Draw Bars and XLabels
    values.forEach((val, i) => {
      const barHeight = (val / maxVal) * chartHeight;
      const x = padding + (barWidth + gap) * i;
      const y = height - padding - barHeight;

      // Glow effect overlay
      barsHTML += `
        <g class="chart-bar-group" style="cursor: pointer;">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="url(#bar-gradient)" rx="4" class="chart-bar-rect">
            <title>Amount: ${val.toLocaleString()}</title>
          </rect>
          <!-- Hover text indicator -->
          <text x="${x + barWidth/2}" y="${y - 6}" fill="var(--text-white)" font-size="9" text-anchor="middle" font-weight="bold" opacity="0" class="bar-val-text">${val > 0 ? val.toLocaleString() : ''}</text>
        </g>
      `;

      // Label
      xLabelsHTML += `
        <text x="${x + barWidth / 2}" y="${height - padding + 15}" fill="var(--text-muted)" font-size="9" text-anchor="middle">${labels[i]}</text>
      `;
    });

    return `
      <svg viewBox="0 0 ${width} ${height}" class="svg-chart" style="width: 100%; height: 100%;">
        <defs>
          <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-red)" />
            <stop offset="100%" stop-color="#cc2433" />
          </linearGradient>
        </defs>
        ${gridLinesHTML}
        ${barsHTML}
        ${xLabelsHTML}
      </svg>
      <style>
        .chart-bar-group:hover .bar-val-text {
          opacity: 1;
        }
      </style>
    `;
  },

  generateSVGDonutChart(summary) {
    const categories = Object.keys(summary);
    const values = Object.values(summary);
    const total = values.reduce((a, b) => a + b, 0);

    if (total === 0) {
      return `<div style="color: var(--text-muted); font-size: 0.9rem;">No operational expenses to map.</div>`;
    }

    // Pie chart values
    let cumulativePercent = 0;
    const colors = ['var(--accent-red)', 'var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-orange)'];
    
    let segmentsHTML = '';
    let legendsHTML = '';

    categories.forEach((cat, idx) => {
      const val = values[idx];
      const percent = val / total;

      // Draw SVG arc / stroke calculation
      // Coordinates for center: 100, 100. Radius: 70. Perimeter: 2 * PI * r = 439.8
      const radius = 60;
      const circ = 2 * Math.PI * radius; // ~376.99
      const strokeDashArray = `${percent * circ} ${circ}`;
      const strokeDashOffset = `${-cumulativePercent * circ}`;

      segmentsHTML += `
        <circle cx="90" cy="90" r="${radius}" fill="transparent"
                stroke="${colors[idx]}" stroke-width="16"
                stroke-dasharray="${strokeDashArray}" stroke-dashoffset="${strokeDashOffset}"
                transform="rotate(-90 90 90)" class="donut-segment">
          <title>${cat}: ${Math.round(percent * 100)}% (${val.toLocaleString()})</title>
        </circle>
      `;

      cumulativePercent += percent;

      // Legends text
      legendsHTML += `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-main); margin-bottom: 6px;">
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 3px; background-color: ${colors[idx]};"></span>
          <span style="flex: 1; font-weight: 500;">${cat}</span>
          <strong style="color: var(--text-white);">${Math.round(percent * 100)}%</strong>
        </div>
      `;
    });

    return `
      <div style="display: flex; align-items: center; gap: 20px; width: 100%; justify-content: center;">
        <svg width="180" height="180" viewBox="0 0 180 180" style="flex-shrink: 0;">
          ${segmentsHTML}
          <!-- Inner circle to make donut -->
          <circle cx="90" cy="90" r="42" fill="var(--bg-card)" />
          <text x="90" y="88" font-size="10" fill="var(--text-muted)" text-anchor="middle" font-weight="600">TOTAL OUTFLOW</text>
          <text x="90" y="104" font-size="14" fill="var(--text-white)" text-anchor="middle" font-weight="800">
            ${DB.getSettings().currency}${Math.round(total).toLocaleString()}
          </text>
        </svg>
        <div style="flex: 1; max-width: 180px;">
          ${legendsHTML}
        </div>
      </div>
    `;
  }
};
