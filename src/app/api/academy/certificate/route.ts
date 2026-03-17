/**
 * Academy Certificate API
 *
 * GET  ?action=preview  — Returns HTML preview of a certificate
 * GET  ?action=download — Returns PDF file for download
 * POST ?action=generate — Generates PDF, updates certificateUrl in DB, returns URL
 * POST ?action=issue    — Generates + issues certificate (status -> earned, sets issuedAt)
 *
 * Requires: certificateId OR (academyId + participantId)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import {
  getAcademyCertificates,
  getAcademyById,
  getParticipantById,
  issueAcademyCertificate,
} from '@/lib/academy-engine'
import {
  generateCertificatePDF,
  generateCertificateHTML,
  type CertificateData,
} from '@/lib/academy-certificate-generator'

// ============================================================
// HELPERS
// ============================================================

interface CertificateRecord {
  id: string
  orgId: string
  academyId: string
  participantId: string
  name: string
  certificateNumber: string
  certificateUrl: string | null
  status: string
  requirements: unknown
  issuedAt: Date | null
  createdAt: Date
}

/**
 * Resolve a certificate record from either certificateId or (academyId + participantId).
 */
async function resolveCertificate(
  orgId: string,
  certificateId?: string | null,
  academyId?: string | null,
  participantId?: string | null,
): Promise<CertificateRecord | null> {
  if (certificateId) {
    const [row] = await db.select().from(schema.academyCertificates)
      .where(and(
        eq(schema.academyCertificates.id, certificateId),
        eq(schema.academyCertificates.orgId, orgId),
      ))
    return (row as CertificateRecord) || null
  }

  if (academyId && participantId) {
    const [row] = await db.select().from(schema.academyCertificates)
      .where(and(
        eq(schema.academyCertificates.orgId, orgId),
        eq(schema.academyCertificates.academyId, academyId),
        eq(schema.academyCertificates.participantId, participantId),
      ))
    return (row as CertificateRecord) || null
  }

  return null
}

/**
 * Build CertificateData from DB records.
 */
async function buildCertificateData(
  orgId: string,
  cert: CertificateRecord,
): Promise<CertificateData> {
  const [academy, participant] = await Promise.all([
    getAcademyById(orgId, cert.academyId),
    getParticipantById(orgId, cert.participantId),
  ])

  return {
    academyName: academy?.name || 'Academy',
    certificateName: cert.name || 'Certificate of Completion',
    participantName: participant?.fullName || 'Participant',
    certificateNumber: cert.certificateNumber,
    issuedAt: cert.issuedAt || new Date(),
    brandColor: (academy as any)?.brandColor || '#2563eb',
    logoUrl: (academy as any)?.logoUrl || undefined,
    academyDescription: (academy as any)?.description || undefined,
  }
}

// ============================================================
// GET — preview (HTML) or download (PDF)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'preview'
    const certificateId = url.searchParams.get('certificateId')
    const academyId = url.searchParams.get('academyId')
    const participantId = url.searchParams.get('participantId')

    const cert = await resolveCertificate(orgId, certificateId, academyId, participantId)
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const certData = await buildCertificateData(orgId, cert)

    switch (action) {
      case 'preview': {
        const html = generateCertificateHTML(certData)
        return new NextResponse(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      case 'download': {
        const pdfBuffer = await generateCertificatePDF(certData)
        const filename = `certificate-${cert.certificateNumber}.pdf`
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(pdfBuffer.length),
          },
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[academy/certificate] GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

// ============================================================
// POST — generate or issue
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, certificateId, academyId, participantId } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required (generate | issue)' }, { status: 400 })
    }

    const cert = await resolveCertificate(orgId, certificateId, academyId, participantId)
    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const certData = await buildCertificateData(orgId, cert)

    switch (action) {
      case 'generate': {
        // Generate PDF and build a data URL (or in production, upload to S3)
        const pdfBuffer = await generateCertificatePDF(certData)

        // Store as a base64 data URL for now; in production this would go to S3/uploads
        const base64 = pdfBuffer.toString('base64')
        const certificateUrl = `data:application/pdf;base64,${base64}`

        // Update the certificate record with the URL
        const [updated] = await db.update(schema.academyCertificates).set({
          certificateUrl,
        }).where(and(
          eq(schema.academyCertificates.id, cert.id),
          eq(schema.academyCertificates.orgId, orgId),
        )).returning()

        return NextResponse.json({
          data: updated,
          message: 'Certificate PDF generated successfully',
          // Also return a download endpoint for convenience
          downloadUrl: `/api/academy/certificate?action=download&certificateId=${cert.id}`,
          previewUrl: `/api/academy/certificate?action=preview&certificateId=${cert.id}`,
        })
      }

      case 'issue': {
        // Generate PDF
        const pdfBuffer = await generateCertificatePDF(certData)

        // Build download URL (relative — the actual PDF is served via the download action)
        const downloadUrl = `/api/academy/certificate?action=download&certificateId=${cert.id}`

        // Issue the certificate (sets status = 'earned', issuedAt = now)
        const issued = await issueAcademyCertificate(orgId, cert.id, downloadUrl)

        if (!issued) {
          return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 })
        }

        return NextResponse.json({
          data: issued,
          message: 'Certificate issued successfully',
          downloadUrl,
          previewUrl: `/api/academy/certificate?action=preview&certificateId=${cert.id}`,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[academy/certificate] POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
