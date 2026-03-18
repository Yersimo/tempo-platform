'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap, Award, Gamepad2, Mail, FileUp, Languages,
  Globe, BarChart3, Webhook, FolderOpen, MessageSquare, TrendingUp,
  Users, Building2, ArrowRight, CheckCircle2, Star,
  BookOpen, Trophy, Send,
  Check, X,
} from 'lucide-react'

/* ─── Feature Grid Data ─── */
const features = [
  { icon: GraduationCap, title: 'Cohort-Based Learning', desc: 'Organize learners into time-bound cohorts with structured curricula, deadlines, and collaborative activities.' },
  { icon: Award, title: 'Smart Certificates', desc: 'Auto-generate branded, verifiable certificates upon course or cohort completion with unique QR codes.' },
  { icon: Gamepad2, title: 'Gamification', desc: 'Points, badges, leaderboards, and streaks that drive engagement and healthy competition among learners.' },
  { icon: Mail, title: 'Email Automation', desc: 'Drip campaigns, enrollment confirmations, deadline reminders, and completion notifications on autopilot.' },
  { icon: FileUp, title: 'SCORM Import', desc: 'Import industry-standard SCORM and xAPI content packages from any authoring tool.' },
  { icon: Languages, title: 'Multi-Language', desc: 'Deliver content in multiple languages with automatic locale detection and RTL support.' },
  { icon: Globe, title: 'Custom Domains', desc: 'Host your academy on your own domain with full SSL, custom branding, and white-label options.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time dashboards tracking enrollment, completion rates, quiz scores, and learner engagement.' },
  { icon: Webhook, title: 'Webhooks & API', desc: 'Integrate with your existing stack via REST APIs and real-time webhooks for every event.' },
  { icon: FolderOpen, title: 'File Management', desc: 'Centralized media library with versioning, access controls, and CDN-backed delivery.' },
  { icon: MessageSquare, title: 'Community Forums', desc: 'Built-in discussion forums per course and cohort for peer learning and Q&A.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Granular progress tracking per module, lesson, and assessment with visual completion maps.' },
]

/* ─── How It Works Steps ─── */
const steps = [
  { num: '01', icon: BookOpen, title: 'Create Your Academy', desc: 'Set up branding, curriculum, and cohort schedules. Import existing content or build from scratch with our course editor.' },
  { num: '02', icon: Send, title: 'Invite Participants', desc: 'Send branded invitations with one-click enrollment. Support self-registration, bulk import, or SSO-based access.' },
  { num: '03', icon: Trophy, title: 'Track & Certify', desc: 'Monitor progress in real time, award badges for milestones, and issue verified certificates automatically.' },
]

/* ─── Competitor Comparison ─── */
const competitors = ['Tempo Academy', 'AMI', 'TalentLMS', 'Docebo']
const comparisonRows = [
  { label: 'Starting Price', values: ['Included in plan', '$200/mo', '$69/mo', '$400/mo'] },
  { label: 'White-Label', values: [true, false, 'Add-on', true] },
  { label: 'Gamification', values: [true, false, true, true] },
  { label: 'HR Integration', values: ['Native', false, 'API only', 'API only'] },
  { label: 'Africa Focus', values: [true, true, false, false] },
  { label: 'Self-Serve Setup', values: [true, false, true, true] },
]

function CompCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-green-500 mx-auto" />
  if (value === false) return <X size={14} className="text-zinc-600 mx-auto" />
  return <span className="text-sm text-zinc-300">{String(value)}</span>
}

