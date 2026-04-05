require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'data', 'local-db.json');
const PASSWORD = 'Password@123';
const CUSTOMERS_PER_USER = 320;
const TASKS_PER_CUSTOMER = 2;

const companies = [
  {
    name: 'Nimbus Labs',
    domain: 'nimbuslabs.com',
    user: { name: 'Aarav Mehta', role: 'admin' },
    sectors: ['SaaS', 'Fintech', 'Retail Tech', 'Healthcare Tech'],
  },
  {
    name: 'BluePeak Logistics',
    domain: 'bluepeaklogistics.com',
    user: { name: 'Priya Nair', role: 'user' },
    sectors: ['Logistics', 'Manufacturing', 'Wholesale', 'Supply Chain'],
  },
  {
    name: 'VertexForge',
    domain: 'vertexforge.io',
    user: { name: 'Rohan Kapoor', role: 'user' },
    sectors: ['AI Services', 'Consulting', 'Automation', 'B2B Software'],
  },
];

const firstNames = [
  'Arjun', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Meera', 'Reyansh', 'Kiara',
  'Aditya', 'Saanvi', 'Ira', 'Laksh', 'Mira', 'Ayaan', 'Myra', 'Vivaan',
  'Aisha', 'Neel', 'Riya', 'Tara', 'Ishaan', 'Naina', 'Kunal', 'Zara',
];

const lastNames = [
  'Sharma', 'Patel', 'Gupta', 'Singh', 'Das', 'Joshi', 'Bose', 'Khanna',
  'Bhat', 'Pillai', 'Verma', 'Kulkarni', 'Sethi', 'Jain', 'Agarwal', 'Menon',
];

const cityPrefixes = [
  'North', 'South', 'East', 'West', 'Central', 'New', 'Lake', 'Hill',
];

const cityBases = [
  'Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur',
  'Ahmedabad', 'Surat', 'Kochi', 'Lucknow', 'Indore', 'Nagpur', 'Noida',
];

const companyNouns = [
  'Systems', 'Solutions', 'Ventures', 'Partners', 'Works', 'Industries',
  'Networks', 'Foods', 'Dynamics', 'Motors', 'Enterprises', 'Advisors',
];

const taskTitles = [
  'Follow up on onboarding',
  'Prepare quarterly review',
  'Resolve billing concern',
  'Share renewal proposal',
  'Schedule executive demo',
  'Validate implementation scope',
  'Review support escalations',
  'Confirm deployment readiness',
];

const taskDescriptions = [
  'Coordinate with the account champion and capture blockers before the next checkpoint.',
  'Review recent activity, contract value, and expansion potential with the stakeholder team.',
  'Tighten the open items list so operations can move this customer to the next stage.',
  'Document risks, action items, and the owner for each remaining milestone.',
];

const invoiceNotes = [
  'Monthly subscription and support retainer.',
  'Implementation milestone billing.',
  'Advisory services for process optimization.',
  'Renewal invoice with volume discount applied.',
];

const taskStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'HIGH_PRIORITY', 'CRITICAL'];
const invoiceStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const toIso = (date) => date.toISOString();

const objectId = () => crypto.randomBytes(12).toString('hex');

const pick = (items, index) => items[index % items.length];

const customerName = (index) => `${pick(firstNames, index)} ${pick(lastNames, index * 3)}`;

const customerCompany = (company, index) => {
  const city = `${pick(cityPrefixes, index)} ${pick(cityBases, index * 5)}`;
  return `${city} ${pick(company.sectors, index)} ${pick(companyNouns, index * 7)}`;
};

