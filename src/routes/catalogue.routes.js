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
    const logger = require('../utils/logger');
    
    logger.info('File upload middleware:', {
      hasFiles: !!req.files,
      filesKeys: req.files ? Object.keys(req.files) : [],
      bodyKeys: Object.keys(req.body || {}),
    });

    // Check if there are actual files to upload (not just URL strings)
    if (req.files) {
      const uploadPromises = [];

      if (req.files.image && req.files.image.length > 0) {
        const imageFile = req.files.image[0];
        logger.info('Processing image file:', {
          hasBuffer: !!imageFile.buffer,
          bufferLength: imageFile.buffer?.length || 0,
          originalname: imageFile.originalname,
          mimetype: imageFile.mimetype,
        });
        
        // Only upload if it's actually a file (has buffer), not a URL string
        if (imageFile.buffer && imageFile.buffer.length > 0) {
          try {
            uploadPromises.push(
              uploadToCloudinary(imageFile, {
                folder: 'uzaempower/catalogues',
                resource_type: 'image',
              }).then(result => {
                logger.info('Image uploaded to Cloudinary:', result.secure_url);
                return { type: 'image', url: result.secure_url, publicId: result.public_id };
              }).catch(err => {
                logger.error('Cloudinary image upload error:', err);
                throw err;
              })
            );
          } catch (err) {
            logger.error('Error setting up image upload:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to upload image',
              error: err.message,
            });
          }
        } else if (imageFile.originalname && typeof imageFile.originalname === 'string' && imageFile.originalname.startsWith('http')) {
          // It's a URL string, use it directly
          logger.info('Using existing image URL:', imageFile.originalname);
          req.body.image = imageFile.originalname;
        }
      }

      if (req.files.file && req.files.file.length > 0) {
        const pdfFile = req.files.file[0];
        logger.info('Processing PDF file:', {
          hasBuffer: !!pdfFile.buffer,
          bufferLength: pdfFile.buffer?.length || 0,
          originalname: pdfFile.originalname,
          mimetype: pdfFile.mimetype,
        });
        
        // Only upload if it's actually a file (has buffer), not a URL string
        if (pdfFile.buffer && pdfFile.buffer.length > 0) {
          try {
            uploadPromises.push(
              uploadToCloudinary(pdfFile, {
                folder: 'uzaempower/catalogues',
                resource_type: 'auto',
              }).then(result => {
                logger.info('PDF uploaded to Cloudinary:', result.secure_url);
                return { type: 'file', url: result.secure_url, publicId: result.public_id };
              }).catch(err => {
                logger.error('Cloudinary PDF upload error:', err);
                throw err;
              })
            );
          } catch (err) {
            logger.error('Error setting up PDF upload:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to upload PDF',
              error: err.message,
            });
          }
        } else if (pdfFile.originalname && typeof pdfFile.originalname === 'string' && pdfFile.originalname.startsWith('http')) {
          // It's a URL string, use it directly
          logger.info('Using existing PDF URL:', pdfFile.originalname);
          req.body.file = pdfFile.originalname;
        }
      }

      if (uploadPromises.length > 0) {
        try {
          const results = await Promise.all(uploadPromises);
          
          // Attach URLs to request body
          results.forEach(result => {
            if (result.type === 'image') {
              req.body.image = result.url;
            } else if (result.type === 'file') {
              req.body.file = result.url;
            }
          });
          
          logger.info('File uploads completed:', {
            imageUrl: req.body.image ? 'set' : 'missing',
            fileUrl: req.body.file ? 'set' : 'missing',
          });
        } catch (uploadError) {
          logger.error('File upload promise error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: uploadError.message,
          });
        }
      }
    }
    
    // Also check req.body for URL strings (when sent as form data fields)
    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('http')) {
      logger.info('Using image URL from body:', req.body.image);
    }
    if (req.body.file && typeof req.body.file === 'string' && req.body.file.startsWith('http')) {
      logger.info('Using file URL from body:', req.body.file);
    }
    
    next();
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('File upload middleware error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
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

