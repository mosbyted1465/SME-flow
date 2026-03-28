const Task = require('../models/Task');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const createTask = async (data, userId) => {
  const customer = await Customer.findById(data.customer);
  if (!customer || !customer.isActive) {
    throw new AppError('Customer not found.', 404);
  }

  const task = await Task.create({ ...data, createdBy: userId });

  logger.info(`Task created: "${task.title}" for customer ${data.customer} by user ${userId}`);
  return task.populate([
    { path: 'customer', select: 'name email company' },
    { path: 'assignedTo', select: 'name email' },
  ]);
};

const getTasks = async (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.customer) filter.customer = query.customer;

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('customer', 'name email company')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return { tasks, total, page, totalPages: Math.ceil(total / limit) };
};

const getTaskById = async (taskId) => {
  const task = await Task.findById(taskId)
    .populate('customer', 'name email company')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

  if (!task) throw new AppError('Task not found.', 404);
  return task;
};

const updateTask = async (taskId, data) => {
  const task = await Task.findByIdAndUpdate(taskId, { $set: data }, { new: true, runValidators: true })
    .populate('customer', 'name email company')
    .populate('assignedTo', 'name email');

  if (!task) throw new AppError('Task not found.', 404);

  logger.info(`Task updated: ${taskId} → status: ${task.status}, priority: ${task.priority}`);
  return task;
};

const deleteTask = async (taskId) => {
  const task = await Task.findByIdAndDelete(taskId);
  if (!task) throw new AppError('Task not found.', 404);
  logger.info(`Task deleted: ${taskId}`);
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
