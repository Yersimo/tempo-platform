'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TempoMark } from '@/components/brand/tempo-mark'
import { useAdmin } from '@/lib/admin-store'
import { Shield, LogIn, KeyRound } from 'lucide-react'

type LoginStep = 'credentials' | 'mfa'

export default function AdminLoginPage() {
  const router = useRouter()
  const { loginAdmin } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // MFA state
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials')
  const [mfaCode, setMfaCode] = useState('')
  const [pendingAdminId, setPendingAdminId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      // Check if MFA is required
      if (data.requiresMFA) {
        setPendingAdminId(data.adminId)
        setLoginStep('mfa')
        return
      }
      // Login succeeded — use store loginAdmin for state management
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

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password, totpCode: mfaCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid MFA code')
        return
      }
      // MFA verified, complete login via store
      const result = await loginAdmin(email, password)
      if (result.ok) {
        router.push('/admin')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    setError('')
    try {
      // In production, this would redirect to the SSO provider's OAuth flow
      // For demo, we use a simplified flow
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sso-login', provider, token: 'demo', email: email || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        router.push('/admin')
      } else {
        setError(data.error || `SSO login with ${provider} failed. Enter your admin email first.`)
      }
    } catch {
      setError('SSO authentication failed')
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

          {loginStep === 'mfa' ? (
            /* MFA Code Entry */
            <form onSubmit={handleMFASubmit} className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 mb-2">
                <KeyRound size={20} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Two-factor authentication required</p>
                  <p className="text-xs text-amber-700 mt-0.5">Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, 1Password, or Microsoft Authenticator)</p>
                </div>
              </div>
              <div>
                <label htmlFor="mfa-code" className="block text-sm font-medium text-t2 mb-1.5">Authentication Code</label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-t1 text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setLoginStep('credentials'); setMfaCode(''); setError('') }}
                className="w-full text-sm text-t3 hover:text-t2 transition-colors"
              >
                Back to login
              </button>
            </form>
          ) : (
            <>
              {/* SSO Buttons */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => handleSSOLogin('google')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium text-t1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
                <button
                  onClick={() => handleSSOLogin('microsoft')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium text-t1"
                >
                  <svg width="18" height="18" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Sign in with Microsoft
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-canvas text-t3">or sign in with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
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
            </>
          )}

          {/* Demo access cards removed for security */}

          <p className="text-xs text-t3 text-center mt-6">
            Not an admin? <a href="/login" className="text-tempo-600 hover:underline">Employee login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
