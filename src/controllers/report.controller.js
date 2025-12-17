const Project = require('../models/Project');
const Pledge = require('../models/Pledge');
const Milestone = require('../models/Milestone');
const FundingRequest = require('../models/FundingRequest');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Generate comprehensive project report
 */
const getProjectReport = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    let project;
    
    // Admin can access any project, others only their own
    if (userRole === 'admin') {
      project = await Project.findById(projectId).populate('beneficiary', 'name email phone');
    } else if (userRole === 'beneficiary') {
      project = await Project.findOne({ _id: projectId, beneficiary: userId }).populate('beneficiary', 'name email phone');
    } else {
      // Donor - check if they have pledged
      const pledge = await Pledge.findOne({ donor: userId, project: projectId });
      if (!pledge) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      project = await Project.findById(projectId).populate('beneficiary', 'name email phone');
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Get milestones
    const milestones = await Milestone.find({ project: projectId }).sort({ number: 1 });

    // Get funding requests
    const fundingRequests = await FundingRequest.find({ project: projectId })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    // Get transactions
    const transactionQuery = { project: projectId };
    if (startDate || endDate) {
      transactionQuery.createdAt = {};
      if (startDate) transactionQuery.createdAt.$gte = new Date(startDate);
      if (endDate) transactionQuery.createdAt.$lte = new Date(endDate);
    }
    const transactions = await Transaction.find(transactionQuery).sort({ createdAt: -1 });

    // Get pledges
    const pledges = await Pledge.find({ project: projectId })
      .populate('donor', 'name email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalPledged = pledges.reduce((sum, p) => sum + p.amount, 0);
    const totalDisbursed = project.totalDisbursed || 0;
    const totalFunded = project.totalFunded || 0;
    const fundingProgress = project.fundingGoal > 0 ? (totalFunded / project.fundingGoal) * 100 : 0;

    const milestoneStats = {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'approved').length,
      pending: milestones.filter(m => m.status === 'evidence_submitted').length,
      inProgress: milestones.filter(m => m.status === 'in_progress').length,
      notStarted: milestones.filter(m => m.status === 'not_started').length,
    };

    const report = {
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        category: project.category,
        location: project.location,
        beneficiary: {
          name: project.beneficiary?.name,
          email: project.beneficiary?.email,
          phone: project.beneficiary?.phone,
        },
        status: project.status,
        fundingGoal: project.fundingGoal,
        totalFunded,
        totalDisbursed,
        fundingProgress: Math.round(fundingProgress * 100) / 100,
        healthScore: project.healthScore,
        createdAt: project.createdAt,
      },
      financial: {
        totalPledged,
        totalFunded,
        totalDisbursed,
        balance: totalPledged - totalDisbursed,
        fundingGoal: project.fundingGoal,
        remaining: project.fundingGoal - totalFunded,
      },
      milestones: {
        summary: milestoneStats,
        details: milestones.map(m => ({
          id: m._id,
          number: m.number,
          title: m.title,
          description: m.description,
          targetDate: m.targetDate,
          completedDate: m.completedDate,
          status: m.status,
          trancheAmount: m.trancheAmount,
          evidenceCount: m.evidence?.length || 0,
        })),
      },
      fundingRequests: fundingRequests.map(fr => ({
        id: fr._id,
        amount: fr.amount,
        reason: fr.reason,
        status: fr.status,
        reviewedBy: fr.reviewedBy?.name,
        reviewedAt: fr.reviewedAt,
        createdAt: fr.createdAt,
      })),
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
      donors: pledges.map(p => ({
        id: p._id,
        donor: {
          name: p.donor?.name,
          email: p.donor?.email,
        },
        amount: p.amount,
        createdAt: p.createdAt,
      })),
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      generatedAt: new Date(),
    };

    return successResponse(res, report, 'Project report generated successfully');
  } catch (error) {
    logger.error('Generate project report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate project report',
    });
  }
};

/**
 * Generate financial report
 */
