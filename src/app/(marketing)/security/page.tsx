'use client'

import Link from 'next/link'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Shield, Lock, Eye, FileCheck, Server, Users,
  CheckCircle, Clock, Globe, Key, Database, AlertTriangle
} from 'lucide-react'

const certifications = [
  {
    icon: <Shield size={24} />,
    title: 'SOC 2 Type II',
    status: 'In Progress',
    statusColor: 'bg-amber-50 text-amber-700',
    description: 'Independent audit of security, availability, and confidentiality controls. Expected completion Q2 2026.',
    details: ['Security controls', 'Availability monitoring', 'Confidentiality safeguards', 'Processing integrity'],
  },
  {
    icon: <FileCheck size={24} />,
    title: 'ISO 27001',
    status: 'Planned',
    statusColor: 'bg-blue-50 text-blue-700',
    description: 'Information security management system certification. Planned for H2 2026.',
    details: ['Risk assessment', 'Security policies', 'Asset management', 'Access control'],
  },
  {
    icon: <Globe size={24} />,
    title: 'GDPR Compliant',
    status: 'Active',
    statusColor: 'bg-green-50 text-green-700',
    description: 'Full compliance with EU General Data Protection Regulation including DPA availability.',
    details: ['Data subject rights', 'Lawful processing', 'Data minimization', 'Breach notification'],
  },
  {
    icon: <Lock size={24} />,
    title: 'CCPA Compliant',
    status: 'Active',
    statusColor: 'bg-green-50 text-green-700',
    description: 'California Consumer Privacy Act compliance for US data subjects.',
    details: ['Right to know', 'Right to delete', 'Opt-out rights', 'Non-discrimination'],
  },
]

const securityFeatures = [
  { icon: <Lock size={20} />, title: 'Encryption', desc: 'TLS 1.3 in transit, AES-256 at rest. All data encrypted by default.' },
  { icon: <Key size={20} />, title: 'Authentication', desc: 'PBKDF2 password hashing, MFA/TOTP support, JWT sessions with 7-day expiry.' },
  { icon: <Users size={20} />, title: 'Access Control', desc: 'Role-based access (Owner, Admin, HRBP, Manager, Employee) with row-level security.' },
  { icon: <Eye size={20} />, title: 'Audit Logging', desc: 'Every create, update, delete, login, and logout is recorded with user and IP context.' },
  { icon: <Database size={20} />, title: 'Data Isolation', desc: 'Tenant isolation via org-scoped queries. Cross-org data access is architecturally prevented.' },
  { icon: <Server size={20} />, title: 'Infrastructure', desc: 'Hosted on Vercel (edge) with Neon PostgreSQL (serverless). SOC 2 certified providers.' },
  { icon: <AlertTriangle size={20} />, title: 'Vulnerability Management', desc: 'Dependency scanning, OWASP top 10 protection, rate limiting on sensitive endpoints.' },
  { icon: <Clock size={20} />, title: 'Incident Response', desc: '72-hour breach notification per GDPR. Documented incident response procedures.' },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-50 bg-chrome/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TempoLockup variant="white" size="sm" /></Link>
          <Link href="/"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft size={14} /> Back</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-chrome text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Shield size={32} className="text-tempo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Trust Center</h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Security is foundational at Tempo. We protect your workforce data with enterprise-grade controls.
          </p>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-light text-t1 tracking-tight mb-8">Certifications & Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map(cert => (
              <div key={cert.title} className="bg-card rounded-[14px] border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600">
                    {cert.icon}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cert.statusColor}`}>
                    {cert.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-t1 mb-2">{cert.title}</h3>
                <p className="text-sm text-t3 mb-4">{cert.description}</p>
                <div className="flex flex-wrap gap-2">
                  {cert.details.map(d => (
                    <span key={d} className="text-xs bg-canvas border border-border px-2 py-1 rounded text-t3">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16 px-6 bg-card border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-light text-t1 tracking-tight mb-8">Security Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityFeatures.map(feat => (
              <div key={feat.title} className="flex gap-4 p-4 bg-canvas rounded-[14px] border border-border">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-t1 mb-1">{feat.title}</h3>
                  <p className="text-xs text-t3 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Access */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-light text-t1 tracking-tight mb-4">Need More Details?</h2>
          <p className="text-t3 mb-6 max-w-xl mx-auto">
            Enterprise customers can request our full security documentation, penetration test reports, and Data Processing Agreement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="mailto:security@tempo.app">
              <Button>Request Security Package</Button>
            </a>
            <Link href="/gdpr">
              <Button variant="outline">View GDPR Details</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-chrome border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-6 text-xs text-white/20">
          <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-white/40 transition-colors">Cookie Policy</Link>
          <Link href="/gdpr" className="hover:text-white/40 transition-colors">GDPR</Link>
          <Link href="/security" className="text-white/40">Trust Center</Link>
        </div>
      </footer>
    </div>
  )
}
