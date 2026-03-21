import { NextRequest, NextResponse } from 'next/server'
import { extractReceiptData } from '@/lib/services/receipt-ocr'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageData } = body

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'imageData (base64 or URL) is required' },
        { status: 400 },
      )
    }

    const result = await extractReceiptData(imageData)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[receipt-ocr] API error:', err)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 },
    )
  }
}
