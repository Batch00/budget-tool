import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { loadData, saveData } from '../utils/storage'
import { defaultCategories } from '../data/defaultCategories'
import { getMonthKey } from '../utils/formatters'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentMonth, setCurrentMonthState] = useState(
    () => loadData('currentMonth', getMonthKey())
  )
  const [categories, setCategories] = useState(
    () => loadData('categories', defaultCategories)
  )
  const [transactions, setTransactions] = useState(
    () => loadData('transactions', [])
  )
  const [budgets, setBudgets] = useState(
    () => loadData('budgets', {})
  )

  useEffect(() => saveData('currentMonth', currentMonth), [currentMonth])
  useEffect(() => saveData('categories', categories), [categories])
  useEffect(() => saveData('transactions', transactions), [transactions])
  useEffect(() => saveData('budgets', budgets), [budgets])

  const setCurrentMonth = useCallback((monthKey) => {
    setCurrentMonthState(monthKey)
  }, [])

  // ── Transactions ──────────────────────────────────────────────────────────

  const addTransaction = useCallback((transaction) => {
    const newTransaction = { ...transaction, id: crypto.randomUUID() }
    setTransactions(prev => [...prev, newTransaction])
    return newTransaction
  }, [])

  const updateTransaction = useCallback((id, updates) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Budgets ───────────────────────────────────────────────────────────────

  const setBudgetAmount = useCallback((monthKey, categoryId, amount) => {
    setBudgets(prev => ({
      ...prev,
      [monthKey]: {
        planned: {
          ...(prev[monthKey]?.planned ?? {}),
          [categoryId]: amount,
        },
      },
    }))
  }, [])

  const getMonthBudget = useCallback((monthKey) => {
    return budgets[monthKey] ?? { planned: {} }
  }, [budgets])

  // Mark a month as explicitly set up (even if all amounts stay at $0)
  const initializeMonth = useCallback((monthKey) => {
    setBudgets(prev => ({
      ...prev,
      [monthKey]: prev[monthKey] ?? { planned: {} },
    }))
  }, [])

  // Copy all planned amounts from one month into another
  const copyBudget = useCallback((fromKey, toKey) => {
    setBudgets(prev => ({
      ...prev,
      [toKey]: { planned: { ...(prev[fromKey]?.planned ?? {}) } },
    }))
  }, [])

  // ── Categories ────────────────────────────────────────────────────────────

  const addCategory = useCallback((category) => {
    setCategories(prev => [
      ...prev,
      { ...category, id: crypto.randomUUID(), subcategories: category.subcategories ?? [] },
    ])
  }, [])

  const updateCategory = useCallback((id, updates) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  const addSubcategory = useCallback((categoryId, name) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, subcategories: [...c.subcategories, { id: crypto.randomUUID(), name }] }
        : c
    ))
  }, [])

  const updateSubcategory = useCallback((categoryId, subId, name) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, subcategories: c.subcategories.map(s => s.id === subId ? { ...s, name } : s) }
        : c
    ))
  }, [])

  const deleteSubcategory = useCallback((categoryId, subId) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) }
        : c
    ))
  }, [])

  // Move a category up or down within its type group (income or expense)
  const moveCategory = useCallback((id, direction) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === id)
      if (idx === -1) return prev
      const type = prev[idx].type
      // Indices of same-type categories in their original array positions
      const sameTypeIndices = prev.map((c, i) => i).filter(i => prev[i].type === type)
      const posInGroup = sameTypeIndices.indexOf(idx)
      const targetPos = direction === 'up' ? posInGroup - 1 : posInGroup + 1
      if (targetPos < 0 || targetPos >= sameTypeIndices.length) return prev
      const targetIdx = sameTypeIndices[targetPos]
      const next = [...prev]
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next
    })
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentMonthTransactions = useMemo(
    () => transactions.filter(t => t.date?.startsWith(currentMonth)),
    [transactions, currentMonth]
  )

  const currentMonthBudget = useMemo(
    () => budgets[currentMonth] ?? { planned: {} },
    [budgets, currentMonth]
  )

  const value = useMemo(() => ({
    currentMonth,
    setCurrentMonth,
    categories,
    transactions,
    currentMonthTransactions,
    budgets,
    currentMonthBudget,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudgetAmount,
    getMonthBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    moveCategory,
    initializeMonth,
    copyBudget,
  }), [
    currentMonth, setCurrentMonth,
    categories, transactions, currentMonthTransactions,
    budgets, currentMonthBudget,
    addTransaction, updateTransaction, deleteTransaction,
    setBudgetAmount, getMonthBudget,
    initializeMonth, copyBudget,
    addCategory, updateCategory, deleteCategory,
    addSubcategory, updateSubcategory, deleteSubcategory,
    moveCategory,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
