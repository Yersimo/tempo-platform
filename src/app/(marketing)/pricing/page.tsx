'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check, X, ChevronDown, Shield, Globe, Zap, Users, Lock, Server, ArrowRight, Sparkles } from 'lucide-react'

/* ─── Pricing Plans ─── */
const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'For small teams getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    maxEmployees: 10,
    cta: 'Get Started',
    ctaLink: '/signup?plan=free',
    highlight: false,
    features: [
      'Up to 10 employees',
      'Core HR & People Directory',
      'Basic Analytics Dashboard',
      'Employee Self-Service Portal',
      'Document Storage (1 GB)',
      'Email Support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For growing teams that need more',
    monthlyPrice: 8,
    annualPrice: 6,
    maxEmployees: 100,
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=starter',
    highlight: false,
    features: [
      'Up to 100 employees',
      'Everything in Free, plus:',
      'Performance Management',
      'Time & Attendance',
      'Leave Management',
      'Employee Onboarding',
      'Custom Reports',
      'Document Storage (10 GB)',
      'Priority Email Support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For scaling companies that demand the best',
    monthlyPrice: 18,
    annualPrice: 14,
    maxEmployees: 5000,
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=professional',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Up to 5,000 employees',
      'Everything in Starter, plus:',
      'Global Payroll (100+ countries)',
      'Benefits Administration',
      'Recruiting & ATS',
      'Expense Management',
      'Learning & Development',
      'Engagement Surveys',
      'Compensation Management',
      'IT & Device Management',
      'Workflow Automation',
      'API Access',
      'Priority Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with complex needs',
    monthlyPrice: 0,
    annualPrice: 0,
    maxEmployees: null,
    cta: 'Contact Sales',
    ctaLink: '/signup?plan=enterprise',
    highlight: false,
    features: [
      'Unlimited employees',
      'Everything in Professional, plus:',
      'Multi-entity Payroll',
      'Advanced Analytics & AI',
      'Workflow Studio',
      'SSO & SCIM Provisioning',
      'Custom Integrations',
      'Dedicated Customer Success Manager',
      'SLA Guarantee (99.99%)',
      'Custom Data Retention',
      'Audit Log API',
      'On-Premise Deployment Option',
    ],
  },
]

