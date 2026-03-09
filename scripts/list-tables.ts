import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  console.log(`Tables in DB (${tables.length}):`)
  for (const t of tables) console.log(`  ${t.table_name}`)

  // Check specifically for workers_comp and equity_grants
  console.log('\n--- Workers Comp tables ---')
  const wc = tables.filter(t => t.table_name.includes('workers_comp'))
  console.log(wc.length > 0 ? wc.map(t => t.table_name).join(', ') : 'NONE FOUND')

  console.log('\n--- Equity Grants table ---')
  const eq = tables.filter(t => t.table_name.includes('equity'))
  console.log(eq.length > 0 ? eq.map(t => t.table_name).join(', ') : 'NONE FOUND')
}

main().catch(console.error)
