const Project = require('../models/Project');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const KYC = require('../models/KYC');
const Pledge = require('../models/Pledge');
const { successResponse, paginatedResponse } = require('../utils/response');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const getDashboard = async (req, res) => {
  try {
    const cacheKey = 'admin:dashboard';

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return successResponse(res, cached, 'Dashboard data retrieved successfully');
    }

    const [
      totalProjects,
      pendingReview,
      activeProjects,
      totalFunds,
      totalDisbursed,
      pendingTranches,
      alertsCount,
      kycPending,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'active' }),
      Project.aggregate([{ $group: { _id: null, total: { $sum: '$fundingGoal' } } }]),
      Project.aggregate([{ $group: { _id: null, total: { $sum: '$totalDisbursed' } } }]),
      Milestone.countDocuments({ status: 'evidence_submitted' }),
      Project.countDocuments({ riskLevel: 'high' }),
      KYC.countDocuments({ status: 'pending' }),
    ]);

    const dashboard = {
      summaryData: {
        totalProjects,
        pendingReview,
        activeProjects,
        totalFunds: totalFunds[0]?.total || 0,
        totalDisbursed: totalDisbursed[0]?.total || 0,
        pendingTranches,
        alertsCount,
        kycPending,
      },
      recentProjects: await Project.find()
        .populate('beneficiary', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, dashboard, 300);

    return successResponse(res, dashboard, 'Dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, status, category } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('beneficiary', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);

    return paginatedResponse(
      res,
      projects,
      getPaginationMeta(page, limit, total),
      'Projects retrieved successfully'
    );
  } catch (error) {
    logger.error('Get admin projects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('beneficiary', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return successResponse(res, { project }, 'Project status updated successfully');
  } catch (error) {
    logger.error('Update project status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project status',
    });
  }
};

const getMilestones = {
  pending: async (req, res) => {
    try {
      const { page, limit, skip, sort } = getPaginationParams(req);

      const milestones = await Milestone.find({ status: 'evidence_submitted' })
        .populate('project', 'title beneficiary')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Milestone.countDocuments({ status: 'evidence_submitted' });

      return paginatedResponse(
        res,
        milestones,
        getPaginationMeta(page, limit, total),
        'Pending milestones retrieved successfully'
      );
    } catch (error) {
      logger.error('Get pending milestones error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending milestones',
      });
    }
  },
};

const approveMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const milestone = await Milestone.findById(id).populate('project');
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    milestone.status = 'approved';
    milestone.completedDate = new Date();
    await milestone.save();

    // Update project total disbursed
    const project = await Project.findById(milestone.project._id);
    project.totalDisbursed = (project.totalDisbursed || 0) + milestone.trancheAmount;
    await project.save();

    return successResponse(res, { milestone }, 'Milestone approved successfully');
  } catch (error) {
    logger.error('Approve milestone error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve milestone',
    });
  }
};

const rejectMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    milestone.status = 'rejected';
    milestone.rejectionReason = reason;
    await milestone.save();

    return successResponse(res, { milestone }, 'Milestone rejected successfully');
  } catch (error) {
    logger.error('Reject milestone error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject milestone',
    });
  }
};

const getKYC = {
  pending: async (req, res) => {
    try {
      const { page, limit, skip, sort } = getPaginationParams(req);

      const kycs = await KYC.find({ status: 'pending' })
        .populate('user', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await KYC.countDocuments({ status: 'pending' });

      return paginatedResponse(
        res,
        kycs,
        getPaginationMeta(page, limit, total),
        'Pending KYC applications retrieved successfully'
      );
    } catch (error) {
      logger.error('Get pending KYC error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending KYC applications',
      });
    }
  },
};

const approveKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const kyc = await KYC.findById(id);
    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC application not found',
      });
    }

    kyc.status = 'approved';
    kyc.reviewedBy = adminId;
    kyc.reviewedAt = new Date();
    kyc.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    await kyc.save();

    return successResponse(res, { kyc }, 'KYC approved successfully');
  } catch (error) {
    logger.error('Approve KYC error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve KYC',
    });
  }
};

const rejectKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const kyc = await KYC.findById(id);
    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC application not found',
      });
    }

    kyc.status = 'rejected';
    kyc.reviewedBy = adminId;
    kyc.reviewedAt = new Date();
    kyc.rejectionReason = reason;
    await kyc.save();

    return successResponse(res, { kyc }, 'KYC rejected successfully');
  } catch (error) {
    logger.error('Reject KYC error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject KYC',
    });
  }
};

const getReports = {
  userRegistration: async (req, res) => {
    try {
      const users = await User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const data = users.map((u) => ({
        month: `${u._id.year}-${String(u._id.month).padStart(2, '0')}`,
        users: u.count,
      }));

      return successResponse(res, { data }, 'User registration data retrieved successfully');
    } catch (error) {
      logger.error('Get user registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user registration data',
      });
    }
  },

  fundingDistribution: async (req, res) => {
    try {
      const projects = await Project.aggregate([
        {
          $group: {
            _id: '$category',
            total: { $sum: '$totalFunded' },
          },
        },
      ]);

      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
      const data = projects.map((p, index) => ({
        name: p._id,
        value: p.total,
        color: colors[index % colors.length],
      }));

      return successResponse(res, { data }, 'Funding distribution retrieved successfully');
    } catch (error) {
      logger.error('Get funding distribution error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve funding distribution',
      });
    }
  },

  projectStatus: async (req, res) => {
    try {
      const projects = await Project.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const data = projects.map((p) => ({
        status: p._id,
        count: p.count,
      }));

      return successResponse(res, { data }, 'Project status breakdown retrieved successfully');
    } catch (error) {
      logger.error('Get project status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve project status breakdown',
      });
    }
  },

  topDonors: async (req, res) => {
    try {
      const topDonors = await Pledge.aggregate([
        {
          $group: {
            _id: '$donor',
            totalDonated: { $sum: '$amount' },
            projectCount: { $sum: 1 },
          },
        },
        { $sort: { totalDonated: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'donor',
          },
        },
        { $unwind: '$donor' },
      ]);

      const data = topDonors.map((donor) => ({
        name: donor.donor.name,
        donated: donor.totalDonated,
        projects: donor.projectCount,
      }));

      return successResponse(res, { data }, 'Top donors retrieved successfully');
    } catch (error) {
      logger.error('Get top donors error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve top donors',
      });
    }
  },
};

module.exports = {
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

