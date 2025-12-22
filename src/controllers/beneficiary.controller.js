const Project = require('../models/Project');
const Pledge = require('../models/Pledge');
const FundingRequest = require('../models/FundingRequest');
const Milestone = require('../models/Milestone');
const Report = require('../models/Report');
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

const getProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, status, category } = req.query;

    const query = { beneficiary: userId };
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
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
    logger.error('Get projects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
    });
  }
};

const createProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, category, location, fundingGoal } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !fundingGoal) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate category
    const validCategories = ['Agriculture', 'Livestock', 'Aquaculture', 'Beekeeping', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Create project
    const project = await Project.create({
      title,
      description,
      category,
      location,
      fundingGoal: Number(fundingGoal),
      beneficiary: userId,
      status: 'pending',
    });

    return successResponse(
      res,
      { project },
      'Project created successfully',
      201
    );
  } catch (error) {
    logger.error('Create project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project',
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, description, category, location, fundingGoal } = req.body;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: id, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['Agriculture', 'Livestock', 'Aquaculture', 'Beekeeping', 'Other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category',
        });
      }
      project.category = category;
    }

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (location) project.location = location;
    if (fundingGoal) project.fundingGoal = Number(fundingGoal);

    await project.save();

    return successResponse(
      res,
      { project },
      'Project updated successfully'
    );
  } catch (error) {
    logger.error('Update project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: id, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Only allow deletion of pending projects
    if (project.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending projects can be deleted',
      });
    }

    await Project.findByIdAndDelete(id);

    return successResponse(
      res,
      null,
      'Project deleted successfully'
    );
  } catch (error) {
    logger.error('Delete project error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: id, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    return successResponse(
      res,
      { project },
      'Project retrieved successfully'
    );
  } catch (error) {
    logger.error('Get project by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project',
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

const deleteFundingRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Verify funding request belongs to user
    const fundingRequest = await FundingRequest.findOne({ _id: id, beneficiary: userId });
    if (!fundingRequest) {
      return res.status(403).json({
        success: false,
        message: 'Funding request not found or access denied',
      });
    }

    // Only allow deletion of pending funding requests
    if (fundingRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending funding requests can be deleted',
      });
    }

    await FundingRequest.findByIdAndDelete(id);

    return successResponse(
      res,
      null,
      'Funding request deleted successfully'
    );
  } catch (error) {
    logger.error('Delete funding request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete funding request',
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

const createMilestone = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, targetDate, trancheAmount } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!title || !targetDate || !trancheAmount) {
      return res.status(400).json({
        success: false,
        message: 'Title, target date, and tranche amount are required',
      });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Get the next milestone number
    const existingMilestones = await Milestone.find({ project: projectId }).sort({ number: -1 });
    const nextNumber = existingMilestones.length > 0 ? existingMilestones[0].number + 1 : 1;

    // Create milestone
    const milestone = await Milestone.create({
      project: projectId,
      title,
      description: description || '',
      targetDate: new Date(targetDate),
      trancheAmount: Number(trancheAmount),
      number: nextNumber,
      status: 'not_started',
    });

    return successResponse(
      res,
      { milestone },
      'Milestone created successfully',
      201
    );
  } catch (error) {
    logger.error('Create milestone error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create milestone',
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

const uploadEvidenceDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, milestoneId, documentType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    let milestone;
    
    // If milestoneId is provided, use it; otherwise, get the first available milestone
    if (milestoneId) {
      milestone = await Milestone.findOne({ _id: milestoneId, project: projectId });
      if (!milestone) {
        return res.status(404).json({
          success: false,
          message: 'Milestone not found',
        });
      }
    } else {
      // Get the first milestone for the project (preferably pending or in_progress)
      milestone = await Milestone.findOne({ project: projectId })
        .sort({ number: 1 });
      
      if (!milestone) {
        return res.status(404).json({
          success: false,
          message: 'No milestones found for this project. Please create milestones first.',
        });
      }
    }

    // Upload file to Cloudinary
    const { uploadToCloudinary } = require('../services/cloudinary.service');
    const result = await uploadToCloudinary(req.file, {
      folder: 'uzaempower/evidence',
    });

    // Determine file type
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }

    // Add evidence to milestone
    const evidenceEntry = {
      type: fileType,
      url: result.secure_url,
      uploadedAt: new Date(),
    };

    // Add documentType and description if provided
    if (documentType) {
      evidenceEntry.documentType = documentType;
    }
    if (description) {
      evidenceEntry.description = description;
    }

    milestone.evidence.push(evidenceEntry);

    // Update milestone status if not already submitted
    if (milestone.status === 'not_started' || milestone.status === 'in_progress') {
      milestone.status = 'evidence_submitted';
    }

    await milestone.save();

    return successResponse(
      res,
      {
        evidence: {
          id: evidenceEntry._id || milestone.evidence[milestone.evidence.length - 1]._id,
          type: fileType,
          url: result.secure_url,
          documentType: documentType || null,
          description: description || null,
          uploadedAt: evidenceEntry.uploadedAt,
          milestoneId: milestone._id,
          milestoneTitle: milestone.title,
        },
        milestone: {
          id: milestone._id,
          title: milestone.title,
          status: milestone.status,
        },
        project: {
          id: project._id,
          title: project.title,
        },
      },
      'Evidence uploaded successfully'
    );
  } catch (error) {
    logger.error('Upload evidence document error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload evidence',
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

const getBeneficiaryReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { projectId, status } = req.query;

    let query = { beneficiary: userId };
    if (projectId) {
      query.project = projectId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('project', 'title category')
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(query);

    return paginatedResponse(
      res,
      reports,
      getPaginationMeta(page, limit, total),
      'Reports retrieved successfully'
    );
  } catch (error) {
    logger.error('Get beneficiary reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
    });
  }
};

const createBeneficiaryReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      projectId,
      startDate,
      endDate,
      executiveSummary,
      keyAchievements,
      financialSummary,
      impactMetrics,
      challenges,
      nextSteps,
      media,
      status = 'submitted',
    } = req.body;

    // Validate required fields
    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Title and project ID are required',
      });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, beneficiary: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Project not found or access denied',
      });
    }

    // Create report
    const report = await Report.create({
      beneficiary: userId,
      project: projectId,
      title,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      executiveSummary,
      keyAchievements,
      financialSummary,
      impactMetrics,
      challenges,
      nextSteps,
      media: media || [],
      status,
    });

    const populatedReport = await Report.findById(report._id)
      .populate('project', 'title category');

    return successResponse(
      res,
      { report: populatedReport },
      'Report created successfully',
      201
    );
  } catch (error) {
    logger.error('Create beneficiary report error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create report',
    });
  }
};

module.exports = {
  getDashboardOverview,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getDonors,
  getFundingRequests,
  createFundingRequest,
  deleteFundingRequest,
  getMilestones,
  createMilestone,
  uploadEvidence,
  uploadEvidenceDocument,
  getMissingDocuments,
  getReports,
  getBeneficiaryReports,
  createBeneficiaryReport,
};

