import { describe, expect, it } from 'vitest'
import {
  buildExpenseApprovalQueue,
  buildExpenseApprovalRoutePlan,
} from '../expense-approval-route-engine'

const policies = [
  { id: 'pol-travel', category: 'Travel', daily_limit: 500, receipt_threshold: 25, auto_approve_limit: 200, status: 'active' },
  { id: 'pol-meals', category: 'Meals', daily_limit: 75, receipt_threshold: 15, auto_approve_limit: 50, status: 'active' },
]

const employees = [
  { id: 'emp-1', department_id: 'dept-sales' },
  { id: 'emp-2', department_id: 'dept-marketing' },
]

const budgets = [
  { id: 'bud-sales', name: 'Sales 2026', department_id: 'dept-sales', total_amount: 10000, spent_amount: 8100, status: 'active' },
  { id: 'bud-marketing', name: 'Marketing 2026', department_id: 'dept-marketing', total_amount: 5000, spent_amount: 1200, status: 'active' },
]

describe('expense approval route engine', () => {
  it('routes missing receipt evidence back to employee follow-up before reimbursement', () => {
    const plan = buildExpenseApprovalRoutePlan({
      report: {
        id: 'exp-1',
        employee_id: 'emp-1',
        title: 'Client dinner',
        total_amount: 180,
        status: 'submitted',
        items: [{ id: 'item-1', category: 'Meals', description: 'Dinner', amount: 180 }],
      },
      expensePolicies: policies,
      receiptMatches: [],
      employees,
      budgets,
    })

    expect(plan.recommendedStage).toBe('employee_follow_up')
    expect(plan.blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Missing receipt evidence' }),
      expect.objectContaining({ label: 'Receipt required by policy' }),
    ]))
    expect(plan.safeNextActions[0]).toContain('Resolve:')
  })

  it('escalates policy limit breaches to policy review', () => {
    const plan = buildExpenseApprovalRoutePlan({
      report: {
        id: 'exp-2',
        employee_id: 'emp-2',
        title: 'Flight',
        total_amount: 800,
        receipt_count: 1,
        status: 'pending_approval',
        items: [{ id: 'item-2', category: 'Travel', description: 'Flight', amount: 800 }],
      },
      expensePolicies: policies,
      receiptMatches: [],
      employees,
      budgets,
    })

    expect(plan.recommendedStage).toBe('policy_review')
    expect(plan.policySignals).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Policy limit exceeded', severity: 'blocker' }),
    ]))
  })

  it('routes high projected budget utilization to budget owner review', () => {
    const plan = buildExpenseApprovalRoutePlan({
      report: {
        id: 'exp-3',
        employee_id: 'emp-1',
        title: 'Sales offsite travel',
        total_amount: 600,
        receipt_count: 1,
        status: 'submitted',
        items: [{ id: 'item-3', category: 'Travel', description: 'Train and hotel deposit', amount: 400 }],
      },
      expensePolicies: policies,
      employees,
      budgets,
      budgetWarningThreshold: 85,
    })

    expect(plan.recommendedStage).toBe('budget_owner_review')
    expect(plan.budgetSignals).toEqual([
      expect.objectContaining({ label: 'Budget guardrail reached', severity: 'warning' }),
    ])
  })

  it('moves approved reports without batches into the reimbursement queue', () => {
    const plan = buildExpenseApprovalRoutePlan({
      report: {
        id: 'exp-4',
        employee_id: 'emp-2',
        title: 'Recruiting fair',
        total_amount: 450,
        receipt_count: 1,
        status: 'approved',
        items: [{ id: 'item-4', category: 'Travel', description: 'Booth travel', amount: 450 }],
      },
      expensePolicies: policies,
      employees,
      budgets,
      reimbursementBatches: [],
    })

    expect(plan.recommendedStage).toBe('reimbursement_queue')
    expect(plan.reimbursementSignals).toEqual([
      expect.objectContaining({ label: 'Awaiting reimbursement batch' }),
    ])
  })

  it('asks finance for posting evidence after reimbursement is complete', () => {
    const plan = buildExpenseApprovalRoutePlan({
      report: {
        id: 'exp-5',
        employee_id: 'emp-2',
        title: 'Paid report',
        total_amount: 150,
        receipt_count: 1,
        status: 'reimbursed',
        items: [{ id: 'item-5', category: 'Meals', description: 'Lunch', amount: 60 }],
      },
      expensePolicies: policies,
      employees,
      budgets,
      reimbursementBatches: [{
        id: 'batch-1',
        status: 'completed',
        items: [{ expense_report_id: 'exp-5', amount: 150 }],
      }],
    })

    expect(plan.recommendedStage).toBe('finance_posting_review')
    expect(plan.postingSignals).toEqual([
      expect.objectContaining({ label: 'GL posting evidence missing' }),
    ])
  })

  it('sorts the approval queue by highest risk first', () => {
    const queue = buildExpenseApprovalQueue({
      reports: [
        { id: 'low', employee_id: 'emp-2', total_amount: 50, receipt_count: 1, status: 'submitted', items: [{ id: 'low-1', category: 'Meals', amount: 30 }] },
        { id: 'blocked', employee_id: 'emp-1', total_amount: 1200, status: 'submitted', items: [{ id: 'blocked-1', category: 'Travel', amount: 1200 }] },
      ],
      expensePolicies: policies,
      employees,
      budgets,
    })

    expect(queue.totalReports).toBe(2)
    expect(queue.blockedCount).toBe(1)
    expect(queue.plans[0].reportId).toBe('blocked')
  })
})
