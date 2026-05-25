/**
 * Tempo Logo + LogoMark
 *
 * The canonical brand lockup. Three-bar T mark + TEMPO. wordmark in all
 * caps. The all-caps treatment is a deliberate enterprise-positioning
 * choice (SAP / Workday / ADP dialect). Do not soften to lowercase.
 *
 * Variants:
 *   default — white mark + accent period (for dark surfaces)
 *   inverse — dark mark + accent period (for light surfaces)
 *   mono    — single color via currentColor (for constrained contexts)
 *
 * Geometry per brief — bars at x=0/30/60, widths 20, outer height 60
 * starting at y=13, center height 86 starting at y=0. Bounding 80×86.
 * Wordmark uses currentColor for letterforms, brand-accent token for
 * the period only.
 *
 * Never hardcode hex — tokens live in globals.css (--color-brand-*).
 */

import * as React from 'react'

export type LogoVariant = 'default' | 'inverse' | 'mono'
/** Pixel height of the lockup, or 'fit' to let the parent size it. */
export type LogoSize = number | 'fit'

interface LogoProps {
  variant?: LogoVariant
  /** Pixel height of the mark + wordmark. 'fit' lets the parent size it. */
  size?: LogoSize
  /** Add a label that announces 'Tempo' for screen readers (default true) */
  ariaLabel?: string
  className?: string
}

// ─── Resolve the right CSS color value per variant ──────────────────

function resolveColor(variant: LogoVariant): string {
  switch (variant) {
    case 'default':
      return 'var(--color-brand-mark)' // white
    case 'inverse':
      return 'var(--color-brand-mark-inverse)' // dark navy
    case 'mono':
      return 'currentColor'
  }
}

function resolveAccent(variant: LogoVariant): string {
  // Mono variant intentionally has no colored period
  return variant === 'mono' ? 'currentColor' : 'var(--color-brand-accent)'
}

// ─── LogoMark — the three-bar T, icon only ──────────────────────────

interface LogoMarkProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
  ariaLabel?: string
}

export function LogoMark({
  variant = 'default',
  size = 32,
  className = '',
  ariaLabel = 'Tempo',
}: LogoMarkProps) {
  const color = resolveColor(variant)
  const sizeAttr =
    size === 'fit'
      ? {}
      : { width: (size * 80) / 86, height: size }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 86"
      role="img"
      aria-label={ariaLabel}
      className={className}
      {...sizeAttr}
      style={{ color }}
    >
      <rect x="0" y="13" width="20" height="60" fill="currentColor" />
      <rect x="30" y="0" width="20" height="86" fill="currentColor" />
      <rect x="60" y="13" width="20" height="60" fill="currentColor" />
    </svg>
  )
}

// ─── Logo — full lockup (mark + wordmark) ───────────────────────────

export function Logo({
  variant = 'default',
  size = 32,
  className = '',
  ariaLabel = 'Tempo',
}: LogoProps) {
  const color = resolveColor(variant)
  const accent = resolveAccent(variant)

  // Wordmark sizing: cap height ≈ mark height. Letters scale by font-size
  // which we set to size px so the lockup reads as a single unit.
  // Letter spacing per brief: +4% (positive tracking, all caps).
  const wordSize = size === 'fit' ? 80 : size
  const gap = wordSize * 0.5 // ~half mark width

  return (
    <span
      className={`tempo-logo-lockup ${className}`}
      role="img"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${gap * 0.18}px`, // ~9px at size=80, scales down
        color,
        lineHeight: 1,
      }}
    >
      <LogoMark variant={variant} size={size} ariaLabel="" />
      <span
        className="tempo-logo-wordmark"
        style={{
          fontFamily: 'var(--font-sans, "Inter", system-ui, sans-serif)',
          fontWeight: 700,
          fontSize: `${wordSize * 0.92}px`,
          letterSpacing: '0.04em',
          color,
          textTransform: 'uppercase',
        }}
      >
        TEMPO
        <span aria-hidden="true" style={{ color: accent }}>
          .
        </span>
      </span>
    </span>
  )
}

// ─── Legacy export alias — keeps old imports working during rollout ─

export { Logo as TempoLockup }
