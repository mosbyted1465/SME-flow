const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { isLocalDataMode } = require('./config/dataMode');

const globalErrorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route modules
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const taskRoutes = require('./routes/tasks');
const invoiceRoutes = require('./routes/invoices');
const automationRoutes = require('./routes/automation');

const app = express();

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// HTTP request logging (skip in test env)
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// Health check
app.get('/health', (req, res) => {
  const dbConnected = isLocalDataMode() || mongoose.connection.readyState === 1;
  const database = isLocalDataMode() ? 'local-file' : dbConnected ? 'connected' : 'disconnected';

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
  });
});

// API routes
const API_PREFIX = '/api/v1';

app.use(API_PREFIX, (req, res, next) => {
  if (!isLocalDataMode() && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database is unavailable. Start MongoDB or update MONGODB_URI, then try again.',
    });
  }

  next();
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/invoices`, invoiceRoutes);
app.use(`${API_PREFIX}/automation`, automationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
