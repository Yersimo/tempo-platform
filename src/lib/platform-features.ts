// =============================================================================
// Platform Features - Status Page, Push Notifications, E-Signatures, Feature Flags
// All data stored in memory using Maps (no DB required)
// =============================================================================

import crypto from "crypto";

// =============================================================================
// SHARED UTILITIES
// =============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

// =============================================================================
// 1. STATUS PAGE SYSTEM
// =============================================================================

// --- Types ---

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export interface ServiceComponent {
  id: string;
  name: string;
  description: string;
  group: "Core" | "Processing" | "Communication" | "Infrastructure";
  status: ServiceStatus;
  updatedAt: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  message: string;
  createdAt: string;
  createdBy: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "minor" | "major" | "critical";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  affectedServices: string[];
  updates: IncidentUpdate[];
  createdAt: string;
  resolvedAt: string | null;
}

export interface UptimeMetric {
  serviceId: string;
  serviceName: string;
  uptimePercentage: number;
  totalDowntimeMinutes: number;
  period: string;
}

export interface StatusPageData {
  overallStatus: ServiceStatus;
  services: ServiceComponent[];
  activeIncidents: Incident[];
  uptimeMetrics: UptimeMetric[];
  lastUpdated: string;
}

// --- Constants ---

export const PLATFORM_SERVICES: ServiceComponent[] = [
  {
    id: "svc_api",
    name: "API",
    description: "Core REST and GraphQL API endpoints",
    group: "Core",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_webapp",
    name: "Web App",
    description: "Main web application and dashboard",
    group: "Core",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_database",
    name: "Database",
    description: "Primary and replica database clusters",
    group: "Infrastructure",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_auth",
    name: "Authentication",
    description: "SSO, OAuth, and identity management",
    group: "Core",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_payroll",
    name: "Payroll Processing",
    description: "Payroll calculation and disbursement engine",
    group: "Processing",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_email",
    name: "Email Service",
    description: "Transactional and notification emails",
    group: "Communication",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_storage",
    name: "File Storage",
    description: "Document and file storage service",
    group: "Infrastructure",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_search",
    name: "Search",
    description: "Full-text search across platform data",
    group: "Infrastructure",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_webhooks",
    name: "Webhooks",
    description: "Outbound webhook delivery system",
    group: "Communication",
    status: "operational",
    updatedAt: now(),
  },
  {
    id: "svc_integrations",
    name: "Integrations",
    description: "Third-party integrations and connectors",
    group: "Communication",
    status: "operational",
    updatedAt: now(),
  },
];

// --- Storage ---

const serviceStatusMap = new Map<string, ServiceComponent>(
  PLATFORM_SERVICES.map((s) => [s.id, { ...s }])
);

const incidentStore = new Map<string, Incident>();

// --- Seed Historical Incidents ---

function seedHistoricalIncidents(): void {
  const incident1: Incident = {
    id: "inc_hist_001",
    title: "Elevated API response times",
    severity: "minor",
    status: "resolved",
    affectedServices: ["svc_api", "svc_webapp"],
    updates: [
      {
        id: "upd_001a",
        incidentId: "inc_hist_001",
        status: "investigating",
        message:
          "We are investigating reports of increased API response times affecting some users.",
        createdAt: daysAgo(12),
        createdBy: "system",
      },
      {
        id: "upd_001b",
        incidentId: "inc_hist_001",
        status: "identified",
        message:
          "Root cause identified as a misconfigured cache layer. A fix is being deployed.",
        createdAt: daysAgo(12),
        createdBy: "system",
      },
      {
        id: "upd_001c",
        incidentId: "inc_hist_001",
        status: "resolved",
        message:
          "Cache configuration has been corrected. API response times are back to normal.",
        createdAt: daysAgo(12),
        createdBy: "system",
      },
    ],
    createdAt: daysAgo(12),
    resolvedAt: daysAgo(12),
  };

  const incident2: Incident = {
    id: "inc_hist_002",
    title: "Email delivery delays",
    severity: "major",
    status: "resolved",
    affectedServices: ["svc_email"],
    updates: [
      {
        id: "upd_002a",
        incidentId: "inc_hist_002",
        status: "investigating",
        message:
          "We are aware of delays in email delivery affecting notification and transactional emails.",
        createdAt: daysAgo(5),
        createdBy: "system",
      },
      {
        id: "upd_002b",
        incidentId: "inc_hist_002",
        status: "identified",
        message:
          "Our upstream email provider experienced an outage. We are working with them to restore service.",
        createdAt: daysAgo(5),
        createdBy: "system",
      },
      {
        id: "upd_002c",
        incidentId: "inc_hist_002",
        status: "monitoring",
        message:
          "Email delivery is resuming. We are monitoring to ensure all queued messages are delivered.",
        createdAt: daysAgo(5),
        createdBy: "system",
      },
      {
        id: "upd_002d",
        incidentId: "inc_hist_002",
        status: "resolved",
        message:
          "All email services are fully operational. Queued messages have been delivered successfully.",
        createdAt: daysAgo(4),
        createdBy: "system",
      },
    ],
    createdAt: daysAgo(5),
    resolvedAt: daysAgo(4),
  };

  const incident3: Incident = {
    id: "inc_hist_003",
    title: "Scheduled database maintenance",
    severity: "minor",
    status: "resolved",
    affectedServices: ["svc_database", "svc_search"],
    updates: [
      {
        id: "upd_003a",
        incidentId: "inc_hist_003",
        status: "investigating",
        message:
          "Scheduled maintenance window beginning for database cluster upgrades. Brief read-only periods expected.",
        createdAt: daysAgo(20),
        createdBy: "system",
      },
      {
        id: "upd_003b",
        incidentId: "inc_hist_003",
        status: "monitoring",
        message:
          "Database upgrades complete. Monitoring search reindexing progress.",
        createdAt: daysAgo(20),
        createdBy: "system",
      },
      {
        id: "upd_003c",
        incidentId: "inc_hist_003",
        status: "resolved",
        message:
          "All maintenance tasks completed successfully. Services are fully operational.",
        createdAt: daysAgo(20),
        createdBy: "system",
      },
    ],
    createdAt: daysAgo(20),
    resolvedAt: daysAgo(20),
  };

  incidentStore.set(incident1.id, incident1);
  incidentStore.set(incident2.id, incident2);
  incidentStore.set(incident3.id, incident3);
}

