import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import TransactionModal from '../components/transactions/TransactionModal'

export default function Transactions() {
  const { currentMonthTransactions, categories, deleteTransaction } = useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)

  const getCategoryName = (categoryId) =>
    categories.find(c => c.id === categoryId)?.name ?? 'Unknown'

  const getCategoryColor = (categoryId) =>
    categories.find(c => c.id === categoryId)?.color ?? '#94a3b8'

  const getSubcategoryName = (categoryId, subcategoryId) => {
    if (!subcategoryId) return null
    const cat = categories.find(c => c.id === categoryId)
    return cat?.subcategories.find(s => s.id === subcategoryId)?.name ?? null
  }

  // Color dot for a split row (falls back to slate if category not found)
  const getSplitCategoryColor = (split) =>
    categories.find(c => c.id === split.categoryId)?.color ?? '#94a3b8'

  const sorted = [...currentMonthTransactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  const openAdd = () => {
    setEditingTransaction(null)
    setModalOpen(true)
  }

  const openEdit = (transaction) => {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this transaction?')) {
      deleteTransaction(id)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl pb-24">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {currentMonthTransactions.length} transaction{currentMonthTransactions.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No transactions yet for this month.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Click "Add Transaction" to get started.</p>
        </div>
      ) : (
        /* Transaction list */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {sorted.map(t => {
            if (t.splits) {
              // Split transaction — main row + sub-rows
              const firstSplitColor = getSplitCategoryColor(t.splits[0])
              return (
                <div key={t.id}>
                  {/* Main row */}
                  <div className="flex items-center gap-3.5 px-5 py-3.5 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: firstSplitColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {t.merchant || 'Split Transaction'}
                        </p>
                        <span className="flex-shrink-0 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                          Split
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatDate(t.date)}
                        {t.notes && <> · <span className="italic">{t.notes}</span></>}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => openEdit(t)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Split sub-rows */}
                  {t.splits.map((split, idx) => {
                    const isLast = idx === t.splits.length - 1
                    const subName = getSubcategoryName(split.categoryId, split.subcategoryId)
                    const color = getSplitCategoryColor(split)
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3.5 pl-10 pr-5 py-2 bg-slate-50/60 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700"
                      >
                        {/* Tree branch indicator */}
                        <span className="text-slate-300 dark:text-slate-600 text-xs flex-shrink-0 select-none">
                          {isLast ? '└' : '├'}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <p className="flex-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                          {getCategoryName(split.categoryId)}
                          {subName && <> · {subName}</>}
                        </p>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(split.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            }

            // Regular (flat) transaction — unchanged rendering
            const subName = getSubcategoryName(t.categoryId, t.subcategoryId)
            const color = getCategoryColor(t.categoryId)
            return (
              <div
                key={t.id}
                className="flex items-center gap-3.5 px-5 py-3.5 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {t.merchant || getCategoryName(t.categoryId)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {getCategoryName(t.categoryId)}
                    {subName && <> · {subName}</>}
                    {' · '}
                    {formatDate(t.date)}
                    {t.notes && <> · <span className="italic">{t.notes}</span></>}
                  </p>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${
                  t.type === 'income' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    title="Edit"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTransaction={editingTransaction}
      />

      {/* FAB — fixed to viewport bottom-right */}
      <button
        onClick={openAdd}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center"
        title="Add Transaction"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
