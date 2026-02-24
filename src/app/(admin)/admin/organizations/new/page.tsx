'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Plus } from 'lucide-react'

const INDUSTRIES = [
  'Banking & Financial Services', 'Consulting & Professional Services', 'Technology',
  'Healthcare', 'Manufacturing', 'Retail & E-commerce', 'Education',
  'Energy & Utilities', 'Real Estate', 'Telecommunications', 'Media & Entertainment',
  'Government & Public Sector', 'Agriculture', 'Transportation & Logistics', 'Other',
]

const COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Rwanda', 'Morocco', 'Egypt',
  "Cote d'Ivoire", 'Senegal', 'Tanzania', 'Ethiopia', 'Uganda', 'Cameroon',
  'United States', 'United Kingdom', 'France', 'Germany', 'India', 'Other',
]

const PLANS = [
  { value: 'free', label: 'Free', desc: 'Up to 10 employees, core HR only' },
  { value: 'starter', label: 'Starter', desc: 'Up to 50 employees, 5 modules' },
  { value: 'professional', label: 'Professional', desc: 'Up to 500 employees, all modules' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Unlimited employees, priority support' },
]

const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000-10000', '10000+']

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [plan, setPlan] = useState('starter')
  const [size, setSize] = useState('')

  // Auto-generate slug from name
  const handleNameChange = (v: string) => {
    setName(v)
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(v))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, industry, country, plan, size }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create organization')
        return
      }
      router.push('/admin/organizations')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
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
        {/* Company Name */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-t1">Company Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-t2 mb-1.5">Company Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corporation"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-t2 mb-1.5">URL Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
              <p className="text-xs text-t3 mt-1">Used in URLs: tempo.dev/{slug || 'acme-corp'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-t2 mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-t2 mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-t2 mb-1.5">Company Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 max-w-xs"
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
