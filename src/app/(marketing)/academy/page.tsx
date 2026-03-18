'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, CheckCircle2, Star, Quote,
  TrendingUp, Users, Target, Heart, Lightbulb,
  Globe2, Award, BookOpen, Sparkles, BarChart3,
  Shield, Zap, MessageCircle, GraduationCap,
  Building2, Briefcase, Rocket, Play,
  ArrowUpRight, MapPin, Clock, BadgeCheck,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════════
   DESIGN PHILOSOPHY — Inspired by:
   • AMI: Warm, human, audience-segmented ("I want to..."), African faces,
     vibrant brand, practical language, partner logos as social proof
   • McKinsey: Serif headlines (Georgia as Bower substitute), generous white space,
     quiet confidence, deep navy + white, editorial feel, thought leadership

   Result: A page that feels like a premium African institution, not a SaaS product.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Scroll reveal ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.1 })
    o.observe(el)
    return () => o.disconnect()
  }, [])
  return { ref, v }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, v } = useReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ─── Audience cards ("I want to...") ─── */
const audiences = [
  { icon: Building2, label: 'Upskill my team & workforce', href: '#enterprise', color: 'bg-blue-50 text-blue-700' },
  { icon: Rocket, label: 'Train SMEs & Entrepreneurs', href: '#sme', color: 'bg-orange-50 text-orange-700' },
  { icon: Lightbulb, label: 'Grow my own business', href: '#grow', color: 'bg-emerald-50 text-emerald-700' },
  { icon: GraduationCap, label: 'Build professional skills', href: '#skills', color: 'bg-purple-50 text-purple-700' },
]

/* ─── Impact numbers ─── */
const stats = [
  { value: '90%', context: 'of African jobs are created by MSMEs', source: 'IFC, World Bank' },
  { value: '50M+', context: 'small businesses operate across the continent', source: 'AfDB Report' },
  { value: '3x', context: 'more likely to grow with structured training', source: 'ILO Study' },
  { value: '70%', context: 'of GDP in emerging markets driven by SMEs', source: 'OECD Data' },
]

/* ─── Offerings (AMI-inspired) ─── */
const offerings = [
  {
    id: 'enterprise',
    tag: 'For Enterprise & Teams',
    title: 'Workplace Learning That Drives Performance',
    text: 'Design custom training academies for your employees, managers, and leaders. From onboarding to leadership development, deliver structured programmes that build the capabilities your organisation needs to grow.',
    features: ['Custom branded academies', 'Cohort-based delivery', 'Impact analytics & reporting', 'Multi-language support'],
    accent: '#00567A',
  },
  {
    id: 'sme',
    tag: 'For SME & Entrepreneurship Programmes',
    title: 'Capability Building at Scale',
    text: 'Train thousands of small business owners across multiple countries with structured programmes that combine online learning, live sessions, mentoring, and peer-to-peer community. Issue verified certificates that build credibility.',
    features: ['Financial literacy programmes', 'Business growth academies', 'Certified completions', 'Peer learning communities'],
    accent: '#D97706',
  },
]

/* ─── Capabilities ─── */
const capabilities = [
  { icon: BookOpen, title: 'Structured Programmes', text: 'Multi-week learning journeys with modules, live sessions, assignments, and assessments.' },
  { icon: Users, title: 'Cohort-Based Delivery', text: 'Time-bound cohorts for accountability, peer learning, and facilitator-led engagement.' },
  { icon: Award, title: 'Verified Certificates', text: 'QR-verified, LinkedIn-shareable certificates that build participant credibility.' },
  { icon: BarChart3, title: 'Impact Analytics', text: 'Real-time dashboards: completion, engagement, at-risk participants, programme ROI.' },
  { icon: MessageCircle, title: 'Community & Discussion', text: 'Built-in forums, facilitator Q&A, and peer-to-peer learning within every programme.' },
  { icon: Zap, title: 'Smart Automation', text: 'Enrolment emails, session reminders, deadline nudges, certificates — all automated.' },
  { icon: Globe2, title: 'Multi-Language', text: 'English, French, Portuguese. Reach every corner of the continent.' },
  { icon: Sparkles, title: 'AI Course Builder', text: 'Describe a topic. Get a full course outline, quizzes, and assignments in seconds.' },
  { icon: Shield, title: 'White-Label Domains', text: 'Your brand, your domain. Participants see your academy, not ours.' },
]

