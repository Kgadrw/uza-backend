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
    // Check if there are actual files to upload (not just URL strings)
    if (req.files) {
      const uploadPromises = [];

      if (req.files.image && req.files.image.length > 0) {
        const imageFile = req.files.image[0];
        // Only upload if it's actually a file (has buffer), not a URL string
        if (imageFile.buffer && imageFile.buffer.length > 0) {
          uploadPromises.push(
            uploadToCloudinary(imageFile, {
              folder: 'uzaempower/catalogues',
              resource_type: 'image',
            }).then(result => ({ type: 'image', url: result.secure_url, publicId: result.public_id }))
          );
        } else if (imageFile.originalname && typeof imageFile.originalname === 'string' && imageFile.originalname.startsWith('http')) {
          // It's a URL string, use it directly
          req.body.image = imageFile.originalname;
        }
      }

      if (req.files.file && req.files.file.length > 0) {
        const pdfFile = req.files.file[0];
        // Only upload if it's actually a file (has buffer), not a URL string
        if (pdfFile.buffer && pdfFile.buffer.length > 0) {
          uploadPromises.push(
            uploadToCloudinary(pdfFile, {
              folder: 'uzaempower/catalogues',
              resource_type: 'auto',
            }).then(result => ({ type: 'file', url: result.secure_url, publicId: result.public_id }))
          );
        } else if (pdfFile.originalname && typeof pdfFile.originalname === 'string' && pdfFile.originalname.startsWith('http')) {
          // It's a URL string, use it directly
          req.body.file = pdfFile.originalname;
        }
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
    
    // Also check req.body for URL strings (when sent as form data fields)
    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('http')) {
      // Already a URL, keep it
    }
    if (req.body.file && typeof req.body.file === 'string' && req.body.file.startsWith('http')) {
      // Already a URL, keep it
    }
    
    next();
  } catch (error) {
    console.error('File upload error:', error);
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

