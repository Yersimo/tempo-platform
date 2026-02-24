'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TempoMark } from '@/components/brand/tempo-mark'
import { useAdmin } from '@/lib/admin-store'
import { demoAdminCredentials } from '@/lib/demo-data'
import { Shield, LogIn, Zap } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const { loginAdmin } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await loginAdmin(email, password)
      if (result.ok) {
        router.push('/admin')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (cred: typeof demoAdminCredentials[0]) => {
    setLoading(true)
    setError('')
    try {
      const result = await loginAdmin(cred.email, cred.password)
      if (result.ok) {
        router.push('/admin')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-chrome flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12">
        <TempoMark variant="white" size={120} />
        <h1 className="tempo-wordmark text-4xl text-white mt-8">tempo</h1>
        <div className="flex items-center gap-2 mt-3">
          <Shield size={16} className="text-amber-400" />
          <p className="text-amber-400/80 text-sm font-semibold uppercase tracking-wider">
            Platform Administration
          </p>
        </div>
        <p className="text-white/30 text-sm mt-4 text-center max-w-sm">
          Manage organizations, users, and platform configuration. Monitor system health and impersonate users for support.
        </p>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <TempoMark variant="mono" size={32} />
            <div>
              <span className="tempo-wordmark text-xl text-t1">tempo</span>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-amber-500" />
                <span className="text-[0.6rem] text-amber-500 font-semibold uppercase">Admin</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-t1">Admin Sign In</h2>
          <p className="text-sm text-t3 mt-1 mb-6">Platform administration access only</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-t2 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-t1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="admin@tempo.dev"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-t2 mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-t1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Quick Access */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-canvas text-t3">Demo Access</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {demoAdminCredentials.map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => handleDemoLogin(cred)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Zap size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-900">{cred.name}</span>
                      <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-700 uppercase">
                        {cred.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700/70 mt-0.5">{cred.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-t3 text-center mt-6">
            Not an admin? <a href="/login" className="text-tempo-600 hover:underline">Employee login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
