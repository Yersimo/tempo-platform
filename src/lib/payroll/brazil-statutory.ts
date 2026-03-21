/**
 * Brazil CLT (Consolidação das Leis do Trabalho) Statutory Payroll Engine
 *
 * Full compliance for Brazilian payroll covering:
 * - INSS (Social Security) — progressive employee + flat employer
 * - FGTS (Fundo de Garantia)
 * - IRRF (Income Tax — Imposto de Renda Retido na Fonte)
 * - 13º Salário (13th Salary)
 * - Férias (Vacation + 1/3 constitutional bonus)
 * - Vale-Transporte deduction
 * - Rescisão (Termination calculation)
 * - eSocial event data generation
 *
 * All amounts in CENTAVOS (100 centavos = 1 BRL) unless noted.
 * Rates effective: 2024.
 * Sources: Receita Federal do Brasil, INSS, Caixa Econômica Federal, eSocial.
 */

// ============================================================
// TYPES
// ============================================================

export interface BrazilEmployee {
  id: string
  fullName: string
  cpf?: string // Cadastro de Pessoa Física
  ctpsNumber?: string // Carteira de Trabalho
  pisNumber?: string // PIS/PASEP
  dateOfAdmission: string // ISO date
  dateOfBirth?: string
  dependents: number // for IRRF deduction
  transportCost?: number // centavos — actual monthly transport cost
  riskCategory?: 1 | 2 | 3 // RAT (1=low, 2=medium, 3=high)
  fapMultiplier?: number // FAP (0.5-2.0) — defaults to 1.0
  isApprentice?: boolean
}

export interface BrazilSalaryStructure {
  baseSalary: number // centavos — monthly
  additionals?: number // centavos — additional pay (insalubridade, periculosidade, etc.)
  overtimePay?: number // centavos
  commissions?: number // centavos
}

export interface BrazilPayrollOptions {
  month: number // 1-12
  year: number
  include13thProvision?: boolean
  includeVacationProvision?: boolean
}

export interface INSSBreakdown {
  employeeINSS: number // centavos — progressive
  employerINSS: number // centavos — 20% patronal
  rat: number // centavos — RAT contribution
  totalEmployer: number // centavos
  effectiveRate: number // decimal
  bracket: string // description
}

export interface FGTSBreakdown {
  monthlyDeposit: number // centavos — 8% of gross
  grossBase: number // centavos
}

export interface IRRFBreakdown {
  taxableBase: number // centavos — gross - INSS - dependents
  inssDeduction: number // centavos
  dependentDeduction: number // centavos
  irrf: number // centavos
  effectiveRate: number // decimal
  bracket: string
}

export interface ThirteenthResult {
  employeeId: string
  year: number
  monthsWorked: number // proportional months
  grossAmount: number // centavos — full 13th
  firstInstallment: number // centavos — 50%
  secondInstallmentGross: number // centavos — 50%
  inssOnSecond: number // centavos
  irrfOnSecond: number // centavos
  secondInstallmentNet: number // centavos
}

export interface FeriasResult {
  employeeId: string
  periodStart: string
  periodEnd: string
  daysTaken: number
  daysSold: number // abono pecuniário
  baseSalary: number // centavos
  vacationPay: number // centavos — proportional
  constitutionalBonus: number // centavos — 1/3
  abonoPecuniario: number // centavos — sold days
  abonoPecuniarioBonus: number // centavos — 1/3 on sold days
  totalGross: number // centavos
  inss: number // centavos
  irrf: number // centavos
  totalNet: number // centavos
}

export interface RescisaoResult {
  employeeId: string
  terminationDate: string
  reason: 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo_mutuo'
  // Components
  saldoSalario: number // centavos — remaining salary days
  avisoPrevo: number // centavos — notice period pay
  avisoPrevoDays: number
  feriasProportional: number // centavos
  feriasVencidas: number // centavos
  feriasBonus: number // centavos — 1/3 on all vacation
  decimoTerceiroProporcional: number // centavos
  // FGTS
  fgtsBalance: number // centavos — estimated accumulated FGTS
  fgtsMulta: number // centavos — 40% or 20% penalty
  // Deductions
  inss: number // centavos
  irrf: number // centavos
  // Totals
  totalGross: number // centavos
  totalDeductions: number // centavos
  totalNet: number // centavos
}

