'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookOpen, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function AcademyLoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const inviteToken = searchParams.get('token')
  const academySlug = searchParams.get('academy')

  const [mode, setMode] = useState<'login' | 'invite'>(inviteToken ? 'invite' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Academy branding
  const [academyName, setAcademyName] = useState('Academy')
  const [brandColor, setBrandColor] = useState('#00567A')

  // Load academy branding if slug provided
  useEffect(() => {
    if (!academySlug) return
    fetch(`/api/academy?action=get-by-slug&slug=${encodeURIComponent(academySlug)}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          setAcademyName(data.name || 'Academy')
          setBrandColor(data.brandColor || data.brand_color || '#00567A')
        }
      })
      .catch(() => {})
  }, [academySlug])

  // Check if already logged in
  useEffect(() => {
    fetch('/api/academy/auth', { credentials: 'include' })
      .then(r => {
        if (r.ok) return r.json()
        throw new Error('Not logged in')
      })
      .then(({ participant }) => {
        if (participant?.academySlug) {
          router.replace(`/academy/${participant.academySlug}`)
        }
      })
      .catch(() => {})
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/academy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      // Redirect to academy
      const slug = data.participant?.academySlug || data.academySlug || academySlug
      if (slug) {
        router.push(`/academy/${slug}`)
      } else {
        // Fallback: fetch participant info to get slug
        const authRes = await fetch('/api/academy/auth', { credentials: 'include' })
        if (authRes.ok) {
          const authData = await authRes.json()
          const s = authData.participant?.academySlug
          router.push(s ? `/academy/${s}` : '/academy/login')
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/academy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-invite', token: inviteToken, password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid or expired invitation')
        setLoading(false)
        return
      }

      setSuccess('Account set up successfully! Redirecting...')
      const slug = data.participant?.academySlug || data.academySlug || academySlug
      setTimeout(() => {
        router.push(slug ? `/academy/${slug}` : '/academy/login')
      }, 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"
            style={{ backgroundColor: brandColor }}
          >
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-primary">{academyName}</h1>
          <p className="text-sm text-secondary mt-1">
            {mode === 'invite' ? 'Set up your account to get started' : 'Sign in to access your learning programme'}
          </p>
        </div>

        <Card className="p-6">
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3 mb-4">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3 mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={mode === 'invite' ? handleInvite : handleLogin} className="space-y-4">
            {mode === 'login' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary">
                {mode === 'invite' ? 'Create Password' : 'Password'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'invite' ? 'Create a secure password' : 'Enter your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus={mode === 'invite'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'invite' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary">Confirm Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: brandColor }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'invite' ? 'Set Up Account' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-secondary mt-6">
          Powered by <span className="font-semibold">tempo</span>
        </p>
      </div>
    </div>
  )
}
