const express = require('express');
const { simpleAdminAuth } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const {
  getCatalogues,
  getAllCatalogues,
  getCatalogue,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
} = require('../controllers/catalogue.controller');

const router = express.Router();

// Middleware to handle file uploads to Cloudinary
const handleFileUploads = async (req, res, next) => {
  try {
    if (req.files) {
      const uploadPromises = [];

      if (req.files.image && req.files.image.length > 0) {
        const imageFile = req.files.image[0];
        uploadPromises.push(
          uploadToCloudinary(imageFile, {
            folder: 'uzaempower/catalogues',
            resource_type: 'image',
          }).then(result => ({ type: 'image', url: result.secure_url, publicId: result.public_id }))
        );
      }

      if (req.files.file && req.files.file.length > 0) {
        const pdfFile = req.files.file[0];
        uploadPromises.push(
          uploadToCloudinary(pdfFile, {
            folder: 'uzaempower/catalogues',
            resource_type: 'auto',
          }).then(result => ({ type: 'file', url: result.secure_url, publicId: result.public_id }))
        );
      }

      if (uploadPromises.length > 0) {
        const results = await Promise.all(uploadPromises);
        
        // Attach URLs to request body
        results.forEach(result => {
          if (result.type === 'image') {
            req.body.image = result.url;
          } else if (result.type === 'file') {
            req.body.file = result.url;
          }
        });
      }
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
};

// Public route - no auth required
router.get('/public', getCatalogues);

// Admin routes - require admin authentication
router.use(simpleAdminAuth);

/**
 * @swagger
 * /api/v1/catalogues:
 *   get:
 *     summary: Get all catalogues (admin)
 *     tags: [Catalogues]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllCatalogues);

/**
 * @swagger
 * /api/v1/catalogues/{id}:
 *   get:
 *     summary: Get single catalogue
 *     tags: [Catalogues]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getCatalogue);

/**
 * @swagger
 * /api/v1/catalogues:
 *   post:
 *     summary: Create catalogue
 *     tags: [Catalogues]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  handleFileUploads,
  createCatalogue
);

/**
 * @swagger
 * /api/v1/catalogues/{id}:
 *   put:
 *     summary: Update catalogue
 *     tags: [Catalogues]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  handleFileUploads,
  updateCatalogue
);

/**
 * @swagger
 * /api/v1/catalogues/{id}:
 *   delete:
 *     summary: Delete catalogue
 *     tags: [Catalogues]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteCatalogue);

module.exports = router;