seedHistoricalIncidents();

// --- Functions ---

export function getStatusPage(): StatusPageData {
  const services = Array.from(serviceStatusMap.values());
  const activeIncidents = Array.from(incidentStore.values()).filter(
    (inc) => inc.status !== "resolved"
  );

  const statusPriority: Record<ServiceStatus, number> = {
    operational: 0,
    maintenance: 1,
    degraded: 2,
    partial_outage: 3,
    major_outage: 4,
  };

  let overallStatus: ServiceStatus = "operational";
  for (const service of services) {
    if (statusPriority[service.status] > statusPriority[overallStatus]) {
      overallStatus = service.status;
    }
  }

  const uptimeMetrics: UptimeMetric[] = services.map((svc) => ({
    serviceId: svc.id,
    serviceName: svc.name,
    uptimePercentage: parseFloat((99.9 + Math.random() * 0.09).toFixed(4)),
    totalDowntimeMinutes: Math.floor(Math.random() * 15),
    period: "30d",
  }));

  return {
    overallStatus,
    services,
    activeIncidents,
    uptimeMetrics,
    lastUpdated: now(),
  };
}

export function getIncidentHistory(limit: number = 25): Incident[] {
  return Array.from(incidentStore.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

export function reportIncident(
  title: string,
  affectedServices: string[],
  severity: Incident["severity"],
  message: string
): Incident {
  const incidentId = generateId();
  const incident: Incident = {
    id: incidentId,
    title,
    severity,
    status: "investigating",
    affectedServices,
    updates: [
      {
        id: generateId(),
        incidentId,
        status: "investigating",
        message,
        createdAt: now(),
        createdBy: "system",
      },
    ],
    createdAt: now(),
    resolvedAt: null,
  };

  // Update affected service statuses
  for (const serviceId of affectedServices) {
    const service = serviceStatusMap.get(serviceId);
    if (service) {
      service.status =
        severity === "critical"
          ? "major_outage"
          : severity === "major"
            ? "partial_outage"
            : "degraded";
      service.updatedAt = now();
    }
  }

  incidentStore.set(incidentId, incident);
  return incident;
}

export function updateIncident(
  incidentId: string,
  status: IncidentUpdate["status"],
  message: string
): Incident {
  const incident = incidentStore.get(incidentId);
  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }

  const update: IncidentUpdate = {
    id: generateId(),
    incidentId,
    status,
    message,
    createdAt: now(),
    createdBy: "system",
  };

  incident.status = status;
  incident.updates.push(update);

  if (status === "resolved") {
    incident.resolvedAt = now();
    // Restore affected services to operational
    for (const serviceId of incident.affectedServices) {
      const service = serviceStatusMap.get(serviceId);
      if (service) {
        service.status = "operational";
        service.updatedAt = now();
      }
    }
  }

  return incident;
}

export function getUptimeMetrics(days: number = 30): UptimeMetric[] {
  return Array.from(serviceStatusMap.values()).map((svc) => {
    const baseUptime = 99.9 + Math.random() * 0.09;
    const totalMinutes = days * 24 * 60;
    const downtimeMinutes = totalMinutes * ((100 - baseUptime) / 100);

    return {
      serviceId: svc.id,
      serviceName: svc.name,
      uptimePercentage: parseFloat(baseUptime.toFixed(4)),
      totalDowntimeMinutes: Math.round(downtimeMinutes),
      period: `${days}d`,
    };
  });
}

// =============================================================================
// 2. PUSH NOTIFICATION SYSTEM
// =============================================================================

// --- Types ---

export type NotificationChannel =
  | "in_app"
  | "email"
  | "push"
  | "slack"
  | "sms";

export interface NotificationPreference {
  templateId: string;
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultChannels: NotificationChannel[];
  titleTemplate: string;
  bodyTemplate: string;
}

export interface PushNotification {
  id: string;
  orgId: string;
  recipientId: string;
  templateId: string;
  channels: NotificationChannel[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  sentAt: string;
}

// --- Constants ---

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "welcome",
    name: "Welcome",
    description: "Sent when a new user is added to the platform",
    category: "Onboarding",
    defaultChannels: ["in_app", "email"],
    titleTemplate: "Welcome to {{orgName}}!",
    bodyTemplate:
      "Hi {{userName}}, welcome aboard! Get started by completing your profile.",
  },
  {
    id: "leave_approved",
    name: "Leave Approved",
    description: "Sent when a leave request is approved",
    category: "Leave",
    defaultChannels: ["in_app", "email", "push"],
    titleTemplate: "Leave request approved",
    bodyTemplate:
      "Your {{leaveType}} leave from {{startDate}} to {{endDate}} has been approved by {{approverName}}.",
  },
  {
    id: "leave_rejected",
    name: "Leave Rejected",
    description: "Sent when a leave request is rejected",
    category: "Leave",
    defaultChannels: ["in_app", "email", "push"],
    titleTemplate: "Leave request declined",
    bodyTemplate:
      "Your {{leaveType}} leave from {{startDate}} to {{endDate}} was declined. Reason: {{reason}}.",
  },
  {
    id: "review_due",
    name: "Performance Review Due",
    description: "Reminder that a performance review is due",
    category: "Performance",
    defaultChannels: ["in_app", "email"],
    titleTemplate: "Performance review due soon",
    bodyTemplate:
      "Your performance review for {{revieweeName}} is due by {{dueDate}}. Please complete it on time.",
  },
  {
    id: "goal_deadline",
    name: "Goal Deadline Approaching",
    description: "Reminder that a goal deadline is approaching",
    category: "Performance",
    defaultChannels: ["in_app", "push"],
    titleTemplate: "Goal deadline approaching",
    bodyTemplate:
      'Your goal "{{goalTitle}}" is due on {{dueDate}}. Current progress: {{progress}}%.',
  },
  {
    id: "payroll_ready",
    name: "Payroll Ready",
    description: "Sent when payroll has been processed and is available",
    category: "Payroll",
    defaultChannels: ["in_app", "email", "push"],
    titleTemplate: "Payroll processed",
    bodyTemplate:
      "Your payroll for {{payPeriod}} has been processed. Net pay: {{netPay}}.",
  },
  {
    id: "document_requires_signature",
    name: "Document Requires Signature",
    description: "Sent when a document needs to be signed",
    category: "Documents",
    defaultChannels: ["in_app", "email", "push"],
    titleTemplate: "Signature required: {{documentName}}",
    bodyTemplate:
      "{{senderName}} has requested your signature on {{documentName}}. Please review and sign by {{dueDate}}.",
  },
  {
    id: "new_hire_onboarding",
    name: "New Hire Onboarding",
    description: "Onboarding task reminders for new hires",
    category: "Onboarding",
    defaultChannels: ["in_app", "email"],
    titleTemplate: "Onboarding task: {{taskName}}",
    bodyTemplate:
      "Please complete the onboarding task \"{{taskName}}\" by {{dueDate}}. {{completedCount}}/{{totalCount}} tasks completed.",
  },
  {
    id: "expense_approved",
    name: "Expense Approved",
    description: "Sent when an expense report is approved",
    category: "Finance",
    defaultChannels: ["in_app", "email"],
    titleTemplate: "Expense report approved",
    bodyTemplate:
      "Your expense report \"{{reportTitle}}\" for {{amount}} has been approved. Reimbursement is being processed.",
  },
  {
    id: "password_expiring",
    name: "Password Expiring",
    description: "Warning that user password is about to expire",
    category: "Security",
    defaultChannels: ["in_app", "email", "push"],
    titleTemplate: "Password expiring soon",
    bodyTemplate:
      "Your password will expire in {{daysRemaining}} days. Please update it to maintain access.",
  },
  {
    id: "compliance_alert",
    name: "Compliance Alert",
    description: "Alert for compliance-related deadlines or issues",
    category: "Compliance",
    defaultChannels: ["in_app", "email", "slack"],
    titleTemplate: "Compliance alert: {{alertType}}",
    bodyTemplate:
      "Action required: {{description}}. Deadline: {{deadline}}. Please address this promptly.",
  },
  {
    id: "training_due",
    name: "Training Due",
    description: "Reminder for mandatory training assignments",
    category: "Learning",
    defaultChannels: ["in_app", "email"],
    titleTemplate: "Training assignment due",
    bodyTemplate:
      'Your mandatory training "{{courseName}}" is due by {{dueDate}}. Time remaining: {{timeRemaining}}.',
  },
  {
    id: "device_assigned",
    name: "Device Assigned",
    description: "Notification when a device is assigned to the user",
    category: "IT",
    defaultChannels: ["in_app", "email"],
    titleTemplate: "New device assigned",
    bodyTemplate:
      "A {{deviceType}} ({{deviceModel}}) has been assigned to you. Serial: {{serialNumber}}.",
  },
  {
    id: "app_installed",
    name: "Application Installed",
    description: "Notification when an app is pushed to user device",
    category: "IT",
    defaultChannels: ["in_app"],
    titleTemplate: "Application installed: {{appName}}",
    bodyTemplate:
      "{{appName}} (v{{version}}) has been installed on your {{deviceName}}.",
  },
  {
    id: "system_maintenance",
    name: "System Maintenance",
    description: "Notification about upcoming system maintenance",
    category: "System",
    defaultChannels: ["in_app", "email", "slack", "push"],
    titleTemplate: "Scheduled maintenance: {{maintenanceWindow}}",
    bodyTemplate:
      "System maintenance is scheduled for {{maintenanceDate}} from {{startTime}} to {{endTime}}. Some services may be temporarily unavailable.",
  },
];

