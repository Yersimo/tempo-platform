/**
 * Academy Custom Domain Resolution Utility
 *
 * Helper called from the main middleware to resolve custom domain hostnames
 * to their associated academy. When a request arrives on a custom domain
 * (e.g., academy.ecobank.com), this resolves it to the correct academy
 * and org context for rendering.
 */

import { getDomainByHostname } from '@/lib/academy-domains'

const TEMPO_HOSTS = new Set([
  'localhost',
  'tempo.app',
  'www.tempo.app',
  'app.tempo.app',
  'academy.tempo.app',
])

/**
 * Resolve a custom domain hostname to its academy context.
 * Returns null if the hostname is a Tempo platform domain or not registered.
 *
 * Usage in middleware:
 * ```
 * const academyCtx = await resolveAcademyFromHost(request.headers.get('host'))
 * if (academyCtx) {
 *   // Rewrite to academy page with org/academy context
 *   request.headers.set('x-org-id', academyCtx.orgId)
 *   request.headers.set('x-academy-id', academyCtx.academyId)
 *   request.headers.set('x-academy-slug', academyCtx.slug)
 *   return NextResponse.rewrite(new URL(`/academy/${academyCtx.slug}`, request.url))
 * }
 * ```
 */
export async function resolveAcademyFromHost(
  hostname: string | null,
): Promise<{
  orgId: string
  academyId: string
  slug: string
  name: string
  domain: string
} | null> {
  if (!hostname) return null

  // Strip port if present (e.g., localhost:3002)
  const host = hostname.split(':')[0].toLowerCase()

  // Skip Tempo platform domains
  if (TEMPO_HOSTS.has(host)) return null

  // Skip IP addresses
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null

  try {
    const result = await getDomainByHostname(host)
    if (!result) return null

    return {
      orgId: result.academy.orgId,
      academyId: result.academy.id,
      slug: result.academy.slug,
      name: result.academy.name,
      domain: result.domain.domain,
    }
  } catch (error) {
    console.error('[Academy Domain Resolution]', error)
    return null
  }
}
