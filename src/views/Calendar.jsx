import { useState, useMemo } from 'react'
import { Plus, DollarSign, AlertTriangle, X, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, formatMonthLabel } from '../utils/formatters'
import TransactionModal from '../components/transactions/TransactionModal'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── PaycheckModal ─────────────────────────────────────────────────────────────

function PaycheckModal({ plan, monthKey, onSave, onClose }) {
  const [label, setLabel] = useState(plan?.label ?? 'Paycheck')
  const [date, setDate] = useState(plan?.date ?? `${monthKey}-01`)
  const [amount, setAmount] = useState(plan?.amount?.toString() ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!date || isNaN(amt) || amt <= 0) return
    onSave({ label, date, amount: amt })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">{plan ? 'Edit Paycheck' : 'Add Paycheck'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Paycheck"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── DayModal ──────────────────────────────────────────────────────────────────

function DayModal({ dayStr, transactions, paychecks, categories, onClose, onEditTransaction }) {
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const incomeItems = [
    ...paychecks.map(p => ({ _kind: 'paycheck', id: p.id, label: p.label, amount: p.amount })),
    ...transactions.filter(t => t.type === 'income').map(t => ({ _kind: 'transaction', ...t })),
  ]
  const expenses = transactions.filter(t => t.type === 'expense')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">{formatDate(dayStr)}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {incomeItems.length === 0 && expenses.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No events this day.</p>
          )}

          {incomeItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Income</p>
              <div className="space-y-0.5">
                {incomeItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {item._kind === 'paycheck' ? item.label : (item.merchant || 'Income')}
                        </p>
                        {item._kind === 'transaction' && item.isPending && (
                          <span className="text-xs text-amber-500">Pending</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount)}</span>
                      {item._kind === 'transaction' && (
                        <button
                          onClick={() => onEditTransaction(item)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expenses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Expenses</p>
              <div className="space-y-0.5">
                {expenses.map((t, i) => {
                  const cat = catMap[t.categoryId]
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {t.merchant || cat?.name || 'Expense'}
                          </p>
                          {t.isPending && <span className="text-xs text-amber-500">Pending</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-500 dark:text-red-400">{formatCurrency(t.amount)}</span>
                        <button
                          onClick={() => onEditTransaction(t)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export default function Calendar() {
  const {
    currentMonth,
    currentMonthTransactions,
    currentMonthPaycheckPlans,
    categories,
    addPaycheckPlan,
    updatePaycheckPlan,
    deletePaycheckPlan,
  } = useApp()

  const [year, month] = currentMonth.split('-').map(Number)
  const [selectedDay, setSelectedDay] = useState(null)
  const [paycheckModal, setPaycheckModal] = useState(null) // null | {} | { plan }
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [startingBalance, setStartingBalance] = useState('0')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  // Events indexed by day-of-month
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const t of currentMonthTransactions) {
      const day = parseInt(t.date.split('-')[2], 10)
      if (!map[day]) map[day] = { transactions: [], paychecks: [] }
      map[day].transactions.push(t)
    }
    for (const p of (currentMonthPaycheckPlans ?? [])) {
      const day = parseInt(p.date.split('-')[2], 10)
      if (!map[day]) map[day] = { transactions: [], paychecks: [] }
      map[day].paychecks.push(p)
    }
    return map
  }, [currentMonthTransactions, currentMonthPaycheckPlans])

  // Calendar grid dimensions
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7

  // Today string for highlighting
  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

  // Cash flow — only confirmed transactions + paycheck plans
  const cashFlow = useMemo(() => {
    const balance0 = parseFloat(startingBalance) || 0
    const rows = []
    let balance = balance0
    for (let d = 1; d <= daysInMonth; d++) {
      const { transactions: txns = [], paychecks = [] } = eventsByDay[d] ?? {}
      const income =
        paychecks.reduce((s, p) => s + p.amount, 0) +
        txns.filter(t => t.type === 'income' && !t.isPending).reduce((s, t) => s + t.amount, 0)
      const expenses = txns.filter(t => t.type === 'expense' && !t.isPending).reduce((s, t) => s + t.amount, 0)
      if (income > 0 || expenses > 0) {
        balance += income - expenses
        rows.push({ day: d, income, expenses, balance })
      }
    }
    return rows
  }, [eventsByDay, daysInMonth, startingBalance])

  const handlePaycheckSave = async ({ label, date, amount }) => {
    if (paycheckModal?.plan) {
      await updatePaycheckPlan(paycheckModal.plan.id, { label, date, amount })
    } else {
      await addPaycheckPlan({ label, date, amount, monthKey: currentMonth })
    }
    setPaycheckModal(null)
  }

  const sortedPaychecks = useMemo(
    () => [...(currentMonthPaycheckPlans ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [currentMonthPaycheckPlans]
  )

  const paycheckTotal = sortedPaychecks.reduce((s, p) => s + p.amount, 0)

  const selectedDayStr = selectedDay != null
    ? `${currentMonth}-${String(selectedDay).padStart(2, '0')}`
    : null
  const selectedEvents = selectedDay != null ? (eventsByDay[selectedDay] ?? { transactions: [], paychecks: [] }) : null

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{formatMonthLabel(currentMonth)}</p>
        </div>
        <button
          onClick={() => setPaycheckModal({})}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Paycheck
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {DAY_LABELS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }, (_, idx) => {
            const day = idx - firstDayOfWeek + 1
            const inMonth = day >= 1 && day <= daysInMonth
            const dayStr = inMonth ? `${currentMonth}-${String(day).padStart(2, '0')}` : null
            const isToday = dayStr === todayStr
            const { transactions: dayTxns = [], paychecks: dayChecks = [] } = inMonth ? (eventsByDay[day] ?? {}) : {}
            const allPills = [
              ...dayChecks.map(p => ({ _kind: 'paycheck', id: p.id, label: p.label, amount: p.amount })),
              ...dayTxns,
            ]
            const shown = allPills.slice(0, 3)
            const extra = allPills.length - shown.length

            return (
              <div
                key={idx}
                onClick={() => inMonth && setSelectedDay(day)}
                className={[
                  'min-h-[90px] p-1.5 border-b border-slate-100 dark:border-slate-700/60',
                  idx % 7 !== 6 ? 'border-r border-slate-100 dark:border-slate-700/60' : '',
                  idx >= totalCells - 7 ? 'border-b-0' : '',
                  inMonth ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors' : 'bg-slate-50/50 dark:bg-slate-800/30',
                ].join(' ')}
              >
                {inMonth && (
                  <>
                    <div
                      className={[
                        'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300',
                      ].join(' ')}
                    >
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {shown.map((item, i) => {
                        if (item._kind === 'paycheck') {
                          return (
                            <div
                              key={i}
                              className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded px-1 py-0.5 truncate leading-4"
                            >
                              {item.label}
                            </div>
                          )
                        }
                        const cat = catMap[item.categoryId]
                        const isIncome = item.type === 'income'
                        const baseColor = cat?.color ?? (isIncome ? '#10b981' : '#ef4444')
                        return (
                          <div
                            key={i}
                            className={`text-xs rounded px-1 py-0.5 truncate leading-4 ${item.isPending ? 'opacity-60' : ''}`}
                            style={{
                              backgroundColor: `${baseColor}22`,
                              color: baseColor,
                            }}
                          >
                            {item.merchant || cat?.name || (isIncome ? 'Income' : 'Expense')}
                          </div>
                        )
                      })}
                      {extra > 0 && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 px-1">+{extra} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Paycheck Plans */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Paychecks</h2>
          {paycheckTotal > 0 && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {formatCurrency(paycheckTotal)} total
            </span>
          )}
        </div>
        {sortedPaychecks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No paychecks planned for this month.</p>
            <button
              onClick={() => setPaycheckModal({})}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Add your first paycheck
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {sortedPaychecks.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(p.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.amount)}
                  </span>
                  <button
                    onClick={() => setPaycheckModal({ plan: p })}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(p.id)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash Flow */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Cash Flow</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 dark:text-slate-400">Starting balance</label>
            <input
              type="number"
              value={startingBalance}
              onChange={e => setStartingBalance(e.target.value)}
              className="w-28 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        {cashFlow.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No confirmed transactions or paychecks this month yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Date</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Income</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Expenses</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                {cashFlow.map(row => {
                  const isNeg = row.balance < 0
                  const dateStr = `${currentMonth}-${String(row.day).padStart(2, '0')}`
                  return (
                    <tr key={row.day} className={isNeg ? 'bg-red-50/60 dark:bg-red-900/10' : ''}>
                      <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          {isNeg && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                          {formatDate(dateStr)}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {row.income > 0 ? `+${formatCurrency(row.income)}` : '—'}
                      </td>
                      <td className="px-5 py-2.5 text-right text-red-500 dark:text-red-400 tabular-nums">
                        {row.expenses > 0 ? `-${formatCurrency(row.expenses)}` : '—'}
                      </td>
                      <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${isNeg ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paycheck modal */}
      {paycheckModal !== null && (
        <PaycheckModal
          plan={paycheckModal.plan}
          monthKey={currentMonth}
          onSave={handlePaycheckSave}
          onClose={() => setPaycheckModal(null)}
        />
      )}

      {/* Day detail modal */}
      {selectedDay !== null && selectedEvents !== null && (
        <DayModal
          dayStr={selectedDayStr}
          transactions={selectedEvents.transactions}
          paychecks={selectedEvents.paychecks}
          categories={categories}
          onClose={() => setSelectedDay(null)}
          onEditTransaction={t => { setSelectedDay(null); setEditingTransaction(t) }}
        />
      )}

      {/* Transaction edit modal (opened from DayModal) */}
      {editingTransaction && (
        <TransactionModal
          isOpen={true}
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Delete paycheck confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Delete paycheck?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">This removes the paycheck plan from the calendar and cash flow.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => { await deletePaycheckPlan(confirmDeleteId); setConfirmDeleteId(null) }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
