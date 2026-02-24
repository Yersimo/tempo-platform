'use client'

import Link from 'next/link'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-50 bg-chrome/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TempoLockup variant="white" size="sm" /></Link>
          <Link href="/"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft size={14} /> Back</Button></Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light text-t1 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-t3 mb-12">Last updated: February 24, 2026</p>

        <div className="prose-tempo space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-t2 leading-relaxed">
              By accessing or using the Tempo platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">2. Description of Service</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Tempo is a unified workforce management platform that provides human resources, performance management, payroll, benefits administration, and related services. The Service is provided on a subscription basis with different tiers offering varying features and capacities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">3. Account Registration</h2>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li>You must provide accurate, complete, and current registration information</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must immediately notify us of any unauthorized use of your account</li>
              <li>One person or legal entity may not maintain more than one free account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">4. Subscription & Payment</h2>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li>Paid plans are billed per employee per month on a recurring basis</li>
              <li>All fees are exclusive of applicable taxes unless otherwise stated</li>
              <li>You may upgrade or downgrade your plan at any time; changes take effect at the next billing cycle</li>
              <li>Refunds are not provided for partial billing periods unless required by law</li>
              <li>We may suspend access for overdue payments after 15 days written notice</li>
              <li>Free trials automatically convert to paid subscriptions unless canceled</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">5. Data Ownership & Processing</h2>
            <p className="text-sm text-t2 leading-relaxed">
              You retain all rights, title, and interest in your data. By using the Service, you grant Tempo a limited license to process your data solely for the purpose of providing and improving the Service. We act as a data processor on your behalf, and you remain the data controller. Our processing activities are governed by our Data Processing Agreement (DPA), available upon request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">6. Acceptable Use</h2>
            <p className="text-sm text-t2 leading-relaxed mb-2">You agree not to:</p>
            <ul className="text-sm text-t2 leading-relaxed list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful purpose or to violate any regulations</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell, sublicense, or redistribute the Service without authorization</li>
              <li>Store data that violates third-party intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">7. Service Level Agreement</h2>
            <p className="text-sm text-t2 leading-relaxed">
              For Enterprise plan customers, Tempo provides a 99.9% uptime guarantee. Scheduled maintenance windows are excluded. Credits for downtime exceeding the SLA are applied as per the Enterprise agreement. Starter and Professional plans target 99.5% uptime with no SLA credits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">8. Intellectual Property</h2>
            <p className="text-sm text-t2 leading-relaxed">
              The Service, including its design, features, code, documentation, and branding, is the intellectual property of Tempo and is protected by copyright, trademark, and other laws. You may not copy, modify, or create derivative works of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">9. Limitation of Liability</h2>
            <p className="text-sm text-t2 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TEMPO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO TEMPO IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">10. Termination</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Either party may terminate the agreement at any time. Upon termination, your right to access the Service ceases. We will make your data available for export for 30 days after termination, after which it will be permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">11. Governing Law</h2>
            <p className="text-sm text-t2 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">12. Changes to Terms</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide at least 30 days notice of material changes via email or in-app notification. Continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">13. Contact</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Questions about these Terms? Contact us at <a href="mailto:legal@tempo.app" className="text-tempo-600 hover:underline">legal@tempo.app</a>.
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-chrome border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-6 text-xs text-white/20">
          <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-white/40">Terms of Service</Link>
          <Link href="/cookies" className="hover:text-white/40 transition-colors">Cookie Policy</Link>
          <Link href="/gdpr" className="hover:text-white/40 transition-colors">GDPR</Link>
        </div>
      </footer>
    </div>
  )
}
