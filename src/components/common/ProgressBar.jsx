import { getProgressPercent, getProgressStatus } from '../../utils/budgetUtils'
import { formatCurrency } from '../../utils/formatters'

const barColors = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-400',
  over: 'bg-red-500',
  none: 'bg-slate-300',
}

// type: 'expense' (default) | 'income'
export default function ProgressBar({ spent, planned, type = 'expense', showLabels = true, compact = false }) {
  const percent = getProgressPercent(spent, planned)
  const status = getProgressStatus(spent, planned, type)
  const remaining = (planned ?? 0) - (spent ?? 0)

  const isIncome = type === 'income'

  return (
    <div>
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${compact ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColors[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabels && !compact && (
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{formatCurrency(spent)} {isIncome ? 'received' : 'spent'}</span>
          <span className={remaining < 0 ? 'text-red-500 font-medium' : ''}>
            {remaining < 0
              ? `${formatCurrency(Math.abs(remaining))} over`
              : `${formatCurrency(remaining)} left`}
          </span>
        </div>
      )}
    </div>
  )
}
