# Budget Tool

A personal zero-based budgeting web app inspired by EveryDollar. Plan income and expenses by category, log transactions, and track spending — all stored in your browser with no backend required.

## Features

- **Zero-based budgeting** — assign every dollar of income to a category; unbudgeted amount shown at all times
- **Month navigation** — each month has its own independent budget plan and transaction set
- **Budget planning** — set planned amounts per category; click any row to edit inline
- **Dashboard** — planned vs. actual vs. remaining for every category, with color-coded progress bars
- **Transaction logging** — record transactions with amount, date, category, subcategory, and merchant
- **Analytics** — spending trends and category breakdowns *(coming soon)*
- **Category management** — customizable income/expense categories with subcategories *(coming soon)*

## Tech Stack

- [React 18](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
- [React Router v6](https://reactrouter.com/) — client-side routing
- [Recharts](https://recharts.org/) — charts (Analytics view)
- [Lucide React](https://lucide.dev/) — icons
- [Vite](https://vitejs.dev/) — build tool
- `localStorage` — all data persisted in the browser under `budget-tool:*` keys

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
├── context/
│   └── AppContext.jsx      # Central state (categories, transactions, budgets) + localStorage sync
├── data/
│   └── defaultCategories.js  # Default set of categories loaded on first run
├── utils/
│   ├── storage.js          # localStorage read/write helpers
│   ├── formatters.js       # Currency, date, and month key formatters
│   └── budgetUtils.js      # Spending totals, progress %, unbudgeted calculation
├── components/
│   ├── layout/             # Layout, Sidebar, Header
│   └── common/             # MonthSelector, ProgressBar
└── views/
    ├── Dashboard.jsx        # Category cards with planned vs actual
    ├── Budget.jsx           # Inline budget planning per category
    ├── Transactions.jsx     # Transaction list
    ├── Analytics.jsx        # Charts (coming soon)
    └── Categories.jsx       # Category management (coming soon)
```

## Data Model

All data is stored in `localStorage` under `budget-tool:*` keys:

```js
// Categories
{ id, name, type: 'income'|'expense', color, subcategories: [{ id, name }] }

// Transactions
{ id, date, amount, type: 'income'|'expense', categoryId, subcategoryId, merchant, notes }

// Budgets — keyed by month (YYYY-MM)
{ [monthKey]: { planned: { [categoryId]: number } } }
```
