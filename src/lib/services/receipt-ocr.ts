/**
 * Receipt OCR Service -- Uses Claude Vision API to extract structured data
 * from receipt images (S3 URLs or base64). Falls back gracefully on error.
 */

import Anthropic from '@anthropic-ai/sdk'

// ---- Types ----

export interface ReceiptOCRResult {
  vendor: string | null
  amount: number | null // in cents
  currency: string | null
  date: string | null // ISO date string
  category: string | null // travel, meals, office, etc.
  description: string | null
  taxAmount: number | null // tax amount in cents
  confidence: number // 0-1 confidence score
  rawText: string // full extracted text
}

// ---- Claude Client (lazy init) ----

let _client: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!_client && process.env.ANTHROPIC_API_KEY) {
    _client = new Anthropic()
  }
  return _client
}

// ---- Prompt ----

const RECEIPT_EXTRACTION_PROMPT = `You are a receipt data extraction system. Analyze the provided receipt image and extract the following fields. Be precise with amounts -- always interpret them as the final charged amounts.

Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "vendor": "Store or business name",
  "amount": 1234,
  "currency": "USD",
  "date": "2025-01-15",
  "description": "Brief description of purchase",
  "taxAmount": 56,
  "rawText": "Full text visible on the receipt",
  "confidence": 0.95
}

Rules:
- "amount" must be in cents (e.g., $12.34 = 1234). This is the total amount including tax.
- "taxAmount" must be in cents. If no tax line is visible, set to null.
- "currency" should be a 3-letter ISO code. Default to "USD" if unclear.
- "date" must be ISO format (YYYY-MM-DD). If the year is ambiguous, assume the most recent year.
- "confidence" is your self-assessed confidence from 0.0 to 1.0 in the accuracy of the extraction.
- If a field cannot be determined, set it to null.
- "rawText" should contain all readable text from the receipt, preserving line breaks with \\n.`

// ---- Category Rules ----

interface CategoryRule {
  category: string
  keywords: string[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'travel',
    keywords: [
      'airline', 'airlines', 'airways', 'flight', 'hotel', 'motel', 'inn',
      'marriott', 'hilton', 'hyatt', 'airbnb', 'uber', 'lyft', 'taxi',
      'cab', 'rental car', 'hertz', 'avis', 'enterprise', 'amtrak',
      'train', 'transit', 'parking', 'toll', 'delta', 'united', 'american airlines',
      'southwest', 'jetblue', 'spirit', 'frontier', 'booking.com', 'expedia',
    ],
  },
  {
    category: 'meals',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'dunkin', 'mcdonald',
      'burger', 'pizza', 'sushi', 'thai', 'chinese', 'mexican', 'italian',
      'diner', 'bistro', 'grill', 'bar', 'pub', 'food', 'catering',
      'doordash', 'grubhub', 'uber eats', 'postmates', 'seamless',
      'chipotle', 'subway', 'panera', 'chick-fil-a', 'wendy', 'taco bell',
      'bakery', 'deli', 'lunch', 'dinner', 'breakfast', 'snack',
    ],
  },
  {
    category: 'office',
    keywords: [
      'office supplies', 'staples', 'office depot', 'officemax', 'paper',
      'printer', 'ink', 'toner', 'pens', 'notebooks', 'filing', 'envelopes',
      'stamps', 'postage', 'fedex', 'ups', 'shipping', 'usps',
      'furniture', 'desk', 'chair', 'monitor', 'keyboard', 'mouse',
    ],
  },
  {
    category: 'software',
    keywords: [
      'software', 'subscription', 'saas', 'license', 'cloud', 'aws',
      'azure', 'google cloud', 'heroku', 'vercel', 'netlify', 'github',
      'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'zoom',
      'microsoft 365', 'office 365', 'adobe', 'figma', 'notion',
      'dropbox', 'google workspace', 'salesforce', 'hubspot',
    ],
  },
  {
    category: 'telecom',
    keywords: [
      'phone', 'mobile', 'cellular', 'verizon', 'at&t', 'att', 't-mobile',
      'sprint', 'internet', 'broadband', 'wifi', 'hotspot', 'data plan',
    ],
  },
  {
    category: 'utilities',
    keywords: [
      'electric', 'electricity', 'gas', 'water', 'sewage', 'utility',
      'power', 'energy', 'heating', 'cooling',
    ],
  },
  {
    category: 'professional_services',
    keywords: [
      'consulting', 'legal', 'attorney', 'lawyer', 'accounting', 'audit',
      'tax preparation', 'advisory', 'recruitment', 'staffing', 'training',
      'coaching', 'freelance', 'contractor',
    ],
  },
  {
    category: 'marketing',
    keywords: [
      'advertising', 'marketing', 'promotion', 'google ads', 'facebook ads',
      'meta ads', 'linkedin ads', 'print shop', 'signage', 'banner',
      'business cards', 'brochure', 'flyer', 'event', 'conference',
      'sponsorship', 'trade show',
    ],
  },
  {
    category: 'equipment',
    keywords: [
      'laptop', 'computer', 'tablet', 'ipad', 'macbook', 'lenovo', 'dell',
      'hp', 'hardware', 'server', 'network', 'router', 'switch', 'cable',
      'headset', 'webcam', 'projector', 'scanner', 'copier',
    ],
  },
]

// ---- Public API ----

/**
 * Categorize an expense using rules-based keyword matching.
 * No API call required. Returns null if no category matches.
 */
