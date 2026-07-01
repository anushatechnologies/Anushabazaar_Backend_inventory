import { Product, Category, PurchaseItem, SaleItem, StockMovement, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export async function getProducts(search, page = 0, size = 10, sortBy = 'id', direction = 'asc') {
  const where = {};
  if (search && search.trim() !== '') {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { productCode: { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [{ model: Category, as: 'category' }],
    order: [[sortBy, direction.toUpperCase()]],
    limit: parseInt(size),
    offset: parseInt(page) * parseInt(size)
  });

  const totalPages = Math.ceil(count / size);

  return {
    content: rows,
    totalPages
  };
}

export async function getAllProducts() {
  return await Product.findAll({
    include: [{ model: Category, as: 'category' }],
    order: [['name', 'ASC']]
  });
}

export async function getProductById(id) {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category' }]
  });
  if (!product) {
    throw new Error(`Product not found with id: ${id}`);
  }
  return product;
}

export async function createProduct(data) {
  const codeExists = await Product.findOne({ where: { productCode: data.productCode } });
  if (codeExists) {
    throw new Error(`Product code '${data.productCode}' is already in use`);
  }

  const category = await Category.findByPk(data.categoryId);
  if (!category) {
    throw new Error(`Category not found with id: ${data.categoryId}`);
  }

  const product = await Product.create({
    productCode: data.productCode,
    name: data.name,
    categoryId: data.categoryId,
    unit: data.unit,
    looseUnit: data.looseUnit || null,
    conversionFactor: data.conversionFactor || null,
    purchasePrice: data.purchasePrice,
    sellingPrice: data.sellingPrice,
    minimumStockAlert: data.minimumStockAlert !== undefined ? data.minimumStockAlert : 20.000,
    currentStock: 0.000,
    status: data.status ? data.status.toUpperCase() : 'ACTIVE'
  });

  return await getProductById(product.id);
}

export async function updateProduct(id, data) {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error(`Product not found with id: ${id}`);
  }

  if (data.productCode && data.productCode !== product.productCode) {
    const codeExists = await Product.findOne({ where: { productCode: data.productCode } });
    if (codeExists) {
      throw new Error(`Product code '${data.productCode}' is already in use`);
    }
    product.productCode = data.productCode;
  }

  if (data.categoryId) {
    const category = await Category.findByPk(data.categoryId);
    if (!category) {
      throw new Error(`Category not found with id: ${data.categoryId}`);
    }
    product.categoryId = data.categoryId;
  }

  if (data.name) product.name = data.name;
  if (data.unit) product.unit = data.unit;
  product.looseUnit = data.looseUnit || null;
  product.conversionFactor = data.conversionFactor || null;
  if (data.purchasePrice !== undefined) product.purchasePrice = data.purchasePrice;
  if (data.sellingPrice !== undefined) product.sellingPrice = data.sellingPrice;
  if (data.minimumStockAlert !== undefined) product.minimumStockAlert = data.minimumStockAlert;
  if (data.status) product.status = data.status.toUpperCase();

  await product.save();
  return await getProductById(product.id);
}

export async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error(`Product not found with id: ${id}`);
  }

  const hasPurchases = await PurchaseItem.findOne({ where: { productId: id } });
  const hasSales = await SaleItem.findOne({ where: { productId: id } });
  const hasMovements = await StockMovement.findOne({ where: { productId: id } });

  if (hasPurchases || hasSales || hasMovements) {
    // Soft delete
    product.status = 'INACTIVE';
    await product.save();
    return {
      message: 'Product has transaction history and cannot be permanently deleted. It has been marked as INACTIVE.',
      type: 'soft_delete'
    };
  } else {
    try {
      await product.destroy();
      return {
        message: 'Product permanently deleted.',
        type: 'hard_delete'
      };
    } catch (ex) {
      // Fallback
      product.status = 'INACTIVE';
      await product.save();
      return {
        message: 'Product is referenced by other records and cannot be permanently deleted. It has been marked as INACTIVE.',
        type: 'soft_delete'
      };
    }
  }
}

export async function getLowStockProducts() {
  return await Product.findAll({
    where: {
      status: 'ACTIVE',
      currentStock: {
        [Op.lte]: sequelize.col('minimum_stock_alert') // Wait, in Sequelize we need correct raw or col comparison
      }
    },
    include: [{ model: Category, as: 'category' }]
  });
}
