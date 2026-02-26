import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/formatters'
import { getCategoryPlanned, getTotalPlannedByType, getUnbudgetedAmount } from '../utils/budgetUtils'
import BudgetEmptyState from '../components/budget/BudgetEmptyState'

function CategoryBudgetRow({ category, planned, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(planned))

  const commit = () => {
    const num = Math.max(0, parseFloat(value) || 0)
    onUpdate(num)
    setValue(String(num))
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      setValue(String(planned))
      setEditing(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
        <span className="text-sm text-slate-700">{category.name}</span>
      </div>
      {editing ? (
        <input
          type="number"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-32 text-right text-sm border border-indigo-400 rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-indigo-200"
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setValue(String(planned)) }}
          className="w-32 text-right text-sm text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {planned > 0
            ? formatCurrency(planned)
            : <span className="text-slate-400 italic">Set amount</span>
          }
        </button>
      )}
    </div>
  )
}

export default function Budget() {
  const {
    categories, currentMonth, currentMonthBudget, setBudgetAmount,
    budgets, initializeMonth, copyBudget,
  } = useApp()

  // A month is "uninitialized" until the user explicitly sets it up
  const isUninitialized = budgets[currentMonth] === undefined

  // Most recent previous month that has at least one planned amount
  const previousMonthKey = useMemo(() => {
    return Object.keys(budgets)
      .filter(k => k < currentMonth && Object.keys(budgets[k]?.planned ?? {}).length > 0)
      .sort()
      .reverse()[0] ?? null
  }, [budgets, currentMonth])

  const handleCopy = () => {
    if (previousMonthKey) copyBudget(previousMonthKey, currentMonth)
    else initializeMonth(currentMonth)
  }

  if (isUninitialized) {
    return (
      <BudgetEmptyState
        currentMonth={currentMonth}
        previousMonth={previousMonthKey}
        onCopy={handleCopy}
        onScratch={() => initializeMonth(currentMonth)}
      />
    )
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const plannedIncome = getTotalPlannedByType(categories, currentMonthBudget, 'income')
  const plannedExpenses = getTotalPlannedByType(categories, currentMonthBudget, 'expense')
  const unbudgeted = getUnbudgetedAmount(categories, currentMonthBudget)

  const handleUpdate = (categoryId, amount) => {
    setBudgetAmount(currentMonth, categoryId, amount)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Monthly summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Monthly Plan</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Planned income</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(plannedIncome)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Planned expenses</span>
            <span className="font-semibold text-slate-700">{formatCurrency(plannedExpenses)}</span>
          </div>
          <div className="border-t border-slate-100 pt-2.5 flex justify-between text-sm font-semibold">
            <span className="text-slate-700">Unbudgeted</span>
            <span className={
              unbudgeted === 0
                ? 'text-emerald-600'
                : unbudgeted < 0
                  ? 'text-red-500'
                  : 'text-amber-500'
            }>
              {formatCurrency(unbudgeted)}
            </span>
          </div>
        </div>
        {unbudgeted === 0 && plannedIncome > 0 && (
          <p className="mt-3 text-xs text-emerald-600 font-medium">Every dollar is assigned.</p>
        )}
      </div>

      {/* Income */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Income</h3>
        {incomeCategories.map(cat => (
          <CategoryBudgetRow
            key={cat.id}
            category={cat}
            planned={getCategoryPlanned(currentMonthBudget, cat.id)}
            onUpdate={(amount) => handleUpdate(cat.id, amount)}
          />
        ))}
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Expenses</h3>
        {expenseCategories.map(cat => (
          <CategoryBudgetRow
            key={cat.id}
            category={cat}
            planned={getCategoryPlanned(currentMonthBudget, cat.id)}
            onUpdate={(amount) => handleUpdate(cat.id, amount)}
          />
        ))}
      </div>
    </div>
  )
}
