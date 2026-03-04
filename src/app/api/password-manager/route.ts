import { NextRequest, NextResponse } from 'next/server'
import {
  createVault,
  deleteVault,
  shareVault,
  addItem,
  updateItem,
  deleteItem,
  generatePassword,
  checkPasswordStrength,
  getBreachStatus,
  searchItems,
  getItemHistory,
  shareItem,
  revokeItemAccess,
  exportVault,
  importFromCSV,
  importFromLastPass,
  importFrom1Password,
  getSecurityReport,
  getPasswordHealthScore,
  autoFillCredentials,
  rotatePasswords,
  getSharedItems,
} from '@/lib/services/password-manager'

// GET /api/password-manager - Search, health score, security report, auto-fill
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'health-score'

    switch (action) {
      case 'health-score': {
        const result = await getPasswordHealthScore(orgId)
        return NextResponse.json(result)
      }

      case 'security-report': {
        const result = await getSecurityReport(orgId)
        return NextResponse.json(result)
      }

      case 'search': {
        const employeeId = url.searchParams.get('employeeId')
        const query = url.searchParams.get('q') || ''
        const type = url.searchParams.get('type') as any
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await searchItems(orgId, employeeId, query, { type, limit })
        return NextResponse.json(result)
      }

      case 'item-history': {
        const itemId = url.searchParams.get('itemId')
        if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
        const result = await getItemHistory(orgId, itemId)
        return NextResponse.json(result)
      }

      case 'shared-items': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await getSharedItems(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'auto-fill': {
        const employeeId = url.searchParams.get('employeeId')
        const targetUrl = url.searchParams.get('url')
        if (!employeeId || !targetUrl) return NextResponse.json({ error: 'employeeId and url are required' }, { status: 400 })
        const result = await autoFillCredentials(orgId, employeeId, targetUrl)
        return NextResponse.json(result)
      }

      case 'rotate-passwords': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await rotatePasswords(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'generate-password': {
        const length = url.searchParams.get('length') ? parseInt(url.searchParams.get('length')!) : undefined
        const symbols = url.searchParams.get('symbols') !== 'false'
        const result = await generatePassword({ length, symbols })
        return NextResponse.json(result)
      }

      case 'check-strength': {
        const password = url.searchParams.get('password')
        if (!password) return NextResponse.json({ error: 'password is required' }, { status: 400 })
        const result = await checkPasswordStrength(password)
        return NextResponse.json(result)
      }

      case 'breach-status': {
        const password = url.searchParams.get('password')
        if (!password) return NextResponse.json({ error: 'password is required' }, { status: 400 })
        const result = await getBreachStatus(password)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/password-manager] Error:', error)
    return NextResponse.json({ error: error?.message || 'Password manager query failed' }, { status: 500 })
  }
}

// POST /api/password-manager - Vault/item CRUD, sharing, import/export
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-vault': {
        const { ownerId, vault } = body
        if (!ownerId || !vault) return NextResponse.json({ error: 'ownerId and vault are required' }, { status: 400 })
        const result = await createVault(orgId, ownerId, vault)
        return NextResponse.json(result)
      }

      case 'delete-vault': {
        const { vaultId, requesterId } = body
        if (!vaultId || !requesterId) return NextResponse.json({ error: 'vaultId and requesterId are required' }, { status: 400 })
        const result = await deleteVault(orgId, vaultId, requesterId)
        return NextResponse.json(result)
      }

      case 'share-vault': {
        const { vaultId, requesterId, shares } = body
        if (!vaultId || !requesterId || !shares) return NextResponse.json({ error: 'vaultId, requesterId, and shares are required' }, { status: 400 })
        const result = await shareVault(orgId, vaultId, requesterId, shares)
        return NextResponse.json(result)
      }

      case 'add-item': {
        const { vaultId, item } = body
        if (!vaultId || !item) return NextResponse.json({ error: 'vaultId and item are required' }, { status: 400 })
        const result = await addItem(orgId, vaultId, item)
        return NextResponse.json(result)
      }

      case 'update-item': {
        const { itemId, updates } = body
        if (!itemId || !updates) return NextResponse.json({ error: 'itemId and updates are required' }, { status: 400 })
        const result = await updateItem(orgId, itemId, updates)
        return NextResponse.json(result)
      }

      case 'delete-item': {
        const { itemId } = body
        if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
        const result = await deleteItem(orgId, itemId)
        return NextResponse.json(result)
      }

      case 'share-item': {
        const { itemId, targetEmployeeId, role } = body
        if (!itemId || !targetEmployeeId) return NextResponse.json({ error: 'itemId and targetEmployeeId are required' }, { status: 400 })
        const result = await shareItem(orgId, itemId, targetEmployeeId, role ?? 'viewer')
        return NextResponse.json(result)
      }

      case 'revoke-access': {
        const { itemId, targetEmployeeId } = body
        if (!itemId || !targetEmployeeId) return NextResponse.json({ error: 'itemId and targetEmployeeId are required' }, { status: 400 })
        const result = await revokeItemAccess(orgId, itemId, targetEmployeeId)
        return NextResponse.json(result)
      }

      case 'export-vault': {
        const { vaultId, requesterId } = body
        if (!vaultId || !requesterId) return NextResponse.json({ error: 'vaultId and requesterId are required' }, { status: 400 })
        const result = await exportVault(orgId, vaultId, requesterId)
        return NextResponse.json(result)
      }

      case 'import-csv': {
        const { vaultId, rows } = body
        if (!vaultId || !rows) return NextResponse.json({ error: 'vaultId and rows are required' }, { status: 400 })
        const result = await importFromCSV(orgId, vaultId, rows)
        return NextResponse.json(result)
      }

      case 'import-lastpass': {
        const { vaultId, items } = body
        if (!vaultId || !items) return NextResponse.json({ error: 'vaultId and items are required' }, { status: 400 })
        const result = await importFromLastPass(orgId, vaultId, items)
        return NextResponse.json(result)
      }

      case 'import-1password': {
        const { vaultId, items } = body
        if (!vaultId || !items) return NextResponse.json({ error: 'vaultId and items are required' }, { status: 400 })
        const result = await importFrom1Password(orgId, vaultId, items)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/password-manager] Error:', error)
    return NextResponse.json({ error: error?.message || 'Password manager operation failed' }, { status: 500 })
  }
}
