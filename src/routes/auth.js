import express from 'express';
import * as authService from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const response = await authService.authenticateUser(username, password);
    return res.json(response);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  return res.json(req.user);
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }
    await authService.changePassword(req.user.username, oldPassword, newPassword);
    return res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }
    await authService.forgotPassword(username, email);
    return res.json({ message: "If account details match, password has been reset to default 'Password@123'" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
