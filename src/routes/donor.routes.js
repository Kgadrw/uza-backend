const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  getDashboardOverview,
  getProjects,
  getProjectDetails,
  getMilestones,
  getLedger,
  getAlerts,
  getNotifications,
} = require('../controllers/donor.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Donor Dashboard
 *   description: Donor dashboard endpoints - requires donor role
 */

// All routes require authentication and donor role
router.use(authenticate);
router.use(authorize('donor'));

/**
 * @swagger
 * /api/v1/donor/dashboard/overview:
 *   get:
 *     summary: Get donor dashboard overview
 *     tags: [Donor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     portfolioSummary:
 *                       type: object
 *                       properties:
 *                         totalPledged:
 *                           type: number
 *                         totalDistributed:
 *                           type: number
 *                         activeProjects:
 *                           type: number
 *                         onTrackProjects:
 *                           type: number
 */
router.get('/dashboard/overview', apiLimiter, getDashboardOverview);

/**
 * @swagger
 * /api/v1/donor/projects:
 *   get:
 *     summary: Get donor's projects
 *     tags: [Donor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 */
router.get('/projects', apiLimiter, getProjects);

/**
 * @swagger
 * /api/v1/donor/projects/{id}:
 *   get:
 *     summary: Get project details
 *     tags: [Donor Dashboard]
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
 *         description: Project details retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/projects/:id', apiLimiter, getProjectDetails);

/**
 * @swagger
 * /api/v1/donor/milestones:
 *   get:
 *     summary: Get milestones for donor's projects
 *     tags: [Donor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestones retrieved successfully
 */
router.get('/milestones', apiLimiter, getMilestones);

/**
 * @swagger
 * /api/v1/donor/ledger:
 *   get:
 *     summary: Get transaction history (ledger)
 *     tags: [Donor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, Pledge, Disbursement]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 */
router.get('/ledger', apiLimiter, getLedger);

/**
 * @swagger
 * /api/v1/donor/alerts:
 *   get:
 *     summary: Get alerts for donor's projects
 *     tags: [Donor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 */
router.get('/alerts', apiLimiter, getAlerts);

/**
 * @swagger
 * /api/v1/donor/notifications:
 *   get:
 *     summary: Get notifications
 *     tags: [Donor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', apiLimiter, getNotifications);

module.exports = router;

