'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, CheckCircle2, Star, Quote,
  TrendingUp, Users, Lightbulb, Target, Heart,
  Globe2, Award, BookOpen, Sparkles, BarChart3,
  Shield, Zap, MessageCircle, GraduationCap,
  Building2, Briefcase, Rocket, ChevronRight,
} from 'lucide-react'

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function RevealSection({ children, className = '', delay = '' }: { children: React.ReactNode; className?: string; delay?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className={`transition-all duration-700 ${delay} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

/* ─── Impact numbers ─── */
const impactStats = [
  { value: '90%', label: 'of jobs in Africa', sub: 'created by MSMEs' },
  { value: '50M+', label: 'small businesses', sub: 'across the continent' },
  { value: '80%', label: 'of GDP growth', sub: 'driven by SMEs globally' },
  { value: '3x', label: 'more likely to thrive', sub: 'with structured training' },
]

/* ─── Why it matters ─── */
const challenges = [
  { icon: Target, title: 'Access to Knowledge', text: 'Most small business owners learn by trial and error. Structured programmes change everything.' },
  { icon: Users, title: 'Scale Without Borders', text: 'Train 50 entrepreneurs in Lagos and 500 in Nairobi from the same programme, simultaneously.' },
  { icon: TrendingUp, title: 'Measurable Impact', text: 'Track who completed what, who needs support, and what drove real business outcomes.' },
  { icon: Heart, title: 'Community & Connection', text: 'Peer learning, discussion forums, and cohort accountability keep participants engaged.' },
]

/* ─── Capabilities ─── */
const capabilities = [
  { icon: BookOpen, title: 'Structured Programmes', text: 'Build multi-week learning journeys with modules, live sessions, assignments, and assessments.' },
  { icon: GraduationCap, title: 'Cohort-Based Delivery', text: 'Group participants into time-bound cohorts for accountability, peer learning, and community.' },
  { icon: Award, title: 'Verified Certificates', text: 'Issue branded, QR-verified certificates that participants can share on LinkedIn and with employers.' },
  { icon: BarChart3, title: 'Impact Analytics', text: 'Real-time dashboards showing completion, engagement, at-risk participants, and programme ROI.' },
  { icon: MessageCircle, title: 'Community & Discussions', text: 'Built-in forums, facilitator Q&A, and peer-to-peer learning spaces within every programme.' },
  { icon: Zap, title: 'Automated Communications', text: 'Welcome emails, session reminders, deadline nudges, and certificate notifications on autopilot.' },
  { icon: Globe2, title: 'Multi-Language Support', text: 'Deliver content in English, French, Portuguese, and more to reach every corner of the continent.' },
  { icon: Shield, title: 'White-Label & Custom Domains', text: 'Your brand, your domain, your academy. Participants never see Tempo unless you want them to.' },
  { icon: Sparkles, title: 'AI-Powered Course Builder', text: 'Describe your programme topic and let AI generate course outlines, quiz questions, and assignments.' },
]

/* ─── Testimonials ─── */
const testimonials = [
  {
    quote: 'We trained 340 SME owners across 6 West African countries in 4 months. The cohort model kept completion above 90%.',
    author: 'Head of Enterprise Development',
    org: 'Pan-African Development Bank',
    stars: 5,
  },
  {
    quote: 'For the first time, our entrepreneurs have a structured path to grow their skills. The certificates give them credibility with lenders.',
    author: 'Director of SME Programmes',
    org: 'Regional Chamber of Commerce',
    stars: 5,
  },
  {
    quote: 'We replaced three tools with one. The academy lives inside our HR platform so our team can manage everything from one place.',
    author: 'Chief People Officer',
    org: 'Leading African Fintech',
    stars: 5,
  },
]

/* ─── Use cases ─── */
const useCases = [
  { icon: Building2, title: 'Banks & Financial Institutions', text: 'Financial literacy academies for SME borrowers, agent training, and compliance programmes.' },
  { icon: Briefcase, title: 'Development Organisations', text: 'Entrepreneurship programmes, skills-building initiatives, and capacity development at scale.' },
  { icon: Rocket, title: 'Corporates & Enterprises', text: 'Supplier development, partner enablement, and customer education programmes.' },
  { icon: GraduationCap, title: 'Government & NGOs', text: 'Youth employment programmes, trade skills training, and public sector capacity building.' },
]

export default function AcademyLandingPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ═══ Navigation ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">/</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">tempo <span className="text-orange-500">academy</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/academy/login" className="text-sm text-gray-600 hover:text-gray-900 transition hidden sm:block">Sign In</Link>
            <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-full transition shadow-sm hover:shadow">
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/60 via-white to-white" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-orange-100">
              <Lightbulb size={14} />
              Capability building for small businesses
            </div>
          </RevealSection>

          <RevealSection delay="delay-100">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-gray-900 mb-6">
              Every small business
              <br />
              deserves a chance to
              <br />
              <span className="text-orange-500">grow with confidence.</span>
            </h1>
          </RevealSection>

          <RevealSection delay="delay-200">
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Tempo Academy helps organisations design and deliver structured training
              and advisory programmes that transform small business owners into
              confident, capable entrepreneurs.
            </p>
          </RevealSection>

          <RevealSection delay="delay-300">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-full transition shadow-lg hover:shadow-xl text-base flex items-center gap-2">
                Start Building Your Academy <ArrowRight size={18} />
              </Link>
              <Link href="/academy/diagnostic" className="text-gray-700 hover:text-orange-600 font-medium px-6 py-3.5 rounded-full border border-gray-200 hover:border-orange-200 transition text-base flex items-center gap-2">
                Take the Readiness Assessment <ChevronRight size={16} />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══ The MSME Opportunity ═══ */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-14">
              <p className="text-orange-400 font-medium text-sm tracking-wide uppercase mb-3">The opportunity is enormous</p>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Small businesses are the backbone of every economy.
              </h2>
              <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
                Yet most lack access to the structured training and advisory support they
                need to survive, grow, and create jobs.
              </p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {impactStats.map((stat, i) => (
              <RevealSection key={i} delay={`delay-${(i + 1) * 100}`}>
                <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <div className="text-3xl sm:text-4xl font-bold text-orange-400 mb-2">{stat.value}</div>
                  <div className="text-white font-medium text-sm sm:text-base">{stat.label}</div>
                  <div className="text-gray-500 text-xs sm:text-sm mt-1">{stat.sub}</div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay="delay-500">
            <p className="text-center text-gray-400 mt-12 max-w-3xl mx-auto text-base leading-relaxed">
              MSMEs account for 90% of businesses, 60-70% of employment, and 50% of GDP worldwide.
              In Africa alone, they create 80% of all jobs. When small businesses grow, entire
              communities transform. But growth requires knowledge, and knowledge requires structured delivery.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ═══ Why This Matters ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Why capability building matters</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                The difference between surviving and thriving
                <br className="hidden sm:block" />
                is access to the right knowledge, at the right time.
              </h2>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-8">
            {challenges.map((item, i) => (
              <RevealSection key={i} delay={`delay-${(i + 1) * 100}`}>
                <div className="flex gap-5 p-6 rounded-2xl bg-gray-50 hover:bg-orange-50/50 transition group">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition">
                    <item.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1.5">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ What You Can Build ═══ */}
      <section className="py-20 sm:py-28 bg-orange-50/40">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">What you can build</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Everything you need to design, deliver,
                <br className="hidden sm:block" />
                and measure transformative programmes.
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
                From financial literacy for SME borrowers to leadership development
                for emerging managers, Tempo Academy gives you the tools to build
                programmes that create real impact.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <RevealSection key={i} delay={`delay-${Math.min((i + 1) * 75, 400)}`}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition">
                    <cap.icon size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{cap.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{cap.text}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-16">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Simple to get started</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                From idea to live programme in days, not months.
              </h2>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Design Your Programme', text: 'Choose from ready-made templates or build from scratch. Use AI to generate course outlines, quiz questions, and assignments in seconds.', icon: Lightbulb },
              { step: '02', title: 'Enrol Participants', text: 'Send branded invitations. Participants join via a clean, mobile-friendly portal with their own login. No app downloads needed.', icon: Users },
              { step: '03', title: 'Deliver & Measure Impact', text: 'Participants learn through structured modules, live sessions, and peer discussions. You track everything in real-time and issue verified certificates.', icon: BarChart3 },
            ].map((s, i) => (
              <RevealSection key={i} delay={`delay-${(i + 1) * 150}`}>
                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-5 group-hover:bg-orange-500 group-hover:text-white transition">
                    <s.icon size={28} />
                  </div>
                  <div className="text-orange-400 font-bold text-sm mb-2 tracking-wide">STEP {s.step}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{s.text}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Who It's For ═══ */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-14">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Built for impact makers</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                For every organisation that believes
                <br className="hidden sm:block" />
                small businesses deserve better.
              </h2>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-6">
            {useCases.map((uc, i) => (
              <RevealSection key={i} delay={`delay-${(i + 1) * 100}`}>
                <div className="flex gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <uc.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{uc.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{uc.text}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Testimonials ═══ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-14">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Trusted by impact leaders</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Organisations building the future of
                <br className="hidden sm:block" />
                African enterprise, powered by Tempo.
              </h2>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={i} delay={`delay-${(i + 1) * 100}`}>
                <div className="bg-gray-50 rounded-2xl p-7 border border-gray-100 flex flex-col h-full">
                  <Quote size={24} className="text-orange-300 mb-4" />
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={14} className="fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1 mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-gray-500 text-xs">{t.org}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Why Tempo Academy ═══ */}
      <section className="py-20 sm:py-28 bg-orange-50/40">
        <div className="max-w-5xl mx-auto px-6">
          <RevealSection>
            <div className="text-center mb-14">
              <p className="text-orange-500 font-medium text-sm tracking-wide uppercase mb-3">Why Tempo Academy</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Not just a platform. A partner in
                <br className="hidden sm:block" />
                building capable businesses.
              </h2>
            </div>
          </RevealSection>

          <div className="space-y-5 max-w-3xl mx-auto">
            {[
              ['Built for Africa, serving the world', 'Designed from day one for the realities of African infrastructure: low bandwidth, mobile-first, offline-capable, multi-language. But powerful enough for any market.'],
              ['Embedded in your HR platform', 'Unlike standalone LMS tools that require separate logins, contracts, and integrations, Tempo Academy lives inside the same platform where you manage your people.'],
              ['Cohort-first, not content-first', 'We believe learning happens in community. Our entire architecture is built around cohorts, peer learning, and facilitator-led experiences, not lonely self-paced courses.'],
              ['From $0 to enterprise scale', 'Start with a free academy for up to 25 participants. Scale to thousands across multiple countries as your impact grows. No upfront costs, no long-term commitments.'],
              ['AI that saves hours, not replaces humans', 'Our AI generates course outlines and quiz questions so your facilitators can focus on what matters: connecting with participants and driving real outcomes.'],
            ].map(([title, text], i) => (
              <RevealSection key={i} delay={`delay-${(i + 1) * 75}`}>
                <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <CheckCircle2 size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-24 sm:py-32 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              The next generation of African
              <br />
              entrepreneurs is waiting.
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Give them the structured training, mentorship, and credentials
              they need to build businesses that create jobs and transform communities.
            </p>
          </RevealSection>

          <RevealSection delay="delay-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/academy/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full transition shadow-lg hover:shadow-xl text-base flex items-center gap-2">
                Start Building Your Academy <ArrowRight size={18} />
              </Link>
              <Link href="/academy/login" className="text-gray-300 hover:text-white font-medium px-6 py-4 rounded-full border border-gray-700 hover:border-gray-500 transition text-base">
                Schedule a Demo
              </Link>
            </div>
          </RevealSection>

          <RevealSection delay="delay-300">
            <p className="text-gray-500 text-sm">
              Free for up to 25 participants. No credit card required.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-950 text-gray-500 py-10 border-t border-gray-800">
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
