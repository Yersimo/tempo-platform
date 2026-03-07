'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { allDemoCredentials } from '@/lib/demo-data'
import type { DemoCredential } from '@/lib/demo-data'
import { useTempo } from '@/lib/store'
import {
  Shield, Users, UserCheck, Briefcase, User, Lock, Copy, Check,
  Building2, Globe2, ArrowRight, Sparkles, ExternalLink
} from 'lucide-react'

// ─── Demo Access PIN ──────────────────────────────────────────
const DEMO_PIN = 'tempo2026'

// ─── Magic link slugs → credential mapping ────────────────────
const MAGIC_LINK_MAP: Record<string, { email: string; password: string }> = {
  // Master Admin
  'admin': { email: 'yersimo@theworktempo.com', password: 'W@kilisha2026' },
  // Ecobank
  'ecobank-chro': { email: 'amara.kone@ecobank.com', password: 'demo1234' },
  'ecobank-cfo': { email: 'i.agu@ecobank.com', password: 'demo1234' },
  'ecobank-cto': { email: 'b.ogunleye@ecobank.com', password: 'demo1234' },
  'ecobank-dept-head': { email: 'o.adeyemi@ecobank.com', password: 'demo1234' },
  'ecobank-hrbp': { email: 'a.darko@ecobank.com', password: 'demo1234' },
  'ecobank-manager': { email: 'n.okafor@ecobank.com', password: 'demo1234' },
  'ecobank-employee': { email: 'k.asante@ecobank.com', password: 'demo1234' },
  // Kash & Co
  'kashco-md': { email: 's.ndlovu@kashco.com', password: 'demo1234' },
  'kashco-strategy': { email: 'l.amari@kashco.com', password: 'demo1234' },
  'kashco-manager': { email: 't.mugabo@kashco.com', password: 'demo1234' },
  'kashco-consultant': { email: 'n.joubert@kashco.com', password: 'demo1234' },
  'kashco-cpo': { email: 'z.moyo@kashco.com', password: 'demo1234' },
}

// ─── Reverse map: email → slug ────────────────────────────────
const EMAIL_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(MAGIC_LINK_MAP).map(([slug, { email }]) => [email, slug])
)

// ─── Styling ──────────────────────────────────────────────────
const roleIcons: Record<string, React.ReactNode> = {
  owner: <Shield size={18} />,
  admin: <Briefcase size={18} />,
  hrbp: <Users size={18} />,
  manager: <UserCheck size={18} />,
  employee: <User size={18} />,
}

const roleColors: Record<string, string> = {
  owner: 'bg-tempo-600/10 text-tempo-600 border-tempo-600/20',
  admin: 'bg-blue-50 text-blue-600 border-blue-200',
  hrbp: 'bg-purple-50 text-purple-600 border-purple-200',
  manager: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  employee: 'bg-gray-50 text-gray-600 border-gray-200',
}

const orgMeta: Record<string, { icon: React.ReactNode; color: string }> = {
  'Ecobank Transnational': {
    icon: <Building2 size={20} className="text-tempo-600" />,
    color: 'border-tempo-600/20 bg-tempo-600/5',
  },
  'Kash & Co': {
    icon: <Globe2 size={20} className="text-blue-600" />,
    color: 'border-blue-200 bg-blue-50/50',
  },
}

interface OrgGroup {
  name: string
  industry: string
  country: string
  employeeCount: number
  credentials: DemoCredential[]
}

const orgGroups: OrgGroup[] = [
  {
    name: 'Ecobank Transnational',
    industry: 'Banking & Financial Services',
    country: 'Nigeria',
    employeeCount: 14247,
    credentials: allDemoCredentials.filter(c => !c.employeeId.startsWith('kemp-')),
  },
  {
    name: 'Kash & Co',
    industry: 'Consulting & Professional Services',
    country: 'South Africa',
    employeeCount: 342,
    credentials: allDemoCredentials.filter(c => c.employeeId.startsWith('kemp-')),
  },
]

