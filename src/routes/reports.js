import express from 'express';
import { Purchase, Sale, Supplier, Customer } from '../models/index.js';
import * as excelExport from '../utils/excelExport.js';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize(['ROLE_ADMIN', 'ROLE_MANAGER']));

router.get('/purchases/excel', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const purchases = await Purchase.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [start, end]
        }
      },
      include: [{ model: Supplier, as: 'supplier' }],
      order: [['purchaseDate', 'ASC']]
    });

    const buffer = await excelExport.purchasesToExcel(purchases);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=purchases_report_${start}_to_${end}.xlsx`);
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/sales/excel', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const sales = await Sale.findAll({
      where: {
        saleDate: {
          [Op.between]: [start, end]
        }
      },
      include: [{ model: Customer, as: 'customer' }],
      order: [['saleDate', 'ASC']]
    });

    const buffer = await excelExport.salesToExcel(sales);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${start}_to_${end}.xlsx`);
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
