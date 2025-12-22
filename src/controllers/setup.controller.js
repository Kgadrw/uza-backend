const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Initialize admin user - only works if no admin exists
 * This endpoint allows creating the first admin user without authentication
 */
const initializeAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return errorResponse(res, 'Admin user already exists. Please use login instead.', 400);
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already taken
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Create admin user - password will be hashed automatically by model pre-save hook
    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Will be hashed by model hook
      role: 'admin',
      isActive: true,
    });

    logger.info(`Admin user created: ${normalizedEmail}`);

    // Remove password from response
    const userResponse = admin.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return successResponse(
      res,
      {
        user: userResponse,
        message: 'Admin user created successfully. You can now login.',
      },
      'Admin initialized successfully',
      201
    );
  } catch (error) {
    logger.error('Setup error:', error);
    return errorResponse(res, 'Failed to initialize admin user', 500);
  }
};

/**
 * Check if admin user exists
 */
const checkAdminExists = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    return successResponse(res, {
      adminExists: !!adminExists,
      message: adminExists 
        ? 'Admin user exists. Please use login.' 
        : 'No admin user found. You can initialize one.',
    }, 'Admin status checked');
  } catch (error) {
    logger.error('Check admin error:', error);
    return errorResponse(res, 'Failed to check admin status', 500);
  }
};

module.exports = {
  initializeAdmin,
  checkAdminExists,
};