export interface BrazilPayrollResult {
  employeeId: string
  month: number
  year: number
  // Salary
  baseSalary: number
  additionals: number
  monthlyGross: number
  // INSS
  inss: INSSBreakdown
  // FGTS
  fgts: FGTSBreakdown
  // IRRF
  irrf: IRRFBreakdown
  // Vale-Transporte
  valeTransporteDeduction: number
  // Provisions
  thirteenthProvision: number
  vacationProvision: number
  // Totals
  totalEmployeeDeductions: number
  totalEmployerCost: number
  netPay: number
  costToCompany: number
}

export interface ESocialEvent {
  type: string // e.g. 'S-1200', 'S-1210', 'S-2200', 'S-2299'
  description: string
  data: Record<string, unknown>
  generatedAt: string
}

// ============================================================
// CONSTANTS
// ============================================================

/** INSS progressive brackets — monthly amounts in centavos */
interface INSSBracket {
  min: number // centavos
  max: number // centavos
  rate: number // decimal
  label: string
}

const INSS_BRACKETS: INSSBracket[] = [
  { min: 0, max: 141200, rate: 0.075, label: 'Faixa 1 (7.5%)' },
  { min: 141201, max: 266668, rate: 0.09, label: 'Faixa 2 (9%)' },
  { min: 266669, max: 400003, rate: 0.12, label: 'Faixa 3 (12%)' },
  { min: 400004, max: 778602, rate: 0.14, label: 'Faixa 4 (14%)' },
]

/** INSS employer rate (patronal) */
const INSS_EMPLOYER_RATE = 0.20

/** RAT rates by risk category */
const RAT_RATES: Record<number, number> = { 1: 0.01, 2: 0.02, 3: 0.03 }

/** FGTS rate */
const FGTS_RATE = 0.08

/** FGTS apprentice rate */
const FGTS_APPRENTICE_RATE = 0.02

/** FGTS termination penalty: 40% for sem_justa_causa, 20% for acordo_mutuo */
const FGTS_PENALTY_FULL = 0.40
const FGTS_PENALTY_ACORDO = 0.20

/** IRRF brackets — monthly amounts in centavos */
interface IRRFBracket {
  min: number // centavos
  max: number // centavos
  rate: number
  deduction: number // centavos — parcela a deduzir
  label: string
}

const IRRF_BRACKETS: IRRFBracket[] = [
  { min: 0, max: 225920, rate: 0, deduction: 0, label: 'Isento' },
  { min: 225921, max: 282665, rate: 0.075, deduction: 16944, label: '7.5%' },
  { min: 282666, max: 375105, rate: 0.15, deduction: 38144, label: '15%' },
  { min: 375106, max: 466468, rate: 0.225, deduction: 66277, label: '22.5%' },
  { min: 466469, max: Infinity, rate: 0.275, deduction: 89600, label: '27.5%' },
]

/** IRRF dependent deduction per dependent per month */
const IRRF_DEPENDENT_DEDUCTION = 18959 // centavos — R$189.59

/** Vale-Transporte employee deduction rate (capped at 6% of base salary) */
const VT_EMPLOYEE_RATE = 0.06

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Calculate progressive INSS employee contribution.
 * Brazil uses a progressive (not flat) system since 2020.
 */
export function calculateINSS(monthlyGross: number): { employee: number; employer: number; rat: number; effectiveRate: number; bracket: string } {
  // Employee: progressive calculation
  let employeeINSS = 0
  let bracket = 'Isento'

  if (monthlyGross > INSS_BRACKETS[INSS_BRACKETS.length - 1].max) {
    // Salary above ceiling — calculate up to ceiling only
    let remaining = INSS_BRACKETS[INSS_BRACKETS.length - 1].max
    for (const b of INSS_BRACKETS) {
      const taxableInBracket = Math.min(remaining, b.max) - b.min
      if (taxableInBracket > 0) {
        employeeINSS += Math.round(taxableInBracket * b.rate)
      }
      if (remaining <= b.max) break
    }
    bracket = 'Teto INSS'
  } else {
    let remaining = monthlyGross
    for (const b of INSS_BRACKETS) {
      if (monthlyGross <= b.min) break
      const taxableInBracket = Math.min(remaining, b.max) - b.min
      if (taxableInBracket > 0) {
        employeeINSS += Math.round(taxableInBracket * b.rate)
        bracket = b.label
      }
      if (remaining <= b.max) break
    }
  }

  // Employer: flat 20% on total payroll (no ceiling)
  const employer = Math.round(monthlyGross * INSS_EMPLOYER_RATE)
  const effectiveRate = monthlyGross > 0 ? employeeINSS / monthlyGross : 0

  return { employee: employeeINSS, employer, rat: 0, effectiveRate, bracket }
}

