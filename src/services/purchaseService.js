import { Purchase, PurchaseItem, Supplier, Product, StockMovement, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export async function getPurchases(start, end, page = 0, size = 10, sortBy = 'id', direction = 'desc') {
  const where = {};
  if (start && end) {
    where.purchaseDate = {
      [Op.between]: [start, end]
    };
  }

  const { count, rows } = await Purchase.findAndCountAll({
    where,
    include: [{ model: Supplier, as: 'supplier' }],
    order: [[sortBy, direction.toUpperCase()]],
    limit: parseInt(size),
    offset: parseInt(page) * parseInt(size)
  });

  return {
    content: rows,
    totalPages: Math.ceil(count / size)
  };
}

export async function getPurchaseById(id) {
  const purchase = await Purchase.findByPk(id, {
    include: [
      { model: Supplier, as: 'supplier' },
      {
        model: PurchaseItem,
        as: 'purchaseItems',
        include: [{ model: Product, as: 'product' }]
      }
    ]
  });
  if (!purchase) {
    throw new Error(`Purchase not found with id: ${id}`);
  }
  return purchase;
}

export async function savePurchase(data) {
  const transaction = await sequelize.transaction();

  try {
    const supplier = await Supplier.findByPk(data.supplierId, { transaction });
    if (!supplier) {
      throw new Error(`Supplier not found with id: ${data.supplierId}`);
    }

    // Generate Purchase Number: PUR-yyyyMMdd-XXXX
    const purchaseDateStr = data.purchaseDate; // yyyy-MM-dd
    const formattedDate = purchaseDateStr.replace(/-/g, ''); // yyyyMMdd
    const todayCount = await Purchase.count({
      where: { purchaseDate: purchaseDateStr },
      transaction
    });
    const seqStr = String(todayCount + 1).padStart(4, '0');
    const purchaseNumber = `PUR-${formattedDate}-${seqStr}`;

    let subtotal = 0;
    const discount = parseFloat(data.discount) || 0;
    const gst = parseFloat(data.gst) || 0;

    const purchase = await Purchase.create({
      purchaseNumber,
      purchaseDate: purchaseDateStr,
      supplierId: supplier.id,
      paymentMode: data.paymentMode,
      status: 'ACTIVE',
      discount,
      gst,
      subtotal: 0,
      grandTotal: 0
    }, { transaction });

    for (const itemReq of data.items) {
      const product = await Product.findByPk(itemReq.productId, { transaction });
      if (!product) {
        throw new Error(`Product not found with id: ${itemReq.productId}`);
      }

      const requestQty = parseFloat(itemReq.quantity);
      let addQty = requestQty;

      if (product.looseUnit && product.looseUnit.toLowerCase() === itemReq.unit.toLowerCase()) {
        const factor = parseFloat(product.conversionFactor);
        if (!factor || factor <= 0) {
          throw new Error(`Product '${product.name}' does not have a valid conversion factor.`);
        }
        addQty = requestQty / factor;
      }

      const itemAmount = parseFloat(itemReq.purchasePrice) * requestQty;
      subtotal += itemAmount;

      // Create PurchaseItem
      await PurchaseItem.create({
        purchaseId: purchase.id,
        productId: product.id,
        quantity: requestQty,
        unit: itemReq.unit,
        purchasePrice: parseFloat(itemReq.purchasePrice),
        amount: itemAmount
      }, { transaction });

      // Update product stock
      product.currentStock = parseFloat(product.currentStock) + addQty;
      await product.save({ transaction });

      // Log Stock Movement
      await StockMovement.create({
        productId: product.id,
        type: 'PURCHASE',
        quantity: addQty,
        notes: `Purchase entry: ${purchaseNumber} (${requestQty} ${itemReq.unit})`,
        movementDate: new Date()
      }, { transaction });
    }

    const grandTotal = subtotal - discount + gst;

    purchase.subtotal = subtotal;
    purchase.grandTotal = grandTotal;
    await purchase.save({ transaction });

    // Update Supplier outstanding balance if CREDIT
    if (data.paymentMode.toUpperCase() === 'CREDIT') {
      supplier.outstandingBalance = parseFloat(supplier.outstandingBalance) + grandTotal;
      await supplier.save({ transaction });
    }

    await transaction.commit();
    return await getPurchaseById(purchase.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function cancelPurchase(id) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(id, {
      include: [{ model: PurchaseItem, as: 'purchaseItems', include: [{ model: Product, as: 'product' }] }],
      transaction
    });

    if (!purchase) {
      throw new Error(`Purchase not found with id: ${id}`);
    }

    if (purchase.status.toUpperCase() === 'CANCELLED') {
      throw new Error('Purchase is already cancelled');
    }

    purchase.status = 'CANCELLED';
    await purchase.save({ transaction });

    // Revert product stock and log stock movement
    for (const item of purchase.purchaseItems) {
      const product = item.product;
      const requestQty = parseFloat(item.quantity);
      let subtractQty = requestQty;

      if (product.looseUnit && product.looseUnit.toLowerCase() === item.unit.toLowerCase()) {
        const factor = parseFloat(product.conversionFactor);
        subtractQty = requestQty / factor;
      }

      product.currentStock = parseFloat(product.currentStock) - subtractQty;
      await product.save({ transaction });

      await StockMovement.create({
        productId: product.id,
        type: 'ADJUSTMENT',
        quantity: -subtractQty,
        notes: `Cancelled Purchase: ${purchase.purchaseNumber}`,
        movementDate: new Date()
      }, { transaction });
    }

    // Revert Supplier outstanding balance if CREDIT
    if (purchase.paymentMode.toUpperCase() === 'CREDIT') {
      const supplier = await Supplier.findByPk(purchase.supplierId, { transaction });
      if (supplier) {
        supplier.outstandingBalance = parseFloat(supplier.outstandingBalance) - parseFloat(purchase.grandTotal);
        await supplier.save({ transaction });
      }
    }

    await transaction.commit();
    return await getPurchaseById(purchase.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deletePurchase(id) {
  const transaction = await sequelize.transaction();

  try {
    const purchase = await Purchase.findByPk(id, {
      include: [{ model: PurchaseItem, as: 'purchaseItems', include: [{ model: Product, as: 'product' }] }],
      transaction
    });

    if (!purchase) {
      throw new Error(`Purchase not found with id: ${id}`);
    }

    // If ACTIVE, revert stock/balance before deletion
    if (purchase.status.toUpperCase() === 'ACTIVE') {
      for (const item of purchase.purchaseItems) {
        const product = item.product;
        const requestQty = parseFloat(item.quantity);
        let subtractQty = requestQty;

        if (product.looseUnit && product.looseUnit.toLowerCase() === item.unit.toLowerCase()) {
          const factor = parseFloat(product.conversionFactor);
          subtractQty = requestQty / factor;
        }

        let finalStock = parseFloat(product.currentStock) - subtractQty;
        if (finalStock < 0) {
          finalStock = 0;
        }
        product.currentStock = finalStock;
        await product.save({ transaction });
      }

      if (purchase.paymentMode.toUpperCase() === 'CREDIT') {
        const supplier = await Supplier.findByPk(purchase.supplierId, { transaction });
        if (supplier) {
          supplier.outstandingBalance = parseFloat(supplier.outstandingBalance) - parseFloat(purchase.grandTotal);
          await supplier.save({ transaction });
        }
      }
    }

    // Delete stock movement records
    await StockMovement.destroy({
      where: {
        notes: { [Op.like]: `%${purchase.purchaseNumber}%` }
      },
      transaction
    });

    // Delete purchase
    await purchase.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
