'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Plus, Trash2, Globe, ChevronDown, CheckCircle2, UserPlus, Mail } from 'lucide-react'

const INDUSTRIES = [
  'Banking & Financial Services', 'Consulting & Professional Services', 'Technology',
  'Healthcare', 'Manufacturing', 'Retail & E-commerce', 'Education',
  'Energy & Utilities', 'Real Estate', 'Telecommunications', 'Media & Entertainment',
  'Government & Public Sector', 'Agriculture', 'Transportation & Logistics', 'Other',
]

// Country-to-currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, { currency: string; flag: string }> = {
  'Ghana': { currency: 'GHS', flag: '\u{1F1EC}\u{1F1ED}' },
  'Nigeria': { currency: 'NGN', flag: '\u{1F1F3}\u{1F1EC}' },
  'Kenya': { currency: 'KES', flag: '\u{1F1F0}\u{1F1EA}' },
  'South Africa': { currency: 'ZAR', flag: '\u{1F1FF}\u{1F1E6}' },
  'Tanzania': { currency: 'TZS', flag: '\u{1F1F9}\u{1F1FF}' },
  'Rwanda': { currency: 'RWF', flag: '\u{1F1F7}\u{1F1FC}' },
  'Morocco': { currency: 'MAD', flag: '\u{1F1F2}\u{1F1E6}' },
  'Egypt': { currency: 'EGP', flag: '\u{1F1EA}\u{1F1EC}' },
  "Cote d'Ivoire": { currency: 'XOF', flag: '\u{1F1E8}\u{1F1EE}' },
  'Senegal': { currency: 'XOF', flag: '\u{1F1F8}\u{1F1F3}' },
  'Ethiopia': { currency: 'ETB', flag: '\u{1F1EA}\u{1F1F9}' },
  'Uganda': { currency: 'UGX', flag: '\u{1F1FA}\u{1F1EC}' },
  'Cameroon': { currency: 'XAF', flag: '\u{1F1E8}\u{1F1F2}' },
  'Angola': { currency: 'AOA', flag: '\u{1F1E6}\u{1F1F4}' },
  'Mozambique': { currency: 'MZN', flag: '\u{1F1F2}\u{1F1FF}' },
  'United States': { currency: 'USD', flag: '\u{1F1FA}\u{1F1F8}' },
  'Canada': { currency: 'CAD', flag: '\u{1F1E8}\u{1F1E6}' },
  'Mexico': { currency: 'MXN', flag: '\u{1F1F2}\u{1F1FD}' },
  'Brazil': { currency: 'BRL', flag: '\u{1F1E7}\u{1F1F7}' },
  'Colombia': { currency: 'COP', flag: '\u{1F1E8}\u{1F1F4}' },
  'United Kingdom': { currency: 'GBP', flag: '\u{1F1EC}\u{1F1E7}' },
  'Germany': { currency: 'EUR', flag: '\u{1F1E9}\u{1F1EA}' },
  'France': { currency: 'EUR', flag: '\u{1F1EB}\u{1F1F7}' },
  'Netherlands': { currency: 'EUR', flag: '\u{1F1F3}\u{1F1F1}' },
  'Spain': { currency: 'EUR', flag: '\u{1F1EA}\u{1F1F8}' },
  'Italy': { currency: 'EUR', flag: '\u{1F1EE}\u{1F1F9}' },
  'Ireland': { currency: 'EUR', flag: '\u{1F1EE}\u{1F1EA}' },
  'Switzerland': { currency: 'CHF', flag: '\u{1F1E8}\u{1F1ED}' },
  'Sweden': { currency: 'SEK', flag: '\u{1F1F8}\u{1F1EA}' },
  'Poland': { currency: 'PLN', flag: '\u{1F1F5}\u{1F1F1}' },
  'India': { currency: 'INR', flag: '\u{1F1EE}\u{1F1F3}' },
  'Singapore': { currency: 'SGD', flag: '\u{1F1F8}\u{1F1EC}' },
  'UAE': { currency: 'AED', flag: '\u{1F1E6}\u{1F1EA}' },
  'Saudi Arabia': { currency: 'SAR', flag: '\u{1F1F8}\u{1F1E6}' },
  'Japan': { currency: 'JPY', flag: '\u{1F1EF}\u{1F1F5}' },
  'China': { currency: 'CNY', flag: '\u{1F1E8}\u{1F1F3}' },
  'Australia': { currency: 'AUD', flag: '\u{1F1E6}\u{1F1FA}' },
  'New Zealand': { currency: 'NZD', flag: '\u{1F1F3}\u{1F1FF}' },
  'Philippines': { currency: 'PHP', flag: '\u{1F1F5}\u{1F1ED}' },
  'Indonesia': { currency: 'IDR', flag: '\u{1F1EE}\u{1F1E9}' },
}

