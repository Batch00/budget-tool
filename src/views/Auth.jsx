import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogoMark } from '../components/common/Logo'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupSent, setSignupSent] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError('')
    setSignupSent(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password)

    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      // Supabase sends a confirmation email by default.
      // If you have email confirmation disabled in your project settings,
      // the user will be signed in automatically instead.
      setSignupSent(true)
    }
    // For sign-in, onAuthStateChange in AuthContext handles the redirect automatically.

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoMark size={48} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">BatchFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Your money, your plan</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Mode tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50'
              }`}
            >
              Create account
            </button>
          </div>

          <div className="p-6">

            {/* Signup confirmation message */}
            {signupSent ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-slate-800 mb-1">Check your email</p>
                <p className="text-sm text-slate-500">
                  We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                </p>
                <button
                  onClick={() => switchMode('signin')}
                  className="mt-4 text-sm text-indigo-600 hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
