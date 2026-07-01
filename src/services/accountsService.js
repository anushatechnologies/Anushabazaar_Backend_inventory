import { Payment, Customer, Supplier } from '../models/index.js';

export async function getAllPayments() {
  return await Payment.findAll({ order: [['paymentDate', 'DESC']] });
}

export async function getPaymentsByEntity(type, entityId) {
  return await Payment.findAll({
    where: {
      paymentType: type.toUpperCase(),
      entityId
    },
    order: [['paymentDate', 'DESC']]
  });
}

export async function recordCustomerCollection({ entityId, amount, paymentMode, referenceNumber }) {
  const customer = await Customer.findByPk(entityId);
  if (!customer) {
    throw new Error(`Customer not found with id: ${entityId}`);
  }

  const parsedAmount = parseFloat(amount);

  const payment = await Payment.create({
    paymentType: 'RECEIVABLE',
    entityId: customer.id,
    entityName: customer.name,
    amount: parsedAmount,
    paymentMode,
    referenceNumber: referenceNumber || null,
    paymentDate: new Date()
  });

  // Deduct from outstanding balance
  customer.outstandingBalance = parseFloat(customer.outstandingBalance) - parsedAmount;
  await customer.save();

  return payment;
}

export async function recordSupplierPayout({ entityId, amount, paymentMode, referenceNumber }) {
  const supplier = await Supplier.findByPk(entityId);
  if (!supplier) {
    throw new Error(`Supplier not found with id: ${entityId}`);
  }

  const parsedAmount = parseFloat(amount);

  const payment = await Payment.create({
    paymentType: 'PAYABLE',
    entityId: supplier.id,
    entityName: supplier.name,
    amount: parsedAmount,
    paymentMode,
    referenceNumber: referenceNumber || null,
    paymentDate: new Date()
  });

  // Deduct from outstanding balance
  supplier.outstandingBalance = parseFloat(supplier.outstandingBalance) - parsedAmount;
  await supplier.save();

  return payment;
}
