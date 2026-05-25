'use client'

/**
 * /brand — Brand playground.
 *
 * Shows the lockup variants, the four custom marks, the icon size
 * scale, and the app-grid tile recipe. Replaces the Storybook ask
 * from the iconography spec.
 */

import {
  Briefcase, Users, BarChart3, DollarSign, GraduationCap, Settings,
  Calendar, FileText, Award, Shield, Wallet, Heart,
  Receipt, Search,
} from 'lucide-react'
import { Logo, LogoMark } from '@/components/brand/logo'
import { Icon, AIMark, LoadingMark, EmptyStateMark, ICON_SIZE_MAP } from '@/components/brand/icon'
import { AppTile } from '@/components/brand/app-tile'
import './brand.css'

export default function BrandPage() {
  return (
    <main className="brand-pg">
      <header className="brand-pg-header">
        <p className="brand-pg-eyebrow">Brand · Playground</p>
        <h1 className="brand-pg-title">Tempo design system</h1>
        <p className="brand-pg-sub">
          Single source for the lockup, icons, and brand marks. Use this page to verify
          consistency. Tokens live in <code>globals.css</code>; never hardcode hex.
        </p>
      </header>

      <Section title="Logo lockup">
        <p className="brand-pg-line">
          Three variants. The default lives on dark surfaces, inverse on light, mono uses
          <code>currentColor</code> for constrained contexts.
        </p>
        <div className="brand-pg-grid">
          <SurfaceCard label="default · dark surface" dark>
            <Logo variant="default" size={32} />
          </SurfaceCard>
          <SurfaceCard label="inverse · light surface">
            <Logo variant="inverse" size={32} />
          </SurfaceCard>
          <SurfaceCard label="mono · constrained">
            <span style={{ color: 'var(--color-t1)' }}>
              <Logo variant="mono" size={32} />
            </span>
          </SurfaceCard>
        </div>
      </Section>

      <Section title="Mark only">
        <div className="brand-pg-row">
          <SurfaceCard label="16">
            <LogoMark variant="inverse" size={16} />
          </SurfaceCard>
          <SurfaceCard label="24">
            <LogoMark variant="inverse" size={24} />
          </SurfaceCard>
          <SurfaceCard label="32">
            <LogoMark variant="inverse" size={32} />
          </SurfaceCard>
          <SurfaceCard label="48">
            <LogoMark variant="inverse" size={48} />
          </SurfaceCard>
          <SurfaceCard label="96">
            <LogoMark variant="inverse" size={96} />
          </SurfaceCard>
        </div>
      </Section>

      <Section title="Custom brand marks">
        <p className="brand-pg-line">
          These four marks carry the Tempo brand into specific moments. They are not
          interchangeable with lucide icons.
        </p>
        <div className="brand-pg-grid">
          <SurfaceCard label="AI mark" dark>
            <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AIMark size="lg" />
              <AIMark size="xl" />
              <AIMark size="2xl" />
            </div>
          </SurfaceCard>
          <SurfaceCard label="Loading (animated)" dark>
            <div style={{ display: 'flex', gap: 12 }}>
              <LoadingMark size="md" />
              <LoadingMark size="lg" />
              <LoadingMark size="xl" />
            </div>
          </SurfaceCard>
          <SurfaceCard label="Empty state mark">
            <EmptyStateMark size={64} />
          </SurfaceCard>
        </div>
      </Section>

      <Section title="Icon size scale">
        <p className="brand-pg-line">
          Six discrete tokens. Never off-scale. Stroke 1.5 default (2px inside app tiles).
        </p>
        <div className="brand-pg-icon-scale">
          {Object.entries(ICON_SIZE_MAP).map(([token, px]) => (
            <div key={token} className="brand-pg-icon-cell">
              <Icon as={Briefcase} size={token as keyof typeof ICON_SIZE_MAP} />
              <span className="brand-pg-icon-meta">
                <strong>{token}</strong>
                <em>{px}px</em>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="App grid tiles">
        <p className="brand-pg-line">
          Deep teal tile (<code>--color-brand-tile</code>), 2px stroke lucide icon in brand
          accent. Hover scales 1.02 and lightens the tile.
        </p>
        <div className="brand-pg-tiles">
          <AppTile icon={Users} label="People" href="/people" />
          <AppTile icon={BarChart3} label="Analytics" href="/analytics" />
          <AppTile icon={DollarSign} label="Payroll" href="/payroll" />
          <AppTile icon={Receipt} label="Expense" href="/expense" />
          <AppTile icon={Calendar} label="Time" href="/time-attendance" />
          <AppTile icon={GraduationCap} label="Learning" href="/learning" />
          <AppTile icon={Award} label="Performance" href="/performance" />
          <AppTile icon={Wallet} label="Benefits" href="/benefits" />
          <AppTile icon={Briefcase} label="Recruiting" href="/recruiting" />
          <AppTile icon={Shield} label="Compliance" href="/compliance" />
          <AppTile icon={FileText} label="Documents" href="/documents" />
          <AppTile icon={Heart} label="Engagement" href="/engagement" />
          <AppTile icon={Settings} label="Settings" href="/settings" />
          <AppTile icon={Search} label="Search" />
        </div>
      </Section>

      <Section title="Color tokens (single source of truth)">
        <div className="brand-pg-token-grid">
          {[
            { token: '--color-brand-bg', value: '#0D2A35', role: 'deep teal background' },
            { token: '--color-brand-tile', value: '#164257', role: 'app grid tile' },
            { token: '--color-brand-mark', value: '#FFFFFF', role: 'mark on dark' },
            { token: '--color-brand-mark-inverse', value: '#142C3D', role: 'mark on light' },
            { token: '--color-brand-accent', value: '#4FA5C5', role: 'period + dark-tile icon' },
          ].map((t) => (
            <div key={t.token} className="brand-pg-token-cell">
              <span className="brand-pg-swatch" style={{ background: `var(${t.token})` }} />
              <div className="brand-pg-token-meta">
                <code>{t.token}</code>
                <span>{t.value} · {t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="brand-pg-section">
      <h2 className="brand-pg-h2">{title}</h2>
      {children}
    </section>
  )
}

function SurfaceCard({
  label,
  children,
  dark = false,
}: {
  label: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <div className={`brand-pg-surface ${dark ? 'is-dark' : ''}`}>
      <div className="brand-pg-surface-canvas">{children}</div>
      <span className="brand-pg-surface-label">{label}</span>
    </div>
  )
}
