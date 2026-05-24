/**
 * Receipt Extraction (Claude Vision)
 *
 * Takes a base64 receipt image and returns structured data: vendor,
 * amount, currency, date, tax. Plus a confidence score and quality
 * assessment.
 *
 * Used by /api/expenses/scan as the first step of the 8-second flow.
 */

import { inferWithVision } from '@/lib/ai/inference-client'

export interface ExtractedReceipt {
  vendor: string | null
  amount: number | null // in cents
  currency: string | null // ISO 4217
  date: string | null // ISO 8601
  taxAmount: number | null // in cents
  taxType: 'VAT' | 'sales_tax' | 'GST' | null
  paymentMethod: string | null // "card_****1234", "cash"
  lineItems: Array<{ name: string; quantity: number; unitPrice: number }>
  /** Heuristic quality assessment from the vision model */
  receiptQuality: 'clear' | 'partial' | 'unclear'
  /** Overall extraction confidence */
  confidence: number
  /** Any fields the model flagged as uncertain */
  flaggedFields: string[]
  /** Location info if extractable from receipt */
  location: { city?: string; country?: string } | null
}

const EXTRACTION_PROMPT = `You are extracting expense data from a receipt image. Return ONLY a valid JSON object (no markdown, no commentary).

Required JSON schema:
{
  "vendor": string | null,
  "amount": number (in the smallest currency unit, e.g. cents/kobo/pesewa) | null,
  "currency": ISO 4217 code (e.g. "USD", "NGN", "GHS", "KES", "ZAR") | null,
  "date": ISO 8601 timestamp | null,
  "tax_amount": number (smallest unit) | null,
  "tax_type": "VAT" | "sales_tax" | "GST" | null,
  "payment_method": string | null,
  "line_items": [{"name": string, "quantity": number, "unit_price": number}],
  "receipt_quality": "clear" | "partial" | "unclear",
  "confidence": number (0.0-1.0),
  "flagged_fields": string[] (fields you were uncertain about),
  "location": {"city": string | null, "country": string | null} | null
}

CRITICAL RULES:
- Do NOT invent fields. If a field is unclear or missing, return null for it.
- "amount" must be in the smallest currency unit. ₦18,400 → 1840000 kobo. $12.30 → 1230 cents.
- "currency" must be inferred from the receipt language/symbols/country. Don't default to USD.
- If the receipt is for alcohol, gambling, or restricted items, note in flagged_fields.
- "confidence" reflects your overall certainty. Receipt blurry/partial → lower confidence.
- Return ONLY the JSON object. No prose, no markdown fences.`

export async function extractReceipt(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<ExtractedReceipt> {
  let raw: string
  try {
    raw = await inferWithVision(
      EXTRACTION_PROMPT,
      { type: 'base64', data: imageBase64, mediaType },
      { maxTokens: 800, temperature: 0 },
    )
  } catch (err) {
    // If AI is unavailable, return an empty extraction that will route to
    // human input. Never fail the snap flow.
    void err
    return emptyExtraction('AI service unavailable')
  }

  return parseExtraction(raw)
}

function parseExtraction(raw: string): ExtractedReceipt {
  try {
    // Strip markdown fences if Claude wrapped (rare with temp=0)
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    return {
      vendor: asStringOrNull(parsed.vendor),
      amount: asNumberOrNull(parsed.amount),
      currency: asStringOrNull(parsed.currency),
      date: asStringOrNull(parsed.date),
      taxAmount: asNumberOrNull(parsed.tax_amount),
      taxType: asTaxType(parsed.tax_type),
      paymentMethod: asStringOrNull(parsed.payment_method),
      lineItems: asLineItems(parsed.line_items),
      receiptQuality: asReceiptQuality(parsed.receipt_quality),
      confidence: clamp(asNumberOrNull(parsed.confidence) ?? 0.5, 0, 1),
      flaggedFields: asStringArray(parsed.flagged_fields),
      location: asLocation(parsed.location),
    }
  } catch {
    return emptyExtraction('Could not parse AI response')
  }
}

function emptyExtraction(reason: string): ExtractedReceipt {
  return {
    vendor: null,
    amount: null,
    currency: null,
    date: null,
    taxAmount: null,
    taxType: null,
    paymentMethod: null,
    lineItems: [],
    receiptQuality: 'unclear',
    confidence: 0,
    flaggedFields: [reason],
    location: null,
  }
}

// ─── Type-safe coercion helpers ──────────────────────────────────────
function asStringOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}
function asNumberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function asTaxType(v: unknown): ExtractedReceipt['taxType'] {
  return v === 'VAT' || v === 'sales_tax' || v === 'GST' ? v : null
}
function asReceiptQuality(v: unknown): ExtractedReceipt['receiptQuality'] {
  return v === 'clear' || v === 'partial' || v === 'unclear' ? v : 'unclear'
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}
function asLineItems(v: unknown): ExtractedReceipt['lineItems'] {
  if (!Array.isArray(v)) return []
  return v
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      return {
        name: asStringOrNull(obj.name) ?? '',
        quantity: asNumberOrNull(obj.quantity) ?? 1,
        unitPrice: asNumberOrNull(obj.unit_price) ?? 0,
      }
    })
    .filter((x): x is { name: string; quantity: number; unitPrice: number } => x !== null && x.name !== '')
}
function asLocation(v: unknown): ExtractedReceipt['location'] {
  if (typeof v !== 'object' || v === null) return null
  const obj = v as Record<string, unknown>
  const city = asStringOrNull(obj.city)
  const country = asStringOrNull(obj.country)
  if (!city && !country) return null
  return {
    city: city ?? undefined,
    country: country ?? undefined,
  }
}
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
