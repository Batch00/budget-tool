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
    <div className="space-y-4 max-w-3xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
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
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No transactions yet for this month.</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add Transaction" to get started.</p>
        </div>
      ) : (
        /* Transaction list */
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {sorted.map(t => {
            const subName = getSubcategoryName(t.categoryId, t.subcategoryId)
            const color = getCategoryColor(t.categoryId)
            return (
              <div
                key={t.id}
                className="flex items-center gap-3.5 px-5 py-3.5 group hover:bg-slate-50 transition-colors"
              >
                {/* Category color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Primary info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {t.merchant || getCategoryName(t.categoryId)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {getCategoryName(t.categoryId)}
                    {subName && <> · {subName}</>}
                    {' · '}
                    {formatDate(t.date)}
                    {t.notes && <> · <span className="italic">{t.notes}</span></>}
                  </p>
                </div>

                {/* Amount */}
                <span className={`text-sm font-semibold flex-shrink-0 ${
                  t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                  {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                </span>

                {/* Edit / Delete — revealed on hover */}
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
    </div>
  )
}
