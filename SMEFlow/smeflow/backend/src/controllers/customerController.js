const customerService = require('../services/customerService');
const asyncHandler = require('../utils/asyncHandler');

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user._id);
  res.status(201).json({ status: 'success', data: { customer } });
});

const getCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomers(req.user._id, req.query);
  res.status(200).json({ status: 'success', data: result });
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.status(200).json({ status: 'success', data: { customer } });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { customer } });
});

const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

module.exports = { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer };
