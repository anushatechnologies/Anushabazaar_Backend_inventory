import { Purchase, Sale, SaleItem, Product, Customer, Supplier, Category } from '../models/index.js';
import { Op } from 'sequelize';

export async function getSummary() {
  const todayStr = new Date().toISOString().split('T')[0]; // yyyy-MM-dd

  // 1. Today's Purchases
  const todayPurchasesRaw = await Purchase.sum('grand_total', {
    where: {
      purchaseDate: todayStr,
      status: 'ACTIVE'
    }
  });
  const todayPurchases = todayPurchasesRaw ? parseFloat(todayPurchasesRaw) : 0;

  // 2. Today's Sales
  const todaySalesRaw = await Sale.sum('grand_total', {
    where: {
      saleDate: todayStr,
      status: 'ACTIVE'
    }
  });
  const todaySales = todaySalesRaw ? parseFloat(todaySalesRaw) : 0;

  // 3. Total Stock Value = SUM(currentStock * purchasePrice)
  const products = await Product.findAll();
  let totalStockValue = 0;
  for (const prod of products) {
    totalStockValue += parseFloat(prod.currentStock) * parseFloat(prod.purchasePrice);
  }

  // 4. Total Customers & Suppliers
  const totalCustomers = await Customer.count();
  const totalSuppliers = await Supplier.count();

  // 5. Pending Receivables & Payables
  const pendingReceivablesRaw = await Customer.sum('outstanding_balance');
  const pendingReceivables = pendingReceivablesRaw ? parseFloat(pendingReceivablesRaw) : 0;

  const pendingPayablesRaw = await Supplier.sum('outstanding_balance');
  const pendingPayables = pendingPayablesRaw ? parseFloat(pendingPayablesRaw) : 0;

  // 6. Gross Profit/Loss = SUM((item.sellingPrice - product.purchasePrice) * item.quantity) - SUM(transportCharges)
  const activeSales = await Sale.findAll({
    where: { status: 'ACTIVE' },
    include: [{
      model: SaleItem,
      as: 'saleItems',
      include: [{ model: Product, as: 'product' }]
    }]
  });

  let profitLoss = 0;
  for (const sale of activeSales) {
    for (const item of sale.saleItems) {
      const cost = parseFloat(item.product.purchasePrice);
      const selling = parseFloat(item.sellingPrice);
      const qty = parseFloat(item.quantity);
      profitLoss += (selling - cost) * qty;
    }
    profitLoss -= parseFloat(sale.transportCharges || 0);
  }

  return {
    todayPurchases,
    todaySales,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    totalCustomers,
    totalSuppliers,
    pendingReceivables,
    pendingPayables,
    profitLoss: Math.round(profitLoss * 100) / 100
  };
}

export async function getChartsData() {
  const today = new Date();
  
  // 1. Daily Sales & Purchases Trend (Last 7 days)
  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const salesSum = await Sale.sum('grand_total', {
      where: { saleDate: dateStr, status: 'ACTIVE' }
    }) || 0;

    const purchasesSum = await Purchase.sum('grand_total', {
      where: { purchaseDate: dateStr, status: 'ACTIVE' }
    }) || 0;

    dailyTrends.push({
      date: dateStr,
      sales: parseFloat(salesSum),
      purchases: parseFloat(purchasesSum)
    });
  }

  // 2. Monthly Sales (Current Year)
  const currentYear = today.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthMap = {};
  months.forEach(m => { monthMap[m] = 0; });

  const yearSales = await Sale.findAll({
    where: {
      status: 'ACTIVE',
      saleDate: {
        [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
      }
    }
  });

  for (const sale of yearSales) {
    const monthIndex = new Date(sale.saleDate).getMonth();
    const monthName = months[monthIndex];
    monthMap[monthName] += parseFloat(sale.grandTotal);
  }

  const monthlySales = months.map(m => ({
    month: m,
    sales: Math.round(monthMap[m] * 100) / 100
  }));

  // 3. Top Selling Products (by Quantity sold)
  const activeSalesForTop = await Sale.findAll({
    where: { status: 'ACTIVE' },
    include: [{
      model: SaleItem,
      as: 'saleItems',
      include: [{ model: Product, as: 'product' }]
    }]
  });

  const productSalesQty = {};
  for (const sale of activeSalesForTop) {
    for (const item of sale.saleItems) {
      const name = item.product.name;
      const qty = parseFloat(item.quantity);
      productSalesQty[name] = (productSalesQty[name] || 0) + qty;
    }
  }

  const topProducts = Object.keys(productSalesQty)
    .map(name => ({
      name,
      quantity: productSalesQty[name]
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 4. Stock Summary by Category
  const activeProducts = await Product.findAll({
    where: { status: 'ACTIVE' },
    include: [{ model: Category, as: 'category' }]
  });

  const stockByCategory = {};
  for (const prod of activeProducts) {
    const catName = prod.category.name;
    const stock = parseFloat(prod.currentStock);
    stockByCategory[catName] = (stockByCategory[catName] || 0) + stock;
  }

  const stockSummary = Object.keys(stockByCategory).map(category => ({
    category,
    stock: Math.round(stockByCategory[category] * 1000) / 1000
  }));

  return {
    dailyTrends,
    monthlySales,
    topProducts,
    stockSummary
  };
}
