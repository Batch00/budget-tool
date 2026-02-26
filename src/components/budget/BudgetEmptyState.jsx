import { CalendarDays, Sparkles } from 'lucide-react'
import { formatMonthLabel } from '../../utils/formatters'

export default function BudgetEmptyState({ currentMonth, previousMonth, onCopy, onScratch }) {
  const currentLabel = formatMonthLabel(currentMonth)
  const prevLabel = previousMonth ? formatMonthLabel(previousMonth) : null
  const hasPrevious = !!prevLabel

  return (
    <div className="flex items-center justify-center min-h-[64vh]">
      <div className="text-center max-w-sm w-full px-4">

        {/* Illustration */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          {/* Rotated back card for depth */}
          <div className="absolute inset-0 bg-indigo-100 rounded-2xl rotate-6" />
          {/* Front card */}
          <div className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
            <CalendarDays size={44} className="text-indigo-500" strokeWidth={1.5} />
          </div>
          {/* Accent dots */}
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 rounded-full shadow-sm" />
          <div className="absolute -bottom-1.5 -left-2 w-4 h-4 bg-amber-400 rounded-full shadow-sm" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-3 h-3 bg-indigo-300 rounded-full" />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-slate-800 leading-snug">
          Looks like you need a budget
          <br />
          <span className="text-indigo-600">for {currentLabel}</span>
        </h2>

        {/* Subtext */}
        <p className="mt-3 text-sm text-slate-500 leading-relaxed">
          {hasPrevious
            ? <>
                We'll copy your{' '}
                <span className="font-medium text-slate-700">{prevLabel}</span>{' '}
                budget to get you started — just adjust the amounts to match your plan.
              </>
            : <>
                Set up your first budget for{' '}
                <span className="font-medium text-slate-700">{currentLabel}</span>.
                You can adjust planned amounts at any time.
              </>
          }
        </p>

        {/* Primary button */}
        <button
          onClick={hasPrevious ? onCopy : onScratch}
          className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
        >
          <Sparkles size={16} />
          {hasPrevious
            ? `Copy ${prevLabel} Budget`
            : `Start Planning for ${currentLabel}`
          }
        </button>

        {/* If we're copying, also show the month in a secondary line */}
        {hasPrevious && (
          <p className="mt-2 text-xs text-slate-400">
            Sets up your budget for {currentLabel}
          </p>
        )}

        {/* Secondary — start fresh */}
        {hasPrevious && (
          <button
            onClick={onScratch}
            className="mt-5 text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 decoration-slate-300 hover:decoration-slate-500"
          >
            or start with a blank slate
          </button>
        )}
      </div>
    </div>
  )
}
