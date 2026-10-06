# Meridian ERP

A full-stack ERP for small and mid-size businesses: sales, purchasing, inventory, double-entry accounting, CRM, HR, payroll and projects in one system. Every sale, purchase, stock movement, payment and payroll run posts a balanced journal entry automatically, so the reports always tie out.

**Stack:** React 19 · Vite · Tailwind CSS 4 · Framer Motion · TanStack Query · Recharts · Express 5 · MongoDB / Mongoose · Cloudinary · PDFKit · JWT

## Modules

| Area | What it does |
| --- | --- |
| **Dashboard** | Cash position, revenue vs expenses (6 months), receivables and overdue invoices, best sellers, low stock, open pipeline, recent activity |
| **CRM** | Drag-and-drop sales pipeline with stage totals; customers and suppliers with live open balances |
| **Sales** | Quotation → confirmed order → delivery → invoice → payment, with PDF invoices |
| **Purchasing** | Purchase order → goods receipt → supplier bill → payment; expense bills (rent, utilities) with expense-account lines and scanned attachments |
| **Inventory** | Products and services, multiple warehouses, weighted-average costing, stock adjustments and transfers, full movement history |
| **Accounting** | Chart of accounts, journal with manual entries and reversals, account ledgers with running balances, profit and loss, balance sheet, trial balance |
| **HR & payroll** | Employees, departments, leave requests with approval and balances, monthly payroll with configurable deductions |
| **Projects** | Projects per client with a task board |
| **Admin** | Company settings, tax rates, users with six roles, audit log |
| **Assistant** | Ask questions about your figures in plain language (any OpenAI-compatible API) |

Also: global search and navigation with **⌘K / Ctrl K**, role-based access on both API and UI, multi-company workspaces (sign up creates a new company with its own chart of accounts).

## How the accounting works

Documents follow a draft → posted lifecycle. Posted documents are never edited; they are voided, which posts a reversing entry and puts back any stock they moved.

| Event | Journal entry |
| --- | --- |
| Deliver a sales order | Dr Cost of goods sold / Cr Inventory (at average cost) |
| Post a customer invoice | Dr Accounts receivable / Cr Sales + Cr VAT payable |
| Receive a purchase order | Dr Inventory / Cr Goods received not invoiced |
| Post a supplier bill | Dr GRNI, Inventory or Expense + Dr VAT receivable / Cr Accounts payable |
| Payment received / sent | Dr Bank / Cr Receivable · Dr Payable / Cr Bank |
| Stock adjustment | Inventory against Inventory adjustments |
| Payroll | Dr Salaries (gross) / Cr Payroll liabilities (deductions) + Cr Bank (net) |

Every entry is validated to balance before it is saved, and multi-step postings run inside MongoDB transactions when the server supports them (Atlas or any replica set).

## Getting started

Requirements: Node 20+, a MongoDB database (MongoDB Atlas free tier works), and optionally a Cloudinary account for uploads.

```bash
npm run install:all

cp server/.env.example server/.env   # set MONGO_URI, JWT_SECRET, Cloudinary keys
cp client/.env.example client/.env

npm run seed      # WARNING: drops the configured database, then creates the demo company
npm run dev:api   # http://localhost:5000
npm run dev:web   # http://localhost:5173
```

### Demo logins

All demo accounts use the password `demo1234`. Each role sees only its modules.

| Email | Role |
| --- | --- |
| admin@meridian.demo | Administrator, everything |
| manager@meridian.demo | Operations: CRM, sales, purchasing, stock, HR, projects, reports |
| accountant@meridian.demo | Accounting, reports, sales and purchasing documents |
| sales@meridian.demo | CRM, sales, projects |
| warehouse@meridian.demo | Inventory and purchasing |
| hr@meridian.demo | People, payroll, projects |

The seed creates six months of activity for an office-supplies distributor: about 110 sales invoices, purchase orders and bills, payments, rent and utilities, payroll runs, leave requests, a CRM pipeline and three projects. Every document goes through the same services as the API, so the ledger, stock and reports are consistent.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `MONGO_TRANSACTIONS` | `off` for MongoDB-compatible servers without transactions |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth tokens |
| `CLIENT_URL` | Allowed CORS origin(s), comma separated |
| `CLOUDINARY_*` | Product photos, avatars, logos and document attachments |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Assistant; any OpenAI-compatible chat completions endpoint |
| `VITE_API_URL` | (client) API base URL |

## Project structure

```
server/src
  config/        db, cloudinary, roles and permissions
  models/        20 Mongoose models
  services/      business logic: ledger, inventory, orders, invoices, payments, payroll, reports, pdf, assistant
  routes/        REST endpoints; crud.js is a generic company-scoped resource factory
  scripts/seed.js
client/src
  components/    design system (ui/), layout, generic ResourcePage, LinesEditor, Kanban
  pages/         one file per screen
  lib/           api client, query hooks, formatting, navigation
```

## Deployment

- **API:** Render, Railway or Fly.io with `npm start` in `server/`. Use a MongoDB Atlas cluster so transactions are available.
- **Client:** Vercel or Netlify with `client/` as the root, build command `npm run build`, output `dist`. `vercel.json` already handles client-side routing. Set `VITE_API_URL` to your API URL and `CLIENT_URL` on the API to your site's URL.

## API overview

All routes are under `/api` and need a `Bearer` token except `/auth/login` and `/auth/register`.

`auth` · `company` · `users` · `directory` · `audit` · `uploads` · `contacts` · `products` · `warehouses` · `inventory/levels|moves|adjust|transfer` · `orders` (+ `/confirm` `/fulfill` `/invoice` `/cancel`) · `invoices` (+ `/post` `/void` `/pdf`) · `payments` · `accounts` (+ `/cash` `/:id/ledger`) · `journal` (+ `/:id/reverse`) · `reports/profit-loss|balance-sheet|trial-balance` · `leads` (+ `/:id/move`) · `departments` · `employees` · `leaves` (+ `/:id/approve|reject`) · `payroll` (+ `/:id/post`) · `projects` · `tasks` (+ `/:id/move`) · `dashboard` · `search` · `assistant`

## License

MIT
