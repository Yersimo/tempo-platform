'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { TempoLockup } from '@/components/brand/tempo-lockup'

export default function SignupPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const tc = useTranslations('common')
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
        setError(data.error || t('signupFailed'))
        setLoading(false)
        return
      }

      const { user } = await res.json()
      // Cache user for instant hydration (httpOnly cookie already set by API)
      try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
      router.push('/onboarding')
    } catch {
      setError(t('networkError'))
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
          {step === 1 ? t('createAccount') : t('setupOrg')}
        </h2>
        <p className="text-sm text-t3 mb-6">
          {step === 1 ? t('startTrial') : t('tellAboutCompany')}
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
                <label className="block text-xs font-medium text-t1 mb-1">{t('fullNameLabel')}</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('workEmailLabel')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder={t('workEmailPlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('passwordLabel')}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={t('passwordMinLength')}
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
                <label className="block text-xs font-medium text-t1 mb-1">{t('companyNameLabel')}</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  placeholder={t('companyNamePlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('industryLabel')}</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                >
                  <option value="">{t('selectIndustry')}</option>
                  <option value="banking">{t('industryBanking')}</option>
                  <option value="tech">{t('industryTech')}</option>
                  <option value="healthcare">{t('industryHealthcare')}</option>
                  <option value="manufacturing">{t('industryManufacturing')}</option>
                  <option value="retail">{t('industryRetail')}</option>
                  <option value="telecom">{t('industryTelecom')}</option>
                  <option value="energy">{t('industryEnergy')}</option>
                  <option value="other">{t('industryOther')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('companySizeLabel')}</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                >
                  <option value="">{t('selectSize')}</option>
                  <option value="1-50">{t('size1to50')}</option>
                  <option value="51-200">{t('size51to200')}</option>
                  <option value="201-1000">{t('size201to1000')}</option>
                  <option value="1001-5000">{t('size1001to5000')}</option>
                  <option value="5000+">{t('size5000plus')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">{t('primaryCountryLabel')}</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
                  required
                >
                  <option value="">{t('selectCountry')}</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="AU">Australia</option>
                  <option value="NL">Netherlands</option>
                  <option value="SG">Singapore</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="IN">India</option>
                  <option value="BR">Brazil</option>
                  <option value="JP">Japan</option>
                  <option value="NG">{t('countryNigeria')}</option>
                  <option value="GH">{t('countryGhana')}</option>
                  <option value="CI">{t('countryCoteDIvoire')}</option>
                  <option value="KE">{t('countryKenya')}</option>
                  <option value="SN">{t('countrySenegal')}</option>
                  <option value="ZA">{t('countrySouthAfrica')}</option>
                  <option value="TZ">{t('countryTanzania')}</option>
                  <option value="UG">{t('countryUganda')}</option>
                  <option value="other">{t('countryOther')}</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('creatingAccount') : step === 1 ? tc('continue') : t('createOrganization')}
          </Button>

          {step === 2 && (
            <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-t3 hover:text-t1 transition-colors">
              {t('backToAccount')}
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-t3">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-tempo-600 hover:underline font-medium">{t('signInLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
