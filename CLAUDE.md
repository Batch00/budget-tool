# BatchFlow - Claude Instructions

## Project Overview
A personal budgeting web app inspired by EveryDollar. Built for personal use with a focus on clean UI and ease of use. Backed by Supabase (Postgres + auth) and deployed on Vercel.

## Tech Stack
- React 18
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed)
- Vite — build tool and dev server
- React Router v6
- Supabase — Postgres database, email/password auth, row-level security
- Vercel — hosting; auto-deploys on every push to `main`
- Recharts (for Analytics)
- @dnd-kit/core + @dnd-kit/sortable — drag-and-drop subcategory reordering
- Lucide React (icons)

## Commands
```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Project Structure
- Components go in `src/components/` (shared) or `src/views/` (page-level)
- Keep components small and focused
- Use functional components with hooks

```
src/
├── context/
│   ├── AppContext.jsx      # Central app state + all Supabase CRUD operations
│   └── AuthContext.jsx     # Supabase auth state (user, signIn, signUp, signOut)
├── lib/
│   └── supabase.js         # Supabase client; reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
├── data/
│   └── defaultCategories.js  # Default category set seeded once for new users
├── utils/
│   ├── budgetUtils.js      # Spending totals, progress %, unbudgeted calculation
│   ├── formatters.js       # formatCurrency(), formatDate(), formatMonthLabel(), getMonthKey()
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

## Architecture
- **`src/context/AppContext.jsx`** — single source of truth for all app state: `categories`, `transactions`, `budgets`, `currentMonth`. All CRUD operations talk directly to Supabase. Import `useApp()` hook anywhere in the tree. `currentMonth` is the only piece of state persisted to localStorage (not Supabase).
- **`src/context/AuthContext.jsx`** — wraps Supabase auth; exposes `user`, `loading`, `signIn`, `signUp`, `signOut`. Import `useAuth()` anywhere in the tree.
- **`src/lib/supabase.js`** — creates and exports the Supabase client from env vars. Throws on startup if vars are missing.
- **`src/utils/budgetUtils.js`** — pure functions for calculating spent amounts, progress percentages, and zero-based unbudgeted amount. `getCategorySpent` / `getSubcategorySpent` handle both flat and split transactions. `getProgressStatus(spent, planned, type)` accepts `'income'|'expense'` and uses a 50% yellow threshold.
- **`src/utils/formatters.js`** — `formatCurrency()`, `formatDate()`, `formatMonthLabel()`, `getMonthKey()`.
- **`src/data/defaultCategories.js`** — seeded once when a new user logs in for the first time. Uses string IDs internally but Postgres generates real UUIDs on insert; names are used to map back.
- Routing: `App.jsx` → nested under `<Layout />` → Dashboard / Budget / Transactions / Analytics / Categories / Settings. Auth is a standalone route outside Layout.

## Database Schema

Tables in Supabase (Postgres). Every table has `user_id`; RLS policies enforce per-user isolation server-side.

```
categories
  id            uuid PRIMARY KEY (generated)
  user_id       uuid REFERENCES auth.users
  name          text
  type          text  ('income' | 'expense')
  color         text  (hex string)
  sort_order    int

subcategories
  id            uuid PRIMARY KEY (generated)
  category_id   uuid REFERENCES categories (cascade delete)
  user_id       uuid REFERENCES auth.users
  name          text
  sort_order    int

transactions
  id            uuid PRIMARY KEY (generated)
  user_id       uuid REFERENCES auth.users
  date          text  (YYYY-MM-DD)
  amount        numeric
  type          text  ('income' | 'expense')
  merchant      text
  notes         text
  is_split      boolean
  category_id   uuid REFERENCES categories (null when is_split = true)
  subcategory_id uuid REFERENCES subcategories (nullable)

transaction_splits
  id            uuid PRIMARY KEY (generated)
  transaction_id uuid REFERENCES transactions (cascade delete)
  category_id   uuid REFERENCES categories
  subcategory_id uuid REFERENCES subcategories (nullable)
  amount        numeric

budget_plans
  id            uuid PRIMARY KEY (generated)
  user_id       uuid REFERENCES auth.users
  month_key     text  (YYYY-MM)
  category_id   uuid REFERENCES categories (null when subcategory-level plan)
  subcategory_id uuid REFERENCES subcategories (null when category-level plan)
  planned_amount numeric
```

