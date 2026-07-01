import bcrypt from 'bcryptjs';
import { User, Role } from '../models/index.js';
import { Op } from 'sequelize';

export async function getAllUsers() {
  return await User.findAll({
    include: [{ model: Role, attributes: ['name'] }]
  });
}

export async function getUserById(id) {
  const user = await User.findByPk(id, {
    include: [{ model: Role, attributes: ['name'] }]
  });
  if (!user) {
    throw new Error(`User not found with id: ${id}`);
  }
  return user;
}

export async function createUser({ username, email, password, role, status }) {
  const usernameExists = await User.findOne({ where: { username } });
  if (usernameExists) {
    throw new Error('Username is already taken');
  }

  const emailExists = await User.findOne({ where: { email } });
  if (emailExists) {
    throw new Error('Email is already in use');
  }

  if (!password) {
    throw new Error('Password is required for new users');
  }

  const roleName = parseRoleName(role);
  const roleInstance = await Role.findOne({ where: { name: roleName } });
  if (!roleInstance) {
    throw new Error(`Role not found: ${roleName}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    status: status ? status.toUpperCase() : 'ACTIVE'
  });

  await user.addRole(roleInstance);
  return await getUserById(user.id);
}

export async function updateUser(id, { email, role, status, password }) {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error(`User not found with id: ${id}`);
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      throw new Error('Email is already in use');
    }
    user.email = email;
  }

  if (status) {
    user.status = status.toUpperCase();
  }

  if (password && password.trim() !== '') {
    user.password = await bcrypt.hash(password, 10);
  }

  if (role) {
    const roleName = parseRoleName(role);
    const roleInstance = await Role.findOne({ where: { name: roleName } });
    if (!roleInstance) {
      throw new Error(`Role not found: ${roleName}`);
    }
    await user.setRoles([roleInstance]);
  }

  await user.save();
  return await getUserById(user.id);
}

export async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error(`User not found with id: ${id}`);
  }
  await user.destroy();
}

function parseRoleName(roleStr) {
  if (!roleStr) throw new Error('Role is required');
  let cleanRole = roleStr.toUpperCase();
  if (!cleanRole.startsWith('ROLE_')) {
    cleanRole = 'ROLE_' + cleanRole;
  }
  if (!['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'].includes(cleanRole)) {
    throw new Error(`Invalid role: ${roleStr}. Allowed roles: ADMIN, MANAGER, STAFF`);
  }
  return cleanRole;
}
