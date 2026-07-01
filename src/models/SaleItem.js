import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  saleId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'sale_id'
  },
  productId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'product_id'
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'selling_price'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
}, {
  tableName: 'sale_items',
  timestamps: false
});

export default SaleItem;
