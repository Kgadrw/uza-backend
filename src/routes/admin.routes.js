const express = require('express');
const { simpleAdminAuth } = require('../middleware/auth');
// No rate limiter for admin - admin needs smooth access
const {
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
} = require('../controllers/admin.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin dashboard endpoints - requires admin role
 */

// Simple admin authentication - just checks for admin-token, no complex middleware
router.use(simpleAdminAuth);

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/v1/admin/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 */
router.get('/projects', getProjects);

/**
 * @swagger
 * /api/v1/admin/projects/{id}/status:
 *   put:
 *     summary: Update project status
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, paused, completed, cancelled]
 *     responses:
 *       200:
 *         description: Project status updated successfully
 */
router.put('/projects/:id/status', updateProjectStatus);

/**
 * @swagger
 * /api/v1/admin/milestones/pending:
 *   get:
 *     summary: Get pending milestones for review
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending milestones retrieved successfully
 */
router.get('/milestones/pending', getMilestones.pending);

/**
 * @swagger
 * /api/v1/admin/milestones/{id}/approve:
 *   post:
 *     summary: Approve a milestone
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestone approved successfully
 */
router.post('/milestones/:id/approve', approveMilestone);

/**
 * @swagger
 * /api/v1/admin/milestones/{id}/reject:
 *   post:
 *     summary: Reject a milestone
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Milestone rejected successfully
 */
router.post('/milestones/:id/reject', rejectMilestone);

/**
 * @swagger
 * /api/v1/admin/kyc/pending:
 *   get:
 *     summary: Get pending KYC applications
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending KYC applications retrieved successfully
 */
router.get('/kyc/pending', getKYC.pending);

/**
 * @swagger
 * /api/v1/admin/kyc/{id}/approve:
 *   post:
 *     summary: Approve a KYC application
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KYC approved successfully
 */
router.post('/kyc/:id/approve', approveKYC);

/**
 * @swagger
 * /api/v1/admin/kyc/{id}/reject:
 *   post:
 *     summary: Reject a KYC application
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC rejected successfully
 */
router.post('/kyc/:id/reject', rejectKYC);

/**
 * @swagger
 * /api/v1/admin/reports/user-registration:
 *   get:
 *     summary: Get user registration report
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User registration data retrieved successfully
 */
router.get('/reports/user-registration', getReports.userRegistration);

/**
 * @swagger
 * /api/v1/admin/reports/funding-distribution:
 *   get:
 *     summary: Get funding distribution by category
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Funding distribution retrieved successfully
 */
router.get('/reports/funding-distribution', getReports.fundingDistribution);

/**
 * @swagger
 * /api/v1/admin/reports/project-status:
 *   get:
 *     summary: Get project status breakdown
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project status breakdown retrieved successfully
 */
router.get('/reports/project-status', getReports.projectStatus);

/**
 * @swagger
 * /api/v1/admin/reports/top-donors:
 *   get:
 *     summary: Get top donors report
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top donors retrieved successfully
 */
router.get('/reports/top-donors', getReports.topDonors);

/**
 * @swagger
 * /api/v1/admin/alerts:
 *   get:
 *     summary: Get all alerts
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 */
router.get('/alerts', getAlerts);

/**
 * @swagger
 * /api/v1/admin/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', getNotifications);

/**
 * @swagger
 * /api/v1/admin/tranches:
 *   get:
 *     summary: Get pending tranches
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tranches retrieved successfully
 */
router.get('/tranches', getTranches);

module.exports = router;

