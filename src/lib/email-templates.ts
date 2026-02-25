/**
 * Extended Email Templates for Transactional Emails
 *
 * These templates complement the core templates in email.ts
 * with module-specific transactional emails.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.EMAIL_FROM || 'notifications@tempo.app'

// ============================================================
// SHARED TEMPLATE HELPERS
// ============================================================

function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#ea580c;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
    </div>
    ${content}
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Tempo - Unified Workforce Platform</p>
      <p style="margin:4px 0 0;font-size:11px;color:#bbb">Manage notification preferences in Settings.</p>
    </div>
  </div>
</body>
</html>`
}

const btn = 'display:inline-block;padding:12px 28px;background:#ea580c;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600'
const btnSecondary = 'display:inline-block;padding:10px 24px;background:#f5f5f7;color:#333;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500;border:1px solid #ddd'

// ============================================================
// APPROVAL / WORKFLOW EMAILS
// ============================================================

export function leaveRequestApprovalEmail(data: {
  managerName: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason?: string
}): { subject: string; html: string } {
  return {
    subject: `Leave Request: ${data.employeeName} - ${data.leaveType}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Leave Request Pending</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.managerName}, <strong>${data.employeeName}</strong> has requested time off.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;color:#555">
            <tr><td style="padding:4px 0;font-weight:600">Type:</td><td>${data.leaveType}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Dates:</td><td>${data.startDate} - ${data.endDate}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Duration:</td><td>${data.days} day${data.days > 1 ? 's' : ''}</td></tr>
            ${data.reason ? `<tr><td style="padding:4px 0;font-weight:600">Reason:</td><td>${data.reason}</td></tr>` : ''}
          </table>
        </div>
        <a href="${APP_URL}/time-attendance" style="${btn}">Review Request</a>
      </div>`),
  }
}

export function expenseApprovalEmail(data: {
  managerName: string
  employeeName: string
  reportTitle: string
  amount: number
  currency: string
  itemCount: number
}): { subject: string; html: string } {
  return {
    subject: `Expense Report: ${data.reportTitle} - ${data.currency} ${data.amount.toLocaleString()}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Expense Report Submitted</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.managerName}, <strong>${data.employeeName}</strong> submitted an expense report for review.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;color:#555">
            <tr><td style="padding:4px 0;font-weight:600">Report:</td><td>${data.reportTitle}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Amount:</td><td style="font-weight:700;color:#111">${data.currency} ${data.amount.toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Items:</td><td>${data.itemCount} line item${data.itemCount > 1 ? 's' : ''}</td></tr>
          </table>
        </div>
        <a href="${APP_URL}/expense" style="${btn}">Review Expense</a>
      </div>`),
  }
}

// ============================================================
// PERFORMANCE EMAILS
// ============================================================

export function reviewCycleStartEmail(data: {
  employeeName: string
  cycleName: string
  dueDate: string
}): { subject: string; html: string } {
  return {
    subject: `Performance Review Cycle Started: ${data.cycleName}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Review Cycle Started</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.employeeName}, the <strong>${data.cycleName}</strong> review cycle has begun.
          Please complete your self-assessment and peer reviews by <strong>${data.dueDate}</strong>.
        </p>
        <a href="${APP_URL}/performance" style="${btn}">Start Review</a>
      </div>`),
  }
}

export function reviewReminderEmail(data: {
  employeeName: string
  cycleName: string
  dueDate: string
  daysRemaining: number
}): { subject: string; html: string } {
  return {
    subject: `Reminder: ${data.cycleName} due in ${data.daysRemaining} days`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Review Reminder</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.employeeName}, you have <strong>${data.daysRemaining} day${data.daysRemaining > 1 ? 's' : ''}</strong> remaining to complete the <strong>${data.cycleName}</strong> review cycle (due ${data.dueDate}).
        </p>
        <a href="${APP_URL}/performance" style="${btn}">Complete Review</a>
      </div>`),
  }
}

export function feedbackReceivedEmail(data: {
  recipientName: string
  senderName: string
  feedbackType: string
  preview: string
}): { subject: string; html: string } {
  return {
    subject: `New ${data.feedbackType} from ${data.senderName}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">New ${data.feedbackType === 'recognition' ? 'Recognition' : 'Feedback'}</h2>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.recipientName}, <strong>${data.senderName}</strong> sent you ${data.feedbackType === 'recognition' ? 'a kudos' : 'feedback'}:
        </p>
        <div style="background:#fef7f0;border-left:4px solid #ea580c;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">
          <p style="margin:0;font-size:14px;color:#333;line-height:1.5;font-style:italic">"${data.preview}"</p>
        </div>
        <a href="${APP_URL}/performance" style="${btn}">View Full Feedback</a>
      </div>`),
  }
}

// ============================================================
// PAYROLL EMAILS
// ============================================================

export function payrollProcessedEmail(data: {
  employeeName: string
  period: string
  netPay: number
  currency: string
  payDate: string
}): { subject: string; html: string } {
  return {
    subject: `Pay Statement Ready: ${data.period}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Your Pay Statement is Ready</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.employeeName}, your pay statement for <strong>${data.period}</strong> has been processed.
        </p>
        <div style="background:#f0fdf4;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px">
          <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.05em">Net Pay</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#16a34a">${data.currency} ${data.netPay.toLocaleString()}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#888">Payment date: ${data.payDate}</p>
        </div>
        <a href="${APP_URL}/payroll" style="${btn}">View Pay Stub</a>
      </div>`),
  }
}

// ============================================================
// ONBOARDING EMAILS
// ============================================================

export function onboardingStartEmail(data: {
  employeeName: string
  startDate: string
  buddyName?: string
  orgName: string
  taskCount: number
}): { subject: string; html: string } {
  return {
    subject: `Welcome to ${data.orgName}! Your onboarding starts ${data.startDate}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Welcome aboard, ${data.employeeName}!</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          We're excited to have you join <strong>${data.orgName}</strong>. Your first day is <strong>${data.startDate}</strong>.
          Here's what you need to know:
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#333">Before your first day:</p>
          <ul style="margin:0;padding-left:20px;font-size:13px;color:#555;line-height:2">
            <li>${data.taskCount} pre-boarding tasks to complete</li>
            ${data.buddyName ? `<li>Your onboarding buddy: <strong>${data.buddyName}</strong></li>` : ''}
            <li>Complete your profile and upload a photo</li>
            <li>Review your team and department info</li>
          </ul>
        </div>
        <a href="${APP_URL}/onboarding" style="${btn}">Start Pre-boarding</a>
      </div>`),
  }
}

// ============================================================
// RECRUITING EMAILS
// ============================================================

export function interviewScheduledEmail(data: {
  candidateName: string
  positionTitle: string
  interviewDate: string
  interviewTime: string
  interviewerNames: string[]
  location: string
}): { subject: string; html: string } {
  return {
    subject: `Interview Scheduled: ${data.positionTitle} - ${data.interviewDate}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Interview Scheduled</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.candidateName}, your interview for <strong>${data.positionTitle}</strong> has been scheduled.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;color:#555">
            <tr><td style="padding:4px 0;font-weight:600">Date:</td><td>${data.interviewDate}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Time:</td><td>${data.interviewTime}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Location:</td><td>${data.location}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Interviewers:</td><td>${data.interviewerNames.join(', ')}</td></tr>
          </table>
        </div>
        <div style="display:flex;gap:12px">
          <a href="${APP_URL}/recruiting" style="${btn}">View Details</a>
        </div>
      </div>`),
  }
}

export function offerLetterEmail(data: {
  candidateName: string
  positionTitle: string
  orgName: string
  salary: string
  startDate: string
}): { subject: string; html: string } {
  return {
    subject: `Offer Letter: ${data.positionTitle} at ${data.orgName}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Congratulations, ${data.candidateName}!</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          We're delighted to offer you the position of <strong>${data.positionTitle}</strong> at <strong>${data.orgName}</strong>.
        </p>
        <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:20px">
          <table style="width:100%;font-size:14px;color:#555">
            <tr><td style="padding:6px 0;font-weight:600">Position:</td><td>${data.positionTitle}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Compensation:</td><td style="font-weight:700;color:#111">${data.salary}</td></tr>
            <tr><td style="padding:6px 0;font-weight:600">Start Date:</td><td>${data.startDate}</td></tr>
          </table>
        </div>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Please review the full offer details and respond within 5 business days.
        </p>
        <a href="${APP_URL}/recruiting" style="${btn}">Review Offer</a>
        <span style="display:inline-block;width:8px"></span>
        <a href="${APP_URL}/recruiting" style="${btnSecondary}">Ask a Question</a>
      </div>`),
  }
}

// ============================================================
// SURVEY / ENGAGEMENT EMAILS
// ============================================================

export function surveyInvitationEmail(data: {
  employeeName: string
  surveyTitle: string
  dueDate: string
  isAnonymous: boolean
}): { subject: string; html: string } {
  return {
    subject: `Your input matters: ${data.surveyTitle}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">We Value Your Feedback</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.employeeName}, you've been invited to participate in the <strong>${data.surveyTitle}</strong> survey.
          ${data.isAnonymous ? 'Your responses are completely anonymous.' : ''}
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#555">
            ${data.isAnonymous ? '&#128274; ' : ''}Please complete by <strong>${data.dueDate}</strong>. It takes approximately 5 minutes.
          </p>
        </div>
        <a href="${APP_URL}/engagement" style="${btn}">Take Survey</a>
      </div>`),
  }
}

// ============================================================
// COMPLIANCE / SYSTEM EMAILS
// ============================================================

export function complianceAlertEmail(data: {
  adminName: string
  issueTitle: string
  severity: 'critical' | 'warning' | 'info'
  description: string
  module: string
}): { subject: string; html: string } {
  const severityColors = {
    critical: { bg: '#fef2f2', text: '#dc2626', label: 'CRITICAL' },
    warning: { bg: '#fffbeb', text: '#d97706', label: 'WARNING' },
    info: { bg: '#eff6ff', text: '#2563eb', label: 'INFO' },
  }
  const c = severityColors[data.severity]

  return {
    subject: `[${c.label}] Compliance Alert: ${data.issueTitle}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <div style="background:${c.bg};color:${c.text};display:inline-block;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.05em;margin-bottom:12px">${c.label}</div>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">${data.issueTitle}</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.adminName}, a compliance issue has been detected in the <strong>${data.module}</strong> module:
        </p>
        <div style="background:#f9fafb;border-left:4px solid ${c.text};padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px">
          <p style="margin:0;font-size:13px;color:#555;line-height:1.5">${data.description}</p>
        </div>
        <a href="${APP_URL}/settings" style="${btn}">Review Issue</a>
      </div>`),
  }
}

export function payrollApprovalEmail(data: {
  approverName: string
  period: string
  totalGross: number
  totalNet: number
  employeeCount: number
  currency: string
}): { subject: string; html: string } {
  return {
    subject: `Payroll Approval Required: ${data.period}`,
    html: wrapTemplate(`
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Payroll Ready for Approval</h2>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
          Hi ${data.approverName}, the payroll for <strong>${data.period}</strong> is ready for your approval.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;color:#555">
            <tr><td style="padding:4px 0;font-weight:600">Period:</td><td>${data.period}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Gross Total:</td><td style="font-weight:700;color:#111">${data.currency} ${data.totalGross.toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Net Total:</td><td>${data.currency} ${data.totalNet.toLocaleString()}</td></tr>
            <tr><td style="padding:4px 0;font-weight:600">Employees:</td><td>${data.employeeCount}</td></tr>
          </table>
        </div>
        <a href="${APP_URL}/payroll" style="${btn}">Approve Payroll</a>
        <span style="display:inline-block;width:8px"></span>
        <a href="${APP_URL}/payroll" style="${btnSecondary}">Review Details</a>
      </div>`),
  }
}