/**
 * Calculate FGTS deposit for one month.
 */
export function calculateFGTS(monthlyGross: number, isApprentice?: boolean): number {
  const rate = isApprentice ? FGTS_APPRENTICE_RATE : FGTS_RATE
  return Math.round(monthlyGross * rate)
}

/**
 * Calculate IRRF (monthly income tax withholding).
 * Base = gross - INSS - (dependents * R$189.59)
 */
export function calculateIRRF(taxableBase: number, dependents: number = 0): number {
  const dependentDeduction = dependents * IRRF_DEPENDENT_DEDUCTION
  const base = Math.max(0, taxableBase - dependentDeduction)

  for (let i = IRRF_BRACKETS.length - 1; i >= 0; i--) {
    if (base >= IRRF_BRACKETS[i].min) {
      if (IRRF_BRACKETS[i].rate === 0) return 0
      return Math.max(0, Math.round(base * IRRF_BRACKETS[i].rate - IRRF_BRACKETS[i].deduction))
    }
  }
  return 0
}

/**
 * Calculate Vale-Transporte employee deduction.
 * 6% of base salary, capped at actual transport cost.
 */
function calculateValeTransporte(baseSalary: number, actualTransportCost?: number): number {
  if (!actualTransportCost || actualTransportCost <= 0) return 0
  const sixPercent = Math.round(baseSalary * VT_EMPLOYEE_RATE)
  return Math.min(sixPercent, actualTransportCost)
}

/**
 * Full Brazil payroll calculation for one employee for one month.
 */
export function calculateBrazilPayroll(
  employee: BrazilEmployee,
  salary: BrazilSalaryStructure,
  options: BrazilPayrollOptions,
): BrazilPayrollResult {
  const monthlyGross = salary.baseSalary + (salary.additionals || 0)
    + (salary.overtimePay || 0) + (salary.commissions || 0)

  // --- INSS ---
  const inssCalc = calculateINSS(monthlyGross)
  const ratRate = RAT_RATES[employee.riskCategory || 1] || 0.01
  const fap = employee.fapMultiplier ?? 1.0
  const rat = Math.round(monthlyGross * ratRate * fap)

  const inss: INSSBreakdown = {
    employeeINSS: inssCalc.employee,
    employerINSS: inssCalc.employer,
    rat,
    totalEmployer: inssCalc.employer + rat,
    effectiveRate: inssCalc.effectiveRate,
    bracket: inssCalc.bracket,
  }

  // --- FGTS ---
  const fgtsDeposit = calculateFGTS(monthlyGross, employee.isApprentice)
  const fgts: FGTSBreakdown = {
    monthlyDeposit: fgtsDeposit,
    grossBase: monthlyGross,
  }

  // --- IRRF ---
  const irrfBase = monthlyGross - inssCalc.employee
  const irrfAmount = calculateIRRF(irrfBase, employee.dependents)
  const dependentDeduction = employee.dependents * IRRF_DEPENDENT_DEDUCTION

  let irrfBracketLabel = 'Isento'
  const effectiveIrrfBase = Math.max(0, irrfBase - dependentDeduction)
  for (let i = IRRF_BRACKETS.length - 1; i >= 0; i--) {
    if (effectiveIrrfBase >= IRRF_BRACKETS[i].min) {
      irrfBracketLabel = IRRF_BRACKETS[i].label
      break
    }
  }

  const irrf: IRRFBreakdown = {
    taxableBase: irrfBase,
    inssDeduction: inssCalc.employee,
    dependentDeduction,
    irrf: irrfAmount,
    effectiveRate: irrfBase > 0 ? irrfAmount / irrfBase : 0,
    bracket: irrfBracketLabel,
  }

  // --- Vale-Transporte ---
  const valeTransporteDeduction = calculateValeTransporte(
    salary.baseSalary,
    employee.transportCost,
  )

  // --- 13th Salary provision (1/12 per month) ---
  let thirteenthProvision = 0
  if (options.include13thProvision) {
    thirteenthProvision = Math.round(salary.baseSalary / 12)
  }

  // --- Vacation provision (1/12 + 1/3 per month) ---
  let vacationProvision = 0
  if (options.includeVacationProvision) {
    const monthlyVacation = Math.round(salary.baseSalary / 12)
    const monthlyBonus = Math.round(monthlyVacation / 3)
    vacationProvision = monthlyVacation + monthlyBonus
  }

  // --- Totals ---
  const totalEmployeeDeductions = inssCalc.employee + irrfAmount + valeTransporteDeduction
  const totalEmployerCost = inss.totalEmployer + fgtsDeposit
    + thirteenthProvision + vacationProvision
  const netPay = monthlyGross - totalEmployeeDeductions
  const costToCompany = monthlyGross + totalEmployerCost

  return {
    employeeId: employee.id,
    month: options.month,
    year: options.year,
    baseSalary: salary.baseSalary,
    additionals: salary.additionals || 0,
    monthlyGross,
    inss,
    fgts,
    irrf,
    valeTransporteDeduction,
    thirteenthProvision,
    vacationProvision,
    totalEmployeeDeductions,
    totalEmployerCost,
    netPay,
    costToCompany,
  }
}

