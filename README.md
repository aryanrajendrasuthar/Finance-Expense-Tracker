# FinTrack — Finance & Expense Tracker

A full-stack personal finance management application built with Node.js, Express, PostgreSQL, Redis, React, and TypeScript.

---

## Features

- **Authentication** — JWT-based register/login with secure password hashing (bcryptjs)
- **Transactions** — Create, edit, delete income & expense records with category tagging, recurring flags, date filters, full-text search, and CSV import/export
- **Budgets** — Set monthly spending limits per category with real-time progress tracking and exceeded/alert notifications
- **Dashboard** — KPI cards (total income, expenses, net balance, savings rate) + monthly income vs expense line chart + spending-by-category pie chart
- **Categories** — System default categories plus custom user-defined ones with colors and icons
- **Redis Caching** — Stats endpoints cached for 10 minutes; cache invalidated automatically on any transaction mutation; graceful fallback when Redis is unavailable
- **Docker** — Full docker-compose setup for one-command deployment

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Node.js 20, Express.js 4               |
| Database   | PostgreSQL 16, Sequelize ORM 6         |
| Cache      | Redis 7, ioredis 5                     |
| Auth       | JWT (jsonwebtoken), bcryptjs           |
| File I/O   | multer (upload), csv-parser, csv-stringify |
| Frontend   | React 18, TypeScript, Vite             |
| Styling    | Tailwind CSS                           |
| Charts     | Recharts                               |
| HTTP       | Axios with request/response interceptors |
| Routing    | React Router v6                        |

---

## Project Structure

```
Fin&Exp Tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # Sequelize + PostgreSQL connection
│   │   │   └── redis.js          # ioredis client with graceful fallback
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT verification middleware
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Category.js       # Default categories seeded on startup
│   │   │   ├── Transaction.js
│   │   │   ├── Budget.js
│   │   │   └── index.js          # Associations + seedDatabase()
│   │   ├── routes/
│   │   │   ├── auth.js           # /api/auth
│   │   │   ├── categories.js     # /api/categories
│   │   │   ├── transactions.js   # /api/transactions (CRUD + CSV)
│   │   │   ├── budgets.js        # /api/budgets
│   │   │   └── stats.js          # /api/stats (cached)
│   │   └── server.js
│   ├── .env                      # Local environment (git-ignored)
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Budgets/
│   │   │   │   └── BudgetProgress.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── MonthlyLineChart.tsx
│   │   │   │   └── SpendingPieChart.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── Transactions/
│   │   │   │   ├── TransactionModal.tsx
│   │   │   │   └── CSVImport.tsx
│   │   │   └── ui/
│   │   │       └── Modal.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Budgets.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── services/
│   │   │   └── api.ts            # Axios instance + all API calls
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional — stats work without it)
- npm 9+

### Local Development

**1. Clone and set up the backend**

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm install
npm run dev
```

The backend will start on `http://localhost:3001`. It automatically:
- Connects to PostgreSQL and syncs all tables
- Seeds 13 default categories (salary, food, housing, etc.)
- Gracefully connects to Redis (continues without it if unavailable)

