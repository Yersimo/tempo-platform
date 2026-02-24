'use client'

import Link from 'next/link'
import { TempoLockup } from '@/components/brand/tempo-lockup'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-50 bg-chrome/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TempoLockup variant="white" size="sm" /></Link>
          <Link href="/"><Button variant="ghost" size="sm" className="text-white/60 hover:text-white"><ArrowLeft size={14} /> Back</Button></Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-light text-t1 tracking-tight mb-2">Cookie Policy</h1>
        <p className="text-sm text-t3 mb-12">Last updated: February 24, 2026</p>

        <div className="prose-tempo space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">1. What Are Cookies</h2>
            <p className="text-sm text-t2 leading-relaxed">
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">2. Cookies We Use</h2>

            <div className="bg-card rounded-lg border border-border overflow-hidden mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-canvas">
                    <th className="text-left px-4 py-3 font-semibold text-t1">Cookie</th>
                    <th className="text-left px-4 py-3 font-semibold text-t1">Purpose</th>
                    <th className="text-left px-4 py-3 font-semibold text-t1">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-t1">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-t2">
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-mono text-xs">tempo_session</td>
                    <td className="px-4 py-3">Authentication session</td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Essential</span></td>
                    <td className="px-4 py-3">7 days</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-mono text-xs">tempo_locale</td>
                    <td className="px-4 py-3">Language preference</td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Essential</span></td>
                    <td className="px-4 py-3">1 year</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-mono text-xs">tempo_consent</td>
                    <td className="px-4 py-3">Cookie consent preferences</td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Essential</span></td>
                    <td className="px-4 py-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">3. Essential Cookies</h2>
            <p className="text-sm text-t2 leading-relaxed">
              These cookies are strictly necessary for the Service to function. They enable core features such as authentication, security, and language preferences. You cannot opt out of essential cookies as the Service will not work properly without them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">4. Analytics Cookies</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We may use analytics cookies to understand how users interact with the Service. These cookies collect information in an anonymous form. You can opt out of analytics cookies through the cookie consent banner or your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">5. Managing Cookies</h2>
            <p className="text-sm text-t2 leading-relaxed">
              You can manage cookies through your browser settings. Most browsers allow you to refuse all cookies, accept only certain cookies, or be notified when a cookie is set. Please note that disabling essential cookies may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">6. Updates</h2>
            <p className="text-sm text-t2 leading-relaxed">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-t1 mb-3">7. Contact</h2>
            <p className="text-sm text-t2 leading-relaxed">
              For questions about our use of cookies, please contact <a href="mailto:privacy@tempo.app" className="text-tempo-600 hover:underline">privacy@tempo.app</a>.
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-chrome border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-6 text-xs text-white/20">
          <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          <Link href="/cookies" className="text-white/40">Cookie Policy</Link>
          <Link href="/gdpr" className="hover:text-white/40 transition-colors">GDPR</Link>
        </div>
      </footer>
    </div>
  )
}
