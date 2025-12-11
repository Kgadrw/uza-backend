const { successResponse, errorResponse } = require('../utils/response');
const { exportToCSV, exportToPDF } = require('../services/export.service');
const logger = require('../utils/logger');

const exportData = async (req, res) => {
  try {
    const { type, dataType, data } = req.body;

    if (!type || !dataType || !data) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    let result;
    if (type === 'csv') {
      result = await exportToCSV(data, dataType);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}-${Date.now()}.csv`);
    } else if (type === 'pdf') {
      result = await exportToPDF(data, dataType);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}-${Date.now()}.pdf`);
    } else {
      return errorResponse(res, 'Invalid export type', 400);
    }

    return res.send(result);
  } catch (error) {
    logger.error('Export data error:', error);
    return errorResponse(res, 'Export failed', 500);
  }
};

module.exports = {
  exportData,
};

