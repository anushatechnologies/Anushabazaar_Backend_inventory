import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  }
}, {
  tableName: 'roles',
  timestamps: false
});

export default Role;
