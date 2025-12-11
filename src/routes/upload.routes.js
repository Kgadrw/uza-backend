const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadFile, deleteFile } = require('../controllers/upload.controller');
const { upload } = require('../middleware/multer');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: File Upload
 *   description: File upload endpoints for evidence and documents
 */

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded
 */
router.post('/', uploadLimiter, upload.single('file'), uploadFile);

/**
 * @swagger
 * /api/v1/upload/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [File Upload]
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
 *         description: File deleted successfully
 */
router.delete('/:id', uploadLimiter, deleteFile);

module.exports = router;

