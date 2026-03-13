// ─── Client-side Documentation Search ──────────────────────────────────────
import type { ModuleDoc } from './types'

export interface SearchResult {
  slug: string
  title: string
  subtitle: string
  group: string
  icon: string
  matchType: 'title' | 'feature' | 'workflow' | 'faq' | 'tip'
  matchText: string
  score: number
}

export function searchDocs(docs: ModuleDoc[], query: string): SearchResult[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []

  for (const doc of docs) {
    // Title match (highest score)
    if (doc.title.toLowerCase().includes(q) || doc.subtitle.toLowerCase().includes(q)) {
      results.push({
        slug: doc.slug, title: doc.title, subtitle: doc.subtitle,
        group: doc.group, icon: doc.icon,
        matchType: 'title', matchText: doc.title, score: 100,
      })
    }

    // Key features match
    for (const f of doc.overview.keyFeatures) {
      if (f.toLowerCase().includes(q)) {
        results.push({
          slug: doc.slug, title: doc.title, subtitle: doc.subtitle,
          group: doc.group, icon: doc.icon,
          matchType: 'feature', matchText: f, score: 80,
        })
        break
      }
    }

    // Workflow match
    for (const w of doc.workflows) {
      if (w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)) {
        results.push({
          slug: doc.slug, title: doc.title, subtitle: doc.subtitle,
          group: doc.group, icon: doc.icon,
          matchType: 'workflow', matchText: w.title, score: 70,
        })
        break
      }
    }

    // FAQ match
    for (const f of doc.faqs) {
      if (f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)) {
        results.push({
          slug: doc.slug, title: doc.title, subtitle: doc.subtitle,
          group: doc.group, icon: doc.icon,
          matchType: 'faq', matchText: f.question, score: 60,
        })
        break
      }
    }

    // Tips match
    for (const t of doc.tips) {
      if (t.toLowerCase().includes(q)) {
        results.push({
          slug: doc.slug, title: doc.title, subtitle: doc.subtitle,
          group: doc.group, icon: doc.icon,
          matchType: 'tip', matchText: t, score: 50,
        })
        break
      }
    }
  }

  // Deduplicate by slug (keep highest score)
  const seen = new Map<string, SearchResult>()
  for (const r of results) {
    const existing = seen.get(r.slug)
    if (!existing || r.score > existing.score) seen.set(r.slug, r)
  }

  return [...seen.values()].sort((a, b) => b.score - a.score)
}
