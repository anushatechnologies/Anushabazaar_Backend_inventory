import express from 'express';
import * as supplierService from '../services/supplierService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { search, page, size, sortBy, direction } = req.query;
    const response = await supplierService.getSuppliers(search, page, size, sortBy, direction);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const suppliers = await supplierService.getAllSuppliers();
    return res.json(suppliers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return res.json(supplier);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    return res.json(supplier);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    return res.json(supplier);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authorize('ROLE_ADMIN'), async (req, res) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    return res.json({ message: 'Supplier deleted successfully!' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/:id/ledger', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const ledger = await supplierService.getSupplierLedger(req.params.id);
    return res.json(ledger);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
