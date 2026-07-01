import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  purchaseId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'purchase_id'
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
  purchasePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'purchase_price'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
}, {
  tableName: 'purchase_items',
  timestamps: false
});

export default PurchaseItem;
