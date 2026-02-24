'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { jwtVerify } from 'jose'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenInfo, setTokenInfo] = useState<{ email: string; orgName: string; role: string } | null>(null)
  const [tokenInvalid, setTokenInvalid] = useState(false)

  // Decode token client-side to show email/org (not verification — just display)
  useEffect(() => {
    if (!token) {
      setTokenInvalid(true)
      return
    }
    try {
      // Decode without verifying (client doesn't have the secret)
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.purpose === 'invitation' && payload.email) {
          setTokenInfo({
            email: payload.email,
            orgName: '', // We don't have org name in the token, will be shown after accept
            role: payload.role || 'employee',
          })
        } else {
          setTokenInvalid(true)
        }
      } else {
        setTokenInvalid(true)
      }
    } catch {
      setTokenInvalid(true)
    }
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
      const res = await fetch('/api/employees/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName, password }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        // Cache user for instant hydration
        try { localStorage.setItem('tempo_current_user', JSON.stringify(data.user)) } catch { /* ignore */ }
        router.push('/dashboard')
      } else {
        setError(data.error || 'Failed to accept invitation')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenInvalid) {
    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-t1 mb-2">Invalid Invitation</h2>
          <p className="text-sm text-t3 mb-6">
            This invitation link is invalid or has expired. Please ask your admin to send a new invitation.
          </p>
          <Link href="/login">
            <Button className="w-full">Go to Login</Button>
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
            <UserPlus size={24} className="text-tempo-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-t1 mb-1 text-center">Join Your Team</h2>
        <p className="text-sm text-t3 mb-6 text-center">
          {tokenInfo?.email
            ? <>You&apos;ve been invited as <span className="font-medium text-t1">{tokenInfo.role}</span>. Set up your account to get started.</>
            : 'Set up your account to accept the invitation.'
          }
        </p>

        {tokenInfo?.email && (
          <div className="bg-canvas rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-t3">Invited email</p>
            <p className="text-sm font-medium text-t1">{tokenInfo.email}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
              minLength={8}
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
            {loading ? <><Loader2 size={14} className="animate-spin" /> Setting up...</> : 'Accept Invitation & Join'}
          </Button>
        </form>

        <p className="text-xs text-t3 text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-tempo-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
