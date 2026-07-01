import express from 'express';
import * as dashboardService from '../services/dashboardService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', async (req, res) => {
  try {
    const summary = await dashboardService.getSummary();
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const charts = await dashboardService.getChartsData();
    return res.json(charts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
