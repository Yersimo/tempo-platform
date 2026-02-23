'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    industry: '',
    size: '',
    country: '',
  })

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          industry: formData.industry,
          size: formData.size,
          country: formData.country,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Signup failed. Please try again.')
        setLoading(false)
        return
      }

      const { user } = await res.json()
      // Cache user for instant hydration (httpOnly cookie already set by API)
      try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
      router.push('/dashboard')
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="lg:hidden flex justify-center mb-8">
        <TempoLockup variant="color" size="md" />
      </div>
      <div className="bg-card rounded-[14px] border border-border p-8">
        <h2 className="text-xl font-semibold text-t1 mb-1">
          {step === 1 ? 'Create your account' : 'Set up your organization'}
        </h2>
        <p className="text-sm text-t3 mb-6">
          {step === 1 ? 'Start your 14-day free trial' : 'Tell us about your company'}
        </p>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-tempo-600' : 'bg-divider'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-tempo-600' : 'bg-divider'}`} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Work Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder="Your company name"
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                >
                  <option value="">Select industry</option>
                  <option value="banking">Banking & Financial Services</option>
                  <option value="tech">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail & Commerce</option>
                  <option value="telecom">Telecommunications</option>
                  <option value="energy">Energy & Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Company Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                >
                  <option value="">Select size</option>
                  <option value="1-50">1-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1,000 employees</option>
                  <option value="1001-5000">1,001-5,000 employees</option>
                  <option value="5000+">5,000+ employees</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Primary Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                >
                  <option value="">Select country</option>
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="CI">Cote d&apos;Ivoire</option>
                  <option value="KE">Kenya</option>
                  <option value="SN">Senegal</option>
                  <option value="ZA">South Africa</option>
                  <option value="TZ">Tanzania</option>
                  <option value="UG">Uganda</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : step === 1 ? 'Continue' : 'Create Organization'}
          </Button>

          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-t3 hover:text-t1 transition-colors">
              Back to account details
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-t3">
            Already have an account?{' '}
            <Link href="/login" className="text-tempo-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
