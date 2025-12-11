require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const logger = require('../src/utils/logger');

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - be careful in production!)
    // await User.deleteMany({});
    // await Project.deleteMany({});

    // Create admin user
    const admin = await User.findOne({ email: 'admin@uzaempower.com' });
    if (!admin) {
      await User.create({
        name: 'Admin User',
        email: 'admin@uzaempower.com',
        password: 'Admin123!',
        role: 'admin',
      });
      logger.info('Admin user created');
    }

    // Create donor user
    const donor = await User.findOne({ email: 'donor@example.com' });
    if (!donor) {
      await User.create({
        name: 'Donor User',
        email: 'donor@example.com',
        password: 'Donor123!',
        role: 'donor',
      });
      logger.info('Donor user created');
    }

    // Create beneficiary user
    const beneficiary = await User.findOne({ email: 'beneficiary@example.com' });
    if (!beneficiary) {
      await User.create({
        name: 'Beneficiary User',
        email: 'beneficiary@example.com',
        password: 'Beneficiary123!',
        role: 'beneficiary',
      });
      logger.info('Beneficiary user created');
    }

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();

