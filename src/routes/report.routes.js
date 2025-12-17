const express = require('express');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  getProjectReport,
  getFinancialReport,
  getMilestoneReport,
  getDonorActivityReport,
  getDashboardReport,
} = require('../controllers/report.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report generation endpoints
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/reports/project:
 *   get:
 *     summary: Generate project report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Project report generated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.get('/project', apiLimiter, getProjectReport);

/**
 * @swagger
 * /api/v1/reports/financial:
 *   get:
 *     summary: Generate financial report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: Financial report generated successfully
 */
router.get('/financial', apiLimiter, getFinancialReport);

/**
 * @swagger
 * /api/v1/reports/milestone:
 *   get:
 *     summary: Generate milestone progress report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in_progress, evidence_submitted, approved, rejected, all]
 *         description: Filter by milestone status
 *     responses:
 *       200:
 *         description: Milestone report generated successfully
 */
router.get('/milestone', apiLimiter, getMilestoneReport);

/**
 * @swagger
 * /api/v1/reports/donor-activity:
 *   get:
 *     summary: Generate donor activity report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: donorId
 *         schema:
 *           type: string
 *         description: Filter by donor ID (admin only)
 *     responses:
 *       200:
 *         description: Donor activity report generated successfully
 *       403:
 *         description: Access denied
 */
router.get('/donor-activity', apiLimiter, getDonorActivityReport);

/**
 * @swagger
 * /api/v1/reports/dashboard:
 *   get:
 *     summary: Generate dashboard summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Dashboard report generated successfully
 */
router.get('/dashboard', apiLimiter, getDashboardReport);

module.exports = router;

