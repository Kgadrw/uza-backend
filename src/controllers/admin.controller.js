const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Simple admin credentials - can be moved to environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uzaempower.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Simple admin login - no password hashing, no database check
 * Just validates credentials and returns success
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Simple credential check - no hashing, no database
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Return admin user object
      const adminUser = {
        _id: 'admin',
        name: 'Admin User',
        email: ADMIN_EMAIL,
        role: 'admin',
        isActive: true,
      };

      return successResponse(res, {
        user: adminUser,
        token: 'admin-token', // Simple token for admin
        message: 'Admin login successful',
      }, 'Admin login successful');
    }

    return errorResponse(res, 'Invalid admin credentials', 401);
  } catch (error) {
    logger.error('Admin login error:', error);
    return errorResponse(res, 'Admin login failed', 500);
  }
};

// Simple admin authentication middleware - just checks if it's admin
const simpleAdminAuth = (req, res, next) => {
  try {
    // Check for admin token in header or query
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (token === 'admin-token') {
      // Set admin user
      req.user = {
        _id: 'admin',
        name: 'Admin User',
        email: ADMIN_EMAIL,
        role: 'admin',
        isActive: true,
      };
      return next();
    }

    // Also check if credentials are provided directly (for simple access)
    const { email, password } = req.body || req.query;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      req.user = {
        _id: 'admin',
        name: 'Admin User',
        email: ADMIN_EMAIL,
        role: 'admin',
        isActive: true,
      };
      return next();
    }

    return errorResponse(res, 'Admin authentication required', 401);
  } catch (error) {
    logger.error('Admin auth error:', error);
    return errorResponse(res, 'Admin authentication failed', 500);
  }
};

// Admin controller functions - simple implementations
const getDashboard = async (req, res) => {
  try {
    return successResponse(res, { 
      summaryData: {
        totalProjects: 0,
        pendingReview: 0,
        activeProjects: 0,
        totalFunds: 0,
        totalDisbursed: 0,
        pendingTranches: 0,
        alertsCount: 0,
        kycPending: 0
      }, 
      recentProjects: [] 
    }, 'Dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return errorResponse(res, 'Failed to retrieve dashboard data', 500);
  }
};

const getProjects = async (req, res) => {
  try {
    return successResponse(res, { projects: [] }, 'Projects retrieved successfully');
  } catch (error) {
    logger.error('Get projects error:', error);
    return errorResponse(res, 'Failed to retrieve projects', 500);
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    return successResponse(res, {}, 'Project status updated successfully');
  } catch (error) {
    logger.error('Update project status error:', error);
    return errorResponse(res, 'Failed to update project status', 500);
  }
};

const getMilestones = async (req, res) => {
  try {
    return successResponse(res, { milestones: [] }, 'Milestones retrieved successfully');
  } catch (error) {
    logger.error('Get milestones error:', error);
    return errorResponse(res, 'Failed to retrieve milestones', 500);
  }
};

// Pending milestones handler
getMilestones.pending = async (req, res) => {
  try {
    return successResponse(res, { milestones: [] }, 'Pending milestones retrieved successfully');
  } catch (error) {
    logger.error('Get pending milestones error:', error);
    return errorResponse(res, 'Failed to retrieve pending milestones', 500);
  }
};

const approveMilestone = async (req, res) => {
  try {
    return successResponse(res, {}, 'Milestone approved successfully');
  } catch (error) {
    logger.error('Approve milestone error:', error);
    return errorResponse(res, 'Failed to approve milestone', 500);
  }
};

const rejectMilestone = async (req, res) => {
  try {
    return successResponse(res, {}, 'Milestone rejected successfully');
  } catch (error) {
    logger.error('Reject milestone error:', error);
    return errorResponse(res, 'Failed to reject milestone', 500);
  }
};

const getKYC = async (req, res) => {
  try {
    return successResponse(res, { kyc: [] }, 'KYC retrieved successfully');
  } catch (error) {
    logger.error('Get KYC error:', error);
    return errorResponse(res, 'Failed to retrieve KYC', 500);
  }
};

// Pending KYC handler
getKYC.pending = async (req, res) => {
  try {
    return successResponse(res, { kyc: [] }, 'Pending KYC retrieved successfully');
  } catch (error) {
    logger.error('Get pending KYC error:', error);
    return errorResponse(res, 'Failed to retrieve pending KYC', 500);
  }
};

const approveKYC = async (req, res) => {
  try {
    return successResponse(res, {}, 'KYC approved successfully');
  } catch (error) {
    logger.error('Approve KYC error:', error);
    return errorResponse(res, 'Failed to approve KYC', 500);
  }
};

const rejectKYC = async (req, res) => {
  try {
    return successResponse(res, {}, 'KYC rejected successfully');
  } catch (error) {
    logger.error('Reject KYC error:', error);
    return errorResponse(res, 'Failed to reject KYC', 500);
  }
};

const getReports = async (req, res) => {
  try {
    return successResponse(res, { reports: [] }, 'Reports retrieved successfully');
  } catch (error) {
    logger.error('Get reports error:', error);
    return errorResponse(res, 'Failed to retrieve reports', 500);
  }
};

// Report handlers
getReports.userRegistration = async (req, res) => {
  try {
    return successResponse(res, { data: [] }, 'User registration report retrieved successfully');
  } catch (error) {
    logger.error('Get user registration report error:', error);
    return errorResponse(res, 'Failed to retrieve user registration report', 500);
  }
};

getReports.fundingDistribution = async (req, res) => {
  try {
    return successResponse(res, { data: [] }, 'Funding distribution report retrieved successfully');
  } catch (error) {
    logger.error('Get funding distribution report error:', error);
    return errorResponse(res, 'Failed to retrieve funding distribution report', 500);
  }
};

getReports.projectStatus = async (req, res) => {
  try {
    return successResponse(res, { data: [] }, 'Project status report retrieved successfully');
  } catch (error) {
    logger.error('Get project status report error:', error);
    return errorResponse(res, 'Failed to retrieve project status report', 500);
  }
};

getReports.topDonors = async (req, res) => {
  try {
    return successResponse(res, { data: [] }, 'Top donors report retrieved successfully');
  } catch (error) {
    logger.error('Get top donors report error:', error);
    return errorResponse(res, 'Failed to retrieve top donors report', 500);
  }
};

module.exports = {
  adminLogin,
  simpleAdminAuth,
  getDashboard,
  getProjects,
  updateProjectStatus,
  getMilestones,
  approveMilestone,
  rejectMilestone,
  getKYC,
  approveKYC,
  rejectKYC,
  getReports,
};
