const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { cacheGet, cacheSet } = require('../config/redis');

const { sequelize } = require('../models');

// GET /api/stats/overview
router.get('/overview', authenticate, async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `stats:${userId}:overview`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [rows] = await sequelize.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS "totalIncome",
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS "totalExpenses"
       FROM transactions WHERE "userId" = :userId`,
      { replacements: { userId }, type: 'SELECT' }
    );

    const totalIncome = parseFloat(rows.totalIncome);
    const totalExpenses = parseFloat(rows.totalExpenses);
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;

    const data = { totalIncome, totalExpenses, netBalance, savingsRate: parseFloat(savingsRate) };
    await cacheSet(cacheKey, data, 600);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/monthly?year=YYYY
router.get('/monthly', authenticate, async (req, res) => {
  const userId = req.user.id;
  const year = req.query.year || new Date().getFullYear();
  const cacheKey = `stats:${userId}:monthly:${year}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const rows = await sequelize.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM') AS month,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE "userId" = :userId AND EXTRACT(YEAR FROM date) = :year
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month ASC`,
      { replacements: { userId, year }, type: 'SELECT' }
    );

    // Fill in missing months with 0
    const monthsMap = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      monthsMap[key] = { month: key, income: 0, expenses: 0 };
    }
    rows[0].forEach(r => {
      monthsMap[r.month] = {
        month: r.month,
        income: parseFloat(r.income),
        expenses: parseFloat(r.expenses),
      };
    });

    const data = Object.values(monthsMap);
    await cacheSet(cacheKey, data, 600);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/categories?month=YYYY-MM&type=expense
router.get('/categories', authenticate, async (req, res) => {
  const userId = req.user.id;
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const type = req.query.type || 'expense';
  const cacheKey = `stats:${userId}:categories:${month}:${type}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const rows = await sequelize.query(
      `SELECT
         c.id AS "categoryId",
         c.name,
         c.color,
         c.icon,
         COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN categories c ON t."categoryId" = c.id
       WHERE t."userId" = :userId
         AND t.type = :type
         AND TO_CHAR(t.date, 'YYYY-MM') = :month
       GROUP BY c.id, c.name, c.color, c.icon
       ORDER BY total DESC`,
      { replacements: { userId, type, month }, type: 'SELECT' }
    );

    const data = rows[0].map(r => ({
      ...r,
      total: parseFloat(r.total),
    }));

    await cacheSet(cacheKey, data, 600);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
