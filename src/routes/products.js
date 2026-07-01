import express from 'express';
import * as productService from '../services/productService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { search, page, size, sortBy, direction } = req.query;
    const response = await productService.getProducts(search, page, size, sortBy, direction);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/low-stock', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const products = await productService.getLowStockProducts();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.json(product);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authorize('ROLE_ADMIN'), async (req, res) => {
  try {
    const response = await productService.deleteProduct(req.params.id);
    return res.json(response);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
