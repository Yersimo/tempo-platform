// Security Event Monitoring for SOC 2 / HIPAA Compliance
// In-memory store for security events, alerts, and anomaly detection

// --- Types ---

export type SecurityEventType =
  | 'failed_login'
  | 'brute_force'
  | 'privilege_escalation'
  | 'unauthorized_access'
  | 'data_export'
  | 'suspicious_ip'
  | 'session_hijack'
  | 'mfa_bypass'
  | 'api_abuse'
  | 'data_tampering'
  | 'account_lockout'
  | 'password_change'
  | 'role_change'
  | 'unusual_access';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  orgId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface SecurityAlert {
  id: string;
  orgId: string;
  eventIds: string[];
  type: SecurityEventType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  unresolvedEvents: number;
  failedLogins24h: number;
  dataExports24h: number;
  activeAlerts: number;
}

export interface SecurityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
}

export interface SecurityDashboard {
  overallScore: number;
  metrics: SecurityMetrics;
  alerts: SecurityAlert[];
  recentEvents: SecurityEvent[];
  recommendations: SecurityRecommendation[];
}

// --- Configuration ---

export const SECURITY_RULES = {
  bruteForce: {
    maxAttempts: 5,
    windowMinutes: 15,
    lockoutMinutes: 30,
  },
  unusualAccess: {
    businessHoursStart: 6,  // 6 AM
    businessHoursEnd: 22,   // 10 PM
  },
  sessionHijack: {
    maxConcurrentSessions: 3,
  },
  apiAbuse: {
    maxRequestsPerMinute: 100,
  },
  dataExport: {
    maxExportsPerHour: 10,
  },
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    maxAgeDays: 90,
  },
} as const;

// --- In-Memory Store ---

const securityEvents = new Map<string, SecurityEvent>();
const securityAlerts = new Map<string, SecurityAlert>();

let eventCounter = 0;
let alertCounter = 0;

function generateEventId(): string {
  eventCounter += 1;
  return `evt_${Date.now()}_${eventCounter}`;
}

function generateAlertId(): string {
  alertCounter += 1;
  return `alt_${Date.now()}_${alertCounter}`;
}

// --- Severity Detection ---

function detectSeverity(type: SecurityEventType): SecuritySeverity {
  switch (type) {
    case 'brute_force':
    case 'privilege_escalation':
    case 'session_hijack':
    case 'data_tampering':
      return 'critical';

    case 'unauthorized_access':
    case 'mfa_bypass':
    case 'api_abuse':
    case 'account_lockout':
      return 'high';

    case 'failed_login':
    case 'suspicious_ip':
    case 'data_export':
    case 'unusual_access':
      return 'medium';

    case 'password_change':
    case 'role_change':
      return 'low';

    default:
      return 'medium';
  }
}

// --- Alert Triggers ---

const ALERT_TRIGGERING_TYPES: Set<SecurityEventType> = new Set([
  'brute_force',
  'privilege_escalation',
  'session_hijack',
  'data_tampering',
  'unauthorized_access',
  'mfa_bypass',
  'api_abuse',
  'account_lockout',
]);

function shouldTriggerAlert(type: SecurityEventType, severity: SecuritySeverity): boolean {
  if (severity === 'critical') return true;
  if (ALERT_TRIGGERING_TYPES.has(type)) return true;
  return false;
}

function createAlert(event: SecurityEvent): SecurityAlert {
  const alert: SecurityAlert = {
    id: generateAlertId(),
    orgId: event.orgId,
    eventIds: [event.id],
    type: event.type,
    severity: event.severity,
    title: formatAlertTitle(event.type),
    description: event.details,
    acknowledged: false,
    createdAt: new Date(),
  };

  securityAlerts.set(alert.id, alert);
  return alert;
}

