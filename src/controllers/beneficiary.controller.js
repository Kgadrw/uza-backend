const Project = require('../models/Project');
const Pledge = require('../models/Pledge');
const FundingRequest = require('../models/FundingRequest');
const Milestone = require('../models/Milestone');
const { successResponse, paginatedResponse } = require('../utils/response');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `beneficiary:dashboard:${userId}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return successResponse(res, cached, 'Dashboard overview retrieved successfully');
    }

    // Get user's projects
    const projects = await Project.find({ beneficiary: userId });
    const totalFunded = projects.reduce((sum, project) => sum + (project.totalFunded || 0), 0);
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const onTrackProjects = projects.filter((p) => p.healthScore >= 70).length;

    // Get unique donors
    const pledges = await Pledge.find({ project: { $in: projects.map((p) => p._id) } })
      .populate('donor', 'name email');
    const uniqueDonors = [...new Set(pledges.map((p) => p.donor?._id?.toString()))].length;

    // Get missing documents count
    const milestones = await Milestone.find({ project: { $in: projects.map((p) => p._id) } });
    const pendingDocuments = milestones.filter((m) => 
      m.status === 'not_started' || m.status === 'in_progress'
    ).length;

    const overview = {
      summaryData: {
        totalFunded,
        totalDonors: uniqueDonors,
        activeProjects,
        onTrackProjects,
        pendingDocuments,
      },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, overview, 300);

    return successResponse(res, overview, 'Dashboard overview retrieved successfully');
  } catch (error) {
    logger.error('Get beneficiary dashboard overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard overview',
    });
  }
};

const getDonors = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search } = req.query;

    // Get user's projects
    const projects = await Project.find({ beneficiary: userId });
    const projectIds = projects.map((p) => p._id);

    // Get pledges for these projects
    const pledges = await Pledge.find({ project: { $in: projectIds } })
      .populate('donor', 'name email')
      .populate('project', 'title');

    // Group by donor
    const donorMap = new Map();
    pledges.forEach((pledge) => {
      if (!pledge.donor) return;
      const donorId = pledge.donor._id.toString();
      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          id: donorId,
          name: pledge.donor.name,
          email: pledge.donor.email,
          totalDonated: 0,
          projects: [],
        });
      }
      const donor = donorMap.get(donorId);
      donor.totalDonated += pledge.amount;
      if (!donor.projects.includes(pledge.project.title)) {
        donor.projects.push(pledge.project.title);
      }
    });

    let donors = Array.from(donorMap.values());

    // Filter by search
    if (search) {
      donors = donors.filter((donor) =>
        donor.name.toLowerCase().includes(search.toLowerCase()) ||
        donor.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginate
    const total = donors.length;
    const paginatedDonors = donors.slice(skip, skip + limit);

    return paginatedResponse(
      res,
      paginatedDonors,
      getPaginationMeta(page, limit, total),
      'Donors retrieved successfully'
    );
  } catch (error) {
    logger.error('Get donors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve donors',
    });
  }
};

const getFundingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);

    const fundingRequests = await FundingRequest.find({ beneficiary: userId })
      .populate('project', 'title')
      .populate('reviewedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await FundingRequest.countDocuments({ beneficiary: userId });

    return paginatedResponse(
      res,
      fundingRequests,
      getPaginationMeta(page, limit, total),
      'Funding requests retrieved successfully'
    );
  } catch (error) {
    logger.error('Get funding requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve funding requests',
    });
  }
};

const createFundingRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, amount, reason } = req.body;

    // Validate project belongs to user
    const project = await Project.findOne({ _id: projectId, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    const fundingRequest = await FundingRequest.create({
      beneficiary: userId,
      project: projectId,
      amount,
      reason,
      status: 'pending',
    });

    return successResponse(
      res,
      { fundingRequest },
      'Funding request created successfully',
      201
    );
  } catch (error) {
    logger.error('Create funding request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create funding request',
    });
  }
};

const getMilestones = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: id, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    const milestones = await Milestone.find({ project: id }).sort({ number: 1 });

    return successResponse(res, { milestones }, 'Milestones retrieved successfully');
  } catch (error) {
    logger.error('Get milestones error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve milestones',
    });
  }
};

const uploadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Verify milestone belongs to user's project
    const milestone = await Milestone.findById(id).populate('project');
    if (!milestone || milestone.project.beneficiary.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Milestone not found or access denied',
      });
    }

    // Upload file (using Cloudinary service)
    const { uploadToCloudinary } = require('../services/cloudinary.service');
    const result = await uploadToCloudinary(req.file, {
      folder: 'uzaempower/evidence',
    });

    // Add evidence to milestone
    milestone.evidence.push({
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
      url: result.secure_url,
      uploadedAt: new Date(),
    });

    // Update status if not already submitted
    if (milestone.status === 'not_started' || milestone.status === 'in_progress') {
      milestone.status = 'evidence_submitted';
    }

    await milestone.save();

    return successResponse(
      res,
      { milestone, evidenceUrl: result.secure_url },
      'Evidence uploaded successfully'
    );
  } catch (error) {
    logger.error('Upload evidence error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload evidence',
    });
  }
};

const getMissingDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's projects
    const projects = await Project.find({ beneficiary: userId });
    const projectIds = projects.map((p) => p._id);

    // Get milestones that need evidence
    const milestones = await Milestone.find({
      project: { $in: projectIds },
      status: { $in: ['not_started', 'in_progress'] },
    }).populate('project', 'title');

    const missingDocs = milestones.map((milestone) => ({
      projectId: milestone.project._id,
      projectTitle: milestone.project.title,
      milestoneId: milestone._id,
      milestoneTitle: milestone.title,
      targetDate: milestone.targetDate,
    }));

    return successResponse(res, { missingDocuments: missingDocs }, 'Missing documents retrieved successfully');
  } catch (error) {
    logger.error('Get missing documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve missing documents',
    });
  }
};

const getReports = {
  fundingProgress: async (req, res) => {
    try {
      const userId = req.user._id;
      const projects = await Project.find({ beneficiary: userId });

      const fundingProgressData = projects.map((project) => ({
        name: project.title,
        funded: project.totalFunded || 0,
        goal: project.fundingGoal,
      }));

      return successResponse(res, { data: fundingProgressData }, 'Funding progress retrieved successfully');
    } catch (error) {
      logger.error('Get funding progress error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve funding progress',
      });
    }
  },

  projectStatus: async (req, res) => {
    try {
      const userId = req.user._id;
      const projects = await Project.find({ beneficiary: userId });

      const statusCount = {
        active: 0,
        pending: 0,
        completed: 0,
        paused: 0,
      };

      projects.forEach((project) => {
        if (statusCount[project.status] !== undefined) {
          statusCount[project.status]++;
        }
      });

      const projectStatusData = Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
        color: name === 'active' ? '#10b981' : name === 'completed' ? '#3b82f6' : '#f59e0b',
      }));

      return successResponse(res, { data: projectStatusData }, 'Project status retrieved successfully');
    } catch (error) {
      logger.error('Get project status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve project status',
      });
    }
  },
};

module.exports = {
  getDashboardOverview,
  getDonors,
  getFundingRequests,
  createFundingRequest,
  getMilestones,
  uploadEvidence,
  getMissingDocuments,
  getReports,
};

