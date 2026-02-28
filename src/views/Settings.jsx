import { useState, useRef } from 'react'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { saveData } from '../utils/storage'

export default function Settings() {
  const { categories, transactions, budgets, currentMonth } = useApp()
  const [importState, setImportState] = useState(null) // null | { data, stats } | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  function handleExport() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      currentMonth,
      categories,
      transactions,
      budgets,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!isValidBackup(data)) {
          setErrorMsg('File is not a valid budget backup.')
          setImportState('error')
          return
        }
        setImportState({
          data,
          stats: {
            transactions: data.transactions.length,
            categories: data.categories.length,
            months: Object.keys(data.budgets).length,
            exportedAt: data.exportedAt ?? null,
          },
        })
      } catch {
        setErrorMsg('Could not parse the file. Make sure it is a valid JSON file.')
        setImportState('error')
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-selected after cancelling
    e.target.value = ''
  }

  function handleConfirmImport() {
    const { data } = importState
    saveData('categories', data.categories)
    saveData('transactions', data.transactions)
    saveData('budgets', data.budgets)
    saveData('currentMonth', data.currentMonth)
    window.location.reload()
  }

  function handleCancelImport() {
    setImportState(null)
    setErrorMsg('')
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">

        {/* Export */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Export Data</h2>
              <p className="text-sm text-slate-500 mt-1">
                Download a JSON backup of all your transactions, budgets, and categories.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Download size={15} />
              Export JSON
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Import Data</h2>
              <p className="text-sm text-slate-500 mt-1">
                Restore from a previously exported JSON backup. This will overwrite all current data.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors shrink-0"
            >
              <Upload size={15} />
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Parse error */}
          {importState === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Confirmation panel */}
          {importState && importState !== 'error' && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  This will replace all current data and cannot be undone.
                </p>
              </div>
              <p className="text-sm text-slate-600 mb-1 ml-5">
                <strong>{importState.stats.transactions}</strong> transaction{importState.stats.transactions !== 1 ? 's' : ''},
                {' '}<strong>{importState.stats.categories}</strong> categor{importState.stats.categories !== 1 ? 'ies' : 'y'},
                {' '}<strong>{importState.stats.months}</strong> budget month{importState.stats.months !== 1 ? 's' : ''}
              </p>
              {importState.stats.exportedAt && (
                <p className="text-xs text-slate-400 mb-4 ml-5">
                  Exported {new Date(importState.stats.exportedAt).toLocaleString()}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Import
                </button>
                <button
                  onClick={handleCancelImport}
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function isValidBackup(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    Array.isArray(data.categories) &&
    Array.isArray(data.transactions) &&
    typeof data.budgets === 'object' &&
    data.budgets !== null &&
    typeof data.currentMonth === 'string'
  )
}