export function categorizeExpense(
  description: string,
  vendor: string,
): string | null {
  const text = `${vendor} ${description}`.toLowerCase()

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return rule.category
      }
    }
  }

  return null
}

/**
 * Extract structured receipt data from an image using Claude Vision.
 *
 * @param imageUrl - An S3/HTTPS URL or a base64-encoded image
 *   (with or without the data URI prefix).
 * @returns Parsed receipt data with confidence score.
 */
export async function extractReceiptData(
  imageUrl: string,
): Promise<ReceiptOCRResult> {
  const emptyResult: ReceiptOCRResult = {
    vendor: null,
    amount: null,
    currency: null,
    date: null,
    category: null,
    description: null,
    taxAmount: null,
    confidence: 0,
    rawText: '',
  }

  const client = getClient()
  if (!client) {
    console.warn('[receipt-ocr] Anthropic client unavailable (missing API key)')
    return emptyResult
  }

  try {
    const imageContent = buildImageContent(imageUrl)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: RECEIPT_EXTRACTION_PROMPT },
          ],
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      console.warn('[receipt-ocr] No text block in Claude response')
      return emptyResult
    }

    const parsed = parseExtractionResponse(textBlock.text)

    // Layer on rules-based categorization
    parsed.category = categorizeExpense(
      parsed.description ?? '',
      parsed.vendor ?? '',
    )

    return parsed
  } catch (err) {
    console.error('[receipt-ocr] Claude Vision API error:', err)
    return emptyResult
  }
}

// ---- Internal Helpers ----

type ImageContentBlock =
  | {
      type: 'image'
      source: {
        type: 'url'
        url: string
      }
    }
  | {
      type: 'image'
      source: {
        type: 'base64'
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        data: string
      }
    }

/**
 * Build the image content block for the Claude API.
 * Detects whether the input is a URL or base64 data.
 */
function buildImageContent(imageUrl: string): ImageContentBlock {
  // Handle data URIs: "data:image/png;base64,iVBOR..."
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:(image\/(jpeg|png|gif|webp));base64,(.+)$/)
    if (match) {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: match[3],
        },
      }
    }
    // Fallback: treat the whole thing as base64 JPEG
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: imageUrl.replace(/^data:[^;]+;base64,/, ''),
      },
    }
  }

  // Raw base64 string (no URL prefix, no data URI)
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    const mediaType = inferMediaType(imageUrl)
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: imageUrl,
      },
    }
  }

  // HTTPS / S3 URL
  return {
    type: 'image',
    source: {
      type: 'url',
      url: imageUrl,
    },
  }
}

/**
 * Try to infer MIME type from the first few bytes of base64 data.
 * Falls back to JPEG.
 */
function inferMediaType(
  base64Data: string,
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  // PNG starts with iVBOR
  if (base64Data.startsWith('iVBOR')) return 'image/png'
  // GIF starts with R0lGOD
  if (base64Data.startsWith('R0lGOD')) return 'image/gif'
  // WEBP starts with UklGR
  if (base64Data.startsWith('UklGR')) return 'image/webp'
  // Default to JPEG
  return 'image/jpeg'
}

/**
 * Parse the JSON response from Claude into a ReceiptOCRResult.
 * Handles minor formatting issues (markdown fences, trailing commas).
 */
function parseExtractionResponse(raw: string): ReceiptOCRResult {
  const emptyResult: ReceiptOCRResult = {
    vendor: null,
    amount: null,
    currency: null,
    date: null,
    category: null,
    description: null,
    taxAmount: null,
    confidence: 0,
    rawText: '',
  }

  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim()
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

    const data = JSON.parse(cleaned)

    return {
      vendor: typeof data.vendor === 'string' ? data.vendor : null,
      amount: typeof data.amount === 'number' ? Math.round(data.amount) : null,
      currency: typeof data.currency === 'string' ? data.currency.toUpperCase() : null,
      date: typeof data.date === 'string' ? normalizeDate(data.date) : null,
      category: null, // will be set by categorizeExpense after parsing
      description: typeof data.description === 'string' ? data.description : null,
      taxAmount: typeof data.taxAmount === 'number' ? Math.round(data.taxAmount) : null,
      confidence: typeof data.confidence === 'number'
        ? Math.max(0, Math.min(1, data.confidence))
        : 0,
      rawText: typeof data.rawText === 'string' ? data.rawText : '',
    }
  } catch (err) {
    console.warn('[receipt-ocr] Failed to parse Claude response as JSON:', err)
    // If parsing fails, try to salvage the raw text at least
    return {
      ...emptyResult,
      rawText: raw,
      confidence: 0.1,
    }
  }
}

/**
 * Normalize a date string to ISO format (YYYY-MM-DD).
 * Returns null if the date is invalid.
 */
function normalizeDate(dateStr: string): string | null {
  try {
    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const d = new Date(dateStr + 'T00:00:00Z')
      if (isNaN(d.getTime())) return null
      return dateStr
    }

    // Try common US format: MM/DD/YYYY or M/D/YYYY
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
    if (usMatch) {
      const month = usMatch[1].padStart(2, '0')
      const day = usMatch[2].padStart(2, '0')
      let year = usMatch[3]
      if (year.length === 2) {
        year = (parseInt(year, 10) > 50 ? '19' : '20') + year
      }
      const iso = `${year}-${month}-${day}`
      const d = new Date(iso + 'T00:00:00Z')
      if (isNaN(d.getTime())) return null
      return iso
    }

    // Fallback: let Date.parse try
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split('T')[0]
  } catch {
    return null
  }
}
