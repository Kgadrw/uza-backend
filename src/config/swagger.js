const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UZA Empower API',
      version: '1.0.0',
      description: 'Backend API documentation for UZA Empower platform - Donor, Beneficiary, and Admin dashboards',
      contact: {
        name: 'UZA Empower',
        email: 'info@uzaempower.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
      ...(process.env.BACKEND_URL && process.env.BACKEND_URL !== 'http://localhost:5000' ? [{
        url: 'http://localhost:5000',
        description: 'Local development server',
      }] : []),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token (without "Bearer" prefix)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['donor', 'beneficiary', 'admin'],
              example: 'donor',
            },
            phone: {
              type: 'string',
              example: '+250788123456',
            },
            address: {
              type: 'string',
              example: 'Kigali, Rwanda',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              example: 'Vegetable Farming Project',
            },
            description: {
              type: 'string',
              example: 'A project to support vegetable farming',
            },
            beneficiary: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            category: {
              type: 'string',
              enum: ['Agriculture', 'Livestock', 'Aquaculture', 'Beekeeping', 'Other'],
              example: 'Agriculture',
            },
            location: {
              type: 'string',
              example: 'Kicukiro, Rwanda',
            },
            fundingGoal: {
              type: 'number',
              example: 5000000,
            },
            totalFunded: {
              type: 'number',
              example: 3500000,
            },
            status: {
              type: 'string',
              enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],
              example: 'active',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './server.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

