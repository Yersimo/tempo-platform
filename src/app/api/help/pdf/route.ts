import { NextRequest, NextResponse } from 'next/server'
import { loadDoc } from '@/lib/docs/registry'
import { generateModulePdf } from '@/lib/docs/pdf/generate-module-pdf'

// ─── GET /api/help/pdf?module={slug} ────────────────────────────────────────
// Generates and serves a downloadable PDF user guide for the specified module.
// Returns 400 if the module query param is missing, 404 if no documentation
// exists for the given slug, or the PDF bytes with proper content headers.

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const slug = url.searchParams.get('module')

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required query parameter: module' },
        { status: 400 },
      )
    }

    // Load the module documentation from the registry
    const moduleDoc = await loadDoc(slug)

    if (!moduleDoc) {
      return NextResponse.json(
        { error: `No documentation found for module: ${slug}` },
        { status: 404 },
      )
    }

    // Generate the PDF
    const pdfBytes = await generateModulePdf(moduleDoc)

    // Sanitize slug for filename
    const safeSlug = slug.replace(/[^a-zA-Z0-9-]/g, '-')
    const filename = `tempo-${safeSlug}-guide.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[GET /api/help/pdf] Error generating PDF:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate documentation PDF' },
      { status: 500 },
    )
  }
}
