const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');
const Catalogue = require('../models/Catalogue');

// Get all catalogues (public endpoint - no auth required)
const getCatalogues = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const catalogues = await Catalogue.find(query)
      .select('-createdBy')
      .sort({ createdAt: -1 });

    return successResponse(res, { catalogues }, 'Catalogues retrieved successfully');
  } catch (error) {
    logger.error('Get catalogues error:', error);
    return errorResponse(res, 'Failed to retrieve catalogues', 500);
  }
};

// Get all catalogues (admin endpoint - includes inactive)
const getAllCatalogues = async (req, res) => {
  try {
    const { page, limit, skip, sort } = getPaginationParams(req);
    const { search, category } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const catalogues = await Catalogue.find(query)
      .populate('createdBy', 'name email')
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Catalogue.countDocuments(query);

    return paginatedResponse(
      res,
      catalogues,
      getPaginationMeta(page, limit, total),
      'Catalogues retrieved successfully'
    );
  } catch (error) {
    logger.error('Get all catalogues error:', error);
    return errorResponse(res, 'Failed to retrieve catalogues', 500);
  }
};

// Get single catalogue
const getCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const catalogue = await Catalogue.findById(id).populate('createdBy', 'name email');

    if (!catalogue) {
      return errorResponse(res, 'Catalogue not found', 404);
    }

    return successResponse(res, { catalogue }, 'Catalogue retrieved successfully');
  } catch (error) {
    logger.error('Get catalogue error:', error);
    return errorResponse(res, 'Failed to retrieve catalogue', 500);
  }
};

// Create catalogue
const createCatalogue = async (req, res) => {
  try {
    logger.info('Create catalogue request:', {
      body: req.body,
      hasFiles: !!req.files,
      filesKeys: req.files ? Object.keys(req.files) : [],
    });

    const { title, category, description } = req.body;
    const imageUrl = req.files?.image?.[0]?.url || req.body.image;
    const fileUrl = req.files?.file?.[0]?.url || req.body.file;

    logger.info('Parsed data:', { title, category, description, imageUrl: !!imageUrl, fileUrl: !!fileUrl });

    if (!title || !category || !description) {
      return errorResponse(res, 'Title, category, and description are required', 400);
    }

    if (!imageUrl) {
      logger.warn('Image URL missing:', { hasFiles: !!req.files, imageFile: req.files?.image, bodyImage: req.body.image });
      return errorResponse(res, 'Catalogue image is required', 400);
    }

    if (!fileUrl) {
      logger.warn('File URL missing:', { hasFiles: !!req.files, fileFile: req.files?.file, bodyFile: req.body.file });
      return errorResponse(res, 'Catalogue file is required', 400);
    }

    const catalogue = await Catalogue.create({
      title,
      category,
      description,
      image: imageUrl,
      file: fileUrl,
      createdBy: req.user?._id || null,
    });

    const populatedCatalogue = await Catalogue.findById(catalogue._id)
      .populate('createdBy', 'name email');

    return successResponse(res, { catalogue: populatedCatalogue }, 'Catalogue created successfully', 201);
  } catch (error) {
    logger.error('Create catalogue error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return errorResponse(res, `Failed to create catalogue: ${error.message}`, 500);
  }
};

// Update catalogue
const updateCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, isActive } = req.body;
    const imageUrl = req.files?.image?.[0]?.url;
    const fileUrl = req.files?.file?.[0]?.url;

    const updateData = {};
    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (imageUrl) updateData.image = imageUrl;
    if (fileUrl) updateData.file = fileUrl;

    const catalogue = await Catalogue.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!catalogue) {
      return errorResponse(res, 'Catalogue not found', 404);
    }

    return successResponse(res, { catalogue }, 'Catalogue updated successfully');
  } catch (error) {
    logger.error('Update catalogue error:', error);
    return errorResponse(res, 'Failed to update catalogue', 500);
  }
};

// Delete catalogue
const deleteCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const catalogue = await Catalogue.findByIdAndDelete(id);

    if (!catalogue) {
      return errorResponse(res, 'Catalogue not found', 404);
    }

    return successResponse(res, null, 'Catalogue deleted successfully');
  } catch (error) {
    logger.error('Delete catalogue error:', error);
    return errorResponse(res, 'Failed to delete catalogue', 500);
  }
};

module.exports = {
  getCatalogues,
  getAllCatalogues,
  getCatalogue,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
};

