# BatchFlow - Claude Instructions
*Own your flow. Personal zero-based budgeting app backed by Supabase, deployed on Vercel.*

## Tech Stack
- **React 18** - functional components and hooks
- **Tailwind CSS v4** - via `@tailwindcss/vite`; no `tailwind.config.js`
- **Vite** - build tool and dev server
- **vite-plugin-pwa** - PWA manifest, service worker, Workbox caching
- **Supabase** - Postgres database, email/password auth, row-level security
- **Vercel** - hosting; auto-deploys on every push to `main`
- **Recharts** - analytics charts
- **@dnd-kit** - drag-and-drop subcategory reordering
- **Lucide React** - icons

## Commands
```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Project Structure
```
src/
├── context/
│   ├── AppContext.jsx       # All app state + Supabase CRUD; useApp() hook
│   └── AuthContext.jsx      # Supabase auth; useAuth() hook
├── lib/
│   └── supabase.js          # Supabase client (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
├── data/
│   └── defaultCategories.js # Seeded once for new users
├── utils/
│   ├── budgetUtils.js       # getCategorySpent, getSubcategorySpent, getProgressStatus, etc.
│   ├── formatters.js        # formatCurrency, formatDate, formatMonthLabel, getMonthKey
│   └── storage.js           # localStorage helpers (currentMonth + preferences)
├── components/
│   ├── budget/              # BudgetEmptyState
│   ├── categories/          # CategoryModal
│   ├── common/              # MonthSelector, ProgressBar
│   ├── layout/              # Layout, Sidebar, Header
│   └── transactions/        # TransactionModal
└── views/
    ├── Auth.jsx              # Sign in / sign up
    ├── Dashboard.jsx         # Category cards, recent activity, FAB
    ├── Budget.jsx            # Inline budget planning + inline rename
    ├── Transactions.jsx      # Transaction list with split-row display, FAB
    ├── Analytics.jsx         # Recharts: pie, bar, line charts
    ├── Categories.jsx        # Category + subcategory management
    └── Settings.jsx          # Install prompt, account, preferences, data export/import
```

## Architecture

**`AppContext.jsx`** - single source of truth: `categories`, `transactions`, `budgets`, `currentMonth`. All CRUD talks directly to Supabase. `currentMonth` is persisted to localStorage; all other state comes from Supabase.

**`AuthContext.jsx`** - wraps Supabase auth; exposes `user`, `loading`, `signIn`, `signUp`, `signOut`.

**`budgetUtils.js`** - pure functions for spending totals and progress. `getCategorySpent` / `getSubcategorySpent` handle both flat and split transactions. `getProgressStatus(spent, planned, type)` accepts `'income'|'expense'`; yellow threshold is 50% for both.

**Budget writes** use optimistic updates - local state updates immediately, Supabase write is background. Budget plans use DELETE + INSERT (not upsert) to avoid partial unique-index conflicts.

**Routing** - `App.jsx` -> nested under `<Layout />` -> Dashboard / Budget / Transactions / Analytics / Categories / Settings. Auth is a standalone route outside Layout.

**PWA** - configured via `vite-plugin-pwa` in `vite.config.js`. Service worker auto-updates; static assets are precached; Supabase API calls use NetworkFirst with a 10-second timeout.

## Database Schema
Every table has `user_id`; RLS policies enforce per-user isolation server-side. **Schema changes must be done manually in the Supabase SQL editor - never from app code.**

```
categories         - id, user_id, name, type ('income'|'expense'), color, sort_order
subcategories      - id, category_id, user_id, name, sort_order
transactions       - id, user_id, date, amount, type, merchant, notes, is_split, category_id, subcategory_id
transaction_splits - id, transaction_id, category_id, subcategory_id, amount
budget_plans       - id, user_id, month_key (YYYY-MM), category_id, subcategory_id, planned_amount
```

Cascade deletes: category -> subcategories + budget_plans; transaction -> splits; subcategory -> budget_plans.

## Data Model (app-side camelCase)
```js
// Category
{ id, name, type: 'income'|'expense', color, subcategories: [{ id, name }] }

// Transaction (flat)
{ id, date, amount, type, categoryId, subcategoryId, merchant, notes }

// Transaction (split) - categoryId: null signals split
{ id, date, amount, type, merchant, notes, categoryId: null, subcategoryId: null,
  splits: [{ categoryId, subcategoryId, amount }, ...] }

// Budgets map
{ [monthKey]: { planned: { [categoryId]: number }, subcategoryPlanned: { [subcategoryId]: number } } }
```

## Design Guidelines
- Clean and modern, mobile-friendly; sidebar nav, card-based layouts
- Progress bar colors: **Expense** green -> yellow (50%) -> red (100%); **Income** neutral -> yellow (50%) -> green (100%)
- "received" label for income, "spent" for expense
- Floating-point guard: use `Math.abs(val) < 0.01` for zero checks

## Code Style
- PascalCase components, camelCase functions/variables
- Functional components with hooks only
- No emojis in code or output
- Keep changes minimal - no refactoring beyond what's asked
- Never commit or push; user handles all git operations
