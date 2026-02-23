import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/ai -- Proxy to Anthropic Claude for AI-enhanced insights
// ---------------------------------------------------------------------------

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

// Simple in-memory rate limiter: 10 requests / minute per org
const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(orgId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(orgId)
  if (!entry || now > entry.resetAt) {
    rateMap.set(orgId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

// System prompts tailored per action
const SYSTEM_BASE = `You are Tempo AI, the intelligence engine for Tempo -- a unified workforce platform serving Ecobank, Africa's largest pan-continental bank (14,000+ employees, 33 countries). You provide concise, data-driven HR analytics insights. Be precise, professional, and actionable. Never use em dashes. Use short paragraphs.`

const ACTION_PROMPTS: Record<string, string> = {
  enhanceNarrative: `${SYSTEM_BASE}

Generate an executive summary narrative from the provided workforce data. Include: headcount trends, performance highlights, compensation insights, and recommended actions. Keep it under 200 words. Return JSON: { "summary": "...", "bulletPoints": ["...", "..."] }`,

  enhanceSentiment: `${SYSTEM_BASE}

Analyze the sentiment of the provided employee feedback items. For each, assess positive/negative/neutral tone and identify themes. Return JSON: { "positive": number (0-100), "negative": number (0-100), "neutral": number (0-100), "themes": ["theme1", "theme2"], "summary": "..." }`,

  enhanceGoalScore: `${SYSTEM_BASE}

Evaluate the provided goal against SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound). Score each factor 0-100 and give an overall score. Provide specific improvement suggestions. Return JSON: { "value": number (0-100), "label": "Strong|Moderate|Needs improvement", "breakdown": [{ "factor": "Specific", "score": number, "weight": 0.25 }, ...], "trend": "stable", "suggestions": "..." }`,

  enhanceBiasDetection: `${SYSTEM_BASE}

Analyze the provided performance review data for rating bias patterns. Look for: central tendency (clustering around middle), leniency/severity bias, recency bias, halo effect, demographic patterns. Return JSON array: [{ "id": "ai-bias-...", "category": "anomaly", "severity": "warning"|"critical"|"info", "title": "...", "description": "...", "confidence": "high"|"medium"|"low", "confidenceScore": number, "suggestedAction": "...", "module": "performance" }]`,

  enhanceCareerPath: `${SYSTEM_BASE}

Given the employee profile (role, level, tenure, skills, performance ratings), suggest 2-3 career progression paths. Consider lateral moves, promotions, and skill development. Return JSON array: [{ "id": "ai-career-...", "title": "...", "rationale": "...", "impact": "high"|"medium"|"low", "effort": "low"|"medium"|"high", "category": "career" }]`,

  enhanceQuery: `${SYSTEM_BASE}

Parse the user's natural language query about workforce data. Identify the intent and extract filters. Return JSON: { "intent": "filter|aggregate|compare|trend", "filters": { "field": "value" }, "description": "...", "suggestedSQL": "..." }`,

  enhanceProjectHealth: `${SYSTEM_BASE}

Analyze the provided project data (tasks, milestones, timeline, budget) and generate a health assessment. Return JSON: { "value": number (0-100), "label": "Healthy|At Risk|Critical", "breakdown": [{ "factor": "...", "score": number, "weight": number }], "trend": "up"|"down"|"stable", "narrative": "..." }`,

  enhanceOKRQuality: `${SYSTEM_BASE}

Evaluate the provided OKR (Objective + Key Results) for quality. Check: ambitious yet achievable objectives, measurable key results, alignment, time-bound targets. Return JSON: { "value": number (0-100), "label": "Excellent|Good|Needs Work", "breakdown": [{ "factor": "...", "score": number, "weight": number }], "trend": "stable", "suggestions": "..." }`,

  enhanceWorkflowOptimization: `${SYSTEM_BASE}

Analyze the provided workflow (steps, run history, failure patterns) and suggest optimizations. Return JSON array: [{ "id": "ai-wf-opt-...", "title": "...", "rationale": "...", "impact": "high"|"medium"|"low", "effort": "low"|"medium"|"high", "category": "workflow" }]`,
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured', fallback: true }, { status: 503 })
    }

    // Rate limit
    if (!checkRateLimit(orgId)) {
      return NextResponse.json({ error: 'Rate limit exceeded', fallback: true }, { status: 429 })
    }

    const { action, data, locale = 'en' } = await request.json()

    const systemPrompt = ACTION_PROMPTS[action]
    if (!systemPrompt) {
      return NextResponse.json({ error: `Unknown action: ${action}`, fallback: true }, { status: 400 })
    }

    // Build locale instruction
    const localeInstruction = locale === 'fr'
      ? '\n\nIMPORTANT: Respond entirely in French. Use formal business French appropriate for West African banking context (vous form). All text in the JSON response must be in French.'
      : ''

    // Call Claude
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt + localeInstruction,
      messages: [
        {
          role: 'user',
          content: `Analyze this data and respond with ONLY valid JSON (no markdown, no code fences):\n\n${JSON.stringify(data, null, 2).slice(0, 8000)}`,
        },
      ],
    })

    // Extract text response
    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response', fallback: true }, { status: 500 })
    }

    // Parse JSON from response
    let parsed
    try {
      // Strip any markdown fences if Claude adds them despite instruction
      const raw = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(raw)
    } catch {
      // Return raw text as narrative fallback
      parsed = { summary: textBlock.text, bulletPoints: [] }
    }

    return NextResponse.json({ result: parsed, source: 'claude' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    console.error('[AI Route]', message)
    return NextResponse.json({ error: message, fallback: true }, { status: 500 })
  }
}
