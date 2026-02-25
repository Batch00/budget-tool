import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import { Plus } from 'lucide-react'

export default function Transactions() {
  const { currentMonthTransactions, categories } = useApp()

  const getCategoryName = (categoryId) =>
    categories.find(c => c.id === categoryId)?.name ?? categoryId

  const getSubcategoryName = (categoryId, subcategoryId) => {
    if (!subcategoryId) return null
    const cat = categories.find(c => c.id === categoryId)
    return cat?.subcategories.find(s => s.id === subcategoryId)?.name ?? null
  }

  const sorted = [...currentMonthTransactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {currentMonthTransactions.length} transaction{currentMonthTransactions.length !== 1 ? 's' : ''}
        </p>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => alert('Transaction form coming next!')}
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No transactions yet for this month.</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add Transaction" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {sorted.map(t => {
            const subName = getSubcategoryName(t.categoryId, t.subcategoryId)
            return (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.merchant || 'Unknown'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {getCategoryName(t.categoryId)}
                    {subName && <> · {subName}</>}
                    {' · '}
                    {formatDate(t.date)}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
