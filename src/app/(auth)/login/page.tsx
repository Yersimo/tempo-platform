'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TempoMark } from '@/components/brand/tempo-mark'
import { useTempo } from '@/lib/store'
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const { login, verifyMFA } = useTempo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      if (!useBackupCode) {
        mfaInputRefs.current[0]?.focus()
      }
    }
  }, [mfaToken, verifyMFA, router, t, useBackupCode])

  const handleMFAInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...mfaCode]
    newCode[index] = digit
    setMfaCode(newCode)

    if (digit && index < 5) {
      mfaInputRefs.current[index + 1]?.focus()
    }

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
      const nextEmpty = pastedData.length < 6 ? pastedData.length : 5
      mfaInputRefs.current[nextEmpty]?.focus()
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

  // Shared input class
  const inputClass = 'w-full h-11 px-4 text-[14px] bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#E8590C]/15 focus:border-[#E8590C]/40 transition-all duration-200'
  const labelClass = 'block text-[13px] font-medium text-gray-700 mb-1.5'
  const btnPrimary = 'w-full h-11 bg-[#E8590C] text-white text-[14px] font-medium rounded-xl hover:bg-[#d14e0a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#E8590C]/20 hover:shadow-md hover:shadow-[#E8590C]/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2'

  // ─── MFA Verification Step ────────────────────────────────────────
  if (mfaRequired) {
    return (
      <div className="animate-in fade-in duration-300">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <TempoMark variant="color" size={36} />
          <span className="font-bold text-[20px] tracking-[-0.02em] text-gray-900">
            tempo<span className="text-[#E8590C]">.</span>
          </span>
        </div>

        <button
          onClick={resetMFA}
          className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          {t('mfaBackToLogin')}
        </button>

        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
            <KeyRound size={22} className="text-[#E8590C]" />
          </div>
        </div>

        <h2 className="text-[22px] font-semibold text-gray-900 text-center tracking-[-0.01em]">{t('mfaTitle')}</h2>
        <p className="text-[14px] text-gray-400 mt-2 mb-8 text-center leading-relaxed">
          {useBackupCode ? t('mfaEnterBackupCode') : t('mfaEnterCode')}
        </p>

        {!useBackupCode ? (
          <div>
            <div className="flex justify-center gap-2.5 mb-6" onPaste={handleMFAPaste}>
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
                  className="w-12 h-14 text-center text-[18px] font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#E8590C]/15 focus:border-[#E8590C]/40 disabled:opacity-50 transition-all duration-200"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-4 text-center">{error}</p>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 size={14} className="animate-spin text-gray-400" />
                <p className="text-[13px] text-gray-400">{t('mfaVerifying')}</p>
              </div>
            )}

            <button
              onClick={() => { setUseBackupCode(true); setError('') }}
              className="block w-full text-center text-[13px] text-[#E8590C] hover:text-[#d14e0a] transition-colors mt-6 font-medium"
            >
              {t('mfaUseBackupCode')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleBackupSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>{t('mfaBackupCodeLabel')}</label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder={t('mfaBackupCodePlaceholder')}
                className={`${inputClass} font-mono`}
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button type="submit" className={btnPrimary} disabled={loading || !backupCode.trim()}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? t('mfaVerifying') : t('mfaVerifyButton')}
            </button>

            <button
              type="button"
              onClick={() => { setUseBackupCode(false); setError('') }}
              className="block w-full text-center text-[13px] text-[#E8590C] hover:text-[#d14e0a] transition-colors font-medium"
            >
              {t('mfaUseTOTPCode')}
            </button>
          </form>
        )}
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
          setForgotSent(true)
        }
      } catch {
        setError('An error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="animate-in fade-in duration-300">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <TempoMark variant="color" size={36} />
          <span className="font-bold text-[20px] tracking-[-0.02em] text-gray-900">
            tempo<span className="text-[#E8590C]">.</span>
          </span>
        </div>

        <button
          onClick={() => { setForgotMode(false); setForgotSent(false); setError('') }}
          className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Back to login
        </button>

        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
            <KeyRound size={22} className="text-[#E8590C]" />
          </div>
        </div>

        <h2 className="text-[22px] font-semibold text-gray-900 text-center tracking-[-0.01em]">Reset your password</h2>
        <p className="text-[14px] text-gray-400 mt-2 mb-8 text-center leading-relaxed">
          {forgotSent
            ? 'If an account with that email exists, we\'ve sent a reset link.'
            : 'Enter your email and we\'ll send you a link to reset it.'
          }
        </p>

        {forgotSent ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <p className="text-[13px] text-emerald-700">Check your email for a reset link</p>
            </div>
            <button
              onClick={() => { setForgotMode(false); setForgotSent(false) }}
              className={btnPrimary}
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Email address</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}
            <button type="submit" className={btnPrimary} disabled={loading}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    )
  }

  // ─── Standard Login Form ──────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-10">
        <TempoMark variant="color" size={36} />
        <span className="font-bold text-[20px] tracking-[-0.02em] text-gray-900">
          tempo<span className="text-[#E8590C]">.</span>
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[26px] font-semibold text-gray-900 tracking-[-0.02em]">{t('welcomeBack')}</h2>
        <p className="text-[14px] text-gray-400 mt-1.5">{t('signInSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className={labelClass}>{t('emailLabel')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className={inputClass}
            required
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-medium text-gray-700">{t('passwordLabel')}</label>
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="text-[12px] text-[#E8590C] hover:text-[#d14e0a] font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className={`${inputClass} pr-11`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button type="submit" className={btnPrimary} disabled={loading}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? t('signingIn') : t('signIn')}
        </button>
      </form>

      {/* Footer */}
      <p className="text-[12px] text-gray-400 text-center mt-8">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-[#E8590C] hover:text-[#d14e0a] font-medium transition-colors">
          Request access
        </a>
      </p>
    </div>
  )
}
