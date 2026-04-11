'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          companyName: formData.company,
          companySize: '500+',
          country: 'Not specified',
          timeline: 'Enterprise inquiry',
          message: formData.message,
          modules: [],
        }),
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav style={{ padding: '16px 32px', borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111', textDecoration: 'none' }}>
          tempo<span style={{ color: '#00897B' }}>.</span>
        </Link>
      </nav>

      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 24px' }}>
        {/* Enterprise badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(234,88,12,.06)', border: '1px solid rgba(234,88,12,.15)', marginBottom: 20 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004D40" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#004D40' }}>Enterprise</span>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111', letterSpacing: '-.025em', marginBottom: 8 }}>
          Contact Sales
        </h1>
        <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 8 }}>
          For enterprise organizations with 500+ employees. Our team will work with you to build a custom implementation plan.
        </p>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
          Or email us directly at{' '}
          <a href="mailto:enterprise@theworktempo.com" style={{ color: '#004D40', textDecoration: 'none', fontWeight: 500 }}>
            enterprise@theworktempo.com
          </a>
        </p>

        {submitted ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>Message sent</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>
              Our enterprise team will review your inquiry and respond within one business day.
            </p>
            <Link href="/" style={{ display: 'inline-block', marginTop: 20, fontSize: 14, fontWeight: 600, color: '#004D40', textDecoration: 'none' }}>
              &larr; Back to homepage
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  Name <span style={{ color: '#004D40' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  Email <span style={{ color: '#004D40' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@company.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  Company <span style={{ color: '#004D40' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
                  Message <span style={{ color: '#004D40' }}>*</span>
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your organization, current challenges, and what you're looking for..."
                  rows={5}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: loading ? '#ccc' : '#004D40',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}

        {/* Alternative CTA */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <p style={{ fontSize: 13, color: '#999' }}>
            Not an enterprise?{' '}
            <Link href="/demo-request" style={{ color: '#004D40', textDecoration: 'none', fontWeight: 500 }}>
              Request a demo
            </Link>{' '}
            or{' '}
            <Link href="/signup" style={{ color: '#004D40', textDecoration: 'none', fontWeight: 500 }}>
              start a free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
