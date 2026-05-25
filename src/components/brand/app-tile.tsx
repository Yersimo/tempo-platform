/**
 * AppTile — the module launcher tile.
 *
 * 64×64 deep-teal tile with a brand-accent icon centered.
 * Hover lifts the tile slightly + lightens the background.
 * Tile label sits below in secondary text token.
 *
 * Per iconography spec §App-grid icons.
 */

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Icon } from './icon'

interface AppTileProps {
  /** Lucide icon to render inside the tile */
  icon: LucideIcon
  /** Label displayed below the tile */
  label: string
  /** Optional href — renders as link, otherwise renders as button */
  href?: string
  /** Optional click handler when href isn't used */
  onClick?: () => void
  /** Override tile size (default 64) */
  size?: number
  className?: string
}

export function AppTile({
  icon,
  label,
  href,
  onClick,
  size = 64,
  className = '',
}: AppTileProps) {
  // Interior icon = ~40% of tile width per spec
  const iconSize = Math.round(size * 0.4)

  const tile = (
    <span
      className="tempo-app-tile"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon as={icon} size={iconSize} strokeWidth={2} />
    </span>
  )

  const labelEl = (
    <span
      className="tempo-app-tile-label"
      style={{
        display: 'block',
        marginTop: 8,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        letterSpacing: '-0.005em',
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
  )

  const inner = (
    <>
      {tile}
      {labelEl}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className={`tempo-app-tile-wrap ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          maxWidth: size + 24,
        }}
        aria-label={label}
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`tempo-app-tile-wrap ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        maxWidth: size + 24,
        fontFamily: 'inherit',
      }}
      aria-label={label}
    >
      {inner}
    </button>
  )
}