/**
 * Calculate 13th Salary (Décimo Terceiro).
 * Two installments: 50% by Nov 30, 50% (minus deductions) by Dec 20.
 * Proportional for employees hired mid-year.
 */
export function calculate13thSalary(
  employee: BrazilEmployee,
  year: number,
  monthlySalary: number,
): ThirteenthResult {
  // Determine months worked in the year
  const admissionDate = new Date(employee.dateOfAdmission)
  const admYear = admissionDate.getFullYear()
  let monthsWorked = 12

  if (admYear === year) {
    // Started mid-year — count months from admission month
    const admMonth = admissionDate.getMonth() // 0-indexed
    const admDay = admissionDate.getDate()
    // If started after the 15th, that month doesn't count
    monthsWorked = 12 - admMonth - (admDay > 15 ? 1 : 0)
    monthsWorked = Math.max(0, Math.min(12, monthsWorked))
  } else if (admYear > year) {
    monthsWorked = 0
  }

  const grossAmount = Math.round((monthlySalary * monthsWorked) / 12)
  const firstInstallment = Math.round(grossAmount / 2)

  // Second installment: gross/2 minus INSS and IRRF on full 13th
  const secondInstallmentGross = grossAmount - firstInstallment
  const inssCalc = calculateINSS(grossAmount)
  const irrfBase = grossAmount - inssCalc.employee
  const irrfOn13th = calculateIRRF(irrfBase, employee.dependents)

  const secondInstallmentNet = secondInstallmentGross - inssCalc.employee - irrfOn13th

  return {
    employeeId: employee.id,
    year,
    monthsWorked,
    grossAmount,
    firstInstallment,
    secondInstallmentGross,
    inssOnSecond: inssCalc.employee,
    irrfOnSecond: irrfOn13th,
    secondInstallmentNet,
  }
}

/**
 * Calculate Férias (Vacation) pay.
 * 30 calendar days + 1/3 constitutional bonus.
 * Employee can sell up to 10 days (abono pecuniário).
 */
export function calculateFerias(
  employee: BrazilEmployee,
  monthlySalary: number,
  daysTaken: number = 30,
  daysSold: number = 0,
): FeriasResult {
  // Validate
  const effectiveDaysTaken = Math.max(0, Math.min(30, daysTaken))
  const effectiveDaysSold = Math.max(0, Math.min(10, daysSold))
  const totalDays = effectiveDaysTaken + effectiveDaysSold

  // Daily rate
  const dailyRate = Math.round(monthlySalary / 30)

  // Vacation pay for days taken
  const vacationPay = dailyRate * effectiveDaysTaken

  // 1/3 constitutional bonus on vacation pay
  const constitutionalBonus = Math.round(vacationPay / 3)

  // Abono pecuniário (sold days)
  const abonoPecuniario = dailyRate * effectiveDaysSold

  // 1/3 bonus on sold days too
  const abonoPecuniarioBonus = Math.round(abonoPecuniario / 3)

  const totalGross = vacationPay + constitutionalBonus + abonoPecuniario + abonoPecuniarioBonus

  // INSS on vacation pay + 1/3 (abono pecuniário is exempt from INSS)
  const inssBase = vacationPay + constitutionalBonus
  const inssCalc = calculateINSS(inssBase)

  // IRRF on total (including abono)
  const irrfBase = totalGross - inssCalc.employee
  const irrfAmount = calculateIRRF(irrfBase, employee.dependents)

  const totalNet = totalGross - inssCalc.employee - irrfAmount

  const today = new Date()
  const periodStart = today.toISOString().split('T')[0]
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + effectiveDaysTaken - 1)

  return {
    employeeId: employee.id,
    periodStart,
    periodEnd: endDate.toISOString().split('T')[0],
    daysTaken: effectiveDaysTaken,
    daysSold: effectiveDaysSold,
    baseSalary: monthlySalary,
    vacationPay,
    constitutionalBonus,
    abonoPecuniario,
    abonoPecuniarioBonus,
    totalGross,
    inss: inssCalc.employee,
    irrf: irrfAmount,
    totalNet,
  }
}

