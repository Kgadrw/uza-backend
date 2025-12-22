const express = require('express');
const { initializeAdmin, checkAdminExists } = require('../controllers/setup.controller');
const { validate } = require('../middleware/validator');
const { setupAdminValidation } = require('../validators/auth.validator');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Setup
 *   description: System initialization endpoints (no authentication required)
 */

/**
 * @swagger
 * /api/v1/setup/check-admin:
 *   get:
 *     summary: Check if admin user exists
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: Admin status checked
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
 *                     adminExists:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
router.get('/check-admin', apiLimiter, checkAdminExists);

/**
 * @swagger
 * /api/v1/setup/init-admin:
 *   post:
 *     summary: Initialize admin user (only works if no admin exists)
 *     tags: [Setup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@uzaempower.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: admin123
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Admin already exists or validation error
 */
router.post('/init-admin', apiLimiter, setupAdminValidation, validate, initializeAdmin);

module.exports = router;

