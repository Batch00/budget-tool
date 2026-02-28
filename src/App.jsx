import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './views/Dashboard'
import Budget from './views/Budget'
import Transactions from './views/Transactions'
import Analytics from './views/Analytics'
import Categories from './views/Categories'
import Settings from './views/Settings'
import Auth from './views/Auth'

export default function App() {
  const { user, loading } = useAuth()

  // Hold render until Supabase has restored the session from localStorage.
  // This prevents a flash of the login page on every refresh.
  if (loading) return null

  if (!user) return <Auth />

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="budget" element={<Budget />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
