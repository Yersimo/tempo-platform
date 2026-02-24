'use client'

import Link from 'next/link'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { TempoMark } from '@/components/brand/tempo-mark'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, Users, Banknote, GraduationCap, HeartPulse, UserCheck,
  Wallet, Clock, Shield, Receipt, Briefcase, Laptop, AppWindow,
  FileText, PieChart, BarChart3, ArrowRight, Check, Globe, Zap, Lock
} from 'lucide-react'

const modules = [
  { icon: <TrendingUp size={20} />, name: 'Performance', desc: 'Goals, reviews, calibration, and feedback' },
  { icon: <Banknote size={20} />, name: 'Compensation', desc: 'Benchmarking, salary reviews, and STIP' },
  { icon: <GraduationCap size={20} />, name: 'Learning', desc: 'Courses, paths, and skills matrix' },
  { icon: <HeartPulse size={20} />, name: 'Engagement', desc: 'Surveys, eNPS, and action planning' },
  { icon: <UserCheck size={20} />, name: 'Mentoring', desc: 'AI matching and session tracking' },
  { icon: <Wallet size={20} />, name: 'Payroll', desc: 'Multi-country pay runs and tax config' },
  { icon: <Clock size={20} />, name: 'Time & Attendance', desc: 'Leave, timesheets, and scheduling' },
  { icon: <Shield size={20} />, name: 'Benefits', desc: 'Plans, enrollment, and providers' },
  { icon: <Receipt size={20} />, name: 'Expense', desc: 'Submit, approve, and reimburse' },
  { icon: <Briefcase size={20} />, name: 'Recruiting', desc: 'Postings, pipeline, and offers' },
  { icon: <Laptop size={20} />, name: 'IT & Devices', desc: 'Inventory, assignment, and lifecycle' },
  { icon: <AppWindow size={20} />, name: 'Apps & Licenses', desc: 'Software provisioning and tracking' },
  { icon: <FileText size={20} />, name: 'Finance', desc: 'Invoices, budgets, and vendors' },
  { icon: <PieChart size={20} />, name: 'Budgets', desc: 'Department budgets and tracking' },
  { icon: <BarChart3 size={20} />, name: 'Analytics', desc: 'Workforce insights and reporting' },
  { icon: <Users size={20} />, name: 'People', desc: 'Unified employee directory' },
]

const stats = [
  { value: '50,000+', label: 'Employees Managed' },
  { value: '80+', label: 'Countries' },
  { value: '6', label: 'Continents' },
  { value: '16', label: 'Integrated Modules' },
]

