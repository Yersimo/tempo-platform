import { NextRequest, NextResponse } from 'next/server'
import {
  importScormPackage,
  getScormPackage,
  getScormPackages,
  deleteScormPackage,
  initScormAttempt,
  updateScormData,
  getScormAttempt,
  getParticipantAttempts,
} from '@/lib/academy-scorm'

// GET /api/academy/scorm?action=...
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list-packages'
    const academyId = url.searchParams.get('academyId') || ''
    const packageId = url.searchParams.get('packageId') || ''
    const attemptId = url.searchParams.get('attemptId') || ''
    const participantId = url.searchParams.get('participantId') || ''

    switch (action) {
      case 'list-packages': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const packages = await getScormPackages(orgId, academyId)
        return NextResponse.json({ data: packages })
      }

      case 'get-package': {
        if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })
        const pkg = await getScormPackage(orgId, packageId)
        if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: pkg })
      }

      case 'get-attempt': {
        if (!attemptId) return NextResponse.json({ error: 'attemptId required' }, { status: 400 })
        const attempt = await getScormAttempt(orgId, attemptId)
        if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: attempt })
      }

      case 'launch': {
        if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })
        if (!participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })

        const pkg = await getScormPackage(orgId, packageId)
        if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })
        if (pkg.status !== 'ready') {
          return NextResponse.json({ error: 'Package not ready' }, { status: 400 })
        }

        const attempt = await initScormAttempt(orgId, packageId, participantId)

        return NextResponse.json({
          data: {
            launchUrl: pkg.launchUrl ? `${pkg.packageUrl}/${pkg.launchUrl}` : pkg.packageUrl,
            packageUrl: pkg.packageUrl,
            attemptId: attempt.id,
            cmiData: attempt.cmiData,
            scormVersion: pkg.version,
          },
        })
      }

      case 'participant-attempts': {
        if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })
        if (!participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        const attempts = await getParticipantAttempts(orgId, packageId, participantId)
        return NextResponse.json({ data: attempts })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('[SCORM API GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/academy/scorm
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const action = body.action as string

    switch (action) {
      case 'import': {
        const { academyId, packageUrl, manifestXml, courseId } = body
        if (!academyId || !packageUrl || !manifestXml) {
          return NextResponse.json(
            { error: 'academyId, packageUrl, and manifestXml are required' },
            { status: 400 },
          )
        }
        const result = await importScormPackage(orgId, academyId, packageUrl, manifestXml, courseId)
        return NextResponse.json({ data: result })
      }

      case 'save-progress': {
        const { attemptId, cmiData } = body
        if (!attemptId || !cmiData) {
          return NextResponse.json({ error: 'attemptId and cmiData required' }, { status: 400 })
        }
        const result = await updateScormData(orgId, attemptId, cmiData)
        if (!result.success) {
          return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
        }
        return NextResponse.json({ data: result.attempt })
      }

      case 'init-attempt': {
        const { packageId, participantId } = body
        if (!packageId || !participantId) {
          return NextResponse.json({ error: 'packageId and participantId required' }, { status: 400 })
        }
        const attempt = await initScormAttempt(orgId, packageId, participantId)
        return NextResponse.json({ data: attempt })
      }

      case 'delete': {
        const { packageId } = body
        if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })
        const deleted = await deleteScormPackage(orgId, packageId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('[SCORM API POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
