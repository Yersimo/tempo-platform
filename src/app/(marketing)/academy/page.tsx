'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, CheckCircle2, Star, Quote,
  Users, Target, Heart, Lightbulb,
  Globe2, Award, BookOpen, Sparkles, BarChart3,
  Shield, Zap, MessageCircle, GraduationCap,
  Building2, Rocket, ArrowUpRight, Play,
} from 'lucide-react'

/* ─── Scroll reveal ──────────────────────────────────────────────────────── */
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
  return <div ref={ref} className={`transition-all duration-700 ease-out ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}

/* ─── Data ─────────────────────────────────────────────────────────────── */
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
  { quote: 'We trained 340 SME owners across 6 West African countries in 4 months. The cohort model kept completion above 90%.', author: 'Head of Enterprise Development', org: 'Pan-African Development Finance Institution' },
  { quote: 'For the first time, our entrepreneurs have a structured path. The verified certificates give them credibility with lenders.', author: 'Director of SME Programmes', org: 'Regional Chamber of Commerce' },
  { quote: 'We replaced three tools with one. The academy lives inside our HR platform — our team manages everything from one place.', author: 'Chief People Officer', org: 'Leading African Fintech' },
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
            <span className="text-lg tracking-tight"><span className="font-semibold text-gray-900">tempo</span> <span className="font-medium text-orange-500">academy</span></span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/academy/login" className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block">Sign In</Link>
            <Link href="/academy/login" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-full transition">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Full-width photo grid with overlay text ═══ */}
      <section className="relative">
        {/* Photo grid background */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          <div className="aspect-[4/3] relative overflow-hidden">
            <img src="/images/academy/sme-empowerment.png" alt="African entrepreneurs" className="w-full h-full object-cover object-[0%_0%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
          </div>
          <div className="aspect-[4/3] relative overflow-hidden">
            <img src="/images/academy/sme-empowerment.png" alt="Farmer with tablet" className="w-full h-full object-cover object-[100%_0%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
          </div>
          <div className="aspect-[4/3] relative overflow-hidden hidden lg:block">
            <img src="/images/academy/sme-empowerment.png" alt="Market vendors" className="w-full h-full object-cover object-[0%_100%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
          </div>
          <div className="aspect-[4/3] relative overflow-hidden hidden lg:block">
            <img src="/images/academy/sme-empowerment.png" alt="Business handshake" className="w-full h-full object-cover object-[100%_100%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
          </div>
        </div>

        {/* Overlay content */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Reveal>
              <p className="text-orange-400 font-semibold text-sm tracking-widest uppercase mb-4">
                Learning & Advisory for Small Business Transformation
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Powering the growth of Africa&rsquo;s most ambitious businesses.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                Structured training and advisory programmes that equip entrepreneurs, SME owners, and teams with the capabilities they need to thrive.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full transition shadow-lg hover:shadow-xl flex items-center gap-2 justify-center">
                  Start Building Your Academy <ArrowRight size={18} />
                </Link>
                <Link href="/academy/diagnostic" className="text-white font-medium px-8 py-4 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/10 transition flex items-center gap-2 justify-center">
                  Take the Assessment <ChevronRight size={16} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ "I want to..." ═══ */}
      <section className="py-10 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-400 text-sm font-medium tracking-widest uppercase mb-5">I want to&hellip;</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {audiences.map((a, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className={`flex items-center gap-3 p-4 rounded-xl bg-white border hover:shadow-sm transition cursor-pointer group ${a.color}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-current/10"><a.icon size={18} /></div>
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
                  Small businesses are the engine of every economy. Most lack the support to reach their potential.
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  MSMEs create the majority of jobs, drive innovation, and sustain communities across Africa and emerging markets.
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

      {/* ═══ Offerings with real photos ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">What We Enable</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Learning solutions for organisations that invest in people.
              </h2>
            </div>
          </Reveal>

          {/* Enterprise */}
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-10 items-center mb-20">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/images/academy/sme-classroom-bakery.png" alt="Professional training and business growth" className="w-full h-[380px] object-cover object-top" />
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
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> {f}</li>
                  ))}
                </ul>
                <Link href="/academy/login" className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm hover:gap-3 transition-all">Learn more <ArrowRight size={15} /></Link>
              </div>
            </div>
          </Reveal>

          {/* SME */}
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="lg:order-2 rounded-2xl overflow-hidden shadow-xl">
                <img src="/images/academy/sme-banners-cta.png" alt="Small business owners learning and growing" className="w-full h-[380px] object-cover" />
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
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700"><CheckCircle2 size={16} className="text-orange-500 shrink-0" /> {f}</li>
                  ))}
                </ul>
                <Link href="/academy/login" className="inline-flex items-center gap-2 text-orange-600 font-medium text-sm hover:gap-3 transition-all">Learn more <ArrowRight size={15} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Capabilities ═══ */}
      <section className="py-20 sm:py-28 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="max-w-2xl mb-14">
              <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">Platform Capabilities</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Everything you need. Nothing you don&rsquo;t.
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">From programme design to certificate issuance, Tempo Academy handles the entire learning lifecycle.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((c, i) => (
              <Reveal key={i} delay={Math.min(i * 50, 350)}>
                <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition"><c.icon size={20} /></div>
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-[15px]">{c.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works — photo cards ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>From idea to live programme in days.</h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Design Your Programme', text: 'Choose from ready-made templates or build from scratch. Use AI to generate course outlines and assessments in seconds.', img: '/images/academy/sme-banners-cta.png', pos: 'object-[0%_0%]' },
              { step: '02', title: 'Enrol Participants', text: 'Send branded invitations. Participants join through a clean, mobile-friendly portal — no app downloads needed.', img: '/images/academy/sme-real-businesses.png', pos: 'object-[100%_0%]' },
              { step: '03', title: 'Deliver & Measure Impact', text: 'Track progress in real-time, issue verified certificates, and measure real business outcomes.', img: '/images/academy/sme-real-businesses.png', pos: 'object-[100%_100%]' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="group">
                  <div className="rounded-xl overflow-hidden mb-5 shadow-md group-hover:shadow-lg transition">
                    <img src={s.img} alt={s.title} className={`w-full h-52 object-cover group-hover:scale-105 transition duration-500 ${s.pos}`} />
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
                Trusted by organisations building the future of African enterprise.
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(j => <Star key={j} size={14} className="fill-orange-400 text-orange-400" />)}</div>
                  <p className="text-gray-700 leading-relaxed flex-1 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>&ldquo;{t.quote}&rdquo;</p>
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

      {/* ═══ Why Tempo — with real photo ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src="/images/academy/sme-empowerment.png" alt="African entrepreneurs thriving" className="w-full h-[420px] object-cover" />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">Why Tempo Academy</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Not just a platform. A partner in building capable businesses.
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
                      <div><h4 className="font-semibold text-gray-900 text-sm">{title}</h4><p className="text-gray-500 text-sm leading-relaxed">{text}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ Final CTA — photo background ═══ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/academy/sme-real-businesses.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-900/80" />
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
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center"><span className="text-white font-bold text-xs">/</span></div>
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