const COUNTRIES = Object.keys(COUNTRY_CURRENCY_MAP)

const ENTITY_TYPES = [
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'branch', label: 'Branch' },
  { value: 'joint_venture', label: 'Joint Venture' },
  { value: 'rep_office', label: 'Representative Office' },
  { value: 'eor', label: 'EOR Entity' },
]

const PLANS = [
  { value: 'free', label: 'Free', desc: 'Up to 10 employees, core HR only' },
  { value: 'starter', label: 'Starter', desc: 'Up to 50 employees, 5 modules' },
  { value: 'professional', label: 'Professional', desc: 'Up to 500 employees, all modules' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Unlimited employees, priority support' },
]

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000-10000', '10000+']

interface EntityEntry {
  id: string
  name: string
  country: string
  type: string
  currency: string
  registrationNumber: string
}

function createEmptyEntity(): EntityEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    country: '',
    type: 'subsidiary',
    currency: '',
    registrationNumber: '',
  }
}

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500'
const labelClass = 'block text-sm font-medium text-t2 mb-1.5'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Company details
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [plan, setPlan] = useState('starter')
  const [size, setSize] = useState('')

  // Corporate structure
  const [structureType, setStructureType] = useState<'single' | 'multi_entity'>('single')
  const [entities, setEntities] = useState<EntityEntry[]>([createEmptyEntity()])

  // Company administrator
  const [adminUser, setAdminUser] = useState({
    fullName: '',
    email: '',
    jobTitle: 'Administrator',
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    autoOnboarding: true,
  })

  // Post-creation success state
  const [creationResult, setCreationResult] = useState<{
    success: boolean
    orgName: string
    orgId: string
    orgSlug: string
    adminEmail: string
    plan: string
    welcomeEmailSent: boolean
  } | null>(null)

  // Access control
  const [crossEntityAnalytics, setCrossEntityAnalytics] = useState(true)
  const [crossEntityUserAssignment, setCrossEntityUserAssignment] = useState(true)
  const [financialConsolidation, setFinancialConsolidation] = useState(true)
  const [sharedEmployeeDirectory, setSharedEmployeeDirectory] = useState(true)

  // Auto-generate slug from name
  const handleNameChange = (v: string) => {
    setName(v)
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(v))
    }
  }

  const handleEntityChange = useCallback((entityId: string, field: keyof EntityEntry, value: string) => {
    setEntities(prev => prev.map(e => {
      if (e.id !== entityId) return e
      const updated = { ...e, [field]: value }
      // Auto-populate currency when country changes
      if (field === 'country' && value in COUNTRY_CURRENCY_MAP) {
        updated.currency = COUNTRY_CURRENCY_MAP[value].currency
      }
      return updated
    }))
  }, [])

  const addEntity = useCallback(() => {
    setEntities(prev => [...prev, createEmptyEntity()])
  }, [])

  const removeEntity = useCallback((entityId: string) => {
    setEntities(prev => prev.length > 1 ? prev.filter(e => e.id !== entityId) : prev)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        name, slug, industry, country, plan, size,
        structureType,
      }

      if (structureType === 'multi_entity') {
        payload.entities = entities.map(e => ({
          name: e.name,
          country: e.country,
          type: e.type,
          currency: e.currency,
          registrationNumber: e.registrationNumber,
        }))
        payload.accessControl = {
          crossEntityAnalytics,
          crossEntityUserAssignment,
          financialConsolidation,
          sharedEmployeeDirectory,
        }
      }

      // Include admin user if email is provided
      if (adminUser.email.trim()) {
        payload.adminUser = {
          fullName: adminUser.fullName,
          email: adminUser.email,
          jobTitle: adminUser.jobTitle || 'Administrator',
          sendWelcomeEmail: adminUser.sendWelcomeEmail,
          requirePasswordChange: adminUser.requirePasswordChange,
          autoOnboarding: adminUser.autoOnboarding,
        }
      }

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create organization')
        return
      }

      // Show success view instead of redirecting
      setCreationResult({
        success: true,
        orgName: name,
        orgId: data.organization?.id || '',
        orgSlug: slug,
        adminEmail: adminUser.email.trim() || '',
        plan,
        welcomeEmailSent: data.welcomeEmailSent ?? false,
      })
    } catch {
      setError('Network error -- please try again')
    } finally {
      setLoading(false)
    }
  }

  // Success view after creation
  if (creationResult) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-t1 mb-2">Organization Created Successfully!</h1>
          <p className="text-sm text-t3">Everything is set up and ready to go.</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-t1 mb-3">Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-t3">Company</p>
              <p className="font-medium text-t1">{creationResult.orgName}</p>
            </div>
            <div>
              <p className="text-t3">Plan</p>
              <p className="font-medium text-t1 capitalize">{creationResult.plan}</p>
            </div>
            {creationResult.adminEmail && (
              <div className="col-span-2">
                <p className="text-t3">Admin</p>
                <p className="font-medium text-t1">{creationResult.adminEmail}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-sm font-semibold text-t1 mb-3">What happens next</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                <span className="text-t2">Organization created in the platform</span>
              </li>
              {creationResult.adminEmail && (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-t2">Admin account created for {creationResult.adminEmail}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {creationResult.welcomeEmailSent ? (
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Mail size={16} className="text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-t2">
                      {creationResult.welcomeEmailSent
                        ? 'Welcome email sent with login credentials'
                        : 'Welcome email skipped (no email provider configured)'}
                    </span>
                  </li>
                </>
              )}
              <li className="flex items-center gap-2 text-t3">
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-xs font-bold">&#8594;</span>
                <span>Admin logs in and completes the onboarding wizard</span>
              </li>
              <li className="flex items-center gap-2 text-t3">
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-xs font-bold">&#8594;</span>
                <span>Admin invites their team and imports employees</span>
              </li>
              <li className="flex items-center gap-2 text-t3">
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-xs font-bold">&#8594;</span>
                <span>Company is live on Tempo</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {creationResult.orgSlug && (
            <Link
              href={`/admin/organizations/${creationResult.orgSlug}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Building2 size={16} />
              View Organization
            </Link>
          )}
          <button
            onClick={() => {
              setCreationResult(null)
              setName('')
              setSlug('')
              setIndustry('')
              setCountry('')
              setPlan('starter')
              setSize('')
              setStructureType('single')
              setEntities([createEmptyEntity()])
              setAdminUser({
                fullName: '',
                email: '',
                jobTitle: 'Administrator',
                sendWelcomeEmail: true,
                requirePasswordChange: true,
                autoOnboarding: true,
              })
            }}
            className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-surface rounded-lg text-sm font-medium text-t2 transition-colors"
          >
            <Plus size={16} />
            Create Another
          </button>
          <Link
            href="/admin/organizations"
            className="px-4 py-2.5 text-sm text-t3 hover:text-t1 transition-colors"
          >
            Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-t3 hover:text-t1 transition-colors"
      >
        <ArrowLeft size={14} /> Back to organizations
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-t1">Create Organization</h1>
        <p className="text-sm text-t3 mt-1">Onboard a new company to the Tempo platform</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-t1">Company Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corporation"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>URL Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                required
                className={inputClass}
              />
              <p className="text-xs text-t3 mt-1">Used in URLs: tempo.dev/{slug || 'acme-corp'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Headquarters Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>
                    {COUNTRY_CURRENCY_MAP[c].flag} {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Company Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={`${inputClass} max-w-xs`}
            >
              <option value="">Select size</option>
              {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-t1">Subscription Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlan(p.value)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  plan === p.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-border hover:border-amber-200'
                }`}
              >
                <p className="text-sm font-semibold text-t1">{p.label}</p>
                <p className="text-xs text-t3 mt-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Corporate Structure */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-t2" />
            <h2 className="text-sm font-semibold text-t1">Corporate Structure</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50"
              style={{ borderColor: structureType === 'single' ? 'rgb(245 158 11)' : '' }}
            >
              <input
                type="radio"
                name="structureType"
                value="single"
                checked={structureType === 'single'}
                onChange={() => setStructureType('single')}
                className="mt-0.5 accent-amber-500"
              />
              <div>
                <p className="text-sm font-medium text-t1">Single Entity</p>
                <p className="text-xs text-t3 mt-0.5">One country, one legal entity</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50"
              style={{ borderColor: structureType === 'multi_entity' ? 'rgb(245 158 11)' : '' }}
            >
              <input
                type="radio"
                name="structureType"
                value="multi_entity"
                checked={structureType === 'multi_entity'}
                onChange={() => setStructureType('multi_entity')}
                className="mt-0.5 accent-amber-500"
              />
              <div>
                <p className="text-sm font-medium text-t1">Multi-Entity Group</p>
                <p className="text-xs text-t3 mt-0.5">Parent company with subsidiaries, branches, or country entities</p>
              </div>
            </label>
          </div>

          {/* Multi-Entity Configuration */}
          {structureType === 'multi_entity' && (
            <div className="space-y-5 pt-2">
              {/* Parent info */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className="text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">Parent Company</p>
                </div>
                <p className="text-sm text-amber-700">
                  {name || 'Company Name'} {country ? `(${country})` : ''}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  The parent entity is created from the Company Details above.
                  {country && COUNTRY_CURRENCY_MAP[country] && (
                    <> Consolidation currency: {COUNTRY_CURRENCY_MAP[country].currency}</>
                  )}
                </p>
              </div>

              {/* Subsidiaries */}
              <div>
                <h3 className="text-sm font-medium text-t1 mb-3">Subsidiaries / Country Entities</h3>
                <div className="space-y-4">
                  {entities.map((entity, index) => (
                    <div key={entity.id} className="rounded-lg border border-border p-4 space-y-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-t3 uppercase tracking-wide">Entity {index + 1}</span>
                        {entities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntity(entity.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                            title="Remove entity"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Entity Name *</label>
                          <input
                            type="text"
                            value={entity.name}
                            onChange={(e) => handleEntityChange(entity.id, 'name', e.target.value)}
                            placeholder={`${name || 'Acme'} Ghana Ltd`}
                            required
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Country *</label>
                          <select
                            value={entity.country}
                            onChange={(e) => handleEntityChange(entity.id, 'country', e.target.value)}
                            required
                            className={inputClass}
                          >
                            <option value="">Select country</option>
                            {COUNTRIES.map(c => (
                              <option key={c} value={c}>
                                {COUNTRY_CURRENCY_MAP[c].flag} {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={labelClass}>Entity Type</label>
                          <select
                            value={entity.type}
                            onChange={(e) => handleEntityChange(entity.id, 'type', e.target.value)}
                            className={inputClass}
                          >
                            {ENTITY_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Currency</label>
                          <input
                            type="text"
                            value={entity.currency}
                            onChange={(e) => handleEntityChange(entity.id, 'currency', e.target.value)}
                            placeholder="Auto from country"
                            className={inputClass}
                          />
                          {entity.country && COUNTRY_CURRENCY_MAP[entity.country] && entity.currency === COUNTRY_CURRENCY_MAP[entity.country].currency && (
                            <p className="text-xs text-emerald-600 mt-1">Auto-populated from {entity.country}</p>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>Reg. Number</label>
                          <input
                            type="text"
                            value={entity.registrationNumber}
                            onChange={(e) => handleEntityChange(entity.id, 'registrationNumber', e.target.value)}
                            placeholder="Optional"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addEntity}
                  className="mt-3 flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  <Plus size={14} />
                  Add Another Entity
                </button>
              </div>

              {/* Access Control */}
              <div>
                <h3 className="text-sm font-medium text-t1 mb-3">Access Control</h3>
                <div className="space-y-3">
                  <AccessControlCheckbox
                    checked={crossEntityAnalytics}
                    onChange={setCrossEntityAnalytics}
                    label="Allow cross-entity analytics"
                    description="Group-level dashboards, consolidated reporting across all entities"
                  />
                  <AccessControlCheckbox
                    checked={crossEntityUserAssignment}
                    onChange={setCrossEntityUserAssignment}
                    label="Allow cross-entity user assignment"
                    description="Users can be assigned to multiple entities with different roles"
                  />
                  <AccessControlCheckbox
                    checked={financialConsolidation}
                    onChange={setFinancialConsolidation}
                    label="Enable financial consolidation"
                    description="Consolidated P&L, intercompany elimination, multi-currency reporting"
                  />
                  <AccessControlCheckbox
                    checked={sharedEmployeeDirectory}
                    onChange={setSharedEmployeeDirectory}
                    label="Shared employee directory"
                    description="All entities visible in one org chart, with entity filtering"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Company Administrator */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-t2" />
            <h2 className="text-sm font-semibold text-t1">Company Administrator</h2>
          </div>
          <p className="text-xs text-t3 -mt-2">
            Set up the first admin user for this organization.
            They will receive a welcome email with login instructions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                value={adminUser.fullName}
                onChange={(e) => setAdminUser(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Kwame Asante"
                required={!!adminUser.email}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                value={adminUser.email}
                onChange={(e) => setAdminUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="kwame@acme.com"
                required={!!adminUser.fullName}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Job Title</label>
            <input
              type="text"
              value={adminUser.jobTitle}
              onChange={(e) => setAdminUser(prev => ({ ...prev, jobTitle: e.target.value }))}
              placeholder="Administrator"
              className={`${inputClass} max-w-xs`}
            />
            <p className="text-xs text-t3 mt-1">Defaults to &quot;Administrator&quot; if left empty</p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={adminUser.sendWelcomeEmail}
                onChange={(e) => setAdminUser(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                className="mt-0.5 accent-amber-500 w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-t1 group-hover:text-amber-700 transition-colors">Send welcome email with temporary password</p>
                <p className="text-xs text-t3 mt-0.5">The admin will receive an email with their login credentials</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={adminUser.requirePasswordChange}
                onChange={(e) => setAdminUser(prev => ({ ...prev, requirePasswordChange: e.target.checked }))}
                className="mt-0.5 accent-amber-500 w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-t1 group-hover:text-amber-700 transition-colors">Require password change on first login</p>
                <p className="text-xs text-t3 mt-0.5">The temporary password must be changed before accessing the platform</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={adminUser.autoOnboarding}
                onChange={(e) => setAdminUser(prev => ({ ...prev, autoOnboarding: e.target.checked }))}
                className="mt-0.5 accent-amber-500 w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium text-t1 group-hover:text-amber-700 transition-colors">Auto-redirect to onboarding wizard on first login</p>
                <p className="text-xs text-t3 mt-0.5">Guides the admin through initial organization setup</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !name || !slug}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
          <Link
            href="/admin/organizations"
            className="px-4 py-2.5 text-sm text-t3 hover:text-t1 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function AccessControlCheckbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-amber-500 w-4 h-4"
      />
      <div>
        <p className="text-sm font-medium text-t1 group-hover:text-amber-700 transition-colors">{label}</p>
        <p className="text-xs text-t3 mt-0.5">{description}</p>
      </div>
    </label>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
