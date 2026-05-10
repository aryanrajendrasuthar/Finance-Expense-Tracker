const router = require('express').Router();
const { Op, literal } = require('sequelize');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');
const { Readable } = require('stream');
const { Transaction, Category, Budget } = require('../models');
const { authenticate } = require('../middleware/auth');
const { cacheDelPattern } = require('../config/redis');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Invalidate Redis stats cache for user
const invalidateStatsCache = (userId) => cacheDelPattern(`stats:${userId}:*`);

// Check budget alert for category in given month
const checkBudgetAlert = async (userId, categoryId, month) => {
  if (!categoryId) return null;
  const budget = await Budget.findOne({ where: { userId, categoryId, month } });
  if (!budget) return null;

  const { sequelize } = require('../models');
  const [result] = await sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) as spent
     FROM transactions
     WHERE "userId" = :userId AND "categoryId" = :categoryId
       AND type = 'expense'
       AND DATE_TRUNC('month', date::timestamp) = DATE_TRUNC('month', :month::timestamp)`,
    { replacements: { userId, categoryId, month: `${month}-01` }, type: 'SELECT' }
  );

  const spent = parseFloat(result.spent);
  const limit = parseFloat(budget.limit);
  const pct = limit > 0 ? (spent / limit) * 100 : 0;

  return {
    categoryId,
    budgetLimit: limit,
    spent,
    percentage: Math.round(pct),
    alert: pct >= 80,
    exceeded: pct >= 100,
  };
};

// GET /api/transactions
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense']),
  query('categoryId').optional().isUUID(),
  query('startDate').optional().isDate(),
  query('endDate').optional().isDate(),
  query('sortBy').optional().isIn(['date', 'amount', 'createdAt']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    page = 1, limit = 20,
    type, categoryId,
    startDate, endDate,
    search,
    sortBy = 'date', sortOrder = 'DESC',
  } = req.query;

  const where = { userId: req.user.id };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }
  if (search) {
    where.description = { [Op.iLike]: `%${search}%` };
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon', 'type'] }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      transactions: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transactions
router.post('/', authenticate, [
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['income', 'expense']),
  body('date').isDate(),
  body('categoryId').optional().isUUID(),
  body('description').optional().isLength({ max: 500 }),
  body('isRecurring').optional().isBoolean(),
  body('recurringInterval').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { amount, type, date, categoryId, description, isRecurring, recurringInterval } = req.body;

  try {
    const transaction = await Transaction.create({
      userId: req.user.id, amount, type, date,
      categoryId: categoryId || null, description: description || '',
      isRecurring: isRecurring || false,
      recurringInterval: isRecurring ? recurringInterval : null,
    });

    await invalidateStatsCache(req.user.id);

    const month = date.slice(0, 7);
    const budgetAlert = type === 'expense'
      ? await checkBudgetAlert(req.user.id, categoryId, month)
      : null;

    const full = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon', 'type'] }],
    });

    res.status(201).json({ transaction: full, budgetAlert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', authenticate, [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('type').optional().isIn(['income', 'expense']),
  body('date').optional().isDate(),
  body('categoryId').optional().isUUID(),
  body('description').optional().isLength({ max: 500 }),
  body('isRecurring').optional().isBoolean(),
  body('recurringInterval').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    const { amount, type, date, categoryId, description, isRecurring, recurringInterval } = req.body;
    await transaction.update({
      ...(amount !== undefined && { amount }),
      ...(type !== undefined && { type }),
      ...(date !== undefined && { date }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(description !== undefined && { description }),
      ...(isRecurring !== undefined && { isRecurring }),
      recurringInterval: isRecurring ? recurringInterval : null,
    });

    await invalidateStatsCache(req.user.id);

    const full = await Transaction.findByPk(transaction.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon', 'type'] }],
    });

    const effectiveDate = date || transaction.date;
    const effectiveType = type || transaction.type;
    const effectiveCategory = categoryId !== undefined ? categoryId : transaction.categoryId;
    const month = String(effectiveDate).slice(0, 7);
    const budgetAlert = effectiveType === 'expense'
      ? await checkBudgetAlert(req.user.id, effectiveCategory, month)
      : null;

    res.json({ transaction: full, budgetAlert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    await transaction.destroy();
    await invalidateStatsCache(req.user.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/transactions/export — CSV download
router.get('/export', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      order: [['date', 'DESC']],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');

    const columns = ['Date', 'Amount', 'Type', 'Category', 'Description', 'Recurring', 'RecurringInterval'];
    const stringifier = stringify({ header: true, columns });
    stringifier.pipe(res);

    for (const t of transactions) {
      stringifier.write({
        Date: t.date,
        Amount: parseFloat(t.amount).toFixed(2),
        Type: t.type,
        Category: t.category?.name || '',
        Description: t.description,
        Recurring: t.isRecurring ? 'true' : 'false',
        RecurringInterval: t.recurringInterval || '',
      });
    }
    stringifier.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transactions/import — CSV upload
router.post('/import', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { Op } = require('sequelize');
  const categories = await Category.findAll({
    where: {
      [Op.or]: [{ userId: req.user.id }, { userId: null, isDefault: true }],
    },
  });
  const categoryMap = {};
  categories.forEach(c => { categoryMap[c.name.toLowerCase()] = c.id; });

  const rows = [];
  const errors = [];

  const stream = Readable.from(req.file.buffer.toString());
  await new Promise((resolve) => {
    stream
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', (err) => { errors.push(err.message); resolve(); });
  });

  const toCreate = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const date = row.Date || row.date;
    const amount = parseFloat(row.Amount || row.amount);
    const type = (row.Type || row.type || '').toLowerCase();
    const categoryName = (row.Category || row.category || '').trim().toLowerCase();
    const description = row.Description || row.description || '';
    const isRecurring = (row.Recurring || row.recurring || 'false').toLowerCase() === 'true';
    const recurringInterval = (row.RecurringInterval || row.recurringInterval || '').toLowerCase() || null;

    if (!date || isNaN(amount) || !['income', 'expense'].includes(type)) {
      errors.push(`Row ${i + 2}: invalid data (date=${date}, amount=${amount}, type=${type})`);
      continue;
    }

    toCreate.push({
      userId: req.user.id,
      date,
      amount,
      type,
      categoryId: categoryMap[categoryName] || null,
      description,
      isRecurring,
      recurringInterval: isRecurring && ['daily', 'weekly', 'monthly', 'yearly'].includes(recurringInterval)
        ? recurringInterval : null,
    });
  }

  if (toCreate.length > 0) {
    await Transaction.bulkCreate(toCreate);
    await invalidateStatsCache(req.user.id);
  }

  res.json({ imported: toCreate.length, skipped: errors.length, errors });
});

module.exports = router;
