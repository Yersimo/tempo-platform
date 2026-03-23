/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Knowledge Base Search Engine
 * Fast text-based search across company knowledge base articles.
 * Runs client-side against store data — no external API calls.
 */

export interface KBSearchResult {
  articleId: string
  title: string
  category: string
  snippet: string
  relevanceScore: number
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'from', 'they', 'been',
  'said', 'each', 'which', 'their', 'will', 'other', 'about', 'many', 'then',
  'them', 'these', 'some', 'would', 'make', 'like', 'into', 'time', 'very',
  'when', 'what', 'your', 'how', 'does', 'this', 'that', 'with',
])

export function searchKnowledgeBase(query: string, articles: any[]): KBSearchResult[] {
  if (!articles?.length) return []

  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const searchTerms = queryWords.filter(w => !STOP_WORDS.has(w))
  if (searchTerms.length === 0) return []

  const results: KBSearchResult[] = []

  for (const article of articles) {
    if (article.is_published === false || article.isPublished === false) continue

    const titleLower = (article.title || '').toLowerCase()
    const contentLower = (article.content || '').toLowerCase()
    const tagsLower = (article.tags || '').toLowerCase()
    const categoryLower = (article.category || '').toLowerCase()

    let score = 0
    let matchedTerms = 0

    for (const term of searchTerms) {
      // Title match (highest weight)
      if (titleLower.includes(term)) { score += 30; matchedTerms++ }
      // Tag match (high weight)
      if (tagsLower.includes(term)) { score += 20; matchedTerms++ }
      // Category match
      if (categoryLower.includes(term)) { score += 15; matchedTerms++ }
      // Content match
      const contentMatches = (contentLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      if (contentMatches > 0) {
        score += Math.min(contentMatches * 5, 25)
        matchedTerms++
      }
    }

    // Bonus for matching multiple terms
    if (matchedTerms > 1) score += matchedTerms * 10

    // Normalize score to 0-100
    const maxPossibleScore = searchTerms.length * 70 + searchTerms.length * 10
    const normalizedScore = Math.min(Math.round((score / Math.max(maxPossibleScore, 1)) * 100), 100)

    if (normalizedScore > 15) {
      // Extract relevant snippet
      let snippet = ''
      const content = article.content || ''
      for (const term of searchTerms) {
        const idx = contentLower.indexOf(term)
        if (idx >= 0) {
          const start = Math.max(0, idx - 100)
          const end = Math.min(content.length, idx + 300)
          snippet = (start > 0 ? '...' : '') + content.substring(start, end).trim() + (end < content.length ? '...' : '')
          break
        }
      }
      if (!snippet) snippet = content.substring(0, 300) + (content.length > 300 ? '...' : '')

      results.push({
        articleId: article.id,
        title: article.title,
        category: article.category,
        snippet,
        relevanceScore: normalizedScore,
      })
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)
}

/** Detect whether a query is likely a knowledge-base / policy question */
export function isKnowledgeBaseQuestion(query: string): boolean {
  const policyKeywords = [
    'policy', 'policies', 'procedure', 'procedures', 'handbook', 'manual',
    'guideline', 'guidelines', 'rule', 'rules', 'regulation',
    'what is the policy', 'what is our policy', 'what does the handbook say',
    'according to', 'company policy', 'employee handbook',
    'am i allowed', 'can i', 'is it allowed', 'is it permitted',
    'dress code', 'work from home', 'wfh', 'remote work', 'maternity', 'paternity',
    'sick leave policy', 'annual leave policy', 'notice period', 'probation',
    'code of conduct', 'ethics', 'conflict of interest', 'whistleblower',
    'grievance', 'disciplinary', 'termination policy', 'severance',
    'travel policy', 'expense policy', 'reimbursement policy',
    'data protection', 'privacy policy', 'confidentiality', 'nda',
    'anti-harassment', 'diversity', 'equal opportunity',
    'working hours', 'overtime policy', 'flexible working',
    'social media policy', 'internet usage', 'acceptable use',
    'health and safety', 'smoking policy', 'drug policy',
    'how many days', 'how much notice', 'what happens if', 'who do i contact',
  ]
  const queryLower = query.toLowerCase()
  return policyKeywords.some(kw => queryLower.includes(kw))
}
