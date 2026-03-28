const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All customer routes require authentication
router.use(protect);

router
  .route('/')
  .get(customerController.getCustomers)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Customer name is required'),
      body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
      body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
      body('company').optional().trim(),
    ],
    validate,
    customerController.createCustomer
  );

router
  .route('/:id')
  .get(customerController.getCustomer)
  .patch(
    [
      body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
      body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
    ],
    validate,
    customerController.updateCustomer
  )
  .delete(customerController.deleteCustomer);

module.exports = router;
