import { NextRequest, NextResponse } from 'next/server'
import {
  calculateIndiaPayroll,
  generateECR,
  generateForm16,
  calculateGratuity,
  calculateBonus,
  getStateProfessionalTax,
  type IndiaEmployee,
  type IndiaSalaryStructure,
} from '@/lib/payroll/india-statutory'
import {
  calculateBrazilPayroll,
  calculate13thSalary,
  calculateFerias,
  calculateRescisao,
  calculateINSS,
  calculateFGTS,
  calculateIRRF,
  generateESocialEvent,
  type BrazilEmployee,
  type BrazilSalaryStructure,
} from '@/lib/payroll/brazil-statutory'

// GET /api/payroll/statutory?country=IN|BR&employeeId=...
// Returns statutory summary for an employee
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const country = searchParams.get('country')?.toUpperCase()
  const employeeId = searchParams.get('employeeId') || 'demo-employee'
  const monthStr = searchParams.get('month')
  const yearStr = searchParams.get('year')

  const now = new Date()
  const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1
  const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear()

  if (country === 'IN') {
    // Demo / sample India employee for statutory summary
    const monthlySalary = parseInt(searchParams.get('salary') || '5000000', 10) // paise — default 50,000 INR
    const state = searchParams.get('state') || 'Maharashtra'

    const employee: IndiaEmployee = {
      id: employeeId,
      fullName: searchParams.get('name') || 'Demo Employee',
      dateOfJoining: searchParams.get('dateOfJoining') || '2022-04-01',
      state,
      taxRegime: (searchParams.get('taxRegime') as 'new' | 'old') || 'new',
      yearsOfService: parseInt(searchParams.get('yearsOfService') || '3', 10),
    }

    const basic = Math.round(monthlySalary * 0.40)
    const da = Math.round(monthlySalary * 0.10)
    const hra = Math.round(monthlySalary * 0.20)
    const specialAllowance = monthlySalary - basic - da - hra

    const salary: IndiaSalaryStructure = {
      basic,
      da,
      hra,
      specialAllowance,
    }

    const result = calculateIndiaPayroll(employee, salary, {
      month,
      year,
      includeGratuityProvision: true,
      includeBonusProvision: true,
    })

    const gratuity = calculateGratuity(employee, basic + da)
    const bonus = calculateBonus(employee, basic)

    return NextResponse.json({
      country: 'IN',
      currency: 'INR',
      payroll: result,
      gratuity,
      bonus,
      professionalTaxState: state,
      professionalTaxSlabs: getPTSlabsForState(state),
    })
  }

  if (country === 'BR') {
    const monthlySalary = parseInt(searchParams.get('salary') || '500000', 10) // centavos — default R$5,000
    const dependents = parseInt(searchParams.get('dependents') || '0', 10)

    const employee: BrazilEmployee = {
      id: employeeId,
      fullName: searchParams.get('name') || 'Demo Employee',
      dateOfAdmission: searchParams.get('dateOfAdmission') || '2022-01-15',
      dependents,
      riskCategory: 1,
      fapMultiplier: 1.0,
    }

    const salary: BrazilSalaryStructure = {
      baseSalary: monthlySalary,
    }

    const result = calculateBrazilPayroll(employee, salary, {
      month,
      year,
      include13thProvision: true,
      includeVacationProvision: true,
    })

    const thirteenth = calculate13thSalary(employee, year, monthlySalary)
    const ferias = calculateFerias(employee, monthlySalary)

    return NextResponse.json({
      country: 'BR',
      currency: 'BRL',
      payroll: result,
      thirteenthSalary: thirteenth,
      ferias,
    })
  }

  return NextResponse.json(
    { error: `Unsupported country: ${country}. Supported: IN, BR` },
    { status: 400 },
  )
}

