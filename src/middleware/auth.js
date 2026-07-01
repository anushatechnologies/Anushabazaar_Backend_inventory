import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';

export async function authenticateToken(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.access_token) {
      token = req.query.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // In Java, subject of the JWT is the username.
    const username = decoded.sub;
    if (!username) {
      return res.status(401).json({ message: 'Invalid token structure.' });
    }

    const user = await User.findOne({
      where: { username, status: 'ACTIVE' },
      include: [{ model: Role, attributes: ['name'] }]
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    // Attach user and roles directly to the request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
      roles: user.Roles.map(r => r.name)
    };

    next();
  } catch (error) {
    console.error('JWT Authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function authorize(allowedRoles = []) {
  // Support both array of roles or a single role string
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
}
