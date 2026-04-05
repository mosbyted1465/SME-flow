const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { isLocalDataMode } = require('../config/dataMode');
const localStore = require('../data/localStore');

const ensureCustomerAccess = (customer, userId) => {
  if (!customer || !customer.isActive) {
    throw new AppError('Customer not found.', 404);
  }

  const ownerId =
    typeof customer.createdBy === 'object' && customer.createdBy !== null
      ? customer.createdBy._id
      : customer.createdBy;

  if (ownerId !== userId) {
    throw new AppError('Customer not found.', 404);
  }
};

const createCustomer = async (data, userId) => {
  const existing = isLocalDataMode()
    ? await localStore.findCustomerByEmail(data.email)
    : await Customer.findOne({ email: data.email });
  if (existing) {
    throw new AppError('A customer with this email already exists.', 409);
  }

  const customer = isLocalDataMode()
    ? await localStore.createCustomer(data, userId)
    : await Customer.create({ ...data, createdBy: userId });
  logger.info(`Customer created: ${customer.email} by user ${userId}`);
  return customer;
};

const getCustomers = async (userId, query = {}) => {
  const filter = { isActive: true, createdBy: userId };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { company: { $regex: query.search, $options: 'i' } },
    ];
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  if (isLocalDataMode()) {
    return localStore.listCustomers(filter, { page, limit });
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(filter),
  ]);

  return { customers, total, page, totalPages: Math.ceil(total / limit) };
};

const getCustomerById = async (customerId, userId) => {
  const customer = isLocalDataMode()
    ? await localStore.findCustomerById(customerId, { includeRelations: true })
    : await Customer.findById(customerId)
        .populate('createdBy', 'name email')
        .populate({ path: 'tasks', select: 'title status priority dueDate' })
        .populate({ path: 'invoices', select: 'invoiceNumber amount status createdAt' });

  ensureCustomerAccess(customer, userId);

  return customer;
};

const updateCustomer = async (customerId, data, userId) => {
  await getCustomerById(customerId, userId);
  // Prevent email conflicts
  if (data.email) {
    const conflict = isLocalDataMode()
      ? await localStore.findCustomerByEmail(data.email, customerId)
      : await Customer.findOne({ email: data.email, _id: { $ne: customerId } });
    if (conflict) {
      throw new AppError('Another customer with this email already exists.', 409);
    }
  }

  const customer = isLocalDataMode()
    ? await localStore.updateCustomer(customerId, data)
    : await Customer.findByIdAndUpdate(customerId, { $set: data }, { new: true, runValidators: true });

  if (!customer) throw new AppError('Customer not found.', 404);

  logger.info(`Customer updated: ${customerId}`);
  return customer;
};

const deleteCustomer = async (customerId, userId) => {
  await getCustomerById(customerId, userId);
  // Soft delete
  const customer = isLocalDataMode()
    ? await localStore.softDeleteCustomer(customerId)
    : await Customer.findByIdAndUpdate(customerId, { isActive: false }, { new: true });

  if (!customer) throw new AppError('Customer not found.', 404);
  logger.info(`Customer soft-deleted: ${customerId}`);
};

module.exports = { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer };
