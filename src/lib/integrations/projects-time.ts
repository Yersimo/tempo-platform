/**
 * Projects → Time Integration
 *
 * When project assignments change:
 * - Pre-fill time entry categories with project codes
 * - Set allocation percentages
 * - Create suggested time entry templates
 * - Track project hours vs budget
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Time entry template for a project assignment */
export interface TimeEntryTemplate {
  employee_id: string
  project_id: string
  project_name: string
  category: string
  allocation_percent: number
  suggested_hours_per_day: number
  default_description: string
  auto_generated: boolean
}

/** Project hours tracking summary */
export interface ProjectHoursTracker {
  projectId: string
  projectName: string
  employeeId: string
  allocatedPercent: number
  budgetHours: number
  loggedHours: number
  remainingHours: number
  utilizationPercent: number
  status: 'on_track' | 'over_budget' | 'under_utilized'
}

/** Result of syncing project assignments */
export interface ProjectAssignmentSyncResult {
  projectId: string
  projectName: string
  employeeId: string
  action: 'assigned' | 'updated' | 'removed'
  templates: TimeEntryTemplate[]
  hoursTracker: ProjectHoursTracker | null
}

/** Store slice needed for projects→time operations */
export interface ProjectsTimeStoreSlice {
  employees: Array<{ id: string; profile?: { full_name: string } }>
  projects: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
  timeEntries: Array<Record<string, unknown>>
  addTimeEntry?: (data: Record<string, unknown>) => void
  updateTimeEntry?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STANDARD_WORK_HOURS_PER_DAY = 8
const STANDARD_WORK_DAYS_PER_WEEK = 5

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Sync project assignments and generate time entry templates.
 *
 * @param projectId       - ID of the project
 * @param projectName     - Name of the project
 * @param employeeId      - Employee being assigned/updated
 * @param role            - Employee's role on the project
 * @param allocationPercent - Percentage of time allocated (0-100)
 * @param action          - Whether assigned, updated, or removed
 * @param store           - Store slice with project and time data
 * @param options         - Optional start/end dates
 * @returns Sync result with templates
 */
export function syncProjectAssignments(
  projectId: string,
  projectName: string,
  employeeId: string,
  role: string,
  allocationPercent: number,
  action: 'assigned' | 'updated' | 'removed',
  store: ProjectsTimeStoreSlice,
  options?: { startDate?: string; endDate?: string },
): ProjectAssignmentSyncResult {
  if (action === 'removed') {
    return {
      projectId,
      projectName,
      employeeId,
      action,
      templates: [],
      hoursTracker: null,
    }
  }

  // Generate time entry templates based on project tasks
  const templates = generateTimeEntryTemplates(
    projectId,
    projectName,
    employeeId,
    role,
    allocationPercent,
    store,
  )

  // Calculate hours tracking
  const hoursTracker = calculateProjectHoursTracker(
    projectId,
    projectName,
    employeeId,
    allocationPercent,
    store,
    options,
  )

  return {
    projectId,
    projectName,
    employeeId,
    action,
    templates,
    hoursTracker,
  }
}

/**
 * Generate time entry templates for a project assignment.
 * Creates templates based on project tasks and categories.
 *
 * @param projectId       - Project ID
 * @param projectName     - Project name
 * @param employeeId      - Employee ID
 * @param role            - Employee's project role
 * @param allocationPercent - Time allocation percentage
 * @param store           - Store with project task data
 * @returns Array of time entry templates
 */
export function generateTimeEntryTemplates(
  projectId: string,
  projectName: string,
  employeeId: string,
  role: string,
  allocationPercent: number,
  store: ProjectsTimeStoreSlice,
): TimeEntryTemplate[] {
  const templates: TimeEntryTemplate[] = []
  const suggestedHoursPerDay = (STANDARD_WORK_HOURS_PER_DAY * allocationPercent) / 100

  // Find project tasks assigned to or relevant for this employee
  const projectTasks = store.tasks.filter(t => {
    const task = t as Record<string, unknown>
    return task.project_id === projectId
  })

  // Group tasks by category/phase
  const categories = new Map<string, string[]>()
  for (const t of projectTasks) {
    const task = t as Record<string, unknown>
    const category = (task.category as string) || (task.phase as string) || 'General'
    const title = (task.title as string) || (task.name as string) || ''
    const existing = categories.get(category) || []
    existing.push(title)
    categories.set(category, existing)
  }

  // If no task categories found, create default templates based on role
  if (categories.size === 0) {
    const defaultCategories = getDefaultCategoriesForRole(role)
    for (const cat of defaultCategories) {
      categories.set(cat, [])
    }
  }

  for (const [category, taskNames] of categories) {
    const description = taskNames.length > 0
      ? `${projectName} — ${category}: ${taskNames.slice(0, 3).join(', ')}${taskNames.length > 3 ? '...' : ''}`
      : `${projectName} — ${category}`

    templates.push({
      employee_id: employeeId,
      project_id: projectId,
      project_name: projectName,
      category,
      allocation_percent: allocationPercent,
      suggested_hours_per_day: Math.round((suggestedHoursPerDay / Math.max(categories.size, 1)) * 100) / 100,
      default_description: description,
      auto_generated: true,
    })
  }

  return templates
}

/**
 * Calculate project hours tracking for an employee assignment.
 */
function calculateProjectHoursTracker(
  projectId: string,
  projectName: string,
  employeeId: string,
  allocationPercent: number,
  store: ProjectsTimeStoreSlice,
  options?: { startDate?: string; endDate?: string },
): ProjectHoursTracker {
  // Find the project for budget info
  const project = store.projects.find(p => {
    const proj = p as Record<string, unknown>
    return proj.id === projectId
  }) as Record<string, unknown> | undefined

  // Calculate budget hours based on allocation and project duration
  const startDate = options?.startDate || (project?.start_date as string) || new Date().toISOString().split('T')[0]
  const endDate = options?.endDate || (project?.end_date as string) || ''

  let budgetHours = 0
  if (endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const workDays = Math.round(diffDays * (5 / 7)) // approximate work days
    budgetHours = Math.round(workDays * STANDARD_WORK_HOURS_PER_DAY * (allocationPercent / 100))
  } else {
    // Default to monthly budget if no end date
    budgetHours = Math.round(STANDARD_WORK_DAYS_PER_WEEK * 4 * STANDARD_WORK_HOURS_PER_DAY * (allocationPercent / 100))
  }

  // Calculate logged hours
  const loggedHours = store.timeEntries
    .filter(e => {
      const entry = e as Record<string, unknown>
      return entry.employee_id === employeeId && entry.project_id === projectId
    })
    .reduce((sum, e) => {
      const entry = e as Record<string, unknown>
      const hours = typeof entry.hours === 'number' ? entry.hours :
        typeof entry.total_hours === 'number' ? entry.total_hours : 0
      return sum + hours
    }, 0)

  const remainingHours = Math.max(0, budgetHours - loggedHours)
  const utilizationPercent = budgetHours > 0
    ? Math.round((loggedHours / budgetHours) * 100)
    : 0

  let status: ProjectHoursTracker['status']
  if (utilizationPercent > 110) status = 'over_budget'
  else if (utilizationPercent < 50) status = 'under_utilized'
  else status = 'on_track'

  return {
    projectId,
    projectName,
    employeeId,
    allocatedPercent: allocationPercent,
    budgetHours,
    loggedHours: Math.round(loggedHours * 100) / 100,
    remainingHours,
    utilizationPercent,
    status,
  }
}

/**
 * Get default time entry categories based on project role.
 */
function getDefaultCategoriesForRole(role: string): string[] {
  const normalized = role.toLowerCase()
  if (normalized.includes('engineer') || normalized.includes('develop')) {
    return ['Development', 'Code Review', 'Meetings']
  }
  if (normalized.includes('design')) {
    return ['Design', 'Review', 'Meetings']
  }
  if (normalized.includes('manager') || normalized.includes('lead')) {
    return ['Planning', 'Reviews', 'Meetings', 'Admin']
  }
  if (normalized.includes('qa') || normalized.includes('test')) {
    return ['Testing', 'Bug Triage', 'Meetings']
  }
  return ['General', 'Meetings']
}
