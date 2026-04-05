const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DB_DIR, 'local-db.json');

const EMPTY_DB = {
  users: [],
  customers: [],
  tasks: [],
  invoices: [],
};

const ensureDbFile = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
};

const readDb = () => {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return raw ? JSON.parse(raw) : { ...EMPTY_DB };
};

const writeDb = (db) => {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const generateId = () => crypto.randomBytes(12).toString('hex');

const nowIso = () => new Date().toISOString();

const normalizeEmail = (email) => email.trim().toLowerCase();

const stripPassword = (user) => {
  if (!user) return null;
  const next = clone(user);
  delete next.password;
  return next;
};

const pickFields = (doc, fields) => {
  if (!doc || !fields) return doc;
  const selected = {};

  for (const field of fields.split(/\s+/).filter(Boolean)) {
    if (Object.prototype.hasOwnProperty.call(doc, field)) {
      selected[field] = doc[field];
    }
  }

  if (doc._id) selected._id = doc._id;
  return selected;
};

const getComparableValue = (value) => {
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return value;
};

const matchesCondition = (value, condition) => {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.$regex !== undefined) {
      const regex = new RegExp(condition.$regex, condition.$options || '');
      return regex.test(String(value || ''));
    }

    if (condition.$ne !== undefined) {
      return value !== condition.$ne;
    }

    if (condition.$nin) {
      return !condition.$nin.includes(value);
    }

    if (condition.$lt !== undefined) {
      return getComparableValue(value) < getComparableValue(condition.$lt);
    }
  }

  return value === condition;
};

const matchesFilter = (doc, filter = {}) => {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') {
      return value.some((entry) => matchesFilter(doc, entry));
    }

    return matchesCondition(doc[key], value);
  });
};

const sortDocs = (docs, sortSpec = {}) => {
  const entries = Object.entries(sortSpec);
  if (!entries.length) return docs;

  return [...docs].sort((left, right) => {
    for (const [field, direction] of entries) {
      const leftValue = getComparableValue(left[field]);
      const rightValue = getComparableValue(right[field]);

      if (leftValue < rightValue) return direction < 0 ? 1 : -1;
      if (leftValue > rightValue) return direction < 0 ? -1 : 1;
    }

    return 0;
  });
};

const paginate = (docs, { skip = 0, limit = docs.length } = {}) => docs.slice(skip, skip + limit);

const populateUser = (db, userId, fields, { includePassword = false } = {}) => {
  const user = db.users.find((entry) => entry._id === userId && entry.isActive !== false);
  if (!user) return null;
  const selected = fields ? pickFields(user, fields) : clone(user);
  return includePassword ? selected : stripPassword(selected);
};

const populateCustomer = (db, customer, { includeRelations = false, createdByFields = 'name email' } = {}) => {
  if (!customer) return null;
  const result = clone(customer);
  result.createdBy = populateUser(db, customer.createdBy, createdByFields);

  if (includeRelations) {
    result.tasks = db.tasks
      .filter((task) => task.customer === customer._id)
      .map((task) => pickFields(task, 'title status priority dueDate createdAt'));
    result.invoices = db.invoices
      .filter((invoice) => invoice.customer === customer._id)
      .map((invoice) => pickFields(invoice, 'invoiceNumber amount status createdAt'));
  }

  return result;
};

const populateTask = (
  db,
  task,
  {
    customerFields = 'name email company',
    assignedToFields = 'name email',
    createdByFields = 'name',
  } = {}
) => {
  if (!task) return null;
  const result = clone(task);
  result.customer = populateCustomer(db, db.customers.find((entry) => entry._id === task.customer), {
    createdByFields: customerFields,
  });
  result.customer = result.customer ? pickFields(result.customer, customerFields) : null;
  result.assignedTo = populateUser(db, task.assignedTo, assignedToFields);
  result.createdBy = populateUser(db, task.createdBy, createdByFields);
  return result;
};

const populateInvoice = (
  db,
  invoice,
  {
    customerFields = 'name email company',
    createdByFields = 'name',
  } = {}
) => {
  if (!invoice) return null;
  const result = clone(invoice);
  const customer = db.customers.find((entry) => entry._id === invoice.customer);
  result.customer = customer ? pickFields(customer, customerFields) : null;
  result.createdBy = populateUser(db, invoice.createdBy, createdByFields);
  return result;
};

