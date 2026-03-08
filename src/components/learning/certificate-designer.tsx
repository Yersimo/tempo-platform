'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  Award, X, Check, Palette, Type, Frame, User, Building2,
  Sparkles, Download, Printer, ChevronRight, Eye
} from 'lucide-react'

interface CertificateDesignerProps {
  open: boolean
  onClose: () => void
  onSave: (template: CertificateTemplate) => void
  existingTemplate?: CertificateTemplate | null
  orgName?: string
}

export interface CertificateTemplate {
  id: string
  name: string
  layout: 'classic' | 'modern' | 'minimalist' | 'corporate'
  accentColor: string
  borderStyle: 'ornate' | 'simple' | 'double' | 'none'
  showLogo: boolean
  showSeal: boolean
  signatory1: string
  signatory1Title: string
  signatory2: string
  signatory2Title: string
  orgName: string
  fontFamily: 'serif' | 'sans' | 'mono'
}

const LAYOUTS = [
  { id: 'classic' as const, label: 'Classic', desc: 'Traditional formal design with ornate borders' },
  { id: 'modern' as const, label: 'Modern', desc: 'Clean lines with bold accent colors' },
  { id: 'minimalist' as const, label: 'Minimalist', desc: 'Simple and elegant with whitespace' },
  { id: 'corporate' as const, label: 'Corporate', desc: 'Professional with company branding' },
]

