/**
 * Shadow IT → Compliance Integration
 *
 * When shadow IT apps are detected:
 * - Create compliance risk assessment
 * - Flag unapproved apps with data access
 * - Generate remediation tasks (approve, block, or replace)
 * - Calculate risk score
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Risk assessment for a detected shadow IT app */
export interface ShadowITRiskAssessment {
  detectionId: string
  appName: string
  appCategory: string
  riskScore: number // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  dataAccessLevel: 'none' | 'read' | 'write' | 'admin'
  complianceImpacts: string[]
  affectedRegulations: string[]
  employeeCount: number
}

/** Remediation task to be created */
export interface RemediationTask {
  title: string
  description: string
  action: 'approve' | 'block' | 'replace' | 'investigate'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignee_type: 'it_security' | 'compliance' | 'department_lead'
  due_days: number
  app_name: string
  detection_id: string
}

/** Result of generating a remediation plan */
export interface RemediationPlanResult {
  detectionId: string
  appName: string
  riskAssessment: ShadowITRiskAssessment
  tasks: RemediationTask[]
  totalTasks: number
  recommendedAction: 'approve' | 'block' | 'replace'
  estimatedResolutionDays: number
}

/** Store slice needed for shadow IT → compliance operations */
export interface ShadowITComplianceStoreSlice {
  shadowITDetections: Array<Record<string, unknown>>
  complianceRequirements: Array<Record<string, unknown>>
  employees: Array<{ id: string; department_id?: string; profile?: { full_name: string } }>
  departments: Array<{ id: string; name: string }>
  addComplianceAlert?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Risk scoring weights
// ---------------------------------------------------------------------------

const DATA_ACCESS_SCORES: Record<string, number> = {
  admin: 40,
  write: 30,
  read: 15,
  none: 0,
}

const CATEGORY_RISK_SCORES: Record<string, number> = {
  'file_sharing': 25,
  'communication': 20,
  'project_management': 15,
  'development': 15,
  'analytics': 20,
  'crm': 25,
  'finance': 30,
  'hr': 30,
  'security': 35,
  'other': 10,
}

const REGULATION_KEYWORDS: Record<string, string[]> = {
  'GDPR': ['file_sharing', 'communication', 'crm', 'hr', 'analytics'],
  'HIPAA': ['file_sharing', 'communication', 'hr'],
  'SOX': ['finance', 'analytics', 'project_management'],
  'PCI-DSS': ['finance', 'crm'],
  'SOC 2': ['development', 'security', 'file_sharing', 'communication'],
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Assess the compliance risk of a detected shadow IT application.
 *
 * @param detectionId    - ID of the shadow IT detection
 * @param appName        - Name of the detected app
 * @param appCategory    - Category of the app
 * @param dataAccessLevel - Level of data access the app has
 * @param employeeCount  - Number of employees using the app
 * @returns Risk assessment result
 */
export function assessShadowITRisk(
  detectionId: string,
  appName: string,
  appCategory: string,
  dataAccessLevel: 'none' | 'read' | 'write' | 'admin',
  employeeCount: number,
): ShadowITRiskAssessment {
  // Calculate base risk score
  const dataScore = DATA_ACCESS_SCORES[dataAccessLevel] || 0
  const categoryScore = CATEGORY_RISK_SCORES[appCategory.toLowerCase()] ||
    CATEGORY_RISK_SCORES['other']

  // Employee count factor (more users = higher risk)
  const userFactor = Math.min(20, Math.round(employeeCount / 5) * 5)

  const rawScore = dataScore + categoryScore + userFactor
  const riskScore = Math.min(100, rawScore)

  // Determine risk level
  let riskLevel: ShadowITRiskAssessment['riskLevel']
  if (riskScore >= 75) riskLevel = 'critical'
  else if (riskScore >= 55) riskLevel = 'high'
  else if (riskScore >= 35) riskLevel = 'medium'
  else riskLevel = 'low'

  // Identify compliance impacts
  const complianceImpacts: string[] = []
  if (dataAccessLevel === 'admin' || dataAccessLevel === 'write') {
    complianceImpacts.push('Potential unauthorized data modification')
  }
  if (dataAccessLevel !== 'none') {
    complianceImpacts.push('Unvetted third-party data access')
  }
  if (employeeCount > 10) {
    complianceImpacts.push('Widespread unauthorized software usage')
  }
  complianceImpacts.push('Missing vendor security assessment')
  complianceImpacts.push('No data processing agreement in place')

  // Find affected regulations based on app category
  const affectedRegulations: string[] = []
  const normalizedCategory = appCategory.toLowerCase()
  for (const [regulation, categories] of Object.entries(REGULATION_KEYWORDS)) {
    if (categories.includes(normalizedCategory)) {
      affectedRegulations.push(regulation)
    }
  }

  return {
    detectionId,
    appName,
    appCategory,
    riskScore,
    riskLevel,
    dataAccessLevel,
    complianceImpacts,
    affectedRegulations,
    employeeCount,
  }
}

/**
 * Generate a remediation plan for a shadow IT detection.
 *
 * @param assessment - Risk assessment from assessShadowITRisk
 * @returns Remediation plan with tasks
 */
export function generateRemediationPlan(
  assessment: ShadowITRiskAssessment,
): RemediationPlanResult {
  const tasks: RemediationTask[] = []
  const { detectionId, appName, riskLevel, dataAccessLevel, employeeCount } = assessment

  // Determine recommended action based on risk
  let recommendedAction: RemediationPlanResult['recommendedAction']
  if (riskLevel === 'critical') {
    recommendedAction = 'block'
  } else if (riskLevel === 'high' && dataAccessLevel === 'admin') {
    recommendedAction = 'block'
  } else if (riskLevel === 'low' && employeeCount <= 5) {
    recommendedAction = 'approve'
  } else {
    recommendedAction = 'replace'
  }

  // Task 1: Investigate the app
  tasks.push({
    title: `Investigate shadow IT app: ${appName}`,
    description: `Perform security assessment of ${appName}. Determine data exposure, vendor security posture, and business justification.`,
    action: 'investigate',
    priority: riskLevel === 'critical' ? 'critical' : 'high',
    assignee_type: 'it_security',
    due_days: riskLevel === 'critical' ? 2 : 5,
    app_name: appName,
    detection_id: detectionId,
  })

  // Task 2: Compliance review
  if (assessment.affectedRegulations.length > 0) {
    tasks.push({
      title: `Compliance review for ${appName}`,
      description: `Review ${appName} against ${assessment.affectedRegulations.join(', ')} requirements. Verify data processing agreements and privacy controls.`,
      action: 'investigate',
      priority: riskLevel === 'critical' || riskLevel === 'high' ? 'high' : 'medium',
      assignee_type: 'compliance',
      due_days: riskLevel === 'critical' ? 3 : 7,
      app_name: appName,
      detection_id: detectionId,
    })
  }

  // Task 3: Action based on recommendation
  if (recommendedAction === 'block') {
    tasks.push({
      title: `Block access to ${appName}`,
      description: `Block employee access to ${appName}. Notify ${employeeCount} affected user(s) and provide approved alternative.`,
      action: 'block',
      priority: 'critical',
      assignee_type: 'it_security',
      due_days: riskLevel === 'critical' ? 1 : 3,
      app_name: appName,
      detection_id: detectionId,
    })
  } else if (recommendedAction === 'replace') {
    tasks.push({
      title: `Identify approved replacement for ${appName}`,
      description: `Find an approved alternative to ${appName} that meets business needs while complying with security policies. Migrate ${employeeCount} user(s).`,
      action: 'replace',
      priority: 'high',
      assignee_type: 'it_security',
      due_days: 14,
      app_name: appName,
      detection_id: detectionId,
    })
  } else {
    tasks.push({
      title: `Onboard ${appName} as approved app`,
      description: `Complete vendor assessment, negotiate DPA, and add ${appName} to the approved application catalog.`,
      action: 'approve',
      priority: 'medium',
      assignee_type: 'it_security',
      due_days: 14,
      app_name: appName,
      detection_id: detectionId,
    })
  }

  // Task 4: Notify department lead if many users
  if (employeeCount > 5) {
    tasks.push({
      title: `Notify department leadership about ${appName} usage`,
      description: `${employeeCount} employees are using unapproved app ${appName}. Department lead needs to communicate policy and transition plan.`,
      action: 'investigate',
      priority: 'medium',
      assignee_type: 'department_lead',
      due_days: 5,
      app_name: appName,
      detection_id: detectionId,
    })
  }

  const maxDueDays = Math.max(...tasks.map(t => t.due_days))

  return {
    detectionId,
    appName,
    riskAssessment: assessment,
    tasks,
    totalTasks: tasks.length,
    recommendedAction,
    estimatedResolutionDays: maxDueDays,
  }
}
