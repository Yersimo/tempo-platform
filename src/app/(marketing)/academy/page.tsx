'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, CheckCircle2, Quote,
  Users, Target, Heart, Lightbulb, Star,
  Globe2, Award, BookOpen, Sparkles, BarChart3,
  Shield, Zap, MessageCircle, GraduationCap,
  Building2, Briefcase, Rocket, ArrowUpRight,
  Play, MapPin,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════════════
   TEMPO ACADEMY LANDING PAGE
   Design: AMI warmth (photos, people, segmentation) + McKinsey gravitas (serif, space)
   Photos: Unsplash (free, no attribution required for commercial use)
   SVGs: Custom inline illustrations
   ═══════════════════════════════════════════════════════════════════════════════ */

// ─── Unsplash photo URLs (optimized sizes) ─────────────────────────────────
const PHOTOS = {
  // Hero: African woman entrepreneur smiling, warm light
  hero: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80&auto=format',
  // Team training / workshop
  training: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&q=80&auto=format',
  // Woman on laptop / digital learning
  digital: 'https://images.unsplash.com/photo-1616587226157-48e49175ee20?w=800&q=80&auto=format',
  // African market / small business
  market: 'https://images.unsplash.com/photo-1604933762023-7213af7ff7e7?w=800&q=80&auto=format',
  // Business meeting / collaboration
  meeting: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80&auto=format',
  // Certificate / graduation
  certificate: 'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800&q=80&auto=format',
  // Woman with phone / mobile
  mobile: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80&auto=format',
}

// ─── Scroll reveal ──────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold: 0.08 })
    o.observe(el)
    return () => o.disconnect()
  }, [])
  return { ref, v }
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, v } = useReveal()
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ─── Custom SVG Illustrations ───────────────────────────────────────────────
function GrowthIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Growing plant from book */}
      <rect x="50" y="110" width="100" height="20" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"/>
      <rect x="55" y="100" width="90" height="15" rx="3" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1"/>
      <line x1="100" y1="100" x2="100" y2="50" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="100" cy="45" r="8" fill="#D1FAE5" stroke="#059669" strokeWidth="1.5"/>
      <path d="M85 70 Q90 55 100 60" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="83" cy="72" r="5" fill="#D1FAE5" stroke="#059669" strokeWidth="1"/>
      <path d="M115 65 Q110 50 100 55" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="117" cy="67" r="6" fill="#ECFDF5" stroke="#059669" strokeWidth="1"/>
      {/* Stars */}
      <circle cx="70" cy="35" r="2" fill="#F59E0B" opacity="0.6"/>
      <circle cx="135" cy="30" r="2.5" fill="#F59E0B" opacity="0.5"/>
      <circle cx="150" cy="55" r="1.5" fill="#FB923C" opacity="0.4"/>
    </svg>
  )
}

function CommunityIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Three people connected */}
      <circle cx="100" cy="55" r="18" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
      <circle cx="100" cy="48" r="7" fill="#93C5FD"/>
      <path d="M88 62 Q100 72 112 62" stroke="#3B82F6" strokeWidth="1.5" fill="none"/>
      <circle cx="55" cy="90" r="14" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"/>
      <circle cx="55" cy="84" r="5.5" fill="#FCD34D"/>
      <circle cx="145" cy="90" r="14" fill="#FCE7F3" stroke="#EC4899" strokeWidth="1.5"/>
      <circle cx="145" cy="84" r="5.5" fill="#F9A8D4"/>
      {/* Connection lines */}
      <line x1="82" y1="65" x2="65" y2="80" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="118" y1="65" x2="135" y2="80" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="69" y1="92" x2="131" y2="92" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 3"/>
      {/* Sparkles */}
      <path d="M100 28 L102 32 L106 34 L102 36 L100 40 L98 36 L94 34 L98 32 Z" fill="#F59E0B" opacity="0.6"/>
    </svg>
  )
}

function CertificateIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Certificate */}
      <rect x="40" y="25" width="120" height="90" rx="6" fill="#FFF7ED" stroke="#FB923C" strokeWidth="1.5"/>
      <rect x="50" y="35" width="100" height="6" rx="3" fill="#FDBA74" opacity="0.4"/>
      <rect x="65" y="48" width="70" height="4" rx="2" fill="#94A3B8" opacity="0.3"/>
      <rect x="75" y="58" width="50" height="4" rx="2" fill="#94A3B8" opacity="0.2"/>
      {/* Seal */}
      <circle cx="100" cy="85" r="14" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
      <path d="M94 85 L98 89 L106 81" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Ribbon */}
      <path d="M92 99 L88 120 L100 112 L112 120 L108 99" fill="#FB923C" opacity="0.3"/>
      {/* QR code suggestion */}
      <rect x="130" y="90" width="20" height="20" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1"/>
      <rect x="133" y="93" width="5" height="5" fill="#64748B"/>
      <rect x="142" y="93" width="5" height="5" fill="#64748B"/>
      <rect x="133" y="102" width="5" height="5" fill="#64748B"/>
      <rect x="140" y="100" width="3" height="3" fill="#64748B"/>
    </svg>
  )
}

function AnalyticsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-auto">
      {/* Chart */}
      <line x1="40" y1="130" x2="170" y2="130" stroke="#CBD5E1" strokeWidth="1"/>
      <line x1="40" y1="130" x2="40" y2="30" stroke="#CBD5E1" strokeWidth="1"/>
      {/* Bars */}
      <rect x="55" y="90" width="18" height="40" rx="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <rect x="82" y="70" width="18" height="60" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1"/>
      <rect x="109" y="50" width="18" height="80" rx="3" fill="#D1FAE5" stroke="#059669" strokeWidth="1"/>
      <rect x="136" y="35" width="18" height="95" rx="3" fill="#FB923C" opacity="0.8"/>
      {/* Trend line */}
      <path d="M64 85 L91 65 L118 45 L145 30" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="64" cy="85" r="3" fill="#F97316"/>
      <circle cx="91" cy="65" r="3" fill="#F97316"/>
      <circle cx="118" cy="45" r="3" fill="#F97316"/>
      <circle cx="145" cy="30" r="3" fill="#F97316"/>
    </svg>
  )
}

