const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fitshoes-dev-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    gender: user.gender || '',
    address: user.address || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
    role: user.role || 'user',
    canAccessAdmin: !!user.canAccessAdmin
  };
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role || 'user',
      canAccessAdmin: !!user.canAccessAdmin
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authenticateJWT(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'user',
      canAccessAdmin: !!payload.canAccessAdmin
    };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

async function hydrateRequestUser(req, res) {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  if (!isValidObjectId(req.user.id)) {
    res.status(401).json({ success: false, message: 'Invalid token subject' });
    return null;
  }

  try {
    const user = await User.findById(req.user.id).select('role canAccessAdmin email');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return null;
    }

    req.user.role = user.role || 'user';
    req.user.canAccessAdmin = !!user.canAccessAdmin;
    req.user.email = user.email || req.user.email;
    return user;
  } catch (err) {
    res.status(500).json({ success: false, message: 'Authorization check failed' });
    return null;
  }
}

async function requireAdminRole(req, res, next) {
  const user = await hydrateRequestUser(req, res);
  if (!user) return;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin role required' });
  }
  return next();
}

async function requireAdminAccess(req, res, next) {
  const user = await hydrateRequestUser(req, res);
  if (!user) return;
  if (req.user.role !== 'admin' && !req.user.canAccessAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
}

module.exports = {
  normalizeEmail,
  isValidObjectId,
  sanitizeUser,
  createAccessToken,
  authenticateJWT,
  requireAdminRole,
  requireAdminAccess
};
