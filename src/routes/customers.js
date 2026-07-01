import express from 'express';
import * as customerService from '../services/customerService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { search, page, size, sortBy, direction } = req.query;
    const response = await customerService.getCustomers(search, page, size, sortBy, direction);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return res.json(customer);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    return res.json(customer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return res.json(customer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authorize('ROLE_ADMIN'), async (req, res) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    return res.json({ message: 'Customer deleted successfully!' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/:id/ledger', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const ledger = await customerService.getCustomerLedger(req.params.id);
    return res.json(ledger);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
