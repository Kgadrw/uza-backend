const express = require('express');
const { authenticate } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/rateLimiter');
const { exportData } = require('../controllers/export.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Data export endpoints (CSV/PDF)
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/export:
 *   post:
 *     summary: Export data as CSV or PDF
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - dataType
 *               - data
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [csv, pdf]
 *                 example: csv
 *               dataType:
 *                 type: string
 *                 example: projects
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Export file generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing required fields
 */
router.post('/', exportLimiter, exportData);

module.exports = router;

