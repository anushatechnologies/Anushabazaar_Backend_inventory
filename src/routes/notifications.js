import express from 'express';
import * as notificationService from '../services/notificationService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const notifications = await notificationService.getUnreadNotifications();
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const notifications = await notificationService.getAllNotifications();
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount();
    return res.json(count); // In Java, returns raw integer/long, in Node res.json(count) sends it as raw JSON number or we can wrap it. The Java returned raw long. res.json(count) is perfect.
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await notificationService.markAllAsRead();
    return res.json({ message: 'All notifications marked as read!' });
  } catch (error) {
    return res.status(550).json({ message: error.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    return res.json(notification);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
