import { Product, StockMovement } from '../models/index.js';
import * as notificationService from './notificationService.js';

export async function getMovementsByProduct(productId) {
  return await StockMovement.findAll({
    where: { productId },
    order: [['movementDate', 'DESC']]
  });
}

export async function getAllMovements() {
  return await StockMovement.findAll({
    include: [{ model: Product, as: 'product' }],
    order: [['movementDate', 'DESC']]
  });
}

export async function adjustStock(productId, quantity, notes) {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const parsedQty = parseFloat(quantity);
  const currentStock = parseFloat(product.currentStock);
  const newStock = currentStock + parsedQty;

  if (newStock < 0) {
    throw new Error(`Adjustment would cause negative stock. Current: ${currentStock}`);
  }

  product.currentStock = newStock;
  const savedProduct = await product.save();

  // Create StockMovement log
  await StockMovement.create({
    productId: product.id,
    type: 'ADJUSTMENT',
    quantity: parsedQty,
    notes: notes || 'Manual adjustment',
    movementDate: new Date()
  });

  // Low stock warning
  if (newStock <= parseFloat(product.minimumStockAlert) && product.status === 'ACTIVE') {
    await notificationService.createLowStockAlert(product);
  }

  return savedProduct;
}
