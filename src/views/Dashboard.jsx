import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Wallet, Target, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, formatMonthLabel } from '../utils/formatters'
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
import BudgetEmptyState from '../components/budget/BudgetEmptyState'
import TransactionModal from '../components/transactions/TransactionModal'

function SummaryCard({ icon: Icon, label, amount, subtitle, colorClass }) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-800 tabular-nums">{formatCurrency(amount)}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
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
  const {
    categories,
    currentMonth,
    currentMonthTransactions,
    currentMonthBudget,
    budgets,
    copyBudget,
  } = useApp()

  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)

  // Empty-state detection — same logic as Budget page
  const monthHasBudget =
    Object.values(budgets[currentMonth]?.planned ?? {}).some(v => v > 0) ||
    Object.values(budgets[currentMonth]?.subcategoryPlanned ?? {}).some(v => v > 0)
  const monthHasTransactions = currentMonthTransactions.length > 0
  const isUninitialized = !monthHasBudget && !monthHasTransactions

  // Nearest months with budget data, for the empty-state copy picker
  const { prevMonth, nextMonth } = useMemo(() => {
    const keysWithData = Object.keys(budgets).filter(k =>
      Object.values(budgets[k]?.planned ?? {}).some(v => v > 0) ||
      Object.values(budgets[k]?.subcategoryPlanned ?? {}).some(v => v > 0)
    )
    const prev = keysWithData.filter(k => k < currentMonth).sort().reverse()[0] ?? null
    const next = keysWithData.filter(k => k > currentMonth).sort()[0] ?? null
    return { prevMonth: prev, nextMonth: next }
  }, [budgets, currentMonth])

  const actualIncome = getTotalByType(currentMonthTransactions, 'income')
  const actualExpenses = getTotalByType(currentMonthTransactions, 'expense')
  const plannedIncome = getTotalPlannedByType(categories, currentMonthBudget, 'income')
  const plannedExpenses = getTotalPlannedByType(categories, currentMonthBudget, 'expense')
  const unbudgeted = getUnbudgetedAmount(categories, currentMonthBudget)

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Last 5 transactions for the recent activity panel
  const recentTransactions = [...currentMonthTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  // Show the friendly empty state when no budget and no transactions exist for this month
  if (isUninitialized) {
    return (
      <>
        <BudgetEmptyState
          currentMonth={currentMonth}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          onCopy={(sourceKey) => copyBudget(sourceKey, currentMonth)}
          onScratch={() => navigate('/budget')}
        />
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center"
          title="Add Transaction"
        >
          <Plus size={24} />
        </button>
        <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    )
  }

  return (
    <div className="space-y-6 pb-24">
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

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">What did you spend today?</span>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus size={12} />
              Log it
            </button>
          </div>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-slate-400 text-sm">No transactions yet this month.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentTransactions.map(t => {
              const isIncome = t.type === 'income'
              let label, color
              if (t.splits) {
                const firstCat = categories.find(c => c.id === t.splits[0].categoryId)
                label = t.merchant || 'Split Transaction'
                color = firstCat?.color ?? '#94a3b8'
              } else {
                const cat = categories.find(c => c.id === t.categoryId)
                label = t.merchant || cat?.name || 'Unknown'
                color = cat?.color ?? '#94a3b8'
              }
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{label}</p>
                    <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 tabular-nums ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isIncome ? '+' : '−'}{formatCurrency(t.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* FAB — fixed to viewport bottom-right */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center"
        title="Add Transaction"
      >
        <Plus size={24} />
      </button>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