const pricingTiers = [
  {
    name: 'Starter',
    price: '$8',
    period: '/employee/month',
    desc: 'For growing companies',
    features: ['Up to 100 employees', 'Core HR & People', 'Performance Management', 'Time & Attendance', 'Basic Analytics', 'Email Support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$18',
    period: '/employee/month',
    desc: 'For scaling organizations',
    features: ['Up to 5,000 employees', 'All Starter features', 'Payroll & Benefits', 'Recruiting & Expense', 'Learning & Engagement', 'Compensation Management', 'IT & Device Management', 'API Access', 'Priority Support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations',
    features: ['Unlimited employees', 'All Professional features', 'Multi-country Payroll', 'Advanced Analytics & AI', 'Workflow Studio', 'SSO & SCIM', 'Custom Integrations', 'Dedicated CSM', 'SLA Guarantee'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-chrome/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <TempoLockup variant="white" size="sm" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
            <a href="#stats" className="text-sm text-white/50 hover:text-white transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-chrome text-white pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <TempoMark variant="white" size={80} />
          </div>
          <Badge variant="orange" className="mb-6">Now available for enterprise</Badge>
          <h1 className="tempo-display text-4xl md:text-6xl text-white mb-6 tracking-tight">
            The unified workforce platform<br />for global enterprises
          </h1>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 font-light">
            One employee record. 16 integrated modules. 80+ countries.
            More intuitive than Rippling. More beautiful than Lattice.
            More governed than Workday.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Free Trial <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="px-8 border-white/20 text-white hover:bg-white/5">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="bg-chrome border-t border-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="tempo-stat text-3xl md:text-4xl text-tempo-600 mb-1">{stat.value}</p>
              <p className="text-sm text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Tempo */}
      <section className="bg-canvas py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-light text-t1 tracking-tight mb-4">Why organizations choose Tempo</h2>
            <p className="text-t3 max-w-xl mx-auto">Unified beats bundled. One platform, one employee record, one truth.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-[14px] border border-border p-8">
              <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600 mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-base font-semibold text-t1 mb-2">Unified, Not Bundled</h3>
              <p className="text-sm text-t3">Change an employee&apos;s department once and it updates everywhere: payroll, benefits, devices, permissions, analytics. No sync delays, no data conflicts.</p>
            </div>
            <div className="bg-card rounded-[14px] border border-border p-8">
              <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600 mb-4">
                <Globe size={24} />
              </div>
              <h3 className="text-base font-semibold text-t1 mb-2">Built for Global Scale</h3>
              <p className="text-sm text-t3">Multi-country compliance out of the box. Multi-currency payroll. Works everywhere. Designed for the realities of operating across borders, time zones, and regulatory environments.</p>
            </div>
            <div className="bg-card rounded-[14px] border border-border p-8">
              <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600 mb-4">
                <Lock size={24} />
              </div>
              <h3 className="text-base font-semibold text-t1 mb-2">Bank-Grade Governance</h3>
              <p className="text-sm text-t3">Every action is audit-logged. Role-based access controls. Regulatory compliance built in, not bolted on. Your auditors will love the trail.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Modules */}
      <section id="features" className="bg-card py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-light text-t1 tracking-tight mb-4">16 modules. One platform.</h2>
            <p className="text-t3 max-w-xl mx-auto">Every module shares one employee graph, one permissions engine, one data layer. Never separate products.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.map(mod => (
              <div key={mod.name} className="bg-canvas rounded-[14px] border border-border p-5 hover:border-tempo-600/30 transition-colors">
                <div className="text-tempo-600 mb-3">{mod.icon}</div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{mod.name}</h3>
                <p className="text-xs text-t3">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-canvas py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-light text-t1 tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-t3 max-w-xl mx-auto">Start free, scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map(tier => (
              <div key={tier.name} className={`rounded-[14px] border p-8 ${tier.highlighted ? 'bg-card border-tempo-600 ring-1 ring-tempo-600/20' : 'bg-card border-border'}`}>
                {tier.highlighted && <Badge variant="orange" className="mb-4">Most Popular</Badge>}
                <h3 className="text-lg font-semibold text-t1">{tier.name}</h3>
                <p className="text-xs text-t3 mb-4">{tier.desc}</p>
                <div className="mb-6">
                  <span className="tempo-stat text-3xl text-t1">{tier.price}</span>
                  <span className="text-sm text-t3">{tier.period}</span>
                </div>
                <Link href="/signup">
                  <Button variant={tier.highlighted ? 'primary' : 'outline'} className="w-full mb-6">
                    {tier.cta}
                  </Button>
                </Link>
                <ul className="space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-t2">
                      <Check size={14} className="text-success mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-chrome py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <TempoMark variant="white" size={48} className="mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight mb-4">
            Ready to unify your workforce?
          </h2>
          <p className="text-white/40 mb-8 max-w-xl mx-auto">
            Join thousands of companies using Tempo to manage their entire workforce from one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">Start Free Trial</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="px-8 border-white/20 text-white hover:bg-white/5">
                View Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-chrome border-t border-white/5 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <TempoLockup variant="white" size="sm" />
              <p className="text-xs text-white/20 mt-3">The unified workforce platform for modern global enterprises.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Security', 'Integrations'].map(l => (
                  <li key={l}><a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Company</h4>
              <ul className="space-y-2">
                {['About', 'Careers', 'Blog', 'Contact'].map(l => (
                  <li key={l}><a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                {['Privacy', 'Terms', 'Cookie Policy', 'GDPR'].map(l => (
                  <li key={l}><a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 text-center">
            <p className="text-xs text-white/15">&copy; 2026 Tempo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
