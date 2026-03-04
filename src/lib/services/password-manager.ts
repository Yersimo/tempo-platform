// Tempo Password Manager Service
// Personal & shared vault management, password generation, strength scoring,
// breach detection, item sharing, import/export, organization health scoring.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, gte, lte, like, or } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export type VaultItemType = 'login' | 'secure_note' | 'credit_card' | 'identity' | 'ssh_key' | 'api_key'
export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'very_strong'
export type ShareRole = 'viewer' | 'editor'

export interface CreateVaultData {
  name: string
  description?: string
  isShared?: boolean
}

export interface CreateItemData {
  type: VaultItemType
  name: string
  url?: string
  username?: string
  password?: string
  notes?: string
  customFields?: Array<{ name: string; value: string; isHidden: boolean }>
  tags?: string[]
  autoFill?: boolean
}

export interface ShareConfig {
  employeeId?: string
  departmentId?: string
  role: ShareRole
}

export interface PasswordGenerateOptions {
  length?: number
  uppercase?: boolean
  lowercase?: boolean
  numbers?: boolean
  symbols?: boolean
  excludeAmbiguous?: boolean
  excludeChars?: string
}

export interface PasswordHealthScore {
  overallScore: number
  totalPasswords: number
  weakPasswords: number
  fairPasswords: number
  strongPasswords: number
  veryStrongPasswords: number
  duplicatePasswords: number
  oldPasswords: number // > 90 days
  breachedPasswords: number
  recommendations: string[]
}

export interface SecurityReportResult {
  healthScore: PasswordHealthScore
  vaultSummary: {
    totalVaults: number
    sharedVaults: number
    personalVaults: number
    totalItems: number
    itemsByType: Record<string, number>
  }
  recentActivity: Array<{
    action: string
    itemName: string
    vaultName: string
    timestamp: Date
  }>
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Calculate password entropy and return a strength rating.
 * Uses character set analysis and pattern detection.
 */
function calculatePasswordStrength(password: string): { strength: PasswordStrength; score: number; entropy: number } {
  if (!password) return { strength: 'weak', score: 0, entropy: 0 }

  let charsetSize = 0
  if (/[a-z]/.test(password)) charsetSize += 26
  if (/[A-Z]/.test(password)) charsetSize += 26
  if (/[0-9]/.test(password)) charsetSize += 10
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32

  const entropy = password.length * Math.log2(charsetSize || 1)

  // Penalties for common patterns
  let penaltyMultiplier = 1.0
  if (/(.)\1{2,}/.test(password)) penaltyMultiplier *= 0.8 // Repeated chars
  if (/^(12345|password|qwerty|abc123|letmein)/i.test(password)) penaltyMultiplier *= 0.2 // Common passwords
  if (/^[a-zA-Z]+$/.test(password)) penaltyMultiplier *= 0.7 // All letters
  if (/^[0-9]+$/.test(password)) penaltyMultiplier *= 0.5 // All numbers
  if (password.length < 8) penaltyMultiplier *= 0.6

  const adjustedEntropy = entropy * penaltyMultiplier

  let strength: PasswordStrength
  let score: number

  if (adjustedEntropy < 28) {
    strength = 'weak'
    score = Math.round((adjustedEntropy / 28) * 25)
  } else if (adjustedEntropy < 48) {
    strength = 'fair'
    score = 25 + Math.round(((adjustedEntropy - 28) / 20) * 25)
  } else if (adjustedEntropy < 65) {
    strength = 'strong'
    score = 50 + Math.round(((adjustedEntropy - 48) / 17) * 25)
  } else {
    strength = 'very_strong'
    score = 75 + Math.min(25, Math.round(((adjustedEntropy - 65) / 30) * 25))
  }

  return { strength, score: Math.min(100, score), entropy: Math.round(adjustedEntropy * 10) / 10 }
}

/**
 * Generate a random password with configurable options.
 */
function generateRandomPassword(options: PasswordGenerateOptions): string {
  const length = options.length ?? 20
  const useUppercase = options.uppercase !== false
  const useLowercase = options.lowercase !== false
  const useNumbers = options.numbers !== false
  const useSymbols = options.symbols !== false
  const excludeAmbiguous = options.excludeAmbiguous ?? false
  const excludeChars = options.excludeChars ?? ''

  let chars = ''
  const requiredChars: string[] = []

  const uppercase = excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  const numbers = excludeAmbiguous ? '23456789' : '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (useUppercase) {
    chars += uppercase
    requiredChars.push(uppercase.charAt(Math.floor(Math.random() * uppercase.length)))
  }
  if (useLowercase) {
    chars += lowercase
    requiredChars.push(lowercase.charAt(Math.floor(Math.random() * lowercase.length)))
  }
  if (useNumbers) {
    chars += numbers
    requiredChars.push(numbers.charAt(Math.floor(Math.random() * numbers.length)))
  }
  if (useSymbols) {
    chars += symbols
    requiredChars.push(symbols.charAt(Math.floor(Math.random() * symbols.length)))
  }

