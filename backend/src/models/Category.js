const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // null = system default
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#6366F1',
  },
  icon: {
    type: DataTypes.STRING(10),
    defaultValue: '📋',
  },
  type: {
    type: DataTypes.ENUM('income', 'expense', 'both'),
    defaultValue: 'expense',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

const DEFAULT_CATEGORIES = [
  { name: 'Salary', color: '#10B981', icon: '💰', type: 'income', isDefault: true },
  { name: 'Freelance', color: '#059669', icon: '💻', type: 'income', isDefault: true },
  { name: 'Investment', color: '#3B82F6', icon: '📈', type: 'income', isDefault: true },
  { name: 'Other Income', color: '#6B7280', icon: '📋', type: 'income', isDefault: true },
  { name: 'Food & Dining', color: '#F97316', icon: '🍕', type: 'expense', isDefault: true },
  { name: 'Transportation', color: '#EAB308', icon: '🚗', type: 'expense', isDefault: true },
  { name: 'Housing', color: '#EF4444', icon: '🏠', type: 'expense', isDefault: true },
  { name: 'Entertainment', color: '#8B5CF6', icon: '🎬', type: 'expense', isDefault: true },
  { name: 'Shopping', color: '#EC4899', icon: '🛍️', type: 'expense', isDefault: true },
  { name: 'Healthcare', color: '#06B6D4', icon: '⚕️', type: 'expense', isDefault: true },
  { name: 'Utilities', color: '#F59E0B', icon: '💡', type: 'expense', isDefault: true },
  { name: 'Education', color: '#6366F1', icon: '📚', type: 'expense', isDefault: true },
  { name: 'Other Expenses', color: '#6B7280', icon: '📋', type: 'expense', isDefault: true },
];

Category.seedDefaults = async () => {
  const count = await Category.count({ where: { isDefault: true, userId: null } });
  if (count === 0) {
    await Category.bulkCreate(DEFAULT_CATEGORIES.map(c => ({ ...c, userId: null })));
    console.log('[DB] Default categories seeded');
  }
};

module.exports = Category;
