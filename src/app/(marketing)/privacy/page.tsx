'use client'

import Link from 'next/link'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-chrome/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <TempoLockup variant="white" size="sm" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
              <ArrowLeft size={14} /> Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light text-t1 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-t3 mb-12">Last updated: February 24, 2026</p>

        <div className="prose-tempo space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">1. Introduction</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Tempo (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our workforce management platform (the &quot;Service&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">2. Information We Collect</h2>
            <h3 className="text-sm font-semibold text-t1 mb-2">2.1 Information You Provide</h3>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li>Account registration data (name, email, organization details)</li>
              <li>Employee records (job title, department, compensation, performance data)</li>
              <li>Communications (support requests, feedback)</li>
              <li>Payment information (processed by Stripe; we do not store card numbers)</li>
            </ul>

            <h3 className="text-sm font-semibold text-t1 mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li>Log data (IP address, browser type, access times, pages viewed)</li>
              <li>Device information (operating system, device identifiers)</li>
              <li>Usage analytics (features used, navigation patterns)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">3. How We Use Your Information</h2>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve the Service</li>
              <li>To process transactions and send billing-related communications</li>
              <li>To send administrative notifications and platform updates</li>
              <li>To respond to support requests and customer service inquiries</li>
              <li>To monitor and analyze usage patterns and trends</li>
              <li>To detect, prevent, and address technical issues and fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">4. Data Sharing & Disclosure</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We do not sell your personal data. We may share information with:
            </p>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li><strong>Service Providers:</strong> Stripe (payments), Neon (database hosting), Vercel (hosting), Resend/SendGrid (email delivery)</li>
              <li><strong>Your Organization:</strong> Administrators within your organization can access employee data as permitted by role-based access controls</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">5. Data Retention</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the Service. Upon account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required by law (e.g., financial records may be kept for up to 7 years).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">6. Your Rights (GDPR & Global Privacy)</h2>
            <p className="text-sm text-t2 leading-relaxed mb-2">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
            </ul>
            <p className="text-sm text-t2 leading-relaxed mt-3">
              To exercise these rights, visit your <strong>Settings &gt; Privacy</strong> page or contact us at <a href="mailto:privacy@tempo.app" className="text-tempo-600 hover:underline">privacy@tempo.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">7. International Data Transfers</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Your data may be transferred to and processed in countries outside your jurisdiction. We use Standard Contractual Clauses (SCCs) and other appropriate safeguards to ensure adequate protection in compliance with GDPR and other applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">8. Security</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We implement industry-standard security measures including encryption in transit (TLS 1.3), encryption at rest, PBKDF2 password hashing, role-based access controls, audit logging, and regular security assessments. No method of transmission or storage is 100% secure, but we strive to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-sm text-t2 leading-relaxed">
              The Service is not intended for individuals under 16 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">10. Changes to This Policy</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">11. Contact Us</h2>
            <p className="text-sm text-t2 leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your data rights, please contact:<br />
              <strong>Tempo Privacy Team</strong><br />
              Email: <a href="mailto:privacy@tempo.app" className="text-tempo-600 hover:underline">privacy@tempo.app</a><br />
              Data Protection Officer: <a href="mailto:dpo@tempo.app" className="text-tempo-600 hover:underline">dpo@tempo.app</a>
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-chrome border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-6 text-xs text-white/20">
          <Link href="/privacy" className="text-white/40">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-white/40 transition-colors">Cookie Policy</Link>
          <Link href="/gdpr" className="hover:text-white/40 transition-colors">GDPR</Link>
        </div>
      </footer>
    </div>
  )
}