// --- Storage ---

// Key: `${orgId}:${userId}`
const notificationPreferencesStore = new Map<
  string,
  NotificationPreference[]
>();

// Key: notification id
const notificationStore = new Map<string, PushNotification>();

// --- Functions ---

function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    data[key] !== undefined ? String(data[key]) : `{{${key}}}`
  );
}

export function sendPushNotification(
  orgId: string,
  recipientId: string,
  templateId: string,
  data: Record<string, unknown> = {}
): PushNotification {
  const template = NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Notification template not found: ${templateId}`);
  }

  // Check user preferences
  const prefKey = `${orgId}:${recipientId}`;
  const prefs = notificationPreferencesStore.get(prefKey);
  const userPref = prefs?.find((p) => p.templateId === templateId);

  const channels: NotificationChannel[] =
    userPref && userPref.enabled
      ? userPref.channels
      : template.defaultChannels;

  const notification: PushNotification = {
    id: generateId(),
    orgId,
    recipientId,
    templateId,
    channels,
    title: interpolateTemplate(template.titleTemplate, data),
    body: interpolateTemplate(template.bodyTemplate, data),
    data,
    read: false,
    readAt: null,
    sentAt: now(),
  };

  notificationStore.set(notification.id, notification);
  return notification;
}

export function getNotificationPreferences(
  orgId: string,
  userId: string
): NotificationPreference[] {
  const key = `${orgId}:${userId}`;
  const existing = notificationPreferencesStore.get(key);

  if (existing) {
    return existing;
  }

  // Return default preferences from templates
  const defaults: NotificationPreference[] = NOTIFICATION_TEMPLATES.map(
    (t) => ({
      templateId: t.id,
      channels: [...t.defaultChannels],
      enabled: true,
    })
  );

  notificationPreferencesStore.set(key, defaults);
  return defaults;
}

export function updateNotificationPreferences(
  orgId: string,
  userId: string,
  preferences: NotificationPreference[]
): NotificationPreference[] {
  const key = `${orgId}:${userId}`;
  notificationPreferencesStore.set(key, preferences);
  return preferences;
}

export function getNotificationHistory(
  orgId: string,
  userId: string,
  limit: number = 50
): PushNotification[] {
  return Array.from(notificationStore.values())
    .filter((n) => n.orgId === orgId && n.recipientId === userId)
    .sort(
      (a, b) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    )
    .slice(0, limit);
}

export function markNotificationRead(
  orgId: string,
  notificationId: string
): PushNotification {
  const notification = notificationStore.get(notificationId);
  if (!notification || notification.orgId !== orgId) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  notification.read = true;
  notification.readAt = now();
  return notification;
}

export function getUnreadCount(orgId: string, userId: string): number {
  return Array.from(notificationStore.values()).filter(
    (n) => n.orgId === orgId && n.recipientId === userId && !n.read
  ).length;
}

// =============================================================================
// 3. E-SIGNATURE SYSTEM
// =============================================================================

// --- Types ---

export type SignatureStatus =
  | "pending"
  | "signed"
  | "declined"
  | "expired"
  | "voided";

export interface SignatureField {
  id: string;
  type: "signature" | "initials" | "date" | "text" | "checkbox";
  label: string;
  required: boolean;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedTo: string;
  value: string | null;
}

export interface SignerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  status: SignatureStatus;
  signedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  ipAddress: string | null;
}

export interface SignatureRequest {
  id: string;
  orgId: string;
  templateId: string;
  documentName: string;
  status: SignatureStatus;
  signers: SignerInfo[];
  fields: SignatureField[];
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface SignatureAuditEntry {
  id: string;
  requestId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
  details: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultFields: Omit<SignatureField, "id" | "value">[];
}

// --- Constants ---

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "offer_letter",
    name: "Offer Letter",
    description: "Standard employment offer letter",
    category: "Hiring",
    defaultFields: [
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 1,
        x: 100,
        y: 650,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
      {
        type: "date",
        label: "Date Signed",
        required: true,
        page: 1,
        x: 350,
        y: 650,
        width: 150,
        height: 30,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "HR Representative Signature",
        required: true,
        page: 1,
        x: 100,
        y: 720,
        width: 200,
        height: 50,
        assignedTo: "hr",
      },
    ],
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    description: "Mutual or one-way non-disclosure agreement",
    category: "Legal",
    defaultFields: [
      {
        type: "signature",
        label: "Disclosing Party Signature",
        required: true,
        page: 2,
        x: 100,
        y: 600,
        width: 200,
        height: 50,
        assignedTo: "disclosing_party",
      },
      {
        type: "signature",
        label: "Receiving Party Signature",
        required: true,
        page: 2,
        x: 100,
        y: 680,
        width: 200,
        height: 50,
        assignedTo: "receiving_party",
      },
      {
        type: "date",
        label: "Effective Date",
        required: true,
        page: 2,
        x: 350,
        y: 600,
        width: 150,
        height: 30,
        assignedTo: "disclosing_party",
      },
    ],
  },
  {
    id: "employment_agreement",
    name: "Employment Agreement",
    description: "Full employment terms and conditions agreement",
    category: "Hiring",
    defaultFields: [
      {
        type: "initials",
        label: "Employee Initials",
        required: true,
        page: 1,
        x: 500,
        y: 750,
        width: 60,
        height: 30,
        assignedTo: "employee",
      },
      {
        type: "initials",
        label: "Employee Initials",
        required: true,
        page: 2,
        x: 500,
        y: 750,
        width: 60,
        height: 30,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 3,
        x: 100,
        y: 600,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "Employer Signature",
        required: true,
        page: 3,
        x: 100,
        y: 680,
        width: 200,
        height: 50,
        assignedTo: "employer",
      },
    ],
  },
  {
    id: "ip_assignment",
    name: "IP Assignment Agreement",
    description: "Intellectual property assignment to the company",
    category: "Legal",
    defaultFields: [
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 1,
        x: 100,
        y: 650,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
      {
        type: "date",
        label: "Date Signed",
        required: true,
        page: 1,
        x: 350,
        y: 650,
        width: 150,
        height: 30,
        assignedTo: "employee",
      },
    ],
  },
  {
    id: "benefits_enrollment",
    name: "Benefits Enrollment Form",
    description: "Health and benefits enrollment form",
    category: "Benefits",
    defaultFields: [
      {
        type: "checkbox",
        label: "I acknowledge the benefits package",
        required: true,
        page: 1,
        x: 50,
        y: 600,
        width: 20,
        height: 20,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 1,
        x: 100,
        y: 680,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
    ],
  },
  {
    id: "policy_acknowledgment",
    name: "Policy Acknowledgment",
    description: "Company policy review and acknowledgment form",
    category: "Compliance",
    defaultFields: [
      {
        type: "checkbox",
        label: "I have read and understood the policy",
        required: true,
        page: 1,
        x: 50,
        y: 700,
        width: 20,
        height: 20,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 1,
        x: 100,
        y: 740,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
      {
        type: "date",
        label: "Date",
        required: true,
        page: 1,
        x: 350,
        y: 740,
        width: 150,
        height: 30,
        assignedTo: "employee",
      },
    ],
  },
  {
    id: "equipment_agreement",
    name: "Equipment Agreement",
    description: "Company equipment use and return agreement",
    category: "IT",
    defaultFields: [
      {
        type: "text",
        label: "Equipment Description",
        required: true,
        page: 1,
        x: 100,
        y: 400,
        width: 400,
        height: 30,
        assignedTo: "it_admin",
      },
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 1,
        x: 100,
        y: 650,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "IT Admin Signature",
        required: true,
        page: 1,
        x: 100,
        y: 720,
        width: 200,
        height: 50,
        assignedTo: "it_admin",
      },
    ],
  },
  {
    id: "separation_agreement",
    name: "Separation Agreement",
    description: "Employment separation and release agreement",
    category: "Offboarding",
    defaultFields: [
      {
        type: "signature",
        label: "Employee Signature",
        required: true,
        page: 2,
        x: 100,
        y: 600,
        width: 200,
        height: 50,
        assignedTo: "employee",
      },
      {
        type: "date",
        label: "Date Signed",
        required: true,
        page: 2,
        x: 350,
        y: 600,
        width: 150,
        height: 30,
        assignedTo: "employee",
      },
      {
        type: "signature",
        label: "HR Representative Signature",
        required: true,
        page: 2,
        x: 100,
        y: 680,
        width: 200,
        height: 50,
        assignedTo: "hr",
      },
      {
        type: "signature",
        label: "Witness Signature",
        required: true,
        page: 2,
        x: 100,
        y: 760,
        width: 200,
        height: 50,
        assignedTo: "witness",
      },
    ],
  },
];

// --- Storage ---

const signatureRequestStore = new Map<string, SignatureRequest>();
const signatureAuditStore = new Map<string, SignatureAuditEntry[]>();

// --- Functions ---

function addAuditEntry(
  requestId: string,
  action: string,
  performedBy: string,
  details: string
): void {
  const entry: SignatureAuditEntry = {
    id: generateId(),
    requestId,
    action,
    performedBy,
    performedAt: now(),
    ipAddress: "192.168.1." + Math.floor(Math.random() * 255),
    details,
  };

  const existing = signatureAuditStore.get(requestId) || [];
  existing.push(entry);
  signatureAuditStore.set(requestId, existing);
}

export function createSignatureRequest(
  orgId: string,
  templateId: string,
  signers: { name: string; email: string; role: string }[],
  customFields?: Omit<SignatureField, "id" | "value">[],
  expiresInDays?: number
): SignatureRequest {
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Document template not found: ${templateId}`);
  }

  const fieldDefs = customFields || template.defaultFields;
  const fields: SignatureField[] = fieldDefs.map((f) => ({
    ...f,
    id: generateId(),
    value: null,
  }));

  const signerInfos: SignerInfo[] = signers.map((s) => ({
    id: generateId(),
    name: s.name,
    email: s.email,
    role: s.role,
    status: "pending" as SignatureStatus,
    signedAt: null,
    declinedAt: null,
    declineReason: null,
    ipAddress: null,
  }));

  const expiresAt = expiresInDays
    ? new Date(
        Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      ).toISOString()
    : null;

  const request: SignatureRequest = {
    id: generateId(),
    orgId,
    templateId,
    documentName: template.name,
    status: "pending",
    signers: signerInfos,
    fields,
    createdBy: "system",
    createdAt: now(),
    expiresAt,
    completedAt: null,
    voidedAt: null,
    voidReason: null,
  };

  signatureRequestStore.set(request.id, request);
  addAuditEntry(
    request.id,
    "created",
    "system",
    `Signature request created for "${template.name}" with ${signers.length} signer(s)`
  );

  return request;
}

