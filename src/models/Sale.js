import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'invoice_number'
  },
  saleDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'sale_date'
  },
  customerId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'customer_id'
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
  transportCharges: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'transport_charges'
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
  },
  vehicleNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'vehicle_number'
  },
  driverName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'driver_name'
  },
  driverNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'driver_number'
  }
}, {
  tableName: 'sales',
  timestamps: false
});

export default Sale;
