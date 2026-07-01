import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mobile: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gst: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  outstandingBalance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'outstanding_balance'
  }
}, {
  tableName: 'suppliers',
  timestamps: false
});

export default Supplier;