export function getSignatureRequest(
  orgId: string,
  requestId: string
): SignatureRequest {
  const request = signatureRequestStore.get(requestId);
  if (!request || request.orgId !== orgId) {
    throw new Error(`Signature request not found: ${requestId}`);
  }
  return request;
}

export function signDocument(
  orgId: string,
  requestId: string,
  signerId: string,
  signature: string
): SignatureRequest {
  const request = signatureRequestStore.get(requestId);
  if (!request || request.orgId !== orgId) {
    throw new Error(`Signature request not found: ${requestId}`);
  }

  if (request.status === "voided") {
    throw new Error("Cannot sign a voided document");
  }

  if (request.status === "expired") {
    throw new Error("Cannot sign an expired document");
  }

  const signer = request.signers.find((s) => s.id === signerId);
  if (!signer) {
    throw new Error(`Signer not found: ${signerId}`);
  }

  if (signer.status !== "pending") {
    throw new Error(`Signer has already ${signer.status} this document`);
  }

  signer.status = "signed";
  signer.signedAt = now();
  signer.ipAddress = "192.168.1." + Math.floor(Math.random() * 255);

  // Update signature fields assigned to this signer's role
  for (const field of request.fields) {
    if (
      field.assignedTo === signer.role &&
      field.type === "signature" &&
      !field.value
    ) {
      field.value = signature;
    }
  }

  addAuditEntry(
    requestId,
    "signed",
    signer.email,
    `${signer.name} (${signer.role}) signed the document`
  );

  // Check if all signers have signed
  const allSigned = request.signers.every((s) => s.status === "signed");
  if (allSigned) {
    request.status = "signed";
    request.completedAt = now();
    addAuditEntry(
      requestId,
      "completed",
      "system",
      "All signers have signed. Document is fully executed."
    );
  }

  return request;
}

