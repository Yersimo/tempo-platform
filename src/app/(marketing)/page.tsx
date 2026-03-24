import './landing.css'
import { LandingNav, HeroCarousel, AccordionCards, ScrollReveal } from '@/components/marketing/landing-interactions'

export default function LandingPage() {
  return (
    <>
      {/* NAV + MEGA MENUS */}
      <LandingNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line" />The unified workforce platform</div>
          <h1 className="hero-h1">
            One record.<br />
            <em>Every system.</em><br />
            <span className="dim">Global scale.</span>
          </h1>
          <p className="hero-p">HR, payroll, finance, IT, and AI in a single data layer. No integrations to stitch together. No spreadsheets. No manual sync.</p>
          <div className="hero-btns">
            <a href="/trial" className="btn btn-orange">
              Start Free Trial
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3L10.5 6.5 7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href="/demo-request" className="btn btn-ghost">Watch Demo</a>
          </div>
          <div className="hero-stats">
            <div className="hs"><span className="hs-n">50K+</span><span className="hs-l">Active employees</span></div>
            <div className="hs-div" />
            <div className="hs"><span className="hs-n">80+</span><span className="hs-l">Countries</span></div>
            <div className="hs-div" />
            <div className="hs"><span className="hs-n">99.9%</span><span className="hs-l">Uptime SLA</span></div>
            <div className="hs-div" />
            <div className="hs"><span className="hs-n">50+</span><span className="hs-l">Modules</span></div>
          </div>
        </div>

        {/* Dashboard Carousel */}
        <HeroCarousel />
      </section>

      {/* LOGOS */}
      <div className="logos">
        <span className="logos-lbl">Works with</span>
        <div className="logos-list">
          <span className="lname">SAP</span>
          <span className="lname">Workday</span>
          <span className="lname">Oracle</span>
          <span className="lname">Active Directory</span>
          <span className="lname">Okta</span>
          <span className="lname">Mercer</span>
          <span className="lname">Salesforce</span>
        </div>
      </div>

      {/* MODULES - WORKDAY STYLE ACCORDION */}
      <ScrollReveal>
        <section className="sec modules-sec">
          <div className="ey">Platform modules</div>
          <h2 className="sh">Built for <span className="a">every person</span><br />in your organization.</h2>
          <p className="sp">From the CHRO to the newest hire &mdash; one platform, every department, every country.</p>
          <AccordionCards />
        </section>
      </ScrollReveal>

      {/* BENTO FEATURES */}
      <ScrollReveal>
        <section className="sec sec-alt">
          <div className="ey">Why Tempo</div>
          <h2 className="sh">Built for<br /><span className="a">global enterprise.</span></h2>

          <div className="bento">
            {/* Wide: Global */}
            <div className="bc wide">
              <div className="bc-tag">Global infrastructure</div>
              <div className="bc-title">80+ countries. One compliance engine.</div>
              <div className="bc-desc">Local payroll rules, multi-currency processing, and regulatory compliance handled automatically. You focus on your people &mdash; we handle the jurisdictions.</div>
              <div className="stats-row">
                <div><div className="sn">80<span className="a">+</span></div><div className="sd">Countries</div></div>
                <div><div className="sn">300<span className="a">+</span></div><div className="sd">Compliance rules</div></div>
                <div><div className="sn">24/7</div><div className="sd">Monitoring</div></div>
              </div>
            </div>

            {/* Tall: AI dark */}
            <div className="bc tall dark">
              <div className="bc-tag">Tempo AI</div>
              <div className="bc-title">AI that knows your workforce.</div>
              <div className="bc-desc">Ask anything. Get answers grounded in your actual data &mdash; not generic responses. Headcount forecasts, policy lookups, turnover analysis. All instant.</div>
              <div className="ai-q" style={{ background: 'rgba(255,85,32,0.12)', borderColor: 'rgba(255,85,32,0.28)', color: 'rgba(255,130,90,1)' }}>
                &ldquo;What&apos;s our turnover rate in West Africa vs last quarter?&rdquo;
              </div>
              <div className="ai-a" style={{ color: 'rgba(255,255,255,0.58)' }}>
                Turnover in West Africa was <strong style={{ color: '#fff' }}>8.3%</strong> this quarter vs <strong style={{ color: '#fff' }}>11.2%</strong> last &mdash; driven by improved retention in Ghana and Senegal. <span className="cta">See full breakdown &rarr;</span>
              </div>
              <div className="mini-bars">
                <div className="bar" style={{ height: '38%', background: 'rgba(255,255,255,0.15)' }} />
                <div className="bar" style={{ height: '55%', background: 'rgba(255,255,255,0.15)' }} />
                <div className="bar" style={{ height: '44%', background: 'rgba(255,255,255,0.15)' }} />
                <div className="bar" style={{ height: '70%', background: 'rgba(255,255,255,0.5)' }} />
                <div className="bar" style={{ height: '58%', background: 'rgba(255,255,255,0.15)' }} />
                <div className="bar" style={{ height: '82%', background: 'var(--orange)' }} />
                <div className="bar" style={{ height: '50%', background: 'rgba(255,255,255,0.15)' }} />
                <div className="bar" style={{ height: '64%', background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>

            {/* Integrations */}
            <div className="bc">
              <div className="bc-tag">Integrations</div>
              <div className="bc-title">Works with your existing stack.</div>
              <div className="bc-desc">No rip-and-replace required. Tempo connects to what you already use on day one.</div>
              <div className="int-tags">
                <span className="itag">SAP</span><span className="itag">Workday</span><span className="itag">Oracle</span>
                <span className="itag">Okta</span><span className="itag">Active Directory</span><span className="itag">Mercer</span>
                <span className="itag">+44 more</span>
              </div>
            </div>

            {/* Security */}
            <div className="bc">
              <div className="bc-tag">Security &amp; compliance</div>
              <div className="bc-title">SOC 2 compliant. GDPR ready.</div>
              <div className="bc-desc">Enterprise-grade security from day one. One permissions engine governs every module and every country.</div>
              <div className="sec-pills">
                <div className="spill sp-g"><div className="spill-v">SOC 2</div><div className="spill-l">Type II</div></div>
                <div className="spill sp-b"><div className="spill-v">GDPR</div><div className="spill-l">Ready</div></div>
                <div className="spill sp-y"><div className="spill-v">99.9%</div><div className="spill-l">Uptime</div></div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* TESTIMONIAL */}
      <ScrollReveal>
        <section className="testi">
          <div className="testi-glow" />
          <div className="testi-inner">
            <div className="testi-stars">
              <span className="star">{'\u2605'}</span><span className="star">{'\u2605'}</span><span className="star">{'\u2605'}</span><span className="star">{'\u2605'}</span><span className="star">{'\u2605'}</span>
            </div>
            <blockquote className="testi-q">
              &ldquo;Tempo replaced five tools we were stitching together with Zapier.
              Now our <span className="hl">7,000 employees across 23 countries</span> run
              on one data layer. The visibility alone changed how we make decisions.&rdquo;
            </blockquote>
            <div className="testi-author">
              <div className="tav">HR</div>
              <div>
                <div className="tan">HR Director, EMEA Financial Services</div>
                <div className="tar">7,000+ employees &middot; 23 countries</div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <section className="cta-sec">
          <div className="cta-ey">Get started today</div>
          <h2 className="cta-h">Ready to see what<br /><span className="a">one platform</span> can do?</h2>
          <p className="cta-p">Book a 30-minute demo. We&apos;ll show you exactly how Tempo works for your company &mdash; with your data, your compliance requirements.</p>
          <div className="cta-btns">
            <a href="/demo-request" className="btn btn-orange">
              Request a Demo
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3L10.5 6.5 7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href="/trial" className="btn btn-ghost">Start Free Trial</a>
          </div>
          <p className="cta-fine">Or email us at <a href="mailto:hello@theworktempo.com">hello@theworktempo.com</a></p>
        </section>
      </ScrollReveal>

      {/* FOOTER */}
      <footer>
        <div className="fg">
          <div>
            <div className="fb">tempo<span>.</span></div>
            <p className="ft">The unified workforce platform. HR, payroll, finance, IT, and AI in one data layer.</p>
            <div className="fbadges">
              <span className="fbadge">SOC 2</span>
              <span className="fbadge">GDPR</span>
              <span className="fbadge">ISO 27001</span>
            </div>
          </div>
          <div>
            <div className="fch">Products</div>
            <ul className="fl">
              <li><a href="/products/hr">HR</a></li>
              <li><a href="/products/payroll">Payroll</a></li>
              <li><a href="/products/finance">Finance</a></li>
              <li><a href="#">IT</a></li>
              <li><a href="#">Tempo AI</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Company</div>
            <ul className="fl">
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Resources</div>
            <ul className="fl">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API Docs</a></li>
              <li><a href="#">Status</a></li>
              <li><a href="/academy">Academy</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Legal</div>
            <ul className="fl">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/security">Security</a></li>
              <li><a href="#">DPA</a></li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <span className="fcopy">&copy; 2026 Tempo. All rights reserved.</span>
          <div className="flegal">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/cookies">Cookie Settings</a>
          </div>
        </div>
      </footer>
    </>
  )
}
