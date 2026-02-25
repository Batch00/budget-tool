import { useApp } from '../context/AppContext'

export default function Categories() {
  const { categories } = useApp()

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-slate-500">
        {categories.length} categories · Full management coming soon
      </p>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <div>
              <p className="text-sm font-medium text-slate-800">{cat.name}</p>
              <p className="text-xs text-slate-400">
                {cat.subcategories.length} subcategor{cat.subcategories.length !== 1 ? 'ies' : 'y'} · {cat.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
