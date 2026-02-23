'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { demoCredentials } from '@/lib/demo-data'
import { useTempo } from '@/lib/store'
import {
  Shield, Users, UserCheck, Briefcase, User, Banknote, Laptop
} from 'lucide-react'

const roleIcons: Record<string, React.ReactNode> = {
  'emp-17': <Shield size={20} />,
  'emp-1': <Briefcase size={20} />,
  'emp-20': <Users size={20} />,
  'emp-2': <UserCheck size={20} />,
  'emp-3': <User size={20} />,
  'emp-24': <Banknote size={20} />,
  'emp-13': <Laptop size={20} />,
}

const roleColors: Record<string, string> = {
  owner: 'bg-tempo-600/10 text-tempo-600 border-tempo-600/20',
  admin: 'bg-blue-50 text-blue-600 border-blue-200',
  hrbp: 'bg-purple-50 text-purple-600 border-purple-200',
  manager: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  employee: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useTempo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(email, password)
    if (success) {
      router.push('/dashboard')
    } else {
      setError('Invalid email or password. Try a demo credential below.')
      setLoading(false)
    }
  }

  const handleDemoLogin = async (cred: typeof demoCredentials[number]) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
    setLoading(true)

    const success = await login(cred.email, cred.password)
    if (success) {
      router.push('/dashboard')
    } else {
      setLoading(false)
    }
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
              placeholder="you@ecobank.com"
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

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-divider">
          <p className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider mb-3">Quick Demo Access</p>
          <div className="space-y-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.employeeId}
                onClick={() => handleDemoLogin(cred)}
                disabled={loading}
                className="w-full text-left rounded-lg border border-divider px-3 py-2.5 hover:bg-canvas/80 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${roleColors[cred.role]}`}>
                    {roleIcons[cred.employeeId] || <User size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-t1">{cred.label}</span>
                      <span className={`text-[0.55rem] font-medium px-1.5 py-0.5 rounded-full border ${roleColors[cred.role]}`}>
                        {cred.role}
                      </span>
                    </div>
                    <p className="text-[0.65rem] text-t3 truncate">{cred.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[0.55rem] text-t3 text-center mt-3">All demo accounts use password: demo1234</p>
        </div>
      </div>
    </div>
  )
}
