import { Customer, Sale, Payment } from '../models/index.js';
import { Op } from 'sequelize';

export async function getCustomers(search, page = 0, size = 10, sortBy = 'id', direction = 'asc') {
  const where = {};
  if (search && search.trim() !== '') {
    where.name = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Customer.findAndCountAll({
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

export async function getAllCustomers() {
  return await Customer.findAll({ order: [['name', 'ASC']] });
}

export async function getCustomerById(id) {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new Error(`Customer not found with id: ${id}`);
  }
  return customer;
}

export async function createCustomer(data) {
  return await Customer.create({
    name: data.name,
    mobile: data.mobile || null,
    email: data.email || null,
    address: data.address || null,
    gst: data.gst || null,
    outstandingBalance: data.outstandingBalance !== undefined ? data.outstandingBalance : 0.00
  });
}

export async function updateCustomer(id, data) {
  const customer = await getCustomerById(id);
  
  if (data.name) customer.name = data.name;
  customer.mobile = data.mobile || null;
  customer.email = data.email || null;
  customer.address = data.address || null;
  customer.gst = data.gst || null;

  return await customer.save();
}

export async function deleteCustomer(id) {
  const customer = await getCustomerById(id);
  await customer.destroy();
}

export async function getCustomerLedger(customerId) {
  // Verify customer exists
  await getCustomerById(customerId);

  const sales = await Sale.findAll({ where: { customerId } });
  const payments = await Payment.findAll({
    where: {
      paymentType: 'RECEIVABLE',
      entityId: customerId
    }
  });

  const entries = [];

  // Map Sales
  for (const sale of sales) {
    const isCancelled = 'CANCELLED'.toUpperCase() === sale.status.toUpperCase();
    entries.push({
      date: new Date(`${sale.saleDate}T00:00:00`),
      description: isCancelled ? `Cancelled Sale (${sale.invoiceNumber})` : `Invoice Sale (${sale.invoiceNumber})`,
      type: isCancelled ? 'CANCELLED' : 'DEBIT',
      amount: parseFloat(sale.grandTotal),
      balance: 0.00
    });
  }

  // Map Payments
  for (const payment of payments) {
    const refSuffix = payment.referenceNumber ? ` (${payment.referenceNumber})` : '';
    entries.push({
      date: new Date(payment.paymentDate),
      description: `Payment Received - ${payment.paymentMode}${refSuffix}`,
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
