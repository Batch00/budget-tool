// localStorage is now only used for the currentMonth UI preference.
// All app data (categories, transactions, budgets) lives in Supabase.

const PREFIX = 'budget-tool:'

export function loadData(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(PREFIX + key)
    return item !== null ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function removeData(key) {
  localStorage.removeItem(PREFIX + key)
}
