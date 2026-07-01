import express from 'express';
import * as saleService from '../services/saleService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import * as pdfExport from '../utils/pdfExport.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { start, end, page, size, sortBy, direction } = req.query;
    const response = await saleService.getSales(start, end, page, size, sortBy, direction);
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    return res.json(sale);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const sale = await saleService.saveSale(req.body);
    return res.json(sale);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id/cancel', authorize(['ROLE_ADMIN', 'ROLE_MANAGER']), async (req, res) => {
  try {
    const sale = await saleService.cancelSale(req.params.id);
    return res.json(sale);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authorize('ROLE_ADMIN'), async (req, res) => {
  try {
    await saleService.deleteSale(req.params.id);
    return res.status(204).end(); // ResponseEntity.noContent().build()
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=sale-${sale.invoiceNumber}.pdf`);
    pdfExport.generateSaleInvoicePDF(sale, res);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
