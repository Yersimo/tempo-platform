/**
 * Bank Payment File Generator
 * 
 * Generates payment instruction files for bank transfer networks:
 * - NIBSS (Nigeria Inter-Bank Settlement System) - for Nigerian payroll
 * - GhIPSS (Ghana Interbank Payment & Settlement Systems) - for Ghanaian payroll
 * - RTGS/EFT (Kenya) - for Kenyan payroll
 * - ACH (USA/International) - for NACHA-format transfers
 * - SEPA (Europe) - for EUR transfers
 * - Generic CSV - universal fallback
 */

export interface PaymentInstruction {
  employeeId: string
  employeeName: string
  bankName: string
  bankCode: string        // sort code / routing number
  accountNumber: string
  amount: number
  currency: string
  reference: string       // payment reference
  narration?: string      // payment description
}

export interface PaymentFileResult {
  format: string
  filename: string
  content: string         // file content (CSV, fixed-width, or XML)
  mimeType: string
  totalAmount: number
  transactionCount: number
  checksum?: string
}

// ─── NIBSS Format (Nigeria) ──────────────────────────────────────────
// NIBSS NIP (NIBSS Instant Payment) bulk format
export function generateNIBSSFile(
  instructions: PaymentInstruction[],
  senderBankCode: string,
  senderAccountNumber: string,
  batchReference: string,
): PaymentFileResult {
  const header = [
    'H', // Header indicator
    senderBankCode.padEnd(6, '0'),
    senderAccountNumber.padEnd(10, '0'),
    batchReference.padEnd(16, ' '),
    instructions.length.toString().padStart(6, '0'),
    instructions.reduce((s, i) => s + i.amount, 0).toFixed(2).replace('.', '').padStart(15, '0'),
    new Date().toISOString().slice(0, 10).replace(/-/g, ''),
  ].join(',')

  const lines = instructions.map((inst, idx) => [
    'D', // Detail indicator
    (idx + 1).toString().padStart(6, '0'),
    inst.bankCode.padEnd(6, '0'),
    inst.accountNumber.padEnd(10, '0'),
    inst.amount.toFixed(2).replace('.', '').padStart(15, '0'),
    inst.employeeName.substring(0, 30).padEnd(30, ' '),
    (inst.narration || `SAL-${batchReference}`).substring(0, 30).padEnd(30, ' '),
    'NGN',
  ].join(','))

  const totalAmount = instructions.reduce((s, i) => s + i.amount, 0)
  const trailer = [
    'T',
    instructions.length.toString().padStart(6, '0'),
    totalAmount.toFixed(2).replace('.', '').padStart(15, '0'),
  ].join(',')

  const content = [header, ...lines, trailer].join('\n')

  return {
    format: 'NIBSS',
    filename: `NIBSS_${batchReference}_${Date.now()}.csv`,
    content,
    mimeType: 'text/csv',
    totalAmount,
    transactionCount: instructions.length,
    checksum: simpleChecksum(content),
  }
}

// ─── GhIPSS Format (Ghana) ──────────────────────────────────────────
// Ghana Automated Clearing House (ACH) credit format
export function generateGhIPSSFile(
  instructions: PaymentInstruction[],
  senderBankCode: string,
  senderAccountNumber: string,
  batchReference: string,
): PaymentFileResult {
  const dateStr = new Date().toISOString().slice(0, 10)
  
  const lines = [
    // Header
    `HDR,${senderBankCode},${senderAccountNumber},${dateStr},${batchReference},${instructions.length}`,
    // Detail records
    ...instructions.map((inst, idx) =>
      `DTL,${idx + 1},${inst.bankCode},${inst.accountNumber},${inst.amount.toFixed(2)},${inst.employeeName},${inst.reference},GHS`
    ),
    // Trailer
    `TRL,${instructions.length},${instructions.reduce((s, i) => s + i.amount, 0).toFixed(2)}`,
  ]

  const content = lines.join('\n')
  const totalAmount = instructions.reduce((s, i) => s + i.amount, 0)

  return {
    format: 'GhIPSS',
    filename: `GhIPSS_${batchReference}_${Date.now()}.csv`,
    content,
    mimeType: 'text/csv',
    totalAmount,
    transactionCount: instructions.length,
    checksum: simpleChecksum(content),
  }
}

