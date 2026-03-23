'use client'

import { useState } from 'react'
import Link from 'next/link'

const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
const timelines = ['Evaluating now', 'Within 1 month', 'Within 3 months', 'Just exploring']
const moduleOptions = [
  'HR & People Management',
  'Payroll',
  'Recruiting & ATS',
  'Performance Management',
  'Learning & Development',
  'Finance & Accounting',
  'Time & Attendance',
  'Benefits',
  'Compliance',
  'IT & Device Management',
  'All Modules',
]

const countries = [
  'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Ethiopia', 'Tanzania',
  'Uganda', 'Senegal', 'Cameroon', 'Rwanda', 'Botswana', 'Zambia', 'Mozambique',
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Netherlands',
  'India', 'Brazil', 'Australia', 'Singapore', 'UAE', 'Saudi Arabia', 'Japan',
  'China', 'South Korea', 'Indonesia', 'Philippines', 'Mexico', 'Colombia',
  'Other',
]

interface DemoFormData {
  fullName: string
  email: string
  companyName: string
  jobTitle: string
  companySize: string
  country: string
  modules: string[]
  timeline: string
  message: string
}

export default function DemoRequestPage() {
  const [formData, setFormData] = useState<DemoFormData>({
    fullName: '',
    email: '',
    companyName: '',
    jobTitle: '',
    companySize: '',
    country: '',
    modules: [],
    timeline: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const toggleModule = (mod: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(mod)
        ? prev.modules.filter((m) => m !== mod)
        : [...prev.modules, mod],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Success State ───
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <nav style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', textDecoration: 'none' }}>
            tempo<span style={{ color: '#E8590C' }}>.</span>
          </Link>
        </nav>
        <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 8, letterSpacing: '-.02em' }}>
            Thank you, {formData.fullName.split(' ')[0]}!
          </h1>
          <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
            We&apos;ve received your demo request and our team will reach out within 24 hours to schedule your personalized walkthrough.
          </p>

          {/* Calendar Placeholder */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32, marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 8 }}>Pick a time that works for you</h3>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Calendar booking coming soon</p>
            <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                <p style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>Calendly integration coming soon</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>In the meantime, explore our platform:</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/pricing" style={{ fontSize: 13, fontWeight: 500, color: '#ea580c', textDecoration: 'none' }}>View Pricing &rarr;</Link>
              <Link href="/security" style={{ fontSize: 13, fontWeight: 500, color: '#ea580c', textDecoration: 'none' }}>Security &rarr;</Link>
              <Link href="/academy" style={{ fontSize: 13, fontWeight: 500, color: '#ea580c', textDecoration: 'none' }}>Academy &rarr;</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form ───
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', textDecoration: 'none' }}>
          tempo<span style={{ color: '#E8590C' }}>.</span>
        </Link>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
        {/* Left Side (40%) */}
        <div className="hidden lg:flex" style={{ width: '40%', background: '#0f1117', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
          {/* Glows */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 0%, rgba(232,89,12,0.07), transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 100%, rgba(232,89,12,0.04), transparent 50%)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              tempo<span style={{ color: '#E8590C' }}>.</span>
            </span>
            <h1 style={{ fontSize: 34, fontWeight: 600, color: '#fff', lineHeight: 1.15, letterSpacing: '-.025em', marginTop: 32 }}>
              See Tempo<br />in action
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.35)', lineHeight: 1.7, marginTop: 16, maxWidth: 340 }}>
              Book a personalized demo and discover how Tempo can transform your workforce operations.
            </p>

            {/* Bullet points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36 }}>
              {[
                '30-minute personalized walkthrough',
                'See your specific use case addressed',
                'No commitment, no credit card',
              ].map((text) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(234,88,12,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.15)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Trusted by companies across Africa and beyond</p>
            </div>

            {/* Free trial link */}
            <div style={{ marginTop: 24 }}>
              <Link href="/signup" style={{ fontSize: 13, color: '#ea580c', textDecoration: 'none', fontWeight: 500 }}>
                Prefer to explore on your own? Start a free trial &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side (60%) - Form */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 560 }}>
            {/* Mobile header */}
            <div className="lg:hidden" style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-.02em' }}>See Tempo in action</h1>
              <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Book a personalized demo</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {/* Full Name */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                    Full Name <span style={{ color: '#ea580c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                  />
                </div>

                {/* Work Email */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                    Work Email <span style={{ color: '#ea580c' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                    Company Name <span style={{ color: '#ea580c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Corp"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="HR Director"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                    Company Size <span style={{ color: '#ea580c' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', color: formData.companySize ? '#111' : '#9ca3af' }}
                  >
                    <option value="" disabled>Select size</option>
                    {companySizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                    Country <span style={{ color: '#ea580c' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', color: formData.country ? '#111' : '#9ca3af' }}
                  >
                    <option value="" disabled>Select country</option>
                    {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Modules of Interest */}
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 10 }}>
                  Modules of Interest
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {moduleOptions.map((mod) => {
                    const selected = formData.modules.includes(mod)
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          border: selected ? '1.5px solid #ea580c' : '1px solid #d1d5db',
                          background: selected ? 'rgba(234,88,12,.06)' : '#fff',
                          color: selected ? '#ea580c' : '#555',
                          fontSize: 12,
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all .15s',
                        }}
                      >
                        {selected && <span style={{ marginRight: 4 }}>&#10003;</span>}
                        {mod}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  Timeline <span style={{ color: '#ea580c' }}>*</span>
                </label>
                <select
                  required
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', color: formData.timeline ? '#111' : '#9ca3af' }}
                >
                  <option value="" disabled>When are you looking to implement?</option>
                  {timelines.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Message */}
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  Anything specific you&apos;d like to see?
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your specific needs or challenges..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: 24,
                  padding: '14px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: loading ? '#ccc' : '#ea580c',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background .2s',
                }}
              >
                {loading ? 'Submitting...' : 'Book Your Demo \u2192'}
              </button>

              <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12 }}>
                We&apos;ll never share your information. See our <Link href="/privacy" style={{ color: '#ea580c', textDecoration: 'none' }}>privacy policy</Link>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
