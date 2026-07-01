import express from 'express';
import * as accountsService from '../services/accountsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/payments', async (req, res) => {
  try {
    const payments = await accountsService.getAllPayments();
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/payments/:type/:entityId', async (req, res) => {
  try {
    const payments = await accountsService.getPaymentsByEntity(req.params.type, req.params.entityId);
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/collect', async (req, res) => {
  try {
    const payment = await accountsService.recordCustomerCollection(req.body);
    return res.json(payment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/pay', async (req, res) => {
  try {
    const payment = await accountsService.recordSupplierPayout(req.body);
    return res.json(payment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
