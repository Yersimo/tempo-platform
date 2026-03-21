import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Org Design Scenario Modeling Service
// Create what-if scenarios for org restructuring with cost/headcount impact
// ---------------------------------------------------------------------------

export type ScenarioInput = {
  name: string
  description?: string
  baselineDate: string
}

export type ChangeInput = {
  changeType: string
  targetType: string
  targetId?: string
  changeData: string // JSON
  costImpact?: number // cents
  headcountImpact?: number
  notes?: string
}

// ---- Scenario CRUD ----

export async function createScenario(orgId: string, createdBy: string, input: ScenarioInput) {
  const [scenario] = await db.insert(schema.orgScenarios).values({
    orgId,
    name: input.name,
    description: input.description || null,
    baselineDate: input.baselineDate,
    status: 'draft',
    createdBy,
  }).returning()
  return scenario
}

export async function updateScenario(scenarioId: string, input: Partial<ScenarioInput & { status: string }>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.baselineDate !== undefined) updates.baselineDate = input.baselineDate
  if (input.status !== undefined) updates.status = input.status

  const [scenario] = await db.update(schema.orgScenarios)
    .set(updates)
    .where(eq(schema.orgScenarios.id, scenarioId))
    .returning()
  return scenario
}

export async function listScenarios(orgId: string) {
  return db.select().from(schema.orgScenarios)
    .where(eq(schema.orgScenarios.orgId, orgId))
}

export async function getScenario(scenarioId: string) {
  const [scenario] = await db.select().from(schema.orgScenarios)
    .where(eq(schema.orgScenarios.id, scenarioId))
  return scenario || null
}

export async function deleteScenario(scenarioId: string) {
  await db.delete(schema.scenarioChanges).where(eq(schema.scenarioChanges.scenarioId, scenarioId))
  await db.delete(schema.scenarioSnapshots).where(eq(schema.scenarioSnapshots.scenarioId, scenarioId))
  await db.delete(schema.orgScenarios).where(eq(schema.orgScenarios.id, scenarioId))
}

// ---- Change CRUD ----

export async function addChange(scenarioId: string, input: ChangeInput) {
  const [change] = await db.insert(schema.scenarioChanges).values({
    scenarioId,
    changeType: input.changeType,
    targetType: input.targetType,
    targetId: input.targetId || null,
    changeData: input.changeData,
    costImpact: input.costImpact ?? 0,
    headcountImpact: input.headcountImpact ?? 0,
    notes: input.notes || null,
  }).returning()
  return change
}

export async function listChanges(scenarioId: string) {
  return db.select().from(schema.scenarioChanges)
    .where(eq(schema.scenarioChanges.scenarioId, scenarioId))
}

export async function removeChange(changeId: string) {
  await db.delete(schema.scenarioChanges)
    .where(eq(schema.scenarioChanges.id, changeId))
}

// ---- Impact Analysis ----

export async function calculateScenarioImpact(scenarioId: string) {
  const scenario = await getScenario(scenarioId)
  if (!scenario) return null

  const changes = await listChanges(scenarioId)

  const headcountDelta = changes.reduce((sum, c) => sum + (c.headcountImpact ?? 0), 0)
  const costDelta = changes.reduce((sum, c) => sum + (c.costImpact ?? 0), 0)

  // Get current org metrics
  const [empCount] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, scenario.orgId),
      eq(schema.employees.isActive, true),
    ))
  const [deptCount] = await db.select({ count: sql<number>`count(*)` })
    .from(schema.departments)
    .where(eq(schema.departments.orgId, scenario.orgId))

  const currentHeadcount = Number(empCount?.count || 0)
  const currentDeptCount = Number(deptCount?.count || 0)

  // Department changes
  const newDepts = changes.filter(c => c.changeType === 'create_department').length
  const mergedDepts = changes.filter(c => c.changeType === 'merge_departments').length
  const projectedDeptCount = currentDeptCount + newDepts - mergedDepts

  // Affected employees
  const affectedEmployeeIds = new Set(changes.filter(c => c.targetId).map(c => c.targetId!))

  // Change breakdown
  const changeBreakdown = {
    addRole: changes.filter(c => c.changeType === 'add_role').length,
    removeRole: changes.filter(c => c.changeType === 'remove_role').length,
    moveEmployee: changes.filter(c => c.changeType === 'move_employee').length,
    createDepartment: newDepts,
    mergeDepartments: mergedDepts,
    changeReporting: changes.filter(c => c.changeType === 'change_reporting').length,
    changeComp: changes.filter(c => c.changeType === 'change_comp').length,
    promote: changes.filter(c => c.changeType === 'promote').length,
  }

  return {
    scenarioId,
    scenarioName: scenario.name,
    currentHeadcount,
    projectedHeadcount: currentHeadcount + headcountDelta,
    headcountDelta,
    costDelta,
    currentDeptCount,
    projectedDeptCount,
    affectedEmployees: affectedEmployeeIds.size,
    totalChanges: changes.length,
    changeBreakdown,
  }
}

// ---- Scenario Comparison ----