export function declineDocument(
  orgId: string,
  requestId: string,
  signerId: string,
  reason?: string
): SignatureRequest {
  const request = signatureRequestStore.get(requestId);
  if (!request || request.orgId !== orgId) {
    throw new Error(`Signature request not found: ${requestId}`);
  }

  const signer = request.signers.find((s) => s.id === signerId);
  if (!signer) {
    throw new Error(`Signer not found: ${signerId}`);
  }

  signer.status = "declined";
  signer.declinedAt = now();
  signer.declineReason = reason || null;
  request.status = "declined";

  addAuditEntry(
    requestId,
    "declined",
    signer.email,
    `${signer.name} declined the document${reason ? `: ${reason}` : ""}`
  );

  return request;
}

export function voidSignatureRequest(
  orgId: string,
  requestId: string,
  reason?: string
): SignatureRequest {
  const request = signatureRequestStore.get(requestId);
  if (!request || request.orgId !== orgId) {
    throw new Error(`Signature request not found: ${requestId}`);
  }

  request.status = "voided";
  request.voidedAt = now();
  request.voidReason = reason || null;

  addAuditEntry(
    requestId,
    "voided",
    "system",
    `Signature request voided${reason ? `: ${reason}` : ""}`
  );

  return request;
}

export function getSignatureRequests(
  orgId: string,
  status?: SignatureStatus
): SignatureRequest[] {
  let results = Array.from(signatureRequestStore.values()).filter(
    (r) => r.orgId === orgId
  );

  if (status) {
    results = results.filter((r) => r.status === status);
  }

  return results.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSignatureAuditTrail(
  orgId: string,
  requestId: string
): SignatureAuditEntry[] {
  const request = signatureRequestStore.get(requestId);
  if (!request || request.orgId !== orgId) {
    throw new Error(`Signature request not found: ${requestId}`);
  }

  return signatureAuditStore.get(requestId) || [];
}

// =============================================================================
// 4. FEATURE FLAG SYSTEM
// =============================================================================

// --- Types ---

export interface FlagVariant {
  key: string;
  name: string;
  value: unknown;
  weight: number;
}

export interface FlagTargeting {
  enabled: boolean;
  rules: FlagTargetingRule[];
  defaultVariant: string;
  percentageRollout: number;
}

export interface FlagTargetingRule {
  id: string;
  attribute: "userId" | "role" | "department" | "email" | "country";
  operator: "equals" | "contains" | "in" | "not_in";
  values: string[];
  variant: string;
}

export interface FeatureFlag {
  id: string;
  orgId: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  targeting: FlagTargeting;
  variants: FlagVariant[];
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlagHistoryEntry {
  id: string;
  flagKey: string;
  orgId: string;
  action: "created" | "updated" | "deleted" | "enabled" | "disabled";
  previousValue: Partial<FeatureFlag> | null;
  newValue: Partial<FeatureFlag> | null;
  changedBy: string;
  changedAt: string;
}

// --- Constants ---

export const DEFAULT_FLAGS: Omit<
  FeatureFlag,
  "id" | "orgId" | "createdAt" | "updatedAt" | "isCustom"
>[] = [
  {
    key: "new_dashboard",
    name: "New Dashboard",
    description: "Redesigned dashboard with improved analytics and widgets",
    enabled: true,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "on",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "ai_assistant",
    name: "AI Assistant",
    description: "AI-powered assistant for HR queries and task automation",
    enabled: false,
    targeting: {
      enabled: true,
      rules: [
        {
          id: "rule_ai_1",
          attribute: "role",
          operator: "in",
          values: ["admin", "hr_manager"],
          variant: "on",
        },
      ],
      defaultVariant: "off",
      percentageRollout: 25,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 25 },
      { key: "off", name: "Disabled", value: false, weight: 75 },
    ],
  },
  {
    key: "advanced_reporting",
    name: "Advanced Reporting",
    description:
      "Advanced reporting features with custom report builder and scheduling",
    enabled: true,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "on",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "dark_mode",
    name: "Dark Mode",
    description: "Dark theme support across the entire platform",
    enabled: true,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "on",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "bulk_operations",
    name: "Bulk Operations",
    description: "Perform bulk actions on employees, documents, and records",
    enabled: true,
    targeting: {
      enabled: true,
      rules: [
        {
          id: "rule_bulk_1",
          attribute: "role",
          operator: "in",
          values: ["admin", "hr_manager", "it_admin"],
          variant: "on",
        },
      ],
      defaultVariant: "off",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "custom_fields",
    name: "Custom Fields",
    description: "Define custom fields on employee profiles and forms",
    enabled: false,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "off",
      percentageRollout: 0,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 0 },
      { key: "off", name: "Disabled", value: false, weight: 100 },
    ],
  },
  {
    key: "api_v2",
    name: "API v2",
    description: "Next-generation API with GraphQL support and improved rates",
    enabled: false,
    targeting: {
      enabled: true,
      rules: [
        {
          id: "rule_apiv2_1",
          attribute: "role",
          operator: "equals",
          values: ["admin"],
          variant: "on",
        },
      ],
      defaultVariant: "off",
      percentageRollout: 10,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 10 },
      { key: "off", name: "Disabled", value: false, weight: 90 },
    ],
  },
  {
    key: "mobile_app",
    name: "Mobile App",
    description: "Native mobile application access for iOS and Android",
    enabled: true,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "on",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "sso_enforcement",
    name: "SSO Enforcement",
    description:
      "Enforce Single Sign-On for all users with no password fallback",
    enabled: false,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "off",
      percentageRollout: 0,
    },
    variants: [
      { key: "on", name: "Enforced", value: true, weight: 0 },
      { key: "off", name: "Optional", value: false, weight: 100 },
    ],
  },
  {
    key: "audit_logging",
    name: "Audit Logging",
    description: "Enhanced audit logging with detailed change tracking",
    enabled: true,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "on",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "approval_workflows",
    name: "Approval Workflows",
    description:
      "Multi-step approval workflows for leave, expenses, and documents",
    enabled: true,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "on",
      percentageRollout: 100,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 100 },
      { key: "off", name: "Disabled", value: false, weight: 0 },
    ],
  },
  {
    key: "multi_currency",
    name: "Multi-Currency",
    description: "Support for multiple currencies in payroll and expenses",
    enabled: false,
    targeting: {
      enabled: true,
      rules: [
        {
          id: "rule_mc_1",
          attribute: "country",
          operator: "not_in",
          values: ["US"],
          variant: "on",
        },
      ],
      defaultVariant: "off",
      percentageRollout: 50,
    },
    variants: [
      { key: "on", name: "Enabled", value: true, weight: 50 },
      { key: "off", name: "Disabled", value: false, weight: 50 },
    ],
  },
];

