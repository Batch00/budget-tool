import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatMonthLabel } from '../../utils/formatters'

const pageTitles = {
  '/': 'Dashboard',
  '/budget': 'Budget',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/categories': 'Categories',
  '/settings': 'Settings',
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'BatchFlow'
  const { currentMonth } = useApp()

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3.5 flex items-center gap-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      <span className="ml-auto text-sm font-medium text-slate-500 dark:text-slate-400 md:hidden">
        {formatMonthLabel(currentMonth)}
      </span>
    </header>
  )
}