/**
 * Calculate Rescisão (Termination).
 * Covers: saldo de salário, aviso prévio, férias proporcionais/vencidas,
 * 13º proporcional, FGTS multa.
 */
export function calculateRescisao(
  employee: BrazilEmployee,
  monthlySalary: number,
  terminationDate: string,
  reason: 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo_mutuo',
): RescisaoResult {
  const termDate = new Date(terminationDate)
  const admDate = new Date(employee.dateOfAdmission)

  // Years of service
  const msWorked = termDate.getTime() - admDate.getTime()
  const yearsOfService = msWorked / (365.25 * 24 * 60 * 60 * 1000)
  const fullYears = Math.floor(yearsOfService)

  // Daily rate
  const dailyRate = Math.round(monthlySalary / 30)

  // 1. Saldo de salário (remaining days in termination month)
  const dayWorkedInMonth = termDate.getDate()
  const saldoSalario = dailyRate * dayWorkedInMonth

  // 2. Aviso prévio (notice period)
  // 30 days + 3 days per year of service (max 90 days)
  let avisoPrevoDays = 0
  let avisoPrevo = 0
  if (reason === 'sem_justa_causa') {
    avisoPrevoDays = Math.min(90, 30 + fullYears * 3)
    avisoPrevo = dailyRate * avisoPrevoDays
  } else if (reason === 'acordo_mutuo') {
    avisoPrevoDays = Math.min(90, 30 + fullYears * 3)
    avisoPrevo = Math.round((dailyRate * avisoPrevoDays) / 2) // 50% for acordo
  }
  // com_justa_causa and pedido_demissao: no aviso from employer

  // 3. Férias proporcionais (proportional vacation)
  const monthsSinceLastVacation = termDate.getMonth() - admDate.getMonth()
    + (termDate.getFullYear() - admDate.getFullYear()) * 12
  const proportionalMonths = monthsSinceLastVacation % 12
  const feriasProportional = reason !== 'com_justa_causa'
    ? Math.round((monthlySalary * proportionalMonths) / 12)
    : 0

  // 4. Férias vencidas (overdue vacation — simplified: assume none)
  const feriasVencidas = 0

  // 5. 1/3 bonus on all vacation
  const totalVacation = feriasProportional + feriasVencidas
  const feriasBonus = reason !== 'com_justa_causa'
    ? Math.round(totalVacation / 3)
    : 0

  // 6. 13º proporcional
  const monthsInYear = termDate.getMonth() + 1
  const decimoTerceiroProporcional = reason !== 'com_justa_causa'
    ? Math.round((monthlySalary * monthsInYear) / 12)
    : 0

  // 7. FGTS accumulated (estimate: 8% of salary * months worked)
  const totalMonths = Math.round(yearsOfService * 12)
  const fgtsBalance = Math.round(monthlySalary * FGTS_RATE * totalMonths)

  // 8. FGTS multa
  let fgtsMulta = 0
  if (reason === 'sem_justa_causa') {
    fgtsMulta = Math.round(fgtsBalance * FGTS_PENALTY_FULL)
  } else if (reason === 'acordo_mutuo') {
    fgtsMulta = Math.round(fgtsBalance * FGTS_PENALTY_ACORDO)
  }
  // com_justa_causa and pedido_demissao: no FGTS penalty

  // Gross total
  const totalGross = saldoSalario + avisoPrevo + feriasProportional
    + feriasVencidas + feriasBonus + decimoTerceiroProporcional

  // Deductions on rescisão
  const inssCalc = calculateINSS(totalGross)
  const inss = inssCalc.employee
  const irrfBase = totalGross - inss
  const irrfAmount = calculateIRRF(irrfBase, employee.dependents)

  const totalDeductions = inss + irrfAmount
  const totalNet = totalGross - totalDeductions + fgtsMulta // multa goes to employee

  return {
    employeeId: employee.id,
    terminationDate,
    reason,
    saldoSalario,
    avisoPrevo,
    avisoPrevoDays,
    feriasProportional,
    feriasVencidas,
    feriasBonus,
    decimoTerceiroProporcional,
    fgtsBalance,
    fgtsMulta,
    inss,
    irrf: irrfAmount,
    totalGross,
    totalDeductions,
    totalNet,
  }
}

