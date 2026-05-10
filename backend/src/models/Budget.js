const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  limit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 },
  },
  month: {
    type: DataTypes.STRING(7), // YYYY-MM
    allowNull: false,
  },
}, {
  tableName: 'budgets',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'categoryId', 'month'] },
  ],
});

module.exports = Budget;
