import { NextRequest, NextResponse } from 'next/server'

// ─── Document Text Extraction API ───────────────────────────────
// Accepts file uploads (PDF, DOCX, TXT, MD, CSV) and returns
// extracted text with detected sections/headings for course generation.

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filename = file.name
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const buffer = Buffer.from(await file.arrayBuffer())

    let extractedText = ''

    switch (ext) {
      case 'txt':
      case 'md':
      case 'csv': {
        extractedText = buffer.toString('utf-8')
        break
      }

      case 'pdf': {
        try {
          const { PDFParse } = await import('pdf-parse')
          const parser = new PDFParse({ data: new Uint8Array(buffer) })
          const result = await parser.getText()
          extractedText = result.text
        } catch (e) {
          return NextResponse.json({ error: 'Failed to parse PDF. The file may be image-based or corrupted.' }, { status: 422 })
        }
        break
      }

      case 'docx':
      case 'doc': {
        try {
          const mammoth = await import('mammoth')
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value
        } catch (e) {
          return NextResponse.json({ error: 'Failed to parse Word document.' }, { status: 422 })
        }
        break
      }

      case 'pptx': {
        // PPTX is a ZIP of XML files — extract text from slide XMLs
        try {
          const { unzipSync } = await import('fflate')
          const unzipped = unzipSync(new Uint8Array(buffer))
          const slideTexts: string[] = []
          const slideKeys = Object.keys(unzipped)
            .filter(k => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'))
            .sort()
          for (const key of slideKeys) {
            const xml = new TextDecoder().decode(unzipped[key])
            // Extract text from XML tags: <a:t>text</a:t>
            const texts = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map(m => m[1])
            if (texts.length > 0) {
              slideTexts.push(texts.join(' '))
            }
          }
          extractedText = slideTexts.join('\n\n')
        } catch (e) {
          return NextResponse.json({ error: 'Failed to parse PowerPoint file.' }, { status: 422 })
        }
        break
      }

      default:
        return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 })
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text content could be extracted from this file.' }, { status: 422 })
    }

    // Parse the text into sections
    const sections = parseIntoSections(extractedText)

    return NextResponse.json({
      filename,
      textLength: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      sections,
      fullText: extractedText.substring(0, 50000), // Cap at 50K chars
    })
  } catch (e) {
    console.error('Document parsing error:', e)
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 })
  }
}

// ─── Section Parser ─────────────────────────────────────────────
// Detects headings and splits text into logical sections
interface Section {
  heading: string
  content: string
  level: number // 1 = major, 2 = sub, 3 = minor
}

function parseIntoSections(text: string): Section[] {
  const lines = text.split('\n')
  const sections: Section[] = []
  let currentSection: Section | null = null
  let contentLines: string[] = []

  function flushSection() {
    if (currentSection) {
      currentSection.content = contentLines.join('\n').trim()
      if (currentSection.content.length > 0 || sections.length === 0) {
        sections.push(currentSection)
      }
    }
    contentLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      contentLines.push('')
      continue
    }

    // Detect headings
    let heading: string | null = null
    let level = 1

    // Markdown headings: # Heading, ## Heading, ### Heading
    const mdMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (mdMatch) {
      heading = mdMatch[2].trim()
      level = mdMatch[1].length
    }

    // Numbered headings: "1. Title", "1.1 Title", "Section 1:", "Chapter 2:"
    if (!heading) {
      const numMatch = trimmed.match(/^(\d+\.?\d*\.?\s+)([A-Z][A-Za-z\s&,\-:]+)$/)
      if (numMatch && numMatch[2].length > 3 && numMatch[2].length < 100) {
        heading = numMatch[2].trim()
        level = numMatch[0].includes('.') && /\d+\.\d+/.test(numMatch[1]) ? 2 : 1
      }
    }

    // ALL CAPS headings (at least 4 chars, no lowercase)
    if (!heading && /^[A-Z][A-Z\s&,\-:]{3,80}$/.test(trimmed) && !/[a-z]/.test(trimmed)) {
      heading = trimmed.charAt(0) + trimmed.slice(1).toLowerCase()
      level = 1
    }

    // Colon-terminated headings: "Introduction:", "Overview:", etc.
    if (!heading) {
      const colonMatch = trimmed.match(/^([A-Z][A-Za-z\s&]{2,50}):\s*$/)
      if (colonMatch) {
        heading = colonMatch[1].trim()
        level = 2
      }
    }

    // Bold/underline patterns common in extracted PDFs
    if (!heading && trimmed.length > 4 && trimmed.length < 100) {
      // Short standalone lines that look like titles (surrounded by blank lines)
      const prevEmpty = contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === ''
      const isShortLine = trimmed.length < 80 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith('.')
      if (prevEmpty && isShortLine && !/[.;,]$/.test(trimmed)) {
        // Check if it's likely a heading (not a continuation sentence)
        const wordCount = trimmed.split(/\s+/).length
        if (wordCount <= 10) {
          heading = trimmed
          level = 2
        }
      }
    }

    if (heading) {
      flushSection()
      currentSection = { heading, content: '', level }
    } else {
      contentLines.push(trimmed)
    }
  }

  // Flush remaining
  flushSection()

  // If no sections detected, create one from the whole text
  if (sections.length === 0) {
    const firstLine = text.split('\n').find(l => l.trim().length > 0) || 'Document Content'
    sections.push({
      heading: firstLine.trim().substring(0, 80),
      content: text.trim(),
      level: 1,
    })
  }

  // If only one section with lots of content, try to split by paragraphs
  if (sections.length === 1 && sections[0].content.length > 1000) {
    const paragraphs = sections[0].content.split(/\n\n+/).filter(p => p.trim().length > 50)
    if (paragraphs.length >= 3) {
      const newSections: Section[] = []
      paragraphs.forEach((p, i) => {
        const firstSentence = p.split(/[.!?]\s/)[0] || `Section ${i + 1}`
        newSections.push({
          heading: firstSentence.substring(0, 80).trim(),
          content: p.trim(),
          level: 1,
        })
      })
      return newSections
    }
  }

  return sections
}
