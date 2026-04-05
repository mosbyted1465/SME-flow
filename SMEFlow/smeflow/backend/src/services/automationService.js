const cron = require('node-cron');
const Task = require('../models/Task');
const logger = require('../utils/logger');
const { isLocalDataMode } = require('../config/dataMode');
const localStore = require('../data/localStore');

/**
 * Core automation logic: find all non-completed tasks past their due date
 * and escalate their status and priority.
 *
 * This is extracted from the cron callback so it can be tested/run independently.
 */
const escalateOverdueTasks = async () => {
  const now = new Date();

  logger.info(`[Automation] Running overdue task escalation at ${now.toISOString()}`);

  try {
    const result = isLocalDataMode()
      ? await localStore.updateManyTasks(
          {
            dueDate: { $lt: now },
            status: { $nin: ['COMPLETED', 'OVERDUE'] },
          },
          {
            $set: {
              status: 'OVERDUE',
              priority: 'HIGH_PRIORITY',
              autoEscalatedAt: now,
            },
          }
        )
      : await Task.updateMany(
          {
            dueDate: { $lt: now },
            status: { $nin: ['COMPLETED', 'OVERDUE'] },
          },
          {
            $set: {
              status: 'OVERDUE',
              priority: 'HIGH_PRIORITY',
              autoEscalatedAt: now,
            },
          }
        );

    logger.info(
      `[Automation] Escalated ${result.modifiedCount} overdue task(s). ` +
        `Matched: ${result.matchedCount}`
    );

    return {
      matched: result.matchedCount,
      escalated: result.modifiedCount,
      ranAt: now,
    };
  } catch (err) {
    logger.error(`[Automation] Escalation job failed: ${err.message}`, { stack: err.stack });
    throw err;
  }
};

/**
 * Registers the cron schedule.
 * Default: midnight every day ("0 0 * * *")
 * Configurable via CRON_SCHEDULE env variable.
 */
const startAutomationJobs = () => {
  const schedule = process.env.CRON_SCHEDULE || '0 0 * * *';

  if (!cron.validate(schedule)) {
    logger.error(`[Automation] Invalid CRON_SCHEDULE: "${schedule}". Job not started.`);
    return;
  }

  cron.schedule(schedule, async () => {
    await escalateOverdueTasks();
  });

  logger.info(`[Automation] Overdue task escalation job scheduled: "${schedule}"`);
};

module.exports = { startAutomationJobs, escalateOverdueTasks };
