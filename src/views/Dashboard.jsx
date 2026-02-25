import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/formatters'
import {
  getCategorySpent,
  getCategoryPlanned,
  getTotalByType,
  getTotalPlannedByType,
  getUnbudgetedAmount,
} from '../utils/budgetUtils'
import ProgressBar from '../components/common/ProgressBar'
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react'

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

function CategoryCard({ category, transactions, planned }) {
  const spent = getCategorySpent(transactions, category.id)

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
          <h3 className="text-sm font-medium text-slate-800">{category.name}</h3>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-slate-800">{formatCurrency(spent)}</span>
          <span className="text-xs text-slate-400 ml-1">/ {formatCurrency(planned)}</span>
        </div>
      </div>
      <ProgressBar spent={spent} planned={planned} />
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
      {unbudgeted !== 0 && (
        <div className={`rounded-xl p-4 text-sm font-medium ${
          unbudgeted > 0
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {unbudgeted > 0
            ? `You have ${formatCurrency(unbudgeted)} left to budget. Head to Budget to assign it.`
            : `You've over-allocated ${formatCurrency(Math.abs(unbudgeted))} beyond your planned income.`
          }
        </div>
      )}

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
                planned={getCategoryPlanned(currentMonthBudget, cat.id)}
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
                planned={getCategoryPlanned(currentMonthBudget, cat.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
