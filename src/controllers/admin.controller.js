const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Alert = require('../models/Alert');
const KYC = require('../models/KYC');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Pledge = require('../models/Pledge');

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

// Admin controller functions - fetch real data from database
const getDashboard = async (req, res) => {
  try {
    // Get all projects
    const allProjects = await Project.find().populate('beneficiary', 'name email');
    const totalProjects = allProjects.length;
    const pendingReview = allProjects.filter(p => p.status === 'pending').length;
    const activeProjects = allProjects.filter(p => p.status === 'active').length;
    const totalFunds = allProjects.reduce((sum, p) => sum + (p.fundingGoal || 0), 0);
    const totalDisbursed = allProjects.reduce((sum, p) => sum + (p.totalDisbursed || 0), 0);

    // Get pending milestones (evidence submitted)
    const pendingMilestones = await Milestone.find({ status: 'evidence_submitted' });
    const pendingTranches = pendingMilestones.length;

    // Get active alerts
    const activeAlerts = await Alert.find({ status: 'Active' });
    const alertsCount = activeAlerts.length;

    // Get pending KYC
    const pendingKYC = await KYC.find({ status: 'pending' });
    const kycPending = pendingKYC.length;

    // Get recent projects (last 10)
    const recentProjects = await Project.find()
      .populate('beneficiary', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title beneficiary status fundingGoal totalFunded category location');

    return successResponse(res, { 
      summaryData: {
      totalProjects,
      pendingReview,
      activeProjects,
      totalFunds,
      totalDisbursed,
      pendingTranches,
      alertsCount,
        kycPending
      }, 
      recentProjects 
    }, 'Dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return errorResponse(res, 'Failed to retrieve dashboard data', 500);
  }
};

const getProjects = async (req, res) => {
  try {
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, status, category } = req.query;

    const query = {};
    if (status && status !== 'all') {
      // Map frontend status to database status
      const statusMap = {
        'Pending Review': 'pending',
        'Active': 'active',
        'At Risk': 'paused',
        'Completed': 'completed',
        'Cancelled': 'cancelled'
      };
      query.status = statusMap[status] || status;
    }
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('beneficiary', 'name email phone')
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Format projects for frontend
    const formattedProjects = projects.map(p => ({
      id: p._id,
      title: p.title,
      beneficiary: p.beneficiary?.name || 'Unknown',
      location: p.location,
      status: p.status === 'pending' ? 'Pending Review' : 
              p.status === 'active' ? 'Active' :
              p.status === 'paused' ? 'At Risk' :
              p.status === 'completed' ? 'Completed' : 'Cancelled',
      requestedAmount: p.fundingGoal,
      totalFunded: p.totalFunded,
      category: p.category,
      kycStatus: 'Verified' // TODO: Get actual KYC status from user
    }));

    const total = await Project.countDocuments(query);

    return paginatedResponse(
      res,
      formattedProjects,
      getPaginationMeta(page, limit, total),
      'Projects retrieved successfully'
    );
  } catch (error) {
    logger.error('Get projects error:', error);
    return errorResponse(res, 'Failed to retrieve projects', 500);
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const validStatuses = ['pending', 'active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    return successResponse(res, { project }, 'Project status updated successfully');
  } catch (error) {
    logger.error('Update project status error:', error);
    return errorResponse(res, 'Failed to update project status', 500);
  }
};

const getMilestones = async (req, res) => {
    try {
      const { page, limit, skip, sort } = getPaginationParams(req);

    const milestones = await Milestone.find()
        .populate('project', 'title beneficiary')
      .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Format milestones for frontend
    const formattedMilestones = milestones.map(m => ({
      id: m._id,
      _id: m._id,
      milestone: m.title,
      title: m.title,
      project: m.project ? {
        _id: m.project._id,
        title: m.project.title || 'Unknown Project'
      } : null,
      projectId: m.project?._id || m.project || null,
      status: m.status === 'evidence_submitted' ? 'Evidence Submitted' :
             m.status === 'approved' ? 'Approved' :
             m.status === 'rejected' ? 'Rejected' :
             m.status === 'in_progress' ? 'In Progress' : 'Not Started',
      submittedDate: m.completedDate || m.createdAt,
      targetDate: m.targetDate,
      evidenceCount: m.evidence?.length || 0,
      trancheAmount: m.trancheAmount
    }));

    const total = await Milestone.countDocuments();

      return paginatedResponse(
        res,
      formattedMilestones,
        getPaginationMeta(page, limit, total),
      'Milestones retrieved successfully'
    );
  } catch (error) {
    logger.error('Get milestones error:', error);
    return errorResponse(res, 'Failed to retrieve milestones', 500);
  }
};

// Pending milestones handler
getMilestones.pending = async (req, res) => {
  try {
    const milestones = await Milestone.find({ status: 'evidence_submitted' })
      .populate('project', 'title beneficiary')
      .sort({ createdAt: -1 });

    // Format milestones for frontend
    const formattedMilestones = milestones.map(m => ({
      id: m._id,
      milestone: m.title,
      project: m.project?.title || 'Unknown Project',
      projectId: m.project?._id || null,
      status: 'Evidence Submitted',
      submittedDate: m.completedDate || m.createdAt,
      targetDate: m.targetDate,
      evidenceCount: m.evidence?.length || 0,
      trancheAmount: m.trancheAmount
    }));

    return successResponse(res, { milestones: formattedMilestones }, 'Pending milestones retrieved successfully');
    } catch (error) {
      logger.error('Get pending milestones error:', error);
    return errorResponse(res, 'Failed to retrieve pending milestones', 500);
    }
};

const approveMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestone = await Milestone.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        completedDate: new Date()
      },
      { new: true, runValidators: true }
    ).populate('project');

    if (!milestone) {
      return errorResponse(res, 'Milestone not found', 404);
    }

    // Update project totalDisbursed
    if (milestone.project) {
      await Project.findByIdAndUpdate(
        milestone.project._id,
        { $inc: { totalDisbursed: milestone.trancheAmount } }
      );
    }

    return successResponse(res, { milestone }, 'Milestone approved successfully');
  } catch (error) {
    logger.error('Approve milestone error:', error);
    return errorResponse(res, 'Failed to approve milestone', 500);
  }
};

const rejectMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const milestone = await Milestone.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectionReason: reason || 'Rejected by admin'
      },
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return errorResponse(res, 'Milestone not found', 404);
    }

    return successResponse(res, { milestone }, 'Milestone rejected successfully');
  } catch (error) {
    logger.error('Reject milestone error:', error);
    return errorResponse(res, 'Failed to reject milestone', 500);
  }
};

const getKYC = async (req, res) => {
    try {
      const { page, limit, skip, sort } = getPaginationParams(req);

    const kycs = await KYC.find()
        .populate('user', 'name email')
      .populate('reviewedBy', 'name email')
      .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Format KYC for frontend
    const formattedKYC = kycs.map(k => ({
      id: k._id,
      name: k.user?.name || 'Unknown',
      email: k.user?.email || '',
      status: k.status === 'pending' ? 'Pending' :
              k.status === 'approved' ? 'Approved' : 'Rejected',
      submitted: k.createdAt,
      reviewedBy: k.reviewedBy?.name || null,
      reviewedAt: k.reviewedAt || null
    }));

    const total = await KYC.countDocuments();

      return paginatedResponse(
        res,
      formattedKYC,
        getPaginationMeta(page, limit, total),
      'KYC retrieved successfully'
    );
  } catch (error) {
    logger.error('Get KYC error:', error);
    return errorResponse(res, 'Failed to retrieve KYC', 500);
  }
};

// Pending KYC handler
getKYC.pending = async (req, res) => {
  try {
    const kycs = await KYC.find({ status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Format KYC for frontend
    const formattedKYC = kycs.map(k => ({
      id: k._id,
      name: k.user?.name || 'Unknown',
      email: k.user?.email || '',
      project: 'N/A', // TODO: Get project from user if needed
      status: 'Pending',
      submitted: k.createdAt
    }));

    return successResponse(res, { kyc: formattedKYC }, 'Pending KYC retrieved successfully');
    } catch (error) {
      logger.error('Get pending KYC error:', error);
    return errorResponse(res, 'Failed to retrieve pending KYC', 500);
    }
};

const approveKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const kyc = await KYC.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('user');

    if (!kyc) {
      return errorResponse(res, 'KYC not found', 404);
    }

    return successResponse(res, { kyc }, 'KYC approved successfully');
  } catch (error) {
    logger.error('Approve KYC error:', error);
    return errorResponse(res, 'Failed to approve KYC', 500);
  }
};

const rejectKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const kyc = await KYC.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectionReason: reason || 'Rejected by admin',
        reviewedBy: userId,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!kyc) {
      return errorResponse(res, 'KYC not found', 404);
    }

    return successResponse(res, { kyc }, 'KYC rejected successfully');
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
    // Get user registrations by month
    const users = await User.find().sort({ createdAt: 1 });
    const monthlyData = {};
    
    users.forEach(user => {
      const month = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, count: 0 };
      }
      monthlyData[month].count++;
    });

    const data = Object.values(monthlyData);
    return successResponse(res, { data }, 'User registration report retrieved successfully');
  } catch (error) {
    logger.error('Get user registration report error:', error);
    return errorResponse(res, 'Failed to retrieve user registration report', 500);
  }
};

