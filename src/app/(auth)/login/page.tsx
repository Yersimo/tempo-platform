'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Demo: redirect to dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 800)
  }

  return (
    <div>
      <div className="lg:hidden flex justify-center mb-8">
        <TempoLockup variant="color" size="md" />
      </div>
      <div className="bg-card rounded-[14px] border border-border p-8">
        <h2 className="text-xl font-semibold text-t1 mb-1">Welcome back</h2>
        <p className="text-sm text-t3 mb-6">Sign in to your Tempo account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-t1 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-t2">
              <input type="checkbox" className="rounded border-divider" />
              Remember me
            </label>
            <a href="#" className="text-xs text-tempo-600 hover:underline">Forgot password?</a>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-t3">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-tempo-600 hover:underline font-medium">Sign up</Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-divider">
          <p className="text-[0.6rem] text-t3 text-center mb-3">Demo Credentials</p>
          <button
            onClick={() => { setEmail('amara.kone@ecobank.com'); setPassword('demo1234') }}
            className="w-full text-left bg-canvas rounded-lg px-3 py-2 text-xs text-t2 hover:bg-canvas/80 transition-colors"
          >
            <span className="font-medium text-t1">Admin:</span> amara.kone@ecobank.com / demo1234
          </button>
        </div>
      </div>
    </div>
  )
}
