const { successResponse, errorResponse } = require('../utils/response');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const logger = require('../utils/logger');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // Upload to cloud storage
    const result = await uploadToCloudinary(req.file, {
      folder: 'uzaempower',
      resource_type: 'auto',
    });

    return successResponse(
      res,
      {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      },
      'File uploaded successfully'
    );
  } catch (error) {
    logger.error('Upload file error:', error);
    return errorResponse(res, 'File upload failed', 500);
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    // Implement file deletion logic
    return successResponse(res, null, 'File deleted successfully');
  } catch (error) {
    logger.error('Delete file error:', error);
    return errorResponse(res, 'File deletion failed', 500);
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};