// ─── Kenya RTGS/EFT Format ──────────────────────────────────────────
export function generateKenyaEFTFile(
  instructions: PaymentInstruction[],
  senderBankCode: string,
  senderAccountNumber: string,
  batchReference: string,
): PaymentFileResult {
  const dateStr = new Date().toISOString().slice(0, 10)

  const lines = [
    `H,${senderBankCode},${senderAccountNumber},${dateStr},KES,${batchReference}`,
    ...instructions.map((inst, idx) =>
      `D,${idx + 1},${inst.bankCode},${inst.accountNumber},${inst.amount.toFixed(2)},${inst.employeeName.replace(/,/g, ' ')},SALARY,${inst.reference}`
    ),
    `T,${instructions.length},${instructions.reduce((s, i) => s + i.amount, 0).toFixed(2)}`,
  ]

  const content = lines.join('\n')
  const totalAmount = instructions.reduce((s, i) => s + i.amount, 0)

  return {
    format: 'Kenya-EFT',
    filename: `KE_EFT_${batchReference}_${Date.now()}.csv`,
    content,
    mimeType: 'text/csv',
    totalAmount,
    transactionCount: instructions.length,
    checksum: simpleChecksum(content),
  }
}

// ─── NACHA/ACH Format (USA/International) ────────────────────────────
// Standard NACHA ACH file for direct deposits
export function generateACHFile(
  instructions: PaymentInstruction[],
  originatorId: string,        // 10-digit company ID
  originatorName: string,      // company name (max 16 chars)
  originatorBankRouting: string, // 9-digit ABA routing
  batchReference: string,
): PaymentFileResult {
  const now = new Date()
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '')  // YYMMDD
  const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`
  const fileIdModifier = 'A'

  // File Header Record (Type 1)
  const fileHeader = [
    '1',                                          // Record Type
    '01',                                         // Priority Code
    ` ${originatorBankRouting}`,                   // Immediate Destination (10)
    originatorId.padStart(10, ' '),                // Immediate Origin (10)
    dateStr,                                       // File Creation Date
    timeStr,                                       // File Creation Time
    fileIdModifier,                                // File ID Modifier
    '094',                                         // Record Size
    '10',                                          // Blocking Factor
    '1',                                           // Format Code
    originatorBankRouting.padEnd(23, ' '),          // Destination Name
    originatorName.padEnd(23, ' '),                 // Origin Name
    batchReference.padEnd(8, ' '),                  // Reference Code
  ].join('')

  // Batch Header Record (Type 5)
  const batchHeader = [
    '5',                                          // Record Type
    '220',                                        // Service Class (220 = credits only)
    originatorName.padEnd(16, ' '),                // Company Name
    ''.padEnd(20, ' '),                            // Company Discretionary Data
    originatorId.padStart(10, '0'),                // Company Identification
    'PPD',                                        // Standard Entry Class
    'PAYROLL'.padEnd(10, ' '),                     // Company Entry Description
    dateStr,                                       // Company Descriptive Date
    dateStr,                                       // Effective Entry Date
    ''.padEnd(3, ' '),                             // Settlement Date (Julian)
    '1',                                           // Originator Status Code
    originatorBankRouting.substring(0, 8),          // Originating DFI ID
    '0000001',                                     // Batch Number
  ].join('')

  // Entry Detail Records (Type 6)
  const entries = instructions.map((inst, idx) => {
    const traceNum = `${originatorBankRouting.substring(0, 8)}${(idx + 1).toString().padStart(7, '0')}`
    return [
      '6',                                        // Record Type
      '22',                                       // Transaction Code (22 = checking credit)
      inst.bankCode.padEnd(9, ' '),                // Receiving DFI ID
      inst.accountNumber.padEnd(17, ' '),           // DFI Account Number
      Math.round(inst.amount * 100).toString().padStart(10, '0'), // Amount (cents)
      inst.employeeId.padEnd(15, ' '),              // Individual ID
      inst.employeeName.substring(0, 22).padEnd(22, ' '), // Individual Name
      '  ',                                        // Discretionary Data
      '0',                                         // Addenda Record Indicator
      traceNum,                                    // Trace Number
    ].join('')
  })

  const totalAmount = instructions.reduce((s, i) => s + i.amount, 0)
  const totalCents = Math.round(totalAmount * 100)
  const entryHash = instructions.reduce((sum, inst) => sum + parseInt(inst.bankCode.substring(0, 8) || '0'), 0) % 10000000000

  // Batch Control Record (Type 8)
  const batchControl = [
    '8',                                          // Record Type
    '220',                                        // Service Class
    instructions.length.toString().padStart(6, '0'), // Entry/Addenda Count
    entryHash.toString().padStart(10, '0'),         // Entry Hash
    '0'.padStart(12, '0'),                          // Total Debit Amount
    totalCents.toString().padStart(12, '0'),        // Total Credit Amount
    originatorId.padStart(10, '0'),                // Company Identification
    ''.padEnd(25, ' '),                             // Auth Code + Reserved
    originatorBankRouting.substring(0, 8),          // Originating DFI ID
    '0000001',                                     // Batch Number
  ].join('')

  // File Control Record (Type 9)
  const blockCount = Math.ceil((4 + instructions.length) / 10)
  const fileControl = [
    '9',                                          // Record Type
    '000001',                                     // Batch Count
    blockCount.toString().padStart(6, '0'),         // Block Count
    instructions.length.toString().padStart(8, '0'), // Entry/Addenda Count
    entryHash.toString().padStart(10, '0'),         // Entry Hash
    '0'.padStart(12, '0'),                          // Total Debit Amount
    totalCents.toString().padStart(12, '0'),        // Total Credit Amount
    ''.padEnd(39, ' '),                             // Reserved
  ].join('')

  const content = [fileHeader, batchHeader, ...entries, batchControl, fileControl].join('\n')

  return {
    format: 'ACH/NACHA',
    filename: `ACH_${batchReference}_${Date.now()}.ach`,
    content,
    mimeType: 'text/plain',
    totalAmount,
    transactionCount: instructions.length,
    checksum: simpleChecksum(content),
  }
}

// ─── Generic CSV Format (Universal Fallback) ─────────────────────────
export function generateGenericCSV(
  instructions: PaymentInstruction[],
  batchReference: string,
): PaymentFileResult {
  const header = 'Employee ID,Employee Name,Bank Name,Bank Code,Account Number,Amount,Currency,Reference,Narration'
  const rows = instructions.map(inst =>
    `${inst.employeeId},"${inst.employeeName}","${inst.bankName}",${inst.bankCode},${inst.accountNumber},${inst.amount.toFixed(2)},${inst.currency},${inst.reference},"${inst.narration || 'Salary Payment'}"`
  )

  const content = [header, ...rows].join('\n')
  const totalAmount = instructions.reduce((s, i) => s + i.amount, 0)

  return {
    format: 'CSV',
    filename: `PAYROLL_${batchReference}_${Date.now()}.csv`,
    content,
    mimeType: 'text/csv',
    totalAmount,
    transactionCount: instructions.length,
  }
}

// ─── Auto-select format by country ──────────────────────────────────
export function generatePaymentFile(
  country: string,
  instructions: PaymentInstruction[],
  senderBankCode: string,
  senderAccountNumber: string,
  batchReference: string,
  originatorId?: string,
  originatorName?: string,
): PaymentFileResult {
  switch (country) {
    case 'NG':
      return generateNIBSSFile(instructions, senderBankCode, senderAccountNumber, batchReference)
    case 'GH':
      return generateGhIPSSFile(instructions, senderBankCode, senderAccountNumber, batchReference)
    case 'KE':
      return generateKenyaEFTFile(instructions, senderBankCode, senderAccountNumber, batchReference)
    case 'US':
      return generateACHFile(
        instructions,
        originatorId || '0000000000',
        originatorName || 'TEMPO PAYROLL',
        senderBankCode,
        batchReference,
      )
    default:
      return generateGenericCSV(instructions, batchReference)
  }
}

// Simple checksum for file integrity verification
function simpleChecksum(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}
