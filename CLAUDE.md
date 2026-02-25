# Budget Tool - Claude Instructions

## Project Overview
A personal budgeting web app inspired by EveryDollar. Built for personal use with a focus on clean UI and ease of use.

## Tech Stack
- React 18
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed)
- React Router v6
- Recharts (for Analytics)
- Lucide React (icons)
- localStorage for data persistence (no backend)

## Commands
```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Project Structure conventions
- Components go in `src/components/` (shared) or `src/views/` (page-level)
- Keep components small and focused
- Use functional components with hooks

## Architecture
- **`src/context/AppContext.jsx`** — single source of truth for all app state: `categories`, `transactions`, `budgets`, `currentMonth`. Persists everything to localStorage via `useEffect`. All CRUD operations live here. Import `useApp()` hook anywhere in the tree.
- **`src/utils/budgetUtils.js`** — pure functions for calculating spent amounts, progress percentages, and zero-based unbudgeted amount.
- **`src/utils/formatters.js`** — `formatCurrency()`, `formatDate()`, `formatMonthLabel()`, `getMonthKey()`.
- **`src/utils/storage.js`** — thin wrappers around `localStorage` with error handling.
- **`src/data/defaultCategories.js`** — loaded once on first run; has fixed string IDs so budget data survives a localStorage clear-and-reload.
- Routing: `App.jsx` → nested under `<Layout />` → Dashboard / Budget / Transactions / Analytics / Categories.

## Data Model
```js
// Category
{ id, name, type: 'income'|'expense', color, subcategories: [{ id, name }] }

// Transaction
{ id, date, amount, type: 'income'|'expense', categoryId, subcategoryId, merchant, notes }

// Budgets — one object keyed by YYYY-MM monthKey
{ [monthKey]: { planned: { [categoryId]: number } } }
```

## Code Style
- Clean, readable code with comments where logic is complex
- Consistent naming: PascalCase for components, camelCase for functions/variables

## Key Features (in priority order)
1. Month selector and navigation ✅
2. Budget planning (planned amounts per category) ✅
3. Transaction logging ✅
4. Dashboard with planned vs actual vs remaining ✅
5. Category/subcategory management ✅
6. Analytics and charts ✅

## Design Guidelines
- Clean and modern, mobile-friendly
- Sidebar navigation, card-based layouts
- Color coding: green = on track, yellow = nearing limit, red = over budget
- Inspiration: EveryDollar, Mint

## Notes for Claude
- Always commit-ready code, no half-finished components
- When adding a new feature, update this file if anything changes about the architecture
- Prefer simplicity over complexity
