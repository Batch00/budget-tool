# BatchFlow

A personal zero-based budgeting web app to plan income and expenses by category, log transactions, and track your spending in real time — backed by Supabase with multi-user auth and deployed on Vercel.

## Features

- **Zero-based budgeting** — assign every dollar of income to a category; unbudgeted amount shown at all times
- **Month navigation** — each month has its own independent budget plan and transaction set; navigate back and forward freely
- **Budget planning** — set planned amounts at the category or subcategory level; click any row to edit inline
- **Dashboard** — planned vs. actual vs. remaining for every category, with color-coded progress bars
- **Transaction logging** — record transactions with amount, date, category, subcategory, merchant, and notes
- **Split transactions** — split a single transaction across multiple categories (e.g. a grocery run that covers food and household)
- **Category management** — add, rename, reorder, and delete income and expense categories; up/down arrow reordering
- **Subcategory management** — add and rename subcategories with drag-and-drop reordering within each category
- **Analytics dashboard** — spending trends, category breakdowns, and income vs. expense bar charts across the last several months
- **New month copy experience** — when navigating to a month with no budget, choose to copy from the previous month or start fresh
- **Data export / import** — download a full JSON backup of all data from the Settings page and restore it later
- **Supabase auth** — email/password sign in and sign up; each user's data is fully isolated via Postgres row-level security

## Tech Stack

| Technology | Role |
|---|---|
| [React 18](https://react.dev/) | Frontend UI framework |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling via the `@tailwindcss/vite` plugin (no `tailwind.config.js` needed) |
| [Vite](https://vitejs.dev/) | Build tool and local dev server |
| [Supabase](https://supabase.com/) | Postgres database, email/password authentication, and row-level security policies for per-user data isolation |
| [Vercel](https://vercel.com/) | Hosting and automatic deployment — every push to `main` deploys to production |
| [Recharts](https://recharts.org/) | Charts in the Analytics view |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [@dnd-kit](https://dndkit.com/) | Drag-and-drop subcategory reordering |
| [Lucide React](https://lucide.dev/) | Icons |

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Both values are found in your Supabase project under **Settings → API**.

### 3. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:5173 |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |

## Deployment

The app is deployed on [Vercel](https://vercel.com/) and connected to the GitHub repository. Every push to the `main` branch automatically triggers a new production deployment — no manual steps required.

To set up a new Vercel project:
1. Import the GitHub repository in the Vercel dashboard
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables under **Settings → Environment Variables**
3. Vercel detects the Vite config automatically; no custom build settings are needed

## Project Structure

```
src/
├── context/
│   ├── AppContext.jsx      # Central app state + all Supabase CRUD operations
│   └── AuthContext.jsx     # Supabase auth state (user, signIn, signUp, signOut)
├── lib/
│   └── supabase.js         # Supabase client (reads env vars)
├── data/
│   └── defaultCategories.js  # Default category set seeded for new users
├── utils/
│   ├── budgetUtils.js      # Spending totals, progress %, unbudgeted calculation
│   ├── formatters.js       # Currency, date, and month key formatters
│   └── storage.js          # localStorage helpers (used only for currentMonth)
├── components/
│   ├── budget/             # BudgetEmptyState (new-month copy experience)
│   ├── categories/         # CategoryModal
│   ├── common/             # MonthSelector, ProgressBar
│   ├── layout/             # Layout, Sidebar, Header
│   └── transactions/       # TransactionModal
└── views/
    ├── Auth.jsx             # Sign in / sign up page
    ├── Dashboard.jsx        # Category cards with planned vs actual
    ├── Budget.jsx           # Inline budget planning per category/subcategory
    ├── Transactions.jsx     # Transaction list with split-row display
    ├── Analytics.jsx        # Recharts: pie, bar, and line charts
    ├── Categories.jsx       # Category and subcategory management with reordering
    └── Settings.jsx         # Data export and import
```

## Database Schema

All data lives in Supabase (Postgres). Every table has a `user_id` column; row-level security policies ensure users can only read and write their own rows.

```
categories        — id, user_id, name, type ('income'|'expense'), color, sort_order
subcategories     — id, category_id, user_id, name, sort_order
transactions      — id, user_id, date, amount, type, merchant, notes, is_split, category_id, subcategory_id
transaction_splits— id, transaction_id, category_id, subcategory_id, amount  (cascade-delete from transactions)
budget_plans      — id, user_id, month_key (YYYY-MM), category_id, subcategory_id, planned_amount
```
