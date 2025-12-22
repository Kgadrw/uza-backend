const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Simple admin token check - no JWT verification needed
    if (token === 'admin-token') {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uzaempower.com';
      req.user = {
        _id: 'admin',
        name: 'Admin User',
        email: ADMIN_EMAIL,
        role: 'admin',
        isActive: true,
      };
      return next();
    }

    // Regular user JWT verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return errorResponse(res, 'User not found', 401);
      }

      if (!user.isActive) {
        return errorResponse(res, 'User account is inactive', 403);
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expired', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        return errorResponse(res, 'Invalid token', 401);
      }
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return errorResponse(res, 'Authentication failed', 500);
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};

