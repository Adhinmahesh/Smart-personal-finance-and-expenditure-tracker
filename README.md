## Smart Personal Finance & Expenditure Tracker
 
A full-stack personal finance platform for tracking expenses and income, planning monthly budgets, comparing planned vs. actual spending, and managing loan repayment schedules.
 
**Stack:** Python (Flask) · React (TypeScript) · ShaktiDB · Vite
 
---
 
## Overview
 
Smart Finance Tracker is a full-stack application that consolidates expense tracking, income logging, budget planning, variance analysis, and loan repayment management into a single interface. The backend is a Flask REST API backed by ShaktiDB(Postgresql), and the frontend is a React + TypeScript single-page application built with Vite.
 
The UI follows a neumorphic (soft UI) design system, implemented as a shared component library so that styling stays consistent across pages.
 
---
## Features
 
### Dashboard
- Summary metric cards for total balance, monthly spending, total income, and net savings.
- Income vs. spending trend chart over time.
- Recent activity feed for newly logged transactions.
### Expense & Income Tracking
- Records support custom categories, payment methods, dates, and notes.
- Color-coded category tags for quick visual scanning.
- Category breakdowns via bar and pie charts (Recharts).
### Budget Planning & Variance Analysis
- Per-category monthly spending limits.
- Progress bars that flag categories approaching or exceeding their limit.
- Planned vs. actual comparison to track variance against savings goals.
### Loan & Debt Tracking
- Supports multiple concurrent loans (personal, auto, mortgage, etc.) with individual terms.
- Configurable weekly or monthly due-date reminders.
- Incremental payment logging with automatic recalculation of outstanding principal.
### Security Implementation
- Primary keys use UUIDv4 instead of sequential IDs, to prevent IDOR (insecure direct object reference) attacks.
- All inputs are validated through Marshmallow schemas, including numeric bounds checking and password complexity rules.
- Authentication uses short-lived JWT access tokens with 7-day refresh tokens. Logout is enforced server-side via a PostgreSQL `jwt_blocklist` table, so revoked tokens are rejected immediately rather than waiting for natural expiry.
- Login is rate-limited via Flask-Limiter (5 attempts/minute on `/auth/login`) to mitigate brute-force attempts.
---
 
## Architecture
 
The codebase separates domain logic, HTTP transport, and UI rendering into distinct layers on both the backend and frontend.
 
```text
tracker/
├── backend/
│   ├── app.py                     # Application entry point; Flask-Limiter configuration
│   ├── config.py                  # Environment variable loading & validation
│   ├── init_db.py                 # Database schema provisioning
│   ├── requirements.txt           # Python dependencies
│   ├── migrate_uuid.py            # Migration: SERIAL -> UUIDv4 primary keys
│   ├── migrate_blocklist.py       # Migration: creates jwt_blocklist table
│   │
│   ├── models/                    # Database entity models
│   │   ├── user.py                # User credentials & profile
│   │   ├── transaction.py         # Income / expense transactions
│   │   ├── loan.py                # Loan terms & payment history
│   │   ├── category.py            # Custom categories
│   │   ├── budget.py              # Monthly spending targets
│   │   ├── report.py              # Analytics summaries
│   │   └── token.py               # Token blocklist
│   │
│   ├── schemas/                   # Marshmallow validation layers
│   │   ├── user_schema.py         # Password & email validation
│   │   ├── transaction_schema.py  # Amount bounds, date format validation
│   │   ├── loan_schema.py         # Loan payload validation
│   │   ├── category_schema.py     # Category name & hex color validation
│   │   └── budget_schema.py       # Budget threshold validation
│   │
│   ├── services/                  # Business logic, decoupled from routes
│   │   ├── auth_service.py        # Auth lifecycle, token issuance/revocation
│   │   ├── transaction_service.py # Transaction CRUD
│   │   ├── loan_service.py        # Balance recalculation, payment processing
│   │   ├── category_service.py    # Category CRUD
│   │   ├── budget_service.py      # Budget calculations
│   │   └── report_service.py      # Trend aggregation
│   │
│   └── routes/                    # Flask REST controllers
│       ├── auth.py                # /api/auth/*
│       ├── transactions.py        # /api/transactions/*
│       ├── loans.py               # /api/loans/*
│       ├── categories.py          # /api/categories/*
│       ├── budget.py              # /api/budget/*
│       └── reports.py             # /api/reports/*
│
└── frontend/
    ├── package.json
    └── src/
        ├── main.tsx                # React root render
        └── app/
            ├── App.tsx             # Root shell & context providers
            │
            ├── types/
            │   └── index.ts        # Shared TypeScript interfaces (Transaction, Loan, etc.)
            │
            ├── utils/
            │   ├── api.ts          # Fetch wrapper with JWT auth headers
            │   ├── constants.ts    # Design tokens, icon sets, option lists
            │   └── formatters.ts   # Currency/date formatting helpers
            │
            ├── context/
            │   ├── AuthContext.tsx     # Auth session state
            │   └── FinanceContext.tsx  # Centralized data store
            │
            ├── hooks/
            │   ├── useAuth.ts
            │   ├── useTransactions.ts
            │   ├── useLoans.ts
            │   ├── useCategories.ts
            │   └── useBudget.ts
            │
            ├── components/
            │   ├── Layout/         # Sidebar & header
            │   ├── common/         # Buttons, badges, metric cards, tooltips
            │   └── Modals/         # Modal dialogs
            │
            └── pages/
                ├── LoginPage.tsx
                ├── DashboardPage.tsx
                ├── ExpensesPage.tsx
                ├── IncomePage.tsx
                ├── BudgetPage.tsx
                ├── ComparisonPage.tsx
                ├── ReportsPage.tsx
                ├── LoansPage.tsx
                ├── CategoriesPage.tsx
                └── SettingsPage.tsx
```
 
---
 
## Getting Started
 
### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- ShaktiDB running locally on port `5432`
### Backend Setup
 
```bash
cd backend
 
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate
 
# Install dependencies
pip install -r requirements.txt
 
# Run database migrations
python3 migrate_uuid.py
python3 migrate_blocklist.py
 
# Start the server
python3 app.py
```
 
The API runs on `http://localhost:5000`.
 
### Frontend Setup
 
```bash
cd frontend
 
# Install dependencies
npm install
 
# Start the dev server
npm run dev
```
 
The frontend runs on `http://localhost:5173`.
 
---
 
## API Reference
 
| Method | Endpoint | Description | Rate Limit |
|--------|----------|--------------|------------|
| POST | `/api/auth/signup` | Register a new account | 3/min |
| POST | `/api/auth/login` | Authenticate, receive JWT token pair | 5/min |
| POST | `/api/auth/refresh` | Rotate an expiring access token | 200/min |
| POST | `/api/auth/logout` | Revoke the current JWT server-side | 200/min |
| GET | `/api/transactions` | List the user's financial records | 200/min |
| POST | `/api/transactions` | Create an expense or income record | 200/min |
| GET | `/api/loans` | List the user's loans | 200/min |
| POST | `/api/loans/:id/pay` | Submit a loan payment | 200/min |
| GET | `/api/budget` | List category spending targets | 200/min |
 
---
 
## Roadmap
 
- [x] Security hardening — Marshmallow schemas, JWT blocklist, rate limiting
- [x] Service layer refactor with centralized error handling
- [x] UUIDv4 primary keys and cascade constraints
- [x] Frontend modularization — hooks and context state
- [ ] Declarative routing and environment-based API configuration
- [ ] End-to-end test suites (pytest, vitest)
- [ ] Docker Compose orchestration with Gunicorn WSGI deployment
 
