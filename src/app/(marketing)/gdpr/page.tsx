'use client'

import Link from 'next/link'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Trash2, Shield, FileText, Globe, Lock } from 'lucide-react'

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-50 bg-chrome/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TempoLockup variant="white" size="sm" /></Link>
          <Link href="/"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft size={14} /> Back</Button></Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light text-t1 tracking-tight mb-2">GDPR Compliance</h1>
        <p className="text-sm text-t3 mb-12">How Tempo protects your data rights under GDPR and global privacy regulations</p>

        {/* Data Rights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-card rounded-[14px] border border-border p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
              <Download size={20} />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">Data Export</h3>
            <p className="text-xs text-t3">Download all your personal data in machine-readable JSON format at any time from your Settings.</p>
          </div>
          <div className="bg-card rounded-[14px] border border-border p-6">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 mb-3">
              <Trash2 size={20} />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">Right to Erasure</h3>
            <p className="text-xs text-t3">Request complete deletion of your personal data. We process erasure requests within 30 days.</p>
          </div>
          <div className="bg-card rounded-[14px] border border-border p-6">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mb-3">
              <Shield size={20} />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-1">Data Protection</h3>
            <p className="text-xs text-t3">Encryption at rest and in transit, RBAC, audit logging, and MFA protect your data.</p>
          </div>
        </div>

        <div className="prose-tempo space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">Our GDPR Commitment</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Tempo is committed to full compliance with the General Data Protection Regulation (GDPR) and other applicable data protection laws. We process personal data lawfully, transparently, and for specific purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">Legal Basis for Processing</h2>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li><strong>Contract Performance:</strong> Processing necessary to provide the Service as agreed</li>
              <li><strong>Legitimate Interest:</strong> Security monitoring, fraud prevention, service improvement</li>
              <li><strong>Legal Obligation:</strong> Tax reporting, employment law compliance</li>
              <li><strong>Consent:</strong> Marketing communications, analytics cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">Data Subject Rights</h2>
            <div className="space-y-3">
              {[
                { icon: <FileText size={16} />, right: 'Right of Access (Art. 15)', desc: 'You can request a copy of all personal data we hold about you. Export is available via Settings > Privacy > Export Data.' },
                { icon: <FileText size={16} />, right: 'Right to Rectification (Art. 16)', desc: 'You can update your personal data directly in the platform or request corrections from your administrator.' },
                { icon: <Trash2 size={16} />, right: 'Right to Erasure (Art. 17)', desc: 'You can request deletion of your personal data. Available via Settings > Privacy > Delete My Data.' },
                { icon: <Globe size={16} />, right: 'Right to Data Portability (Art. 20)', desc: 'Export your data in structured JSON format for transfer to another service.' },
                { icon: <Lock size={16} />, right: 'Right to Restrict Processing (Art. 18)', desc: 'You can request we limit processing of your data while a dispute is resolved.' },
                { icon: <Shield size={16} />, right: 'Right to Object (Art. 21)', desc: 'You can object to processing based on legitimate interests at any time.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 bg-card rounded-lg border border-border">
                  <div className="text-tempo-600 mt-0.5">{item.icon}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-t1">{item.right}</h4>
                    <p className="text-xs text-t3 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">Sub-Processors</h2>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-canvas">
                    <th className="text-left px-4 py-3 font-semibold text-t1">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold text-t1">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-t1">Location</th>
                  </tr>
                </thead>
                <tbody className="text-t2">
                  {[
                    { provider: 'Neon', purpose: 'Database hosting', location: 'US (AWS us-east-2)' },
                    { provider: 'Vercel', purpose: 'Application hosting', location: 'Global CDN' },
                    { provider: 'Stripe', purpose: 'Payment processing', location: 'US/EU' },
                    { provider: 'Resend/SendGrid', purpose: 'Email delivery', location: 'US' },
                    { provider: 'AWS S3', purpose: 'File storage', location: 'Configurable' },
                    { provider: 'Anthropic', purpose: 'AI analytics (opt-in)', location: 'US' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{row.provider}</td>
                      <td className="px-4 py-3">{row.purpose}</td>
                      <td className="px-4 py-3">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">Data Protection Officer</h2>
            <p className="text-sm text-t2 leading-relaxed">
              For GDPR-related inquiries, contact our Data Protection Officer:<br />
              Email: <a href="mailto:dpo@tempo.app" className="text-tempo-600 hover:underline">dpo@tempo.app</a><br />
              Response time: within 72 hours for data breach notifications, within 30 days for data subject requests.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">Data Processing Agreement</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Enterprise customers can request a signed Data Processing Agreement (DPA) that includes Standard Contractual Clauses (SCCs) for international data transfers. Contact <a href="mailto:legal@tempo.app" className="text-tempo-600 hover:underline">legal@tempo.app</a> for details.
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-chrome border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-6 text-xs text-white/20">
          <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-white/40 transition-colors">Cookie Policy</Link>
          <Link href="/gdpr" className="text-white/40">GDPR</Link>
        </div>
      </footer>
    </div>
  )
}
