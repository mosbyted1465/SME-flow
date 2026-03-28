const express = require('express');
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// Dashboard stats - must be before /:id
router.get('/dashboard/stats', invoiceController.getDashboard);

router
  .route('/')
  .get(invoiceController.getInvoices)
  .post(
    [
      body('customer').isMongoId().withMessage('Valid customer ID is required'),
      body('amount').isFloat({ min: 0 }).withMessage('Amount must be a non-negative number'),
      body('status')
        .optional()
        .isIn(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
        .withMessage('Invalid invoice status'),
      body('dueDate').optional().isISO8601().withMessage('Valid due date required'),
    ],
    validate,
    invoiceController.createInvoice
  );

router
  .route('/:id')
  .get(invoiceController.getInvoice)
  .patch(
    [
      body('status')
        .isIn(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
        .withMessage('Invalid invoice status'),
    ],
    validate,
    invoiceController.updateInvoiceStatus
  );

module.exports = router;
