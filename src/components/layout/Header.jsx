import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

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
  const title = pageTitles[pathname] ?? 'Budget Tool'

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center gap-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
    </header>
  )
}
