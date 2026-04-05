const Task = require('../models/Task');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { isLocalDataMode } = require('../config/dataMode');
const localStore = require('../data/localStore');

const ensureTaskAccess = (task, userId) => {
  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  const ownerId =
    typeof task.createdBy === 'object' && task.createdBy !== null ? task.createdBy._id : task.createdBy;
  const assigneeId =
    typeof task.assignedTo === 'object' && task.assignedTo !== null ? task.assignedTo._id : task.assignedTo;

  if (ownerId !== userId && assigneeId !== userId) {
    throw new AppError('Task not found.', 404);
  }
};

const createTask = async (data, userId) => {
  const customer = isLocalDataMode()
    ? await localStore.findCustomerById(data.customer)
    : await Customer.findById(data.customer);
  if (!customer || !customer.isActive) {
    throw new AppError('Customer not found.', 404);
  }

  const task = isLocalDataMode()
    ? await localStore.createTask(data, userId)
    : await Task.create({ ...data, createdBy: userId });

  logger.info(`Task created: "${task.title}" for customer ${data.customer} by user ${userId}`);
  if (isLocalDataMode()) {
    return task;
  }

  return task.populate([
    { path: 'customer', select: 'name email company' },
    { path: 'assignedTo', select: 'name email' },
  ]);
};

const getTasks = async (userId, query = {}) => {
  const filter = { assignedTo: userId };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.customer) filter.customer = query.customer;

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  if (isLocalDataMode()) {
    return localStore.listTasks(filter, { page, limit });
  }

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

const getTaskById = async (taskId, userId) => {
  const task = isLocalDataMode()
    ? await localStore.findTaskById(taskId)
    : await Task.findById(taskId)
        .populate('customer', 'name email company')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

  ensureTaskAccess(task, userId);
  return task;
};

const updateTask = async (taskId, data, userId) => {
  await getTaskById(taskId, userId);
  const task = isLocalDataMode()
    ? await localStore.updateTask(taskId, data)
    : await Task.findByIdAndUpdate(taskId, { $set: data }, { new: true, runValidators: true })
        .populate('customer', 'name email company')
        .populate('assignedTo', 'name email');

  if (!task) throw new AppError('Task not found.', 404);

  logger.info(`Task updated: ${taskId} → status: ${task.status}, priority: ${task.priority}`);
  return task;
};

const deleteTask = async (taskId, userId) => {
  await getTaskById(taskId, userId);
  const task = isLocalDataMode()
    ? await localStore.deleteTask(taskId)
    : await Task.findByIdAndDelete(taskId);
  if (!task) throw new AppError('Task not found.', 404);
  logger.info(`Task deleted: ${taskId}`);
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
