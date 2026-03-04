/**
 * RQL Engine — Reporting Query Language
 *
 * A custom query language parser and executor for the Tempo platform.
 * Uses a recursive descent parser to convert RQL strings into an AST,
 * which is then compiled into Drizzle ORM queries for execution.
 *
 * Syntax:
 *   SELECT employees.name, employees.department
 *   WHERE employees.status = 'active' AND employees.hire_date > '2025-01-01'
 *   ORDER BY employees.name ASC
 *   GROUP BY employees.department
 *   HAVING COUNT(*) > 5
 *   LIMIT 100
 *   OFFSET 0
 *
 * Aggregations: COUNT, SUM, AVG, MIN, MAX
 * Joins: Implicit via entity references (employees.department_id = departments.id)
 * Parameters: $startDate, $department, etc.
 */

import { db, schema } from '@/lib/db'
import { eq, and, or, gt, gte, lt, lte, like, sql, desc, asc, count, sum, avg, min, max, ne, inArray } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export interface RQLQuery {
  raw: string
  ast: QueryAST
  parameters?: Record<string, unknown>
}

export interface QueryAST {
  type: 'SELECT'
  columns: ColumnRef[]
  from: EntityRef[]
  where?: WhereClause
  orderBy?: OrderByClause[]
  groupBy?: ColumnRef[]
  having?: WhereClause
  limit?: number
  offset?: number
  joins?: JoinClause[]
}

export interface ColumnRef {
  entity: string
  field: string
  alias?: string
  aggregation?: AggregationType
  expression?: string // for COUNT(*)
}

export interface EntityRef {
  name: string
  alias?: string
}

export interface WhereClause {
  type: 'AND' | 'OR' | 'COMPARISON' | 'NOT'
  left?: WhereClause
  right?: WhereClause
  operand?: WhereClause
  column?: ColumnRef
  operator?: ComparisonOperator
  value?: LiteralValue
  parameter?: string
}

export interface JoinClause {
  entity: EntityRef
  on: WhereClause
  type: 'INNER' | 'LEFT' | 'RIGHT'
}

export interface OrderByClause {
  column: ColumnRef
  direction: 'ASC' | 'DESC'
}

export type AggregationType = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'
export type ComparisonOperator = '=' | '!=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN'
export type LiteralValue = string | number | boolean | null | Array<string | number>

export interface QueryResult {
  columns: Array<{ name: string; type: string; label: string }>
  rows: Record<string, unknown>[]
  rowCount: number
  metadata: {
    executionMs: number
    query: string
    parsedAt: string
    entities: string[]
    hasAggregation: boolean
  }
}

export interface QueryExplanation {
  summary: string
  entities: string[]
  columns: string[]
  filters: string[]
  grouping: string[]
  ordering: string[]
  aggregations: string[]
  estimatedComplexity: 'low' | 'medium' | 'high'
}

export interface QuerySuggestion {
  text: string
  type: 'entity' | 'field' | 'keyword' | 'operator' | 'function' | 'value'
  description?: string
}

export interface SavedQueryInput {
  name: string
  description?: string
  query: string
  parameters?: Array<{ name: string; type: string; defaultValue?: unknown; label?: string }>
  tags?: string[]
  isPublic?: boolean
}

export interface ScheduleInput {
  queryId: string
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  recipients: Array<{ employeeId?: string; email?: string; channel: 'email' | 'slack' }>
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
}

export interface QueryVisualization {
  type: 'table' | 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap'
  config: {
    xAxis?: string
    yAxis?: string
    groupBy?: string
    title?: string
    colors?: string[]
  }
}

// ============================================================
// Entity Registry — available entities and their schemas
// ============================================================

