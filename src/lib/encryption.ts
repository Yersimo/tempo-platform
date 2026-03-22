// AES-256-GCM Field-Level Encryption for SOC 2 / HIPAA Compliance
// Uses Web Crypto API for browser and edge runtime compatibility

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

// --- Key Management ---

export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(raw);
}

export async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// --- Field Encryption / Decryption ---

export async function encryptField(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  const ivBase64 = bufferToBase64(iv.buffer);
  const cipherBase64 = bufferToBase64(cipherBuffer);

  return `${ivBase64}:${cipherBase64}`;
}

export async function decryptField(
  encrypted: string,
  key: CryptoKey
): Promise<string> {
  const separatorIndex = encrypted.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error('Invalid encrypted field format. Expected iv:ciphertext');
  }

  const ivBase64 = encrypted.slice(0, separatorIndex);
  const cipherBase64 = encrypted.slice(separatorIndex + 1);

  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const cipherBuffer = base64ToBuffer(cipherBase64);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipherBuffer
  );

  return new TextDecoder().decode(plainBuffer);
}

// --- One-Way Hashing ---

export async function hashField(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Object-Level Encryption ---

export async function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  key: CryptoKey
): Promise<T> {
  const result = { ...obj };

  for (const field of fields) {
    const value = result[field];
    if (value !== undefined && value !== null) {
      const plaintext = typeof value === 'string' ? value : JSON.stringify(value);
      (result as Record<string, unknown>)[field] = await encryptField(plaintext, key);
    }
  }

  return result;
}

export async function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
  key: CryptoKey
): Promise<T> {
  const result = { ...obj };

  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string' && value.includes(':')) {
      try {
        const decrypted = await decryptField(value, key);
        // Attempt to parse JSON for non-string original values
        try {
          (result as Record<string, unknown>)[field] = JSON.parse(decrypted);
        } catch {
          (result as Record<string, unknown>)[field] = decrypted;
        }
      } catch {
        // Field was not encrypted or key mismatch; leave as-is
      }
    }
  }

  return result;
}

// --- Sensitive Fields Registry ---

export const SENSITIVE_FIELDS: Record<string, string[]> = {
  employee: [
    'ssn',
    'socialSecurityNumber',
    'taxId',
    'dateOfBirth',
    'bankAccountNumber',
    'routingNumber',
    'salary',
    'compensationDetails',
    'medicalInfo',
    'healthInsuranceId',
    'disabilityStatus',
    'ethnicity',
    'veteranStatus',
  ],
  payroll: [
    'grossPay',
    'netPay',
    'taxWithholding',
    'bankAccountNumber',
    'routingNumber',
    'ssn',
    'federalTax',
    'stateTax',
    'deductions',
  ],
  benefits: [
    'healthInsuranceId',
    'beneficiaryInfo',
    'medicalConditions',
    'dependentSSN',
    'claimDetails',
  ],
  recruiting: [
    'candidateSSN',
    'backgroundCheckResults',
    'drugTestResults',
    'salaryExpectation',
    'currentSalary',
    'references',
  ],
  performance: [
    'performanceScore',
    'managerNotes',
    'pipDetails',
    'disciplinaryNotes',
  ],
  finance: [
    'bankAccountNumber',
    'routingNumber',
    'taxId',
    'ein',
    'creditCardNumber',
    'invoiceAmount',
  ],
  user: [
    'passwordHash',
    'mfaSecret',
    'recoveryKeys',
    'securityAnswers',
    'apiKeys',
  ],
};

// --- Per-Tenant Key Management (Gap 5) ---

const keyRegistry = new Map<string, CryptoKey>()

export async function getOrgEncryptionKey(orgId: string): Promise<CryptoKey> {
  // Check cache
  if (keyRegistry.has(orgId)) return keyRegistry.get(orgId)!

  // Try org-specific env var first
  const orgKeyEnv = process.env[`ENCRYPTION_KEY_${orgId.replace(/-/g, '_').toUpperCase()}`]
  if (orgKeyEnv) {
    const key = await importKey(orgKeyEnv)
    keyRegistry.set(orgId, key)
    return key
  }

  // Fall back to default key
  const defaultKey = process.env.ENCRYPTION_KEY || process.env.FIELD_ENCRYPTION_KEY
  if (defaultKey) {
    const key = await importKey(defaultKey)
    keyRegistry.set(orgId, key)
    return key
  }

  // Generate a new key for this org (dev mode)
  const key = await generateKey()
  keyRegistry.set(orgId, key)
  return key
}

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

// Versioned encryption — prepend version: v1:iv:ciphertext
export interface EncryptedValue {
  version: number // key version for rotation
  iv: string
  ciphertext: string
}

export async function encryptFieldWithVersion(
  value: string,
  key: CryptoKey,
  version: number = 1
): Promise<string> {
  const encrypted = await encryptField(value, key)
  return `v${version}:${encrypted}`
}

export async function decryptFieldWithVersion(
  encrypted: string,
  getKeyForVersion: (version: number) => Promise<CryptoKey | undefined>
): Promise<string> {
  const versionMatch = encrypted.match(/^v(\d+):(.+)$/)
  if (!versionMatch) {
    // No version prefix — legacy format, caller must provide key directly
    throw new Error('No version prefix found. Use decryptField for legacy data.')
  }

  const version = parseInt(versionMatch[1], 10)
  const ciphertext = versionMatch[2]
  const key = await getKeyForVersion(version)
  if (!key) {
    throw new Error(`No key found for version ${version}`)
  }

  return decryptField(ciphertext, key)
}

// --- Key Rotation (Gap 6) ---

export interface KeyRotationConfig {
  currentVersion: number
  keys: Map<number, CryptoKey> // version -> key
  rotationDate?: string
}

const rotationConfigs = new Map<string, KeyRotationConfig>()

export function getRotationConfig(orgId: string): KeyRotationConfig | undefined {
  return rotationConfigs.get(orgId)
}

export async function rotateOrgKey(orgId: string): Promise<{ newVersion: number }> {
  const config: KeyRotationConfig = rotationConfigs.get(orgId) || { currentVersion: 1, keys: new Map() }
  const newVersion = config.currentVersion + 1
  const newKey = await generateKey()

  config.keys.set(newVersion, newKey)
  config.currentVersion = newVersion
  config.rotationDate = new Date().toISOString()
  rotationConfigs.set(orgId, config)

  // Update the key registry with the new current key
  keyRegistry.set(orgId, newKey)

  return { newVersion }
}

export async function reEncryptWithNewKey(
  encryptedValue: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
  newVersion: number
): Promise<string> {
  // Strip version prefix if present
  const stripped = encryptedValue.replace(/^v\d+:/, '')
  // Decrypt with old key
  const plaintext = await decryptField(stripped, oldKey)
  // Re-encrypt with new key
  return encryptFieldWithVersion(plaintext, newKey, newVersion)
}

// --- Buffer Utilities ---

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
