// Database Integrity Verification Suite for AL-SADAT AUTO
import { DB } from './db.js';

export const Verify = {
  run() {
    console.log('%c--- AL-SADAT AUTO: RUNNING CODE INTEGRITY & DATABASE TESTS ---', 'color: cyan; font-weight: bold;');
    
    try {
      this.testInventoryDeductionAndLedgerOnSale();
      this.testInventoryIncrementAndLedgerOnPurchase();
      this.testInventoryRestockOnReturn();
      this.testFinancialFormulas();
      
      console.log('%c All database integrity verification checks passed successfully.', 'color: green; font-weight: bold;');
    } catch (err) {
      console.error('%c Verification check failed:', 'color: red; font-weight: bold;', err);
    }
  },

  testInventoryDeductionAndLedgerOnSale() {
    DB.init();
    const productsBefore = JSON.parse(JSON.stringify(DB.getProducts()));
    const product = productsBefore.find(p => p.stock > 5);
    if (!product) throw new Error('No product found for sale test.');

    const customersBefore = JSON.parse(JSON.stringify(DB.getCustomers()));
    const customer = customersBefore[0];

    const saleQty = 2;
    const salePrice = product.retail;
    const total = salePrice * saleQty;
    const tax = Math.round(total * 0.17);
    const grandTotal = total + tax;
    const paid = grandTotal - 1000; // Customer owes 1000

    const saleData = {
      customerId: customer.id,
      priceType: 'Retail (B)',
      items: [{
        productId: product.id,
        sku: product.sku,
        name: product.name,
        qty: saleQty,
        price: salePrice,
        total: total
      }],
      total: total,
      tax: tax,
      discount: 0,
      grandTotal: grandTotal,
      paid: paid
    };

    const res = DB.addSale(saleData);
    if (!res.success) throw new Error(`Sale transaction failed: ${res.message}`);

    const productsAfter = DB.getProducts();
    const productAfter = productsAfter.find(p => p.id === product.id);
    if (productAfter.stock !== product.stock - saleQty) {
      throw new Error(`Inventory deduction failed. Expected ${product.stock - saleQty}, got ${productAfter.stock}`);
    }

    const customersAfter = DB.getCustomers();
    const customerAfter = customersAfter.find(c => c.id === customer.id);
    if (customerAfter.balance !== customer.balance - 1000) {
      throw new Error(`Customer ledger balance adjustment failed. Expected ${customer.balance - 1000}, got ${customerAfter.balance}`);
    }

    console.log('  1. Product sale stock deduction & customer ledger transaction match verified.');
  },

  testInventoryIncrementAndLedgerOnPurchase() {
    const productsBefore = JSON.parse(JSON.stringify(DB.getProducts()));
    const product = productsBefore[0];

    const suppliersBefore = JSON.parse(JSON.stringify(DB.getSuppliers()));
    const supplier = suppliersBefore[0];

    const purchaseQty = 10;
    const purchaseCost = 1000;
    const totalCost = purchaseQty * purchaseCost;
    const paid = totalCost - 2000; // We owe supplier 2000

    const purchaseData = {
      supplierId: supplier.id,
      items: [{
        productId: product.id,
        sku: product.sku,
        name: product.name,
        qty: purchaseQty,
        cost: purchaseCost,
        total: totalCost
      }],
      totalCost: totalCost,
      paid: paid
    };

    const res = DB.addPurchase(purchaseData);
    if (!res.success) throw new Error('Purchase transaction failed.');

    const productsAfter = DB.getProducts();
    const productAfter = productsAfter.find(p => p.id === product.id);
    if (productAfter.stock !== product.stock + purchaseQty) {
      throw new Error(`Inventory inflow failed. Expected ${product.stock + purchaseQty}, got ${productAfter.stock}`);
    }
    if (productAfter.cost !== purchaseCost) {
      throw new Error(`Product unit cost update failed. Expected ${purchaseCost}, got ${productAfter.cost}`);
    }

    const suppliersAfter = DB.getSuppliers();
    const supplierAfter = suppliersAfter.find(s => s.id === supplier.id);
    if (supplierAfter.balance !== supplier.balance - 2000) {
      throw new Error(`Supplier ledger balance update failed. Expected ${supplier.balance - 2000}, got ${supplierAfter.balance}`);
    }

    console.log('  2. Supplier purchase inventory increment, unit cost, and ledger liability match verified.');
  },

  testInventoryRestockOnReturn() {
    const sales = DB.getSales();
    const sale = sales.find(s => s.items.length > 0 && s.grandTotal > 0);
    if (!sale) return;

    const returnItem = sale.items[0];
    const productsBefore = JSON.parse(JSON.stringify(DB.getProducts()));
    const product = productsBefore.find(p => p.id === returnItem.productId);

    const customersBefore = JSON.parse(JSON.stringify(DB.getCustomers()));
    const customer = customersBefore.find(c => c.id === sale.customerId) || { balance: 0 };

    const returnQty = 1;
    const refundVal = returnItem.price * returnQty;

    const returnData = {
      saleId: sale.id,
      items: [{
        productId: returnItem.productId,
        qty: returnQty,
        refundAmount: refundVal
      }],
      totalRefund: refundVal,
      autoRestock: true
    };

    const res = DB.addReturn(returnData);
    if (!res.success) throw new Error('Return transaction failed.');

    const productsAfter = DB.getProducts();
    const productAfter = productsAfter.find(p => p.id === returnItem.productId);
    if (product.stock !== null && productAfter.stock !== product.stock + returnQty) {
      throw new Error(`Return restock failed. Expected ${product.stock + returnQty}, got ${productAfter.stock}`);
    }

    const customersAfter = DB.getCustomers();
    const customerAfter = customersAfter.find(c => c.id === sale.customerId) || { balance: 0 };
    if (customer.balance !== null && customerAfter.balance !== customer.balance + refundVal) {
      throw new Error(`Customer refund credit failed. Expected ${customer.balance + refundVal}, got ${customerAfter.balance}`);
    }

    console.log('  3. Customer item return restock and refund credit updates verified.');
  },

  testFinancialFormulas() {
    const data = DB.getReportsData();
    const widgets = data.widgets;

    // Gross Profit = Total Net Sales - COGS
    const calculatedGross = widgets.totalSales - widgets.cogs;
    if (Math.round(widgets.grossProfit) !== Math.round(calculatedGross)) {
      throw new Error(`Gross profit formula mismatch. Got ${widgets.grossProfit}, expected ${calculatedGross}`);
    }

    // Net Profit = Gross Profit - Operating Expenses
    const calculatedNet = widgets.grossProfit - widgets.totalExpenses;
    if (Math.round(widgets.netProfit) !== Math.round(calculatedNet)) {
      throw new Error(`Net profit formula mismatch. Got ${widgets.netProfit}, expected ${calculatedNet}`);
    }

    console.log('  4. Financial formulas (Gross Profit, Net Income) calculations verified.');
  }
};
