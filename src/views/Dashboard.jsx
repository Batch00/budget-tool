import { useState } from 'react'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/formatters'
import {
  getCategorySpent,
  getCategoryEffectivePlanned,
  getSubcategorySpent,
  getSubcategoryPlanned,
  getTotalByType,
  getTotalPlannedByType,
  getUnbudgetedAmount,
} from '../utils/budgetUtils'
import ProgressBar from '../components/common/ProgressBar'

function SummaryCard({ icon: Icon, label, amount, subtitle, colorClass }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(amount)}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function CategoryCard({ category, transactions, monthBudget }) {
  const categoryType = category.type
  const [expanded, setExpanded] = useState(false)

  const spent = getCategorySpent(transactions, category.id)
  const planned = getCategoryEffectivePlanned(category, monthBudget)

  const hasSubcategories = category.subcategories.length > 0

  // Only show subcategories that have planned or actual spending
  const visibleSubcategories = category.subcategories.filter(sub => {
    const subSpent = getSubcategorySpent(transactions, sub.id)
    const subPlanned = getSubcategoryPlanned(monthBudget, sub.id)
    return subSpent > 0 || subPlanned > 0
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Category header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => hasSubcategories && setExpanded(e => !e)}
            className={`flex items-center gap-2 text-left ${hasSubcategories ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
            <h3 className="text-sm font-medium text-slate-800">{category.name}</h3>
            {hasSubcategories && (
              <span className="text-slate-400">
                {expanded
                  ? <ChevronDown size={13} />
                  : <ChevronRight size={13} />
                }
              </span>
            )}
          </button>
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-800">{formatCurrency(spent)}</span>
            <span className="text-xs text-slate-400 ml-1">/ {formatCurrency(planned)}</span>
          </div>
        </div>
        <ProgressBar spent={spent} planned={planned} type={categoryType} />
      </div>

      {/* Subcategory breakdown (expanded) */}
      {expanded && visibleSubcategories.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 space-y-3">
          {visibleSubcategories.map(sub => {
            const subSpent = getSubcategorySpent(transactions, sub.id)
            const subPlanned = getSubcategoryPlanned(monthBudget, sub.id)
            return (
              <div key={sub.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                    {sub.name}
                  </span>
                  <span className="text-xs">
                    <span className="font-medium text-slate-700">{formatCurrency(subSpent)}</span>
                    <span className="text-slate-400 ml-1">/ {formatCurrency(subPlanned)}</span>
                  </span>
                </div>
                <ProgressBar spent={subSpent} planned={subPlanned} type={categoryType} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { categories, currentMonthTransactions, currentMonthBudget } = useApp()

  const actualIncome = getTotalByType(currentMonthTransactions, 'income')
  const actualExpenses = getTotalByType(currentMonthTransactions, 'expense')
  const plannedIncome = getTotalPlannedByType(categories, currentMonthBudget, 'income')
  const plannedExpenses = getTotalPlannedByType(categories, currentMonthBudget, 'expense')
  const unbudgeted = getUnbudgetedAmount(categories, currentMonthBudget)

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={TrendingUp}
          label="Income"
          amount={actualIncome}
          subtitle={`${formatCurrency(plannedIncome)} planned`}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Expenses"
          amount={actualExpenses}
          subtitle={`${formatCurrency(plannedExpenses)} planned`}
          colorClass="bg-red-50 text-red-500"
        />
        <SummaryCard
          icon={Wallet}
          label="Remaining"
          amount={actualIncome - actualExpenses}
          subtitle="actual income − expenses"
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <SummaryCard
          icon={Target}
          label="Unbudgeted"
          amount={unbudgeted}
          subtitle="income not yet assigned"
          colorClass={
            unbudgeted === 0
              ? 'bg-emerald-50 text-emerald-600'
              : unbudgeted < 0
                ? 'bg-red-50 text-red-500'
                : 'bg-amber-50 text-amber-600'
          }
        />
      </div>

      {/* Zero-based budget alert */}
      {Math.abs(unbudgeted) < 0.01 && plannedIncome > 0 ? (
        <div className="rounded-xl p-4 text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-800">
          Every dollar is budgeted. You're all set!
        </div>
      ) : unbudgeted > 0.01 ? (
        <div className="rounded-xl p-4 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-800">
          You have {formatCurrency(unbudgeted)} left to budget. Head to Budget to assign it.
        </div>
      ) : unbudgeted < -0.01 ? (
        <div className="rounded-xl p-4 text-sm font-medium bg-red-50 border border-red-200 text-red-800">
          You've over-allocated {formatCurrency(Math.abs(unbudgeted))} beyond your planned income.
        </div>
      ) : null}

      {/* Income categories */}
      {incomeCategories.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Income</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeCategories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                transactions={currentMonthTransactions}
                monthBudget={currentMonthBudget}
              />
            ))}
          </div>
        </section>
      )}

      {/* Expense categories */}
      {expenseCategories.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Expenses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseCategories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                transactions={currentMonthTransactions}
                monthBudget={currentMonthBudget}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
