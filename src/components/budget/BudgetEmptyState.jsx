import { useState } from 'react'
import { CalendarDays, Sparkles } from 'lucide-react'
import { formatMonthLabel } from '../../utils/formatters'

function Illustration() {
  return (
    <div className="relative w-28 h-28 mx-auto mb-8">
      <div className="absolute inset-0 bg-indigo-100 rounded-2xl rotate-6" />
      <div className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
        <CalendarDays size={44} className="text-indigo-500" strokeWidth={1.5} />
      </div>
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 rounded-full shadow-sm" />
      <div className="absolute -bottom-1.5 -left-2 w-4 h-4 bg-amber-400 rounded-full shadow-sm" />
      <div className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-3 h-3 bg-indigo-300 rounded-full" />
    </div>
  )
}

export default function BudgetEmptyState({ currentMonth, prevMonth, nextMonth, onCopy, onScratch }) {
  const currentLabel = formatMonthLabel(currentMonth)
  const bothNeighbors = prevMonth && nextMonth
  const oneNeighbor = (prevMonth || nextMonth) && !bothNeighbors
  const noNeighbors = !prevMonth && !nextMonth

  // When both neighbors exist, let the user pick; default to prev (more natural)
  const [selectedSource, setSelectedSource] = useState(prevMonth ?? nextMonth)

  // Keep selectedSource valid if prevMonth/nextMonth change (e.g. month switch)
  const resolvedSource = bothNeighbors
    ? selectedSource
    : (prevMonth ?? nextMonth ?? null)

  const sourceLabel = resolvedSource ? formatMonthLabel(resolvedSource) : null

  return (
    <div className="flex items-center justify-center min-h-[64vh]">
      <div className="text-center max-w-sm w-full px-4">
        <Illustration />

        {/* Heading */}
        <h2 className="text-xl font-bold text-slate-800 leading-snug">
          Looks like you need a budget
          <br />
          <span className="text-indigo-600">for {currentLabel}</span>
        </h2>

        {/* ── No neighbors: scratch-only ───────────────────────────────────── */}
        {noNeighbors && (
          <>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              Set up your budget for{' '}
              <span className="font-medium text-slate-700">{currentLabel}</span>.
              You can adjust planned amounts at any time.
            </p>
            <button
              onClick={onScratch}
              className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Start Planning for {currentLabel}
            </button>
          </>
        )}

        {/* ── One neighbor: single copy option ─────────────────────────────── */}
        {oneNeighbor && (
          <>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              We'll copy your{' '}
              <span className="font-medium text-slate-700">{sourceLabel}</span>{' '}
              budget to get you started — just adjust the amounts to match your plan.
            </p>
            <button
              onClick={() => onCopy(resolvedSource)}
              className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Copy {sourceLabel} Budget
            </button>
            <button
              onClick={onScratch}
              className="mt-5 text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 decoration-slate-300 hover:decoration-slate-500"
            >
              or start with a blank slate
            </button>
          </>
        )}

        {/* ── Both neighbors: picker + copy ────────────────────────────────── */}
        {bothNeighbors && (
          <>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              You have budgets on both sides. Pick which one to copy as your starting point.
            </p>

            {/* Source picker */}
            <div className="mt-6">
              <p className="text-xs font-medium text-slate-500 mb-2">Copy from</p>
              <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                {[prevMonth, nextMonth].map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedSource(key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedSource === key
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {formatMonthLabel(key)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onCopy(selectedSource)}
              className="mt-5 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Copy {formatMonthLabel(selectedSource)} Budget
            </button>
            <button
              onClick={onScratch}
              className="mt-5 text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 decoration-slate-300 hover:decoration-slate-500"
            >
              or start with a blank slate
            </button>
          </>
        )}
      </div>
    </div>
  )
}
