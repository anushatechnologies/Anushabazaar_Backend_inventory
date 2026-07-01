import { Sale, SaleItem, Customer, Product, StockMovement, sequelize } from '../models/index.js';
import * as notificationService from './notificationService.js';
import { Op } from 'sequelize';

export async function getSales(start, end, page = 0, size = 10, sortBy = 'id', direction = 'desc') {
  const where = {};
  if (start && end) {
    where.saleDate = {
      [Op.between]: [start, end]
    };
  }

  const { count, rows } = await Sale.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer' }],
    order: [[sortBy, direction.toUpperCase()]],
    limit: parseInt(size),
    offset: parseInt(page) * parseInt(size)
  });

  return {
    content: rows,
    totalPages: Math.ceil(count / size)
  };
}

export async function getSaleById(id) {
  const sale = await Sale.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      {
        model: SaleItem,
        as: 'saleItems',
        include: [{ model: Product, as: 'product' }]
      }
    ]
  });
  if (!sale) {
    throw new Error(`Sale not found with id: ${id}`);
  }
  return sale;
}

export async function saveSale(data) {
  const transaction = await sequelize.transaction();

  try {
    const customer = await Customer.findByPk(data.customerId, { transaction });
    if (!customer) {
      throw new Error(`Customer not found with id: ${data.customerId}`);
    }

    // Generate Invoice Number: INV-yyyyMMdd-XXXX
    const saleDateStr = data.saleDate; // yyyy-MM-dd
    const formattedDate = saleDateStr.replace(/-/g, ''); // yyyyMMdd
    const todayCount = await Sale.count({
      where: { saleDate: saleDateStr },
      transaction
    });
    const seqStr = String(todayCount + 1).padStart(4, '0');
    const invoiceNumber = `INV-${formattedDate}-${seqStr}`;

    let subtotal = 0;
    const discount = parseFloat(data.discount) || 0;
    const gst = parseFloat(data.gst) || 0;
    const transportCharges = parseFloat(data.transportCharges) || 0;

    const sale = await Sale.create({
      invoiceNumber,
      saleDate: saleDateStr,
      customerId: customer.id,
      paymentMode: data.paymentMode,
      status: 'ACTIVE',
      discount,
      gst,
      transportCharges,
      subtotal: 0,
      grandTotal: 0,
      vehicleNumber: data.vehicleNumber || null,
      driverName: data.driverName || null,
      driverNumber: data.driverNumber || null
    }, { transaction });

    for (const itemReq of data.items) {
      const product = await Product.findByPk(itemReq.productId, { transaction });
      if (!product) {
        throw new Error(`Product not found with id: ${itemReq.productId}`);
      }

      const requestQty = parseFloat(itemReq.quantity);
      let deductQty = requestQty;

      if (product.looseUnit && product.looseUnit.toLowerCase() === itemReq.unit.toLowerCase()) {
        const factor = parseFloat(product.conversionFactor);
        if (!factor || factor <= 0) {
          throw new Error(`Product '${product.name}' does not have a valid conversion factor.`);
        }
        deductQty = requestQty / factor;
      }

      // Stock Check
      const currentStock = parseFloat(product.currentStock);
      if (currentStock < deductQty) {
        throw new Error(`Insufficient stock for product '${product.name}'. Available: ${currentStock} ${product.unit}, Requested: ${requestQty} ${itemReq.unit}`);
      }

      const itemAmount = parseFloat(itemReq.sellingPrice) * requestQty;
      subtotal += itemAmount;

      // Create SaleItem
      await SaleItem.create({
        saleId: sale.id,
        productId: product.id,
        quantity: requestQty,
        unit: itemReq.unit,
        sellingPrice: parseFloat(itemReq.sellingPrice),
        amount: itemAmount
      }, { transaction });

      // Deduct stock
      product.currentStock = currentStock - deductQty;
      await product.save({ transaction });

      // Log Stock Movement
      await StockMovement.create({
        productId: product.id,
        type: 'SALE',
        quantity: -deductQty,
        notes: `Sale invoice: ${invoiceNumber} (${requestQty} ${itemReq.unit})`,
        movementDate: new Date()
      }, { transaction });

      // Low Stock Warning
      if (product.minimumStockAlert !== null && product.currentStock <= parseFloat(product.minimumStockAlert)) {
        await notificationService.createLowStockAlert(product);
      }
    }

    const grandTotal = subtotal - discount + gst + transportCharges;

    sale.subtotal = subtotal;
    sale.grandTotal = grandTotal;
    await sale.save({ transaction });

    // Update Customer outstanding balance if CREDIT
    if (data.paymentMode.toUpperCase() === 'CREDIT') {
      customer.outstandingBalance = parseFloat(customer.outstandingBalance) + grandTotal;
      await customer.save({ transaction });
    }

    await transaction.commit();
    return await getSaleById(sale.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function cancelSale(id) {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: SaleItem, as: 'saleItems', include: [{ model: Product, as: 'product' }] }],
      transaction
    });

    if (!sale) {
      throw new Error(`Sale not found with id: ${id}`);
    }

    if (sale.status.toUpperCase() === 'CANCELLED') {
      throw new Error('Sale is already cancelled');
    }

    sale.status = 'CANCELLED';
    await sale.save({ transaction });

    // Revert product stock and log stock movement
    for (const item of sale.saleItems) {
      const product = item.product;
      const requestQty = parseFloat(item.quantity);
      let addQty = requestQty;

      if (product.looseUnit && product.looseUnit.toLowerCase() === item.unit.toLowerCase()) {
        const factor = parseFloat(product.conversionFactor);
        addQty = requestQty / factor;
      }

      product.currentStock = parseFloat(product.currentStock) + addQty;
      await product.save({ transaction });

      await StockMovement.create({
        productId: product.id,
        type: 'ADJUSTMENT',
        quantity: addQty,
        notes: `Cancelled Sale: ${sale.invoiceNumber}`,
        movementDate: new Date()
      }, { transaction });
    }

    // Revert Customer outstanding balance if CREDIT
    if (sale.paymentMode.toUpperCase() === 'CREDIT') {
      const customer = await Customer.findByPk(sale.customerId, { transaction });
      if (customer) {
        customer.outstandingBalance = parseFloat(customer.outstandingBalance) - parseFloat(sale.grandTotal);
        await customer.save({ transaction });
      }
    }

    await transaction.commit();
    return await getSaleById(sale.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteSale(id) {
  const transaction = await sequelize.transaction();

  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: SaleItem, as: 'saleItems', include: [{ model: Product, as: 'product' }] }],
      transaction
    });

    if (!sale) {
      throw new Error(`Sale not found with id: ${id}`);
    }

    // If ACTIVE, revert stock/balance before deletion
    if (sale.status.toUpperCase() === 'ACTIVE') {
      for (const item of sale.saleItems) {
        const product = item.product;
        const requestQty = parseFloat(item.quantity);
        let addQty = requestQty;

        if (product.looseUnit && product.looseUnit.toLowerCase() === item.unit.toLowerCase()) {
          const factor = parseFloat(product.conversionFactor);
          addQty = requestQty / factor;
        }

        product.currentStock = parseFloat(product.currentStock) + addQty;
        await product.save({ transaction });
      }

      if (sale.paymentMode.toUpperCase() === 'CREDIT') {
        const customer = await Customer.findByPk(sale.customerId, { transaction });
        if (customer) {
          customer.outstandingBalance = parseFloat(customer.outstandingBalance) - parseFloat(sale.grandTotal);
          await customer.save({ transaction });
        }
      }
    }

    // Delete stock movement records
    await StockMovement.destroy({
      where: {
        notes: { [Op.like]: `%${sale.invoiceNumber}%` }
      },
      transaction
    });

    // Delete sale
    await sale.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