// POST /api/payroll/statutory
// Actions: generate-form16, generate-ecr, calculate-rescisao
export async function POST(request: NextRequest) {
  const body = await request.json()
  const action = body.action

  switch (action) {
    case 'generate-form16': {
      const { employeeId, financialYear, salary, state, taxRegime, name } = body
      const monthlySalary = salary || 5000000

      const employee: IndiaEmployee = {
        id: employeeId || 'demo-employee',
        fullName: name || 'Demo Employee',
        dateOfJoining: body.dateOfJoining || '2022-04-01',
        state: state || 'Maharashtra',
        taxRegime: taxRegime || 'new',
        pan: body.pan || 'ABCDE1234F',
      }

      const basic = Math.round(monthlySalary * 0.40)
      const da = Math.round(monthlySalary * 0.10)
      const hra = Math.round(monthlySalary * 0.20)
      const specialAllowance = monthlySalary - basic - da - hra

      const salaryStructure: IndiaSalaryStructure = {
        basic,
        da,
        hra,
        specialAllowance,
      }

      const form16 = generateForm16(
        employee,
        salaryStructure,
        financialYear || '2024-25',
        {
          name: body.employerName || 'Tempo Technologies Pvt. Ltd.',
          tan: body.employerTAN || 'MUMB12345E',
          address: body.employerAddress || 'Mumbai, Maharashtra, India',
        },
      )

      return NextResponse.json({ success: true, form16 })
    }

    case 'generate-ecr': {
      const { orgId, month, year, employees } = body

      // If employees are provided, use them; otherwise generate sample data
      const ecrEmployees = employees || [{
        employee: {
          id: 'demo-1',
          fullName: 'Demo Employee',
          dateOfJoining: '2022-04-01',
          state: 'Maharashtra',
          taxRegime: 'new' as const,
          uan: '100123456789',
        },
        salary: {
          basic: 2000000,
          da: 500000,
          hra: 1000000,
          specialAllowance: 1500000,
        },
      }]

      const ecr = generateECR(
        orgId || 'org-1',
        month || new Date().getMonth() + 1,
        year || new Date().getFullYear(),
        ecrEmployees,
        body.establishmentId,
      )

      return NextResponse.json({ success: true, ecr })
    }

    case 'calculate-rescisao': {
      const { employeeId, terminationDate, reason, salary, dependents, dateOfAdmission } = body

      const employee: BrazilEmployee = {
        id: employeeId || 'demo-employee',
        fullName: body.name || 'Demo Employee',
        dateOfAdmission: dateOfAdmission || '2020-03-01',
        dependents: dependents || 0,
      }

      const monthlySalary = salary || 500000

      const rescisao = calculateRescisao(
        employee,
        monthlySalary,
        terminationDate || new Date().toISOString().split('T')[0],
        reason || 'sem_justa_causa',
      )

      // Generate eSocial S-2299 event
      const esocialEvent = generateESocialEvent('S-2299', {
        employee,
        rescisao,
        employerCNPJ: body.cnpj,
      })

      return NextResponse.json({ success: true, rescisao, esocialEvent })
    }

    case 'calculate-ferias': {
      const { employeeId, salary, daysTaken, daysSold, dependents, dateOfAdmission } = body

      const employee: BrazilEmployee = {
        id: employeeId || 'demo-employee',
        fullName: body.name || 'Demo Employee',
        dateOfAdmission: dateOfAdmission || '2022-01-15',
        dependents: dependents || 0,
      }

      const ferias = calculateFerias(
        employee,
        salary || 500000,
        daysTaken || 30,
        daysSold || 0,
      )

      return NextResponse.json({ success: true, ferias })
    }

    case 'calculate-13th': {
      const { employeeId, salary, year: reqYear, dependents, dateOfAdmission } = body

      const employee: BrazilEmployee = {
        id: employeeId || 'demo-employee',
        fullName: body.name || 'Demo Employee',
        dateOfAdmission: dateOfAdmission || '2022-01-15',
        dependents: dependents || 0,
      }

      const thirteenth = calculate13thSalary(
        employee,
        reqYear || new Date().getFullYear(),
        salary || 500000,
      )

      return NextResponse.json({ success: true, thirteenthSalary: thirteenth })
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}. Supported: generate-form16, generate-ecr, calculate-rescisao, calculate-ferias, calculate-13th` },
        { status: 400 },
      )
  }
}

// Helper to expose PT slabs for a state (for the UI)
function getPTSlabsForState(state: string) {
  const slabMap: Record<string, Array<{ minINR: number; maxINR: number; taxINR: number }>> = {
    Maharashtra: [
      { minINR: 0, maxINR: 7500, taxINR: 0 },
      { minINR: 7500, maxINR: 10000, taxINR: 175 },
      { minINR: 10000, maxINR: Infinity, taxINR: 200 },
    ],
    Karnataka: [
      { minINR: 0, maxINR: 15000, taxINR: 0 },
      { minINR: 15000, maxINR: 25000, taxINR: 150 },
      { minINR: 25000, maxINR: Infinity, taxINR: 200 },
    ],
    'Tamil Nadu': [
      { minINR: 0, maxINR: 21000, taxINR: 0 },
      { minINR: 21000, maxINR: 30000, taxINR: 135 },
      { minINR: 30000, maxINR: 45000, taxINR: 315 },
      { minINR: 45000, maxINR: 60000, taxINR: 690 },
      { minINR: 60000, maxINR: 75000, taxINR: 825 },
      { minINR: 75000, maxINR: Infinity, taxINR: 1042 },
    ],
    'West Bengal': [
      { minINR: 0, maxINR: 10000, taxINR: 0 },
      { minINR: 10000, maxINR: 15000, taxINR: 110 },
      { minINR: 15000, maxINR: 25000, taxINR: 130 },
      { minINR: 25000, maxINR: Infinity, taxINR: 200 },
    ],
  }
  return slabMap[state] || []
}