const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    
    if (userRole === 'beneficiary') {
      const projects = await Project.find({ beneficiary: userId });
      const projectIds = projects.map(p => p._id);
      query.project = { $in: projectIds };
    } else if (userRole === 'donor') {
      const pledges = await Pledge.find({ donor: userId });
      const projectIds = pledges.map(p => p.project);
      query.project = { $in: projectIds };
    }

    if (projectId) {
      query.project = projectId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get transactions
    const transactions = await Transaction.find(query)
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    // Get pledges
    const pledgeQuery = {};
    if (userRole === 'donor') {
      pledgeQuery.donor = userId;
    } else if (userRole === 'beneficiary') {
      const projects = await Project.find({ beneficiary: userId });
      pledgeQuery.project = { $in: projects.map(p => p._id) };
    }
    if (projectId) pledgeQuery.project = projectId;
    if (startDate || endDate) {
      pledgeQuery.createdAt = {};
      if (startDate) pledgeQuery.createdAt.$gte = new Date(startDate);
      if (endDate) pledgeQuery.createdAt.$lte = new Date(endDate);
    }

    const pledges = await Pledge.find(pledgeQuery)
      .populate('project', 'title')
      .populate('donor', 'name email')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'credit' || t.type === 'donation')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'debit' || t.type === 'disbursement')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPledged = pledges.reduce((sum, p) => sum + p.amount, 0);

    const report = {
      summary: {
        totalIncome,
        totalExpenses,
        totalPledged,
        netBalance: totalIncome - totalExpenses,
      },
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        project: t.project?.title,
        createdAt: t.createdAt,
      })),
      pledges: pledges.map(p => ({
        id: p._id,
        amount: p.amount,
        project: p.project?.title,
        donor: p.donor ? {
          name: p.donor.name,
          email: p.donor.email,
        } : null,
        createdAt: p.createdAt,
      })),
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      generatedAt: new Date(),
    };

    return successResponse(res, report, 'Financial report generated successfully');
  } catch (error) {
    logger.error('Generate financial report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
    });
  }
};

/**
 * Generate milestone progress report
 */
const getMilestoneReport = async (req, res) => {
  try {
    const { projectId, status } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    
    if (projectId) {
      query.project = projectId;
    } else if (userRole === 'beneficiary') {
      const projects = await Project.find({ beneficiary: userId });
      query.project = { $in: projects.map(p => p._id) };
    } else if (userRole === 'donor') {
      const pledges = await Pledge.find({ donor: userId });
      query.project = { $in: pledges.map(p => p.project) };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const milestones = await Milestone.find(query)
      .populate('project', 'title beneficiary')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: milestones.length,
      notStarted: milestones.filter(m => m.status === 'not_started').length,
      inProgress: milestones.filter(m => m.status === 'in_progress').length,
      evidenceSubmitted: milestones.filter(m => m.status === 'evidence_submitted').length,
      approved: milestones.filter(m => m.status === 'approved').length,
      rejected: milestones.filter(m => m.status === 'rejected').length,
    };

    // Calculate completion rate
    const completionRate = milestones.length > 0 
      ? (stats.approved / milestones.length) * 100 
      : 0;

    // Group by project
    const byProject = {};
    milestones.forEach(m => {
      const projectId = m.project._id.toString();
      if (!byProject[projectId]) {
        byProject[projectId] = {
          project: {
            id: m.project._id,
            title: m.project.title,
          },
          milestones: [],
        };
      }
      byProject[projectId].milestones.push({
        id: m._id,
        number: m.number,
        title: m.title,
        description: m.description,
        targetDate: m.targetDate,
        completedDate: m.completedDate,
        status: m.status,
        trancheAmount: m.trancheAmount,
        evidenceCount: m.evidence?.length || 0,
        overdue: m.targetDate < new Date() && m.status !== 'approved',
      });
    });

    const report = {
      summary: {
        ...stats,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      byProject: Object.values(byProject),
      allMilestones: milestones.map(m => ({
        id: m._id,
        project: m.project.title,
        number: m.number,
        title: m.title,
        targetDate: m.targetDate,
        status: m.status,
        trancheAmount: m.trancheAmount,
        overdue: m.targetDate < new Date() && m.status !== 'approved',
      })),
      generatedAt: new Date(),
    };

    return successResponse(res, report, 'Milestone report generated successfully');
  } catch (error) {
    logger.error('Generate milestone report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate milestone report',
    });
  }
};

/**
 * Generate donor activity report
 */
const getDonorActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, donorId } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Only admin can view all donors, others see their own
    let query = {};
    if (userRole === 'admin') {
      if (donorId) query.donor = donorId;
    } else if (userRole === 'donor') {
      query.donor = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pledges = await Pledge.find(query)
      .populate('project', 'title category location')
      .populate('donor', 'name email')
      .sort({ createdAt: -1 });

    // Group by donor
    const byDonor = {};
    pledges.forEach(pledge => {
      const donorId = pledge.donor._id.toString();
      if (!byDonor[donorId]) {
        byDonor[donorId] = {
          donor: {
            id: pledge.donor._id,
            name: pledge.donor.name,
            email: pledge.donor.email,
          },
          totalDonated: 0,
          projectCount: 0,
          pledges: [],
        };
      }
      byDonor[donorId].totalDonated += pledge.amount;
      byDonor[donorId].projectCount += 1;
      byDonor[donorId].pledges.push({
        id: pledge._id,
        amount: pledge.amount,
        project: {
          id: pledge.project._id,
          title: pledge.project.title,
          category: pledge.project.category,
        },
        createdAt: pledge.createdAt,
      });
    });

    // Calculate totals
    const totalDonated = pledges.reduce((sum, p) => sum + p.amount, 0);
    const uniqueDonors = Object.keys(byDonor).length;
    const uniqueProjects = [...new Set(pledges.map(p => p.project._id.toString()))].length;

    const report = {
      summary: {
        totalDonated,
        totalPledges: pledges.length,
        uniqueDonors,
        uniqueProjects,
      },
      byDonor: Object.values(byDonor).sort((a, b) => b.totalDonated - a.totalDonated),
      allPledges: pledges.map(p => ({
        id: p._id,
        donor: {
          name: p.donor.name,
          email: p.donor.email,
        },
        project: p.project.title,
        amount: p.amount,
        createdAt: p.createdAt,
      })),
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      generatedAt: new Date(),
    };

    return successResponse(res, report, 'Donor activity report generated successfully');
  } catch (error) {
    logger.error('Generate donor activity report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate donor activity report',
    });
  }
};

/**
 * Generate comprehensive dashboard report
 */
const getDashboardReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    let report = {};

    if (userRole === 'admin') {
      // Admin dashboard report
      const totalProjects = await Project.countDocuments();
      const activeProjects = await Project.countDocuments({ status: 'active' });
      const totalUsers = await User.countDocuments();
      const totalDonors = await User.countDocuments({ role: 'donor' });
      const totalBeneficiaries = await User.countDocuments({ role: 'beneficiary' });
      
      const projects = await Project.find();
      const totalFunded = projects.reduce((sum, p) => sum + (p.totalFunded || 0), 0);
      const totalGoal = projects.reduce((sum, p) => sum + (p.fundingGoal || 0), 0);

      const pledges = await Pledge.find();
      const totalPledged = pledges.reduce((sum, p) => sum + p.amount, 0);

      report = {
        overview: {
          totalProjects,
          activeProjects,
          totalUsers,
          totalDonors,
          totalBeneficiaries,
          totalFunded,
          totalPledged,
          totalGoal,
          fundingProgress: totalGoal > 0 ? (totalFunded / totalGoal) * 100 : 0,
        },
        generatedAt: new Date(),
      };
    } else if (userRole === 'beneficiary') {
      // Beneficiary dashboard report
      const projects = await Project.find({ beneficiary: userId });
      const totalFunded = projects.reduce((sum, p) => sum + (p.totalFunded || 0), 0);
      const activeProjects = projects.filter(p => p.status === 'active').length;

      const pledges = await Pledge.find({ project: { $in: projects.map(p => p._id) } });
      const uniqueDonors = [...new Set(pledges.map(p => p.donor.toString()))].length;

      const milestones = await Milestone.find({ project: { $in: projects.map(p => p._id) } });
      const completedMilestones = milestones.filter(m => m.status === 'approved').length;

      report = {
        overview: {
          totalProjects: projects.length,
          activeProjects,
          totalFunded,
          uniqueDonors,
          totalMilestones: milestones.length,
          completedMilestones,
        },
        generatedAt: new Date(),
      };
    } else if (userRole === 'donor') {
      // Donor dashboard report
      const pledges = await Pledge.find({ donor: userId });
      const totalPledged = pledges.reduce((sum, p) => sum + p.amount, 0);
      const uniqueProjects = [...new Set(pledges.map(p => p.project.toString()))].length;

      const projectIds = pledges.map(p => p.project);
      const projects = await Project.find({ _id: { $in: projectIds } });
      const totalDistributed = projects.reduce((sum, p) => sum + (p.totalDisbursed || 0), 0);

      report = {
        overview: {
          totalPledged,
          totalDistributed,
          balance: totalPledged - totalDistributed,
          uniqueProjects,
          totalPledges: pledges.length,
        },
        generatedAt: new Date(),
      };
    }

    return successResponse(res, report, 'Dashboard report generated successfully');
  } catch (error) {
    logger.error('Generate dashboard report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard report',
    });
  }
};

module.exports = {
  getProjectReport,
  getFinancialReport,
  getMilestoneReport,
  getDonorActivityReport,
  getDashboardReport,
};

