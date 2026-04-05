require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');

const app = require('./app');
const logger = require('./utils/logger');
const { startAutomationJobs } = require('./services/automationService');
const { isLocalDataMode } = require('./config/dataMode');

// Ensure logs directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smeflow';
const DB_RETRY_MS = parseInt(process.env.DB_RETRY_MS, 10) || 5000;

let automationStarted = false;
let reconnectTimer = null;

const server = app.listen(PORT, () => {
  logger.info(`SMEFlow API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const scheduleReconnect = () => {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToDatabase();
  }, DB_RETRY_MS);
};

const connectToDatabase = async () => {
  if (isLocalDataMode()) {
    logger.info('Using local file storage mode. MongoDB connection skipped.');

    if (!automationStarted) {
      startAutomationJobs();
      automationStarted = true;
    }

    return;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    if (!automationStarted) {
      startAutomationJobs();
      automationStarted = true;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  } catch (err) {
    logger.error(
      `Failed to connect to MongoDB: ${err.message}. Retrying in ${DB_RETRY_MS / 1000}s.`
    );
    scheduleReconnect();
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

connectToDatabase();

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  server.close(async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});