  // Remove excluded characters
  if (excludeChars) {
    chars = chars.split('').filter(c => !excludeChars.includes(c)).join('')
  }

  if (chars.length === 0) {
    chars = lowercase + numbers
  }

  // Generate random characters
  const result: string[] = [...requiredChars]
  while (result.length < length) {
    result.push(chars.charAt(Math.floor(Math.random() * chars.length)))
  }

  // Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }

  return result.slice(0, length).join('')
}

/**
 * Simulate breach check against known compromised password hashes.
 * In production, this would use the Have I Been Pwned k-anonymity API.
 */
function simulateBreachCheck(password: string): { breached: boolean; occurrences: number } {
  // Simulate: common passwords are "breached"
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
    'master', 'dragon', 'login', 'princess', 'welcome', 'shadow',
    'sunshine', 'trustno1', 'iloveyou', 'batman', 'letmein',
  ]

  const lowerPassword = password.toLowerCase()
  for (const common of commonPasswords) {
    if (lowerPassword.includes(common)) {
      return { breached: true, occurrences: Math.floor(Math.random() * 1000000) + 1000 }
    }
  }

  // Short passwords are more likely to be breached
  if (password.length < 8) {
    return { breached: Math.random() < 0.3, occurrences: Math.floor(Math.random() * 500) }
  }

  return { breached: false, occurrences: 0 }
}

// ============================================================
// Vault Management
// ============================================================

/**
 * Create a new password vault (personal or shared).
 */
