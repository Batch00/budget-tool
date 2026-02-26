import { useState, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatMonthLabel } from '../utils/formatters'
import {
  getCategoryPlanned,
  getSubcategoryPlanned,
  getCategoryEffectivePlanned,
  getTotalPlannedByType,
  getUnbudgetedAmount,
} from '../utils/budgetUtils'
import BudgetEmptyState from '../components/budget/BudgetEmptyState'

// ── Inline-editable amount input (shared pattern) ─────────────────────────────

function AmountInput({ value: planned, onUpdate, inputClass = '', displayClass = '' }) {
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
    if (e.key === 'Escape') { setValue(String(planned)); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        type="number"
        min="0"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`w-32 text-right text-sm border border-indigo-400 rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-indigo-200 ${inputClass}`}
      />
    )
  }

  return (
    <button
      onClick={() => { setEditing(true); setValue(String(planned)) }}
      className={`w-32 text-right text-sm px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors ${displayClass}`}
    >
      {planned > 0
        ? <span className="text-slate-700">{formatCurrency(planned)}</span>
        : <span className="text-slate-300 italic">Set amount</span>
      }
    </button>
  )
}

// ── Subcategory row with editable amount ──────────────────────────────────────

function SubcategoryBudgetRow({ subcategory, planned, onUpdate }) {
  return (
    <div className="flex items-center justify-between py-2 pl-7 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
        <span className="text-sm text-slate-500">{subcategory.name}</span>
      </div>
      <AmountInput value={planned} onUpdate={onUpdate} />
    </div>
  )
}

// ── Category section: header shows read-only sum, rows show subcategory inputs ─

function CategoryBudgetSection({ category, monthBudget, onUpdateCategory, onUpdateSubcategory }) {
  const hasSubcategories = category.subcategories.length > 0

  if (!hasSubcategories) {
    // No subcategories — keep the original single-amount behaviour
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
          <span className="text-sm text-slate-700">{category.name}</span>
        </div>
        <AmountInput
          value={getCategoryPlanned(monthBudget, category.id)}
          onUpdate={onUpdateCategory}
        />
      </div>
    )
  }

  const total = getCategoryEffectivePlanned(category, monthBudget)

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Category header — read-only total */}
      <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
          <span className="text-sm font-medium text-slate-700">{category.name}</span>
        </div>
        <span className="w-32 text-right text-sm font-semibold text-slate-700 px-2.5">
          {total > 0
            ? formatCurrency(total)
            : <span className="text-slate-300 font-normal italic">No budget</span>
          }
        </span>
      </div>

      {/* Subcategory rows */}
      {category.subcategories.map(sub => (
        <SubcategoryBudgetRow
          key={sub.id}
          subcategory={sub}
          planned={getSubcategoryPlanned(monthBudget, sub.id)}
          onUpdate={(amount) => onUpdateSubcategory(sub.id, amount)}
        />
      ))}
    </div>
  )
}

// ── Budget (main view) ────────────────────────────────────────────────────────

export default function Budget() {
  const {
    categories, currentMonth, currentMonthBudget, currentMonthTransactions,
    setBudgetAmount, setSubcategoryBudgetAmount, budgets, copyBudget, resetMonthBudget,
  } = useApp()

  const [bypassEmptyState, setBypassEmptyState] = useState(false)

  // A month is active when it has at least one non-zero planned amount
  const monthHasBudget =
    Object.values(budgets[currentMonth]?.planned ?? {}).some(v => v > 0) ||
    Object.values(budgets[currentMonth]?.subcategoryPlanned ?? {}).some(v => v > 0)
  const monthHasTransactions = currentMonthTransactions.length > 0
  const isUninitialized = !monthHasBudget && !monthHasTransactions && !bypassEmptyState

  // Nearest months in either direction that have non-zero planned amounts
  const { prevMonth, nextMonth } = useMemo(() => {
    const keysWithData = Object.keys(budgets).filter(k =>
      Object.values(budgets[k]?.planned ?? {}).some(v => v > 0) ||
      Object.values(budgets[k]?.subcategoryPlanned ?? {}).some(v => v > 0)
    )
    const prev = keysWithData.filter(k => k < currentMonth).sort().reverse()[0] ?? null
    const next = keysWithData.filter(k => k > currentMonth).sort()[0] ?? null
    return { prevMonth: prev, nextMonth: next }
  }, [budgets, currentMonth])

  const handleReset = () => {
    if (window.confirm(`Reset the budget for ${formatMonthLabel(currentMonth)}? All planned amounts will be cleared.`)) {
      resetMonthBudget(currentMonth)
    }
  }

  if (isUninitialized) {
    return (
      <BudgetEmptyState
        currentMonth={currentMonth}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        onCopy={(sourceKey) => copyBudget(sourceKey, currentMonth)}
        onScratch={() => setBypassEmptyState(true)}
      />
    )
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const plannedIncome = getTotalPlannedByType(categories, currentMonthBudget, 'income')
  const plannedExpenses = getTotalPlannedByType(categories, currentMonthBudget, 'expense')
  const unbudgeted = getUnbudgetedAmount(categories, currentMonthBudget)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Monthly summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Plan</h3>
          <button
            onClick={handleReset}
            title="Reset month budget"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
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
          <CategoryBudgetSection
            key={cat.id}
            category={cat}
            monthBudget={currentMonthBudget}
            onUpdateCategory={(amount) => setBudgetAmount(currentMonth, cat.id, amount)}
            onUpdateSubcategory={(subId, amount) => setSubcategoryBudgetAmount(currentMonth, subId, amount)}
          />
        ))}
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Expenses</h3>
        {expenseCategories.map(cat => (
          <CategoryBudgetSection
            key={cat.id}
            category={cat}
            monthBudget={currentMonthBudget}
            onUpdateCategory={(amount) => setBudgetAmount(currentMonth, cat.id, amount)}
            onUpdateSubcategory={(subId, amount) => setSubcategoryBudgetAmount(currentMonth, subId, amount)}
          />
        ))}
      </div>
    </div>
  )
}