// ─── Data ───────────────────────────────────────────────────────────────────
const audiences = [
  { icon: Building2, label: 'Upskill my team & workforce', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { icon: Rocket, label: 'Train SMEs & Entrepreneurs', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { icon: Lightbulb, label: 'Grow my own business', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { icon: GraduationCap, label: 'Build professional skills', color: 'bg-purple-50 text-purple-700 border-purple-100' },
]

const stats = [
  { value: '90%', label: 'of African jobs', sub: 'created by MSMEs', source: 'IFC' },
  { value: '50M+', label: 'small businesses', sub: 'across the continent', source: 'AfDB' },
  { value: '3x', label: 'more likely to grow', sub: 'with structured training', source: 'ILO' },
  { value: '70%', label: 'of GDP growth', sub: 'driven by SMEs globally', source: 'OECD' },
]

const capabilities = [
  { icon: BookOpen, title: 'Structured Programmes', text: 'Multi-week learning journeys with modules, live sessions, and assessments.' },
  { icon: Users, title: 'Cohort-Based Delivery', text: 'Time-bound cohorts for accountability, peer learning, and community.' },
  { icon: Award, title: 'Verified Certificates', text: 'QR-verified, LinkedIn-shareable credentials that build real credibility.' },
  { icon: BarChart3, title: 'Impact Analytics', text: 'Real-time dashboards: completion rates, engagement, at-risk participants.' },
  { icon: MessageCircle, title: 'Community & Forums', text: 'Peer discussions, facilitator Q&A, and cohort accountability spaces.' },
  { icon: Zap, title: 'Smart Automation', text: 'Enrolment, reminders, nudges, and certificate delivery — all automated.' },
  { icon: Globe2, title: 'Multi-Language', text: 'English, French, Portuguese — reach every corner of the continent.' },
  { icon: Sparkles, title: 'AI Course Builder', text: 'Describe a topic, get a course outline, quizzes, and assignments in seconds.' },
  { icon: Shield, title: 'White-Label Domains', text: 'Your brand, your domain. Participants see your academy, not ours.' },
]

const testimonials = [
  {
    quote: 'We trained 340 SME owners across 6 West African countries in 4 months. The cohort model kept completion above 90%.',
    author: 'Head of Enterprise Development',
    org: 'Pan-African Development Finance Institution',
  },
  {
    quote: 'For the first time, our entrepreneurs have a structured path. The verified certificates give them credibility with lenders.',
    author: 'Director of SME Programmes',
    org: 'Regional Chamber of Commerce',
  },
  {
    quote: 'We replaced three tools with one. The academy lives inside our HR platform — our team manages everything from one place.',
    author: 'Chief People Officer',
    org: 'Leading African Fintech',
  },
]

export default function AcademyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ═══ Nav ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">/</span>
            </div>
            <span className="text-lg tracking-tight">
              <span className="font-semibold text-gray-900">tempo</span>
              {' '}<span className="font-medium text-orange-500">academy</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/academy/login" className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block">Sign In</Link>
            <Link href="/academy/login" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-full transition">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Split layout with real photo ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF1E6]">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <Reveal>
                <p className="text-orange-600 font-semibold text-sm tracking-wide uppercase mb-5">
                  Learning & Advisory for Small Business Transformation
                </p>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="text-[2.5rem] sm:text-[3.25rem] leading-[1.08] font-bold tracking-tight text-gray-900 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Powering the growth of Africa&rsquo;s most ambitious businesses.
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Design and deliver structured training and advisory programmes
                  that equip entrepreneurs, SME owners, and teams with the capabilities they need to thrive.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-full transition shadow-md hover:shadow-lg flex items-center gap-2 justify-center">
                    Start Building Your Academy <ArrowRight size={17} />
                  </Link>
                  <Link href="/academy/diagnostic" className="text-gray-700 hover:text-orange-600 font-medium px-7 py-3.5 rounded-full border border-gray-200 hover:border-orange-200 transition flex items-center gap-2 justify-center">
                    Take the Assessment
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Right: Photo collage */}
            <Reveal delay={200} className="hidden lg:block">
              <div className="relative">
                {/* Main photo */}
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img src={PHOTOS.hero} alt="African entrepreneur" className="w-full h-[400px] object-cover object-top" loading="eager" />
                </div>
                {/* Floating card: stats */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <BarChart3 size={18} className="text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Programme completion</div>
                      <div className="text-lg font-bold text-gray-900">92%</div>
                    </div>
                  </div>
                </div>
                {/* Floating card: participants */}
                <div className="absolute -top-3 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">AO</div>
                      <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">FK</div>
                      <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">CM</div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">340+</span> enrolled
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ "I want to..." segmentation ═══ */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-400 text-sm font-medium tracking-widest uppercase mb-5">I want to&hellip;</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {audiences.map((a, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className={`flex items-center gap-3 p-4 rounded-xl bg-white border hover:shadow-sm transition cursor-pointer group ${a.color}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-current/10">
                    <a.icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-orange-600 transition flex-1">{a.label}</span>
                  <ArrowUpRight size={14} className="text-gray-300 group-hover:text-orange-500 transition" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Impact Stats ═══ */}
      <section className="py-20 sm:py-24 bg-[#0F1B2D] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div>
                <p className="text-orange-400 font-semibold text-sm tracking-wide uppercase mb-4">The Opportunity</p>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Small businesses are the engine of every economy. Most lack access to the support they need.
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  MSMEs create the majority of jobs, drive innovation, and sustain communities. Yet structured
                  training and advisory remains out of reach for millions of entrepreneurs.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                    <div className="text-3xl font-bold text-orange-400 mb-1">{s.value}</div>
                    <div className="text-white/90 text-sm font-medium">{s.label}</div>
                    <div className="text-white/50 text-xs">{s.sub}</div>
                    <div className="text-white/30 text-[10px] mt-2 uppercase tracking-wider">{s.source}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Offerings — alternating photo + text ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">What We Enable</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Learning solutions for organisations<br className="hidden sm:block" /> that invest in people.
              </h2>
            </div>
          </Reveal>

          {/* Offering 1: Enterprise */}
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-10 items-center mb-20">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={PHOTOS.meeting} alt="Business training workshop" className="w-full h-[340px] object-cover" loading="lazy" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-3">For Enterprise & Teams</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Workplace learning that drives performance.
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Design custom training academies for your employees, managers, and leaders. From onboarding to leadership development, deliver structured programmes that build the capabilities your organisation needs.
                </p>
                <ul className="space-y-2.5 mb-6">
                  {['Custom branded academies', 'Cohort-based delivery', 'Impact analytics & reporting', 'Multi-language support'].map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/academy/login" className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm hover:gap-3 transition-all">
                  Learn more <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Offering 2: SME */}
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="lg:order-2 rounded-2xl overflow-hidden shadow-lg">
                <img src={PHOTOS.market} alt="African small business owner" className="w-full h-[340px] object-cover" loading="lazy" />
              </div>
              <div className="lg:order-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-orange-600 mb-3">For SME & Entrepreneurship Programmes</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Capability building at continental scale.
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Train thousands of small business owners across countries with programmes that combine online learning, live sessions, mentoring, and peer community. Issue verified certificates that build credibility with lenders and investors.
                </p>
                <ul className="space-y-2.5 mb-6">
                  {['Financial literacy programmes', 'Business growth academies', 'Verified certificates with QR codes', 'Peer learning communities'].map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/academy/login" className="inline-flex items-center gap-2 text-orange-600 font-medium text-sm hover:gap-3 transition-all">
                  Learn more <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Capabilities — with SVG illustrations ═══ */}
      <section className="py-20 sm:py-28 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-14 items-center mb-14">
              <div>
                <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">Platform Capabilities</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Everything you need.<br />Nothing you don&rsquo;t.
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  From programme design to certificate issuance, Tempo Academy handles the entire learning lifecycle.
                </p>
              </div>
              {/* SVG illustration grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100"><GrowthIllustration /></div>
                <div className="bg-white rounded-xl p-4 border border-gray-100"><CommunityIllustration /></div>
                <div className="bg-white rounded-xl p-4 border border-gray-100"><CertificateIllustration /></div>
                <div className="bg-white rounded-xl p-4 border border-gray-100"><AnalyticsIllustration /></div>
              </div>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((c, i) => (
              <Reveal key={i} delay={Math.min(i * 50, 350)}>
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

      {/* ═══ How It Works ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                From idea to live programme in days.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Design', text: 'Choose from templates or build from scratch. Use AI to generate course outlines and assessments.', img: PHOTOS.digital },
              { step: '02', title: 'Enrol', text: 'Send branded invitations. Participants join through a clean, mobile-friendly portal.', img: PHOTOS.mobile },
              { step: '03', title: 'Deliver & Measure', text: 'Track progress in real-time. Issue verified certificates. Measure real business impact.', img: PHOTOS.certificate },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="group">
                  <div className="rounded-xl overflow-hidden mb-5 shadow-sm group-hover:shadow-md transition">
                    <img src={s.img} alt={s.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                  </div>
                  <div className="text-xs font-bold text-orange-400 tracking-widest mb-2">STEP {s.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-20 sm:py-28 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">Impact Stories</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Trusted by organisations building<br className="hidden sm:block" /> the future of African enterprise.
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4">
                    {[1,2,3,4,5].map(j => <Star key={j} size={14} className="fill-orange-400 text-orange-400" />)}
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
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

      {/* ═══ Why Tempo — with photo ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={PHOTOS.training} alt="Training workshop in progress" className="w-full h-[400px] object-cover" loading="lazy" />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">Why Tempo Academy</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Not just a platform.<br />A partner in building capable businesses.
                </h2>
                <div className="space-y-4">
                  {[
                    ['Built for Africa, ready for the world', 'Low bandwidth, mobile-first, offline-capable, multi-language. Powerful enough for any market.'],
                    ['Embedded in your HR ecosystem', 'One system for people management and learning. Zero integration headaches.'],
                    ['Cohort-first, not content-first', 'Learning happens in community. Built around peer learning and facilitator-led experiences.'],
                    ['From free to enterprise scale', 'Start with 25 participants for free. Scale to thousands as your impact grows.'],
                  ].map(([title, text], i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 size={18} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src={PHOTOS.training} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gray-900/85" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              The next generation of African entrepreneurs is waiting.
            </h2>
            <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Give them the structured learning, mentorship, and credentials they need to build businesses that create jobs and transform communities.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full transition shadow-lg hover:shadow-xl text-base flex items-center gap-2">
                Start Building Your Academy <ArrowRight size={18} />
              </Link>
              <Link href="/academy/login" className="text-white/90 hover:text-white font-medium px-6 py-4 rounded-full border border-white/30 hover:border-white/60 transition text-base">
                Schedule a Demo
              </Link>
            </div>
            <p className="text-gray-400 text-sm">Free for up to 25 participants. No credit card required.</p>
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
