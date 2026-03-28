const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const createCustomer = async (data, userId) => {
  const existing = await Customer.findOne({ email: data.email });
  if (existing) {
    throw new AppError('A customer with this email already exists.', 409);
  }

  const customer = await Customer.create({ ...data, createdBy: userId });
  logger.info(`Customer created: ${customer.email} by user ${userId}`);
  return customer;
};

const getCustomers = async (userId, query = {}) => {
  const filter = { isActive: true };

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

const getCustomerById = async (customerId) => {
  const customer = await Customer.findById(customerId)
    .populate('createdBy', 'name email')
    .populate({ path: 'tasks', select: 'title status priority dueDate' })
    .populate({ path: 'invoices', select: 'invoiceNumber amount status createdAt' });

  if (!customer || !customer.isActive) {
    throw new AppError('Customer not found.', 404);
  }

  return customer;
};

const updateCustomer = async (customerId, data) => {
  // Prevent email conflicts
  if (data.email) {
    const conflict = await Customer.findOne({ email: data.email, _id: { $ne: customerId } });
    if (conflict) {
      throw new AppError('Another customer with this email already exists.', 409);
    }
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!customer) throw new AppError('Customer not found.', 404);

  logger.info(`Customer updated: ${customerId}`);
  return customer;
};

const deleteCustomer = async (customerId) => {
  // Soft delete
  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { isActive: false },
    { new: true }
  );

  if (!customer) throw new AppError('Customer not found.', 404);
  logger.info(`Customer soft-deleted: ${customerId}`);
};

module.exports = { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer };
