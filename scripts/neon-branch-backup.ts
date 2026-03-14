#!/usr/bin/env npx tsx
/**
 * Tempo Platform — Neon Branch Backup Strategy
 *
 * Uses the Neon API to create database branches as point-in-time snapshots.
 * Branches are lightweight copy-on-write clones — instant and zero-downtime.
 *
 * Usage:
 *   npx tsx scripts/neon-branch-backup.ts create                  # Create a snapshot branch
 *   npx tsx scripts/neon-branch-backup.ts create --name prod-snap # With custom name
 *   npx tsx scripts/neon-branch-backup.ts list                    # List branches
 *   npx tsx scripts/neon-branch-backup.ts restore <branch-id>     # Restore from branch
 *   npx tsx scripts/neon-branch-backup.ts cleanup                 # Remove old branches
 *
 * Required env vars:
 *   NEON_API_KEY     — Neon API key (from console.neon.tech)
 *   NEON_PROJECT_ID  — Neon project ID
 *   DATABASE_URL     — Current database connection string
 */

import * as fs from 'fs'
import * as path from 'path'
import { RETENTION_POLICY } from '../src/lib/backup/config'

// ─── Load .env.local ──────────────────────────────────────────────────────────

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

// ─── Config ───────────────────────────────────────────────────────────────────

const NEON_API_KEY = process.env.NEON_API_KEY
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

function checkEnv(): void {
  if (!NEON_API_KEY) {
    console.error('  Missing NEON_API_KEY environment variable.')
    console.error('  Get one from: https://console.neon.tech/app/settings/api-keys')
    process.exit(1)
  }
  if (!NEON_PROJECT_ID) {
    console.error('  Missing NEON_PROJECT_ID environment variable.')
    console.error('  Find it in your Neon dashboard project settings.')
    process.exit(1)
  }
}

// ─── Neon API Client ──────────────────────────────────────────────────────────

interface NeonBranch {
  id: string
  name: string
  project_id: string
  parent_id: string | null
  created_at: string
  updated_at: string
  current_state: string
  primary: boolean
}

interface NeonEndpoint {
  id: string
  host: string
  branch_id: string
  type: string
  current_state: string
}

async function neonFetch<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const url = `${NEON_API_BASE}/projects/${NEON_PROJECT_ID}${endpoint}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${NEON_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Neon API ${method} ${endpoint} failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function createBranch(branchName?: string): Promise<void> {
  checkEnv()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const name = branchName ?? `backup-${timestamp}`

  console.log(`  Creating branch: ${name}`)
  console.log(`  Project:         ${NEON_PROJECT_ID}`)
  console.log()

  // Get the primary (main) branch to use as parent
  const { branches } = await neonFetch<{ branches: NeonBranch[] }>('GET', '/branches')
  const primaryBranch = branches.find((b) => b.primary)

  if (!primaryBranch) {
    console.error('  Could not find primary branch.')
    process.exit(1)
  }

  console.log(`  Parent branch:   ${primaryBranch.name} (${primaryBranch.id})`)

  // Create the branch
  const result = await neonFetch<{ branch: NeonBranch; endpoints: NeonEndpoint[] }>(
    'POST',
    '/branches',
    {
      branch: {
        name,
        parent_id: primaryBranch.id,
      },
      endpoints: [
        {
          type: 'read_only',
        },
      ],
    },
  )

  console.log()
  console.log('  Branch created successfully:')
  console.log(`    ID:        ${result.branch.id}`)
  console.log(`    Name:      ${result.branch.name}`)
  console.log(`    Created:   ${result.branch.created_at}`)
  if (result.endpoints.length > 0) {
    console.log(`    Endpoint:  ${result.endpoints[0].host}`)
  }
  console.log()
  console.log('  This branch is a point-in-time snapshot of your production database.')
  console.log('  It can be used for disaster recovery or to test migrations safely.')
}

async function listBranches(): Promise<void> {
  checkEnv()

  console.log(`  Project: ${NEON_PROJECT_ID}`)
  console.log()

  const { branches } = await neonFetch<{ branches: NeonBranch[] }>('GET', '/branches')

  if (branches.length === 0) {
    console.log('  No branches found.')
    return
  }

  console.log(`  ${'Name'.padEnd(35)} ${'ID'.padEnd(30)} ${'State'.padEnd(12)} ${'Created'.padEnd(25)} Primary`)
  console.log(`  ${'─'.repeat(35)} ${'─'.repeat(30)} ${'─'.repeat(12)} ${'─'.repeat(25)} ${'─'.repeat(7)}`)

  for (const branch of branches) {
    const created = new Date(branch.created_at).toLocaleString()
    console.log(
      `  ${branch.name.padEnd(35)} ${branch.id.padEnd(30)} ${branch.current_state.padEnd(12)} ${created.padEnd(25)} ${branch.primary ? 'yes' : ''}`,
    )
  }

  // Show backup branches
  const backupBranches = branches.filter((b) => b.name.startsWith('backup-'))
  console.log()
  console.log(`  Total branches: ${branches.length} (${backupBranches.length} backup branches)`)
}

async function restoreFromBranch(branchId: string): Promise<void> {
  checkEnv()

  console.log(`  Restoring from branch: ${branchId}`)
  console.log()

  // Get branch info
  const { branches } = await neonFetch<{ branches: NeonBranch[] }>('GET', '/branches')
  const branch = branches.find((b) => b.id === branchId || b.name === branchId)

  if (!branch) {
    console.error(`  Branch not found: ${branchId}`)
    console.error('  Available branches:')
    for (const b of branches) {
      console.error(`    ${b.name} (${b.id})`)
    }
    process.exit(1)
  }

  console.log(`  Branch name:   ${branch.name}`)
  console.log(`  Branch ID:     ${branch.id}`)
  console.log(`  Created:       ${branch.created_at}`)
  console.log()

  // Get endpoints for this branch
  const { endpoints } = await neonFetch<{ endpoints: NeonEndpoint[] }>(
    'GET',
    `/branches/${branch.id}/endpoints`,
  )

  if (endpoints.length === 0) {
    console.log('  No endpoint found for this branch. Creating one...')
    const { endpoint } = await neonFetch<{ endpoint: NeonEndpoint }>(
      'POST',
      `/branches/${branch.id}/endpoints`,
      { endpoint: { type: 'read_write' } },
    )
    console.log(`  Endpoint created: ${endpoint.host}`)
    console.log()
    console.log('  To restore, update your DATABASE_URL to point to this branch:')
    console.log(`    Host: ${endpoint.host}`)
  } else {
    console.log('  To restore, update your DATABASE_URL to point to this branch:')
    console.log(`    Host: ${endpoints[0].host}`)
  }

  console.log()
  console.log('  IMPORTANT: Neon branch restore options:')
  console.log('  1. Update DATABASE_URL to the branch endpoint (instant switchover)')
  console.log('  2. Use the Neon dashboard to "Reset from parent" on the main branch')
  console.log('  3. Export data from the branch and import into main using restore-database.ts')
  console.log()
  console.log('  For production recovery, option 1 (DNS switchover) is fastest.')
}

async function cleanupBranches(): Promise<void> {
  checkEnv()

  const maxAge = RETENTION_POLICY.neonBranchMaxAgeDays
  const maxCount = RETENTION_POLICY.neonBranchMaxCount
  const cutoff = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000)

  console.log(`  Cleanup policy:`)
  console.log(`    Max age:   ${maxAge} days (before ${cutoff.toISOString().slice(0, 10)})`)
  console.log(`    Max count: ${maxCount}`)
  console.log()

  const { branches } = await neonFetch<{ branches: NeonBranch[] }>('GET', '/branches')

  // Only consider backup branches (not the primary or user-created ones)
  const backupBranches = branches
    .filter((b) => b.name.startsWith('backup-') && !b.primary)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (backupBranches.length === 0) {
    console.log('  No backup branches to clean up.')
    return
  }

  // Identify branches to delete
  const toDelete: NeonBranch[] = []

  for (let i = 0; i < backupBranches.length; i++) {
    const branch = backupBranches[i]
    const createdAt = new Date(branch.created_at)

    // Keep the most recent ones up to maxCount
    if (i < maxCount && createdAt >= cutoff) continue

    // Delete old or excess branches
    toDelete.push(branch)
  }

  if (toDelete.length === 0) {
    console.log(`  All ${backupBranches.length} backup branches are within policy. Nothing to clean up.`)
    return
  }

  console.log(`  Deleting ${toDelete.length} branch(es):`)

  for (const branch of toDelete) {
    process.stdout.write(`    Deleting ${branch.name} (${branch.id})...`)
    try {
      await neonFetch('DELETE', `/branches/${branch.id}`)
      console.log(' done')
    } catch (err) {
      console.log(` FAILED: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log()
  console.log(`  Cleanup complete. ${backupBranches.length - toDelete.length} backup branches remaining.`)
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║       Tempo Platform — Neon Branch Backup               ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()

  switch (command) {
    case 'create': {
      const nameArg = args.find((a) => a.startsWith('--name='))
      const name = nameArg ? nameArg.split('=')[1] : undefined
      await createBranch(name)
      break
    }
    case 'list':
      await listBranches()
      break
    case 'restore': {
      const branchId = args[1]
      if (!branchId) {
        console.error('  Usage: npx tsx scripts/neon-branch-backup.ts restore <branch-id-or-name>')
        process.exit(1)
      }
      await restoreFromBranch(branchId)
      break
    }
    case 'cleanup':
      await cleanupBranches()
      break
    default:
      console.log('  Commands:')
      console.log('    create [--name=<name>]     Create a snapshot branch')
      console.log('    list                       List all branches')
      console.log('    restore <branch-id|name>   Show restore instructions for a branch')
      console.log('    cleanup                    Remove old backup branches per retention policy')
      console.log()
      console.log('  Required env vars: NEON_API_KEY, NEON_PROJECT_ID')
      process.exit(command === undefined ? 0 : 1)
  }
}

main().catch((err) => {
  console.error('\n  Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
