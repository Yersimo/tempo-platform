'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Star, ChevronDown, Users, BarChart3, Award, BookOpen, Globe2, Zap, Shield, Sparkles, MessageCircle, Menu, X } from 'lucide-react'

/* ─── Nav dropdown component ─────────────────────────────────────────────── */
function NavDropdown({ label, items }: { label: string; items: { href: string; title: string; desc: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="text-[14px] font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition flex items-center gap-1">
        {label} <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[300px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.1)] border border-black/[0.04] p-2 z-50">
          {items.map((item, i) => (
            <Link key={i} href={item.href} onClick={() => setOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-[#F5F5F5] transition group">
              <p className="text-[14px] font-semibold text-[#1a1a1a] group-hover:text-[#E8590C] transition">{item.title}</p>
              <p className="text-[12px] text-[#1a1a1a]/40 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Reveal ─────────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold })
    o.observe(el); return () => o.disconnect()
  }, [threshold])
  return { ref, v }
}
function R({ children, d = 0, className = '' }: { children: React.ReactNode; d?: number; className?: string }) {
  const { ref, v } = useReveal()
  return <div ref={ref} className={`transition-all duration-[900ms] ease-out ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} style={{ transitionDelay: `${d}ms` }}>{children}</div>
}

/* ─── Animated counter ───────────────────────────────────────────────────── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, v } = useReveal()
  useEffect(() => {
    if (!v) return
    let start = 0; const duration = 1200; const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * end))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [v, end])
  return <span ref={ref}>{count}{suffix}</span>
}

/* ─── Shared nav ─────────────────────────────────────────────────────────── */
function AcademyNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-black/[0.03]">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[64px]">
          <Link href="/academy" className="flex items-center gap-2">
            <span className="text-[22px] font-bold tracking-[-0.02em] text-[#1a1a1a]">tempo<span className="text-[#E8590C]">.</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <NavDropdown label="Solutions" items={[
              { href: '#for-enterprise', title: 'For Enterprise & Teams', desc: 'Workplace learning that drives performance' },
              { href: '#for-smes', title: 'For SME Programmes', desc: 'Capability building at continental scale' },
              { href: '#capabilities', title: 'Platform Capabilities', desc: 'Courses, certificates, analytics & more' },
            ]} />
            <NavDropdown label="About" items={[
              { href: '#impact', title: 'Impact Stories', desc: 'How organisations use Tempo Academy' },
              { href: '/academy/diagnostic', title: 'Readiness Assessment', desc: 'See if your organisation is ready' },
            ]} />
            <Link href="/academy/login" className="text-[14px] font-medium text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition">Log in</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/academy/get-started" className="bg-[#1a1a1a] hover:bg-[#333] text-white text-[14px] font-medium px-5 py-2.5 rounded-full transition hidden sm:block">
              Get Started
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-10 h-10 flex items-center justify-center">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-[64px]">
          <div className="px-6 py-6 space-y-1">
            <p className="text-[11px] font-semibold text-[#1a1a1a]/30 uppercase tracking-wider px-4 mb-2">Solutions</p>
            {[
              { href: '#for-enterprise', label: 'For Enterprise & Teams' },
              { href: '#for-smes', label: 'For SME Programmes' },
              { href: '#capabilities', label: 'Platform Capabilities' },
            ].map((item, i) => (
              <Link key={i} href={item.href} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-[16px] font-medium text-[#1a1a1a] hover:bg-[#F5F5F5] rounded-xl transition">{item.label}</Link>
            ))}
            <div className="h-px bg-black/5 my-4" />
            <p className="text-[11px] font-semibold text-[#1a1a1a]/30 uppercase tracking-wider px-4 mb-2">About</p>
            {[
              { href: '#impact', label: 'Impact Stories' },
              { href: '/academy/diagnostic', label: 'Readiness Assessment' },
            ].map((item, i) => (
              <Link key={i} href={item.href} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-[16px] font-medium text-[#1a1a1a] hover:bg-[#F5F5F5] rounded-xl transition">{item.label}</Link>
            ))}
            <div className="h-px bg-black/5 my-4" />
            <Link href="/academy/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-[16px] font-medium text-[#1a1a1a]/60 rounded-xl">Log in</Link>
            <Link href="/academy/get-started" onClick={() => setMobileOpen(false)} className="block mt-3 bg-[#1a1a1a] text-white text-center text-[16px] font-medium py-3.5 rounded-full">Get Started</Link>
          </div>
        </div>
      )}
    </>
  )
}

export default function AcademyPage() {
  return (
    <div className="min-h-screen bg-white antialiased overflow-x-hidden">

      {/* ═══ Nav ═══ */}
      <AcademyNav />

      {/* ═══ HERO — Revolut-style: gradient bg, massive text, floating product mockup ═══ */}
      <section className="relative min-h-[100vh] flex items-center pt-16" style={{
        background: 'linear-gradient(165deg, #FFF7ED 0%, #FFEDD5 25%, #FED7AA 50%, #FDBA74 75%, #FB923C 100%)'
      }}>
        <div className="max-w-[1200px] mx-auto px-6 w-full grid lg:grid-cols-2 gap-8 items-center py-16 lg:py-0">
          {/* Left — text */}
          <div className="max-w-[560px]">
            <R>
              <h1 className="text-[48px] sm:text-[64px] lg:text-[76px] font-bold text-[#1a1a1a] leading-[0.95] tracking-[-0.03em] mb-6">
                Change the way you build businesses.
              </h1>
            </R>
            <R d={100}>
              <p className="text-[18px] sm:text-[20px] text-[#1a1a1a]/60 leading-[1.5] mb-8 max-w-[440px]">
                Training and advisory programmes that equip entrepreneurs with the tools to grow. Launch your academy for free, in minutes.
              </p>
            </R>
            <R d={200}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/academy/get-started" className="bg-[#1a1a1a] hover:bg-[#333] text-white text-[16px] font-medium px-7 py-3.5 rounded-full transition inline-flex items-center gap-2 justify-center">
                  Get started <ArrowRight size={18} />
                </Link>
                <Link href="/academy/diagnostic" className="text-[#1a1a1a] text-[16px] font-medium px-7 py-3.5 rounded-full border-2 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30 transition inline-flex items-center gap-2 justify-center">
                  Take the assessment
                </Link>
              </div>
            </R>
          </div>

          {/* Right — floating product mockup + person photo */}
          <R d={200} className="relative flex justify-center lg:justify-end">
            <div className="relative w-[340px] sm:w-[420px]">
              {/* Person photo behind */}
              <div className="rounded-[28px] overflow-hidden shadow-2xl">
                <img
                  src="/images/academy/sme-banners-cta.png"
                  alt="African entrepreneur with tablet in her bakery"
                  className="w-full aspect-[3/4] object-cover object-[0%_0%]"
                />
              </div>
              {/* Floating dashboard card */}
              <div className="absolute -bottom-6 -left-10 sm:-left-16 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-5 w-[240px] sm:w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-[#1a1a1a]/40 uppercase tracking-wider">Academy</span>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
                </div>
                <p className="text-[13px] font-semibold text-[#1a1a1a] mb-1">SME Growth Programme</p>
                <div className="text-[28px] font-bold text-[#1a1a1a] tracking-[-0.02em] mb-3">342 <span className="text-[14px] font-normal text-[#1a1a1a]/40">enrolled</span></div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#F5F5F5] rounded-lg p-2 text-center">
                    <div className="text-[16px] font-bold text-[#E8590C]">91%</div>
                    <div className="text-[10px] text-[#1a1a1a]/40">completion</div>
                  </div>
                  <div className="flex-1 bg-[#F5F5F5] rounded-lg p-2 text-center">
                    <div className="text-[16px] font-bold text-[#1a1a1a]">6</div>
                    <div className="text-[10px] text-[#1a1a1a]/40">countries</div>
                  </div>
                  <div className="flex-1 bg-[#F5F5F5] rounded-lg p-2 text-center">
                    <div className="text-[16px] font-bold text-emerald-600">4.8</div>
                    <div className="text-[10px] text-[#1a1a1a]/40">rating</div>
                  </div>
                </div>
              </div>
              {/* Floating certificate badge */}
              <div className="absolute -top-4 -right-4 sm:-right-8 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#E8590C]/10 flex items-center justify-center"><Award size={16} className="text-[#E8590C]" /></div>
                <div>
                  <p className="text-[11px] font-semibold text-[#1a1a1a]">Certificate Issued</p>
                  <p className="text-[10px] text-[#1a1a1a]/40">Amina K. — Financial Literacy</p>
                </div>
              </div>
            </div>
          </R>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-[#1a1a1a]/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/30" />
          </div>
        </div>
      </section>

      {/* ═══ Social proof bar ═══ */}
      <section className="py-8 bg-white border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap justify-center items-center gap-x-10 gap-y-3 text-[13px] text-[#1a1a1a]/30 font-medium">
          <span>Trusted by leading institutions across</span>
          <span className="text-[#1a1a1a] font-bold">39+ countries</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="text-[#1a1a1a] font-bold">100,000+</span>
          <span>entrepreneurs trained</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="text-[#1a1a1a] font-bold">90%+</span>
          <span>completion rate</span>
        </div>
      </section>

      {/* ═══ Stats — massive, Revolut-bold ═══ */}
      <section className="py-24 sm:py-32 bg-[#1a1a1a] text-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <R>
            <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.05] tracking-[-0.03em] max-w-[700px] mb-20">
              Small businesses are the backbone of every economy.
            </h2>
          </R>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { end: 90, suffix: '%', label: 'of African jobs', sub: 'created by MSMEs', source: 'IFC' },
              { end: 50, suffix: 'M+', label: 'small businesses', sub: 'across the continent', source: 'AfDB' },
              { end: 3, suffix: 'x', label: 'more likely to grow', sub: 'with structured training', source: 'ILO' },
              { end: 70, suffix: '%', label: 'of GDP growth', sub: 'driven by SMEs globally', source: 'OECD' },
            ].map((s, i) => (
              <R key={i} d={i * 80}>
                <div>
                  <div className="text-[56px] sm:text-[72px] font-bold tracking-[-0.04em] leading-none text-[#E8590C] mb-2">
                    <Counter end={s.end} suffix={s.suffix} />
                  </div>
                  <p className="text-[16px] text-white/80 font-medium mb-1">{s.label}</p>
                  <p className="text-[13px] text-white/30">{s.sub}</p>
                  <p className="text-[10px] text-white/15 mt-2 uppercase tracking-widest">{s.source}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ For Enterprise — photo left, text right ═══ */}
      <section id="for-enterprise" className="py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <R>
              <div className="rounded-[28px] overflow-hidden">
                <img src="/images/academy/sme-classroom-bakery.png" alt="Professional training workshops" className="w-full aspect-[4/3] object-cover object-top" />
              </div>
            </R>
            <R d={100}>
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-[12px] font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                  For Enterprise & Teams
                </div>
                <h2 className="text-[32px] sm:text-[44px] font-bold text-[#1a1a1a] leading-[1.05] tracking-[-0.02em] mb-5">
                  Workplace learning that actually works.
                </h2>
                <p className="text-[17px] text-[#1a1a1a]/50 leading-[1.6] mb-8">
                  Design custom training academies for your people. From onboarding to leadership — structured programmes that build capabilities your organisation needs to compete.
                </p>
                <div className="space-y-3 mb-8">
                  {['Custom branded academies', 'Cohort-based delivery', 'Real-time impact analytics', 'Multi-language support'].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-[15px] text-[#1a1a1a]/70">
                      <CheckCircle2 size={18} className="text-blue-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Link href="/academy/get-started" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1a1a1a] hover:gap-3 transition-all">
                  Learn more <ArrowRight size={16} />
                </Link>
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ═══ For SMEs — text left, photo right ═══ */}
      <section id="for-smes" className="py-24 sm:py-32 bg-[#FAFAFA]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <R>
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-50 text-[#E8590C] text-[12px] font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                  For SME & Entrepreneurship Programmes
                </div>
                <h2 className="text-[32px] sm:text-[44px] font-bold text-[#1a1a1a] leading-[1.05] tracking-[-0.02em] mb-5">
                  Capability building at continental scale.
                </h2>
                <p className="text-[17px] text-[#1a1a1a]/50 leading-[1.6] mb-8">
                  Train thousands of small business owners across countries. Combine online learning, live sessions, mentoring, and community. Issue verified certificates that build real credibility with lenders and investors.
                </p>
                <div className="space-y-3 mb-8">
                  {['Financial literacy & business growth', 'Verified certificates with QR codes', 'Peer learning communities', 'Offline-ready, mobile-first'].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 text-[15px] text-[#1a1a1a]/70">
                      <CheckCircle2 size={18} className="text-[#E8590C] shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <Link href="/academy/get-started" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1a1a1a] hover:gap-3 transition-all">
                  Learn more <ArrowRight size={16} />
                </Link>
              </div>
            </R>
            <R d={100}>
              <div className="rounded-[28px] overflow-hidden">
                <img src="/images/academy/sme-empowerment.png" alt="Entrepreneurs across tech, farming, markets" className="w-full aspect-[4/3] object-cover" />
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ═══ Full-bleed photo break ═══ */}
      <R>
        <img src="/images/academy/sme-real-businesses.png" alt="Empowering businesses across Africa" className="w-full h-[300px] sm:h-[420px] lg:h-[500px] object-cover" />
      </R>

      {/* ═══ Capabilities — Revolut card grid ═══ */}
      <section id="capabilities" className="py-24 sm:py-32 bg-[#1a1a1a] text-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <R>
            <div className="max-w-[600px] mb-16">
              <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.05] tracking-[-0.03em] mb-5">
                One platform. Everything you need.
              </h2>
              <p className="text-[17px] text-white/40 leading-[1.6]">
                From programme design to certificate issuance — the entire learning lifecycle.
              </p>
            </div>
          </R>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: 'Structured Programmes', text: 'Multi-week learning journeys with modules, live sessions, and assessments.' },
              { icon: Users, title: 'Cohort-Based Delivery', text: 'Time-bound cohorts for accountability, peer learning, and community.' },
              { icon: Award, title: 'Verified Certificates', text: 'QR-verified, LinkedIn-shareable credentials that carry real weight.' },
              { icon: BarChart3, title: 'Impact Analytics', text: 'Real-time dashboards: completion, engagement, at-risk participants.' },
              { icon: MessageCircle, title: 'Community & Forums', text: 'Peer discussions, facilitator Q&A, accountability spaces.' },
              { icon: Zap, title: 'Smart Automation', text: 'Enrolment, reminders, nudges, certificates — all automated.' },
              { icon: Globe2, title: 'Multi-Language', text: 'English, French, Portuguese — every corner of the continent.' },
              { icon: Sparkles, title: 'AI Course Builder', text: 'Describe a topic. Get outlines, quizzes, and assignments in seconds.' },
              { icon: Shield, title: 'White-Label Domains', text: 'Your brand, your domain. Participants see your academy, not ours.' },
            ].map((c, i) => (
              <R key={i} d={Math.min(i * 40, 280)}>
                <div className="bg-white/[0.05] hover:bg-white/[0.08] rounded-2xl p-7 h-full transition-colors duration-300 border border-white/[0.06]">
                  <c.icon size={22} className="text-[#E8590C] mb-4" />
                  <h3 className="text-[16px] font-semibold text-white mb-2">{c.title}</h3>
                  <p className="text-[14px] text-white/35 leading-[1.6]">{c.text}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works — 3 bold steps ═══ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <R>
            <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold text-center leading-[1.05] tracking-[-0.03em] mb-20">
              Live in days, not months.
            </h2>
          </R>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { n: '01', title: 'Design', text: 'Pick a template or build from scratch. AI generates outlines and assessments in seconds.', color: 'text-[#E8590C]' },
              { n: '02', title: 'Enrol', text: 'Send branded invitations. Participants join a clean, mobile-friendly portal. No app needed.', color: 'text-[#E8590C]' },
              { n: '03', title: 'Measure', text: 'Track progress in real-time. Issue certificates. See the impact on real business outcomes.', color: 'text-[#E8590C]' },
            ].map((s, i) => (
              <R key={i} d={i * 120}>
                <div>
                  <div className={`text-[80px] font-bold tracking-[-0.04em] leading-none ${s.color} opacity-20 mb-4`}>{s.n}</div>
                  <h3 className="text-[24px] font-bold text-[#1a1a1a] mb-3 tracking-[-0.01em]">{s.title}</h3>
                  <p className="text-[15px] text-[#1a1a1a]/45 leading-[1.6]">{s.text}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section id="impact" className="py-24 sm:py-32 bg-[#FAFAFA]">
        <div className="max-w-[1200px] mx-auto px-6">
          <R>
            <h2 className="text-[32px] sm:text-[44px] font-bold text-center leading-[1.05] tracking-[-0.02em] mb-16">
              Trusted across the continent.
            </h2>
          </R>
          <div className="grid lg:grid-cols-3 gap-5">
            {[
              { q: 'We trained 340 SME owners across 6 countries in 4 months. Completion stayed above 90%.', a: 'Head of Enterprise Development', o: 'Pan-African DFI' },
              { q: 'Our entrepreneurs finally have a structured path. The verified certificates give them credibility with lenders.', a: 'Director of SME Programmes', o: 'Regional Chamber of Commerce' },
              { q: 'We replaced three tools with one. The academy lives inside our HR platform — one place for everything.', a: 'Chief People Officer', o: 'Leading African Fintech' },
            ].map((t, i) => (
              <R key={i} d={i * 80}>
                <div className="bg-white rounded-2xl p-8 h-full flex flex-col border border-black/[0.04]">
                  <div className="flex gap-0.5 mb-5">{[1,2,3,4,5].map(j => <Star key={j} size={14} className="fill-[#E8590C] text-[#E8590C]" />)}</div>
                  <p className="text-[17px] text-[#1a1a1a]/80 leading-[1.55] flex-1 mb-6">&ldquo;{t.q}&rdquo;</p>
                  <div className="border-t border-black/[0.04] pt-4">
                    <p className="text-[14px] font-semibold text-[#1a1a1a]">{t.a}</p>
                    <p className="text-[12px] text-[#1a1a1a]/30 mt-0.5">{t.o}</p>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Why Tempo — image + text ═══ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <R>
              <div className="rounded-[28px] overflow-hidden">
                <img src="/images/academy/sme-empowerment.png" alt="Entrepreneurs thriving" className="w-full aspect-square object-cover" />
              </div>
            </R>
            <R d={100}>
              <div>
                <h2 className="text-[32px] sm:text-[40px] font-bold text-[#1a1a1a] leading-[1.05] tracking-[-0.02em] mb-8">
                  Not just a platform. A partner in building capable businesses.
                </h2>
                <div className="space-y-6">
                  {[
                    ['Built for Africa, ready for the world', 'Mobile-first, low-bandwidth, offline-capable, multi-language.'],
                    ['Embedded in your HR ecosystem', 'One system for people management and learning. No integrations to manage.'],
                    ['Cohort-first, not content-first', 'Real learning happens in community. Built for peer accountability.'],
                    ['From free to enterprise scale', 'Start with 25 participants free. Scale to thousands.'],
                  ].map(([title, text], i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#E8590C]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={16} className="text-[#E8590C]" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-[#1a1a1a] mb-0.5">{title}</h4>
                        <p className="text-[14px] text-[#1a1a1a]/40 leading-[1.5]">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </R>
          </div>
        </div>
      </section>

      {/* ═══ Final CTA — Revolut gradient style ═══ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" style={{
        background: 'linear-gradient(165deg, #FFF7ED 0%, #FFEDD5 30%, #FED7AA 60%, #FDBA74 100%)'
      }}>
        <div className="max-w-[680px] mx-auto px-6 text-center relative z-10">
          <R>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold text-[#1a1a1a] leading-[1.05] tracking-[-0.03em] mb-6">
              The next generation of entrepreneurs is waiting.
            </h2>
            <p className="text-[17px] text-[#1a1a1a]/50 leading-[1.5] mb-10 max-w-[480px] mx-auto">
              Give them the learning, mentorship, and credentials they need to build businesses that transform communities.
            </p>
          </R>
          <R d={100}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
              <Link href="/academy/get-started" className="bg-[#1a1a1a] hover:bg-[#333] text-white text-[16px] font-medium px-8 py-4 rounded-full transition inline-flex items-center gap-2 justify-center">
                Get started — it&rsquo;s free <ArrowRight size={18} />
              </Link>
              <Link href="/academy/get-started" className="text-[#1a1a1a] text-[16px] font-medium px-8 py-4 rounded-full border-2 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30 transition">
                Schedule a demo
              </Link>
            </div>
            <p className="text-[13px] text-[#1a1a1a]/30">Free for up to 25 participants. No credit card required.</p>
          </R>
        </div>
      </section>

      {/* ═══ Footer — minimal ═══ */}
      <footer className="bg-[#1a1a1a] py-8">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/20">
          <span className="text-[16px] font-bold text-white/40">tempo<span className="text-[#E8590C]">.</span></span>
          <p>&copy; {new Date().getFullYear()} Tempo. Building capable businesses across Africa and beyond.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/50 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white/50 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