const customerEmail = (name, companyName, index) => {
  const slug = `${name}.${companyName}.${index}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
  return `${slug}@clientmail.io`;
};

const customerPhone = (index) => `+91 98${String(10000000 + index).slice(-8)}`;

const buildUsers = async () => {
  const password = await bcrypt.hash(PASSWORD, parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12);
  const createdAt = toIso(daysAgo(120));

  return companies.map((company, index) => ({
    _id: objectId(),
    name: company.user.name,
    email: `ops${index + 1}@${company.domain}`,
    password,
    role: company.user.role,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  }));
};

const buildDataset = async () => {
  const users = await buildUsers();
  const customers = [];
  const tasks = [];
  const invoices = [];

  let invoiceCounter = 1;

  users.forEach((user, userIndex) => {
    const company = companies[userIndex];

    for (let i = 0; i < CUSTOMERS_PER_USER; i += 1) {
      const globalIndex = userIndex * CUSTOMERS_PER_USER + i + 1;
      const name = customerName(globalIndex);
      const companyName = customerCompany(company, globalIndex);
      const createdAt = toIso(daysAgo(180 - (globalIndex % 150)));
      const customerId = objectId();

      customers.push({
        _id: customerId,
        name,
        email: customerEmail(name, companyName, globalIndex),
        phone: customerPhone(globalIndex),
        company: companyName,
        createdBy: user._id,
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      });

      for (let t = 0; t < TASKS_PER_CUSTOMER; t += 1) {
        const taskIndex = globalIndex * TASKS_PER_CUSTOMER + t;
        const status = pick(taskStatuses, taskIndex);
        const dueDate =
          status === 'COMPLETED'
            ? daysAgo((taskIndex % 45) + 3)
            : status === 'OVERDUE'
              ? daysAgo((taskIndex % 20) + 1)
              : daysFromNow((taskIndex % 35) + 1);
        const createdTaskAt = toIso(daysAgo((taskIndex % 120) + 1));

        tasks.push({
          _id: objectId(),
          title: `${pick(taskTitles, taskIndex)} for ${name}`,
          description: pick(taskDescriptions, taskIndex),
          status,
          priority: pick(taskPriorities, taskIndex + userIndex),
          dueDate: toIso(dueDate),
          customer: customerId,
          assignedTo: user._id,
          createdBy: user._id,
          autoEscalatedAt: status === 'OVERDUE' ? toIso(daysAgo(taskIndex % 10)) : null,
          createdAt: createdTaskAt,
          updatedAt: createdTaskAt,
        });
      }

      const invoiceTotal = 1 + (globalIndex % 2);
      for (let inv = 0; inv < invoiceTotal; inv += 1) {
        const invoiceIndex = globalIndex + inv;
        const status = pick(invoiceStatuses, invoiceIndex);
        const createdInvoiceAt = toIso(daysAgo(invoiceIndex % 90));
        const dueDate = toIso(daysFromNow((invoiceIndex % 40) - 10));
        const amount = 1500 + ((invoiceIndex * 137) % 12000);

        invoices.push({
          _id: objectId(),
          invoiceNumber: `INV-${String(invoiceCounter).padStart(5, '0')}`,
          customer: customerId,
          amount,
          status,
          dueDate,
          paidAt: status === 'PAID' ? toIso(daysAgo(invoiceIndex % 30)) : null,
          notes: pick(invoiceNotes, invoiceIndex),
          createdBy: user._id,
          createdAt: createdInvoiceAt,
          updatedAt: createdInvoiceAt,
        });

        invoiceCounter += 1;
      }
    }
  });

  return { users, customers, tasks, invoices };
};

const writeDb = async () => {
  const dataset = await buildDataset();
  fs.writeFileSync(DB_FILE, JSON.stringify(dataset, null, 2));

  console.log(`Seeded local data into ${DB_FILE}`);
  console.log(`Users: ${dataset.users.length}`);
  console.log(`Customers: ${dataset.customers.length}`);
  console.log(`Tasks: ${dataset.tasks.length}`);
  console.log(`Invoices: ${dataset.invoices.length}`);
  console.log(`Login password for all users: ${PASSWORD}`);
  console.log('User logins:');
  dataset.users.forEach((user) => console.log(`- ${user.email}`));
};

writeDb().catch((error) => {
  console.error(error);
  process.exit(1);
});