### Cascade deletes wired in the schema
- Deleting a `category` cascades to `subcategories` and `budget_plans` rows referencing it
- Deleting a `transaction` cascades to `transaction_splits`
- Deleting a `subcategory` cascades to `budget_plans` rows referencing it

## Supabase Notes
- **Schema changes must be done manually** in the Supabase SQL editor (or Migrations tab). There is no programmatic migration runner in this project. Never try to run `ALTER TABLE` or `CREATE TABLE` from app code.
- RLS policies are set up in Supabase for each table. If a query silently returns empty data (no error), check that the RLS policies exist and are enabled.
- The app uses DELETE + INSERT instead of upsert for `budget_plans` to avoid partial-unique-index conflicts.
- Budget writes use optimistic updates so typing into budget fields feels instant; the Supabase write happens in the background.
- Environment variables required: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from Supabase project Settings → API).

## Vercel Notes
- **Deployments are automatic** — every push to `main` triggers a production deploy. No manual steps needed.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings.
- Vite is detected automatically; no custom build config needed.

## Data Model (app-side camelCase)
```js
// Category
{ id, name, type: 'income'|'expense', color, subcategories: [{ id, name }] }

// Transaction (flat — single category)
{ id, date, amount, type: 'income'|'expense', categoryId, subcategoryId, merchant, notes }

// Transaction (split — multiple categories)
// categoryId: null signals a split transaction; type/amount stay at top level
{
  id, date, amount, type, merchant, notes,
  categoryId: null,
  subcategoryId: null,
  splits: [{ categoryId, subcategoryId, amount }, ...]
}

// Budgets — nested map keyed by YYYY-MM monthKey
{
  [monthKey]: {
    planned: { [categoryId]: number },         // category-level plans
    subcategoryPlanned: { [subcategoryId]: number }  // subcategory-level plans
  }
}
```

## Key Features (all built)
1. Month selector and navigation
2. Budget planning at category and subcategory level (inline editing, optimistic updates)
3. Transaction logging (flat and split)
4. Dashboard with planned vs actual vs remaining, color-coded progress bars
5. Category management — add, rename, reorder (arrow up/down), delete
6. Subcategory management — add, rename, drag-and-drop reorder, delete
7. Analytics — pie chart breakdown, monthly bar chart, income vs expense line chart
8. New month copy experience — empty month offers copy-from-previous or start-fresh
9. Supabase auth — email/password sign in/up; per-user data isolation via RLS
10. Settings — JSON export and import (full backup/restore)

## Code Style
- Clean, readable code with comments where logic is complex
- Consistent naming: PascalCase for components, camelCase for functions/variables
- No emojis in code or output

## Design Guidelines
- Clean and modern, mobile-friendly
- Sidebar navigation, card-based layouts
- Color coding (progress bars):
  - **Expense**: green < 50% spent, yellow 50–99%, red ≥ 100%
  - **Income**: neutral < 50% received, yellow 50–99%, green = 100% (goal reached)
  - Labels say "received" for income, "spent" for expense
- Unbudgeted/balanced check uses `Math.abs(val) < 0.01` to guard against floating-point drift
- Inspiration: EveryDollar, Mint

## Notes for Claude
- Always commit-ready code, no half-finished components
- When adding a new feature, update this file if anything changes about the architecture
- Prefer simplicity over complexity
- Keep changes minimal and focused — no extra refactoring beyond what's asked
