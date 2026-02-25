import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getTodayString } from '../../utils/formatters'

const emptyForm = () => ({
  amount: '',
  date: getTodayString(),
  categoryId: '',
  subcategoryId: '',
  merchant: '',
  notes: '',
})

export default function TransactionModal({ isOpen, onClose, editingTransaction = null }) {
  const { categories, addTransaction, updateTransaction } = useApp()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (editingTransaction) {
      setForm({
        amount: String(editingTransaction.amount),
        date: editingTransaction.date,
        categoryId: editingTransaction.categoryId,
        subcategoryId: editingTransaction.subcategoryId ?? '',
        merchant: editingTransaction.merchant ?? '',
        notes: editingTransaction.notes ?? '',
      })
    } else {
      setForm(emptyForm())
    }
    setErrors({})
  }, [isOpen, editingTransaction])

  const selectedCategory = categories.find(c => c.id === form.categoryId)
  const subcategories = selectedCategory?.subcategories ?? []
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const set = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Reset subcategory whenever category changes
      if (field === 'categoryId') next.subcategoryId = ''
      return next
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const errs = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount'
    if (!form.date) errs.date = 'Date is required'
    if (!form.categoryId) errs.categoryId = 'Select a category'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const payload = {
      amount: parseFloat(form.amount),
      date: form.date,
      type: selectedCategory.type,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      merchant: form.merchant.trim() || null,
      notes: form.notes.trim() || null,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload)
    } else {
      addTransaction(payload)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  className={`w-full pl-7 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 transition-colors ${
                    errors.amount
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-indigo-400'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 transition-colors ${
                  errors.date
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-slate-200 focus:border-indigo-400'
                }`}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 bg-white transition-colors ${
                errors.categoryId
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-slate-200 focus:border-indigo-400'
              }`}
            >
              <option value="">Select a category…</option>
              {incomeCategories.length > 0 && (
                <optgroup label="Income">
                  {incomeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              {expenseCategories.length > 0 && (
                <optgroup label="Expenses">
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
          </div>

          {/* Subcategory — only shown when the selected category has subcategories */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Subcategory</label>
              <select
                value={form.subcategoryId}
                onChange={e => set('subcategoryId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white transition-colors"
              >
                <option value="">None</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Merchant */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Merchant</label>
            <input
              type="text"
              placeholder="e.g. Whole Foods, Netflix…"
              value={form.merchant}
              onChange={e => set('merchant', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <input
              type="text"
              placeholder="Optional notes…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
