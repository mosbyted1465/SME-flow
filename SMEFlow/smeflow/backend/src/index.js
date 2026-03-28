require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');
const { startAutomationJobs } = require('./services/automationService');
const fs = require('fs');

// Ensure logs directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smeflow';

// ─── Database Connection ────────────────────────────────────────────────────
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    // Start HTTP server only after DB is ready
    const server = app.listen(PORT, () => {
      logger.info(`SMEFlow API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    // Register cron-based automation jobs
    startAutomationJobs();

    // ─── Graceful Shutdown ────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

// ─── Unhandled Rejections ───────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});
