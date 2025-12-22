require('dotenv').config();
require('express-async-errors');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { connectDB } = require('./src/config/database');
const { initializeRedis } = require('./src/config/redis');
const { initializeSentry } = require('./src/config/sentry');
const { errorHandler } = require('./src/middleware/errorHandler');
const { notFound } = require('./src/middleware/notFound');
const logger = require('./src/utils/logger');

// Import routes
const setupRoutes = require('./src/routes/setup.routes');
const authRoutes = require('./src/routes/auth.routes');
const donorRoutes = require('./src/routes/donor.routes');
const beneficiaryRoutes = require('./src/routes/beneficiary.routes');
const adminRoutes = require('./src/routes/admin.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const exportRoutes = require('./src/routes/export.routes');
const reportRoutes = require('./src/routes/report.routes');
const catalogueRoutes = require('./src/routes/catalogue.routes');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Sentry (must be before other middleware)
if (process.env.NODE_ENV === 'production') {
  initializeSentry(app);
}

// Security middleware
app.use(helmet());

// CORS configuration - support multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://uzasolutions.com',
  'https://www.uzasolutions.com',
  process.env.CORS_ORIGIN
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'UZA Empower API Documentation',
}));

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';
// Setup routes (no authentication required, but only works if no admin exists)
app.use(`/api/${API_VERSION}/setup`, setupRoutes);
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/donor`, donorRoutes);
app.use(`/api/${API_VERSION}/beneficiary`, beneficiaryRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);
app.use(`/api/${API_VERSION}/export`, exportRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/catalogues`, catalogueRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ MongoDB connected');

    // Initialize Redis
    await initializeRedis();
    logger.info('✅ Redis connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;

