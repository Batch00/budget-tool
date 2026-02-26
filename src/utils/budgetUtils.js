export function getCategorySpent(transactions, categoryId) {
  return transactions
    .filter(t => t.categoryId === categoryId)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0)
}

export function getCategoryPlanned(monthBudget, categoryId) {
  return monthBudget?.planned?.[categoryId] ?? 0
}

// Planned amount for a specific subcategory
export function getSubcategoryPlanned(monthBudget, subcategoryId) {
  return monthBudget?.subcategoryPlanned?.[subcategoryId] ?? 0
}

// Amount spent on a specific subcategory
export function getSubcategorySpent(transactions, subcategoryId) {
  return transactions
    .filter(t => t.subcategoryId === subcategoryId)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0)
}

// Effective planned for a category:
//   • Categories with no subcategories → use category-level planned (old model)
//   • Categories with subcategories that have been budgeted → sum subcategory amounts
//   • Categories with subcategories but none budgeted yet → fall back to category-level
//     planned for backward compatibility with data saved before subcategory budgeting
export function getCategoryEffectivePlanned(category, monthBudget) {
  if (category.subcategories.length === 0) {
    return getCategoryPlanned(monthBudget, category.id)
  }
  const hasSubcategoryData = category.subcategories.some(
    sub => monthBudget?.subcategoryPlanned?.[sub.id] !== undefined
  )
  if (hasSubcategoryData) {
    return category.subcategories.reduce(
      (sum, sub) => sum + getSubcategoryPlanned(monthBudget, sub.id),
      0
    )
  }
  // Backward compat: old data stored amounts at the category level
  return getCategoryPlanned(monthBudget, category.id)
}

export function getProgressPercent(spent, planned) {
  if (!planned) return 0
  return Math.min(100, Math.round((spent / planned) * 100))
}

// Returns 'good' | 'warning' | 'over' | 'none'
export function getProgressStatus(spent, planned) {
  if (!planned) return 'none'
  const pct = (spent / planned) * 100
  if (pct >= 100) return 'over'
  if (pct >= 80) return 'warning'
  return 'good'
}

export function getTotalByType(transactions, type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0)
}

// Uses getCategoryEffectivePlanned so subcategory budgets roll up correctly
export function getTotalPlannedByType(categories, monthBudget, type) {
  return categories
    .filter(c => c.type === type)
    .reduce((sum, c) => sum + getCategoryEffectivePlanned(c, monthBudget), 0)
}

// Planned income minus planned expenses — should be $0 in a zero-based budget
export function getUnbudgetedAmount(categories, monthBudget) {
  const plannedIncome = getTotalPlannedByType(categories, monthBudget, 'income')
  const plannedExpenses = getTotalPlannedByType(categories, monthBudget, 'expense')
  return plannedIncome - plannedExpenses
}
