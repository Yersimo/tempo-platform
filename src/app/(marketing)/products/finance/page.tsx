import '../../landing.css'
import { LandingNav } from '@/components/marketing/landing-interactions'

const modules = [
  { name: 'General Ledger', desc: 'Double-entry enforcement, auto-JE, period close' },
  { name: 'Invoicing', desc: 'AR aging, multi-level approval, dunning' },
  { name: 'Budgets', desc: 'Variance analysis, department-level tracking' },
  { name: 'Expenses', desc: 'Claude Vision OCR, corporate card matching, GPS mileage' },
  { name: 'Bill Pay', desc: 'ACH/Wire/Check, recurring payments, approval queue' },
  { name: 'Corporate Cards', desc: 'Virtual/physical, spend limits, reconciliation' },
  { name: 'Bank Feeds', desc: 'Plaid integration, 6-tier auto-matching engine' },
  { name: 'Consolidation', desc: 'Multi-entity, FX conversion, IC elimination' },
  { name: 'Revenue Recognition', desc: 'ASC 606 5-step model, deferred revenue' },
  { name: 'Transfer Pricing', desc: 'OECD Master File, Local File, CbCR' },
  { name: 'Procurement', desc: 'Three-way PO matching, goods receipts' },
  { name: 'Global Spend', desc: 'Multi-currency, FX transactions, regional breakdown' },
  { name: 'Board Reports', desc: 'Auto-generated quarterly packs, 4 templates' },
  { name: 'Workforce Planning', desc: 'Rolling 12-month forecast, scenario comparison' },
]

const statements = [
  { name: 'Trial Balance', desc: 'Debits = credits, always', symbol: '=' },
  { name: 'Income Statement', desc: 'Revenue vs expenses, any period', symbol: '\u2195' },
  { name: 'Balance Sheet', desc: 'A = L + E verification', symbol: '\u2261' },
]

const closeSteps = [
  'Payroll journal entries auto-posted',
  'Bank feeds reconciled',
  'Expense reports approved and posted',
  'Accounts receivable aged',
  'Revenue recognized per ASC 606',
  'Intercompany eliminations applied',
  'Trial balance verified (Dr = Cr)',
  'Financial statements generated',
  'Board report pack assembled',
]

export default function FinanceProductPage() {
  return (
    <>
      <LandingNav />

      {/* HERO */}
      <section className="hero-center" style={{ minHeight: 'auto', paddingTop: 140, paddingBottom: 80 }}>
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div className="eyebrow"><span className="eyebrow-line" />FINANCE PLATFORM</div>
          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Finance tools that a CFO<br />would actually <em>use.</em>
          </h1>
          <p className="hero-p">
            Double-entry accounting, multi-entity consolidation, and bank reconciliation &mdash; built into your workforce platform.
          </p>
          <div className="hero-btns">
            <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
            <a href="/contact" className="btn btn-ghost">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* 14 FINANCE MODULES */}
      <section className="sec sec-alt">
        <div className="ey">14 Finance Modules</div>
        <h2 className="sh">A complete finance suite.<br /><span className="a">Not an add-on.</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40, maxWidth: 1000 }}>
          {modules.map(m => (
            <div key={m.name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 18, padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>{m.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.7 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINANCIAL STATEMENTS */}
      <section className="sec sec-dark">
        <div className="ey" style={{ justifyContent: 'center' }}>Financial Statements</div>
        <h2 className="sh" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          Generated from your real data, <span className="a">not a spreadsheet.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {statements.map(s => (
            <div key={s.name} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 32,
              textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(234,88,12,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 24, color: '#fb923c', fontWeight: 700,
              }}>{s.symbol}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{s.name}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSE THE BOOKS */}
      <section className="sec">
        <div className="ey">Close the Books</div>
        <h2 className="sh">Month-end financial close in <span className="a">9 steps.</span></h2>
        <div style={{ display: 'grid', gap: 0, marginTop: 40, maxWidth: 600 }}>
          {closeSteps.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#fff7ed', border: '1px solid rgba(234,88,12,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: '#ea580c',
                }}>{i + 1}</div>
                {i < closeSteps.length - 1 && (
                  <div style={{ width: 1, height: 24, background: 'rgba(234,88,12,0.12)' }} />
                )}
              </div>
              <div style={{ paddingTop: 6, paddingBottom: i < closeSteps.length - 1 ? 12 : 0, fontSize: 15, color: 'var(--ink2)', lineHeight: 1.5 }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-ey">Get started</div>
        <h2 className="cta-h">Ready to upgrade your <span className="a">finance stack?</span></h2>
        <p className="cta-p">See double-entry accounting, bank reconciliation, and consolidation in one demo.</p>
        <div className="cta-btns">
          <a href="/demo-request" className="btn btn-orange">Request a Demo</a>
          <a href="/contact" className="btn btn-ghost">Contact Sales</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="fg">
          <div>
            <div className="fb">tempo<span>.</span></div>
            <p className="ft">The unified workforce platform. HR, payroll, finance, IT, and AI in one data layer.</p>
          </div>
          <div>
            <div className="fch">Products</div>
            <ul className="fl">
              <li><a href="/products/hr">HR</a></li>
              <li><a href="/products/payroll">Payroll</a></li>
              <li><a href="/products/finance">Finance</a></li>
              <li><a href="/products/it">IT</a></li>
              <li><a href="/products/ai">Tempo AI</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Company</div>
            <ul className="fl">
              <li><a href="/about">About</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/newsroom">Press</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="fch">Legal</div>
            <ul className="fl">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/security">Security</a></li>
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
