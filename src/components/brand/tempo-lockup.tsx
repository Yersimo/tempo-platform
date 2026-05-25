'use client'

/**
 * TempoLockup — legacy adapter that maps the old API to the new <Logo />.
 *
 * Old API:  variant 'color' | 'white' | 'mono', size 'sm' | 'md' | 'lg' | 'xl'
 * New API:  variant 'default' | 'inverse' | 'mono', size <px>
 *
 * Every existing consumer of <TempoLockup /> now renders the new
 * three-bar T + TEMPO. lockup automatically.
 */

import { Logo, type LogoVariant } from './logo'

interface TempoLockupProps {
  variant?: 'color' | 'white' | 'mono'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = { sm: 16, md: 20, lg: 26, xl: 36 } as const

const VARIANT_MAP: Record<NonNullable<TempoLockupProps['variant']>, LogoVariant> = {
  color: 'inverse', // old 'color' meant dark-on-light → inverse in new system
  white: 'default', // old 'white' meant white-on-dark → default
  mono: 'mono',
}

export function TempoLockup({
  variant = 'color',
  size = 'md',
  className = '',
}: TempoLockupProps) {
  return (
    <span className={className}>
      <Logo variant={VARIANT_MAP[variant]} size={SIZE_MAP[size]} />
    </span>
  )
}
