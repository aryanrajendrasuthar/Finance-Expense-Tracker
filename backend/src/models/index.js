const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Transaction = require('./Transaction');
const Budget = require('./Budget');

// Associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Category, { foreignKey: 'userId', as: 'categories', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions', onDelete: 'SET NULL' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Budget, { foreignKey: 'categoryId', as: 'budgets', onDelete: 'CASCADE' });
Budget.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

const seedDatabase = async () => {
  await Category.seedDefaults();
};

module.exports = { sequelize, seedDatabase, User, Category, Transaction, Budget };
