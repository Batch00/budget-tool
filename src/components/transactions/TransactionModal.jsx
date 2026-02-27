import { useState, useEffect } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getTodayString } from '../../utils/formatters'
import {
  getSubcategoryPlanned,
  getSubcategorySpent,
  getCategoryEffectivePlanned,
  getCategorySpent,
} from '../../utils/budgetUtils'

let _splitIdCounter = 0
const newSplitId = () => `split-${++_splitIdCounter}`

const emptyForm = () => ({
  amount: '',
  date: getTodayString(),
  merchant: '',
  notes: '',
  splits: [],
})

export default function TransactionModal({ isOpen, onClose, editingTransaction = null }) {
  const {
    categories,
    addTransaction,
    updateTransaction,
    currentMonthTransactions,
    currentMonthBudget,
    currentMonth,
  } = useApp()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [pickerOpen, setPickerOpen] = useState(false)

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (editingTransaction) {
      if (editingTransaction.splits) {
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
      // Default date to today if it falls within the viewed month; otherwise use the 1st of that month.
      // This prevents transactions from silently landing in the wrong month when the user is browsing history.
      const todayStr = getTodayString()
      const defaultDate = todayStr.startsWith(currentMonth) ? todayStr : `${currentMonth}-01`
      setForm({ ...emptyForm(), date: defaultDate })
    }
    setErrors({})
    setPickerOpen(false)
  }, [isOpen, editingTransaction])

  // Derive the locked type from the first split that has a category selected
  const lockedType = (() => {
    for (const s of form.splits) {
      const cat = categories.find(c => c.id === s.categoryId)
      if (cat) return cat.type
    }
    return null
  })()

  // Base transactions excluding the editing transaction (for accurate "remaining budget" display)
  const baseTransactions = editingTransaction
    ? currentMonthTransactions.filter(t => t.id !== editingTransaction.id)
    : currentMonthTransactions

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

  // Format a raw amount string to two decimal places on blur (e.g. "50" → "50.00")
  const formatAmountOnBlur = (value, setter) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) setter(num.toFixed(2))
  }

  // Update the amount field on a specific split row
  const setSplitAmount = (id, value) => {
    setForm(prev => ({
      ...prev,
      splits: prev.splits.map(s => s.id !== id ? s : { ...s, amount: value }),
    }))
    if (errors.splits) setErrors(prev => ({ ...prev, splits: null }))
  }

  // Remove a split row (also deselects it in the picker)
  const removeSplit = (id) => {
    setForm(prev => ({ ...prev, splits: prev.splits.filter(s => s.id !== id) }))
  }

  // ── Picker helpers ─────────────────────────────────────────────────────────

  const isSubSelected = (catId, subId) =>
    form.splits.some(s => s.categoryId === catId && s.subcategoryId === subId)

  const isCatSelected = (catId) =>
    form.splits.some(s => s.categoryId === catId && !s.subcategoryId)

  // Amount to pre-fill when selecting a new item
  const prefillAmount = () => {
    const pre = Math.max(0, remaining)
    return pre > 0 ? String(pre) : ''
  }

  const toggleSubItem = (catId, subId) => {
    if (errors.splits) setErrors(prev => ({ ...prev, splits: null }))
    if (isSubSelected(catId, subId)) {
      setForm(prev => ({
        ...prev,
        splits: prev.splits.filter(s => !(s.categoryId === catId && s.subcategoryId === subId)),
      }))
    } else {
      setForm(prev => ({
        ...prev,
        splits: [...prev.splits, {
          id: newSplitId(),
          categoryId: catId,
          subcategoryId: subId,
          amount: prefillAmount(),
        }],
      }))
    }
  }

  const toggleCatItem = (catId) => {
    if (errors.splits) setErrors(prev => ({ ...prev, splits: null }))
    if (isCatSelected(catId)) {
      setForm(prev => ({
        ...prev,
        splits: prev.splits.filter(s => !(s.categoryId === catId && !s.subcategoryId)),
      }))
    } else {
      setForm(prev => ({
        ...prev,
        splits: [...prev.splits, {
          id: newSplitId(),
          categoryId: catId,
          subcategoryId: '',
          amount: prefillAmount(),
        }],
      }))
    }
  }

  // ── Budget remaining calculations ─────────────────────────────────────────

  // Returns null if no budget is set (nothing to display)
  const getSubRemainingDisplay = (subId) => {
    const planned = getSubcategoryPlanned(currentMonthBudget, subId)
    if (!planned) return null
    const spent = getSubcategorySpent(baseTransactions, subId)
    const formAssigned = form.splits
      .filter(s => s.subcategoryId === subId)
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
    return planned - spent - formAssigned
  }

  const getCatRemainingDisplay = (cat) => {
    const planned = getCategoryEffectivePlanned(cat, currentMonthBudget)
    if (!planned) return null
    const spent = getCategorySpent(baseTransactions, cat.id)
    const formAssigned = form.splits
      .filter(s => s.categoryId === cat.id && !s.subcategoryId)
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
    return planned - spent - formAssigned
  }

  const formatBudgetRemaining = (val) => {
    if (val === null) return null
    const abs = Math.abs(val).toFixed(2)
    return val < 0 ? `-$${abs}` : `$${abs}`
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount'
    if (form.splits.length === 0) errs.splits = 'Select at least one budget item'
    if (form.splits.some(s => !s.categoryId)) errs.splits = 'Every row needs a category'
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

  // ── Render helpers ─────────────────────────────────────────────────────────

  const remainingColor =
    Math.abs(remaining) < 0.01
      ? 'text-emerald-600'
      : remaining < 0
      ? 'text-red-500'
      : 'text-amber-500'

  // Only show categories matching the locked type (or all if none locked yet)
  const visibleCategories = lockedType
    ? categories.filter(c => c.type === lockedType)
    : categories

  const incomeVisible = visibleCategories.filter(c => c.type === 'income')
  const expenseVisible = visibleCategories.filter(c => c.type === 'expense')

  // Trigger button label
  const selectedLabels = form.splits.map(s => {
    const cat = categories.find(c => c.id === s.categoryId)
    if (!cat) return null
    const sub = cat.subcategories.find(sub => sub.id === s.subcategoryId)
    return sub?.name ?? cat.name
  }).filter(Boolean)

  const triggerLabel = selectedLabels.length === 0
    ? null
    : selectedLabels.length <= 2
    ? selectedLabels.join(', ')
    : `${selectedLabels.length} items selected`

  // Render a single selectable row (subcategory or standalone category).
  // When selected: shows an inline amount input instead of budget remaining so
  // adding/removing selections never changes layout outside the picker panel.
  const renderPickerRow = ({ key, catId, subId, name, rem, isSelected, toggleFn, indent }) => {
    const existingSplit = isSelected
      ? form.splits.find(s => s.categoryId === catId && (subId ? s.subcategoryId === subId : !s.subcategoryId))
      : null
    const remStr = formatBudgetRemaining(rem)
    return (
      <div
        key={key}
        className={`flex items-center gap-2 ${indent} py-2 text-sm transition-colors ${
          isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
        }`}
      >
        {/* Checkbox + name — clicking this area toggles selection */}
        <button
          type="button"
          onClick={toggleFn}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
          }`}>
            {isSelected && <Check size={10} className="text-white" />}
          </span>
          <span className={`flex-1 truncate ${
            isSelected ? 'text-indigo-700 font-medium' : `text-slate-700${!subId ? ' font-medium' : ''}`
          }`}>
            {name}
          </span>
        </button>

        {/* Right side: amount input when selected, budget remaining when not */}
        {isSelected && existingSplit ? (
          <>
            <div className="relative w-20 flex-shrink-0">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={existingSplit.amount}
                onChange={e => setSplitAmount(existingSplit.id, e.target.value)}
                onBlur={() => formatAmountOnBlur(existingSplit.amount, v => setSplitAmount(existingSplit.id, v))}
                className="w-full pl-5 pr-1 py-1 text-xs border border-indigo-200 rounded-md bg-white text-slate-800 outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <button
              type="button"
              onClick={() => removeSplit(existingSplit.id)}
              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          remStr !== null && (
            <span className={`text-xs tabular-nums flex-shrink-0 ${rem < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {remStr}
            </span>
          )
        )}
      </div>
    )
  }

  // Render one group of categories (income or expense)
  const renderCategoryGroup = (cats) =>
    cats.map(cat => (
      <div key={cat.id}>
        {cat.subcategories.length > 0 ? (
          <>
            {/* Non-selectable category header */}
            <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold tracking-widest uppercase text-indigo-500 select-none">
              {cat.name}
            </div>
            {cat.subcategories.map(sub => renderPickerRow({
              key: sub.id,
              catId: cat.id,
              subId: sub.id,
              name: sub.name,
              rem: getSubRemainingDisplay(sub.id),
              isSelected: isSubSelected(cat.id, sub.id),
              toggleFn: () => toggleSubItem(cat.id, sub.id),
              indent: 'px-4',
            }))}
          </>
        ) : (
          renderPickerRow({
            key: cat.id,
            catId: cat.id,
            subId: null,
            name: cat.name,
            rem: getCatRemainingDisplay(cat),
            isSelected: isCatSelected(cat.id),
            toggleFn: () => toggleCatItem(cat.id),
            indent: 'px-3',
          })
        )}
      </div>
    ))

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
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setField('amount', e.target.value)}
                  onBlur={() => formatAmountOnBlur(form.amount, v => setField('amount', v))}
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

          {/* Budget item picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600">
                Budget Item <span className="text-red-400">*</span>
              </label>
              {/* Live remaining counter */}
              {(form.splits.length > 0 || form.amount) && (
                <span className={`text-xs font-medium ${remainingColor}`}>
                  {Math.abs(remaining) < 0.01
                    ? 'Fully assigned'
                    : remaining > 0
                    ? `$${remaining.toFixed(2)} remaining`
                    : `$${Math.abs(remaining).toFixed(2)} over`}
                </span>
              )}
            </div>

            {/* Picker trigger button */}
            <button
              type="button"
              onClick={() => setPickerOpen(v => !v)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                errors.splits && form.splits.length === 0
                  ? 'border-red-300'
                  : pickerOpen
                  ? 'border-indigo-400 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`truncate ${triggerLabel ? 'text-slate-800' : 'text-slate-400'}`}>
                {triggerLabel ?? 'Choose Budget Item(s)…'}
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-400 flex-shrink-0 ml-2 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Grouped picker panel — expands inline */}
            {pickerOpen && (
              <div className={`mt-1 border rounded-xl bg-white overflow-y-auto shadow-sm ${
                errors.splits && form.splits.length === 0 ? 'border-red-200' : 'border-slate-200'
              }`}
                style={{ maxHeight: '224px' }}
              >
                {visibleCategories.length === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-400">No categories available.</p>
                )}

                {/* Show type section headers only when both types are visible */}
                {!lockedType && incomeVisible.length > 0 && expenseVisible.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 bg-slate-50 border-b border-slate-100 sticky top-0">
                      Income
                    </div>
                    {renderCategoryGroup(incomeVisible)}
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-400 bg-slate-50 border-t border-b border-slate-100 sticky top-0">
                      Expenses
                    </div>
                    {renderCategoryGroup(expenseVisible)}
                  </>
                )}

                {/* Single type visible (locked or only one type exists) */}
                {(lockedType || incomeVisible.length === 0 || expenseVisible.length === 0) && (
                  renderCategoryGroup(visibleCategories)
                )}
              </div>
            )}

            {errors.splits && <p className="text-xs text-red-500 mt-1.5">{errors.splits}</p>}
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
