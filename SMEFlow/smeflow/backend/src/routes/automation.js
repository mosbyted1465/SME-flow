const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { escalateOverdueTasks } = require('../services/automationService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Manual trigger (admin only) — useful for testing without waiting for cron
router.post(
  '/run-escalation',
  protect,
  restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const result = await escalateOverdueTasks();
    res.status(200).json({ status: 'success', data: result });
  })
);

module.exports = router;