export default function AcademyPage() {
  const revealRefs = useRef<HTMLDivElement[]>([])
  const [email, setEmail] = useState('')

  /* ─── Scroll reveal ─── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('opacity-100', 'translate-y-0')
          e.target.classList.remove('opacity-0', 'translate-y-6')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    revealRefs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const addRevealRef = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ─── Sticky Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-medium tracking-tight" style={{ letterSpacing: '-0.035em' }}>
            <svg style={{ width: 16, height: 'auto' }} viewBox="0 0 80 100" fill="none">
              <line x1="2" y1="3" x2="78" y2="3" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" opacity=".6" />
              <path d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" opacity=".5" />
              <path d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" />
            </svg>
            tempo
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">Sign In</Link>
            <Link href="/signup?plan=professional" className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all">
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-36 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B3A5C]/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#00567A10_0%,_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#1B3A5C]/20 border border-[#1B3A5C]/30 rounded-full px-4 py-1.5 text-sm text-sky-400 mb-6">
            <GraduationCap size={14} />
            Built into Tempo &mdash; no separate vendor
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-6" style={{ letterSpacing: '-0.035em' }}>
            Your Academy. Inside Your
            <br />
            HR Platform.{' '}
            <span className="bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent">Built for Africa.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Launch branded learning academies for your employees, customers, and partners &mdash; with cohort-based learning, automated certificates, and real-time analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup?plan=professional"
              className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-600/25"
            >
              Request a Demo
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-8 py-4 rounded-xl border border-zinc-700 transition-all"
              onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}
            >
              See It In Action
            </a>
          </div>
        </div>

        {/* ─── Dashboard Mockup ─── */}
        <div ref={addRevealRef} className="relative max-w-5xl mx-auto mt-16 opacity-0 translate-y-6 transition-all duration-700">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="flex-1 text-center text-xs text-zinc-600">Tempo Academy &mdash; Dashboard</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Learners', val: '2,847', change: '+12%' },
                  { label: 'Completion Rate', val: '78.3%', change: '+5.2%' },
                  { label: 'Certificates Issued', val: '1,203', change: '+89' },
                  { label: 'Avg. Score', val: '84.6', change: '+2.1' },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/40">
                    <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                    <p className="text-xl font-bold tracking-tight">{s.val}</p>
                    <p className="text-xs text-green-400 mt-1">{s.change}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 mb-3 font-medium">Enrollment Over Time</p>
                  <div className="flex items-end gap-1 h-24">
                    {[35, 42, 55, 48, 62, 58, 72, 65, 78, 85, 80, 92].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-sky-600/60 to-teal-500/60" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 mb-3 font-medium">Top Courses</p>
                  <div className="space-y-3">
                    {[
                      { name: 'SME Financial Literacy', pct: 92 },
                      { name: 'Leadership Essentials', pct: 78 },
                      { name: 'Digital Marketing', pct: 65 },
                    ].map((c) => (
                      <div key={c.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">{c.name}</span>
                          <span className="text-zinc-500">{c.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-sky-500 to-teal-500 rounded-full" style={{ width: `${c.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KEY STATS BAR ═══ */}
      <section ref={addRevealRef} className="max-w-5xl mx-auto px-6 pb-20 opacity-0 translate-y-6 transition-all duration-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '$4.17B', label: 'African e-learning market' },
            { value: '19.2%', label: 'Annual growth rate' },
            { value: '22', label: 'Production-ready DB tables' },
            { value: '0', label: 'Separate vendors needed' },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-zinc-900/60 border border-zinc-800 rounded-xl py-6 px-4">
              <p className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent" style={{ letterSpacing: '-0.035em' }}>
                {stat.value}
              </p>
              <p className="text-xs text-zinc-500 mt-2 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURE GRID ═══ */}
      <section id="features" ref={addRevealRef} className="max-w-7xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Everything you need to run a
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent">world-class academy</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            12 core capabilities, zero separate vendors. All natively integrated with your HR platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all group"
            >
              <feat.icon size={22} className="text-sky-400 mb-4 group-hover:text-teal-400 transition-colors" />
              <h3 className="font-semibold mb-2">{feat.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DUAL-AUDIENCE SECTION ═══ */}
      <section ref={addRevealRef} className="max-w-6xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            One platform, two powerful use cases
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Whether you are training internal teams or educating your broader ecosystem, Tempo Academy adapts to your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* For Your Team */}
          <div className="relative bg-gradient-to-br from-[#1B3A5C]/20 via-zinc-900 to-zinc-900 border border-[#1B3A5C]/30 rounded-2xl p-8 md:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#1B3A5C]/10 rounded-full blur-3xl" />
            <div className="relative">
              <Users size={28} className="text-sky-400 mb-5" />
              <h3 className="text-xl font-bold mb-3">For Your Team</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Train employees with integrated learning paths tied to performance reviews, onboarding workflows, and career development plans.
              </p>
              <ul className="space-y-3">
                {[
                  'Onboarding programs linked to employee profiles',
                  'Skill gap analysis connected to performance data',
                  'Compliance training with automated tracking',
                  'Manager dashboards for team learning progress',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 size={15} className="text-sky-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* For Your Ecosystem */}
          <div className="relative bg-gradient-to-br from-teal-900/20 via-zinc-900 to-zinc-900 border border-teal-800/30 rounded-2xl p-8 md:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-900/10 rounded-full blur-3xl" />
            <div className="relative">
              <Building2 size={28} className="text-teal-400 mb-5" />
              <h3 className="text-xl font-bold mb-3">For Your Ecosystem</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Launch branded academies for customers, partners, and communities with separate participant portals and custom domains.
              </p>
              <ul className="space-y-3">
                {[
                  'White-label portals with your brand and domain',
                  'Self-registration and bulk enrollment workflows',
                  'Revenue tracking for paid course offerings',
                  'Partner-specific content and access controls',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 size={15} className="text-teal-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section ref={addRevealRef} className="max-w-5xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Up and running in three steps
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            No implementation consultants required. Launch your first academy in minutes, not months.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center hover:border-zinc-600 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/30 mb-5">
                <step.icon size={20} className="text-sky-400" />
              </div>
              <p className="text-xs text-sky-400 font-bold tracking-widest uppercase mb-2">Step {step.num}</p>
              <h3 className="text-lg font-bold mb-3">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══ */}
      <section ref={addRevealRef} className="max-w-4xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            See how Tempo compares
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            The only learning platform natively built into your HR system, purpose-built for African enterprises.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-sm font-semibold text-zinc-400 w-[180px]">Feature</th>
                {competitors.map((c, i) => (
                  <th key={c} className={`text-center p-4 text-sm font-semibold ${i === 0 ? 'text-sky-400' : 'text-zinc-400'} w-[120px]`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-zinc-300">{row.label}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className={`px-4 py-3.5 text-center ${i === 0 ? 'bg-sky-500/5' : ''}`}>
                      <CompCell value={val} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section ref={addRevealRef} className="max-w-5xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Trusted by forward-thinking
            <br />
            African enterprises
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Organizations across the continent are using Tempo Academy to upskill their people and communities.
          </p>
        </div>

        {/* Logo placeholders */}
        <div className="flex flex-wrap justify-center gap-8 mb-14 opacity-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-28 h-10 bg-zinc-800 rounded-lg" />
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              quote: 'Tempo Academy transformed how we onboard across 14 countries. What used to take weeks now takes days, with better outcomes.',
              author: 'Head of Learning & Development',
              company: 'Pan-African Financial Services Group',
            },
            {
              quote: 'We launched our SME training academy in under a week. The cohort-based model and automated certificates exceeded our expectations.',
              author: 'Director of Partner Enablement',
              company: 'Leading West African Bank',
            },
          ].map((t) => (
            <div key={t.author} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="text-orange-500 fill-orange-500" />
                ))}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold">{t.author}</p>
                <p className="text-xs text-zinc-500">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section ref={addRevealRef} className="max-w-4xl mx-auto px-6 pb-32 opacity-0 translate-y-6 transition-all duration-700">
        <div className="relative bg-gradient-to-br from-[#1B3A5C]/25 via-zinc-900 to-zinc-900 border border-[#1B3A5C]/25 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00567A]/5 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
              Ready to launch
              <br />
              your academy?
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto mb-8">
              Join forward-thinking organizations using Tempo Academy to train, certify, and grow their people and communities.
            </p>

            {/* Email input */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              <button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-600/25 shrink-0">
                Get Started
              </button>
            </div>

            <p className="text-sm text-zinc-500">
              Or{' '}
              <Link href="/signup?plan=enterprise" className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors">
                schedule a demo
              </Link>{' '}
              with our team
            </p>
            <p className="text-xs text-zinc-600 mt-4">No credit card required. Free 14-day trial on all paid plans.</p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-zinc-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <svg style={{ width: 12, height: 'auto' }} viewBox="0 0 80 100" fill="none">
              <line x1="2" y1="3" x2="78" y2="3" stroke="#ea580c" strokeWidth="5" strokeLinecap="round" opacity=".6" />
              <path d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" opacity=".5" />
              <path d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" />
            </svg>
            &copy; {new Date().getFullYear()} Tempo. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
