const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'User already exists with this email', 400);
    }

    // Create user - password will be hashed automatically by model pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Password will be hashed by model hook
      role: role || 'donor',
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token - password is already hashed, so it won't be re-hashed
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return successResponse(
      res,
      {
        user: userResponse,
        token,
        refreshToken,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    logger.error('Registration error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();

    // Find user and explicitly select password field (since it has select: false)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${normalizedEmail}`);
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check password
    if (!user.password) {
      logger.error('User found but password field is missing', { userId: user._id, email: normalizedEmail });
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Password mismatch for user: ${normalizedEmail}`);
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 'Account is inactive', 403);
    }

    // Generate tokens
    let token, refreshToken;
    try {
      token = generateToken(user._id);
      refreshToken = generateRefreshToken(user._id);
    } catch (tokenError) {
      logger.error('Token generation error:', tokenError);
      return errorResponse(res, 'Failed to generate authentication tokens', 500);
    }

    // Update last login and refresh token
    try {
      user.lastLogin = new Date();
      user.refreshToken = refreshToken;
      await user.save();
    } catch (saveError) {
      logger.error('User save error:', saveError);
      return errorResponse(res, 'Failed to update user information', 500);
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return successResponse(res, {
      user: userResponse,
      token,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    // Provide more specific error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Login failed: ${error.message}` 
      : 'Login failed. Please try again or contact support if the problem persists.';
    return errorResponse(res, errorMessage, 500);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    const { verifyRefreshToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return successResponse(res, {
      token: newToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Refresh token error:', error);
    return errorResponse(res, 'Invalid refresh token', 401);
  }
};

const logout = async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = null;
    await req.user.save();

    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    return successResponse(res, { user }, 'User retrieved successfully');
  } catch (error) {
    logger.error('Get me error:', error);
    return errorResponse(res, 'Failed to retrieve user', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return successResponse(res, { user: userResponse }, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    // Set new password - will be hashed automatically by model pre-save hook
    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    logger.error('Change password error:', error);
    return errorResponse(res, 'Failed to change password', 500);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
};

