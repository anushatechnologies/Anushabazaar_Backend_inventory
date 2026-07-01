import express from 'express';
import * as purchaseService from '../services/purchaseService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import * as pdfExport from '../utils/pdfExport.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { start, end, page, size, sortBy, direction } = req.query;
    const response = await purchaseService.getPurchases(start, end, page, size, sortBy, direction);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id);
    return res.json(purchase);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const purchase = await purchaseService.savePurchase(req.body);
    return res.json(purchase);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id/cancel', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const purchase = await purchaseService.cancelPurchase(req.params.id);
    return res.json(purchase);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authorize('ROLE_ADMIN'), async (req, res) => {
  try {
    await purchaseService.deletePurchase(req.params.id);
    return res.status(204).build(); // ResponseEntity.noContent().build()
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=purchase-${purchase.purchaseNumber}.pdf`);
    pdfExport.generatePurchaseInvoicePDF(purchase, res);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
