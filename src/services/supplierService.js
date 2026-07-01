import { Supplier, Purchase, Payment } from '../models/index.js';
import { Op } from 'sequelize';

export async function getSuppliers(search, page = 0, size = 10, sortBy = 'id', direction = 'asc') {
  const where = {};
  if (search && search.trim() !== '') {
    where.name = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Supplier.findAndCountAll({
    where,
    order: [[sortBy, direction.toUpperCase()]],
    limit: parseInt(size),
    offset: parseInt(page) * parseInt(size)
  });

  return {
    content: rows,
    totalPages: Math.ceil(count / size)
  };
}

export async function getAllSuppliers() {
  return await Supplier.findAll({ order: [['name', 'ASC']] });
}

export async function getSupplierById(id) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    throw new Error(`Supplier not found with id: ${id}`);
  }
  return supplier;
}

export async function createSupplier(data) {
  return await Supplier.create({
    name: data.name,
    mobile: data.mobile || null,
    email: data.email || null,
    gst: data.gst || null,
    address: data.address || null,
    outstandingBalance: data.outstandingBalance !== undefined ? data.outstandingBalance : 0.00
  });
}

export async function updateSupplier(id, data) {
  const supplier = await getSupplierById(id);
  
  if (data.name) supplier.name = data.name;
  supplier.mobile = data.mobile || null;
  supplier.email = data.email || null;
  supplier.gst = data.gst || null;
  supplier.address = data.address || null;

  return await supplier.save();
}

export async function deleteSupplier(id) {
  const supplier = await getSupplierById(id);
  await supplier.destroy();
}

export async function getSupplierLedger(supplierId) {
  // Verify supplier exists
  await getSupplierById(supplierId);

  const purchases = await Purchase.findAll({ where: { supplierId } });
  const payments = await Payment.findAll({
    where: {
      paymentType: 'PAYABLE',
      entityId: supplierId
    }
  });

  const entries = [];

  // Map Purchases
  for (const purchase of purchases) {
    const isCancelled = 'CANCELLED'.toUpperCase() === purchase.status.toUpperCase();
    entries.push({
      date: new Date(`${purchase.purchaseDate}T00:00:00`),
      description: isCancelled ? `Cancelled Purchase (${purchase.purchaseNumber})` : `Purchase Restock (${purchase.purchaseNumber})`,
      type: isCancelled ? 'CANCELLED' : 'DEBIT',
      amount: parseFloat(purchase.grandTotal),
      balance: 0.00
    });
  }

  // Map Payments
  for (const payment of payments) {
    const refSuffix = payment.referenceNumber ? ` (${payment.referenceNumber})` : '';
    entries.push({
      date: new Date(payment.paymentDate),
      description: `Payment Paid - ${payment.paymentMode}${refSuffix}`,
      type: 'CREDIT',
      amount: parseFloat(payment.amount),
      balance: 0.00
    });
  }

  // Sort by date ascending
  entries.sort((a, b) => a.date - b.date);

  // Compute running balance
  let runningBalance = 0;
  for (const entry of entries) {
    if (entry.type === 'DEBIT') {
      runningBalance += entry.amount;
    } else if (entry.type === 'CREDIT') {
      runningBalance -= entry.amount;
    }
    entry.balance = Math.round(runningBalance * 100) / 100;
  }

  return entries;
}
