#!/usr/bin/env npx tsx
/**
 * Security Audit Script
 *
 * Scans all API route files for common vulnerability patterns and outputs
 * a report with severity levels.
 *
 * Run:  npx tsx scripts/security-audit.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// ── Types ────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low'

interface Finding {
  file: string
  line: number
  severity: Severity
  rule: string
  message: string
  snippet: string
}

interface AuditRule {
  id: string
  severity: Severity
  description: string
  pattern: RegExp
  /** If true, the rule is only a concern when found (positive match = bad). */
  positive?: boolean
  /** Lines to skip if they match this regex (reduces false positives). */
  ignore?: RegExp
}

// ── Rules ────────────────────────────────────────────────────────────────

const RULES: AuditRule[] = [
  // ── Critical ───────────────────────────────────────────────────────
  {
    id: 'EXPOSED_SECRET',
    severity: 'critical',
    description: 'Hardcoded secret / credential',
    pattern:
      /(?:password|secret|api[_-]?key|private[_-]?key|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    ignore: /process\.env|example|placeholder|demo|test|change.in.production/i,
  },
  {
    id: 'SQL_INJECTION',
    severity: 'critical',
    description: 'Potential SQL injection (string concatenation in query)',
    pattern: /(?:sql|query|execute)\s*\(\s*[`'"].*\$\{/i,
    ignore: /drizzle|schema\.|eq\(|and\(|or\(/i,
  },
  {
    id: 'EVAL_USAGE',
    severity: 'critical',
    description: 'Use of eval() or Function() constructor',
    pattern: /\beval\s*\(|new\s+Function\s*\(/,
    ignore: /\/\/.*eval|eslint/i,
  },

  // ── High ───────────────────────────────────────────────────────────
  {
    id: 'NO_AUTH_CHECK',
    severity: 'high',
    description: 'API handler may lack auth check (no x-org-id / x-employee-id read)',
    pattern: /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/,
    // This rule is checked file-level: if the function exists but no header read is found
  },
  {
    id: 'UNSANITIZED_BODY',
    severity: 'high',
    description: 'Request body used without validation/sanitization',
    pattern: /await\s+request\.json\(\)/,
    ignore: /sanitize|validate|zod|parse|schema/i,
  },
  {
    id: 'DANGEROUS_REDIRECT',
    severity: 'high',
    description: 'Open redirect risk — redirect URL from user input',
    pattern: /redirect\s*\(\s*new\s+URL\s*\(\s*(?:req|request)\b/,
  },
  {
    id: 'SHELL_EXEC',
    severity: 'high',
    description: 'Shell command execution',
    pattern: /child_process|exec\s*\(|execSync|spawn\s*\(/,
    ignore: /\/\/.*exec|import.*from/i,
  },

  // ── Medium ─────────────────────────────────────────────────────────
  {
    id: 'CORS_WILDCARD',
    severity: 'medium',
    description: 'CORS wildcard origin',
    pattern: /['"]Access-Control-Allow-Origin['"]\s*,\s*['"]\*/,
  },
  {
    id: 'MISSING_RATE_LIMIT',
    severity: 'medium',
    description: 'POST/PUT/DELETE handler without rate limiting',
    pattern: /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/,
    ignore: /rateLimit|rate.limit|checkRateLimit|withApiGuard/i,
  },
  {
    id: 'CONSOLE_LOG_SENSITIVE',
    severity: 'medium',
    description: 'Console log may leak sensitive data',
    pattern: /console\.log\s*\(.*(?:password|token|secret|cookie|session)/i,
  },
  {
    id: 'UNVALIDATED_PARAM',
    severity: 'medium',
    description: 'URL search param used without validation',
    pattern: /searchParams\.get\s*\([^)]+\)/,
    ignore: /validate|sanitize|parseInt|Number|encodeURI/i,
  },

  // ── Low ────────────────────────────────────────────────────────────
  {
    id: 'TODO_SECURITY',
    severity: 'low',
    description: 'Security-related TODO/FIXME/HACK comment',
    pattern: /\/\/\s*(?:TODO|FIXME|HACK|XXX).*(?:security|auth|csrf|xss|inject|vuln)/i,
  },
  {
    id: 'DEPRECATED_CRYPTO',
    severity: 'low',
    description: 'Potentially weak crypto algorithm',
    pattern: /(?:md5|sha1|createCipher)\s*\(/i,
    ignore: /sha256|sha384|sha512/i,
  },
]

// ── File discovery ───────────────────────────────────────────────────────

function findApiRoutes(dir: string): string[] {
  const results: string[] = []

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue
        walk(fullPath)
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        results.push(fullPath)
      }
    }
  }

  walk(dir)
  return results
}

// ── Scanning ─────────────────────────────────────────────────────────────

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const relativePath = path.relative(process.cwd(), filePath)

  for (const rule of RULES) {
    // Special handling for NO_AUTH_CHECK: file-level rule
    if (rule.id === 'NO_AUTH_CHECK') {
      const hasHandler = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/m.test(content)
      const hasAuthCheck =
        /x-org-id|x-employee-id|x-admin-id|withApiGuard|skipAuth/.test(content)
      const isPublicRoute =
        /\/api\/auth|\/api\/health|\/api\/docs|\/api\/billing\/webhook|\/api\/public/.test(
          filePath
        )

      if (hasHandler && !hasAuthCheck && !isPublicRoute) {
        // Find the line of the first handler
        const handlerLine = lines.findIndex((l) =>
          /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/.test(l)
        )
        findings.push({
          file: relativePath,
          line: handlerLine + 1,
          severity: rule.severity,
          rule: rule.id,
          message: rule.description,
          snippet: lines[handlerLine]?.trim() || '',
        })
      }
      continue
    }

    // Line-by-line rules
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (rule.pattern.test(line)) {
        // Check ignore pattern
        if (rule.ignore && rule.ignore.test(line)) continue
        // Check surrounding context for ignore pattern (3 lines before/after)
        if (rule.ignore) {
          const context = lines
            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 4))
            .join('\n')
          if (rule.ignore.test(context)) continue
        }

        findings.push({
          file: relativePath,
          line: i + 1,
          severity: rule.severity,
          rule: rule.id,
          message: rule.description,
          snippet: line.trim().substring(0, 120),
        })
      }
    }
  }

  return findings
}

// ── Report ───────────────────────────────────────────────────────────────

function generateReport(findings: Finding[]): void {
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const sorted = findings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const f of findings) counts[f.severity]++

  console.log('\n' + '='.repeat(80))
  console.log('  TEMPO PLATFORM — SECURITY AUDIT REPORT')
  console.log('  ' + new Date().toISOString())
  console.log('='.repeat(80))

  console.log(
    `\n  Summary:  ${counts.critical} critical | ${counts.high} high | ${counts.medium} medium | ${counts.low} low  (${findings.length} total)\n`
  )

  if (findings.length === 0) {
    console.log('  No findings. All scanned routes look clean.\n')
    return
  }

  const severityColors: Record<Severity, string> = {
    critical: '\x1b[31m', // red
    high: '\x1b[33m',     // yellow
    medium: '\x1b[36m',   // cyan
    low: '\x1b[37m',      // white
  }
  const RESET = '\x1b[0m'

  for (const finding of sorted) {
    const color = severityColors[finding.severity]
    console.log(
      `  ${color}[${finding.severity.toUpperCase()}]${RESET} ${finding.rule}`
    )
    console.log(`    File: ${finding.file}:${finding.line}`)
    console.log(`    ${finding.message}`)
    console.log(`    > ${finding.snippet}`)
    console.log()
  }

  console.log('='.repeat(80))
  if (counts.critical > 0) {
    console.log(
      '\x1b[31m  ACTION REQUIRED: Critical findings must be addressed immediately.\x1b[0m'
    )
  }
  console.log()
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api')

  if (!fs.existsSync(apiDir)) {
    console.error(`API directory not found: ${apiDir}`)
    process.exit(1)
  }

  console.log(`Scanning API routes in ${apiDir} ...`)
  const files = findApiRoutes(apiDir)
  console.log(`Found ${files.length} route files.`)

  const allFindings: Finding[] = []
  for (const file of files) {
    const findings = scanFile(file)
    allFindings.push(...findings)
  }

  generateReport(allFindings)

  // Exit with non-zero code if critical/high findings exist
  const hasCritical = allFindings.some(
    (f) => f.severity === 'critical' || f.severity === 'high'
  )
  process.exit(hasCritical ? 1 : 0)
}

main()
