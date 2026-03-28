# SMEFlow — Integrated CRM, Workflow & Automation Platform

A production-grade full-stack prototype built with Node.js/Express, MongoDB/Mongoose, and React. Demonstrates modular backend architecture, JWT authentication, relational data modeling, and scheduled automation.

---

## Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Backend    | Node.js 18+, Express.js 4             |
| Database   | MongoDB 6+ with Mongoose ODM           |
| Auth       | JWT (jsonwebtoken) + bcryptjs          |
| Validation | express-validator                      |
| Scheduling | node-cron                              |
| Logging    | Winston                                |
| Frontend   | React 18, React Router 6, Axios        |

---

## Project Structure

```
smeflow/
├── backend/
│   ├── src/
│   │   ├── controllers/        # HTTP layer — parse req, call service, send res
│   │   │   ├── authController.js
│   │   │   ├── customerController.js
│   │   │   ├── taskController.js
│   │   │   └── invoiceController.js
│   │   ├── models/             # Mongoose schemas & virtuals
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Task.js
│   │   │   └── Invoice.js
│   │   ├── routes/             # Express routers with validation chains
│   │   │   ├── auth.js
│   │   │   ├── customers.js
│   │   │   ├── tasks.js
│   │   │   ├── invoices.js
│   │   │   └── automation.js
│   │   ├── services/           # Business logic, isolated from HTTP
│   │   │   ├── authService.js
│   │   │   ├── customerService.js
│   │   │   ├── taskService.js
│   │   │   ├── invoiceService.js
│   │   │   └── automationService.js   ← cron + escalation logic
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT protect + restrictTo RBAC
│   │   │   ├── errorHandler.js # Global error normalization
│   │   │   └── validate.js     # express-validator result handler
│   │   ├── utils/
│   │   │   ├── logger.js       # Winston logger (console + file)
│   │   │   ├── AppError.js     # Operational error class
│   │   │   └── asyncHandler.js # Eliminates try/catch boilerplate
│   │   ├── app.js              # Express app setup (no DB logic)
│   │   └── index.js            # DB connect + server start + graceful shutdown
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js  # React auth state + localStorage persistence
    │   ├── services/
    │   │   └── api.js          # Axios instance with JWT interceptor
    │   ├── components/
    │   │   ├── Layout.js       # Sidebar shell
    │   │   ├── ProtectedRoute.js
    │   │   └── UI.js           # Badge, Modal, EmptyState, Spinner, Alert
    │   ├── pages/
    │   │   ├── AuthPage.js     # Login + Signup (toggled)
    │   │   ├── Dashboard.js    # Stats + task breakdown + recent invoices
    │   │   ├── CustomersPage.js
    │   │   ├── TasksPage.js    # Filter by status, inline status editing
    │   │   └── InvoicesPage.js # Inline status dropdown, filter tabs
    │   ├── App.js              # Router + AuthProvider
    │   ├── index.js
    │   └── index.css           # Design system (CSS variables, dark theme)
    └── package.json
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run dev         # nodemon, hot-reload on :5000
```

### Frontend

```bash
cd frontend
npm install
npm start           # CRA dev server on :3000, proxied to :5000
```

The `"proxy": "http://localhost:5000"` in `frontend/package.json` routes all `/api/*` calls to the backend during development.

---

## API Reference

All endpoints are prefixed `/api/v1`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth
| Method | Endpoint         | Auth | Description        |
|--------|-----------------|------|--------------------|
| POST   | /auth/signup    | No   | Register user      |
| POST   | /auth/login     | No   | Login, get JWT     |
| GET    | /auth/me        | Yes  | Current user info  |

### Customers
| Method | Endpoint          | Description                        |
|--------|------------------|------------------------------------|
| GET    | /customers        | List (pagination, search)          |
| POST   | /customers        | Create customer                    |
| GET    | /customers/:id    | Get with tasks + invoices          |
| PATCH  | /customers/:id    | Update fields                      |
| DELETE | /customers/:id    | Soft delete (isActive: false)      |