getReports.fundingDistribution = async (req, res) => {
  try {
    const projects = await Project.find();
    
    // Group by category
    const categoryData = {};
    projects.forEach(p => {
      if (!categoryData[p.category]) {
        categoryData[p.category] = { name: p.category, value: 0, totalFunding: 0 };
      }
      categoryData[p.category].value++;
      categoryData[p.category].totalFunding += p.fundingGoal || 0;
    });

    const data = Object.values(categoryData);
    return successResponse(res, { data }, 'Funding distribution report retrieved successfully');
  } catch (error) {
    logger.error('Get funding distribution report error:', error);
    return errorResponse(res, 'Failed to retrieve funding distribution report', 500);
  }
};

getReports.projectStatus = async (req, res) => {
  try {
    const projects = await Project.find();
    
    const statusCounts = {
      'Active': 0,
      'Pending Review': 0,
      'At Risk': 0,
      'Completed': 0,
      'Cancelled': 0
    };

    projects.forEach(p => {
      if (p.status === 'active') statusCounts['Active']++;
      else if (p.status === 'pending') statusCounts['Pending Review']++;
      else if (p.status === 'paused') statusCounts['At Risk']++;
      else if (p.status === 'completed') statusCounts['Completed']++;
      else if (p.status === 'cancelled') statusCounts['Cancelled']++;
    });

    const data = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    return successResponse(res, { data }, 'Project status report retrieved successfully');
    } catch (error) {
    logger.error('Get project status report error:', error);
    return errorResponse(res, 'Failed to retrieve project status report', 500);
  }
};

getReports.topDonors = async (req, res) => {
  try {
    // Get top donors by total pledge amount
    const pledges = await Pledge.find()
      .populate('donor', 'name email')
      .populate('project', 'title');
    
    const donorTotals = {};
    pledges.forEach(pledge => {
      const donorId = pledge.donor?._id?.toString();
      if (donorId) {
        if (!donorTotals[donorId]) {
          donorTotals[donorId] = {
            name: pledge.donor?.name || 'Unknown',
            email: pledge.donor?.email || '',
            totalAmount: 0,
            projectCount: 0
          };
        }
        donorTotals[donorId].totalAmount += pledge.amount || 0;
        donorTotals[donorId].projectCount++;
      }
    });

    const data = Object.values(donorTotals)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return successResponse(res, { data }, 'Top donors report retrieved successfully');
  } catch (error) {
    logger.error('Get top donors report error:', error);
    return errorResponse(res, 'Failed to retrieve top donors report', 500);
  }
};

// Get alerts
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    const formattedAlerts = alerts.map(a => ({
      id: a._id,
      type: a.title || a.type,
      project: a.project?.title || 'Unknown Project',
      projectId: a.project?._id || null,
      severity: a.severity === 'high' ? 'High' :
                a.severity === 'medium' ? 'Medium' : 'Low',
      description: a.description,
      date: a.createdAt,
      status: a.status === 'Active' ? 'Open' :
              a.status === 'Resolved' ? 'Resolved' : 'Read'
    }));

    return successResponse(res, { alerts: formattedAlerts }, 'Alerts retrieved successfully');
    } catch (error) {
    logger.error('Get alerts error:', error);
    return errorResponse(res, 'Failed to retrieve alerts', 500);
  }
};

// Get notifications
const getNotifications = async (req, res) => {
  try {
    // Get all notifications (admin can see all)
    const notifications = await Notification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedNotifications = notifications.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      date: n.createdAt,
      read: n.read,
      type: n.type || 'info'
    }));

    return successResponse(res, { notifications: formattedNotifications }, 'Notifications retrieved successfully');
    } catch (error) {
    logger.error('Get notifications error:', error);
    return errorResponse(res, 'Failed to retrieve notifications', 500);
  }
};

// Get tranches (pending milestones ready for disbursement)
const getTranches = async (req, res) => {
  try {
    const milestones = await Milestone.find({ status: 'approved' })
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    // Get transactions to see which have been disbursed
    const transactions = await Transaction.find({ type: 'Disbursement' });
    const disbursedMilestoneIds = new Set(
      transactions.map(t => t.project?.toString()).filter(Boolean)
    );

    const tranches = milestones
      .filter(m => !disbursedMilestoneIds.has(m.project?._id?.toString()))
      .map(m => ({
        id: m._id,
        project: m.project?.title || 'Unknown Project',
        milestone: m.title,
        amount: m.trancheAmount,
        status: 'Ready'
      }));

    return successResponse(res, { tranches }, 'Tranches retrieved successfully');
    } catch (error) {
    logger.error('Get tranches error:', error);
    return errorResponse(res, 'Failed to retrieve tranches', 500);
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
  getAlerts,
  getNotifications,
  getTranches,
};
