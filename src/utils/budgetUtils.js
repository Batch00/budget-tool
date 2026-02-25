export function getCategorySpent(transactions, categoryId) {
  return transactions
    .filter(t => t.categoryId === categoryId)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0)
}

export function getCategoryPlanned(monthBudget, categoryId) {
  return monthBudget?.planned?.[categoryId] ?? 0
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

export function getTotalPlannedByType(categories, monthBudget, type) {
  return categories
    .filter(c => c.type === type)
    .reduce((sum, c) => sum + getCategoryPlanned(monthBudget, c.id), 0)
}

// Planned income minus planned expenses — should be $0 in a zero-based budget
export function getUnbudgetedAmount(categories, monthBudget) {
  const plannedIncome = getTotalPlannedByType(categories, monthBudget, 'income')
  const plannedExpenses = getTotalPlannedByType(categories, monthBudget, 'expense')
  return plannedIncome - plannedExpenses
}