### Tasks
| Method | Endpoint      | Description                             |
|--------|-------------|-----------------------------------------|
| GET    | /tasks       | List (filter: status, priority, assignedTo, customer) |
| POST   | /tasks       | Create linked to customer + user        |
| GET    | /tasks/:id   | Get with populated refs                 |
| PATCH  | /tasks/:id   | Update status / priority / any field   |
| DELETE | /tasks/:id   | Hard delete                             |

### Invoices
| Method | Endpoint                    | Description                     |
|--------|----------------------------|---------------------------------|
| GET    | /invoices                   | List (filter: status, customer) |
| POST   | /invoices                   | Create (auto-assigns INV-XXXXX) |
| GET    | /invoices/:id               | Get with customer details       |
| PATCH  | /invoices/:id               | Update status (sets paidAt if PAID) |
| GET    | /invoices/dashboard/stats   | Aggregate counts + revenue      |

### Automation (Admin Only)
| Method | Endpoint                        | Description                          |
|--------|--------------------------------|--------------------------------------|
| POST   | /automation/run-escalation      | Manually trigger overdue escalation  |

---

## Automation — Overdue Task Escalation

Defined in `src/services/automationService.js`:

```js
// Runs daily at midnight (configurable via CRON_SCHEDULE env var)
cron.schedule('0 0 * * *', async () => {
  await Task.updateMany(
    { dueDate: { $lt: now }, status: { $nin: ['COMPLETED', 'OVERDUE'] } },
    { $set: { status: 'OVERDUE', priority: 'HIGH_PRIORITY', autoEscalatedAt: now } }
  );
});
```

- Compound index on `{ dueDate: 1, status: 1 }` makes the query efficient at scale
- `escalateOverdueTasks()` is extracted from the cron callback → testable in isolation
- Admin can trigger manually via `POST /api/v1/automation/run-escalation`

---

## Data Relationships

```
User ──────────────── creates ──→ Customer
User ──────────────── assignedTo ──→ Task
Customer ──────────── has many ──→ Task
Customer ──────────── has many ──→ Invoice
```

Mongoose virtuals on `Customer` populate `tasks` and `invoices` when you call `getCustomerById` — avoiding denormalization while keeping queries clean.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Services layer | Controllers stay thin (parse → call → respond). Business logic is portable and testable without HTTP. |
| `asyncHandler` wrapper | Removes repetitive try/catch from every controller. Errors propagate to the global handler. |
| `AppError` class | Distinguishes operational errors (user-facing, known status codes) from programmer errors (500s). |
| Soft delete on Customer | Preserves referential integrity — tasks/invoices linked to the customer remain intact. |
| `select: false` on password | Password hash is never accidentally serialized into API responses. |
| Separated `app.js` / `index.js` | `app.js` has no side effects (DB, server) — easier to import in tests without starting the server. |
| Invoice number pre-save hook | Auto-increments `INV-00001` style numbers atomically at the DB layer, not in application code. |

---

## Environment Variables

| Variable          | Default                          | Description                         |
|-------------------|----------------------------------|-------------------------------------|
| `PORT`            | 5000                             | HTTP server port                    |
| `MONGODB_URI`     | mongodb://localhost:27017/smeflow| MongoDB connection string           |
| `JWT_SECRET`      | —                                | **Required.** Secret for signing JWTs |
| `JWT_EXPIRES_IN`  | 7d                               | JWT expiry duration                 |
| `BCRYPT_SALT_ROUNDS` | 12                            | bcrypt work factor                  |
| `CRON_SCHEDULE`   | `0 0 * * *`                      | Cron expression for task escalation |
| `CLIENT_ORIGIN`   | http://localhost:3000            | Allowed CORS origin                 |
| `NODE_ENV`        | development                      | Affects logging verbosity + error detail |
