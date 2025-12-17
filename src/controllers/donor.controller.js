const Project = require('../models/Project');
const Pledge = require('../models/Pledge');
const Milestone = require('../models/Milestone');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/response');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `donor:dashboard:${userId}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return successResponse(res, cached, 'Dashboard overview retrieved successfully');
    }

    // Get pledges
    const pledges = await Pledge.find({ donor: userId }).populate('project');
    const totalPledged = pledges.reduce((sum, pledge) => sum + pledge.amount, 0);

    // Get projects
    const projectIds = pledges.map((pledge) => pledge.project._id);
    const projects = await Project.find({ _id: { $in: projectIds } });

    // Calculate totals
    const totalDistributed = projects.reduce((sum, project) => sum + (project.totalDisbursed || 0), 0);
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const onTrackProjects = projects.filter((p) => p.healthScore >= 70).length;

    // Get recent projects
    const recentProjects = await Project.find({ _id: { $in: projectIds } })
      .populate('beneficiary', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const overview = {
      portfolioSummary: {
        totalPledged,
        totalDistributed,
        balance: totalPledged - totalDistributed,
        activeProjects,
        onTrackProjects,
        atRiskProjects: activeProjects - onTrackProjects,
      },
      recentProjects,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, overview, 300);

    return successResponse(res, overview, 'Dashboard overview retrieved successfully');
  } catch (error) {
    logger.error('Get donor dashboard overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard overview',
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, dateFrom, dateTo, pledgeMin, pledgeMax, status } = req.query;

    // Get user's pledges to add pledge amounts later
    const pledges = await Pledge.find({ donor: userId });
    const pledgedProjectIds = pledges.map((p) => p.project.toString());

    // Build query - get ALL available projects (not just pledged ones)
    const query = { status: { $in: ['pending', 'active'] } }; // Only show pending or active projects
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Get projects
    const projects = await Project.find(query)
      .populate('beneficiary', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Filter by pledge amount if needed
    let filteredProjects = projects;
    if (pledgeMin || pledgeMax) {
      filteredProjects = projects.filter((project) => {
        const pledge = pledges.find((p) => p.project.toString() === project._id.toString());
        if (!pledge) return false;
        if (pledgeMin && pledge.amount < parseInt(pledgeMin)) return false;
        if (pledgeMax && pledge.amount > parseInt(pledgeMax)) return false;
        return true;
      });
    }

    // Add pledge amount to each project (0 if not pledged)
    const projectsWithPledge = filteredProjects.map((project) => {
      const pledge = pledges.find((p) => p.project.toString() === project._id.toString());
      return {
        ...project.toObject(),
        pledgeAmount: pledge ? pledge.amount : 0,
        hasPledged: pledgedProjectIds.includes(project._id.toString()),
      };
    });

    const total = await Project.countDocuments(query);

    return paginatedResponse(
      res,
      projectsWithPledge,
      getPaginationMeta(page, limit, total),
      'Projects retrieved successfully'
    );
  } catch (error) {
    logger.error('Get donor projects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user has pledged to this project
    const pledge = await Pledge.findOne({ donor: userId, project: id });
    if (!pledge) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }

    const project = await Project.findById(id)
      .populate('beneficiary', 'name email phone')
      .populate('milestones');

    return successResponse(res, { project }, 'Project details retrieved successfully');
  } catch (error) {
    logger.error('Get project details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details',
    });
  }
};

const getMilestones = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, status, dateFrom, dateTo } = req.query;

    // Get user's projects
    const pledges = await Pledge.find({ donor: userId });
    const projectIds = pledges.map((p) => p.project);

    // Build query
    const query = { project: { $in: projectIds } };
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (dateFrom || dateTo) {
      query.targetDate = {};
      if (dateFrom) query.targetDate.$gte = new Date(dateFrom);
      if (dateTo) query.targetDate.$lte = new Date(dateTo);
    }

    const milestones = await Milestone.find(query)
      .populate('project', 'title beneficiary')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Milestone.countDocuments(query);

    return paginatedResponse(
      res,
      milestones,
      getPaginationMeta(page, limit, total),
      'Milestones retrieved successfully'
    );
  } catch (error) {
    logger.error('Get donor milestones error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve milestones',
    });
  }
};

const getLedger = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, type, dateFrom, dateTo } = req.query;

    // Build query
    const query = { user: userId };
    if (type && type !== 'all') query.type = type;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const transactions = await Transaction.find(query)
      .populate('project', 'title')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return paginatedResponse(
      res,
      transactions,
      getPaginationMeta(page, limit, total),
      'Transaction history retrieved successfully'
    );
  } catch (error) {
    logger.error('Get donor ledger error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction history',
    });
  }
};

const getAlerts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's projects
    const pledges = await Pledge.find({ donor: userId });
    const projectIds = pledges.map((p) => p.project);

    const alerts = await Alert.find({ project: { $in: projectIds } })
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(res, { alerts }, 'Alerts retrieved successfully');
  } catch (error) {
    logger.error('Get donor alerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve alerts',
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments({ user: userId });

    return paginatedResponse(
      res,
      notifications,
      getPaginationMeta(parseInt(page), parseInt(limit), total),
      'Notifications retrieved successfully'
    );
  } catch (error) {
    logger.error('Get donor notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
    });
  }
};

module.exports = {
  getDashboardOverview,
  getProjects,
  getProjectDetails,
  getMilestones,
  getLedger,
  getAlerts,
  getNotifications,
};

