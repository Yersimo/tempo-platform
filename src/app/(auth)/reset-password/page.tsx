'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { KeyRound, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }
    // We'll validate the token when the form is submitted
    setTokenValid(true)
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token, newPassword: password }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to reset password. The link may have expired.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === false) {
    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-t1 mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-t3 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/login">
            <Button className="w-full">Back to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-t1 mb-2">Password Reset!</h2>
          <p className="text-sm text-t3 mb-6">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Link href="/login">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="lg:hidden flex justify-center mb-8">
        <TempoLockup variant="color" size="md" />
      </div>
      <div className="bg-card rounded-[14px] border border-border p-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center">
            <KeyRound size={24} className="text-tempo-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-t1 mb-1 text-center">Set New Password</h2>
        <p className="text-sm text-t3 mb-6 text-center">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
              minLength={8}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Resetting...</> : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
