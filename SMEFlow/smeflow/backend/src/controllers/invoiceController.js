const invoiceService = require('../services/invoiceService');
const asyncHandler = require('../utils/asyncHandler');

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user._id);
  res.status(201).json({ status: 'success', data: { invoice } });
});

const getInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.getInvoices(req.query);
  res.status(200).json({ status: 'success', data: result });
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  res.status(200).json({ status: 'success', data: { invoice } });
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateInvoiceStatus(req.params.id, req.body.status);
  res.status(200).json({ status: 'success', data: { invoice } });
});

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await invoiceService.getDashboardStats();
  res.status(200).json({ status: 'success', data: stats });
});

module.exports = { createInvoice, getInvoices, getInvoice, updateInvoiceStatus, getDashboard };
