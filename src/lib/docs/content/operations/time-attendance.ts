import type { ModuleDoc } from '../../types'

const timeAttendance: ModuleDoc = {
  slug: 'time-attendance',
  title: 'Time & Attendance',
  subtitle: 'Clock in/out tracking, shift management, leave requests, attendance reporting, and overtime monitoring',
  icon: 'Clock',
  group: 'operations',
  lastUpdated: '2026-03-13',
  version: '1.0',

  overview: {
    description:
      'The Time & Attendance module provides comprehensive workforce time tracking for organizations of all sizes. Employees clock in and out via the web interface or mobile app, with optional geofencing for on-site verification. Managers create and publish shift schedules, approve leave requests, and monitor attendance patterns. The module integrates directly with Payroll to ensure accurate pay calculations for regular hours, overtime, shift differentials, and PTO.',
    keyFeatures: [
      'One-click clock in/out with web and mobile support',
      'Geofencing and IP restriction for location-verified time entries',
      'Shift scheduling with drag-and-drop calendar builder',
      'Leave request workflow with balance tracking and manager approval',
      'Overtime monitoring with configurable thresholds and alerts',
      'Attendance dashboard with absence rates, tardiness patterns, and trend charts',
      'Timesheet approval workflow for managers with bulk approval capability',
      'Direct integration with Payroll for automated hours-to-pay calculation',
    ],
    screenshotKey: 'time-attendance/overview',
  },

  workflows: [
    {
      id: 'clock-in-out',
      title: 'Clocking In and Out',
      description:
        'Record your work start and end times using the clock-in/out feature for accurate time tracking.',
      estimatedTime: '1 minute',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Access the time clock',
          description:
            'Navigate to Time & Attendance or click the clock icon in the top navigation bar. The time clock widget displays the current time, your status (clocked in or out), and today\'s total hours.',
          screenshotKey: 'time-attendance/clock-step-1',
        },
        {
          number: 2,
          title: 'Clock in',
          description:
            'Click the "Clock In" button to start your work session. The system records the timestamp, your IP address, and location (if geofencing is enabled). A confirmation appears with the clock-in time.',
          screenshotKey: 'time-attendance/clock-step-2',
          tip: 'If you forget to clock in, you can submit a manual time entry that is routed to your manager for approval.',
        },
        {
          number: 3,
          title: 'Take breaks',
          description:
            'Click "Start Break" to pause your work timer. Breaks are tracked separately and can be configured as paid or unpaid based on your organization\'s policy. Click "End Break" to resume work tracking.',
          screenshotKey: 'time-attendance/clock-step-3',
        },
        {
          number: 4,
          title: 'Clock out',
          description:
            'At the end of your work session, click "Clock Out." The system calculates your total hours worked, break duration, and any overtime. A daily summary appears showing your hours for review.',
          screenshotKey: 'time-attendance/clock-step-4',
        },
      ],
    },
    {
      id: 'submit-leave-request',
      title: 'Submitting a Leave Request',
      description:
        'Request time off by specifying dates, leave type, and reason. The request is routed to your manager for approval.',
      estimatedTime: '3 minutes',
      roles: ['employee'],
      steps: [
        {
          number: 1,
          title: 'Open the Leave section',
          description:
            'Navigate to Time & Attendance > Leave. The view shows your leave balances by type (vacation, sick, personal, parental) and a calendar view of upcoming approved and pending leave.',
          screenshotKey: 'time-attendance/leave-step-1',
        },
        {
          number: 2,
          title: 'Create a new leave request',
          description:
            'Click "+ Request Leave." Select the leave type, start date, end date, and whether the request is for full days or half days. The system calculates the number of leave days and checks your available balance.',
          screenshotKey: 'time-attendance/leave-step-2',
        },
        {
          number: 3,
          title: 'Add details and submit',
          description:
            'Add an optional note explaining the reason for leave. Attach any required documentation (e.g., medical certificate for extended sick leave). Click "Submit" to send the request to your manager.',
          screenshotKey: 'time-attendance/leave-step-3',
          tip: 'Submit leave requests at least two weeks in advance for planned vacation to give your manager time to plan coverage.',
        },
        {
          number: 4,
          title: 'Track approval status',
          description:
            'Your request appears in "Pending" status in the leave calendar. You receive a notification when your manager approves, rejects, or requests changes. Approved leave is automatically reflected in your balance and the team calendar.',
          screenshotKey: 'time-attendance/leave-step-4',
        },
      ],
    },
    {
      id: 'manage-shifts',
      title: 'Managing Shift Schedules',
      description:
        'Create, publish, and modify shift schedules for team members using the visual calendar builder.',
      estimatedTime: '10 minutes',
      roles: ['manager', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Shift Scheduler',
          description:
            'Navigate to Time & Attendance > Schedules. The scheduler displays a weekly or monthly calendar view with team members listed on the left and their shift assignments across the timeline.',
          screenshotKey: 'time-attendance/shifts-step-1',
        },
        {
          number: 2,
          title: 'Create shifts',
          description:
            'Click on an empty slot in the calendar to create a shift. Enter the start time, end time, break allocation, and any notes. Use color coding to differentiate shift types (morning, afternoon, night, on-call).',
          screenshotKey: 'time-attendance/shifts-step-2',
        },
        {
          number: 3,
          title: 'Assign employees to shifts',
          description:
            'Drag and drop employees onto shifts or use the auto-assign feature to distribute shifts based on availability, preferences, and labor law constraints (e.g., minimum rest periods between shifts).',
          screenshotKey: 'time-attendance/shifts-step-3',
          tip: 'Use shift templates to copy a standard weekly schedule and apply it to future weeks, saving setup time.',
        },
        {
          number: 4,
          title: 'Publish the schedule',
          description:
            'Click "Publish" to make the schedule visible to employees. They receive a notification with their upcoming shifts. Published schedules are locked — subsequent changes require an edit with employee notification.',
          screenshotKey: 'time-attendance/shifts-step-4',
        },
        {
          number: 5,
          title: 'Handle shift swaps',
          description:
            'Employees can request shift swaps with colleagues through the system. Both parties must agree, and the manager approves the final swap. The schedule updates automatically upon approval.',
          screenshotKey: 'time-attendance/shifts-step-5',
        },
      ],
    },
    {
      id: 'approve-timesheets',
      title: 'Approving Timesheets',
      description:
        'Review and approve employee timesheets at the end of each pay period to ensure accurate payroll processing.',
      estimatedTime: '5 minutes',
      roles: ['manager', 'hrbp', 'admin'],
      steps: [
        {
          number: 1,
          title: 'Open the Timesheet Approval queue',
          description:
            'Navigate to Time & Attendance > Approvals. The queue lists all timesheets pending your review, organized by pay period with submission date and employee name.',
          screenshotKey: 'time-attendance/approve-step-1',
        },
        {
          number: 2,
          title: 'Review a timesheet',
          description:
            'Click on a timesheet to see the daily breakdown of hours worked, breaks, overtime, and any manual adjustments. Flagged entries (late clock-ins, missing clock-outs, overtime threshold breaches) are highlighted.',
          screenshotKey: 'time-attendance/approve-step-2',
        },
        {
          number: 3,
          title: 'Approve, reject, or request changes',
          description:
            'Click "Approve" to confirm the timesheet and forward it to Payroll. Click "Reject" with a reason to send it back for correction. Click "Request Changes" to ask the employee to clarify specific entries.',
          screenshotKey: 'time-attendance/approve-step-3',
          tip: 'Use the "Bulk Approve" button to approve all timesheets that have no flagged entries, saving time at the end of each pay period.',
        },
        {
          number: 4,
          title: 'Review overtime alerts',
          description:
            'The overtime panel shows employees approaching or exceeding configured thresholds (e.g., 40 hours/week). Review and approve overtime hours or discuss workload adjustments with the team.',
          screenshotKey: 'time-attendance/approve-step-4',
        },
      ],
    },
  ],

  faqs: [
    {
      question: 'What happens if I forget to clock in or out?',
      answer:
        'You can submit a manual time entry from the Time & Attendance module. Click "Add Manual Entry," enter the date, time, and reason for the missed clock. The entry is flagged and sent to your manager for approval before being recorded.',
    },
    {
      question: 'How are overtime hours calculated?',
      answer:
        'Overtime is calculated based on your organization\'s policy and local labor laws. The default configuration triggers overtime after 8 hours per day or 40 hours per week. Different rules can be configured for different employee groups or jurisdictions.',
    },
    {
      question: 'Can I see my team\'s attendance at a glance?',
      answer:
        'Yes. Managers have a "Team Attendance" dashboard showing who is clocked in, on break, on leave, or absent today. A calendar view shows historical patterns and upcoming planned absences for scheduling purposes.',
    },
    {
      question: 'How does geofencing work for clock-in?',
      answer:
        'When geofencing is enabled, the system verifies that your GPS coordinates are within a defined radius of your work location before allowing clock-in. If you are outside the geofence, the system blocks the clock-in and suggests using a manual entry instead.',
    },
    {
      question: 'Can leave requests be auto-approved?',
      answer:
        'Yes. Admins can configure auto-approval rules for specific leave types or durations — for example, auto-approve sick leave for 1 day or personal days with more than 14 days notice. Auto-approved leave still counts against the employee\'s balance.',
    },
    {
      question: 'How are leave balances calculated?',
      answer:
        'Leave balances are calculated based on your accrual policy (annual grant, monthly accrual, or per-pay-period accrual), minus approved leave taken. Carry-over rules, caps, and proration for new hires are all configurable by the admin.',
    },
    {
      question: 'Does the system enforce minimum rest periods between shifts?',
      answer:
        'Yes. The shift scheduler includes labor law compliance checks. If you try to assign a shift that violates the configured minimum rest period (e.g., 11 hours between shifts in the EU), the system warns you and blocks the assignment unless overridden with justification.',
    },
  ],

  tips: [
    'Set a recurring reminder on your phone to clock in at the start of your workday if you tend to forget.',
    'Managers should review the weekly overtime report every Monday to catch potential issues before they escalate at month-end.',
    'Use shift templates to set up recurring weekly schedules and avoid rebuilding them from scratch each period.',
    'Employees can view the team calendar before submitting leave requests to avoid scheduling conflicts with colleagues.',
    'Export attendance data monthly for departments with high absence rates to identify trends and take proactive action.',
    'Enable the mobile clock-in feature for field workers or remote employees who do not have desktop access.',
  ],

  relatedModules: ['payroll', 'payslips', 'people', 'dashboard'],

  permissions: [
    {
      role: 'Owner',
      capabilities: [
        'Configure all time and attendance policies, overtime rules, and geofencing settings',
        'Access attendance data and timesheets for all employees',
        'Manage leave policies, accrual rules, and carry-over settings',
        'View organization-wide attendance analytics and compliance reports',
      ],
    },
    {
      role: 'Admin',
      capabilities: [
        'Configure time tracking policies, shift templates, and leave types',
        'Access and approve timesheets for any employee',
        'Manage leave balances and process manual adjustments',
        'Generate attendance and overtime reports',
      ],
    },
    {
      role: 'HRBP',
      capabilities: [
        'View attendance data for employees in assigned departments',
        'Approve timesheets and leave requests for assigned employees',
        'Run attendance analytics for assigned scope',
      ],
    },
    {
      role: 'Manager',
      capabilities: [
        'Create and publish shift schedules for direct reports',
        'Approve timesheets, leave requests, and shift swaps for direct reports',
        'View team attendance dashboard and overtime alerts',
        'Submit manual time entries on behalf of team members',
      ],
    },
    {
      role: 'Employee',
      capabilities: [
        'Clock in and out, start and end breaks',
        'Submit leave requests and view leave balances',
        'View personal timesheet and attendance history',
        'Request shift swaps with colleagues',
      ],
    },
  ],
}

export default timeAttendance