const applyUpdate = (doc, update) => {
  if (update.$set) {
    Object.assign(doc, update.$set);
  } else {
    Object.assign(doc, update);
  }

  doc.updatedAt = nowIso();
};

const createUser = async ({ name, email, password, role = 'user' }) => {
  const db = readDb();
  const normalizedEmail = normalizeEmail(email);
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const hashedPassword = await bcrypt.hash(password, rounds);
  const timestamp = nowIso();

  const user = {
    _id: generateId(),
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.users.push(user);
  writeDb(db);

  return stripPassword(user);
};

const findUserByEmail = async (email, { includePassword = false, activeOnly = false } = {}) => {
  const db = readDb();
  const normalizedEmail = normalizeEmail(email);
  const user = db.users.find(
    (entry) => entry.email === normalizedEmail && (!activeOnly || entry.isActive !== false)
  );

  if (!user) return null;
  return includePassword ? clone(user) : stripPassword(user);
};

const findUserById = async (userId, { includePassword = false } = {}) => {
  const db = readDb();
  const user = db.users.find((entry) => entry._id === userId);
  if (!user) return null;
  return includePassword ? clone(user) : stripPassword(user);
};

const createCustomer = async (data, userId) => {
  const db = readDb();
  const timestamp = nowIso();
  const customer = {
    _id: generateId(),
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    phone: data.phone || '',
    company: data.company || '',
    createdBy: userId,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.customers.push(customer);
  writeDb(db);
  return populateCustomer(db, customer);
};

const findCustomerByEmail = async (email, excludeId = null) => {
  const db = readDb();
  const normalizedEmail = normalizeEmail(email);
  const customer = db.customers.find(
    (entry) => entry.email === normalizedEmail && entry._id !== excludeId
  );
  return customer ? clone(customer) : null;
};

const findCustomerById = async (customerId, { includeRelations = false } = {}) => {
  const db = readDb();
  const customer = db.customers.find((entry) => entry._id === customerId);
  return populateCustomer(db, customer, { includeRelations });
};

const listCustomers = async (filter, { page = 1, limit = 20 } = {}) => {
  const db = readDb();
  const skip = (page - 1) * limit;
  const customers = sortDocs(
    db.customers.filter((entry) => matchesFilter(entry, filter)),
    { createdAt: -1 }
  );

  return {
    customers: paginate(customers, { skip, limit }).map((customer) => populateCustomer(db, customer)),
    total: customers.length,
    page,
    totalPages: Math.ceil(customers.length / limit) || 1,
  };
};

const updateCustomer = async (customerId, data) => {
  const db = readDb();
  const customer = db.customers.find((entry) => entry._id === customerId);
  if (!customer) return null;

  const next = { ...data };
  if (next.email) next.email = normalizeEmail(next.email);
  applyUpdate(customer, next);
  writeDb(db);
  return populateCustomer(db, customer);
};

const softDeleteCustomer = async (customerId) => {
  const db = readDb();
  const customer = db.customers.find((entry) => entry._id === customerId);
  if (!customer) return null;
  customer.isActive = false;
  customer.updatedAt = nowIso();
  writeDb(db);
  return populateCustomer(db, customer);
};

const createTask = async (data, userId) => {
  const db = readDb();
  const timestamp = nowIso();
  const task = {
    _id: generateId(),
    title: data.title.trim(),
    description: data.description || '',
    status: data.status || 'PENDING',
    priority: data.priority || 'MEDIUM',
    dueDate: new Date(data.dueDate).toISOString(),
    customer: data.customer,
    assignedTo: data.assignedTo,
    createdBy: userId,
    autoEscalatedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.tasks.push(task);
  writeDb(db);
  return populateTask(db, task);
};

const findTaskById = async (taskId) => {
  const db = readDb();
  const task = db.tasks.find((entry) => entry._id === taskId);
  return populateTask(db, task, { createdByFields: 'name email' });
};

const listTasks = async (filter, { page = 1, limit = 20 } = {}) => {
  const db = readDb();
  const skip = (page - 1) * limit;
  const tasks = sortDocs(db.tasks.filter((entry) => matchesFilter(entry, filter)), {
    dueDate: 1,
    createdAt: -1,
  });

  return {
    tasks: paginate(tasks, { skip, limit }).map((task) => populateTask(db, task)),
    total: tasks.length,
    page,
    totalPages: Math.ceil(tasks.length / limit) || 1,
  };
};

const updateTask = async (taskId, data) => {
  const db = readDb();
  const task = db.tasks.find((entry) => entry._id === taskId);
  if (!task) return null;
  const next = { ...data };
  if (next.dueDate) next.dueDate = new Date(next.dueDate).toISOString();
  applyUpdate(task, next);
  writeDb(db);
  return populateTask(db, task);
};

const deleteTask = async (taskId) => {
  const db = readDb();
  const index = db.tasks.findIndex((entry) => entry._id === taskId);
  if (index === -1) return null;
  const [task] = db.tasks.splice(index, 1);
  writeDb(db);
  return clone(task);
};

const updateManyTasks = async (filter, update) => {
  const db = readDb();
  let matchedCount = 0;
  let modifiedCount = 0;

  for (const task of db.tasks) {
    if (!matchesFilter(task, filter)) continue;
    matchedCount += 1;
    applyUpdate(task, update);
    modifiedCount += 1;
  }

  writeDb(db);
  return { matchedCount, modifiedCount };
};

const createInvoice = async (data, userId) => {
  const db = readDb();
  const timestamp = nowIso();
  const invoice = {
    _id: generateId(),
    invoiceNumber: `INV-${String(db.invoices.length + 1).padStart(5, '0')}`,
    customer: data.customer,
    amount: Number(data.amount),
    status: data.status || 'DRAFT',
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    paidAt: null,
    notes: data.notes || '',
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.invoices.push(invoice);
  writeDb(db);
  return populateInvoice(db, invoice);
};

const findInvoiceById = async (invoiceId) => {
  const db = readDb();
  const invoice = db.invoices.find((entry) => entry._id === invoiceId);
  return populateInvoice(db, invoice, {
    customerFields: 'name email company phone',
    createdByFields: 'name email',
  });
};

const listInvoices = async (filter, { page = 1, limit = 20 } = {}) => {
  const db = readDb();
  const skip = (page - 1) * limit;
  const invoices = sortDocs(
    db.invoices.filter((entry) => matchesFilter(entry, filter)),
    { createdAt: -1 }
  );

  return {
    invoices: paginate(invoices, { skip, limit }).map((invoice) => populateInvoice(db, invoice)),
    total: invoices.length,
    page,
    totalPages: Math.ceil(invoices.length / limit) || 1,
  };
};

const updateInvoice = async (invoiceId, update) => {
  const db = readDb();
  const invoice = db.invoices.find((entry) => entry._id === invoiceId);
  if (!invoice) return null;
  const next = { ...update };
  if (next.dueDate) next.dueDate = new Date(next.dueDate).toISOString();
  if (next.paidAt instanceof Date) next.paidAt = next.paidAt.toISOString();
  applyUpdate(invoice, next);
  writeDb(db);
  return populateInvoice(db, invoice);
};

const getDashboardStats = async (userId) => {
  const db = readDb();
  const activeCustomers = db.customers.filter((customer) => customer.isActive && customer.createdBy === userId);
  const userTasks = db.tasks.filter((task) => task.assignedTo === userId);
  const userInvoices = db.invoices.filter((invoice) => invoice.createdBy === userId);
  const tasksByStatus = userTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  const invoicesByStatus = userInvoices.reduce((acc, invoice) => {
    const current = acc[invoice.status] || { count: 0, total: 0 };
    acc[invoice.status] = {
      count: current.count + 1,
      total: current.total + invoice.amount,
    };
    return acc;
  }, {});
  const recentInvoices = sortDocs(
    userInvoices.filter((invoice) => invoice.status !== 'CANCELLED'),
    { createdAt: -1 }
  )
    .slice(0, 5)
    .map((invoice) => populateInvoice(db, invoice, { customerFields: 'name' }));

  return {
    counts: {
      totalCustomers: activeCustomers.length,
      totalTasks: userTasks.length,
      totalInvoices: userInvoices.length,
    },
    tasksByStatus,
    invoicesByStatus,
    recentInvoices,
  };
};

module.exports = {
  createCustomer,
  createInvoice,
  createTask,
  createUser,
  deleteTask,
  findCustomerByEmail,
  findCustomerById,
  findInvoiceById,
  findTaskById,
  findUserByEmail,
  findUserById,
  getDashboardStats,
  listCustomers,
  listInvoices,
  listTasks,
  updateCustomer,
  updateInvoice,
  updateManyTasks,
  updateTask,
  softDeleteCustomer,
};