/* ─── Feature Comparison Matrix ─── */
const featureCategories = [
  {
    name: 'Core HR',
    features: [
      { name: 'Employee Directory', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Org Chart', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Document Management', free: '1 GB', starter: '10 GB', pro: '100 GB', enterprise: 'Unlimited' },
      { name: 'Custom Fields', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Employee Self-Service', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Multi-language Support', free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    name: 'Talent Management',
    features: [
      { name: 'Goal Setting & OKRs', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Performance Reviews', free: false, starter: true, pro: true, enterprise: true },
      { name: '360° Feedback', free: false, starter: false, pro: true, enterprise: true },
      { name: '9-Box Calibration', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Compensation Planning', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Succession Planning', free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Payroll & Finance',
    features: [
      { name: 'Payroll Processing', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Multi-country Payroll', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Statutory Deductions', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Pay Stub Generation', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Bank Payment Files', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Year-End Tax Certificates', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Expense Management', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Benefits Administration', free: false, starter: false, pro: true, enterprise: true },
    ],
  },
  {
    name: 'Recruiting',
    features: [
      { name: 'Job Postings', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Applicant Tracking', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Interview Scheduling', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Offer Management', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Careers Page Builder', free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Learning & Development',
    features: [
      { name: 'Course Library', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Auto-Enrollment Rules', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Learning Paths', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Compliance Training', free: false, starter: false, pro: true, enterprise: true },
      { name: 'SCORM/xAPI Support', free: false, starter: false, pro: false, enterprise: true },
      { name: 'AI Course Builder', free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Time & Attendance',
    features: [
      { name: 'Leave Management', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Timesheet Tracking', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Shift Scheduling', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Geolocation Tracking', free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Platform & Security',
    features: [
      { name: 'Role-Based Access Control', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Two-Factor Authentication', free: true, starter: true, pro: true, enterprise: true },
      { name: 'SSO (SAML/OIDC)', free: false, starter: false, pro: false, enterprise: true },
      { name: 'SCIM Provisioning', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Audit Log', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Audit Log API', free: false, starter: false, pro: false, enterprise: true },
      { name: 'API Access', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Webhook Integrations', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Custom Integrations', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Workflow Studio', free: false, starter: false, pro: false, enterprise: true },
      { name: 'SOC 2 Type II (Q2 2026)', free: true, starter: true, pro: true, enterprise: true },
      { name: 'GDPR Compliant', free: true, starter: true, pro: true, enterprise: true },
      { name: 'SLA Guarantee', free: false, starter: false, pro: '99.9%', enterprise: '99.99%' },
    ],
  },
  {
    name: 'Analytics & AI',
    features: [
      { name: 'Basic Dashboards', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Custom Reports', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Cross-Module Analytics', free: false, starter: false, pro: true, enterprise: true },
      { name: 'AI Insights', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Predictive Analytics', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Natural Language Queries', free: false, starter: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: 'Email Support', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Priority Support', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Phone Support', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Dedicated CSM', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Implementation Support', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Training Sessions', free: false, starter: false, pro: false, enterprise: true },
    ],
  },
]

/* ─── FAQ Data ─── */
const faqs = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'Start any paid plan with a full-featured 14-day trial. No credit card required. When your trial ends, you can choose to subscribe or downgrade to the Free plan. All your data is preserved.',
  },
  {
    q: 'How is per-employee pricing calculated?',
    a: 'You are billed based on the number of active employees in your organization at the end of each billing cycle. Inactive or terminated employees are not counted. If you add employees mid-cycle, the charge is prorated.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrade instantly and the difference is prorated. Downgrades take effect at the end of your current billing period. Your data is always preserved when switching plans.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex), ACH bank transfers, and wire transfers for Enterprise plans. All payments are processed securely through Stripe.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes. Annual billing saves you approximately 20% compared to monthly billing. Enterprise customers can negotiate custom terms for multi-year agreements.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'After cancellation, you retain read-only access for 30 days. You can export all your data at any time during this period. After 30 days, data is securely deleted per our data retention policy.',
  },
  {
    q: 'Do you offer discounts for nonprofits or startups?',
    a: 'Yes. We offer 50% off for registered nonprofits and NGOs, and special startup pricing for companies with fewer than 20 employees. Contact our sales team for details.',
  },
  {
    q: 'Is Tempo compliant with data protection regulations?',
    a: 'Tempo is GDPR compliant and pursuing SOC 2 Type II certification (expected Q2 2026), with security practices aligned to ISO 27001 standards. Our infrastructure is hosted on Vercel and Neon PostgreSQL with AES-256 encryption at rest and TLS 1.3 in transit.',
  },
]

/* ─── Cell Renderer ─── */
function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check size={16} className="text-green-500 mx-auto" />
  if (value === false) return <X size={14} className="text-zinc-600 mx-auto" />
  return <span className="text-sm text-zinc-300">{value}</span>
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const revealRefs = useRef<HTMLDivElement[]>([])

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
      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-800/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-800/10 border border-teal-800/20 rounded-full px-4 py-1.5 text-sm text-teal-600 mb-6">
            <Sparkles size={14} />
            14-day free trial on all paid plans
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6" style={{ letterSpacing: '-0.035em' }}>
            Simple, transparent
            <br />
            <span className="bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">pricing for every team</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            From startups to enterprises, Tempo scales with you. Pay only for what you use, switch plans anytime, and never worry about hidden fees.
          </p>

          {/* ─── Billing Toggle ─── */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Annual
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Pricing Cards ─── */}
      <section ref={addRevealRef} className="max-w-7xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            const isEnterprise = plan.id === 'enterprise'

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-200 hover:border-zinc-600 ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-teal-800/10 to-zinc-900/80 border-teal-800/40 ring-1 ring-teal-800/20'
                    : 'bg-zinc-900/50 border-zinc-800'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-teal-800 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {isEnterprise ? (
                    <div>
                      <span className="text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.035em' }}>Custom</span>
                      <p className="text-sm text-zinc-500 mt-1">Tailored to your needs</p>
                    </div>
                  ) : price === 0 ? (
                    <div>
                      <span className="text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.035em' }}>$0</span>
                      <span className="text-zinc-500 text-sm ml-1">forever</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold tracking-tight" style={{ letterSpacing: '-0.035em' }}>${price}</span>
                      <span className="text-zinc-500 text-sm ml-1">/ employee / month</span>
                      {annual && plan.monthlyPrice > 0 && (
                        <p className="text-sm text-zinc-600 mt-1">
                          <span className="line-through">${plan.monthlyPrice}</span>
                          <span className="text-green-400 ml-2">Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/yr per employee</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href={plan.ctaLink}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all mb-6 ${
                    plan.highlight
                      ? 'bg-teal-800 hover:bg-teal-700 text-white shadow-lg shadow-teal-800/25'
                      : isEnterprise
                        ? 'bg-white hover:bg-zinc-100 text-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="flex-1">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    {plan.id === 'free' ? 'Includes' : plan.id === 'starter' ? 'Everything in Free, plus' : plan.id === 'professional' ? 'Everything in Starter, plus' : 'Everything in Professional, plus'}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.filter(f => !f.startsWith('Everything')).map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <Check size={15} className="text-teal-700 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.maxEmployees && (
                  <div className="mt-6 pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-600">Up to {plan.maxEmployees.toLocaleString()} employees</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── Feature Comparison ─── */}
      <section ref={addRevealRef} className="max-w-7xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Compare every feature
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            See exactly what you get with each plan. Every feature, every detail.
          </p>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-6 py-3 text-sm font-medium transition-all"
          >
            {showComparison ? 'Hide' : 'Show'} Full Comparison
            <ChevronDown size={16} className={`transition-transform ${showComparison ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showComparison && (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-sm font-semibold text-zinc-400 w-[280px]">Feature</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-400 w-[130px]">Free</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-400 w-[130px]">Starter</th>
                  <th className="text-center p-4 text-sm font-semibold text-teal-600 w-[130px]">Professional</th>
                  <th className="text-center p-4 text-sm font-semibold text-zinc-400 w-[130px]">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureCategories.map((category) => (
                  <>
                    <tr key={category.name} className="bg-zinc-800/30">
                      <td colSpan={5} className="px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-zinc-300">{feature.name}</td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={feature.free} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={feature.starter} /></td>
                        <td className="px-4 py-3 text-center bg-teal-800/5"><FeatureCell value={feature.pro} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={feature.enterprise} /></td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Trust & Security ─── */}
      <section ref={addRevealRef} className="max-w-5xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Enterprise-grade security
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Your workforce data deserves the highest level of protection. Tempo meets the most demanding security standards.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'SOC 2 Type II', desc: 'Independent security audit in progress — expected Q2 2026' },
            { icon: Globe, title: 'GDPR Compliant', desc: 'Full compliance with EU data protection regulations. Data residency available on request.' },
            { icon: Lock, title: 'Encryption', desc: 'AES-256 encryption at rest and TLS 1.3 in transit for all data' },
            { icon: Server, title: '99.99% SLA', desc: 'Enterprise-grade uptime guarantee with redundant infrastructure' },
            { icon: Users, title: 'SSO & SCIM', desc: 'SAML 2.0, OIDC single sign-on with automated user provisioning' },
            { icon: Zap, title: 'ISO 27001', desc: 'Security practices aligned to ISO 27001 — certification planned H2 2026' },
          ].map((item) => (
            <div key={item.title} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all">
              <item.icon size={24} className="text-teal-700 mb-4" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section ref={addRevealRef} className="max-w-3xl mx-auto px-6 pb-24 opacity-0 translate-y-6 transition-all duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Frequently asked questions
          </h2>
          <p className="text-zinc-400">
            Everything you need to know about Tempo pricing.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/50 transition-colors"
              >
                <span className="font-medium text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-zinc-500 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section ref={addRevealRef} className="max-w-4xl mx-auto px-6 pb-32 opacity-0 translate-y-6 transition-all duration-700">
        <div className="relative bg-gradient-to-br from-teal-800/20 via-zinc-900 to-zinc-900 border border-teal-800/20 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-800/5 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
              Ready to transform your
              <br />
              workforce management?
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto mb-8">
              Join thousands of companies across Africa and beyond who trust Tempo to manage their most important asset &mdash; their people.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-teal-800/25"
              >
                Start Your 14-Day Free Trial
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/signup?plan=enterprise"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-8 py-4 rounded-xl border border-zinc-700 transition-all"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="text-xs text-zinc-600 mt-6">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
