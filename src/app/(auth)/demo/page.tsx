'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { useTempo } from '@/lib/store'
import {
  Shield, Users, UserCheck, Briefcase, User, Lock, Copy, Check,
  Building2, Globe2, ArrowRight, Sparkles, ExternalLink, AlertCircle
} from 'lucide-react'

// ─── Demo Access PIN ──────────────────────────────────────────
const DEMO_PIN = 'tempo2026'

// ─── Magic link slugs → demo email mapping ────────────────────
// The server resolves the password from environment-backed demo credentials.
const MAGIC_LINK_EMAILS: Record<string, string> = {
  admin: 'yersimo@theworktempo.com',
  'ecobank-chro': 'amara.kone@ecobank.com',
  'ecobank-cfo': 'i.agu@ecobank.com',
  'ecobank-cto': 'b.ogunleye@ecobank.com',
  'ecobank-dept-head': 'o.adeyemi@ecobank.com',
  'ecobank-hrbp': 'a.darko@ecobank.com',
  'ecobank-manager': 'n.okafor@ecobank.com',
  'ecobank-employee': 'k.asante@ecobank.com',
  'kashco-md': 's.ndlovu@kashco.com',
  'kashco-strategy': 'l.amari@kashco.com',
  'kashco-manager': 't.mugabo@kashco.com',
  'kashco-consultant': 'n.joubert@kashco.com',
  'kashco-cpo': 'z.moyo@kashco.com',
}

// ─── Reverse map: email → slug ────────────────────────────────
const EMAIL_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(MAGIC_LINK_EMAILS).map(([slug, email]) => [email, slug])
)

type DemoLauncherRole = {
  email: string
  employeeId: string
  role: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
  label: string
  title: string
  department: string
  description: string
}

const ecobankRoles: DemoLauncherRole[] = [
  { email: 'yersimo@theworktempo.com', employeeId: 'emp-17', role: 'owner', label: 'Master Admin', title: 'Platform Owner', department: 'Executive', description: 'Master admin with full super access. Can switch to any user role.' },
  { email: 'amara.kone@ecobank.com', employeeId: 'emp-17', role: 'owner', label: 'CHRO (Owner)', title: 'CHRO', department: 'Human Resources', description: 'Full platform access. Sees all modules, AI insights, and executive dashboards.' },
  { email: 'i.agu@ecobank.com', employeeId: 'emp-24', role: 'admin', label: 'CFO', title: 'CFO', department: 'Finance', description: 'Finance executive. Full access to payroll, budgets, invoices, and expense reports.' },
  { email: 'b.ogunleye@ecobank.com', employeeId: 'emp-13', role: 'admin', label: 'CTO', title: 'CTO', department: 'Technology', description: 'Technology executive. Manages IT devices, apps, licenses, and tech team.' },
  { email: 'o.adeyemi@ecobank.com', employeeId: 'emp-1', role: 'admin', label: 'Department Head', title: 'Head of Retail Banking', department: 'Retail Banking', description: 'Department admin. Manages team performance, approvals, and recruiting.' },
  { email: 'a.darko@ecobank.com', employeeId: 'emp-20', role: 'hrbp', label: 'HR Business Partner', title: 'HR Business Partner', department: 'Human Resources', description: 'HR operations. Manages people, performance reviews, compensation, and engagement.' },
  { email: 'n.okafor@ecobank.com', employeeId: 'emp-2', role: 'manager', label: 'Manager', title: 'Branch Manager', department: 'Retail Banking', description: 'Team manager. Reviews team goals, approves leave, manages direct reports.' },
  { email: 'k.asante@ecobank.com', employeeId: 'emp-3', role: 'employee', label: 'Employee', title: 'Relationship Manager', department: 'Retail Banking', description: 'Individual contributor. Views own profile, goals, learning, and submits requests.' },
]

const kashRoles: DemoLauncherRole[] = [
  { email: 's.ndlovu@kashco.com', employeeId: 'kemp-1', role: 'owner', label: 'Managing Director (Owner)', title: 'Managing Director', department: 'Consulting', description: 'Full platform access. Sees all modules, firm-wide analytics, and executive dashboards.' },
  { email: 'l.amari@kashco.com', employeeId: 'kemp-6', role: 'admin', label: 'Head of Strategy', title: 'Head of Strategy', department: 'Strategy', description: 'Strategy practice lead. Manages team, client engagements, and practice P&L.' },
  { email: 't.mugabo@kashco.com', employeeId: 'kemp-3', role: 'manager', label: 'Engagement Manager', title: 'Engagement Manager', department: 'Consulting', description: 'Project lead. Manages team, reviews deliverables, approves time and expenses.' },
  { email: 'n.joubert@kashco.com', employeeId: 'kemp-4', role: 'employee', label: 'Senior Consultant', title: 'Senior Consultant', department: 'Consulting', description: 'Individual contributor. Views own goals, learning, and submits time/expenses.' },
  { email: 'z.moyo@kashco.com', employeeId: 'kemp-12', role: 'admin', label: 'CPO', title: 'Chief People Officer', department: 'People & Culture', description: 'People executive. Full access to HR, performance, engagement, and culture programs.' },
]

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
  credentials: DemoLauncherRole[]
}

const orgGroups: OrgGroup[] = [
  {
    name: 'Ecobank Transnational',
    industry: 'Banking & Financial Services',
    country: 'Nigeria',
    employeeCount: 14247,
    credentials: ecobankRoles,
  },
  {
    name: 'Kash & Co',
    industry: 'Consulting & Professional Services',
    country: 'South Africa',
    employeeCount: 342,
    credentials: kashRoles,
  },
]

export default function DemoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginDemo } = useTempo()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [launchError, setLaunchError] = useState('')

  // Check for magic link auto-login via ?as=slug
  useEffect(() => {
    const autoLogin = searchParams.get('as')
    if (autoLogin && MAGIC_LINK_EMAILS[autoLogin]) {
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
    if (!MAGIC_LINK_EMAILS[slug]) return
    setLoading(slug)
    setLaunchError('')
    const result = await loginDemo(slug)
    if (result === true) {
      router.push('/dashboard')
    } else {
      setLoading(null)
      setLaunchError('This demo role is not configured in this deployment. Check the Vercel demo environment variables.')
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

  const handleDemoLogin = async (cred: DemoLauncherRole) => {
    const slug = EMAIL_TO_SLUG[cred.email] || cred.employeeId
    if (!EMAIL_TO_SLUG[cred.email]) {
      setLaunchError('This demo role does not have a magic-link slug configured yet.')
      return
    }
    setLoading(slug)
    setLaunchError('')
    const result = await loginDemo(slug)
    if (result === true) {
      router.push('/dashboard')
    } else {
      setLoading(null)
      setLaunchError('This demo role is not configured in this deployment. Check the Vercel demo environment variables.')
    }
  }

  const copyMagicLink = (cred: DemoLauncherRole) => {
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
        {launchError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-700" />
              <p className="text-[0.65rem] leading-relaxed text-amber-800">{launchError}</p>
            </div>
          </div>
        )}

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
