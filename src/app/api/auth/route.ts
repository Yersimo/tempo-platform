import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// POST /api/auth - Login with email + password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password } = body

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      // Find employee by email
      const [employee] = await db.select().from(schema.employees)
        .where(eq(schema.employees.email, email))

      if (!employee) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Check password (demo format: "demo:password")
      const storedHash = employee.passwordHash
      if (!storedHash) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 401 })
      }

      // For demo, password hash is "demo:password"
      const expectedHash = `demo:${password}`
      if (storedHash !== expectedHash) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Get department
      let departmentName = ''
      if (employee.departmentId) {
        const [dept] = await db.select().from(schema.departments)
          .where(eq(schema.departments.id, employee.departmentId))
        departmentName = dept?.name || ''
      }

      // Build user response
      const user = {
        id: `user-${employee.id}`,
        email: employee.email,
        full_name: employee.fullName,
        avatar_url: employee.avatarUrl,
        role: employee.role,
        department_id: employee.departmentId,
        employee_id: employee.id,
        job_title: employee.jobTitle,
        department_name: departmentName,
      }

      // Log the login to audit
      await db.insert(schema.auditLog).values({
        orgId: employee.orgId,
        userId: employee.id,
        action: 'login',
        entityType: 'session',
        entityId: employee.id,
        details: `Login: ${employee.fullName} (${employee.email})`,
      })

      return NextResponse.json({ user })
    }

    if (action === 'logout') {
      // Just log the logout
      if (body.employeeId) {
        const [employee] = await db.select().from(schema.employees)
          .where(eq(schema.employees.id, body.employeeId))

        if (employee) {
          await db.insert(schema.auditLog).values({
            orgId: employee.orgId,
            userId: employee.id,
            action: 'logout',
            entityType: 'session',
            entityId: employee.id,
            details: `Logout: ${employee.fullName}`,
          })
        }
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'switch_user') {
      const { employeeId } = body
      if (!employeeId) {
        return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
      }

      const [employee] = await db.select().from(schema.employees)
        .where(eq(schema.employees.id, employeeId))

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      let departmentName = ''
      if (employee.departmentId) {
        const [dept] = await db.select().from(schema.departments)
          .where(eq(schema.departments.id, employee.departmentId))
        departmentName = dept?.name || ''
      }

      const user = {
        id: `user-${employee.id}`,
        email: employee.email,
        full_name: employee.fullName,
        avatar_url: employee.avatarUrl,
        role: employee.role,
        department_id: employee.departmentId,
        employee_id: employee.id,
        job_title: employee.jobTitle,
        department_name: departmentName,
      }

      return NextResponse.json({ user })
    }

    // GET credentials list (for login page)
    if (action === 'credentials') {
      // Return all employees that have passwords set (demo credentials)
      const employees = await db.select().from(schema.employees)
        .where(eq(schema.employees.isActive, true))

      const withPasswords = employees.filter(e => e.passwordHash)

      // Get departments for labels
      const departments = await db.select().from(schema.departments)
      const deptMap = new Map(departments.map(d => [d.id, d.name]))

      const credentials = withPasswords.map(e => ({
        email: e.email,
        password: 'demo1234', // All demo accounts use the same password
        employeeId: e.id,
        role: e.role,
        label: e.role === 'owner' ? `${e.jobTitle} (Owner)` :
               e.role === 'hrbp' ? 'HR Business Partner' :
               e.jobTitle,
        title: e.jobTitle,
        department: e.departmentId ? deptMap.get(e.departmentId) || '' : '',
        description: e.role === 'owner' ? 'Full platform access. Sees all modules, AI insights, and executive dashboards.' :
                     e.role === 'admin' ? `Department admin. Manages team performance, approvals, and recruiting.` :
                     e.role === 'hrbp' ? 'HR operations. Manages people, performance reviews, compensation, and engagement.' :
                     e.role === 'manager' ? 'Team manager. Reviews team goals, approves leave, manages direct reports.' :
                     'Individual contributor. Views own profile, goals, learning, and submits requests.',
      }))

      return NextResponse.json({ credentials })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
