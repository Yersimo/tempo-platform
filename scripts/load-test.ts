/**
 * Load Test Script — simulates concurrent API requests against the Tempo Platform.
 *
 * Usage:
 *   npx tsx scripts/load-test.ts
 *   npx tsx scripts/load-test.ts --base-url http://localhost:3002 --concurrency 50 --iterations 10
 *
 * Tests:
 *   - GET /api/data/[module] for all key modules
 *   - GET /api/payroll
 *   - GET /api/chat
 *
 * Reports p50, p95, p99 response times and error rates.
 */

// ── CLI Args ────────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}

const BASE_URL = getArg('base-url', 'http://localhost:3002')
const CONCURRENCY = parseInt(getArg('concurrency', '50'), 10)
const ITERATIONS = parseInt(getArg('iterations', '10'), 10)

// ── Endpoints to Test ───────────────────────────────────────
const ENDPOINTS = [
  { name: 'employees', path: '/api/data/employees' },
  { name: 'payroll', path: '/api/data/payroll-runs' },
  { name: 'payroll-entries', path: '/api/data/payroll-entries' },
  { name: 'leave-requests', path: '/api/data/leave-requests' },
  { name: 'goals', path: '/api/data/goals' },
  { name: 'reviews', path: '/api/data/reviews' },
  { name: 'expense-reports', path: '/api/data/expense-reports' },
  { name: 'benefit-enrollments', path: '/api/data/benefit-enrollments' },
  { name: 'departments', path: '/api/data/departments' },
  { name: 'payroll-api', path: '/api/payroll' },
  { name: 'chat-api', path: '/api/chat' },
]

// ── Types ───────────────────────────────────────────────────
interface RequestResult {
  endpoint: string
  status: number
  durationMs: number
  error: string | null
}

// ── Single Request ──────────────────────────────────────────
async function makeRequest(url: string, endpointName: string): Promise<RequestResult> {
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': 'org-1',
        'x-employee-id': 'emp-1',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const durationMs = performance.now() - start
    return {
      endpoint: endpointName,
      status: res.status,
      durationMs,
      error: res.ok ? null : `HTTP ${res.status}`,
    }
  } catch (err: any) {
    const durationMs = performance.now() - start
    return {
      endpoint: endpointName,
      status: 0,
      durationMs,
      error: err.name === 'AbortError' ? 'Timeout (30s)' : err.message,
    }
  }
}

// ── Percentile Calculator ───────────────────────────────────
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

// ── Run Concurrent Batch ────────────────────────────────────
async function runBatch(endpoints: typeof ENDPOINTS, concurrency: number): Promise<RequestResult[]> {
  const results: RequestResult[] = []
  const queue = endpoints.map((ep) => ({
    url: `${BASE_URL}${ep.path}`,
    name: ep.name,
  }))

  // Run all concurrently (each "user" hits a random endpoint)
  const promises: Promise<RequestResult>[] = []
  for (let i = 0; i < concurrency; i++) {
    const ep = queue[i % queue.length]
    promises.push(makeRequest(ep.url, ep.name))
  }

  const batchResults = await Promise.all(promises)
  results.push(...batchResults)
  return results
}

// ── Format Table ────────────────────────────────────────────
function formatResults(allResults: RequestResult[]) {
  // Group by endpoint
  const grouped: Record<string, RequestResult[]> = {}
  for (const r of allResults) {
    if (!grouped[r.endpoint]) grouped[r.endpoint] = []
    grouped[r.endpoint].push(r)
  }

  console.log('\n' + '='.repeat(100))
  console.log('LOAD TEST RESULTS')
  console.log('='.repeat(100))
  console.log(
    [
      'Endpoint'.padEnd(22),
      'Reqs'.padStart(6),
      'OK'.padStart(6),
      'Err'.padStart(6),
      'Err%'.padStart(7),
      'p50(ms)'.padStart(10),
      'p95(ms)'.padStart(10),
      'p99(ms)'.padStart(10),
      'Min(ms)'.padStart(10),
      'Max(ms)'.padStart(10),
    ].join(' | ')
  )
  console.log('-'.repeat(100))

  const allDurations: number[] = []

  for (const [name, results] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b)
    allDurations.push(...durations)
    const errors = results.filter((r) => r.error !== null).length
    const ok = results.length - errors
    const errPct = ((errors / results.length) * 100).toFixed(1)

    console.log(
      [
        name.padEnd(22),
        String(results.length).padStart(6),
        String(ok).padStart(6),
        String(errors).padStart(6),
        `${errPct}%`.padStart(7),
        percentile(durations, 50).toFixed(0).padStart(10),
        percentile(durations, 95).toFixed(0).padStart(10),
        percentile(durations, 99).toFixed(0).padStart(10),
        Math.min(...durations).toFixed(0).padStart(10),
        Math.max(...durations).toFixed(0).padStart(10),
      ].join(' | ')
    )
  }

  // Overall summary
  allDurations.sort((a, b) => a - b)
  const totalErrors = allResults.filter((r) => r.error !== null).length
  console.log('-'.repeat(100))
  console.log(
    [
      'OVERALL'.padEnd(22),
      String(allResults.length).padStart(6),
      String(allResults.length - totalErrors).padStart(6),
      String(totalErrors).padStart(6),
      `${((totalErrors / allResults.length) * 100).toFixed(1)}%`.padStart(7),
      percentile(allDurations, 50).toFixed(0).padStart(10),
      percentile(allDurations, 95).toFixed(0).padStart(10),
      percentile(allDurations, 99).toFixed(0).padStart(10),
      Math.min(...allDurations).toFixed(0).padStart(10),
      Math.max(...allDurations).toFixed(0).padStart(10),
    ].join(' | ')
  )
  console.log('='.repeat(100))
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('=== Tempo Platform Load Test ===\n')
  console.log(`Base URL:    ${BASE_URL}`)
  console.log(`Concurrency: ${CONCURRENCY} concurrent requests per iteration`)
  console.log(`Iterations:  ${ITERATIONS}`)
  console.log(`Endpoints:   ${ENDPOINTS.length}`)
  console.log(`Total reqs:  ${CONCURRENCY * ITERATIONS}\n`)

  // Verify server is reachable
  try {
    const check = await fetch(`${BASE_URL}/api/data/employees`, {
      headers: { 'x-org-id': 'org-1', 'x-employee-id': 'emp-1' },
    })
    console.log(`Server check: ${check.status} ${check.statusText}\n`)
  } catch (err: any) {
    console.error(`Server not reachable at ${BASE_URL}: ${err.message}`)
    console.error('Start the dev server first: npm run dev')
    process.exit(1)
  }

  const allResults: RequestResult[] = []

  for (let iter = 1; iter <= ITERATIONS; iter++) {
    process.stdout.write(`Iteration ${iter}/${ITERATIONS}... `)
    const t0 = performance.now()
    const results = await runBatch(ENDPOINTS, CONCURRENCY)
    const elapsed = ((performance.now() - t0) / 1000).toFixed(1)
    allResults.push(...results)

    const errors = results.filter((r) => r.error).length
    const avgMs = (results.reduce((s, r) => s + r.durationMs, 0) / results.length).toFixed(0)
    console.log(`done in ${elapsed}s (avg ${avgMs}ms, ${errors} errors)`)
  }

  formatResults(allResults)
}

main().catch((err) => {
  console.error('Load test failed:', err)
  process.exit(1)
})
