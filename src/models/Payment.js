import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  paymentType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'payment_type'
  },
  entityId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'entity_id'
  },
  entityName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'entity_name'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'payment_date'
  },
  paymentMode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'payment_mode'
  },
  referenceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'reference_number'
  }
}, {
  tableName: 'payments',
  timestamps: false
});

export default Payment;