**2. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` with a Vite proxy forwarding `/api/*` to the backend.

---

## Docker Deployment

```bash
docker-compose up --build
```

This starts:
- **postgres** — PostgreSQL on port 5432
- **redis** — Redis on port 6379
- **backend** — API server on port 3001
- **frontend** — Nginx serving the React build on port 80

Access the app at `http://localhost`.

To stop and remove volumes:

```bash
docker-compose down -v
```

---

## Environment Variables

| Variable        | Default               | Description                    |
|-----------------|-----------------------|--------------------------------|
| PORT            | 3001                  | Backend HTTP port              |
| DB_HOST         | localhost             | PostgreSQL host                |
| DB_PORT         | 5432                  | PostgreSQL port                |
| DB_NAME         | fintracker            | Database name                  |
| DB_USER         | postgres              | Database user                  |
| DB_PASSWORD     | —                     | Database password              |
| REDIS_HOST      | localhost             | Redis host                     |
| REDIS_PORT      | 6379                  | Redis port                     |
| REDIS_PASSWORD  | (empty)               | Redis password (optional)      |
| JWT_SECRET      | —                     | Secret for signing JWT tokens  |
| JWT_EXPIRES_IN  | 7d                    | Token expiry                   |
| CLIENT_URL      | http://localhost:5173 | Frontend URL (CORS origin)     |

---

## API Reference

All endpoints (except auth) require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path        | Body                         | Description          |
|--------|-------------|------------------------------|----------------------|
| POST   | /register   | name, email, password        | Create account       |
| POST   | /login      | email, password              | Sign in, get token   |
| GET    | /me         | —                            | Current user profile |

### Transactions — `/api/transactions`

| Method | Path        | Description                           |
|--------|-------------|---------------------------------------|
| GET    | /           | List with filters, pagination, search |
| POST   | /           | Create transaction                    |
| PUT    | /:id        | Update transaction                    |
| DELETE | /:id        | Delete transaction                    |
| GET    | /export     | Download all as CSV                   |
| POST   | /import     | Upload CSV file (multipart/form-data) |

**GET query params:** `type`, `categoryId`, `startDate`, `endDate`, `search`, `sortBy`, `sortOrder`, `page`, `limit`

### Budgets — `/api/budgets`

| Method | Path  | Description                          |
|--------|-------|--------------------------------------|
| GET    | /     | List budgets for `?month=YYYY-MM`    |
| POST   | /     | Create budget (categoryId, limit, month) |
| PUT    | /:id  | Update budget limit                  |
| DELETE | /:id  | Delete budget                        |

Each budget response includes `spent`, `percentage`, `alert` (≥80%), `exceeded` (>100%) computed fields.

### Stats — `/api/stats` (Redis-cached, 10 min TTL)

| Method | Path         | Description                              |
|--------|--------------|------------------------------------------|
| GET    | /overview    | Total income, expenses, net balance, savings rate |
| GET    | /monthly     | Monthly income/expenses for `?year=YYYY` |
| GET    | /categories  | Spending by category for `?month=YYYY-MM&type=expense` |

### Categories — `/api/categories`

| Method | Path  | Description                             |
|--------|-------|-----------------------------------------|
| GET    | /     | All categories (user + system defaults) |
| POST   | /     | Create custom category                  |
| PUT    | /:id  | Update category                         |
| DELETE | /:id  | Delete category                         |

---

## CSV Import Format

The import endpoint accepts a CSV file with these columns (header row required):

```
Date,Amount,Type,Category,Description,Recurring,RecurringInterval
2024-01-15,1500.00,income,Salary,January salary,false,
2024-01-20,45.50,expense,Food & Dining,Grocery run,false,
2024-01-21,9.99,expense,Entertainment,Netflix,true,monthly
```

- **Date**: `YYYY-MM-DD`
- **Type**: `income` or `expense`
- **Category**: matched case-insensitively against existing categories
- **Recurring**: `true` or `false`
- **RecurringInterval**: `daily`, `weekly`, `monthly`, or `yearly` (only when Recurring=true)

---

## Default Categories

| Icon | Name            | Type    |
|------|-----------------|---------|
| 💰   | Salary          | income  |
| 💻   | Freelance       | income  |
| 📈   | Investment      | income  |
| 💵   | Other Income    | income  |
| 🍔   | Food & Dining   | expense |
| 🚗   | Transportation  | expense |
| 🏠   | Housing         | expense |
| 🎬   | Entertainment   | expense |
| 🛍️  | Shopping        | expense |
| 🏥   | Healthcare      | expense |
| ⚡   | Utilities       | expense |
| 📚   | Education       | expense |
| 📦   | Other           | expense |

---

## Budget Alert System

- When a transaction is created or updated, the backend checks if the category has an active budget for that month
- If spending reaches **80%** of the budget limit, `alert: true` is set
- If spending exceeds **100%**, `exceeded: true` is set
- The transaction creation response includes the budget alert status
- The frontend `TransactionModal` displays an inline warning when an alert is returned

---

## License

MIT
