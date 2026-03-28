const mongoose = require('mongoose');

const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'HIGH_PRIORITY', 'CRITICAL'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Task must be linked to a customer'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to a user'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Automation tracking
    autoEscalatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1, status: 1 }); // critical for cron job query
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ customer: 1 });

// Virtual: is this task overdue?
taskSchema.virtual('isOverdue').get(function () {
  return this.status !== 'COMPLETED' && this.dueDate < new Date();
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
