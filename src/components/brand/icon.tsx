/**
 * Tempo Icon System
 *
 * Single disciplined icon system across the platform:
 *   1. <Icon /> — lucide-react wrapper with constrained sizes + currentColor
 *   2. <AIMark /> — three-bar mark, center bar lit (replaces sparkles/orb)
 *   3. <LoadingMark /> — animated equalizer (replaces all generic spinners)
 *   4. <EmptyStateMark /> — quiet T silhouette for empty states
 *
 * Per BRAND.md Part IV + iconography spec.
 * Tokens — never hardcode hex.
 */

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'

// ─── Size scale — six discrete tokens, never off-scale ──────────────

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number

export const ICON_SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
  xs: 12,  // badge interiors, dense table cells
  sm: 16,  // button leading, input field, list rows
  md: 20,  // sidebar nav, default UI chrome
  lg: 24,  // page header, primary buttons
  xl: 32,  // feature cards, stat cards
  '2xl': 48, // empty states, hero
}

function resolveSize(size: IconSize): number {
  return typeof size === 'number' ? size : ICON_SIZE_MAP[size]
}

// ─── <Icon /> — lucide-react wrapper ────────────────────────────────

interface IconProps {
  /** A lucide-react icon component (imported by the caller) */
  as: LucideIcon
  size?: IconSize
  /** Override stroke width. Default 1.5px (matches platform default). */
  strokeWidth?: number
  /** ARIA label — set when icon is the only label */
  ariaLabel?: string
  className?: string
}

export function Icon({
  as: LucideIconComponent,
  size = 'md',
  strokeWidth = 1.5,
  ariaLabel,
  className = '',
}: IconProps) {
  const px = resolveSize(size)
  return (
    <LucideIconComponent
      size={px}
      strokeWidth={strokeWidth}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  )
}

// ─── <AIMark /> — three bars, center lit in brand accent ────────────
// Replaces the sparkle / gradient orb iconography across the platform.

interface AIMarkProps {
  size?: IconSize
  ariaLabel?: string
  className?: string
}

export function AIMark({ size = 'md', ariaLabel = 'Tempo AI', className = '' }: AIMarkProps) {
  const px = resolveSize(size)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <rect x="3" y="8" width="3" height="8" fill="currentColor" opacity="0.4" />
      <rect x="10.5" y="4" width="3" height="16" fill="var(--color-brand-accent, currentColor)" />
      <rect x="18" y="8" width="3" height="8" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// ─── <LoadingMark /> — three-bar equalizer ──────────────────────────
// Replaces every generic spinner. Animated via CSS in globals.

interface LoadingMarkProps {
  size?: IconSize
  ariaLabel?: string
  className?: string
}

export function LoadingMark({
  size = 'md',
  ariaLabel = 'Loading',
  className = '',
}: LoadingMarkProps) {
  const px = resolveSize(size)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      role="status"
      aria-label={ariaLabel}
      className={`tempo-loading-mark ${className}`}
    >
      <rect x="4" y="8" width="3" height="8" fill="var(--color-brand-accent, currentColor)" className="tempo-loading-bar tempo-loading-bar-1" />
      <rect x="10.5" y="6" width="3" height="12" fill="var(--color-brand-accent, currentColor)" className="tempo-loading-bar tempo-loading-bar-2" />
      <rect x="17" y="8" width="3" height="8" fill="var(--color-brand-accent, currentColor)" className="tempo-loading-bar tempo-loading-bar-3" />
    </svg>
  )
}

// ─── <EmptyStateMark /> — quiet T silhouette ────────────────────────

interface EmptyStateMarkProps {
  size?: IconSize
  ariaLabel?: string
  className?: string
}

export function EmptyStateMark({
  size = '2xl',
  ariaLabel = '',
  className = '',
}: EmptyStateMarkProps) {
  const px = resolveSize(size)
  // Use same geometry as the T mark but in --color-text-tertiary
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 86"
      width={px * 0.93}
      height={px}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      className={className}
      style={{ color: 'var(--color-text-tertiary, currentColor)' }}
    >
      <rect x="0" y="13" width="20" height="60" fill="currentColor" />
      <rect x="30" y="0" width="20" height="86" fill="currentColor" />
      <rect x="60" y="13" width="20" height="60" fill="currentColor" />
    </svg>
  )
}