function formatAlertTitle(type: SecurityEventType): string {
  const titles: Record<SecurityEventType, string> = {
    failed_login: 'Multiple Failed Login Attempts',
    brute_force: 'Brute Force Attack Detected',
    privilege_escalation: 'Unauthorized Privilege Escalation',
    unauthorized_access: 'Unauthorized Access Attempt',
    data_export: 'Unusual Data Export Activity',
    suspicious_ip: 'Suspicious IP Address Detected',
    session_hijack: 'Possible Session Hijacking',
    mfa_bypass: 'MFA Bypass Attempt',
    api_abuse: 'API Abuse Detected',
    data_tampering: 'Data Tampering Detected',
    account_lockout: 'Account Locked Out',
    password_change: 'Password Change Event',
    role_change: 'User Role Modified',
    unusual_access: 'Unusual Access Pattern Detected',
  };
  return titles[type] || 'Security Event';
}

// --- Core Functions ---

export function recordSecurityEvent(params: {
  type: SecurityEventType;
  orgId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
}): SecurityEvent {
  const severity = detectSeverity(params.type);

  const event: SecurityEvent = {
    id: generateEventId(),
    type: params.type,
    severity,
    orgId: params.orgId,
    userId: params.userId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    action: params.action,
    details: params.details,
    metadata: params.metadata,
    timestamp: new Date(),
    resolved: false,
  };

  securityEvents.set(event.id, event);

  // Auto-detect brute force
  if (params.type === 'failed_login' && params.userId) {
    const bruteForce = checkBruteForce(params.userId, params.orgId);
    if (bruteForce) {
      recordSecurityEvent({
        type: 'brute_force',
        orgId: params.orgId,
        userId: params.userId,
        ipAddress: params.ipAddress,
        action: 'brute_force_detected',
        details: `Brute force attack detected: ${SECURITY_RULES.bruteForce.maxAttempts}+ failed logins within ${SECURITY_RULES.bruteForce.windowMinutes} minutes for user ${params.userId}`,
        metadata: { triggeredByEventId: event.id },
      });
    }
  }

  // Trigger alert if needed
  if (shouldTriggerAlert(params.type, severity)) {
    createAlert(event);
  }

  return event;
}

export function getSecurityAlerts(orgId: string): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];
  for (const alert of securityAlerts.values()) {
    if (alert.orgId === orgId && !alert.acknowledged) {
      alerts.push(alert);
    }
  }
  return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getSecurityDashboard(orgId: string): SecurityDashboard {
  const orgEvents = getOrgEvents(orgId);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const metrics: SecurityMetrics = {
    totalEvents: orgEvents.length,
    criticalEvents: orgEvents.filter((e) => e.severity === 'critical').length,
    highEvents: orgEvents.filter((e) => e.severity === 'high').length,
    mediumEvents: orgEvents.filter((e) => e.severity === 'medium').length,
    lowEvents: orgEvents.filter((e) => e.severity === 'low').length,
    unresolvedEvents: orgEvents.filter((e) => !e.resolved).length,
    failedLogins24h: orgEvents.filter(
      (e) => e.type === 'failed_login' && e.timestamp >= twentyFourHoursAgo
    ).length,
    dataExports24h: orgEvents.filter(
      (e) => e.type === 'data_export' && e.timestamp >= twentyFourHoursAgo
    ).length,
    activeAlerts: getSecurityAlerts(orgId).length,
  };

  const overallScore = calculateSecurityScore(metrics);
  const alerts = getSecurityAlerts(orgId);
  const recentEvents = orgEvents
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);
  const recommendations = generateRecommendations(metrics, alerts);

  return {
    overallScore,
    metrics,
    alerts,
    recentEvents,
    recommendations,
  };
}

export function checkBruteForce(userId: string, orgId: string): boolean {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - SECURITY_RULES.bruteForce.windowMinutes * 60 * 1000
  );

  let failedCount = 0;
  for (const event of securityEvents.values()) {
    if (
      event.orgId === orgId &&
      event.userId === userId &&
      event.type === 'failed_login' &&
      event.timestamp >= windowStart
    ) {
      failedCount++;
    }
  }

  return failedCount >= SECURITY_RULES.bruteForce.maxAttempts;
}

