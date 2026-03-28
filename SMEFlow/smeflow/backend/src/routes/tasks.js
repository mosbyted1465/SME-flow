const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(taskController.getTasks)
  .post(
    [
      body('title').trim().notEmpty().withMessage('Task title is required'),
      body('customer').isMongoId().withMessage('Valid customer ID is required'),
      body('assignedTo').isMongoId().withMessage('Valid user ID is required'),
      body('dueDate').isISO8601().withMessage('Valid due date is required'),
      body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
        .withMessage('Invalid priority value'),
      body('status')
        .optional()
        .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
        .withMessage('Invalid status value'),
    ],
    validate,
    taskController.createTask
  );

router
  .route('/:id')
  .get(taskController.getTask)
  .patch(
    [
      body('status')
        .optional()
        .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'])
        .withMessage('Invalid status value'),
      body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'HIGH_PRIORITY', 'CRITICAL'])
        .withMessage('Invalid priority value'),
      body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
    ],
    validate,
    taskController.updateTask
  )
  .delete(taskController.deleteTask);

module.exports = router;
