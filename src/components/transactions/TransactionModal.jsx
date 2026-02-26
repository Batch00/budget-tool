import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getTodayString } from '../../utils/formatters'

let _splitIdCounter = 0
const newSplitId = () => `split-${++_splitIdCounter}`

const emptyForm = () => ({
  amount: '',
  date: getTodayString(),
  merchant: '',
  notes: '',
  splits: [{ id: newSplitId(), categoryId: '', subcategoryId: '', amount: '' }],
})

export default function TransactionModal({ isOpen, onClose, editingTransaction = null }) {
  const { categories, addTransaction, updateTransaction } = useApp()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (editingTransaction) {
      if (editingTransaction.splits) {
        // Split transaction — restore split rows
        setForm({
          amount: String(editingTransaction.amount),
          date: editingTransaction.date,
          merchant: editingTransaction.merchant ?? '',
          notes: editingTransaction.notes ?? '',
          splits: editingTransaction.splits.map(s => ({
            id: newSplitId(),
            categoryId: s.categoryId,
            subcategoryId: s.subcategoryId ?? '',
            amount: String(s.amount),
          })),
        })
      } else {
        // Flat transaction — single split row
        setForm({
          amount: String(editingTransaction.amount),
          date: editingTransaction.date,
          merchant: editingTransaction.merchant ?? '',
          notes: editingTransaction.notes ?? '',
          splits: [{
            id: newSplitId(),
            categoryId: editingTransaction.categoryId ?? '',
            subcategoryId: editingTransaction.subcategoryId ?? '',
            amount: String(editingTransaction.amount),
          }],
        })
      }
    } else {
      setForm(emptyForm())
    }
    setErrors({})
  }, [isOpen, editingTransaction])

  // Derive the locked type from the first split that has a category selected
  const lockedType = (() => {
    for (const s of form.splits) {
      const cat = categories.find(c => c.id === s.categoryId)
      if (cat) return cat.type
    }
    return null
  })()

  const filteredCategories = lockedType
    ? categories.filter(c => c.type === lockedType)
    : categories

  const incomeCategories = filteredCategories.filter(c => c.type === 'income')
  const expenseCategories = filteredCategories.filter(c => c.type === 'expense')

  const totalAmount = parseFloat(form.amount) || 0
  const assignedAmount = form.splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  const remaining = parseFloat((totalAmount - assignedAmount).toFixed(2))

  // Update top-level field (amount, date, merchant, notes)
  const setField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-sync: when total amount changes with exactly 1 split row, update that row's amount
      if (field === 'amount' && prev.splits.length === 1) {
        next.splits = [{ ...prev.splits[0], amount: value }]
      }
      return next
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  // Update a specific split row field
  const setSplitField = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      splits: prev.splits.map(s => {
        if (s.id !== id) return s
        const updated = { ...s, [field]: value }
        // Reset subcategory when category changes
        if (field === 'categoryId') updated.subcategoryId = ''
        return updated
      }),
    }))
    if (errors.splits) setErrors(prev => ({ ...prev, splits: null }))
  }

  const addSplitRow = () => {
    const pre = Math.max(0, remaining)
    setForm(prev => ({
      ...prev,
      splits: [
        ...prev.splits,
        { id: newSplitId(), categoryId: '', subcategoryId: '', amount: pre > 0 ? String(pre) : '' },
      ],
    }))
  }

  const removeSplitRow = (id) => {
    setForm(prev => ({
      ...prev,
      splits: prev.splits.filter(s => s.id !== id),
    }))
  }

  const validate = () => {
    const errs = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount'
    if (!form.date) errs.date = 'Date is required'
    const missingCategory = form.splits.some(s => !s.categoryId)
    if (missingCategory) errs.splits = 'Every row needs a category'
    if (!errs.amount && Math.abs(remaining) >= 0.01) {
      errs.splits = remaining > 0
        ? `$${remaining.toFixed(2)} still unassigned`
        : `Over-assigned by $${Math.abs(remaining).toFixed(2)}`
    }
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const totalAmt = parseFloat(form.amount)
    const type = lockedType ?? 'expense'

    let payload
    if (form.splits.length === 1) {
      // Backward-compatible flat format
      const s = form.splits[0]
      const cat = categories.find(c => c.id === s.categoryId)
      payload = {
        amount: totalAmt,
        date: form.date,
        type: cat?.type ?? type,
        categoryId: s.categoryId,
        subcategoryId: s.subcategoryId || null,
        merchant: form.merchant.trim() || null,
        notes: form.notes.trim() || null,
      }
    } else {
      // Split format
      payload = {
        amount: totalAmt,
        date: form.date,
        type,
        categoryId: null,
        subcategoryId: null,
        merchant: form.merchant.trim() || null,
        notes: form.notes.trim() || null,
        splits: form.splits.map(s => ({
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId || null,
          amount: parseFloat(s.amount),
        })),
      }
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload)
    } else {
      addTransaction(payload)
    }
    onClose()
  }

  if (!isOpen) return null

  const remainingColor =
    Math.abs(remaining) < 0.01
      ? 'text-emerald-600'
      : remaining < 0
      ? 'text-red-500'
      : 'text-amber-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
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
                  onChange={e => setField('amount', e.target.value)}
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
                onChange={e => setField('date', e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 transition-colors ${
                  errors.date
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-slate-200 focus:border-indigo-400'
                }`}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Merchant</label>
            <input
              type="text"
              placeholder="e.g. Target, Netflix…"
              value={form.merchant}
              onChange={e => setField('merchant', e.target.value)}
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
              onChange={e => setField('notes', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Split rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">
                Categories <span className="text-red-400">*</span>
              </label>
              {/* Remaining counter — only shown when multiple rows or amount is set */}
              {(form.splits.length > 1 || form.amount) && (
                <span className={`text-xs font-medium ${remainingColor}`}>
                  {Math.abs(remaining) < 0.01
                    ? 'Fully assigned'
                    : remaining > 0
                    ? `$${remaining.toFixed(2)} remaining`
                    : `$${Math.abs(remaining).toFixed(2)} over`}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {form.splits.map((split, idx) => {
                const splitCat = categories.find(c => c.id === split.categoryId)
                const splitSubs = splitCat?.subcategories ?? []
                return (
                  <div key={split.id} className="flex gap-2 items-start">
                    {/* Category select */}
                    <div className="flex-1 min-w-0">
                      <select
                        value={split.categoryId}
                        onChange={e => setSplitField(split.id, 'categoryId', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 bg-white transition-colors ${
                          errors.splits && !split.categoryId
                            ? 'border-red-300 focus:border-red-400'
                            : 'border-slate-200 focus:border-indigo-400'
                        }`}
                      >
                        <option value="">Category…</option>
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

                      {/* Subcategory — shown inline below category when available */}
                      {splitSubs.length > 0 && (
                        <select
                          value={split.subcategoryId}
                          onChange={e => setSplitField(split.id, 'subcategoryId', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white transition-colors mt-1.5"
                        >
                          <option value="">No subcategory</option>
                          {splitSubs.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Split amount */}
                    <div className="relative w-28 flex-shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={split.amount}
                        onChange={e => setSplitField(split.id, 'amount', e.target.value)}
                        className="w-full pl-7 pr-2 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
                      />
                    </div>

                    {/* Remove row button */}
                    <button
                      type="button"
                      onClick={() => removeSplitRow(split.id)}
                      disabled={form.splits.length === 1}
                      title="Remove"
                      className="p-2 mt-0.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>

            {errors.splits && <p className="text-xs text-red-500 mt-1.5">{errors.splits}</p>}

            {/* Add another category */}
            <button
              type="button"
              onClick={addSplitRow}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus size={13} />
              Add another category
            </button>
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
