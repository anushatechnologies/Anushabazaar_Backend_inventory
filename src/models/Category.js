import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: false
});

export default Category;
