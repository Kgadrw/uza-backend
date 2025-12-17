const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../middleware/multer');
const {
  getDashboardOverview,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getDonors,
  getFundingRequests,
  createFundingRequest,
  getMilestones,
  uploadEvidence,
  uploadEvidenceDocument,
  getMissingDocuments,
  getReports,
} = require('../controllers/beneficiary.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Beneficiary Dashboard
 *   description: Beneficiary dashboard endpoints - requires beneficiary role
 */

// All routes require authentication and beneficiary role
router.use(authenticate);
router.use(authorize('beneficiary'));

/**
 * @swagger
 * /api/v1/beneficiary/dashboard/overview:
 *   get:
 *     summary: Get beneficiary dashboard overview
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 */
router.get('/dashboard/overview', apiLimiter, getDashboardOverview);

/**
 * @swagger
 * /api/v1/beneficiary/projects:
 *   get:
 *     summary: Get beneficiary's projects
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *   post:
 *     summary: Create a new project
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - location
 *               - fundingGoal
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Agriculture, Livestock, Aquaculture, Beekeeping, Other]
 *               location:
 *                 type: string
 *               fundingGoal:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.get('/projects', apiLimiter, getProjects);
router.post('/projects', apiLimiter, createProject);

/**
 * @swagger
 * /api/v1/beneficiary/projects/{id}:
 *   get:
 *     summary: Get a specific project by ID
 *     tags: [Beneficiary Dashboard]
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
 *         description: Project retrieved successfully
 *   put:
 *     summary: Update a project
 *     tags: [Beneficiary Dashboard]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Agriculture, Livestock, Aquaculture, Beekeeping, Other]
 *               location:
 *                 type: string
 *               fundingGoal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Project updated successfully
 *   delete:
 *     summary: Delete a project
 *     tags: [Beneficiary Dashboard]
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
 *         description: Project deleted successfully
 */
router.get('/projects/:id', apiLimiter, getProjectById);
router.put('/projects/:id', apiLimiter, updateProject);
router.delete('/projects/:id', apiLimiter, deleteProject);

/**
 * @swagger
 * /api/v1/beneficiary/donors:
 *   get:
 *     summary: Get list of donors who donated to beneficiary's projects
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Donors retrieved successfully
 */
router.get('/donors', apiLimiter, getDonors);

/**
 * @swagger
 * /api/v1/beneficiary/funding-requests:
 *   get:
 *     summary: Get funding requests
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Funding requests retrieved successfully
 *   post:
 *     summary: Create a new funding request
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - amount
 *               - reason
 *             properties:
 *               projectId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Funding request created successfully
 */
router.get('/funding-requests', apiLimiter, getFundingRequests);
router.post('/funding-requests', apiLimiter, createFundingRequest);

/**
 * @swagger
 * /api/v1/beneficiary/projects/{id}/milestones:
 *   get:
 *     summary: Get milestones for a project
 *     tags: [Beneficiary Dashboard]
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
 *         description: Milestones retrieved successfully
 */
router.get('/projects/:id/milestones', apiLimiter, getMilestones);

/**
 * @swagger
 * /api/v1/beneficiary/milestones/{id}/evidence:
 *   post:
 *     summary: Upload evidence for a milestone
 *     tags: [Beneficiary Dashboard]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Evidence uploaded successfully
 */
router.post('/milestones/:id/evidence', uploadLimiter, upload.single('file'), uploadEvidence);

/**
 * @swagger
 * /api/v1/beneficiary/evidence/upload:
 *   post:
 *     summary: Upload evidence document for a project
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - projectId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF, JPG, or PNG file to upload
 *               projectId:
 *                 type: string
 *                 description: ID of the project to upload evidence for
 *               milestoneId:
 *                 type: string
 *                 description: Optional milestone ID. If not provided, uses first milestone
 *               documentType:
 *                 type: string
 *                 description: Type of document (e.g., Business License, Tax Certificate)
 *               description:
 *                 type: string
 *                 description: Optional description for the evidence
 *     responses:
 *       200:
 *         description: Evidence uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     evidence:
 *                       type: object
 *                     milestone:
 *                       type: object
 *                     project:
 *                       type: object
 *       400:
 *         description: Bad request - missing required fields
 *       403:
 *         description: Access denied - project not found or doesn't belong to user
 *       404:
 *         description: Milestone not found
 *       500:
 *         description: Server error
 */
router.post('/evidence/upload', uploadLimiter, upload.single('file'), uploadEvidenceDocument);

/**
 * @swagger
 * /api/v1/beneficiary/missing-documents:
 *   get:
 *     summary: Get list of missing documents
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Missing documents retrieved successfully
 */
router.get('/missing-documents', apiLimiter, getMissingDocuments);

/**
 * @swagger
 * /api/v1/beneficiary/reports/funding-progress:
 *   get:
 *     summary: Get funding progress report
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Funding progress retrieved successfully
 */
router.get('/reports/funding-progress', apiLimiter, getReports.fundingProgress);

/**
 * @swagger
 * /api/v1/beneficiary/reports/project-status:
 *   get:
 *     summary: Get project status distribution report
 *     tags: [Beneficiary Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project status retrieved successfully
 */
router.get('/reports/project-status', apiLimiter, getReports.projectStatus);

module.exports = router;

