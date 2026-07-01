import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  purchaseNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'purchase_number'
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'purchase_date'
  },
  supplierId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'supplier_id'
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  gst: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  grandTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'grand_total'
  },
  paymentMode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'payment_mode'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'purchases',
  timestamps: false
});

export default Purchase;
