/**
 * Academy i18n Engine — Multi-language content management for academies.
 *
 * Provides translation CRUD for any academy entity (academy, course, session,
 * assignment, resource). Supports bulk upsert and entity-level translation
 * retrieval with field overlay.
 *
 * All functions require orgId for RLS scoping.
 */

import { db, schema } from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'

// ============================================================
// TYPES
// ============================================================

export interface SupportedLanguage {
  code: string
  label: string
  nativeLabel: string
  direction: 'ltr' | 'rtl'
}

export interface TranslationInput {
  entityType: string
  entityId: string
  field: string
  language: string
  value: string
}

// ============================================================
// SUPPORTED LANGUAGES
// ============================================================

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', direction: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Fran\u00e7ais', direction: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Espa\u00f1ol', direction: 'ltr' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Portugu\u00eas', direction: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', direction: 'rtl' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', direction: 'ltr' },
]

/** Return the list of supported languages with metadata */
export function getSupportedLanguages(): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES
}

// ============================================================
// SINGLE TRANSLATION CRUD
// ============================================================

/**
 * Set a translation for a specific entity field in a given language.
 * Upserts — creates if new, updates if existing.
 */
export async function setTranslation(
  orgId: string,
  academyId: string,
  entityType: string,
  entityId: string,
  field: string,
  language: string,
  value: string,
) {
  // Check if translation already exists
  const [existing] = await db
    .select({ id: schema.academyTranslations.id })
    .from(schema.academyTranslations)
    .where(
      and(
        eq(schema.academyTranslations.orgId, orgId),
        eq(schema.academyTranslations.academyId, academyId),
        eq(schema.academyTranslations.entityType, entityType),
        eq(schema.academyTranslations.entityId, entityId),
        eq(schema.academyTranslations.field, field),
        eq(schema.academyTranslations.language, language),
      ),
    )

  if (existing) {
    const [updated] = await db
      .update(schema.academyTranslations)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.academyTranslations.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(schema.academyTranslations)
    .values({
      orgId,
      academyId,
      entityType,
      entityId,
      field,
      language,
      value,
    })
    .returning()

  return created
}

/**
 * Get a single translated value for a specific entity/field/language.
 * Returns the translated string or null if no translation exists.
 */
export async function getTranslation(
  orgId: string,
  academyId: string,
  entityType: string,
  entityId: string,
  field: string,
  language: string,
): Promise<string | null> {
  const [row] = await db
    .select({ value: schema.academyTranslations.value })
    .from(schema.academyTranslations)
    .where(
      and(
        eq(schema.academyTranslations.orgId, orgId),
        eq(schema.academyTranslations.academyId, academyId),
        eq(schema.academyTranslations.entityType, entityType),
        eq(schema.academyTranslations.entityId, entityId),
        eq(schema.academyTranslations.field, field),
        eq(schema.academyTranslations.language, language),
      ),
    )

  return row?.value ?? null
}

// ============================================================
// BULK OPERATIONS
// ============================================================

/**
 * Get all translations for a specific entity across all languages and fields.
 * Returns a map of { [language]: { [field]: value } }.
 */
export async function getTranslations(
  orgId: string,
  academyId: string,
  entityType: string,
  entityId: string,
): Promise<Record<string, Record<string, string>>> {
  const rows = await db
    .select()
    .from(schema.academyTranslations)
    .where(
      and(
        eq(schema.academyTranslations.orgId, orgId),
        eq(schema.academyTranslations.academyId, academyId),
        eq(schema.academyTranslations.entityType, entityType),
        eq(schema.academyTranslations.entityId, entityId),
      ),
    )

  const result: Record<string, Record<string, string>> = {}
  for (const row of rows) {
    if (!result[row.language]) result[row.language] = {}
    result[row.language][row.field] = row.value
  }
  return result
}

/**
 * Get an entity with all translated fields applied for a specific language.
 * Fetches the base entity from the appropriate table, then overlays translations.
 * Returns { ...baseEntity, _translations: { [field]: translatedValue } }.
 */
export async function getTranslatedEntity(
  orgId: string,
  academyId: string,
  entityType: string,
  entityId: string,
  language: string,
): Promise<{ entityType: string; entityId: string; language: string; translations: Record<string, string> }> {
  const rows = await db
    .select({ field: schema.academyTranslations.field, value: schema.academyTranslations.value })
    .from(schema.academyTranslations)
    .where(
      and(
        eq(schema.academyTranslations.orgId, orgId),
        eq(schema.academyTranslations.academyId, academyId),
        eq(schema.academyTranslations.entityType, entityType),
        eq(schema.academyTranslations.entityId, entityId),
        eq(schema.academyTranslations.language, language),
      ),
    )

  const translations: Record<string, string> = {}
  for (const row of rows) {
    translations[row.field] = row.value
  }

  return { entityType, entityId, language, translations }
}

/**
 * Batch upsert translations. Processes each translation individually
 * to handle the upsert logic correctly.
 */
export async function bulkSetTranslations(
  orgId: string,
  academyId: string,
  translations: TranslationInput[],
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  for (const t of translations) {
    // Check existence
    const [existing] = await db
      .select({ id: schema.academyTranslations.id })
      .from(schema.academyTranslations)
      .where(
        and(
          eq(schema.academyTranslations.orgId, orgId),
          eq(schema.academyTranslations.academyId, academyId),
          eq(schema.academyTranslations.entityType, t.entityType),
          eq(schema.academyTranslations.entityId, t.entityId),
          eq(schema.academyTranslations.field, t.field),
          eq(schema.academyTranslations.language, t.language),
        ),
      )

    if (existing) {
      await db
        .update(schema.academyTranslations)
        .set({ value: t.value, updatedAt: new Date() })
        .where(eq(schema.academyTranslations.id, existing.id))
      updated++
    } else {
      await db.insert(schema.academyTranslations).values({
        orgId,
        academyId,
        entityType: t.entityType,
        entityId: t.entityId,
        field: t.field,
        language: t.language,
        value: t.value,
      })
      created++
    }
  }

  return { created, updated }
}

/**
 * Delete all translations for a specific entity.
 */
export async function deleteTranslations(
  orgId: string,
  academyId: string,
  entityType: string,
  entityId: string,
): Promise<number> {
  const result = await db
    .delete(schema.academyTranslations)
    .where(
      and(
        eq(schema.academyTranslations.orgId, orgId),
        eq(schema.academyTranslations.academyId, academyId),
        eq(schema.academyTranslations.entityType, entityType),
        eq(schema.academyTranslations.entityId, entityId),
      ),
    )
    .returning({ id: schema.academyTranslations.id })

  return result.length
}

/**
 * Get all translations for an academy, grouped by entity.
 * Useful for admin bulk export/review.
 */
export async function getAcademyTranslations(
  orgId: string,
  academyId: string,
  language?: string,
): Promise<Record<string, Record<string, Record<string, string>>>> {
  const conditions = [
    eq(schema.academyTranslations.orgId, orgId),
    eq(schema.academyTranslations.academyId, academyId),
  ]
  if (language) {
    conditions.push(eq(schema.academyTranslations.language, language))
  }

  const rows = await db
    .select()
    .from(schema.academyTranslations)
    .where(and(...conditions))

  // Group by entityType:entityId -> language -> field -> value
  const result: Record<string, Record<string, Record<string, string>>> = {}
  for (const row of rows) {
    const key = `${row.entityType}:${row.entityId}`
    if (!result[key]) result[key] = {}
    if (!result[key][row.language]) result[key][row.language] = {}
    result[key][row.language][row.field] = row.value
  }

  return result
}
