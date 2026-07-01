import express from 'express';
import * as stockService from '../services/stockService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/adjust', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }
    const product = await stockService.adjustStock(productId, quantity, notes);
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/movements', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const movements = await stockService.getAllMovements();
    return res.json(movements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/movements/product/:productId', async (req, res) => {
  try {
    const movements = await stockService.getMovementsByProduct(req.params.productId);
    return res.json(movements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