export function checkUnusualAccess(
  userId: string,
  orgId: string,
  action: string
): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  const isOutOfHours =
    currentHour < SECURITY_RULES.unusualAccess.businessHoursStart ||
    currentHour >= SECURITY_RULES.unusualAccess.businessHoursEnd;

  if (isOutOfHours) {
    recordSecurityEvent({
      type: 'unusual_access',
      orgId,
      userId,
      action,
      details: `Out-of-hours access detected at ${now.toISOString()} for action: ${action}`,
      metadata: { hour: currentHour, isOutOfHours: true },
    });
    return true;
  }

  return false;
}

export function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string
): SecurityEvent | null {
  const event = securityEvents.get(eventId);
  if (!event) return null;

  event.resolved = true;
  event.resolvedBy = resolvedBy;
  event.resolvedAt = new Date();
  securityEvents.set(eventId, event);

  return event;
}

export function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): SecurityAlert | null {
  const alert = securityAlerts.get(alertId);
  if (!alert) return null;

  alert.acknowledged = true;
  alert.acknowledgedBy = acknowledgedBy;
  alert.acknowledgedAt = new Date();
  securityAlerts.set(alertId, alert);

  return alert;
}

// --- Internal Helpers ---

function getOrgEvents(orgId: string): SecurityEvent[] {
  const events: SecurityEvent[] = [];
  for (const event of securityEvents.values()) {
    if (event.orgId === orgId) {
      events.push(event);
    }
  }
  return events;
}

function calculateSecurityScore(metrics: SecurityMetrics): number {
  let score = 100;

  score -= metrics.criticalEvents * 15;
  score -= metrics.highEvents * 8;
  score -= metrics.mediumEvents * 3;
  score -= metrics.lowEvents * 1;
  score -= metrics.unresolvedEvents * 5;
  score -= metrics.activeAlerts * 10;

  if (metrics.failedLogins24h > 10) score -= 10;
  if (metrics.dataExports24h > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(
  metrics: SecurityMetrics,
  alerts: SecurityAlert[]
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  if (metrics.criticalEvents > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Incident Response',
      title: 'Address Critical Security Events',
      description: `There are ${metrics.criticalEvents} critical security events that require immediate investigation and remediation.`,
    });
  }

  if (metrics.unresolvedEvents > 5) {
    recommendations.push({
      priority: 'high',
      category: 'Event Management',
      title: 'Resolve Outstanding Security Events',
      description: `${metrics.unresolvedEvents} security events are unresolved. Review and resolve events to maintain a healthy security posture.`,
    });
  }

  if (metrics.failedLogins24h > 5) {
    recommendations.push({
      priority: 'medium',
      category: 'Authentication',
      title: 'Review Failed Login Attempts',
      description: `${metrics.failedLogins24h} failed login attempts in the last 24 hours. Consider enforcing MFA and reviewing account security.`,
    });
  }

  if (metrics.dataExports24h > 3) {
    recommendations.push({
      priority: 'medium',
      category: 'Data Protection',
      title: 'Monitor Data Export Activity',
      description: `${metrics.dataExports24h} data exports detected in the last 24 hours. Verify these exports are authorized.`,
    });
  }

  const hasBruteForceAlert = alerts.some((a) => a.type === 'brute_force');
  if (hasBruteForceAlert) {
    recommendations.push({
      priority: 'high',
      category: 'Authentication',
      title: 'Implement Rate Limiting',
      description:
        'Brute force attacks have been detected. Ensure rate limiting and account lockout policies are enforced.',
    });
  }

  if (metrics.activeAlerts > 3) {
    recommendations.push({
      priority: 'medium',
      category: 'Alert Management',
      title: 'Review and Triage Active Alerts',
      description: `${metrics.activeAlerts} active alerts need attention. Prioritize critical and high severity alerts.`,
    });
  }

  // Always include baseline recommendations
  recommendations.push({
    priority: 'low',
    category: 'Compliance',
    title: 'Conduct Quarterly Access Review',
    description:
      'Perform a quarterly review of all user access levels and permissions to ensure principle of least privilege.',
  });

  recommendations.push({
    priority: 'low',
    category: 'Training',
    title: 'Schedule Security Awareness Training',
    description:
      'Ensure all employees have completed annual security awareness training as required by SOC 2 and HIPAA.',
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
