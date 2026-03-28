const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const createInvoice = async (data, userId) => {
  const customer = await Customer.findById(data.customer);
  if (!customer || !customer.isActive) {
    throw new AppError('Customer not found.', 404);
  }

  const invoice = await Invoice.create({ ...data, createdBy: userId });

  logger.info(`Invoice ${invoice.invoiceNumber} created for customer ${data.customer}`);

  return Invoice.findById(invoice._id).populate('customer', 'name email company');
};

const getInvoices = async (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.customer) filter.customer = query.customer;

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('customer', 'name email company')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return { invoices, total, page, totalPages: Math.ceil(total / limit) };
};

const getInvoiceById = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId)
    .populate('customer', 'name email company phone')
    .populate('createdBy', 'name email');

  if (!invoice) throw new AppError('Invoice not found.', 404);
  return invoice;
};

const updateInvoiceStatus = async (invoiceId, status) => {
  const update = { status };

  if (status === 'PAID') {
    update.paidAt = new Date();
  }

  const invoice = await Invoice.findByIdAndUpdate(invoiceId, { $set: update }, { new: true, runValidators: true })
    .populate('customer', 'name email company');

  if (!invoice) throw new AppError('Invoice not found.', 404);

  logger.info(`Invoice ${invoice.invoiceNumber} status updated to ${status}`);
  return invoice;
};

const getDashboardStats = async () => {
  const [
    totalCustomers,
    totalTasks,
    totalInvoices,
    tasksByStatus,
    invoicesByStatus,
    recentInvoices,
  ] = await Promise.all([
    require('../models/Customer').countDocuments({ isActive: true }),
    require('../models/Task').countDocuments(),
    Invoice.countDocuments(),
    require('../models/Task').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
    Invoice.find({ status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name'),
  ]);

  return {
    counts: { totalCustomers, totalTasks, totalInvoices },
    tasksByStatus: tasksByStatus.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
    invoicesByStatus: invoicesByStatus.reduce(
      (acc, { _id, count, total }) => ({ ...acc, [_id]: { count, total } }),
      {}
    ),
    recentInvoices,
  };
};

module.exports = { createInvoice, getInvoices, getInvoiceById, updateInvoiceStatus, getDashboardStats };
