const router = require('express').Router();
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Category } = require('../models');
const { authenticate } = require('../middleware/auth');

// GET /api/categories — return user's categories + system defaults
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: {
        [Op.or]: [{ userId: req.user.id }, { userId: null, isDefault: true }],
      },
      order: [['type', 'ASC'], ['name', 'ASC']],
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/categories
router.post('/', authenticate, [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('color').optional().isHexColor(),
  body('icon').optional().isLength({ max: 10 }),
  body('type').isIn(['income', 'expense', 'both']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, color, icon, type } = req.body;
  try {
    const category = await Category.create({
      userId: req.user.id, name, color, icon, type, isDefault: false,
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/categories/:id
router.put('/:id', authenticate, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('color').optional().isHexColor(),
  body('icon').optional().isLength({ max: 10 }),
  body('type').optional().isIn(['income', 'expense', 'both']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const { name, color, icon, type } = req.body;
    await category.update({ name, color, icon, type });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
