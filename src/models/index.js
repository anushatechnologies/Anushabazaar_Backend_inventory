import sequelize from '../config/database.js';
import Category from './Category.js';
import Customer from './Customer.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import Product from './Product.js';
import Purchase from './Purchase.js';
import PurchaseItem from './PurchaseItem.js';
import Role from './Role.js';
import Sale from './Sale.js';
import SaleItem from './SaleItem.js';
import StockMovement from './StockMovement.js';
import Supplier from './Supplier.js';
import User from './User.js';

// Associations

// User <-> Role (Many-to-Many)
User.belongsToMany(Role, { 
  through: 'user_roles', 
  foreignKey: 'user_id', 
  otherKey: 'role_id', 
  timestamps: false 
});
Role.belongsToMany(User, { 
  through: 'user_roles', 
  foreignKey: 'role_id', 
  otherKey: 'user_id', 
  timestamps: false 
});

// Product <-> Category (Many-to-One)
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

// Purchase <-> Supplier (Many-to-One)
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Purchase, { foreignKey: 'supplier_id', as: 'purchases' });

// PurchaseItem <-> Purchase (Many-to-One)
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id', as: 'purchaseItems', onDelete: 'CASCADE' });

// PurchaseItem <-> Product (Many-to-One)
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PurchaseItem, { foreignKey: 'product_id', as: 'purchaseItems' });

// Sale <-> Customer (Many-to-One)
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });

// SaleItem <-> Sale (Many-to-One)
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'saleItems', onDelete: 'CASCADE' });

// SaleItem <-> Product (Many-to-One)
SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(SaleItem, { foreignKey: 'product_id', as: 'saleItems' });

// StockMovement <-> Product (Many-to-One)
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'stockMovements' });

export {
  sequelize,
  Category,
  Customer,
  Notification,
  Payment,
  Product,
  Purchase,
  PurchaseItem,
  Role,
  Sale,
  SaleItem,
  StockMovement,
  Supplier,
  User
};
