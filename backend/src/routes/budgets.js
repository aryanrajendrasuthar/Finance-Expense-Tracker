const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { Budget, Category, Transaction } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get budget summary for a month including spending
const enrichBudgets = async (userId, month) => {
  const budgets = await Budget.findAll({
    where: { userId, month },
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
  });

  const { sequelize } = require('../models');
  const enriched = await Promise.all(budgets.map(async (b) => {
    const [result] = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as spent
       FROM transactions
       WHERE "userId" = :userId AND "categoryId" = :categoryId
         AND type = 'expense'
         AND TO_CHAR(date, 'YYYY-MM') = :month`,
      { replacements: { userId, categoryId: b.categoryId, month }, type: 'SELECT' }
    );
    const spent = parseFloat(result.spent);
    const limit = parseFloat(b.limit);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      ...b.toJSON(),
      spent,
      percentage: Math.min(Math.round(pct), 100),
      alert: pct >= 80,
      exceeded: pct >= 100,
    };
  }));

  return enriched;
};

// GET /api/budgets?month=YYYY-MM
router.get('/', authenticate, async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  try {
    const budgets = await enrichBudgets(req.user.id, month);
    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/budgets
router.post('/', authenticate, [
  body('categoryId').isUUID(),
  body('limit').isFloat({ min: 0.01 }),
  body('month').matches(/^\d{4}-\d{2}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { categoryId, limit, month } = req.body;
  try {
    const existing = await Budget.findOne({ where: { userId: req.user.id, categoryId, month } });
    if (existing) return res.status(409).json({ error: 'Budget for this category and month already exists' });

    const budget = await Budget.create({ userId: req.user.id, categoryId, limit, month });
    const enriched = await enrichBudgets(req.user.id, month);
    const fresh = enriched.find(b => b.id === budget.id);
    res.status(201).json(fresh || budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/budgets/:id
router.put('/:id', authenticate, [
  body('limit').optional().isFloat({ min: 0.01 }),
  body('month').optional().matches(/^\d{4}-\d{2}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });

    const { limit, month } = req.body;
    await budget.update({ ...(limit && { limit }), ...(month && { month }) });

    const effectiveMonth = month || budget.month;
    const enriched = await enrichBudgets(req.user.id, effectiveMonth);
    const updated = enriched.find(b => b.id === budget.id);
    res.json(updated || budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    await budget.destroy();
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