export default function DemoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useTempo()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  // Check for magic link auto-login via ?as=slug
  useEffect(() => {
    const autoLogin = searchParams.get('as')
    if (autoLogin && MAGIC_LINK_MAP[autoLogin]) {
      setUnlocked(true)
      handleAutoLogin(autoLogin)
    }
    // Check for pin in URL (e.g., ?pin=tempo2026)
    const urlPin = searchParams.get('pin')
    if (urlPin === DEMO_PIN) {
      setUnlocked(true)
    }
    // Check sessionStorage for previous unlock
    if (typeof window !== 'undefined' && sessionStorage.getItem('demo_unlocked') === 'true') {
      setUnlocked(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAutoLogin = async (slug: string) => {
    const cred = MAGIC_LINK_MAP[slug]
    if (!cred) return
    setLoading(slug)
    const result = await login(cred.email, cred.password)
    if (result === true) {
      router.push('/dashboard')
    } else {
      setLoading(null)
    }
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.toLowerCase().trim() === DEMO_PIN) {
      setUnlocked(true)
      setPinError(false)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('demo_unlocked', 'true')
      }
    } else {
      setPinError(true)
      setTimeout(() => setPinError(false), 2000)
    }
  }

  const handleDemoLogin = async (cred: DemoCredential) => {
    const slug = EMAIL_TO_SLUG[cred.email] || cred.employeeId
    setLoading(slug)
    const result = await login(cred.email, cred.password)
    if (result === true) {
      router.push('/dashboard')
    } else {
      setLoading(null)
    }
  }

  const copyMagicLink = (cred: DemoCredential) => {
    const slug = EMAIL_TO_SLUG[cred.email]
    if (!slug) return
    const url = `${window.location.origin}/demo?as=${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  // ─── PIN Gate ──────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-tempo-50 flex items-center justify-center mx-auto mb-5">
            <Lock size={24} className="text-tempo-600" />
          </div>
          <h2 className="text-xl font-semibold text-t1 mb-1">Demo Access</h2>
          <p className="text-sm text-t3 mb-6">
            Enter the demo PIN to explore the platform
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter demo PIN..."
              className={`w-full px-4 py-3 text-sm text-center tracking-widest font-mono bg-white border rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 transition-all ${
                pinError
                  ? 'border-red-400 focus:ring-red-200 animate-shake'
                  : 'border-divider focus:ring-tempo-600/20 focus:border-tempo-600'
              }`}
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-500">Invalid PIN. Try again.</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-tempo-600 hover:bg-tempo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Unlock Demo
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-divider">
            <p className="text-[0.6rem] text-t3">
              Have a magic link? It will bypass this gate automatically.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Auto-login loading state ──────────────────────────────────
  if (loading && searchParams.get('as')) {
    return (
      <div>
        <div className="lg:hidden flex justify-center mb-8">
          <TempoLockup variant="color" size="md" />
        </div>
        <div className="bg-card rounded-[14px] border border-border p-12 text-center">
          <div className="w-10 h-10 border-2 border-tempo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-t1 mb-1">Signing in...</h2>
          <p className="text-sm text-t3">Loading demo environment</p>
        </div>
      </div>
    )
  }

  // ─── Demo Launcher ─────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <div className="lg:hidden flex justify-center mb-6">
        <TempoLockup variant="color" size="md" />
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-tempo-50 text-tempo-600 text-[0.65rem] font-medium rounded-full mb-3">
          <Sparkles size={12} />
          Demo Environment
        </div>
        <h1 className="text-xl font-semibold text-t1">Choose a Demo Company</h1>
        <p className="text-sm text-t3 mt-1">Select an organization and role to explore</p>
      </div>

      {/* Org Cards */}
      <div className="space-y-4">
        {orgGroups.map((group) => {
          const meta = orgMeta[group.name]
          return (
            <div key={group.name} className={`rounded-xl border ${meta?.color || 'border-divider bg-card'} overflow-hidden`}>
              {/* Org Header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-divider/50 shadow-sm">
                  {meta?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-t1">{group.name}</h3>
                  <p className="text-[0.6rem] text-t3">{group.industry} &middot; {group.country} &middot; {group.employeeCount.toLocaleString()} employees</p>
                </div>
              </div>

              {/* Credentials */}
              <div className="bg-white/80 backdrop-blur-sm px-3 pb-3 space-y-1.5">
                {group.credentials.map((cred) => {
                  const slug = EMAIL_TO_SLUG[cred.email] || cred.employeeId
                  const isLoading = loading === slug
                  return (
                    <div
                      key={cred.employeeId}
                      className="flex items-center gap-2.5 rounded-lg border border-divider/60 px-3 py-2 bg-white hover:shadow-sm transition-all group"
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${roleColors[cred.role]}`}>
                        {roleIcons[cred.role] || <User size={16} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-t1">{cred.label}</span>
                          <span className={`text-[0.5rem] font-medium px-1.5 py-0.5 rounded-full border ${roleColors[cred.role]}`}>
                            {cred.role}
                          </span>
                        </div>
                        <p className="text-[0.55rem] text-t3 truncate">{cred.title} &middot; {cred.department}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Copy magic link */}
                        {EMAIL_TO_SLUG[cred.email] && (
                          <button
                            onClick={() => copyMagicLink(cred)}
                            className="p-1.5 rounded-md text-t3 hover:text-t1 hover:bg-gray-100 transition-colors"
                            title="Copy magic link"
                          >
                            {copiedSlug === EMAIL_TO_SLUG[cred.email] ? (
                              <Check size={13} className="text-green-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                        {/* Launch */}
                        <button
                          onClick={() => handleDemoLogin(cred)}
                          disabled={!!loading}
                          className="flex items-center gap-1 px-2.5 py-1 text-[0.6rem] font-medium bg-tempo-600 hover:bg-tempo-700 text-white rounded-md transition-colors disabled:opacity-50"
                        >
                          {isLoading ? (
                            <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              Launch
                              <ArrowRight size={10} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Magic Links Help */}
      <div className="mt-5 p-3 rounded-lg bg-gray-50 border border-divider/50">
        <div className="flex items-start gap-2">
          <ExternalLink size={14} className="text-t3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[0.65rem] font-medium text-t1 mb-0.5">Magic Links</p>
            <p className="text-[0.55rem] text-t3 leading-relaxed">
              Click the <Copy size={9} className="inline" /> icon next to any role to copy a shareable magic link.
              Anyone with the link can instantly access that demo — no PIN required.
              Perfect for investor demos, team walkthroughs, and sales calls.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[0.5rem] text-t3 text-center mt-4">
        All demo data is synthetic. No real employee data is used.
      </p>
    </div>
  )
}
