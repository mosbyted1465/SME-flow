const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { isLocalDataMode } = require('../config/dataMode');
const localStore = require('../data/localStore');

const ensureInvoiceAccess = (invoice, userId) => {
  if (!invoice) {
    throw new AppError('Invoice not found.', 404);
  }

  const ownerId =
    typeof invoice.createdBy === 'object' && invoice.createdBy !== null
      ? invoice.createdBy._id
      : invoice.createdBy;

  if (ownerId !== userId) {
    throw new AppError('Invoice not found.', 404);
  }
};

const createInvoice = async (data, userId) => {
  const customer = isLocalDataMode()
    ? await localStore.findCustomerById(data.customer)
    : await Customer.findById(data.customer);
  if (!customer || !customer.isActive) {
    throw new AppError('Customer not found.', 404);
  }

  const invoice = isLocalDataMode()
    ? await localStore.createInvoice(data, userId)
    : await Invoice.create({ ...data, createdBy: userId });

  logger.info(`Invoice ${invoice.invoiceNumber} created for customer ${data.customer}`);

  if (isLocalDataMode()) {
    return invoice;
  }

  return Invoice.findById(invoice._id).populate('customer', 'name email company');
};

const getInvoices = async (userId, query = {}) => {
  const filter = { createdBy: userId };

  if (query.status) filter.status = query.status;
  if (query.customer) filter.customer = query.customer;

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  if (isLocalDataMode()) {
    return localStore.listInvoices(filter, { page, limit });
  }

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

const getInvoiceById = async (invoiceId, userId) => {
  const invoice = isLocalDataMode()
    ? await localStore.findInvoiceById(invoiceId)
    : await Invoice.findById(invoiceId)
        .populate('customer', 'name email company phone')
        .populate('createdBy', 'name email');

  ensureInvoiceAccess(invoice, userId);
  return invoice;
};

const updateInvoiceStatus = async (invoiceId, status, userId) => {
  await getInvoiceById(invoiceId, userId);
  const update = { status };

  if (status === 'PAID') {
    update.paidAt = new Date();
  }

  const invoice = isLocalDataMode()
    ? await localStore.updateInvoice(invoiceId, update)
    : await Invoice.findByIdAndUpdate(invoiceId, { $set: update }, { new: true, runValidators: true })
        .populate('customer', 'name email company');

  if (!invoice) throw new AppError('Invoice not found.', 404);

  logger.info(`Invoice ${invoice.invoiceNumber} status updated to ${status}`);
  return invoice;
};

const getDashboardStats = async (userId) => {
  if (isLocalDataMode()) {
    return localStore.getDashboardStats(userId);
  }

  const [
    totalCustomers,
    totalTasks,
    totalInvoices,
    tasksByStatus,
    invoicesByStatus,
    recentInvoices,
  ] = await Promise.all([
    require('../models/Customer').countDocuments({ isActive: true, createdBy: userId }),
    require('../models/Task').countDocuments({ assignedTo: userId }),
    Invoice.countDocuments({ createdBy: userId }),
    require('../models/Task').aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
    Invoice.find({ status: { $ne: 'CANCELLED' }, createdBy: userId })
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
