import { Notification } from '../models/index.js';

export async function getUnreadNotifications() {
  return await Notification.findAll({
    where: { isRead: false },
    order: [['createdAt', 'DESC']]
  });
}

export async function getAllNotifications() {
  return await Notification.findAll({
    order: [['createdAt', 'DESC']]
  });
}

export async function getUnreadCount() {
  return await Notification.count({ where: { isRead: false } });
}

export async function markAsRead(id) {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new Error(`Notification not found: ${id}`);
  }
  notification.isRead = true;
  await notification.save();
  return notification;
}

export async function markAllAsRead() {
  await Notification.update({ isRead: true }, { where: { isRead: false } });
}

export async function createLowStockAlert(product) {
  const title = `Low Stock Alert: ${product.name}`;
  const message = `Product '${product.name}' (Code: ${product.productCode}) has reached low stock. Current level: ${product.currentStock} ${product.unit} (Threshold: ${product.minimumStockAlert} ${product.unit}).`;

  await Notification.create({
    title,
    message,
    type: 'LOW_STOCK',
    isRead: false,
    createdAt: new Date()
  });
}

export async function createPendingPaymentAlert(name, type, amount) {
  const title = `Pending Payment Alert: ${name}`;
  const isReceivable = type === 'RECEIVABLE';
  const label = isReceivable ? 'Receivable (Customer)' : 'Payable (Supplier)';
  const message = `Outstanding ${label} balance for '${name}' is high: Rs. ${amount}.`;

  await Notification.create({
    title,
    message,
    type: 'PENDING_PAYMENT',
    isRead: false,
    createdAt: new Date()
  });
}