export async function compareScenarios(scenarioIds: string[]) {
  const results = await Promise.all(scenarioIds.map(id => calculateScenarioImpact(id)))
  return results.filter(Boolean)
}

// ---- Org Snapshot ----

export async function snapshotCurrentOrg(orgId: string, scenarioId: string) {
  const employees = await db.select().from(schema.employees)
    .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))
  const departments = await db.select().from(schema.departments)
    .where(eq(schema.departments.orgId, orgId))

  // Build tree structure
  const tree = employees.map(e => ({
    id: e.id,
    name: e.fullName,
    title: e.jobTitle,
    level: e.level,
    departmentId: e.departmentId,
    managerId: e.managerId,
  }))

  // Calculate span of control
  const managerCounts: Record<string, number> = {}
  employees.forEach(e => {
    if (e.managerId) {
      managerCounts[e.managerId] = (managerCounts[e.managerId] || 0) + 1
    }
  })
  const spans = Object.values(managerCounts)
  const avgSpan = spans.length > 0 ? spans.reduce((a, b) => a + b, 0) / spans.length : 0

  // Calculate max depth
  function getDepth(empId: string, visited = new Set<string>()): number {
    if (visited.has(empId)) return 0
    visited.add(empId)
    const reports = employees.filter(e => e.managerId === empId)
    if (reports.length === 0) return 1
    return 1 + Math.max(...reports.map(r => getDepth(r.id, visited)))
  }
  const roots = employees.filter(e => !e.managerId)
  const maxDepth = roots.length > 0 ? Math.max(...roots.map(r => getDepth(r.id))) : 0

  const [snapshot] = await db.insert(schema.scenarioSnapshots).values({
    scenarioId,
    orgStructure: JSON.stringify({ employees: tree, departments }),
    totalHeadcount: employees.length,
    totalCost: 0,
    departmentCount: departments.length,
    avgSpanOfControl: Math.round(avgSpan * 10) / 10,
    maxDepth,
  }).returning()

  return snapshot
}

// ---- Get Scenario Org Tree ----

export async function getScenarioOrgTree(scenarioId: string) {
  const scenario = await getScenario(scenarioId)
  if (!scenario) return null

  const employees = await db.select().from(schema.employees)
    .where(and(eq(schema.employees.orgId, scenario.orgId), eq(schema.employees.isActive, true)))
  const departments = await db.select().from(schema.departments)
    .where(eq(schema.departments.orgId, scenario.orgId))
  const changes = await listChanges(scenarioId)

  // Build projected employee list with changes applied
  type ProjectedEmployee = {
    id: string
    name: string
    title: string | null
    level: string | null
    departmentId: string | null
    managerId: string | null
    isNew?: boolean
    isRemoved?: boolean
    isModified?: boolean
  }

  const projected: ProjectedEmployee[] = employees.map(e => ({
    id: e.id,
    name: e.fullName,
    title: e.jobTitle,
    level: e.level,
    departmentId: e.departmentId,
    managerId: e.managerId,
  }))

  // Apply changes
  for (const change of changes) {
    const data = JSON.parse(change.changeData)

    switch (change.changeType) {
      case 'add_role': {
        projected.push({
          id: change.id, // use change ID as placeholder
          name: data.name || 'New Role',
          title: data.jobTitle || 'New Position',
          level: data.level || null,
          departmentId: data.departmentId || null,
          managerId: data.managerId || null,
          isNew: true,
        })
        break
      }
      case 'remove_role': {
        const idx = projected.findIndex(e => e.id === change.targetId)
        if (idx >= 0) projected[idx].isRemoved = true
        break
      }
      case 'move_employee': {
        const emp = projected.find(e => e.id === change.targetId)
        if (emp) {
          if (data.newDepartmentId) emp.departmentId = data.newDepartmentId
          if (data.newManagerId) emp.managerId = data.newManagerId
          emp.isModified = true
        }
        break
      }
      case 'change_reporting': {
        const emp2 = projected.find(e => e.id === change.targetId)
        if (emp2) {
          emp2.managerId = data.newManagerId || emp2.managerId
          emp2.isModified = true
        }
        break
      }
      case 'promote': {
        const emp3 = projected.find(e => e.id === change.targetId)
        if (emp3) {
          if (data.newTitle) emp3.title = data.newTitle
          if (data.newLevel) emp3.level = data.newLevel
          emp3.isModified = true
        }
        break
      }
      case 'change_comp': {
        const emp4 = projected.find(e => e.id === change.targetId)
        if (emp4) emp4.isModified = true
        break
      }
    }
  }

  return {
    scenarioId,
    scenarioName: scenario.name,
    employees: projected,
    departments,
    changes,
  }
}

// ---- Apply Scenario (implement changes) ----

export async function applyScenario(scenarioId: string) {
  // Mark as implemented
  await updateScenario(scenarioId, { status: 'implemented' })
  return { success: true, scenarioId }
}

// ---- Snapshots ----

export async function listSnapshots(scenarioId: string) {
  return db.select().from(schema.scenarioSnapshots)
    .where(eq(schema.scenarioSnapshots.scenarioId, scenarioId))
}
