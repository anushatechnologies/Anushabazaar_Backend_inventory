import express from 'express';
import * as categoryService from '../services/categoryService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return res.json(category);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return res.json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return res.json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authorize('ROLE_ADMIN'), async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return res.json({ message: 'Category deleted successfully!' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
