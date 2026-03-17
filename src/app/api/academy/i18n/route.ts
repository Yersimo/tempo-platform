import { NextRequest, NextResponse } from 'next/server'
import {
  setTranslation,
  getTranslation,
  getTranslations,
  getTranslatedEntity,
  bulkSetTranslations,
  deleteTranslations,
  getSupportedLanguages,
  getAcademyTranslations,
} from '@/lib/academy-i18n'

// GET /api/academy/i18n?action=...
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'supported-languages'
    const academyId = url.searchParams.get('academyId') || ''
    const entityType = url.searchParams.get('entityType') || ''
    const entityId = url.searchParams.get('entityId') || ''
    const language = url.searchParams.get('language') || ''
    const field = url.searchParams.get('field') || ''

    switch (action) {
      case 'supported-languages': {
        return NextResponse.json({ data: getSupportedLanguages() })
      }

      case 'get-translation': {
        if (!academyId || !entityType || !entityId || !field || !language) {
          return NextResponse.json(
            { error: 'academyId, entityType, entityId, field, and language are required' },
            { status: 400 },
          )
        }
        const value = await getTranslation(orgId, academyId, entityType, entityId, field, language)
        return NextResponse.json({ data: { value } })
      }

      case 'get-translations': {
        if (!academyId || !entityType || !entityId) {
          return NextResponse.json(
            { error: 'academyId, entityType, and entityId are required' },
            { status: 400 },
          )
        }
        const translations = await getTranslations(orgId, academyId, entityType, entityId)
        return NextResponse.json({ data: translations })
      }

      case 'get-translated-entity': {
        if (!academyId || !entityType || !entityId || !language) {
          return NextResponse.json(
            { error: 'academyId, entityType, entityId, and language are required' },
            { status: 400 },
          )
        }
        const entity = await getTranslatedEntity(orgId, academyId, entityType, entityId, language)
        return NextResponse.json({ data: entity })
      }

      case 'academy-translations': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        const translations = await getAcademyTranslations(orgId, academyId, language || undefined)
        return NextResponse.json({ data: translations })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('[Academy i18n API GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/academy/i18n
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const action = body.action as string

    switch (action) {
      case 'set-translation': {
        const { academyId, entityType, entityId, field, language, value } = body
        if (!academyId || !entityType || !entityId || !field || !language || value === undefined) {
          return NextResponse.json(
            { error: 'academyId, entityType, entityId, field, language, and value are required' },
            { status: 400 },
          )
        }
        const result = await setTranslation(orgId, academyId, entityType, entityId, field, language, value)
        return NextResponse.json({ data: result })
      }

      case 'bulk-set': {
        const { academyId, translations } = body
        if (!academyId || !translations || !Array.isArray(translations)) {
          return NextResponse.json(
            { error: 'academyId and translations[] are required' },
            { status: 400 },
          )
        }
        const result = await bulkSetTranslations(orgId, academyId, translations)
        return NextResponse.json({ data: result })
      }

      case 'delete-translations': {
        const { academyId, entityType, entityId } = body
        if (!academyId || !entityType || !entityId) {
          return NextResponse.json(
            { error: 'academyId, entityType, and entityId are required' },
            { status: 400 },
          )
        }
        const count = await deleteTranslations(orgId, academyId, entityType, entityId)
        return NextResponse.json({ data: { deleted: count } })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('[Academy i18n API POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
