'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

const interests = [
  'Train my employees & teams',
  'Run SME / entrepreneur programmes',
  'Build a financial literacy academy',
  'Deliver leadership development',
  'Create a supplier development programme',
  'Explore partnership opportunities',
  'Other',
]

const orgSizes = [
  '1–50 employees',
  '51–200 employees',
  '201–1,000 employees',
  '1,001–5,000 employees',
  '5,000+ employees',
  'Development / NGO / Government',
]

export default function GetStartedPage() {
  const [form, setForm] = useState({
    interest: '',
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    orgSize: '',
    message: '',
    agreed: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }))

  const canSubmit = form.interest && form.firstName && form.lastName && form.email && form.company && form.agreed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    // In production, POST to /api/academy/leads
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white antialiased flex items-center justify-center">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-black/[0.04]">
          <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[64px]">
            <Link href="/academy"><img src="/images/brand/logo-black-400.png" alt="tempo" className="h-6" /></Link>
          </div>
        </nav>

        <div className="text-center px-6 max-w-[480px]">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-[32px] font-bold text-[#1a1a1a] tracking-[-0.02em] mb-3">Thank you, {form.firstName}.</h1>
          <p className="text-[17px] text-[#1a1a1a]/50 leading-[1.6] mb-8">
            We&rsquo;ve received your enquiry and will be in touch within 24 hours. In the meantime, you can explore what Tempo Academy offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/academy" className="bg-[#1a1a1a] text-white text-[15px] font-medium px-6 py-3 rounded-full transition hover:bg-[#333]">
              Back to Academy
            </Link>
            <Link href="/academy/diagnostic" className="text-[#1a1a1a] text-[15px] font-medium px-6 py-3 rounded-full border border-black/10 hover:border-black/20 transition">
              Take the Assessment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[64px]">
          <Link href="/academy"><img src="/images/brand/logo-black-400.png" alt="tempo" className="h-6" /></Link>
          <Link href="/academy/login" className="text-[14px] font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition">Already have an account? Sign in</Link>
        </div>
      </nav>

      <div className="pt-[64px] min-h-screen flex">
        {/* Left — form */}
        <div className="flex-1 flex items-start justify-center py-12 sm:py-16 px-6">
          <div className="w-full max-w-[480px]">
            <h1 className="text-[32px] sm:text-[40px] font-bold text-[#1a1a1a] tracking-[-0.02em] leading-[1.1] mb-3">
              Start your journey with Tempo Academy.
            </h1>
            <p className="text-[16px] text-[#1a1a1a]/45 leading-[1.5] mb-10">
              Tell us a bit about yourself and your goals. We&rsquo;ll get back to you within 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Interest */}
              <div>
                <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">I&rsquo;m interested in... <span className="text-[#E8590C]">*</span></label>
                <select
                  value={form.interest}
                  onChange={e => update('interest', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-black/10 bg-white text-[15px] text-[#1a1a1a] focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                >
                  <option value="">Select an option</option>
                  {interests.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">First name <span className="text-[#E8590C]">*</span></label>
                  <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First name" className="w-full h-12 px-4 rounded-xl border border-black/10 text-[15px] text-[#1a1a1a] placeholder:text-black/25 focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">Last name <span className="text-[#E8590C]">*</span></label>
                  <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last name" className="w-full h-12 px-4 rounded-xl border border-black/10 text-[15px] text-[#1a1a1a] placeholder:text-black/25 focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition" />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">Company / Organisation <span className="text-[#E8590C]">*</span></label>
                <input type="text" value={form.company} onChange={e => update('company', e.target.value)} placeholder="Your company or organisation name" className="w-full h-12 px-4 rounded-xl border border-black/10 text-[15px] text-[#1a1a1a] placeholder:text-black/25 focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">Work email <span className="text-[#E8590C]">*</span></label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com" className="w-full h-12 px-4 rounded-xl border border-black/10 text-[15px] text-[#1a1a1a] placeholder:text-black/25 focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">Phone number</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+234 800 000 0000" className="w-full h-12 px-4 rounded-xl border border-black/10 text-[15px] text-[#1a1a1a] placeholder:text-black/25 focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition" />
              </div>

              {/* Org size */}
              <div>
                <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">Organisation size</label>
                <select
                  value={form.orgSize}
                  onChange={e => update('orgSize', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-black/10 bg-white text-[15px] text-[#1a1a1a] focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                >
                  <option value="">Select size</option>
                  {orgSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[13px] font-medium text-[#1a1a1a]/70 mb-1.5">Anything else you&rsquo;d like us to know?</label>
                <textarea value={form.message} onChange={e => update('message', e.target.value)} rows={3} placeholder="Tell us about your training goals, number of participants, timeline..." className="w-full px-4 py-3 rounded-xl border border-black/10 text-[15px] text-[#1a1a1a] placeholder:text-black/25 focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]/20 transition resize-none" />
              </div>

              {/* Agreement */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.agreed} onChange={e => update('agreed', e.target.checked)} className="mt-1 w-4 h-4 rounded border-black/20 text-[#E8590C] focus:ring-[#E8590C]/30" />
                <span className="text-[13px] text-[#1a1a1a]/50 leading-[1.5]">
                  Yes, I agree to Tempo&rsquo;s <Link href="/privacy" className="underline hover:text-[#1a1a1a] transition">privacy policy</Link>. We&rsquo;ll use your information to respond to your enquiry and share relevant updates. <span className="text-[#E8590C]">*</span>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={`w-full h-[52px] rounded-xl text-[16px] font-medium flex items-center justify-center gap-2 transition ${
                  canSubmit && !submitting
                    ? 'bg-[#1a1a1a] hover:bg-[#333] text-white cursor-pointer'
                    : 'bg-black/5 text-black/25 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                ) : (
                  <>Get Started <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-[12px] text-[#1a1a1a]/25 text-center">
                Free for up to 25 participants. No credit card required.
              </p>
            </form>
          </div>
        </div>

        {/* Right — visual panel (desktop only) */}
        <div className="hidden lg:flex w-[480px] shrink-0 relative overflow-hidden" style={{
          background: 'linear-gradient(165deg, #FFF7ED 0%, #FFEDD5 30%, #FED7AA 60%, #FDBA74 100%)'
        }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10">
            {/* Floating cards */}
            <div className="w-full max-w-[320px] space-y-4">
              <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm">
                <p className="text-[13px] font-semibold text-[#1a1a1a]/40 uppercase tracking-wider mb-3">What you get</p>
                <div className="space-y-3">
                  {[
                    'Branded academy portal',
                    'Cohort management tools',
                    'AI-powered course builder',
                    'Verified certificates',
                    'Impact analytics dashboard',
                    'Email automation',
                    'Community & forums',
                    'Multi-language support',
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[14px] text-[#1a1a1a]/70">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-[#E8590C] text-[#E8590C]" />)}
                </div>
                <p className="text-[14px] text-[#1a1a1a]/70 leading-[1.5] mb-3 italic">
                  &ldquo;We launched our SME academy in 3 days. 340 entrepreneurs enrolled across 6 countries.&rdquo;
                </p>
                <p className="text-[12px] text-[#1a1a1a]/30">Head of Enterprise Development</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Star({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