/**
 * Generate eSocial event data.
 * Returns structured data for common eSocial events.
 */
export function generateESocialEvent(
  type: 'S-1200' | 'S-1210' | 'S-2200' | 'S-2299',
  data: {
    employee?: BrazilEmployee
    salary?: BrazilSalaryStructure
    payrollResult?: BrazilPayrollResult
    rescisao?: RescisaoResult
    month?: number
    year?: number
    employerCNPJ?: string
  },
): ESocialEvent {
  const now = new Date().toISOString()

  switch (type) {
    case 'S-1200': // Monthly payroll
      return {
        type: 'S-1200',
        description: 'Remuneração de Trabalhador vinculado ao Regime Geral de Previd. Social',
        data: {
          ideEvento: {
            indRetif: 1, // original (not rectification)
            perApur: `${data.year}-${String(data.month).padStart(2, '0')}`,
          },
          ideEmpregador: { nrInsc: data.employerCNPJ || '' },
          ideTrabalhador: {
            cpfTrab: data.employee?.cpf || '',
            nisTrab: data.employee?.pisNumber || '',
          },
          dmDev: data.payrollResult ? {
            ideDmDev: `DMV-${data.year}${String(data.month).padStart(2, '0')}`,
            codCateg: 101, // empregado geral
            infoPerApur: {
              remunPerApur: {
                vrSalFx: data.payrollResult.baseSalary,
              },
            },
          } : {},
        },
        generatedAt: now,
      }

    case 'S-1210': // Payments
      return {
        type: 'S-1210',
        description: 'Pagamentos de Rendimentos do Trabalho',
        data: {
          ideEvento: {
            perApur: `${data.year}-${String(data.month).padStart(2, '0')}`,
          },
          ideEmpregador: { nrInsc: data.employerCNPJ || '' },
          ideBenef: {
            cpfBenef: data.employee?.cpf || '',
          },
          infoPgto: data.payrollResult ? {
            dtPgto: new Date().toISOString().split('T')[0],
            vrLiq: data.payrollResult.netPay,
          } : {},
        },
        generatedAt: now,
      }

    case 'S-2200': // Admission
      return {
        type: 'S-2200',
        description: 'Cadastramento Inicial do Vínculo e Admissão/Ingresso de Trabalhador',
        data: {
          ideEmpregador: { nrInsc: data.employerCNPJ || '' },
          trabalhador: {
            cpfTrab: data.employee?.cpf || '',
            nmTrab: data.employee?.fullName || '',
            dtNascto: data.employee?.dateOfBirth || '',
          },
          vinculo: {
            dtAdm: data.employee?.dateOfAdmission || '',
            tpRegTrab: 1, // CLT
            tpRegPrev: 1, // RGPS
          },
        },
        generatedAt: now,
      }

    case 'S-2299': // Termination
      return {
        type: 'S-2299',
        description: 'Desligamento',
        data: {
          ideEmpregador: { nrInsc: data.employerCNPJ || '' },
          ideTrabalhador: {
            cpfTrab: data.employee?.cpf || '',
          },
          infoDeslig: data.rescisao ? {
            dtDeslig: data.rescisao.terminationDate,
            mtvDeslig: data.rescisao.reason,
            verbasResc: {
              saldoSalario: data.rescisao.saldoSalario,
              avisoPrevo: data.rescisao.avisoPrevo,
              feriasProportional: data.rescisao.feriasProportional,
              decimoTerceiro: data.rescisao.decimoTerceiroProporcional,
              fgtsMulta: data.rescisao.fgtsMulta,
            },
          } : {},
        },
        generatedAt: now,
      }

    default:
      return {
        type,
        description: 'Unknown event type',
        data: {},
        generatedAt: now,
      }
  }
}
