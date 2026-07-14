// Relational Database Simulator using localStorage for AL-SADAT AUTO
const DB_KEY = 'alsadat_db_v1';

// Seed Data
const DEFAULT_PRODUCTS = [
  { id: 'p1', sku: 'NGK-SPK-IX', name: 'NGK Iridium Spark Plug', category: 'Ignition', cost: 1200, wholesale: 1400, retail: 1650, stock: 45, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' },
  { id: 'p2', sku: 'BOS-BRK-PAD', name: 'Bosch Premium Brake Pads', category: 'Brakes', cost: 3500, wholesale: 4100, retail: 4800, stock: 18, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' },
  { id: 'p3', sku: 'MOB-OIL-5W30', name: 'Mobil 1 Full Synthetic Oil 4L', category: 'Lubricants', cost: 6500, wholesale: 7200, retail: 8200, stock: 24, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' },
  { id: 'p4', sku: 'ACD-BAT-65AH', name: 'ACDelco Gold Battery 65AH', category: 'Electrical', cost: 12000, wholesale: 13500, retail: 15000, stock: 8, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' },
  { id: 'p5', sku: 'DEN-FIL-OIL', name: 'Denso Premium Oil Filter', category: 'Filters', cost: 650, wholesale: 800, retail: 950, stock: 60, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' },
  { id: 'p6', sku: 'TOY-FIL-AIR', name: 'Toyota Genuine Air Filter', category: 'Filters', cost: 1800, wholesale: 2100, retail: 2500, stock: 4, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' }, // Low stock!
  { id: 'p7', sku: 'OSR-BUL-H4', name: 'Osram Night Breaker H4 Bulb', category: 'Electrical', cost: 1500, wholesale: 1800, retail: 2200, stock: 30, image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=150&q=80' }
];

const DEFAULT_CUSTOMERS = [
  { id: 'c1', name: 'Ahmad Auto Workshop', phone: '0300-1234567', email: 'ahmad.auto@gmail.com', address: 'Main Abbott Road, Lahore', balance: -8500 }, // Neg balance means customer owes money
  { id: 'c2', name: 'Bilal Motors', phone: '0321-7654321', email: 'info@bilalmotors.com', address: 'Montgomery Road, Lahore', balance: 5000 }, // Pos balance means customer paid advance
  { id: 'c3', name: 'General Retail Customer', phone: 'N/A', email: 'retail@alsadat.com', address: 'Walk-in', balance: 0 }
];

const DEFAULT_SUPPLIERS = [
  { id: 's1', name: 'Toyota Indus Genuine Parts', phone: '021-111-869-682', email: 'parts@toyota-indus.com', address: 'Port Qasim, Karachi', balance: -25000 }, // Neg balance means we owe supplier
  { id: 's2', name: 'Bosch Auto Pakistan', phone: '042-35889090', email: 'sales@bosch.com.pk', address: 'Gulberg III, Lahore', balance: 0 },
  { id: 's3', name: 'Mobil Oil Pakistan Ltd', phone: '021-35208000', email: 'info@mobil.pk', address: 'Clifton, Karachi', balance: 15000 } // Pos balance means we paid advance to supplier
];

const DEFAULT_SETTINGS = {
  businessName: 'AL-SADAT AUTO & DECORATION',
  phone: '0300-4567890',
  email: 'contact@alsadatauto.com',
  address: 'Shop #12, Auto Market, Abbott Road, Lahore',
  taxRate: 17, // %
  currency: 'Rs.',
  receiptHeader: 'AL-SADAT AUTO\nSpecialist in Auto Parts & Decoration\nAbbott Road, Lahore',
  receiptFooter: 'Thank you for your business!\nItems once sold can be returned within 7 days\nPowered by AL-SADAT POS'
};

const DEFAULT_EXPENSES = [
  { id: 'e1', date: '2026-07-05', category: 'Utility', amount: 8500, description: 'Electricity Bill - June' },
  { id: 'e2', date: '2026-07-08', category: 'Maintenance', amount: 3000, description: 'AC Service & Gas Refill' },
  { id: 'e3', date: '2026-07-10', category: 'Miscellaneous', amount: 1200, description: 'Tea & Refreshments for staff & customers' }
];

const DEFAULT_SALARIES = [
  { id: 'sal1', date: '2026-07-01', employeeName: 'Sajid Mahmood (Sales Manager)', amount: 45000, status: 'Paid' },
  { id: 'sal2', date: '2026-07-01', employeeName: 'Zain Ul Abidin (Technician)', amount: 35000, status: 'Paid' },
  { id: 'sal3', date: '2026-07-01', employeeName: 'Bilal Ahmed (Helper)', amount: 18000, status: 'Paid' }
];

// Seed sales to populate reports
const DEFAULT_SALES = [
  {
    id: 'sale-1001',
    date: '2026-07-08T11:30:00Z',
    invoiceNo: 'ASA-INV-1001',
    customerId: 'c1',
    priceType: 'Wholesale (A)',
    items: [
      { productId: 'p1', sku: 'NGK-SPK-IX', name: 'NGK Iridium Spark Plug', qty: 10, price: 1400, total: 14000 },
      { productId: 'p5', sku: 'DEN-FIL-OIL', name: 'Denso Premium Oil Filter', qty: 5, price: 800, total: 4000 }
    ],
    total: 18000,
    tax: 3060, // 17%
    discount: 500,
    grandTotal: 20560,
    paid: 12060,
    balance: -8500 // Customer owes 8500
  },
  {
    id: 'sale-1002',
    date: '2026-07-09T15:20:00Z',
    invoiceNo: 'ASA-INV-1002',
    customerId: 'c3',
    priceType: 'Retail (B)',
    items: [
      { productId: 'p2', sku: 'BOS-BRK-PAD', name: 'Bosch Premium Brake Pads', qty: 1, price: 4800, total: 4800 },
      { productId: 'p3', sku: 'MOB-OIL-5W30', name: 'Mobil 1 Full Synthetic Oil 4L', qty: 1, price: 8200, total: 8200 }
    ],
    total: 13000,
    tax: 2210,
    discount: 0,
    grandTotal: 15210,
    paid: 15210,
    balance: 0
  },
  {
    id: 'sale-1003',
    date: '2026-07-10T09:45:00Z',
    invoiceNo: 'ASA-INV-1003',
    customerId: 'c2',
    priceType: 'Wholesale (A)',
    items: [
      { productId: 'p4', sku: 'ACD-BAT-65AH', name: 'ACDelco Gold Battery 65AH', qty: 2, price: 13500, total: 27000 }
    ],
    total: 27000,
    tax: 4590,
    discount: 1590,
    grandTotal: 30000,
    paid: 35000, // Customer paid 5000 advance
    balance: 5000
  }
];

const DEFAULT_PURCHASES = [
  {
    id: 'pur-2001',
    date: '2026-07-06T10:00:00Z',
    supplierId: 's1',
    items: [
      { productId: 'p6', sku: 'TOY-FIL-AIR', name: 'Toyota Genuine Air Filter', qty: 10, cost: 1800, total: 18000 }
    ],
    totalCost: 18000,
    paid: 18000,
    balance: 0
  },
  {
    id: 'pur-2002',
    date: '2026-07-07T14:00:00Z',
    supplierId: 's1',
    items: [
      { productId: 'p1', sku: 'NGK-SPK-IX', name: 'NGK Iridium Spark Plug', qty: 50, cost: 1200, total: 60000 },
      { productId: 'p5', sku: 'DEN-FIL-OIL', name: 'Denso Premium Oil Filter', qty: 100, cost: 650, total: 65000 }
    ],
    totalCost: 125000,
    paid: 100000,
    balance: -25000 // We owe 25000 to supplier s1
  }
];

const DEFAULT_RETURNS = [
  {
    id: 'ret-3001',
    date: '2026-07-09T16:30:00Z',
    saleId: 'sale-1002',
    customerId: 'c3',
    items: [
      { productId: 'p2', qty: 1, refundAmount: 4800 }
    ],
    totalRefund: 4800
  }
];

export const DB = {
  // Initialize and Seed Database
  init() {
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
      const db = {
        users: [
          { username: 'admin', password: 'password123', name: 'Administrator', email: 'admin@alsadat.com', role: 'admin' },
          { username: 'sales', password: 'sales123', name: 'Sales Agent', email: 'sales@alsadat.com', role: 'staff' }
        ],
        products: DEFAULT_PRODUCTS,
        customers: DEFAULT_CUSTOMERS,
        suppliers: DEFAULT_SUPPLIERS,
        settings: DEFAULT_SETTINGS,
        expenses: DEFAULT_EXPENSES,
        salaries: DEFAULT_SALARIES,
        sales: DEFAULT_SALES,
        purchases: DEFAULT_PURCHASES,
        returns: DEFAULT_RETURNS
      };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      console.log('AL-SADAT AUTO database seeded successfully.');
    }
  },

  // Get raw DB object
  _getDB() {
    this.init();
    return JSON.parse(localStorage.getItem(DB_KEY));
  },

  // Save raw DB object
  _saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },

  // --- Auth Module ---
  login(username, password) {
    const db = this._getDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      const session = { username: user.username, name: user.name, role: user.role };
      localStorage.setItem('alsadat_session', JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false, message: 'Invalid username or password' };
  },

  logout() {
    localStorage.removeItem('alsadat_session');
  },

  getCurrentUser() {
    const session = localStorage.getItem('alsadat_session');
    return session ? JSON.parse(session) : null;
  },

  registerUser(user) {
    const db = this._getDB();
    if (db.users.find(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      return { success: false, message: 'Username already exists' };
    }
    db.users.push({ ...user, role: 'staff' });
    this._saveDB(db);
    return { success: true };
  },

  resetPassword(username, newPassword) {
    const db = this._getDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      user.password = newPassword;
      this._saveDB(db);
      return { success: true };
    }
    return { success: false, message: 'Username not found' };
  },

  // --- Products Management ---
  getProducts() {
    return this._getDB().products;
  },

  getProduct(id) {
    return this.getProducts().find(p => p.id === id);
  },

  getProductBySKU(sku) {
    return this.getProducts().find(p => p.sku.toLowerCase() === sku.toLowerCase());
  },

  saveProduct(product) {
    const db = this._getDB();
    const existingIndex = db.products.findIndex(p => p.id === product.id);
    
    // Check if SKU is unique (excluding current product)
    const skuConflict = db.products.find(p => p.sku.toLowerCase() === product.sku.toLowerCase() && p.id !== product.id);
    if (skuConflict) {
      return { success: false, message: `Product with SKU ${product.sku} already exists.` };
    }

    if (existingIndex >= 0) {
      db.products[existingIndex] = { ...db.products[existingIndex], ...product };
    } else {
      product.id = 'p-' + Date.now();
      db.products.push(product);
    }
    this._saveDB(db);
    return { success: true, product };
  },

  deleteProduct(id) {
    const db = this._getDB();
    // Check if product is in sales/purchases first
    const isUsedInSales = db.sales.some(s => s.items.some(i => i.productId === id));
    const isUsedInPurchases = db.purchases.some(p => p.items.some(i => i.productId === id));
    if (isUsedInSales || isUsedInPurchases) {
      return { success: false, message: 'Cannot delete product. It has existing sales or purchase records.' };
    }

    db.products = db.products.filter(p => p.id !== id);
    this._saveDB(db);
    return { success: true };
  },

  // --- Customers Management ---
  getCustomers() {
    return this._getDB().customers;
  },

  getCustomer(id) {
    return this.getCustomers().find(c => c.id === id);
  },

  saveCustomer(customer) {
    const db = this._getDB();
    if (customer.id) {
      const idx = db.customers.findIndex(c => c.id === customer.id);
      db.customers[idx] = { ...db.customers[idx], ...customer };
    } else {
      customer.id = 'c-' + Date.now();
      customer.balance = customer.balance || 0;
      db.customers.push(customer);
    }
    this._saveDB(db);
    return { success: true, customer };
  },

  adjustCustomerBalance(customerId, amount, db) {
    const customer = db.customers.find(c => c.id === customerId);
    if (customer) {
      customer.balance += amount; // positive means credit/advance, negative means outstanding due
    }
  },

  // --- Suppliers Management ---
  getSuppliers() {
    return this._getDB().suppliers;
  },

  getSupplier(id) {
    return this.getSuppliers().find(s => s.id === id);
  },

  saveSupplier(supplier) {
    const db = this._getDB();
    if (supplier.id) {
      const idx = db.suppliers.findIndex(s => s.id === supplier.id);
      db.suppliers[idx] = { ...db.suppliers[idx], ...supplier };
    } else {
      supplier.id = 's-' + Date.now();
      supplier.balance = supplier.balance || 0;
      db.suppliers.push(supplier);
    }
    this._saveDB(db);
    return { success: true, supplier };
  },

  adjustSupplierBalance(supplierId, amount, db) {
    const supplier = db.suppliers.find(s => s.id === supplierId);
    if (supplier) {
      supplier.balance += amount; // negative means we owe supplier, positive means advanced
    }
  },

  // --- Purchases Module ---
  getPurchases() {
    return this._getDB().purchases;
  },

  addPurchase(purchaseData) {
    const db = this._getDB();
    
    // Create purchase object
    const purchase = {
      id: 'pur-' + Date.now(),
      date: new Date().toISOString(),
      supplierId: purchaseData.supplierId,
      items: purchaseData.items, // [{ productId, qty, cost, total }]
      totalCost: purchaseData.totalCost,
      paid: purchaseData.paid,
      balance: purchaseData.paid - purchaseData.totalCost // Paid - Total = negative means we owe supplier
    };

    // Update Product stocks and Costs
    purchaseData.items.forEach(item => {
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        product.stock += Number(item.qty);
        product.cost = Number(item.cost); // Update main inventory cost automatically
      }
    });

    // Update Supplier Balance
    this.adjustSupplierBalance(purchaseData.supplierId, purchase.balance, db);

    // Save
    db.purchases.push(purchase);
    this._saveDB(db);

    return { success: true, purchase };
  },

  // --- Sales Invoice & POS ---
  getSales() {
    return this._getDB().sales;
  },

  getSale(id) {
    return this.getSales().find(s => s.id === id);
  },

  addSale(saleData) {
    const db = this._getDB();

    // Verify stock availability
    for (let item of saleData.items) {
      const product = db.products.find(p => p.id === item.productId);
      if (!product || product.stock < item.qty) {
        return { 
          success: false, 
          message: `Insufficient stock for product: ${product ? product.name : 'Unknown'} (Available: ${product ? product.stock : 0})` 
        };
      }
    }

    const invoiceNo = 'ASA-INV-' + (db.sales.length + 1001);
    
    // Create sale object
    const sale = {
      id: 'sale-' + Date.now(),
      date: new Date().toISOString(),
      invoiceNo: invoiceNo,
      customerId: saleData.customerId,
      priceType: saleData.priceType,
      items: saleData.items, // [{ productId, sku, name, qty, price, total }]
      total: saleData.total,
      tax: saleData.tax,
      discount: saleData.discount,
      grandTotal: saleData.grandTotal,
      paid: saleData.paid,
      balance: saleData.paid - saleData.grandTotal // Paid - GrandTotal = negative means customer owes us, positive is advance
    };

    // Deduct stock
    saleData.items.forEach(item => {
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        product.stock -= Number(item.qty);
      }
    });

    // Update Customer Balance
    this.adjustCustomerBalance(saleData.customerId, sale.balance, db);

    // Save
    db.sales.push(sale);
    this._saveDB(db);

    return { success: true, sale };
  },

  // --- Sales Return ---
  getReturns() {
    return this._getDB().returns;
  },

  addReturn(returnData) {
    const db = this._getDB();
    const sale = db.sales.find(s => s.id === returnData.saleId);
    if (!sale) {
      return { success: false, message: 'Sales invoice not found.' };
    }

    // Create return record
    const saleReturn = {
      id: 'ret-' + Date.now(),
      date: new Date().toISOString(),
      saleId: returnData.saleId,
      customerId: sale.customerId,
      items: returnData.items, // [{ productId, qty, refundAmount }]
      totalRefund: returnData.totalRefund
    };

    // Re-stock items and verify return quantities
    for (let item of returnData.items) {
      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        product.stock += Number(item.qty); // Restock automatically
      }
    }

    // Adjust Customer balance (since we refunded or credited them)
    // If client had outstanding balance, we reduce the outstanding.
    // Effectively, we add the refund amount to their ledger (credit them)
    // or if paid cash, it's just recorded. Here we assume we adjust customer ledger balance.
    this.adjustCustomerBalance(sale.customerId, returnData.totalRefund, db);

    db.returns.push(saleReturn);
    this._saveDB(db);

    return { success: true, saleReturn };
  },

  // --- Expenses & Salaries ---
  getExpenses() {
    return this._getDB().expenses;
  },

  addExpense(expense) {
    const db = this._getDB();
    expense.id = 'e-' + Date.now();
    db.expenses.push(expense);
    this._saveDB(db);
    return { success: true, expense };
  },

  getSalaries() {
    return this._getDB().salaries;
  },

  addSalary(salary) {
    const db = this._getDB();
    salary.id = 'sal-' + Date.now();
    db.salaries.push(salary);
    this._saveDB(db);
    return { success: true, salary };
  },

  // --- Ledgers queries ---
  getCustomerLedger(customerId) {
    const db = this._getDB();
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return [];

    const ledger = [];

    // Sales invoices (debits customer - they owe us more)
    db.sales.forEach(sale => {
      if (sale.customerId === customerId) {
        ledger.push({
          date: sale.date,
          type: 'Invoice',
          ref: sale.invoiceNo,
          amount: sale.grandTotal,
          paid: sale.paid,
          balanceEffect: sale.paid - sale.grandTotal // effect on balance
        });
      }
    });

    // Returns (credits customer - they owe us less / we refund them)
    db.returns.forEach(ret => {
      const sale = db.sales.find(s => s.id === ret.saleId);
      if (sale && sale.customerId === customerId) {
        ledger.push({
          date: ret.date,
          type: 'Return',
          ref: `RET-${ret.id.split('-')[1]} (Inv: ${sale.invoiceNo})`,
          amount: -ret.totalRefund,
          paid: 0,
          balanceEffect: ret.totalRefund
        });
      }
    });

    // Sort by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { customer, ledger };
  },

  getSupplierLedger(supplierId) {
    const db = this._getDB();
    const supplier = db.suppliers.find(s => s.id === supplierId);
    if (!supplier) return [];

    const ledger = [];

    // Purchases (credits supplier - we owe them more)
    db.purchases.forEach(pur => {
      if (pur.supplierId === supplierId) {
        ledger.push({
          date: pur.date,
          type: 'Purchase',
          ref: `PUR-${pur.id.split('-')[1]}`,
          amount: pur.totalCost,
          paid: pur.paid,
          balanceEffect: pur.paid - pur.totalCost
        });
      }
    });

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { supplier, ledger };
  },

  // Record a customer manual payment/receipt (e.g. paying off dues)
  recordCustomerPayment(customerId, amountPaid) {
    const db = this._getDB();
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) return { success: false, message: 'Customer not found.' };

    // Update balance
    customer.balance += Number(amountPaid);

    // Create a dummy sale or a transaction record to show in ledger
    // For ledger display, let's create a payment ledger entry.
    // Instead of polluting sales table, we can support "payments" table. Or just log it in sales.
    // Let's create an invoice record for payment received.
    const paymentInvoice = 'ASA-PAY-' + Date.now().toString().slice(-4);
    const sale = {
      id: 'pmt-' + Date.now(),
      date: new Date().toISOString(),
      invoiceNo: paymentInvoice,
      customerId: customerId,
      priceType: 'Payment Received',
      items: [],
      total: 0,
      tax: 0,
      discount: 0,
      grandTotal: 0,
      paid: Number(amountPaid),
      balance: Number(amountPaid)
    };
    db.sales.push(sale);
    
    db.customers.forEach(c => {
      if (c.id === customerId) c.balance = customer.balance;
    });

    this._saveDB(db);
    return { success: true };
  },

  // Record a supplier manual payment (e.g. clearing our outstanding bills)
  recordSupplierPayment(supplierId, amountPaid) {
    const db = this._getDB();
    const supplier = db.suppliers.find(s => s.id === supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found.' };

    // Update balance
    supplier.balance += Number(amountPaid);

    // Record in purchases as payment sent
    const purchase = {
      id: 'spmt-' + Date.now(),
      date: new Date().toISOString(),
      supplierId: supplierId,
      items: [],
      totalCost: 0,
      paid: Number(amountPaid),
      balance: Number(amountPaid)
    };
    db.purchases.push(purchase);

    db.suppliers.forEach(s => {
      if (s.id === supplierId) s.balance = supplier.balance;
    });

    this._saveDB(db);
    return { success: true };
  },

  // --- Reports & Analytics ---
  getReportsData() {
    const db = this._getDB();
    
    // Daily sales, monthly sales, P&L, expenses, salaries, low stock
    let totalSales = 0;
    let cogs = 0; // Cost of Goods Sold
    let totalExpenses = 0;
    let totalSalaries = 0;

    // Calculate sales revenue and COGS
    db.sales.forEach(sale => {
      // Exclude simple payment receipts (grandTotal = 0)
      if (sale.grandTotal > 0) {
        totalSales += sale.grandTotal - sale.tax; // Revenue without tax
        // Calculate COGS
        sale.items.forEach(item => {
          const prod = db.products.find(p => p.id === item.productId);
          const cost = prod ? prod.cost : 0;
          cogs += cost * item.qty;
        });
      }
    });

    // Subtract refunds from returns
    db.returns.forEach(ret => {
      totalSales -= ret.totalRefund;
      // Reverse COGS
      ret.items.forEach(item => {
        const prod = db.products.find(p => p.id === item.productId);
        const cost = prod ? prod.cost : 0;
        cogs -= cost * item.qty;
      });
    });

    // Calculate Expenses
    db.expenses.forEach(e => {
      totalExpenses += Number(e.amount);
    });

    // Calculate Salaries
    db.salaries.forEach(s => {
      if (s.status === 'Paid') {
        totalSalaries += Number(s.amount);
      }
    });

    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - (totalExpenses + totalSalaries);

    // Low stock items
    const lowStockAlerts = db.products.filter(p => p.stock < 5);

    // Sales by day (for past 7 days chart)
    const salesByDay = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      salesByDay[key] = 0;
      last7Days.push(key);
    }

    db.sales.forEach(sale => {
      const day = sale.date.split('T')[0];
      if (salesByDay[day] !== undefined && sale.grandTotal > 0) {
        salesByDay[day] += sale.grandTotal;
      }
    });

    return {
      widgets: {
        totalSales,
        cogs,
        grossProfit,
        totalExpenses: totalExpenses + totalSalaries,
        netProfit,
        lowStockCount: lowStockAlerts.length
      },
      lowStockAlerts,
      chartData: {
        labels: last7Days.map(d => {
          const parts = d.split('-');
          return parts[2] + '/' + parts[1]; // DD/MM format
        }),
        data: last7Days.map(d => salesByDay[d])
      },
      expenseSummary: {
        Utilities: db.expenses.filter(e => e.category === 'Utility').reduce((acc, curr) => acc + Number(curr.amount), 0),
        Maintenance: db.expenses.filter(e => e.category === 'Maintenance').reduce((acc, curr) => acc + Number(curr.amount), 0),
        Salaries: totalSalaries,
        Miscellaneous: db.expenses.filter(e => e.category === 'Miscellaneous').reduce((acc, curr) => acc + Number(curr.amount), 0)
      }
    };
  },

  // --- Settings ---
  getSettings() {
    return this._getDB().settings;
  },

  saveSettings(settings) {
    const db = this._getDB();
    db.settings = { ...db.settings, ...settings };
    this._saveDB(db);
    return { success: true, settings: db.settings };
  }
};
