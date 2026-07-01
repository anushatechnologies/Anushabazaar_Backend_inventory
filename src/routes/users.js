import express from 'express';
import * as userService from '../services/userService.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware on all routes
router.use(authenticateToken);
router.use(authorize('ROLE_ADMIN'));

router.get('/', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.json(user);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(210).json(user); // Wait, standard 201 Created or 200 is fine, let's use 200 as Java returned ResponseEntity.ok()
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    return res.json({ message: 'User deleted successfully!' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
