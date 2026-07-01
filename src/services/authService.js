import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';

export async function authenticateUser(username, password) {
  const user = await User.findOne({
    where: { username, status: 'ACTIVE' },
    include: [{ model: Role, attributes: ['name'] }]
  });

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid username or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { sub: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );

  return {
    accessToken: token,
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.Roles.map(r => r.name)
  };
}

export async function changePassword(username, oldPassword, newPassword) {
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('User not found');
  }

  const isOldValid = await bcrypt.compare(oldPassword, user.password);
  if (!isOldValid) {
    throw new Error('Invalid old password');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
}

export async function forgotPassword(username, email) {
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Email address does not match our records');
  }

  // Reset to default
  user.password = await bcrypt.hash('Password@123', 10);
  await user.save();
}
