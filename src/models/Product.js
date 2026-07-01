import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  productCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'product_code'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  categoryId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'category_id'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  looseUnit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'loose_unit'
  },
  conversionFactor: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true,
    field: 'conversion_factor'
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'purchase_price'
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'selling_price'
  },
  currentStock: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 0.000,
    field: 'current_stock'
  },
  minimumStockAlert: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 20.000,
    field: 'minimum_stock_alert'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'products',
  timestamps: false
});

export default Product;