export async function createVault(
  orgId: string,
  ownerId: string,
  data: CreateVaultData
): Promise<{ success: boolean; vault?: typeof schema.passwordVaults.$inferSelect; error?: string }> {
  try {
    if (!data.name) {
      return { success: false, error: 'Vault name is required' }
    }

    // Validate owner exists
    const [owner] = await db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(and(eq(schema.employees.id, ownerId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!owner) {
      return { success: false, error: 'Owner not found in this organization' }
    }

    const encryptionKeyId = `vault_key_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const [vault] = await db
      .insert(schema.passwordVaults)
      .values({
        orgId,
        name: data.name,
        description: data.description ?? null,
        isShared: data.isShared ?? false,
        ownerId,
        encryptionKeyId,
        itemCount: 0,
      })
      .returning()

    return { success: true, vault }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create vault',
    }
  }
}

/**
 * Delete a password vault and all its items.
 */
export async function deleteVault(
  orgId: string,
  vaultId: string,
  requesterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(and(eq(schema.passwordVaults.id, vaultId), eq(schema.passwordVaults.orgId, orgId)))
      .limit(1)

    if (!vault) {
      return { success: false, error: 'Vault not found' }
    }

    if (vault.ownerId !== requesterId) {
      return { success: false, error: 'Only the vault owner can delete a vault' }
    }

    await db.delete(schema.passwordVaults).where(eq(schema.passwordVaults.id, vaultId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete vault',
    }
  }
}

/**
 * Share a vault with employees or departments.
 */
export async function shareVault(
  orgId: string,
  vaultId: string,
  requesterId: string,
  shares: ShareConfig[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(and(eq(schema.passwordVaults.id, vaultId), eq(schema.passwordVaults.orgId, orgId)))
      .limit(1)

    if (!vault) {
      return { success: false, error: 'Vault not found' }
    }

    if (vault.ownerId !== requesterId) {
      return { success: false, error: 'Only the vault owner can share a vault' }
    }

    const existing = (vault.sharedWith as ShareConfig[] | null) ?? []
    const merged = [...existing]

    for (const share of shares) {
      // Check for duplicate
      const isDuplicate = merged.some(
        s => (s.employeeId && s.employeeId === share.employeeId) ||
             (s.departmentId && s.departmentId === share.departmentId)
      )

      if (!isDuplicate) {
        // Validate employee or department exists
        if (share.employeeId) {
          const [emp] = await db
            .select({ id: schema.employees.id })
            .from(schema.employees)
            .where(and(eq(schema.employees.id, share.employeeId), eq(schema.employees.orgId, orgId)))
            .limit(1)
          if (!emp) {
            return { success: false, error: `Employee ${share.employeeId} not found` }
          }
        }
        merged.push(share)
      }
    }

    await db
      .update(schema.passwordVaults)
      .set({ sharedWith: merged, isShared: true, updatedAt: new Date() })
      .where(eq(schema.passwordVaults.id, vaultId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to share vault',
    }
  }
}

// ============================================================
// Item Management
// ============================================================

/**
 * Add an item to a vault.
 */
export async function addItem(
  orgId: string,
  vaultId: string,
  data: CreateItemData
): Promise<{ success: boolean; item?: typeof schema.vaultItems.$inferSelect; error?: string }> {
  try {
    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(and(eq(schema.passwordVaults.id, vaultId), eq(schema.passwordVaults.orgId, orgId)))
      .limit(1)

    if (!vault) {
      return { success: false, error: 'Vault not found' }
    }

    if (!data.name) {
      return { success: false, error: 'Item name is required' }
    }

    // Calculate password strength if password provided
    let passwordStrength: PasswordStrength | null = null
    if (data.password) {
      const { strength } = calculatePasswordStrength(data.password)
      passwordStrength = strength
    }

    // Encrypt password (simulated - in production, use AES-256-GCM with vault key)
    const encryptedPassword = data.password
      ? Buffer.from(data.password).toString('base64')
      : null

    const [item] = await db
      .insert(schema.vaultItems)
      .values({
        vaultId,
        orgId,
        type: data.type,
        name: data.name,
        url: data.url ?? null,
        username: data.username ?? null,
        encryptedPassword: encryptedPassword,
        notes: data.notes ?? null,
        customFields: data.customFields ?? null,
        tags: data.tags ?? null,
        passwordStrength: passwordStrength,
        passwordChangedAt: data.password ? new Date() : null,
        autoFill: data.autoFill ?? true,
      })
      .returning()

    // Update vault item count
    await db
      .update(schema.passwordVaults)
      .set({ itemCount: vault.itemCount + 1, updatedAt: new Date() })
      .where(eq(schema.passwordVaults.id, vaultId))

    return { success: true, item }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add item',
    }
  }
}

/**
 * Update an existing vault item.
 */
export async function updateItem(
  orgId: string,
  itemId: string,
  updates: Partial<CreateItemData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const [item] = await db
      .select()
      .from(schema.vaultItems)
      .where(and(eq(schema.vaultItems.id, itemId), eq(schema.vaultItems.orgId, orgId)))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Vault item not found' }
    }

    const setValues: Record<string, any> = { updatedAt: new Date() }

    if (updates.name !== undefined) setValues.name = updates.name
    if (updates.type !== undefined) setValues.type = updates.type
    if (updates.url !== undefined) setValues.url = updates.url
    if (updates.username !== undefined) setValues.username = updates.username
    if (updates.notes !== undefined) setValues.notes = updates.notes
    if (updates.customFields !== undefined) setValues.customFields = updates.customFields
    if (updates.tags !== undefined) setValues.tags = updates.tags
    if (updates.autoFill !== undefined) setValues.autoFill = updates.autoFill

    if (updates.password !== undefined) {
      setValues.encryptedPassword = Buffer.from(updates.password).toString('base64')
      const { strength } = calculatePasswordStrength(updates.password)
      setValues.passwordStrength = strength
      setValues.passwordChangedAt = new Date()
    }

    await db
      .update(schema.vaultItems)
      .set(setValues)
      .where(eq(schema.vaultItems.id, itemId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update item',
    }
  }
}

/**
 * Delete a vault item.
 */
export async function deleteItem(
  orgId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [item] = await db
      .select()
      .from(schema.vaultItems)
      .where(and(eq(schema.vaultItems.id, itemId), eq(schema.vaultItems.orgId, orgId)))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Vault item not found' }
    }

    await db.delete(schema.vaultItems).where(eq(schema.vaultItems.id, itemId))

    // Decrement vault item count
    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(eq(schema.passwordVaults.id, item.vaultId))
      .limit(1)

    if (vault) {
      await db
        .update(schema.passwordVaults)
        .set({ itemCount: Math.max(0, vault.itemCount - 1), updatedAt: new Date() })
        .where(eq(schema.passwordVaults.id, item.vaultId))
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete item',
    }
  }
}

/**
 * Search for items across all accessible vaults.
 */
export async function searchItems(
  orgId: string,
  employeeId: string,
  query: string,
  options?: { type?: VaultItemType; tags?: string[]; limit?: number }
): Promise<{
  items: Array<{
    id: string
    vaultId: string
    vaultName: string
    type: string
    name: string
    url: string | null
    username: string | null
    passwordStrength: string | null
    tags: string[] | null
    lastUsedAt: Date | null
    updatedAt: Date
  }>
  totalResults: number
}> {
  // Get vaults the employee has access to (owned or shared with them)
  const vaults = await db
    .select()
    .from(schema.passwordVaults)
    .where(eq(schema.passwordVaults.orgId, orgId))

  const accessibleVaultIds = vaults
    .filter(v => {
      if (v.ownerId === employeeId) return true
      const sharedWith = (v.sharedWith as ShareConfig[] | null) ?? []
      return sharedWith.some(s => s.employeeId === employeeId)
    })
    .map(v => v.id)

  if (accessibleVaultIds.length === 0) {
    return { items: [], totalResults: 0 }
  }

  // Search items in accessible vaults
  const allItems = []
  for (const vaultId of accessibleVaultIds) {
    const conditions = [
      eq(schema.vaultItems.vaultId, vaultId),
      eq(schema.vaultItems.orgId, orgId),
    ]

    if (options?.type) {
      conditions.push(eq(schema.vaultItems.type, options.type))
    }

    const items = await db
      .select()
      .from(schema.vaultItems)
      .where(and(...conditions))

    const vault = vaults.find(v => v.id === vaultId)

    for (const item of items) {
      // Filter by query
      const matchesQuery = !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.url && item.url.toLowerCase().includes(query.toLowerCase())) ||
        (item.username && item.username.toLowerCase().includes(query.toLowerCase()))

      // Filter by tags
      const matchesTags = !options?.tags || !options.tags.length ||
        (item.tags as string[] | null)?.some(t => options.tags!.includes(t))

      if (matchesQuery && matchesTags) {
        allItems.push({
          id: item.id,
          vaultId: item.vaultId,
          vaultName: vault?.name ?? 'Unknown',
          type: item.type,
          name: item.name,
          url: item.url,
          username: item.username,
          passwordStrength: item.passwordStrength,
          tags: item.tags as string[] | null,
          lastUsedAt: item.lastUsedAt,
          updatedAt: item.updatedAt,
        })
      }
    }
  }

  // Sort by most recently updated
  allItems.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  return {
    items: allItems.slice(0, options?.limit ?? 50),
    totalResults: allItems.length,
  }
}

/**
 * Get the item history (change log) for a vault item.
 */
export async function getItemHistory(
  orgId: string,
  itemId: string
): Promise<{
  item: { id: string; name: string; type: string } | null
  history: Array<{
    field: string
    changedAt: Date
    description: string
  }>
}> {
  const [item] = await db
    .select()
    .from(schema.vaultItems)
    .where(and(eq(schema.vaultItems.id, itemId), eq(schema.vaultItems.orgId, orgId)))
    .limit(1)

  if (!item) {
    return { item: null, history: [] }
  }

  // Build history from timestamps
  const history = []

  history.push({
    field: 'created',
    changedAt: item.createdAt,
    description: `Item "${item.name}" created`,
  })

  if (item.passwordChangedAt && item.passwordChangedAt.getTime() !== item.createdAt.getTime()) {
    history.push({
      field: 'password',
      changedAt: item.passwordChangedAt,
      description: 'Password was updated',
    })
  }

  if (item.updatedAt.getTime() !== item.createdAt.getTime()) {
    history.push({
      field: 'updated',
      changedAt: item.updatedAt,
      description: 'Item details were modified',
    })
  }

  if (item.lastUsedAt) {
    history.push({
      field: 'last_used',
      changedAt: item.lastUsedAt,
      description: 'Item was last accessed',
    })
  }

  // Sort by date descending
  history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())

  return {
    item: { id: item.id, name: item.name, type: item.type },
    history,
  }
}

/**
 * Share a specific vault item with an employee.
 */
export async function shareItem(
  orgId: string,
  itemId: string,
  targetEmployeeId: string,
  role: ShareRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const [item] = await db
      .select()
      .from(schema.vaultItems)
      .where(and(eq(schema.vaultItems.id, itemId), eq(schema.vaultItems.orgId, orgId)))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Vault item not found' }
    }

    // Validate target employee
    const [emp] = await db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(and(eq(schema.employees.id, targetEmployeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!emp) {
      return { success: false, error: 'Target employee not found' }
    }

    // Share the vault that contains this item with the employee
    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(eq(schema.passwordVaults.id, item.vaultId))
      .limit(1)

    if (!vault) {
      return { success: false, error: 'Vault not found' }
    }

    const sharedWith = (vault.sharedWith as ShareConfig[] | null) ?? []
    const existing = sharedWith.find(s => s.employeeId === targetEmployeeId)

    if (existing) {
      // Update role
      existing.role = role
    } else {
      sharedWith.push({ employeeId: targetEmployeeId, role })
    }

    await db
      .update(schema.passwordVaults)
      .set({ sharedWith, isShared: true, updatedAt: new Date() })
      .where(eq(schema.passwordVaults.id, vault.id))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to share item',
    }
  }
}

/**
 * Revoke access to a shared item for an employee.
 */
export async function revokeItemAccess(
  orgId: string,
  itemId: string,
  targetEmployeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [item] = await db
      .select()
      .from(schema.vaultItems)
      .where(and(eq(schema.vaultItems.id, itemId), eq(schema.vaultItems.orgId, orgId)))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Vault item not found' }
    }

    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(eq(schema.passwordVaults.id, item.vaultId))
      .limit(1)

    if (!vault) {
      return { success: false, error: 'Vault not found' }
    }

    const sharedWith = (vault.sharedWith as ShareConfig[] | null) ?? []
    const filtered = sharedWith.filter(s => s.employeeId !== targetEmployeeId)

    await db
      .update(schema.passwordVaults)
      .set({
        sharedWith: filtered,
        isShared: filtered.length > 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.passwordVaults.id, vault.id))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke item access',
    }
  }
}

/**
 * Get all items shared with a specific employee.
 */
export async function getSharedItems(
  orgId: string,
  employeeId: string
): Promise<Array<{
  id: string
  vaultId: string
  vaultName: string
  type: string
  name: string
  url: string | null
  username: string | null
  role: ShareRole
}>> {
  const vaults = await db
    .select()
    .from(schema.passwordVaults)
    .where(eq(schema.passwordVaults.orgId, orgId))

  const sharedVaults = vaults.filter(v => {
    const sharedWith = (v.sharedWith as ShareConfig[] | null) ?? []
    return sharedWith.some(s => s.employeeId === employeeId)
  })

  const results = []

  for (const vault of sharedVaults) {
    const sharedWith = (vault.sharedWith as ShareConfig[] | null) ?? []
    const share = sharedWith.find(s => s.employeeId === employeeId)
    const role = share?.role ?? 'viewer'

    const items = await db
      .select()
      .from(schema.vaultItems)
      .where(eq(schema.vaultItems.vaultId, vault.id))

    for (const item of items) {
      results.push({
        id: item.id,
        vaultId: vault.id,
        vaultName: vault.name,
        type: item.type,
        name: item.name,
        url: item.url,
        username: item.username,
        role,
      })
    }
  }

  return results
}

// ============================================================
// Password Generation & Strength
// ============================================================

/**
 * Generate a strong random password with configurable options.
 */
export async function generatePassword(
  options?: PasswordGenerateOptions
): Promise<{
  password: string
  strength: PasswordStrength
  score: number
  entropy: number
}> {
  const password = generateRandomPassword(options ?? {})
  const analysis = calculatePasswordStrength(password)

  return {
    password,
    strength: analysis.strength,
    score: analysis.score,
    entropy: analysis.entropy,
  }
}

/**
 * Check the strength of a given password.
 */
export async function checkPasswordStrength(
  password: string
): Promise<{
  strength: PasswordStrength
  score: number
  entropy: number
  feedback: string[]
}> {
  const analysis = calculatePasswordStrength(password)
  const feedback: string[] = []

  if (password.length < 8) feedback.push('Password should be at least 8 characters long')
  if (password.length < 12) feedback.push('Consider using at least 12 characters for better security')
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters for more complexity')
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters for more complexity')
  if (!/[0-9]/.test(password)) feedback.push('Add numbers for more complexity')
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters for maximum strength')
  if (/(.)\1{2,}/.test(password)) feedback.push('Avoid repeating characters')
  if (analysis.strength === 'very_strong') feedback.push('Excellent password strength!')

  return {
    strength: analysis.strength,
    score: analysis.score,
    entropy: analysis.entropy,
    feedback,
  }
}

/**
 * Check if a password has been found in data breaches (simulated).
 */
export async function getBreachStatus(
  password: string
): Promise<{
  breached: boolean
  occurrences: number
  recommendation: string
}> {
  const result = simulateBreachCheck(password)

  return {
    breached: result.breached,
    occurrences: result.occurrences,
    recommendation: result.breached
      ? `This password has appeared in ${result.occurrences.toLocaleString()} data breaches. Change it immediately.`
      : 'No known breaches detected for this password.',
  }
}

// ============================================================
// Import / Export
// ============================================================

/**
 * Export all items from a vault in a structured format.
 */
export async function exportVault(
  orgId: string,
  vaultId: string,
  requesterId: string
): Promise<{
  success: boolean
  data?: {
    vaultName: string
    exportedAt: string
    items: Array<{
      type: string
      name: string
      url: string | null
      username: string | null
      notes: string | null
      customFields: any
      tags: any
    }>
    totalItems: number
  }
  error?: string
}> {
  try {
    const [vault] = await db
      .select()
      .from(schema.passwordVaults)
      .where(and(eq(schema.passwordVaults.id, vaultId), eq(schema.passwordVaults.orgId, orgId)))
      .limit(1)

    if (!vault) {
      return { success: false, error: 'Vault not found' }
    }

    // Only owner can export
    if (vault.ownerId !== requesterId) {
      return { success: false, error: 'Only the vault owner can export' }
    }

    const items = await db
      .select()
      .from(schema.vaultItems)
      .where(eq(schema.vaultItems.vaultId, vaultId))
      .orderBy(schema.vaultItems.name)

    return {
      success: true,
      data: {
        vaultName: vault.name,
        exportedAt: new Date().toISOString(),
        items: items.map(item => ({
          type: item.type,
          name: item.name,
          url: item.url,
          username: item.username,
          notes: item.notes,
          customFields: item.customFields,
          tags: item.tags,
          // Note: passwords are NOT exported for security; user must re-enter them
        })),
        totalItems: items.length,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to export vault',
    }
  }
}

/**
 * Import items from a CSV-formatted array into a vault.
 */
export async function importFromCSV(
  orgId: string,
  vaultId: string,
  rows: Array<{
    name: string
    url?: string
    username?: string
    password?: string
    notes?: string
    type?: VaultItemType
  }>
): Promise<ImportResult> {
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.name) {
      skipped++
      errors.push('Skipped row with missing name')
      continue
    }

    try {
      const result = await addItem(orgId, vaultId, {
        type: row.type ?? 'login',
        name: row.name,
        url: row.url,
        username: row.username,
        password: row.password,
        notes: row.notes,
      })

      if (result.success) {
        imported++
      } else {
        skipped++
        errors.push(`Failed to import "${row.name}": ${result.error}`)
      }
    } catch (err) {
      skipped++
      errors.push(`Error importing "${row.name}": ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { imported, skipped, errors }
}

/**
 * Import items from LastPass export format.
 */
export async function importFromLastPass(
  orgId: string,
  vaultId: string,
  items: Array<{
    name: string
    url?: string
    username?: string
    password?: string
    extra?: string // LastPass "extra" field maps to notes
    grouping?: string // LastPass folder maps to tags
  }>
): Promise<ImportResult> {
  const mapped = items.map(item => ({
    name: item.name,
    url: item.url,
    username: item.username,
    password: item.password,
    notes: item.extra,
    type: 'login' as VaultItemType,
  }))

  return importFromCSV(orgId, vaultId, mapped)
}

/**
 * Import items from 1Password export format.
 */
export async function importFrom1Password(
  orgId: string,
  vaultId: string,
  items: Array<{
    title: string
    category?: string // Maps to VaultItemType
    url?: string
    username?: string
    password?: string
    notes?: string
    tags?: string[]
  }>
): Promise<ImportResult> {
  const categoryMap: Record<string, VaultItemType> = {
    'Login': 'login',
    'Secure Note': 'secure_note',
    'Credit Card': 'credit_card',
    'Identity': 'identity',
    'SSH Key': 'ssh_key',
    'API Credential': 'api_key',
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const item of items) {
    if (!item.title) {
      skipped++
      continue
    }

    try {
      const result = await addItem(orgId, vaultId, {
        type: categoryMap[item.category ?? ''] ?? 'login',
        name: item.title,
        url: item.url,
        username: item.username,
        password: item.password,
        notes: item.notes,
        tags: item.tags,
      })

      if (result.success) {
        imported++
      } else {
        skipped++
        errors.push(`Failed to import "${item.title}": ${result.error}`)
      }
    } catch (err) {
      skipped++
      errors.push(`Error importing "${item.title}": ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { imported, skipped, errors }
}

// ============================================================
// Security & Health Scoring
// ============================================================

/**
 * Get the organization-wide password health score.
 */
export async function getPasswordHealthScore(
  orgId: string
): Promise<PasswordHealthScore> {
  const items = await db
    .select()
    .from(schema.vaultItems)
    .where(and(eq(schema.vaultItems.orgId, orgId), eq(schema.vaultItems.type, 'login')))

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  let weakPasswords = 0
  let fairPasswords = 0
  let strongPasswords = 0
  let veryStrongPasswords = 0
  let oldPasswords = 0
  let breachedPasswords = 0
  const passwordHashes = new Map<string, number>()

  for (const item of items) {
    // Count by strength
    switch (item.passwordStrength) {
      case 'weak': weakPasswords++; break
      case 'fair': fairPasswords++; break
      case 'strong': strongPasswords++; break
      case 'very_strong': veryStrongPasswords++; break
    }

    // Check age
    if (item.passwordChangedAt && item.passwordChangedAt < ninetyDaysAgo) {
      oldPasswords++
    }

    // Check for duplicates (using encrypted password as proxy)
    if (item.encryptedPassword) {
      const current = passwordHashes.get(item.encryptedPassword) ?? 0
      passwordHashes.set(item.encryptedPassword, current + 1)
    }

    // Simulate breach check
    if (item.encryptedPassword) {
      try {
        const decoded = Buffer.from(item.encryptedPassword, 'base64').toString('utf-8')
        const { breached } = simulateBreachCheck(decoded)
        if (breached) breachedPasswords++
      } catch { /* ignore decode errors */ }
    }
  }

  const duplicatePasswords = Array.from(passwordHashes.values()).filter(count_val => count_val > 1).reduce((sum, c) => sum + c, 0)
  const totalPasswords = items.length

  // Calculate overall score
  let score = 100
  if (totalPasswords > 0) {
    const weakRatio = weakPasswords / totalPasswords
    const oldRatio = oldPasswords / totalPasswords
    const duplicateRatio = duplicatePasswords / totalPasswords
    const breachedRatio = breachedPasswords / totalPasswords

    score -= Math.round(weakRatio * 30)
    score -= Math.round(oldRatio * 20)
    score -= Math.round(duplicateRatio * 25)
    score -= Math.round(breachedRatio * 25)
    score = Math.max(0, Math.min(100, score))
  }

  // Generate recommendations
  const recommendations: string[] = []
  if (weakPasswords > 0) recommendations.push(`Update ${weakPasswords} weak password(s) to stronger alternatives`)
  if (oldPasswords > 0) recommendations.push(`Rotate ${oldPasswords} password(s) older than 90 days`)
  if (duplicatePasswords > 0) recommendations.push(`Replace ${duplicatePasswords} duplicate password(s) with unique ones`)
  if (breachedPasswords > 0) recommendations.push(`Immediately change ${breachedPasswords} password(s) found in data breaches`)
  if (score >= 90) recommendations.push('Password health is excellent. Continue good practices.')

  return {
    overallScore: score,
    totalPasswords,
    weakPasswords,
    fairPasswords,
    strongPasswords,
    veryStrongPasswords,
    duplicatePasswords,
    oldPasswords,
    breachedPasswords,
    recommendations,
  }
}

/**
 * Get a comprehensive security report for the password manager.
 */
export async function getSecurityReport(
  orgId: string
): Promise<SecurityReportResult> {
  const healthScore = await getPasswordHealthScore(orgId)

  // Vault summary
  const vaults = await db
    .select()
    .from(schema.passwordVaults)
    .where(eq(schema.passwordVaults.orgId, orgId))

  const allItems = await db
    .select()
    .from(schema.vaultItems)
    .where(eq(schema.vaultItems.orgId, orgId))

  const itemsByType: Record<string, number> = {}
  for (const item of allItems) {
    itemsByType[item.type] = (itemsByType[item.type] ?? 0) + 1
  }

  // Recent activity (from audit log)
  const recentAudit = await db
    .select()
    .from(schema.auditLog)
    .where(and(
      eq(schema.auditLog.orgId, orgId),
      eq(schema.auditLog.entityType, 'vault_item')
    ))
    .orderBy(desc(schema.auditLog.timestamp))
    .limit(20)

  const recentActivity = recentAudit.map(a => ({
    action: a.action,
    itemName: a.entityId ?? '',
    vaultName: a.details ?? '',
    timestamp: a.timestamp,
  }))

  return {
    healthScore,
    vaultSummary: {
      totalVaults: vaults.length,
      sharedVaults: vaults.filter(v => v.isShared).length,
      personalVaults: vaults.filter(v => !v.isShared).length,
      totalItems: allItems.length,
      itemsByType,
    },
    recentActivity,
  }
}

/**
 * Get auto-fill credentials for a specific URL.
 */
export async function autoFillCredentials(
  orgId: string,
  employeeId: string,
  url: string
): Promise<{
  matches: Array<{
    itemId: string
    name: string
    username: string | null
    url: string | null
  }>
}> {
  // Get accessible vaults
  const vaults = await db
    .select()
    .from(schema.passwordVaults)
    .where(eq(schema.passwordVaults.orgId, orgId))

  const accessibleVaultIds = vaults
    .filter(v => {
      if (v.ownerId === employeeId) return true
      const sharedWith = (v.sharedWith as ShareConfig[] | null) ?? []
      return sharedWith.some(s => s.employeeId === employeeId)
    })
    .map(v => v.id)

  if (accessibleVaultIds.length === 0) {
    return { matches: [] }
  }

  // Parse the domain from the URL
  let domain = ''
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    domain = parsed.hostname
  } catch {
    domain = url
  }

  const matches = []

  for (const vaultId of accessibleVaultIds) {
    const items = await db
      .select()
      .from(schema.vaultItems)
      .where(and(
        eq(schema.vaultItems.vaultId, vaultId),
        eq(schema.vaultItems.type, 'login'),
        eq(schema.vaultItems.autoFill, true)
      ))

    for (const item of items) {
      if (item.url) {
        let itemDomain = ''
        try {
          const parsed = new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`)
          itemDomain = parsed.hostname
        } catch {
          itemDomain = item.url
        }

        if (itemDomain === domain || itemDomain.endsWith(`.${domain}`) || domain.endsWith(`.${itemDomain}`)) {
          matches.push({
            itemId: item.id,
            name: item.name,
            username: item.username,
            url: item.url,
          })

          // Update last used timestamp
          await db
            .update(schema.vaultItems)
            .set({ lastUsedAt: new Date() })
            .where(eq(schema.vaultItems.id, item.id))
        }
      }
    }
  }

  return { matches }
}

/**
 * Get items that need password rotation (stale passwords > 90 days).
 */
export async function rotatePasswords(
  orgId: string,
  employeeId: string
): Promise<{
  itemsNeedingRotation: Array<{
    itemId: string
    name: string
    url: string | null
    lastChanged: Date | null
    daysSinceChange: number
    strength: string | null
  }>
  totalStale: number
}> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const now = new Date()

  // Get accessible vaults
  const vaults = await db
    .select()
    .from(schema.passwordVaults)
    .where(eq(schema.passwordVaults.orgId, orgId))

  const accessibleVaultIds = vaults
    .filter(v => v.ownerId === employeeId)
    .map(v => v.id)

  const staleItems = []

  for (const vaultId of accessibleVaultIds) {
    const items = await db
      .select()
      .from(schema.vaultItems)
      .where(and(
        eq(schema.vaultItems.vaultId, vaultId),
        eq(schema.vaultItems.type, 'login')
      ))

    for (const item of items) {
      if (item.encryptedPassword) {
        const lastChanged = item.passwordChangedAt ?? item.createdAt
        if (lastChanged < ninetyDaysAgo) {
          const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (24 * 60 * 60 * 1000))
          staleItems.push({
            itemId: item.id,
            name: item.name,
            url: item.url,
            lastChanged,
            daysSinceChange,
            strength: item.passwordStrength,
          })
        }
      }
    }
  }

  // Sort by oldest first
  staleItems.sort((a, b) => (a.lastChanged?.getTime() ?? 0) - (b.lastChanged?.getTime() ?? 0))

  return {
    itemsNeedingRotation: staleItems,
    totalStale: staleItems.length,
  }
}
