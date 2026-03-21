'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Input, Select } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Shield, Calculator, FileText, Globe, DollarSign, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react'

// ============================================================
// Constants
// ============================================================

const INDIA_STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Andhra Pradesh',
  'Telangana', 'Gujarat', 'Delhi', 'Rajasthan', 'Madhya Pradesh', 'Kerala',
]

const BRAZIL_TERMINATION_REASONS = [
  { value: 'sem_justa_causa', label: 'Without Cause (Sem Justa Causa)' },
  { value: 'com_justa_causa', label: 'With Cause (Com Justa Causa)' },
  { value: 'pedido_demissao', label: 'Employee Resignation (Pedido de Demissao)' },
  { value: 'acordo_mutuo', label: 'Mutual Agreement (Acordo Mutuo)' },
]

/** Format a number as currency with proper formatting */
function fmtAmount(amount: number, currency: string, isPaise?: boolean): string {
  const symbols: Record<string, string> = { INR: '\u20B9', BRL: 'R$', USD: '$' }
  const symbol = symbols[currency] || currency + ' '
  const value = isPaise ? amount / 100 : amount
  return symbol + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ============================================================
// India Statutory Detail Component
// ============================================================

function IndiaStatutoryPanel() {
  const [salary, setSalary] = useState(50000)
  const [state, setState] = useState('Maharashtra')
  const [taxRegime, setTaxRegime] = useState<'new' | 'old'>('new')
  const [yearsOfService, setYearsOfService] = useState(3)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [form16Loading, setForm16Loading] = useState(false)

  const fetchStatutory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        country: 'IN',
        salary: String(salary * 100), // convert INR to paise
        state,
        taxRegime,
        yearsOfService: String(yearsOfService),
      })
      const res = await fetch(`/api/payroll/statutory?${params}`)
      const data = await res.json()
      setResult(data)
    } catch {
      // Fallback to client-side calculation
      setResult(null)
    }
    setLoading(false)
  }, [salary, state, taxRegime, yearsOfService])

  useEffect(() => {
    fetchStatutory()
  }, [fetchStatutory])

  const generateForm16 = async () => {
    setForm16Loading(true)
    try {
      const res = await fetch('/api/payroll/statutory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-form16',
          salary: salary * 100,
          state,
          taxRegime,
          financialYear: '2024-25',
        }),
      })
      const data = await res.json()
      if (data.form16) {
        // Create downloadable JSON
        const blob = new Blob([JSON.stringify(data.form16, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `form16-${data.form16.financialYear}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // silent
    }
    setForm16Loading(false)
  }

  const payroll = result?.payroll
  const gratuity = result?.gratuity
  const bonus = result?.bonus

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="w-4 h-4" />
            India Payroll Parameters
          </CardTitle>
        </CardHeader>
        <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Monthly Salary (INR)</label>
            <Input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">State</label>
            <Select
              value={state}
              onChange={(e) => setState(e.target.value)}
              options={INDIA_STATES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Tax Regime</label>
            <Select
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value as 'new' | 'old')}
              options={[
                { value: 'new', label: 'New Regime (Default FY 2024-25)' },
                { value: 'old', label: 'Old Regime' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Years of Service</label>
            <Input
              type="number"
              value={yearsOfService}
              onChange={(e) => setYearsOfService(Number(e.target.value))}
            />
          </div>
        </div>
      </Card>

      {payroll && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Gross Pay"
              value={fmtAmount(payroll.monthlyGross, 'INR', true)}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <StatCard
              label="Total Deductions"
              value={fmtAmount(payroll.totalEmployeeDeductions, 'INR', true)}
              icon={<AlertTriangle className="w-4 h-4" />}
              change="-"
            />
            <StatCard
              label="Net Pay"
              value={fmtAmount(payroll.netPay, 'INR', true)}
              icon={<CheckCircle2 className="w-4 h-4" />}
              change="+"
            />
            <StatCard
              label="CTC (Monthly)"
              value={fmtAmount(payroll.costToCompany, 'INR', true)}
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salary Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Salary Structure</CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Basic</span><span>{fmtAmount(payroll.basic, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">DA</span><span>{fmtAmount(payroll.da, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">HRA</span><span>{fmtAmount(payroll.hra, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Special Allowance</span><span>{fmtAmount(payroll.specialAllowance, 'INR', true)}</span></div>
                <div className="flex justify-between font-medium pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Gross</span><span>{fmtAmount(payroll.monthlyGross, 'INR', true)}</span>
                </div>
              </div>
            </Card>

            {/* PF Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Provident Fund (EPF)
                  <Badge variant="info">12% Employee + 12% Employer</Badge>
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">PF Wage (Basic + DA)</span><span>{fmtAmount(payroll.pf.pfWage, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Employee EPF (12%)</span><span className="text-red-600">-{fmtAmount(payroll.pf.employeeEPF, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Employer EPF (3.67%)</span><span className="text-blue-600">{fmtAmount(payroll.pf.employerEPF, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Employer EPS (8.33%)</span><span className="text-blue-600">{fmtAmount(payroll.pf.employerEPS, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Admin Charges (0.5%)</span><span className="text-blue-600">{fmtAmount(payroll.pf.adminCharges, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">EDLI (0.5%)</span><span className="text-blue-600">{fmtAmount(payroll.pf.edli, 'INR', true)}</span></div>
              </div>
            </Card>

            {/* ESI */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  ESI (Employee State Insurance)
                  {payroll.esi.applicable ? (
                    <Badge variant="warning">Applicable</Badge>
                  ) : (
                    <Badge variant="default">Not Applicable (Gross &gt; 21K)</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                {payroll.esi.applicable ? (
                  <>
                    <div className="flex justify-between"><span className="text-zinc-500">Employee (0.75%)</span><span className="text-red-600">-{fmtAmount(payroll.esi.employeeESI, 'INR', true)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Employer (3.25%)</span><span className="text-blue-600">{fmtAmount(payroll.esi.employerESI, 'INR', true)}</span></div>
                  </>
                ) : (
                  <p className="text-zinc-400">ESI is applicable only when monthly gross salary is INR 21,000 or below.</p>
                )}
              </div>
            </Card>

            {/* Professional Tax */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Professional Tax
                  <Badge variant="default">{payroll.professionalTaxState}</Badge>
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Monthly PT</span>
                  <span className="text-red-600">-{fmtAmount(payroll.professionalTax, 'INR', true)}</span>
                </div>
                {result?.professionalTaxSlabs && result.professionalTaxSlabs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-2">State Slabs ({state})</p>
                    {result.professionalTaxSlabs.map((slab: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-zinc-400">
                        <span>{fmtAmount(slab.minINR, 'INR')} - {slab.maxINR === Infinity ? 'Above' : fmtAmount(slab.maxINR, 'INR')}</span>
                        <span>{fmtAmount(slab.taxINR, 'INR')}/mo</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* TDS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  TDS (Income Tax)
                  <Badge variant={payroll.tds.regime === 'new' ? 'success' : 'warning'}>
                    {payroll.tds.regime === 'new' ? 'New Regime' : 'Old Regime'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Annual Taxable Income</span><span>{fmtAmount(payroll.tds.annualTaxableIncome, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Standard Deduction</span><span className="text-green-600">{fmtAmount(payroll.tds.standardDeduction, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Income Tax (Annual)</span><span>{fmtAmount(payroll.tds.incomeTax, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Surcharge</span><span>{fmtAmount(payroll.tds.surcharge, 'INR', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">H&E Cess (4%)</span><span>{fmtAmount(payroll.tds.cess, 'INR', true)}</span></div>
                <div className="flex justify-between font-medium pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Monthly TDS</span><span className="text-red-600">-{fmtAmount(payroll.tds.monthlyTDS, 'INR', true)}</span>
                </div>
              </div>
            </Card>

            {/* Gratuity & Bonus */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Gratuity & Statutory Bonus</CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-3 text-sm">
                {gratuity && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1 font-medium">Gratuity (Payment of Gratuity Act)</p>
                    <div className="flex justify-between"><span className="text-zinc-500">Eligible</span><span>{gratuity.eligible ? 'Yes (5+ years)' : `No (${gratuity.yearsOfService} years)`}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Amount</span><span>{fmtAmount(gratuity.gratuityAmount, 'INR', true)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Tax-free limit</span><span>{fmtAmount(gratuity.taxFreeLimit, 'INR', true)}</span></div>
                  </div>
                )}
                {bonus && (
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-400 mb-1 font-medium">Statutory Bonus</p>
                    <div className="flex justify-between"><span className="text-zinc-500">Applicable</span><span>{bonus.applicable ? 'Yes' : 'No (salary > 21K)'}</span></div>
                    {bonus.applicable && (
                      <>
                        <div className="flex justify-between"><span className="text-zinc-500">Rate</span><span>{(bonus.bonusPercentage * 100).toFixed(2)}%</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">Annual Bonus</span><span>{fmtAmount(bonus.annualBonus, 'INR', true)}</span></div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={generateForm16} disabled={form16Loading}>
              <FileText className="w-4 h-4 mr-2" />
              {form16Loading ? 'Generating...' : 'Generate Form 16'}
            </Button>
            <Button variant="outline" onClick={fetchStatutory} disabled={loading}>
              <Calculator className="w-4 h-4 mr-2" />
              {loading ? 'Calculating...' : 'Recalculate'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// Brazil Statutory Detail Component
// ============================================================

function BrazilStatutoryPanel() {
  const [salary, setSalary] = useState(5000)
  const [dependents, setDependents] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [rescisaoResult, setRescisaoResult] = useState<any>(null)
  const [rescisaoReason, setRescisaoReason] = useState('sem_justa_causa')

  const fetchStatutory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        country: 'BR',
        salary: String(salary * 100), // convert BRL to centavos
        dependents: String(dependents),
      })
      const res = await fetch(`/api/payroll/statutory?${params}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult(null)
    }
    setLoading(false)
  }, [salary, dependents])

  useEffect(() => {
    fetchStatutory()
  }, [fetchStatutory])

  const calculateTermination = async () => {
    try {
      const res = await fetch('/api/payroll/statutory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate-rescisao',
          salary: salary * 100,
          dependents,
          reason: rescisaoReason,
          dateOfAdmission: '2020-03-01',
        }),
      })
      const data = await res.json()
      setRescisaoResult(data.rescisao)
    } catch {
      // silent
    }
  }

  const payroll = result?.payroll
  const thirteenth = result?.thirteenthSalary
  const ferias = result?.ferias

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="w-4 h-4" />
            Brazil Payroll Parameters
          </CardTitle>
        </CardHeader>
        <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Monthly Salary (BRL)</label>
            <Input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Dependents</label>
            <Input
              type="number"
              value={dependents}
              onChange={(e) => setDependents(Number(e.target.value))}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Termination Reason (Simulation)</label>
            <Select
              value={rescisaoReason}
              onChange={(e) => setRescisaoReason(e.target.value)}
              options={BRAZIL_TERMINATION_REASONS}
            />
          </div>
        </div>
      </Card>

      {payroll && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Gross Pay"
              value={fmtAmount(payroll.monthlyGross, 'BRL', true)}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <StatCard
              label="Total Deductions"
              value={fmtAmount(payroll.totalEmployeeDeductions, 'BRL', true)}
              icon={<AlertTriangle className="w-4 h-4" />}
              change="-"
            />
            <StatCard
              label="Net Pay"
              value={fmtAmount(payroll.netPay, 'BRL', true)}
              icon={<CheckCircle2 className="w-4 h-4" />}
              change="+"
            />
            <StatCard
              label="CTC (Monthly)"
              value={fmtAmount(payroll.costToCompany, 'BRL', true)}
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* INSS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  INSS (Social Security)
                  <Badge variant="info">Progressive</Badge>
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Bracket</span><span>{payroll.inss.bracket}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Employee INSS</span><span className="text-red-600">-{fmtAmount(payroll.inss.employeeINSS, 'BRL', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Employer INSS (20%)</span><span className="text-blue-600">{fmtAmount(payroll.inss.employerINSS, 'BRL', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">RAT</span><span className="text-blue-600">{fmtAmount(payroll.inss.rat, 'BRL', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Effective Rate</span><span>{(payroll.inss.effectiveRate * 100).toFixed(2)}%</span></div>
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-400 mb-2">Progressive INSS Brackets (2024)</p>
                  <div className="space-y-1">
                    {[
                      { range: 'Up to R$1,412.00', rate: '7.5%' },
                      { range: 'R$1,412.01 - R$2,666.68', rate: '9%' },
                      { range: 'R$2,666.69 - R$4,000.03', rate: '12%' },
                      { range: 'R$4,000.04 - R$7,786.02', rate: '14%' },
                    ].map((b, i) => (
                      <div key={i} className="flex justify-between text-xs text-zinc-400">
                        <span>{b.range}</span><span>{b.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* FGTS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  FGTS (Fundo de Garantia)
                  <Badge variant="success">8% Employer</Badge>
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Monthly Deposit</span><span className="text-blue-600">{fmtAmount(payroll.fgts.monthlyDeposit, 'BRL', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Gross Base</span><span>{fmtAmount(payroll.fgts.grossBase, 'BRL', true)}</span></div>
                <p className="text-xs text-zinc-400 mt-2">
                  FGTS is deposited monthly by the employer into the employee&apos;s individual FGTS account. On termination without cause, a 40% penalty applies on the accumulated balance.
                </p>
              </div>
            </Card>

            {/* IRRF */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  IRRF (Income Tax)
                  <Badge variant="default">{payroll.irrf.bracket}</Badge>
                </CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Taxable Base (Gross - INSS)</span><span>{fmtAmount(payroll.irrf.taxableBase, 'BRL', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">INSS Deduction</span><span className="text-green-600">{fmtAmount(payroll.irrf.inssDeduction, 'BRL', true)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Dependent Deduction ({dependents})</span><span className="text-green-600">{fmtAmount(payroll.irrf.dependentDeduction, 'BRL', true)}</span></div>
                <div className="flex justify-between font-medium pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span>IRRF</span><span className="text-red-600">-{fmtAmount(payroll.irrf.irrf, 'BRL', true)}</span>
                </div>
              </div>
            </Card>

            {/* Vale-Transporte */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vale-Transporte</CardTitle>
              </CardHeader>
              <div className="p-4 pt-0 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Deduction (6% of base, capped)</span>
                  <span className="text-red-600">-{fmtAmount(payroll.valeTransporteDeduction, 'BRL', true)}</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Employer provides transport vouchers. Employee pays up to 6% of base salary, capped at actual cost.
                </p>
              </div>
            </Card>

            {/* 13th Salary */}
            {thirteenth && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    13o Salario (13th Salary)
                    <Badge variant="warning">Annual</Badge>
                  </CardTitle>
                </CardHeader>
                <div className="p-4 pt-0 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Months Worked</span><span>{thirteenth.monthsWorked}/12</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Gross 13th</span><span>{fmtAmount(thirteenth.grossAmount, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">1st Installment (by Nov 30)</span><span>{fmtAmount(thirteenth.firstInstallment, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">2nd Installment Gross</span><span>{fmtAmount(thirteenth.secondInstallmentGross, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">INSS on 2nd</span><span className="text-red-600">-{fmtAmount(thirteenth.inssOnSecond, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">IRRF on 2nd</span><span className="text-red-600">-{fmtAmount(thirteenth.irrfOnSecond, 'BRL', true)}</span></div>
                  <div className="flex justify-between font-medium pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span>2nd Installment Net</span><span>{fmtAmount(thirteenth.secondInstallmentNet, 'BRL', true)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Ferias */}
            {ferias && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    Ferias (Vacation)
                    <Badge variant="info">30 days + 1/3</Badge>
                  </CardTitle>
                </CardHeader>
                <div className="p-4 pt-0 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Days Taken</span><span>{ferias.daysTaken}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Days Sold</span><span>{ferias.daysSold}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Vacation Pay</span><span>{fmtAmount(ferias.vacationPay, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">1/3 Constitutional Bonus</span><span>{fmtAmount(ferias.constitutionalBonus, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">INSS</span><span className="text-red-600">-{fmtAmount(ferias.inss, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">IRRF</span><span className="text-red-600">-{fmtAmount(ferias.irrf, 'BRL', true)}</span></div>
                  <div className="flex justify-between font-medium pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span>Net Vacation Pay</span><span>{fmtAmount(ferias.totalNet, 'BRL', true)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Rescisao Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Termination Simulation (Rescisao)
              </CardTitle>
            </CardHeader>
            <div className="p-4 pt-0">
              <div className="flex items-end gap-3 mb-4">
                <Button onClick={calculateTermination} variant="outline" size="sm">
                  <Calculator className="w-4 h-4 mr-2" />
                  Simulate Termination
                </Button>
              </div>
              {rescisaoResult && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Reason</span><span>{rescisaoResult.reason}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Notice Days</span><span>{rescisaoResult.avisoPrevoDays}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Saldo Salario</span><span>{fmtAmount(rescisaoResult.saldoSalario, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Aviso Previo</span><span>{fmtAmount(rescisaoResult.avisoPrevo, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Ferias Proportional</span><span>{fmtAmount(rescisaoResult.feriasProportional, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Ferias 1/3 Bonus</span><span>{fmtAmount(rescisaoResult.feriasBonus, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">13th Proportional</span><span>{fmtAmount(rescisaoResult.decimoTerceiroProporcional, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">FGTS Balance (est.)</span><span>{fmtAmount(rescisaoResult.fgtsBalance, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">FGTS Penalty</span><span className="text-green-600">{fmtAmount(rescisaoResult.fgtsMulta, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">INSS</span><span className="text-red-600">-{fmtAmount(rescisaoResult.inss, 'BRL', true)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">IRRF</span><span className="text-red-600">-{fmtAmount(rescisaoResult.irrf, 'BRL', true)}</span></div>
                  <div className="col-span-2 flex justify-between font-medium pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span>Total Net (including FGTS penalty)</span>
                    <span className="text-lg">{fmtAmount(rescisaoResult.totalNet, 'BRL', true)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchStatutory} disabled={loading}>
              <Calculator className="w-4 h-4 mr-2" />
              {loading ? 'Calculating...' : 'Recalculate'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function StatutoryPayrollPage() {
  const [activeTab, setActiveTab] = useState('india')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header
        title="Statutory Compliance"
        subtitle="Deep statutory payroll compliance for India and Brazil"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs
          tabs={[
            { id: 'india', label: 'India (IN)' },
            { id: 'brazil', label: 'Brazil (BR)' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-6">
          {activeTab === 'india' && <IndiaStatutoryPanel />}
          {activeTab === 'brazil' && <BrazilStatutoryPanel />}
        </div>
      </main>
    </div>
  )
}