/* ─── Testimonials ─── */
const testimonials = [
  {
    quote: 'We trained 340 SME owners across 6 West African countries in 4 months. The cohort model kept completion above 90% — something we never achieved with self-paced content.',
    author: 'Head of Enterprise Development',
    org: 'Pan-African Development Finance Institution',
  },
  {
    quote: 'For the first time, our entrepreneurs have a structured learning journey. The verified certificates give them real credibility when approaching lenders and investors.',
    author: 'Director of SME Programmes',
    org: 'Regional Chamber of Commerce, East Africa',
  },
  {
    quote: 'We replaced three separate tools. The academy lives inside our HR platform, so our L&D team manages employee training and partner programmes from one place.',
    author: 'Chief People Officer',
    org: 'Leading African Fintech',
  },
]

export default function AcademyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ═══ Nav — clean, minimal, McKinsey-inspired ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">/</span>
            </div>
            <span className="text-lg tracking-tight">
              <span className="font-semibold text-gray-900">tempo</span>
              {' '}
              <span className="font-medium text-orange-500">academy</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/academy/login" className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block">Sign In</Link>
            <Link href="/academy/login" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-full transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Editorial, warm, human ═══ */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF8F0] via-white to-white" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-16">
          <div className="max-w-3xl">
            <Reveal>
              <p className="text-orange-600 font-medium text-sm tracking-wide uppercase mb-5">
                Learning & Advisory for Small Business Transformation
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] leading-[1.08] font-bold tracking-tight text-gray-900 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Powering the growth of Africa&rsquo;s most ambitious businesses.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mb-10">
                Tempo Academy helps organisations design and deliver structured training and advisory programmes
                that equip small business owners, entrepreneurs, and teams with the capabilities they need to thrive.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-full transition shadow-md hover:shadow-lg flex items-center gap-2 justify-center text-[15px]">
                  Start Building Your Academy <ArrowRight size={17} />
                </Link>
                <Link href="/academy/diagnostic" className="text-gray-700 hover:text-orange-600 font-medium px-7 py-3.5 rounded-full border border-gray-200 hover:border-orange-200 transition flex items-center gap-2 justify-center text-[15px]">
                  Take the Readiness Assessment
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ "I want to..." — AMI-inspired audience segmentation ═══ */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="text-center text-gray-500 text-sm font-medium tracking-wide uppercase mb-6">I want to&hellip;</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {audiences.map((a, i) => (
              <Reveal key={i} delay={i * 75}>
                <a href={a.href} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-sm transition group cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                    <a.icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-orange-600 transition">{a.label}</span>
                  <ArrowUpRight size={14} className="text-gray-400 ml-auto group-hover:text-orange-500 transition" />
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ The MSME Opportunity — dark section with stats ═══ */}
      <section className="py-20 sm:py-24 bg-[#0F1B2D] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-3xl mb-14">
              <p className="text-orange-400 font-medium text-sm tracking-wide uppercase mb-4">The Opportunity</p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Small businesses are the engine of every economy. Most lack the support to reach their potential.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                MSMEs create the majority of jobs, drive innovation, and sustain communities. Yet access to
                structured training and advisory remains out of reach for millions of entrepreneurs across Africa
                and emerging markets.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-2">{s.value}</div>
                  <p className="text-white/90 text-sm leading-relaxed mb-2">{s.context}</p>
                  <p className="text-white/40 text-xs">{s.source}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Offerings — AMI "Explore" style, alternating layout ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">What We Enable</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Learning solutions for organisations that invest in people.
              </h2>
            </div>
          </Reveal>

          <div className="space-y-16">
            {offerings.map((o, i) => (
              <Reveal key={o.id} delay={i * 150}>
                <div id={o.id} className="grid lg:grid-cols-2 gap-10 items-center scroll-mt-24">
                  {/* Visual placeholder */}
                  <div className={`aspect-[4/3] rounded-2xl flex items-center justify-center ${i === 0 ? 'bg-gradient-to-br from-blue-50 to-teal-50 order-1' : 'bg-gradient-to-br from-orange-50 to-amber-50 lg:order-2'}`}>
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: o.accent + '15', color: o.accent }}>
                        {i === 0 ? <Building2 size={36} /> : <Rocket size={36} />}
                      </div>
                      <p className="text-lg font-semibold" style={{ color: o.accent }}>{o.tag}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={i === 0 ? 'order-2' : 'lg:order-1'}>
                    <p className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: o.accent }}>{o.tag}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {o.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{o.text}</p>
                    <ul className="space-y-2.5 mb-6">
                      {o.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <CheckCircle2 size={16} style={{ color: o.accent }} className="shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/academy/login" className="inline-flex items-center gap-2 font-medium text-sm hover:gap-3 transition-all" style={{ color: o.accent }}>
                      Learn more <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Capabilities grid ═══ */}
      <section className="py-20 sm:py-28 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Platform Capabilities</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Everything you need. Nothing you don&rsquo;t.
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                From programme design to certificate issuance, Tempo Academy handles the entire
                learning lifecycle so you can focus on impact.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((c, i) => (
              <Reveal key={i} delay={Math.min(i * 60, 400)}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition">
                    <c.icon size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-[15px]">{c.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works — three steps ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                From idea to live programme in days.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Design', text: 'Choose from ready-made templates or build from scratch. Use AI to generate course outlines and assessments in seconds.', icon: Lightbulb },
              { step: '02', title: 'Enrol', text: 'Send branded invitations. Participants join through a clean, mobile-friendly portal — no app downloads required.', icon: Users },
              { step: '03', title: 'Deliver & Measure', text: 'Participants learn through structured modules, live sessions, and peer discussion. You track everything and issue verified certificates.', icon: BarChart3 },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-5">
                    <s.icon size={24} />
                  </div>
                  <div className="text-xs font-bold text-orange-400 tracking-widest mb-2">STEP {s.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials — editorial style ═══ */}
      <section className="py-20 sm:py-28 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Impact Stories</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Trusted by organisations building
                <br className="hidden sm:block" />
                the future of African enterprise.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 flex flex-col h-full">
                  <Quote size={20} className="text-orange-300 mb-5" />
                  <p className="text-gray-700 leading-relaxed flex-1 mb-6 text-[15px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{t.org}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Why Tempo Academy ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Why Tempo Academy</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Not just a platform. A partner in building capable businesses.
              </h2>
            </div>
          </Reveal>

          <div className="space-y-4">
            {[
              ['Built for Africa, ready for the world', 'Designed from day one for African infrastructure — low bandwidth, mobile-first, offline-capable, multi-language. Powerful enough for any market.'],
              ['Embedded in your HR ecosystem', 'Unlike standalone tools that require separate logins and contracts, Tempo Academy lives inside the same platform where you manage your people. One system. Zero integration headaches.'],
              ['Cohort-first, not content-first', 'Learning happens in community. Our architecture is built around cohorts, peer learning, and facilitator-led experiences — not isolated, self-paced modules.'],
              ['From free to enterprise scale', 'Start with a free academy for 25 participants. Scale to thousands across countries as your impact grows. No upfront commitments.'],
              ['AI that saves time, not replaces people', 'Generate course outlines and assessments in seconds so your facilitators can focus on connecting with participants and driving real outcomes.'],
            ].map(([title, text], i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/20 transition">
                  <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px] mb-0.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-24 sm:py-32 bg-[#0F1B2D]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              The next generation of African entrepreneurs is waiting.
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Give them the structured learning, mentorship, and credentials
              they need to build businesses that create jobs and transform communities.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full transition shadow-lg hover:shadow-xl text-base flex items-center gap-2">
                Start Building Your Academy <ArrowRight size={18} />
              </Link>
              <Link href="/academy/login" className="text-gray-300 hover:text-white font-medium px-6 py-4 rounded-full border border-gray-600 hover:border-gray-400 transition text-base">
                Schedule a Demo
              </Link>
            </div>
            <p className="text-gray-500 text-sm">Free for up to 25 participants. No credit card required.</p>
          </Reveal>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-[#0A1220] text-gray-500 py-10 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">/</span>
            </div>
            <span className="text-sm text-gray-400">tempo academy</span>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Tempo. Building capable businesses across Africa and beyond.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="text-xs hover:text-gray-300 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
