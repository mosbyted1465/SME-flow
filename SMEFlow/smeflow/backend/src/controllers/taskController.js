const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user._id);
  res.status(201).json({ status: 'success', data: { task } });
});

const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.user._id, req.query);
  res.status(200).json({ status: 'success', data: result });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user._id);
  res.status(200).json({ status: 'success', data: { task } });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body, req.user._id);
  res.status(200).json({ status: 'success', data: { task } });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user._id);
  res.status(204).json({ status: 'success', data: null });
});

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };
