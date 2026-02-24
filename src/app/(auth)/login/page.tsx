'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { allDemoCredentials } from '@/lib/demo-data'
import type { DemoCredential } from '@/lib/demo-data'
import { useTempo } from '@/lib/store'
import {
  Shield, Users, UserCheck, Briefcase, User, Banknote, Laptop, KeyRound, ArrowLeft, CheckCircle
} from 'lucide-react'

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Shield size={20} />,
  admin: <Briefcase size={20} />,
  hrbp: <Users size={20} />,
  manager: <UserCheck size={20} />,
  employee: <User size={20} />,
}

interface OrgGroup {
  name: string
  industry: string
  country: string
  credentials: DemoCredential[]
}

const orgGroups: OrgGroup[] = [
  {
    name: 'Ecobank Transnational',
    industry: 'Banking & Financial Services',
    country: 'Nigeria',
    credentials: allDemoCredentials.filter(c => !c.employeeId.startsWith('kemp-')),
  },
  {
    name: 'Kash & Co',
    industry: 'Consulting & Professional Services',
    country: 'South Africa',
    credentials: allDemoCredentials.filter(c => c.employeeId.startsWith('kemp-')),
  },
]

const roleColors: Record<string, string> = {
  owner: 'bg-tempo-600/10 text-tempo-600 border-tempo-600/20',
  admin: 'bg-blue-50 text-blue-600 border-blue-200',
  hrbp: 'bg-purple-50 text-purple-600 border-purple-200',
  manager: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  employee: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const { login, verifyMFA } = useTempo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', ''])
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const mfaInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first MFA input when MFA step is shown
  useEffect(() => {
    if (mfaRequired && !useBackupCode) {
      const timer = setTimeout(() => {
        mfaInputRefs.current[0]?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mfaRequired, useBackupCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    if (result === true) {
      router.push('/dashboard')
    } else if (result && typeof result === 'object' && 'requiresMFA' in result) {
      setMfaRequired(true)
      setMfaToken(result.mfaToken)
      setLoading(false)
    } else {
      setError(t('invalidCredentials'))
      setLoading(false)
    }
  }

  const handleDemoLogin = async (cred: DemoCredential) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
    setLoading(true)

    const result = await login(cred.email, cred.password)
    if (result === true) {
      router.push('/dashboard')
    } else if (result && typeof result === 'object' && 'requiresMFA' in result) {
      setMfaRequired(true)
      setMfaToken(result.mfaToken)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }

  const submitMFACode = useCallback(async (code: string) => {
    if (!code || !mfaToken) return
    setError('')
    setLoading(true)

    const success = await verifyMFA(mfaToken, code)
    if (success) {
      router.push('/dashboard')
    } else {
      setError(t('mfaInvalidCode'))
      setMfaCode(['', '', '', '', '', ''])
      setBackupCode('')
      setLoading(false)
      // Re-focus first input
      if (!useBackupCode) {
        mfaInputRefs.current[0]?.focus()
      }
    }
  }, [mfaToken, verifyMFA, router, t, useBackupCode])

  const handleMFAInput = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...mfaCode]
    newCode[index] = digit
    setMfaCode(newCode)

    if (digit && index < 5) {
      // Move to next input
      mfaInputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) {
        submitMFACode(fullCode)
      }
    }
  }

  const handleMFAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaInputRefs.current[index - 1]?.focus()
    }
  }

  const handleMFAPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      const newCode = [...mfaCode]
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i]
      }
      setMfaCode(newCode)

      // Focus the next empty input or last input
      const nextEmpty = pastedData.length < 6 ? pastedData.length : 5
      mfaInputRefs.current[nextEmpty]?.focus()

      // Auto-submit if all 6 digits pasted
      if (pastedData.length === 6) {
        submitMFACode(pastedData)
      }
    }
  }

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (backupCode.trim()) {
      submitMFACode(backupCode.trim())
    }
  }

  const resetMFA = () => {
    setMfaRequired(false)
    setMfaToken('')
    setMfaCode(['', '', '', '', '', ''])
    setBackupCode('')
    setUseBackupCode(false)
    setError('')
    setLoading(false)
  }

  // ─── MFA Verification Step ────────────────────────────────────────
  if (mfaRequired) {
    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-8">
          <button
            onClick={resetMFA}
            className="flex items-center gap-1.5 text-xs text-t3 hover:text-t1 transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            {t('mfaBackToLogin')}
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center">
              <KeyRound size={24} className="text-tempo-600" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-t1 mb-1 text-center">{t('mfaTitle')}</h2>
          <p className="text-sm text-t3 mb-8 text-center">
            {useBackupCode ? t('mfaEnterBackupCode') : t('mfaEnterCode')}
          </p>

          {!useBackupCode ? (
            <div>
              {/* 6-digit code input */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handleMFAPaste}>
                {mfaCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { mfaInputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleMFAInput(index, e.target.value)}
                    onKeyDown={(e) => handleMFAKeyDown(index, e)}
                    disabled={loading}
                    className="w-11 h-13 text-center text-lg font-semibold bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 disabled:opacity-50 transition-all"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
              )}

              {loading && (
                <p className="text-xs text-t3 text-center mb-4">{t('mfaVerifying')}</p>
              )}

              <button
                onClick={() => { setUseBackupCode(true); setError('') }}
                className="block w-full text-center text-xs text-tempo-600 hover:text-tempo-700 transition-colors mt-4"
              >
                {t('mfaUseBackupCode')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleBackupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('mfaBackupCodeLabel')}</label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder={t('mfaBackupCodePlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 font-mono"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading || !backupCode.trim()}>
                {loading ? t('mfaVerifying') : t('mfaVerifyButton')}
              </Button>

              <button
                type="button"
                onClick={() => { setUseBackupCode(false); setError('') }}
                className="block w-full text-center text-xs text-tempo-600 hover:text-tempo-700 transition-colors"
              >
                {t('mfaUseTOTPCode')}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ─── Forgot Password Mode ────────────────────────────────────────
  if (forgotMode) {
    const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', email: forgotEmail }),
        })
        if (res.ok) {
          setForgotSent(true)
        } else {
          // Still show success to not leak email existence
          setForgotSent(true)
        }
      } catch {
        setError('An error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-8">
          <button
            onClick={() => { setForgotMode(false); setForgotSent(false); setError('') }}
            className="flex items-center gap-1.5 text-xs text-t3 hover:text-t1 transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to login
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center">
              <KeyRound size={24} className="text-tempo-600" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-t1 mb-1 text-center">Reset Password</h2>
          <p className="text-sm text-t3 mb-6 text-center">
            {forgotSent
              ? 'If an account with that email exists, we\'ve sent a reset link.'
              : 'Enter your email address and we\'ll send you a reset link.'
            }
          </p>

          {forgotSent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm text-green-700">Check your email for a reset link</p>
              </div>
              <Button
                onClick={() => { setForgotMode(false); setForgotSent(false) }}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ─── Standard Login Form ──────────────────────────────────────────
  return (
    <div>
      <div className="lg:hidden flex justify-center mb-8">
        <TempoLockup variant="color" size="md" />
      </div>
      <div className="bg-card rounded-[14px] border border-border p-8">
        <h2 className="text-xl font-semibold text-t1 mb-1">{t('welcomeBack')}</h2>
        <p className="text-sm text-t3 mb-6">{t('signInSubtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-t1">{t('passwordLabel')}</label>
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs text-tempo-600 hover:text-tempo-700 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-divider">
          <p className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider mb-4">{t('quickDemoAccess')}</p>
          <div className="space-y-5">
            {orgGroups.map((group) => (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[0.7rem] font-semibold text-t1">{group.name}</span>
                  <span className="text-[0.55rem] text-t3">{group.industry}</span>
                  <span className="text-[0.5rem] text-t3 ml-auto">{group.country}</span>
                </div>
                <div className="space-y-1.5">
                  {group.credentials.map((cred) => (
                    <button
                      key={cred.employeeId}
                      onClick={() => handleDemoLogin(cred)}
                      disabled={loading}
                      className="w-full text-left rounded-lg border border-divider px-3 py-2 hover:bg-canvas/80 transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${roleColors[cred.role]}`}>
                          {roleIcons[cred.role] || <User size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-t1">{cred.label}</span>
                            <span className={`text-[0.55rem] font-medium px-1.5 py-0.5 rounded-full border ${roleColors[cred.role]}`}>
                              {cred.role}
                            </span>
                          </div>
                          <p className="text-[0.6rem] text-t3 truncate">{cred.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[0.55rem] text-t3 text-center mt-3">{t('demoPwdNote')}</p>
        </div>
      </div>
    </div>
  )
}