const ENTITY_REGISTRY: Record<string, {
  table: string
  drizzleRef: any
  fields: Record<string, { type: string; label: string; filterable: boolean; sortable: boolean }>
  relations?: Record<string, { entity: string; localField: string; foreignField: string }>
}> = {
  employees: {
    table: 'employees',
    drizzleRef: schema.employees,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      full_name: { type: 'string', label: 'Full Name', filterable: true, sortable: true },
      email: { type: 'string', label: 'Email', filterable: true, sortable: true },
      phone: { type: 'string', label: 'Phone', filterable: true, sortable: false },
      job_title: { type: 'string', label: 'Job Title', filterable: true, sortable: true },
      level: { type: 'string', label: 'Level', filterable: true, sortable: true },
      country: { type: 'string', label: 'Country', filterable: true, sortable: true },
      role: { type: 'enum', label: 'Role', filterable: true, sortable: true },
      hire_date: { type: 'date', label: 'Hire Date', filterable: true, sortable: true },
      is_active: { type: 'boolean', label: 'Active', filterable: true, sortable: true },
      department_id: { type: 'uuid', label: 'Department ID', filterable: true, sortable: false },
      manager_id: { type: 'uuid', label: 'Manager ID', filterable: true, sortable: false },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
    relations: {
      departments: { entity: 'departments', localField: 'department_id', foreignField: 'id' },
    },
  },
  departments: {
    table: 'departments',
    drizzleRef: schema.departments,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      name: { type: 'string', label: 'Name', filterable: true, sortable: true },
      parent_id: { type: 'uuid', label: 'Parent ID', filterable: true, sortable: false },
      head_id: { type: 'uuid', label: 'Head ID', filterable: true, sortable: false },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  goals: {
    table: 'goals',
    drizzleRef: schema.goals,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      title: { type: 'string', label: 'Title', filterable: true, sortable: true },
      category: { type: 'enum', label: 'Category', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      progress: { type: 'number', label: 'Progress', filterable: true, sortable: true },
      due_date: { type: 'date', label: 'Due Date', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  reviews: {
    table: 'reviews',
    drizzleRef: schema.reviews,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      type: { type: 'enum', label: 'Type', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      overall_rating: { type: 'number', label: 'Overall Rating', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  payroll: {
    table: 'payrollRuns',
    drizzleRef: schema.payrollRuns,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      period: { type: 'string', label: 'Period', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      total_gross: { type: 'number', label: 'Total Gross', filterable: true, sortable: true },
      total_net: { type: 'number', label: 'Total Net', filterable: true, sortable: true },
      total_deductions: { type: 'number', label: 'Total Deductions', filterable: true, sortable: true },
      employee_count: { type: 'number', label: 'Employee Count', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  benefits: {
    table: 'benefitEnrollments',
    drizzleRef: schema.benefitEnrollments,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      plan_id: { type: 'uuid', label: 'Plan ID', filterable: true, sortable: false },
      employee_id: { type: 'uuid', label: 'Employee ID', filterable: true, sortable: false },
      coverage_level: { type: 'string', label: 'Coverage Level', filterable: true, sortable: true },
      enrolled_at: { type: 'date', label: 'Enrolled At', filterable: true, sortable: true },
    },
  },
  expenses: {
    table: 'expenseReports',
    drizzleRef: schema.expenseReports,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      title: { type: 'string', label: 'Title', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      total_amount: { type: 'number', label: 'Total Amount', filterable: true, sortable: true },
      currency: { type: 'string', label: 'Currency', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  leave: {
    table: 'leaveRequests',
    drizzleRef: schema.leaveRequests,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      type: { type: 'enum', label: 'Type', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      start_date: { type: 'date', label: 'Start Date', filterable: true, sortable: true },
      end_date: { type: 'date', label: 'End Date', filterable: true, sortable: true },
      days: { type: 'number', label: 'Days', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  recruiting: {
    table: 'applications',
    drizzleRef: schema.applications,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      candidate_name: { type: 'string', label: 'Candidate Name', filterable: true, sortable: true },
      candidate_email: { type: 'string', label: 'Candidate Email', filterable: true, sortable: true },
      stage: { type: 'enum', label: 'Stage', filterable: true, sortable: true },
      rating: { type: 'number', label: 'Rating', filterable: true, sortable: true },
      applied_at: { type: 'timestamp', label: 'Applied At', filterable: true, sortable: true },
    },
  },
  devices: {
    table: 'devices',
    drizzleRef: schema.devices,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      name: { type: 'string', label: 'Name', filterable: true, sortable: true },
      type: { type: 'enum', label: 'Type', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      serial_number: { type: 'string', label: 'Serial Number', filterable: true, sortable: true },
      assigned_to: { type: 'uuid', label: 'Assigned To', filterable: true, sortable: false },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  courses: {
    table: 'courses',
    drizzleRef: schema.courses,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      title: { type: 'string', label: 'Title', filterable: true, sortable: true },
      format: { type: 'enum', label: 'Format', filterable: true, sortable: true },
      level: { type: 'enum', label: 'Level', filterable: true, sortable: true },
      duration_hours: { type: 'number', label: 'Duration (Hours)', filterable: true, sortable: true },
      is_mandatory: { type: 'boolean', label: 'Mandatory', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
  surveys: {
    table: 'surveys',
    drizzleRef: schema.surveys,
    fields: {
      id: { type: 'uuid', label: 'ID', filterable: true, sortable: true },
      title: { type: 'string', label: 'Title', filterable: true, sortable: true },
      type: { type: 'enum', label: 'Type', filterable: true, sortable: true },
      status: { type: 'enum', label: 'Status', filterable: true, sortable: true },
      created_at: { type: 'timestamp', label: 'Created At', filterable: true, sortable: true },
    },
  },
}

// Map snake_case fields to camelCase Drizzle column names
const FIELD_NAME_MAP: Record<string, string> = {
  full_name: 'fullName',
  job_title: 'jobTitle',
  hire_date: 'hireDate',
  is_active: 'isActive',
  department_id: 'departmentId',
  manager_id: 'managerId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  parent_id: 'parentId',
  head_id: 'headId',
  due_date: 'dueDate',
  overall_rating: 'overallRating',
  total_gross: 'totalGross',
  total_net: 'totalNet',
  total_deductions: 'totalDeductions',
  employee_count: 'employeeCount',
  plan_id: 'planId',
  employee_id: 'employeeId',
  coverage_level: 'coverageLevel',
  enrolled_at: 'enrolledAt',
  total_amount: 'totalAmount',
  start_date: 'startDate',
  end_date: 'endDate',
  serial_number: 'serialNumber',
  assigned_to: 'assignedTo',
  duration_hours: 'durationHours',
  is_mandatory: 'isMandatory',
  candidate_name: 'candidateName',
  candidate_email: 'candidateEmail',
  applied_at: 'appliedAt',
  org_id: 'orgId',
}

// ============================================================
// Tokenizer (Lexer)
// ============================================================

type TokenType =
  | 'SELECT' | 'FROM' | 'WHERE' | 'AND' | 'OR' | 'NOT'
  | 'ORDER' | 'BY' | 'GROUP' | 'HAVING' | 'LIMIT' | 'OFFSET'
  | 'ASC' | 'DESC' | 'AS' | 'ON' | 'JOIN' | 'LEFT' | 'RIGHT' | 'INNER'
  | 'IN' | 'IS' | 'NULL' | 'BETWEEN' | 'LIKE'
  | 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'
  | 'IDENTIFIER' | 'DOT' | 'COMMA' | 'STAR'
  | 'STRING' | 'NUMBER' | 'BOOLEAN'
  | 'LPAREN' | 'RPAREN'
  | 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE'
  | 'PARAMETER'
  | 'EOF'

interface Token {
  type: TokenType
  value: string
  position: number
}

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET',
  'ASC', 'DESC', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
  'IN', 'IS', 'NULL', 'BETWEEN', 'LIKE',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'TRUE', 'FALSE',
])

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++
      continue
    }

    const startPos = pos

    // Single-character tokens
    if (input[pos] === '(') { tokens.push({ type: 'LPAREN', value: '(', position: pos }); pos++; continue }
    if (input[pos] === ')') { tokens.push({ type: 'RPAREN', value: ')', position: pos }); pos++; continue }
    if (input[pos] === ',') { tokens.push({ type: 'COMMA', value: ',', position: pos }); pos++; continue }
    if (input[pos] === '.') { tokens.push({ type: 'DOT', value: '.', position: pos }); pos++; continue }
    if (input[pos] === '*') { tokens.push({ type: 'STAR', value: '*', position: pos }); pos++; continue }

    // Comparison operators
    if (input[pos] === '=' ) { tokens.push({ type: 'EQ', value: '=', position: pos }); pos++; continue }
    if (input[pos] === '!' && input[pos + 1] === '=') { tokens.push({ type: 'NEQ', value: '!=', position: pos }); pos += 2; continue }
    if (input[pos] === '<' && input[pos + 1] === '>') { tokens.push({ type: 'NEQ', value: '<>', position: pos }); pos += 2; continue }
    if (input[pos] === '>' && input[pos + 1] === '=') { tokens.push({ type: 'GTE', value: '>=', position: pos }); pos += 2; continue }
    if (input[pos] === '<' && input[pos + 1] === '=') { tokens.push({ type: 'LTE', value: '<=', position: pos }); pos += 2; continue }
    if (input[pos] === '>') { tokens.push({ type: 'GT', value: '>', position: pos }); pos++; continue }
    if (input[pos] === '<') { tokens.push({ type: 'LT', value: '<', position: pos }); pos++; continue }

    // Parameter ($name)
    if (input[pos] === '$') {
      pos++
      let name = ''
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
        name += input[pos]
        pos++
      }
      tokens.push({ type: 'PARAMETER', value: name, position: startPos })
      continue
    }

    // String literal ('...' or "...")
    if (input[pos] === "'" || input[pos] === '"') {
      const quote = input[pos]
      pos++
      let str = ''
      while (pos < input.length && input[pos] !== quote) {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          pos++
          str += input[pos]
        } else {
          str += input[pos]
        }
        pos++
      }
      if (pos < input.length) pos++ // skip closing quote
      tokens.push({ type: 'STRING', value: str, position: startPos })
      continue
    }

    // Number
    if (/[0-9]/.test(input[pos]) || (input[pos] === '-' && pos + 1 < input.length && /[0-9]/.test(input[pos + 1]))) {
      let num = ''
      if (input[pos] === '-') { num += '-'; pos++ }
      while (pos < input.length && /[0-9.]/.test(input[pos])) {
        num += input[pos]
        pos++
      }
      tokens.push({ type: 'NUMBER', value: num, position: startPos })
      continue
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(input[pos])) {
      let word = ''
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
        word += input[pos]
        pos++
      }

      const upper = word.toUpperCase()
      if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'BOOLEAN', value: upper, position: startPos })
      } else if (KEYWORDS.has(upper)) {
        tokens.push({ type: upper as TokenType, value: upper, position: startPos })
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, position: startPos })
      }
      continue
    }

    throw new RQLParseError(`Unexpected character '${input[pos]}' at position ${pos}`, pos)
  }

  tokens.push({ type: 'EOF', value: '', position: pos })
  return tokens
}

// ============================================================
// Parser (Recursive Descent)
// ============================================================

class RQLParseError extends Error {
  constructor(message: string, public position: number) {
    super(message)
    this.name = 'RQLParseError'
  }
}

class Parser {
  private tokens: Token[]
  private pos: number = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', position: -1 }
  }

  private peek(offset: number = 0): Token {
    return this.tokens[this.pos + offset] || { type: 'EOF', value: '', position: -1 }
  }

  private advance(): Token {
    const token = this.current()
    this.pos++
    return token
  }

  private expect(type: TokenType): Token {
    const token = this.current()
    if (token.type !== type) {
      throw new RQLParseError(
        `Expected ${type} but got ${token.type} ("${token.value}") at position ${token.position}`,
        token.position
      )
    }
    return this.advance()
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.current().type)
  }

  parse(): QueryAST {
    const ast = this.parseSelect()

    if (this.current().type !== 'EOF') {
      throw new RQLParseError(
        `Unexpected token "${this.current().value}" at position ${this.current().position}`,
        this.current().position
      )
    }

    return ast
  }

  private parseSelect(): QueryAST {
    this.expect('SELECT')
    const columns = this.parseColumnList()

    // Optional FROM clause (infer entities from column refs)
    let from: EntityRef[] = []
    if (this.match('FROM')) {
      this.advance()
      from = this.parseEntityList()
    } else {
      // Infer entities from column refs
      const entities = new Set<string>()
      for (const col of columns) {
        if (col.entity) entities.add(col.entity)
      }
      from = Array.from(entities).map(name => ({ name }))
    }

    // Optional JOIN
    const joins: JoinClause[] = []
    while (this.match('JOIN', 'LEFT', 'RIGHT', 'INNER')) {
      joins.push(this.parseJoin())
    }

    // Optional WHERE
    let where: WhereClause | undefined
    if (this.match('WHERE')) {
      this.advance()
      where = this.parseWhereExpression()
    }

    // Optional GROUP BY
    let groupBy: ColumnRef[] | undefined
    if (this.match('GROUP')) {
      this.advance()
      this.expect('BY')
      groupBy = this.parseColumnList()
    }

    // Optional HAVING
    let having: WhereClause | undefined
    if (this.match('HAVING')) {
      this.advance()
      having = this.parseWhereExpression()
    }

    // Optional ORDER BY
    let orderBy: OrderByClause[] | undefined
    if (this.match('ORDER')) {
      this.advance()
      this.expect('BY')
      orderBy = this.parseOrderByList()
    }

    // Optional LIMIT
    let limit: number | undefined
    if (this.match('LIMIT')) {
      this.advance()
      const num = this.expect('NUMBER')
      limit = parseInt(num.value, 10)
    }

    // Optional OFFSET
    let offset: number | undefined
    if (this.match('OFFSET')) {
      this.advance()
      const num = this.expect('NUMBER')
      offset = parseInt(num.value, 10)
    }

    return {
      type: 'SELECT',
      columns,
      from,
      where,
      orderBy,
      groupBy,
      having,
      limit,
      offset,
      joins: joins.length > 0 ? joins : undefined,
    }
  }

  private parseColumnList(): ColumnRef[] {
    const columns: ColumnRef[] = []
    columns.push(this.parseColumnRef())

    while (this.match('COMMA')) {
      this.advance()
      columns.push(this.parseColumnRef())
    }

    return columns
  }

  private parseColumnRef(): ColumnRef {
    // Check for aggregation functions: COUNT, SUM, AVG, MIN, MAX
    if (this.match('COUNT', 'SUM', 'AVG', 'MIN', 'MAX')) {
      const aggToken = this.advance()
      const aggregation = aggToken.type as AggregationType
      this.expect('LPAREN')

      let col: ColumnRef

      if (this.match('STAR')) {
        this.advance()
        col = { entity: '*', field: '*', aggregation, expression: `${aggregation}(*)` }
      } else {
        col = this.parseSimpleColumnRef()
        col.aggregation = aggregation
        col.expression = `${aggregation}(${col.entity}.${col.field})`
      }

      this.expect('RPAREN')

      // Optional alias
      if (this.match('AS')) {
        this.advance()
        col.alias = this.expect('IDENTIFIER').value
      }

      return col
    }

    // Handle * (select all)
    if (this.match('STAR')) {
      this.advance()
      return { entity: '*', field: '*' }
    }

    const col = this.parseSimpleColumnRef()

    // Optional alias
    if (this.match('AS')) {
      this.advance()
      col.alias = this.expect('IDENTIFIER').value
    }

    return col
  }

  private parseSimpleColumnRef(): ColumnRef {
    const first = this.expect('IDENTIFIER')

    if (this.match('DOT')) {
      this.advance()
      const second = this.expect('IDENTIFIER')
      return { entity: first.value, field: second.value }
    }

    // If no dot, entity is inferred
    return { entity: '', field: first.value }
  }

  private parseEntityList(): EntityRef[] {
    const entities: EntityRef[] = []
    entities.push(this.parseEntityRef())

    while (this.match('COMMA')) {
      this.advance()
      entities.push(this.parseEntityRef())
    }

    return entities
  }

  private parseEntityRef(): EntityRef {
    const name = this.expect('IDENTIFIER').value
    let alias: string | undefined

    if (this.match('AS')) {
      this.advance()
      alias = this.expect('IDENTIFIER').value
    } else if (this.match('IDENTIFIER') && !this.match('WHERE', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT', 'RIGHT', 'INNER')) {
      // Implicit alias (e.g., "employees e")
      const next = this.peek()
      if (next.type === 'IDENTIFIER' && !KEYWORDS.has(next.value.toUpperCase())) {
        alias = this.advance().value
      }
    }

    return { name, alias }
  }

  private parseJoin(): JoinClause {
    let joinType: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER'

    if (this.match('LEFT')) {
      joinType = 'LEFT'
      this.advance()
    } else if (this.match('RIGHT')) {
      joinType = 'RIGHT'
      this.advance()
    } else if (this.match('INNER')) {
      this.advance()
    }

    this.expect('JOIN')
    const entity = this.parseEntityRef()
    this.expect('ON')
    const on = this.parseWhereExpression()

    return { entity, on, type: joinType }
  }

  private parseWhereExpression(): WhereClause {
    let left = this.parseWhereAnd()

    while (this.match('OR')) {
      this.advance()
      const right = this.parseWhereAnd()
      left = { type: 'OR', left, right }
    }

    return left
  }

  private parseWhereAnd(): WhereClause {
    let left = this.parseWhereUnary()

    while (this.match('AND')) {
      this.advance()
      const right = this.parseWhereUnary()
      left = { type: 'AND', left, right }
    }

    return left
  }

  private parseWhereUnary(): WhereClause {
    if (this.match('NOT')) {
      this.advance()
      const operand = this.parseWherePrimary()
      return { type: 'NOT', operand }
    }

    return this.parseWherePrimary()
  }

  private parseWherePrimary(): WhereClause {
    // Parenthesized expression
    if (this.match('LPAREN')) {
      this.advance()
      const expr = this.parseWhereExpression()
      this.expect('RPAREN')
      return expr
    }

    // Aggregation in HAVING clause
    if (this.match('COUNT', 'SUM', 'AVG', 'MIN', 'MAX')) {
      const aggToken = this.advance()
      const aggregation = aggToken.type as AggregationType
      this.expect('LPAREN')

      let col: ColumnRef
      if (this.match('STAR')) {
        this.advance()
        col = { entity: '*', field: '*', aggregation }
      } else {
        col = this.parseSimpleColumnRef()
        col.aggregation = aggregation
      }
      this.expect('RPAREN')

      return this.parseComparison(col)
    }

    // Column comparison
    const column = this.parseSimpleColumnRef()
    return this.parseComparison(column)
  }

  private parseComparison(column: ColumnRef): WhereClause {
    // IS NULL / IS NOT NULL
    if (this.match('IS')) {
      this.advance()
      if (this.match('NOT')) {
        this.advance()
        this.expect('NULL')
        return { type: 'COMPARISON', column, operator: 'IS NOT NULL', value: null }
      }
      this.expect('NULL')
      return { type: 'COMPARISON', column, operator: 'IS NULL', value: null }
    }

    // NOT IN
    if (this.match('NOT')) {
      this.advance()
      if (this.match('IN')) {
        this.advance()
        const values = this.parseValueList()
        return { type: 'COMPARISON', column, operator: 'NOT IN', value: values as Array<string | number> }
      }
      throw new RQLParseError(`Expected IN after NOT at position ${this.current().position}`, this.current().position)
    }

    // IN
    if (this.match('IN')) {
      this.advance()
      const values = this.parseValueList()
      return { type: 'COMPARISON', column, operator: 'IN', value: values as Array<string | number> }
    }

    // LIKE
    if (this.match('LIKE')) {
      this.advance()
      const value = this.parseLiteral()
      return { type: 'COMPARISON', column, operator: 'LIKE', value }
    }

    // BETWEEN
    if (this.match('BETWEEN')) {
      this.advance()
      const low = this.parseLiteral()
      this.expect('AND')
      const high = this.parseLiteral()
      return { type: 'COMPARISON', column, operator: 'BETWEEN', value: [low, high] as any }
    }

    // Standard comparison operators
    let operator: ComparisonOperator
    if (this.match('EQ')) { this.advance(); operator = '=' }
    else if (this.match('NEQ')) { this.advance(); operator = '!=' }
    else if (this.match('GT')) { this.advance(); operator = '>' }
    else if (this.match('GTE')) { this.advance(); operator = '>=' }
    else if (this.match('LT')) { this.advance(); operator = '<' }
    else if (this.match('LTE')) { this.advance(); operator = '<=' }
    else {
      throw new RQLParseError(
        `Expected comparison operator but got "${this.current().value}" at position ${this.current().position}`,
        this.current().position
      )
    }

    // Check for parameter
    if (this.match('PARAMETER')) {
      const param = this.advance()
      return { type: 'COMPARISON', column, operator, parameter: param.value }
    }

    const value = this.parseLiteral()
    return { type: 'COMPARISON', column, operator, value }
  }

  private parseValueList(): LiteralValue[] {
    this.expect('LPAREN')
    const values: LiteralValue[] = []
    values.push(this.parseLiteral())

    while (this.match('COMMA')) {
      this.advance()
      values.push(this.parseLiteral())
    }

    this.expect('RPAREN')
    return values
  }

  private parseLiteral(): LiteralValue {
    if (this.match('STRING')) {
      return this.advance().value
    }
    if (this.match('NUMBER')) {
      const val = this.advance().value
      return val.includes('.') ? parseFloat(val) : parseInt(val, 10)
    }
    if (this.match('BOOLEAN')) {
      return this.advance().value === 'TRUE'
    }
    if (this.match('NULL')) {
      this.advance()
      return null
    }
    if (this.match('PARAMETER')) {
      // Return as-is; will be substituted later
      return `$${this.advance().value}` as any
    }

    throw new RQLParseError(
      `Expected literal value but got "${this.current().value}" at position ${this.current().position}`,
      this.current().position
    )
  }

  private parseOrderByList(): OrderByClause[] {
    const clauses: OrderByClause[] = []
    clauses.push(this.parseOrderByItem())

    while (this.match('COMMA')) {
      this.advance()
      clauses.push(this.parseOrderByItem())
    }

    return clauses
  }

  private parseOrderByItem(): OrderByClause {
    const column = this.parseSimpleColumnRef()
    let direction: 'ASC' | 'DESC' = 'ASC'

    if (this.match('ASC')) {
      this.advance()
      direction = 'ASC'
    } else if (this.match('DESC')) {
      this.advance()
      direction = 'DESC'
    }

    return { column, direction }
  }
}

// ============================================================
// Public API
// ============================================================

export function parseQuery(queryString: string): QueryAST {
  const trimmed = queryString.trim()
  if (!trimmed) {
    throw new RQLParseError('Empty query', 0)
  }

  const tokens = tokenize(trimmed)
  const parser = new Parser(tokens)
  return parser.parse()
}

export function validateQuery(queryString: string): {
  isValid: boolean
  errors: Array<{ message: string; position: number }>
  ast?: QueryAST
} {
  try {
    const ast = parseQuery(queryString)

    const errors: Array<{ message: string; position: number }> = []

    // Validate entities exist
    for (const entity of ast.from) {
      if (!ENTITY_REGISTRY[entity.name]) {
        errors.push({
          message: `Unknown entity "${entity.name}". Available: ${Object.keys(ENTITY_REGISTRY).join(', ')}`,
          position: 0,
        })
      }
    }

    // Validate fields exist on their entities
    for (const col of ast.columns) {
      if (col.entity === '*' && col.field === '*') continue
      const entityName = col.entity || ast.from[0]?.name
      if (entityName && ENTITY_REGISTRY[entityName]) {
        const entityDef = ENTITY_REGISTRY[entityName]
        if (!entityDef.fields[col.field] && col.field !== '*') {
          errors.push({
            message: `Unknown field "${col.field}" on entity "${entityName}". Available: ${Object.keys(entityDef.fields).join(', ')}`,
            position: 0,
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, ast }

  } catch (err) {
    if (err instanceof RQLParseError) {
      return { isValid: false, errors: [{ message: err.message, position: err.position }] }
    }
    return { isValid: false, errors: [{ message: err instanceof Error ? err.message : 'Unknown parse error', position: 0 }] }
  }
}

export async function executeQuery(
  orgId: string,
  queryString: string,
  parameters?: Record<string, unknown>
): Promise<QueryResult> {
  const start = Date.now()
  const ast = parseQuery(queryString)

  // Validate
  const validation = validateQuery(queryString)
  if (!validation.isValid) {
    throw new Error(`Query validation failed: ${validation.errors.map(e => e.message).join('; ')}`)
  }

  // Determine primary entity
  const primaryEntityName = ast.from[0]?.name
  if (!primaryEntityName || !ENTITY_REGISTRY[primaryEntityName]) {
    throw new Error(`Unknown primary entity: ${primaryEntityName}`)
  }

  const primaryEntity = ENTITY_REGISTRY[primaryEntityName]
  const hasAggregation = ast.columns.some(c => c.aggregation)

  // Execute raw query by fetching all data and filtering in-memory
  // This approach works for the RQL abstraction layer
  let rows: Record<string, unknown>[] = await db
    .select()
    .from(primaryEntity.drizzleRef)
    .where(
      primaryEntity.drizzleRef.orgId
        ? eq(primaryEntity.drizzleRef.orgId, orgId)
        : undefined
    )

  // Substitute parameters in WHERE clause
  if (parameters && ast.where) {
    substituteParameters(ast.where, parameters)
  }

  // Apply WHERE filters in-memory
  if (ast.where) {
    rows = rows.filter(row => evaluateWhereClause(row, ast.where!, primaryEntityName))
  }

  // Apply GROUP BY + aggregations
  if (ast.groupBy && ast.groupBy.length > 0) {
    const groups = new Map<string, Record<string, unknown>[]>()

    for (const row of rows) {
      const keyParts = ast.groupBy.map(g => {
        const fieldName = toCamelCase(g.field)
        return String((row as any)[fieldName] ?? 'NULL')
      })
      const key = keyParts.join('|__|')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }

    const aggregatedRows: Record<string, unknown>[] = []
    for (const [_key, groupRows] of groups) {
      const resultRow: Record<string, unknown> = {}

      // Add group-by columns
      for (const g of ast.groupBy) {
        const fieldName = toCamelCase(g.field)
        resultRow[g.alias || g.field] = (groupRows[0] as any)[fieldName]
      }

      // Compute aggregations
      for (const col of ast.columns) {
        if (!col.aggregation) continue
        const alias = col.alias || col.expression || `${col.aggregation}_${col.field}`

        if (col.aggregation === 'COUNT') {
          resultRow[alias] = groupRows.length
        } else if (col.field !== '*') {
          const fieldName = toCamelCase(col.field)
          const values = groupRows.map(r => Number((r as any)[fieldName]) || 0)

          switch (col.aggregation) {
            case 'SUM':
              resultRow[alias] = values.reduce((a, b) => a + b, 0)
              break
            case 'AVG':
              resultRow[alias] = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 : 0
              break
            case 'MIN':
              resultRow[alias] = values.length > 0 ? Math.min(...values) : 0
              break
            case 'MAX':
              resultRow[alias] = values.length > 0 ? Math.max(...values) : 0
              break
          }
        }
      }

      aggregatedRows.push(resultRow)
    }

    rows = aggregatedRows

    // Apply HAVING
    if (ast.having) {
      rows = rows.filter(row => evaluateWhereClause(row, ast.having!, primaryEntityName))
    }
  } else if (hasAggregation) {
    // Aggregation without GROUP BY -> single result row
    const resultRow: Record<string, unknown> = {}

    for (const col of ast.columns) {
      if (!col.aggregation) continue
      const alias = col.alias || col.expression || `${col.aggregation}_${col.field}`

      if (col.aggregation === 'COUNT') {
        resultRow[alias] = rows.length
      } else if (col.field !== '*') {
        const fieldName = toCamelCase(col.field)
        const values = rows.map(r => Number((r as any)[fieldName]) || 0)

        switch (col.aggregation) {
          case 'SUM':
            resultRow[alias] = values.reduce((a, b) => a + b, 0)
            break
          case 'AVG':
            resultRow[alias] = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100 : 0
            break
          case 'MIN':
            resultRow[alias] = values.length > 0 ? Math.min(...values) : 0
            break
          case 'MAX':
            resultRow[alias] = values.length > 0 ? Math.max(...values) : 0
            break
        }
      }
    }

    rows = [resultRow]
  } else {
    // Project columns
    if (!(ast.columns.length === 1 && ast.columns[0].entity === '*' && ast.columns[0].field === '*')) {
      rows = rows.map(row => {
        const projected: Record<string, unknown> = {}
        for (const col of ast.columns) {
          const fieldName = toCamelCase(col.field)
          const alias = col.alias || col.field
          projected[alias] = (row as any)[fieldName]
        }
        return projected
      })
    }
  }

  // Apply ORDER BY
  if (ast.orderBy && ast.orderBy.length > 0) {
    rows.sort((a, b) => {
      for (const ob of ast.orderBy!) {
        const field = ob.column.alias || ob.column.field
        const fieldName = toCamelCase(field)
        const aVal = (a as any)[fieldName] ?? (a as any)[field]
        const bVal = (b as any)[fieldName] ?? (b as any)[field]

        let cmp = 0
        if (aVal === bVal) cmp = 0
        else if (aVal === null || aVal === undefined) cmp = 1
        else if (bVal === null || bVal === undefined) cmp = -1
        else if (typeof aVal === 'string') cmp = aVal.localeCompare(String(bVal))
        else cmp = Number(aVal) - Number(bVal)

        if (ob.direction === 'DESC') cmp = -cmp
        if (cmp !== 0) return cmp
      }
      return 0
    })
  }

  // Apply OFFSET
  if (ast.offset && ast.offset > 0) {
    rows = rows.slice(ast.offset)
  }

  // Apply LIMIT
  if (ast.limit !== undefined) {
    rows = rows.slice(0, ast.limit)
  }

  // Determine result columns
  const resultColumns = ast.columns.map(col => {
    const name = col.alias || col.expression || col.field
    const entityDef = col.entity && col.entity !== '*' ? ENTITY_REGISTRY[col.entity] : null
    const fieldDef = entityDef?.fields[col.field]

    return {
      name,
      type: col.aggregation ? 'number' : (fieldDef?.type || 'string'),
      label: col.alias || fieldDef?.label || col.field,
    }
  })

  return {
    columns: resultColumns,
    rows,
    rowCount: rows.length,
    metadata: {
      executionMs: Date.now() - start,
      query: queryString,
      parsedAt: new Date().toISOString(),
      entities: ast.from.map(e => e.name),
      hasAggregation,
    },
  }
}

export function explainQuery(queryString: string): QueryExplanation {
  const ast = parseQuery(queryString)

  const entities = ast.from.map(e => e.name)
  const columns = ast.columns.map(c => {
    if (c.aggregation) return `${c.aggregation}(${c.entity}.${c.field})`
    if (c.entity === '*') return '*'
    return `${c.entity}.${c.field}`
  })

  const filters: string[] = []
  if (ast.where) collectFilterDescriptions(ast.where, filters)

  const grouping = ast.groupBy?.map(g => `${g.entity}.${g.field}`) || []
  const ordering = ast.orderBy?.map(o => `${o.column.entity}.${o.column.field} ${o.direction}`) || []
  const aggregations = ast.columns.filter(c => c.aggregation).map(c => `${c.aggregation}(${c.entity}.${c.field})`)

  // Estimate complexity
  let complexity: 'low' | 'medium' | 'high' = 'low'
  if (ast.joins && ast.joins.length > 0) complexity = 'medium'
  if (ast.groupBy && ast.groupBy.length > 0) complexity = 'medium'
  if (entities.length > 2 || (ast.joins && ast.joins.length > 1)) complexity = 'high'

  const parts = [`Query selects ${columns.length} column(s) from ${entities.join(', ')}`]
  if (filters.length > 0) parts.push(`with ${filters.length} filter condition(s)`)
  if (grouping.length > 0) parts.push(`grouped by ${grouping.join(', ')}`)
  if (ordering.length > 0) parts.push(`ordered by ${ordering.join(', ')}`)
  if (ast.limit) parts.push(`limited to ${ast.limit} rows`)

  return {
    summary: parts.join(', ') + '.',
    entities,
    columns,
    filters,
    grouping,
    ordering,
    aggregations,
    estimatedComplexity: complexity,
  }
}

export function getSuggestions(partialQuery: string, cursorPosition: number): QuerySuggestion[] {
  const suggestions: QuerySuggestion[] = []
  const textBeforeCursor = partialQuery.substring(0, cursorPosition).trim()
  const lastWord = textBeforeCursor.split(/\s+/).pop()?.toUpperCase() || ''

  // If empty or just starting, suggest SELECT
  if (!textBeforeCursor || textBeforeCursor.length === 0) {
    suggestions.push({ text: 'SELECT', type: 'keyword', description: 'Start a query with SELECT' })
    return suggestions
  }

  // After SELECT, suggest entity.field combos
  if (lastWord === 'SELECT' || textBeforeCursor.endsWith(',')) {
    for (const [entityName, entityDef] of Object.entries(ENTITY_REGISTRY)) {
      for (const [fieldName, fieldDef] of Object.entries(entityDef.fields)) {
        suggestions.push({
          text: `${entityName}.${fieldName}`,
          type: 'field',
          description: fieldDef.label,
        })
      }
    }
    // Suggest aggregation functions
    for (const fn of ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']) {
      suggestions.push({ text: fn + '(', type: 'function', description: `${fn} aggregation` })
    }
    suggestions.push({ text: '*', type: 'field', description: 'All columns' })
    return suggestions
  }

  // After a dot, suggest fields for that entity
  if (textBeforeCursor.endsWith('.')) {
    const parts = textBeforeCursor.split(/\s+/)
    const entityPart = parts[parts.length - 1].replace('.', '')
    const entityDef = ENTITY_REGISTRY[entityPart]
    if (entityDef) {
      for (const [fieldName, fieldDef] of Object.entries(entityDef.fields)) {
        suggestions.push({ text: fieldName, type: 'field', description: fieldDef.label })
      }
    }
    return suggestions
  }

  // After FROM, suggest entities
  if (lastWord === 'FROM' || lastWord === 'JOIN') {
    for (const entityName of Object.keys(ENTITY_REGISTRY)) {
      suggestions.push({ text: entityName, type: 'entity', description: `Query ${entityName} data` })
    }
    return suggestions
  }

  // After WHERE or AND/OR, suggest entity.field for filtering
  if (lastWord === 'WHERE' || lastWord === 'AND' || lastWord === 'OR') {
    for (const [entityName, entityDef] of Object.entries(ENTITY_REGISTRY)) {
      for (const [fieldName, fieldDef] of Object.entries(entityDef.fields)) {
        if (fieldDef.filterable) {
          suggestions.push({ text: `${entityName}.${fieldName}`, type: 'field', description: fieldDef.label })
        }
      }
    }
    return suggestions
  }

  // After ORDER BY, suggest sortable fields
  if (lastWord === 'BY' && textBeforeCursor.includes('ORDER')) {
    for (const [entityName, entityDef] of Object.entries(ENTITY_REGISTRY)) {
      for (const [fieldName, fieldDef] of Object.entries(entityDef.fields)) {
        if (fieldDef.sortable) {
          suggestions.push({ text: `${entityName}.${fieldName}`, type: 'field', description: fieldDef.label })
        }
      }
    }
    return suggestions
  }

  // Suggest next keyword based on context
  const keywords = ['WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'AND', 'OR', 'ASC', 'DESC', 'JOIN']
  for (const kw of keywords) {
    if (!textBeforeCursor.toUpperCase().includes(kw) || kw === 'AND' || kw === 'OR') {
      suggestions.push({ text: kw, type: 'keyword' })
    }
  }

  // Suggest comparison operators
  for (const op of ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL', 'BETWEEN']) {
    suggestions.push({ text: op, type: 'operator' })
  }

  return suggestions
}

export function autocomplete(partialQuery: string, cursorPosition: number): QuerySuggestion[] {
  return getSuggestions(partialQuery, cursorPosition).slice(0, 15)
}

// ============================================================
// Saved Queries
// ============================================================

export async function saveQuery(orgId: string, createdBy: string, input: SavedQueryInput) {
  // Validate the query first
  const validation = validateQuery(input.query)
  if (!validation.isValid) {
    throw new Error(`Cannot save invalid query: ${validation.errors.map(e => e.message).join('; ')}`)
  }

  const [saved] = await db
    .insert(schema.savedQueries)
    .values({
      orgId,
      name: input.name,
      description: input.description || null,
      query: input.query,
      parsedAst: validation.ast as any,
      parameters: input.parameters || null,
      tags: input.tags || null,
      isPublic: input.isPublic || false,
      createdBy,
      runCount: 0,
    })
    .returning()

  return saved
}

export async function deleteQuery(orgId: string, queryId: string) {
  const [deleted] = await db
    .delete(schema.savedQueries)
    .where(and(eq(schema.savedQueries.id, queryId), eq(schema.savedQueries.orgId, orgId)))
    .returning()

  if (!deleted) {
    throw new Error(`Query "${queryId}" not found`)
  }

  return { deleted: true, queryId }
}

export async function scheduleQuery(orgId: string, input: ScheduleInput) {
  // Validate the query exists
  const [query] = await db
    .select()
    .from(schema.savedQueries)
    .where(and(eq(schema.savedQueries.id, input.queryId), eq(schema.savedQueries.orgId, orgId)))
    .limit(1)

  if (!query) {
    throw new Error(`Query "${input.queryId}" not found`)
  }

  // Calculate next run time
  const nextRun = calculateNextRun(input.frequency)

  const [schedule] = await db
    .insert(schema.querySchedules)
    .values({
      orgId,
      queryId: input.queryId,
      frequency: input.frequency,
      recipients: input.recipients as any,
      format: input.format,
      nextRunAt: nextRun,
      isActive: true,
    })
    .returning()

  return schedule
}

export async function unscheduleQuery(orgId: string, scheduleId: string) {
  const [updated] = await db
    .update(schema.querySchedules)
    .set({ isActive: false })
    .where(and(eq(schema.querySchedules.id, scheduleId), eq(schema.querySchedules.orgId, orgId)))
    .returning()

  if (!updated) {
    throw new Error(`Schedule "${scheduleId}" not found`)
  }

  return updated
}

export async function getQueryHistory(orgId: string, options?: { limit?: number; createdBy?: string }) {
  let q = db
    .select()
    .from(schema.savedQueries)
    .where(eq(schema.savedQueries.orgId, orgId))
    .orderBy(desc(schema.savedQueries.updatedAt))
    .limit(options?.limit || 50)

  const results = await q

  return results.map(r => ({
    ...r,
    parameters: r.parameters as any,
    tags: r.tags as any,
  }))
}

export async function shareQuery(orgId: string, queryId: string, isPublic: boolean) {
  const [updated] = await db
    .update(schema.savedQueries)
    .set({ isPublic, updatedAt: new Date() })
    .where(and(eq(schema.savedQueries.id, queryId), eq(schema.savedQueries.orgId, orgId)))
    .returning()

  if (!updated) {
    throw new Error(`Query "${queryId}" not found`)
  }

  return updated
}

export function exportResults(result: QueryResult, format: 'csv' | 'json' | 'xlsx' | 'pdf'): {
  content: string
  contentType: string
  filename: string
} {
  const timestamp = new Date().toISOString().split('T')[0]

  switch (format) {
    case 'csv': {
      const header = result.columns.map(c => c.label).join(',')
      const rows = result.rows.map(row =>
        result.columns.map(c => {
          const val = row[c.name]
          if (val === null || val === undefined) return ''
          const str = String(val)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',')
      )
      return {
        content: [header, ...rows].join('\n'),
        contentType: 'text/csv',
        filename: `query-results-${timestamp}.csv`,
      }
    }

    case 'json': {
      return {
        content: JSON.stringify({ columns: result.columns, rows: result.rows, metadata: result.metadata }, null, 2),
        contentType: 'application/json',
        filename: `query-results-${timestamp}.json`,
      }
    }

    case 'xlsx': {
      // Return a simplified representation for XLSX
      const header = result.columns.map(c => c.label)
      const data = result.rows.map(row => result.columns.map(c => row[c.name]))
      return {
        content: JSON.stringify({ sheets: [{ name: 'Results', header, data }] }),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `query-results-${timestamp}.xlsx`,
      }
    }

    case 'pdf': {
      // Return structured data for PDF generation
      return {
        content: JSON.stringify({
          title: 'Query Results',
          generatedAt: new Date().toISOString(),
          columns: result.columns,
          rows: result.rows,
          rowCount: result.rowCount,
        }),
        contentType: 'application/pdf',
        filename: `query-results-${timestamp}.pdf`,
      }
    }
  }
}

// ============================================================
// Entity & Schema Discovery
// ============================================================

export function getAvailableEntities() {
  return Object.entries(ENTITY_REGISTRY).map(([name, def]) => ({
    name,
    table: def.table,
    fieldCount: Object.keys(def.fields).length,
    fields: Object.entries(def.fields).map(([fieldName, fieldDef]) => ({
      name: fieldName,
      ...fieldDef,
    })),
    relations: def.relations ? Object.entries(def.relations).map(([relName, relDef]) => ({
      name: relName,
      ...relDef,
    })) : [],
  }))
}

export function getEntitySchema(entityName: string) {
  const entity = ENTITY_REGISTRY[entityName]
  if (!entity) {
    throw new Error(`Unknown entity "${entityName}". Available: ${Object.keys(ENTITY_REGISTRY).join(', ')}`)
  }

  return {
    name: entityName,
    table: entity.table,
    fields: Object.entries(entity.fields).map(([name, def]) => ({ name, ...def })),
    relations: entity.relations ? Object.entries(entity.relations).map(([name, def]) => ({ name, ...def })) : [],
    sampleQueries: generateSampleQueries(entityName),
  }
}

export function formatResults(result: QueryResult, format: 'table' | 'markdown' | 'html'): string {
  switch (format) {
    case 'table': {
      const colWidths = result.columns.map(c => {
        const headerLen = c.label.length
        const maxDataLen = result.rows.reduce((max, row) => {
          const val = String(row[c.name] ?? '')
          return Math.max(max, val.length)
        }, 0)
        return Math.max(headerLen, maxDataLen, 4)
      })

      const header = result.columns.map((c, i) => c.label.padEnd(colWidths[i])).join(' | ')
      const separator = colWidths.map(w => '-'.repeat(w)).join('-+-')
      const rows = result.rows.map(row =>
        result.columns.map((c, i) => String(row[c.name] ?? '').padEnd(colWidths[i])).join(' | ')
      )

      return [header, separator, ...rows].join('\n')
    }

    case 'markdown': {
      const header = '| ' + result.columns.map(c => c.label).join(' | ') + ' |'
      const separator = '| ' + result.columns.map(() => '---').join(' | ') + ' |'
      const rows = result.rows.map(row =>
        '| ' + result.columns.map(c => String(row[c.name] ?? '')).join(' | ') + ' |'
      )
      return [header, separator, ...rows].join('\n')
    }

    case 'html': {
      const headerCells = result.columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')
      const rows = result.rows.map(row =>
        '<tr>' + result.columns.map(c => `<td>${escapeHtml(String(row[c.name] ?? ''))}</td>`).join('') + '</tr>'
      )
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows.join('')}</tbody></table>`
    }
  }
}

export function getQueryAnalytics(orgId: string): {
  totalQueries: number
  topEntities: Array<{ entity: string; queryCount: number }>
  avgExecutionMs: number
} {
  // Return analytics summary (in production, this would query audit logs)
  return {
    totalQueries: 0,
    topEntities: Object.keys(ENTITY_REGISTRY).map(e => ({ entity: e, queryCount: 0 })),
    avgExecutionMs: 0,
  }
}

export function createVisualization(result: QueryResult, type: QueryVisualization['type']): QueryVisualization {
  const columns = result.columns
  const numericCols = columns.filter(c => c.type === 'number')
  const stringCols = columns.filter(c => c.type !== 'number')

  const config: QueryVisualization['config'] = {
    title: 'Query Results',
  }

  if (stringCols.length > 0) config.xAxis = stringCols[0].name
  if (numericCols.length > 0) config.yAxis = numericCols[0].name
  if (stringCols.length > 1) config.groupBy = stringCols[1].name

  return { type, config }
}

// ============================================================
// Internal Helpers
// ============================================================

function toCamelCase(snakeCase: string): string {
  return FIELD_NAME_MAP[snakeCase] || snakeCase
}

function evaluateWhereClause(row: Record<string, unknown>, clause: WhereClause, primaryEntity: string): boolean {
  switch (clause.type) {
    case 'AND':
      return evaluateWhereClause(row, clause.left!, primaryEntity) && evaluateWhereClause(row, clause.right!, primaryEntity)
    case 'OR':
      return evaluateWhereClause(row, clause.left!, primaryEntity) || evaluateWhereClause(row, clause.right!, primaryEntity)
    case 'NOT':
      return !evaluateWhereClause(row, clause.operand!, primaryEntity)
    case 'COMPARISON': {
      if (!clause.column) return true
      const fieldName = toCamelCase(clause.column.field)
      const rowValue = (row as any)[fieldName]
      const compareValue = clause.value

      switch (clause.operator) {
        case '=': return String(rowValue) === String(compareValue)
        case '!=':
        case '<>': return String(rowValue) !== String(compareValue)
        case '>': return Number(rowValue) > Number(compareValue)
        case '>=': return Number(rowValue) >= Number(compareValue)
        case '<': return Number(rowValue) < Number(compareValue)
        case '<=': return Number(rowValue) <= Number(compareValue)
        case 'LIKE': {
          const pattern = String(compareValue).replace(/%/g, '.*').replace(/_/g, '.')
          return new RegExp(`^${pattern}$`, 'i').test(String(rowValue ?? ''))
        }
        case 'IN': {
          if (Array.isArray(compareValue)) {
            return compareValue.some(v => String(v) === String(rowValue))
          }
          return false
        }
        case 'NOT IN': {
          if (Array.isArray(compareValue)) {
            return !compareValue.some(v => String(v) === String(rowValue))
          }
          return true
        }
        case 'IS NULL': return rowValue === null || rowValue === undefined
        case 'IS NOT NULL': return rowValue !== null && rowValue !== undefined
        case 'BETWEEN': {
          if (Array.isArray(compareValue) && compareValue.length === 2) {
            const val = Number(rowValue)
            return val >= Number(compareValue[0]) && val <= Number(compareValue[1])
          }
          return false
        }
        default: return true
      }
    }
    default:
      return true
  }
}

function substituteParameters(clause: WhereClause, params: Record<string, unknown>) {
  if (clause.type === 'COMPARISON' && clause.parameter) {
    const paramValue = params[clause.parameter]
    if (paramValue !== undefined) {
      clause.value = paramValue as LiteralValue
      delete clause.parameter
    }
  }
  if (clause.left) substituteParameters(clause.left, params)
  if (clause.right) substituteParameters(clause.right, params)
  if (clause.operand) substituteParameters(clause.operand, params)
}

function collectFilterDescriptions(clause: WhereClause, filters: string[]) {
  if (clause.type === 'COMPARISON' && clause.column) {
    const col = clause.column.entity ? `${clause.column.entity}.${clause.column.field}` : clause.column.field
    const val = clause.parameter ? `$${clause.parameter}` : JSON.stringify(clause.value)
    filters.push(`${col} ${clause.operator} ${val}`)
  }
  if (clause.left) collectFilterDescriptions(clause.left, filters)
  if (clause.right) collectFilterDescriptions(clause.right, filters)
  if (clause.operand) collectFilterDescriptions(clause.operand, filters)
}

function calculateNextRun(frequency: string): Date {
  const now = new Date()
  switch (frequency) {
    case 'hourly': return new Date(now.getTime() + 60 * 60 * 1000)
    case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'monthly': return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    default: return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}

function generateSampleQueries(entityName: string): string[] {
  const entity = ENTITY_REGISTRY[entityName]
  if (!entity) return []

  const fields = Object.keys(entity.fields)
  const firstField = fields[1] || fields[0] // Skip id
  const statusField = fields.find(f => f === 'status' || f === 'is_active')

  const queries = [
    `SELECT ${entityName}.* FROM ${entityName} LIMIT 10`,
    `SELECT ${entityName}.${firstField} FROM ${entityName} ORDER BY ${entityName}.created_at DESC LIMIT 20`,
    `SELECT COUNT(*) AS total FROM ${entityName}`,
  ]

  if (statusField) {
    queries.push(`SELECT ${entityName}.${statusField}, COUNT(*) AS count FROM ${entityName} GROUP BY ${entityName}.${statusField}`)
  }

  return queries
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