const COLORS = [
  { value: '#f97316', label: 'Tempo Orange' },
  { value: '#2563eb', label: 'Royal Blue' },
  { value: '#059669', label: 'Emerald' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#dc2626', label: 'Ruby' },
  { value: '#0891b2', label: 'Teal' },
  { value: '#ca8a04', label: 'Gold' },
  { value: '#1e293b', label: 'Slate' },
]

const BORDERS = [
  { id: 'ornate' as const, label: 'Ornate' },
  { id: 'simple' as const, label: 'Simple' },
  { id: 'double' as const, label: 'Double' },
  { id: 'none' as const, label: 'None' },
]

const FONTS = [
  { id: 'serif' as const, label: 'Serif', family: 'Georgia, serif' },
  { id: 'sans' as const, label: 'Sans-serif', family: 'system-ui, sans-serif' },
  { id: 'mono' as const, label: 'Monospace', family: 'ui-monospace, monospace' },
]

const defaultTemplate: CertificateTemplate = {
  id: '',
  name: 'Custom Certificate',
  layout: 'modern',
  accentColor: '#f97316',
  borderStyle: 'simple',
  showLogo: true,
  showSeal: true,
  signatory1: 'Chief Learning Officer',
  signatory1Title: 'Head of L&D',
  signatory2: 'HR Director',
  signatory2Title: 'Human Resources',
  orgName: '',
  fontFamily: 'sans',
}

export function CertificateDesigner({ open, onClose, onSave, existingTemplate, orgName = 'Organization' }: CertificateDesignerProps) {
  const [template, setTemplate] = useState<CertificateTemplate>(
    existingTemplate || { ...defaultTemplate, orgName }
  )
  const [activeSection, setActiveSection] = useState<'layout' | 'style' | 'content'>('layout')

  const fontFamily = FONTS.find(f => f.id === template.fontFamily)?.family || 'system-ui, sans-serif'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex w-full max-w-6xl mx-auto my-4 bg-white rounded-2xl shadow-2xl overflow-hidden cert-designer-enter">
        {/* Left panel — Controls */}
        <div className="w-80 border-r border-divider/50 flex flex-col bg-white shrink-0">
          <div className="p-4 border-b border-divider/50">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-t1">Certificate Designer</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-canvas"><X size={16} /></button>
            </div>
            <p className="text-xs text-t3">Customize your completion certificate</p>
          </div>

          {/* Section tabs */}
          <div className="flex border-b border-divider/50">
            {(['layout', 'style', 'content'] as const).map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors capitalize',
                  activeSection === s ? 'text-tempo-600 border-b-2 border-tempo-500' : 'text-t3 hover:text-t1'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Layout section */}
            {activeSection === 'layout' && (
              <>
                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><Frame size={12} /> Layout</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LAYOUTS.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setTemplate(t => ({ ...t, layout: l.id }))}
                        className={cn(
                          'cert-layout-card',
                          template.layout === l.id && 'cert-layout-card-active'
                        )}
                      >
                        <p className="text-xs font-semibold">{l.label}</p>
                        <p className="text-[0.55rem] text-t3 mt-0.5">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><Frame size={12} /> Border</p>
                  <div className="flex gap-2">
                    {BORDERS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setTemplate(t => ({ ...t, borderStyle: b.id }))}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                          template.borderStyle === b.id
                            ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                            : 'border-divider text-t2 hover:border-tempo-300'
                        )}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Style section */}
            {activeSection === 'style' && (
              <>
                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><Palette size={12} /> Accent Color</p>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setTemplate(t => ({ ...t, accentColor: c.value }))}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          template.accentColor === c.value ? 'border-t1 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><Type size={12} /> Font</p>
                  <div className="space-y-1.5">
                    {FONTS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setTemplate(t => ({ ...t, fontFamily: f.id }))}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                          template.fontFamily === f.id
                            ? 'border-tempo-500 bg-tempo-50'
                            : 'border-divider hover:border-tempo-300'
                        )}
                        style={{ fontFamily: f.family }}
                      >
                        {f.label} — Certificate
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-xs font-medium text-t1">Show Organization Logo</span>
                    <button
                      onClick={() => setTemplate(t => ({ ...t, showLogo: !t.showLogo }))}
                      className={cn('w-9 h-5 rounded-full transition-colors', template.showLogo ? 'bg-tempo-500' : 'bg-gray-300')}
                    >
                      <div className={cn('w-4 h-4 rounded-full bg-white shadow transition-transform ml-0.5', template.showLogo && 'translate-x-4')} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-xs font-medium text-t1">Show Verification Seal</span>
                    <button
                      onClick={() => setTemplate(t => ({ ...t, showSeal: !t.showSeal }))}
                      className={cn('w-9 h-5 rounded-full transition-colors', template.showSeal ? 'bg-tempo-500' : 'bg-gray-300')}
                    >
                      <div className={cn('w-4 h-4 rounded-full bg-white shadow transition-transform ml-0.5', template.showSeal && 'translate-x-4')} />
                    </button>
                  </label>
                </div>
              </>
            )}

            {/* Content section */}
            {activeSection === 'content' && (
              <>
                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><Building2 size={12} /> Organization</p>
                  <input
                    type="text"
                    value={template.orgName}
                    onChange={e => setTemplate(t => ({ ...t, orgName: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:border-tempo-500"
                    placeholder="Organization name"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><User size={12} /> Signatory 1</p>
                  <input
                    type="text"
                    value={template.signatory1}
                    onChange={e => setTemplate(t => ({ ...t, signatory1: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-sm mb-1.5 focus:outline-none focus:border-tempo-500"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={template.signatory1Title}
                    onChange={e => setTemplate(t => ({ ...t, signatory1Title: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:border-tempo-500"
                    placeholder="Title"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5"><User size={12} /> Signatory 2</p>
                  <input
                    type="text"
                    value={template.signatory2}
                    onChange={e => setTemplate(t => ({ ...t, signatory2: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-sm mb-1.5 focus:outline-none focus:border-tempo-500"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={template.signatory2Title}
                    onChange={e => setTemplate(t => ({ ...t, signatory2Title: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:border-tempo-500"
                    placeholder="Title"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-t1 mb-2">Template Name</p>
                  <input
                    type="text"
                    value={template.name}
                    onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:border-tempo-500"
                    placeholder="Template name"
                  />
                </div>
              </>
            )}
          </div>

          {/* Save button */}
          <div className="p-4 border-t border-divider/50">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                onSave({ ...template, id: template.id || `cert-tpl-${Date.now()}` })
                onClose()
              }}
            >
              <Check size={14} /> Save Template
            </Button>
          </div>
        </div>

        {/* Right panel — Live Preview */}
        <div className="flex-1 bg-[#f0f0f0] flex items-center justify-center p-8 overflow-auto">
          <div className="cert-preview-wrapper">
            <CertificatePreview template={template} courseName="How to Use Tempo — General Course" employeeName="Oluwaseun Adeyemi" completedAt="March 8, 2026" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Exported so the certificate view modal can also use it
export function CertificatePreview({ template, courseName, employeeName, completedAt }: {
  template: CertificateTemplate
  courseName: string
  employeeName: string
  completedAt: string
}) {
  const fontFamily = FONTS.find(f => f.id === template.fontFamily)?.family || 'system-ui, sans-serif'
  const color = template.accentColor
  const isClassic = template.layout === 'classic'
  const isModern = template.layout === 'modern'
  const isMinimal = template.layout === 'minimalist'
  const isCorporate = template.layout === 'corporate'

  const borderClass = cn(
    'cert-preview',
    template.borderStyle === 'ornate' && 'cert-border-ornate',
    template.borderStyle === 'simple' && 'cert-border-simple',
    template.borderStyle === 'double' && 'cert-border-double',
    template.borderStyle === 'none' && 'cert-border-none',
  )

  return (
    <div className={borderClass} style={{ fontFamily, '--cert-accent': color } as React.CSSProperties}>
      {/* Top accent */}
      {(isModern || isCorporate) && (
        <div className="cert-top-accent" style={{ background: color }} />
      )}

      {/* Logo area */}
      {template.showLogo && (
        <div className="cert-logo-area">
          {isCorporate ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color }}>
                <span className="text-white text-sm font-bold">{(template.orgName || 'T')[0]}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color }}>{template.orgName || 'Organization'}</span>
            </div>
          ) : (
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color }}>{template.orgName || 'Organization'}</p>
          )}
        </div>
      )}

      {/* Decorative element */}
      {isClassic && (
        <div className="cert-ornament" style={{ color }}>✦</div>
      )}

      {/* Header */}
      <div className={cn('cert-header', isMinimal && 'cert-header-minimal')}>
        {!isMinimal && <Award size={isClassic ? 32 : 24} style={{ color }} />}
        <h2 className={cn(
          'cert-title',
          isClassic && 'cert-title-classic',
          isMinimal && 'cert-title-minimal',
        )} style={isClassic ? { color } : undefined}>
          Certificate of Completion
        </h2>
      </div>

      {/* Subtitle */}
      <p className="cert-subtitle">This is to certify that</p>

      {/* Employee name */}
      <div className="cert-name-wrapper">
        <p className="cert-employee-name" style={isModern || isCorporate ? { color } : undefined}>
          {employeeName}
        </p>
        {(isClassic || isModern) && (
          <div className="cert-name-line" style={{ background: color }} />
        )}
      </div>

      {/* Course */}
      <p className="cert-subtitle">has successfully completed</p>
      <p className="cert-course-name">{courseName}</p>

      {/* Date */}
      <p className="cert-date">{completedAt}</p>

      {/* Signatories */}
      <div className="cert-signatories">
        <div className="cert-signatory">
          <div className="cert-sig-line" style={{ background: `${color}40` }} />
          <p className="cert-sig-name">{template.signatory1}</p>
          <p className="cert-sig-title">{template.signatory1Title}</p>
        </div>
        {template.showSeal && (
          <div className="cert-seal" style={{ borderColor: color, color }}>
            <Award size={20} />
            <span className="text-[0.4rem] uppercase tracking-wider mt-0.5">Verified</span>
          </div>
        )}
        <div className="cert-signatory">
          <div className="cert-sig-line" style={{ background: `${color}40` }} />
          <p className="cert-sig-name">{template.signatory2}</p>
          <p className="cert-sig-title">{template.signatory2Title}</p>
        </div>
      </div>

      {/* Bottom accent */}
      {isCorporate && (
        <div className="cert-bottom-accent" style={{ background: color }} />
      )}
    </div>
  )
}