// --- Storage ---

// Key: `${orgId}:${flagKey}`
const featureFlagStore = new Map<string, FeatureFlag>();
const flagHistoryStore = new Map<string, FlagHistoryEntry[]>();

// --- Functions ---

function ensureOrgFlags(orgId: string): void {
  const firstKey = `${orgId}:${DEFAULT_FLAGS[0].key}`;
  if (featureFlagStore.has(firstKey)) return;

  for (const flagDef of DEFAULT_FLAGS) {
    const flag: FeatureFlag = {
      id: generateId(),
      orgId,
      ...flagDef,
      targeting: { ...flagDef.targeting, rules: [...flagDef.targeting.rules] },
      variants: flagDef.variants.map((v) => ({ ...v })),
      isCustom: false,
      createdAt: daysAgo(90),
      updatedAt: now(),
    };
    featureFlagStore.set(`${orgId}:${flag.key}`, flag);
  }
}

export function getFeatureFlags(orgId: string): FeatureFlag[] {
  ensureOrgFlags(orgId);

  return Array.from(featureFlagStore.values())
    .filter((f) => f.orgId === orgId)
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function evaluateFlag(
  orgId: string,
  flagKey: string,
  context?: {
    userId?: string;
    role?: string;
    department?: string;
    email?: string;
    country?: string;
  }
): { enabled: boolean; variant: string; value: unknown } {
  ensureOrgFlags(orgId);

  const flag = featureFlagStore.get(`${orgId}:${flagKey}`);
  if (!flag) {
    return { enabled: false, variant: "off", value: false };
  }

  if (!flag.enabled) {
    return { enabled: false, variant: "off", value: false };
  }

  // If no targeting, flag is simply on/off
  if (!flag.targeting.enabled || !context) {
    return {
      enabled: flag.enabled,
      variant: flag.enabled ? "on" : "off",
      value: flag.enabled,
    };
  }

  // Evaluate targeting rules
  for (const rule of flag.targeting.rules) {
    const contextValue = context[rule.attribute];
    if (!contextValue) continue;

    let matched = false;
    switch (rule.operator) {
      case "equals":
        matched = rule.values.includes(contextValue);
        break;
      case "contains":
        matched = rule.values.some((v) => contextValue.includes(v));
        break;
      case "in":
        matched = rule.values.includes(contextValue);
        break;
      case "not_in":
        matched = !rule.values.includes(contextValue);
        break;
    }

    if (matched) {
      const variant = flag.variants.find((v) => v.key === rule.variant);
      return {
        enabled: true,
        variant: rule.variant,
        value: variant?.value ?? true,
      };
    }
  }

  // Percentage rollout
  if (flag.targeting.percentageRollout < 100 && context.userId) {
    // Deterministic hash based on userId + flagKey
    let hash = 0;
    const str = `${context.userId}:${flagKey}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const percentage = Math.abs(hash % 100);
    if (percentage >= flag.targeting.percentageRollout) {
      return { enabled: false, variant: "off", value: false };
    }
  }

  // Default variant
  const defaultVar = flag.variants.find(
    (v) => v.key === flag.targeting.defaultVariant
  );
  return {
    enabled: flag.enabled,
    variant: flag.targeting.defaultVariant,
    value: defaultVar?.value ?? flag.enabled,
  };
}

export function updateFlag(
  orgId: string,
  flagKey: string,
  enabled: boolean,
  targeting?: Partial<FlagTargeting>
): FeatureFlag {
  ensureOrgFlags(orgId);

  const key = `${orgId}:${flagKey}`;
  const flag = featureFlagStore.get(key);
  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  const previousValue: Partial<FeatureFlag> = {
    enabled: flag.enabled,
    targeting: { ...flag.targeting },
  };

  flag.enabled = enabled;
  if (targeting) {
    flag.targeting = { ...flag.targeting, ...targeting };
  }
  flag.updatedAt = now();

  // Record history
  const historyKey = `${orgId}:${flagKey}`;
  const history = flagHistoryStore.get(historyKey) || [];
  history.push({
    id: generateId(),
    flagKey,
    orgId,
    action: enabled ? "enabled" : "disabled",
    previousValue,
    newValue: { enabled: flag.enabled, targeting: { ...flag.targeting } },
    changedBy: "system",
    changedAt: now(),
  });
  flagHistoryStore.set(historyKey, history);

  return flag;
}

export function createFlag(
  orgId: string,
  key: string,
  name: string,
  description: string,
  variants?: FlagVariant[]
): FeatureFlag {
  ensureOrgFlags(orgId);

  const storeKey = `${orgId}:${key}`;
  if (featureFlagStore.has(storeKey)) {
    throw new Error(`Feature flag already exists: ${key}`);
  }

  const defaultVariants: FlagVariant[] = variants || [
    { key: "on", name: "Enabled", value: true, weight: 100 },
    { key: "off", name: "Disabled", value: false, weight: 0 },
  ];

  const flag: FeatureFlag = {
    id: generateId(),
    orgId,
    key,
    name,
    description,
    enabled: false,
    targeting: {
      enabled: false,
      rules: [],
      defaultVariant: "off",
      percentageRollout: 0,
    },
    variants: defaultVariants,
    isCustom: true,
    createdAt: now(),
    updatedAt: now(),
  };

  featureFlagStore.set(storeKey, flag);

  // Record history
  const historyKey = `${orgId}:${key}`;
  const history: FlagHistoryEntry[] = [
    {
      id: generateId(),
      flagKey: key,
      orgId,
      action: "created",
      previousValue: null,
      newValue: { key, name, description, enabled: false },
      changedBy: "system",
      changedAt: now(),
    },
  ];
  flagHistoryStore.set(historyKey, history);

  return flag;
}

export function deleteFlag(orgId: string, flagKey: string): void {
  ensureOrgFlags(orgId);

  const storeKey = `${orgId}:${flagKey}`;
  const flag = featureFlagStore.get(storeKey);
  if (!flag) {
    throw new Error(`Feature flag not found: ${flagKey}`);
  }

  if (!flag.isCustom) {
    throw new Error(
      `Cannot delete built-in feature flag: ${flagKey}. Only custom flags can be deleted.`
    );
  }

  // Record history before deletion
  const historyKey = `${orgId}:${flagKey}`;
  const history = flagHistoryStore.get(historyKey) || [];
  history.push({
    id: generateId(),
    flagKey,
    orgId,
    action: "deleted",
    previousValue: { key: flag.key, name: flag.name, enabled: flag.enabled },
    newValue: null,
    changedBy: "system",
    changedAt: now(),
  });
  flagHistoryStore.set(historyKey, history);

  featureFlagStore.delete(storeKey);
}

export function getFlagHistory(
  orgId: string,
  flagKey: string
): FlagHistoryEntry[] {
  ensureOrgFlags(orgId);

  const historyKey = `${orgId}:${flagKey}`;
  return flagHistoryStore.get(historyKey) || [];
}
