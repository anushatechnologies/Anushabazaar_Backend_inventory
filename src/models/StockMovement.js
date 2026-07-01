import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'product_id'
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false
  },
  movementDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'movement_date'
  },
  notes: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'stock_movements',
  timestamps: false
});

export default StockMovement;
