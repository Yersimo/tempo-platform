'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAI } from '@/lib/use-ai'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import {
  Pencil, ArrowLeft, Mail, Phone, MapPin, Building2, Briefcase,
  Plus, Star, Trash2, Save, X, Link as LinkIcon, Hash, Calendar,
  ToggleLeft, List, Users, Heart, Check, Landmark, Smartphone,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIInsightPanel, AIScoreBadge, AIEnhancingIndicator } from '@/components/ai'
import { generateEmployeeInsight, calculateRetentionRisk, suggestCareerPath } from '@/lib/ai-engine'
import Link from 'next/link'

const FIELD_TYPE_ICONS: Record<string, typeof Hash> = {
  text: Hash, number: Hash, date: Calendar, boolean: ToggleLeft,
  select: List, multi_select: List, url: LinkIcon, email: Mail, phone: Phone,
}

export default function EmployeeDetailPage() {
  const t = useTranslations('peopleDetail')
  const tp = useTranslations('people')
  const tc = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const {
    employees, departments, goals, reviews, enrollments, courses,
    leaveRequests, devices, expenseReports, feedback, mentoringPairs,
    salaryReviews, compBands,
    currentEmployeeId, currentUser,
    updateEmployee, getDepartmentName, getEmployeeName,
    customFieldDefinitions, customFieldValues,
    addCustomFieldValue, updateCustomFieldValue,
    emergencyContacts,
    addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  const emp = employees.find(e => e.id === id)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone: '', job_title: '', level: '',
    department_id: '', country: '', role: '',
  })

  // Emergency Contact State
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '', relationship: 'spouse' as string, phone: '', email: '', address: '', is_primary: false,
  })

  // Custom Field editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldValue, setEditFieldValue] = useState('')

  // Banking Details state
  const [showBankingModal, setShowBankingModal] = useState(false)
  const [bankingForm, setBankingForm] = useState({
    bank_name: '', bank_code: '', bank_account_number: '', bank_account_name: '',
    bank_country: '', mobile_money_provider: '', mobile_money_number: '',
  })

  // Self-service profile edit state (for employees editing their own profile)
  const [showSelfEditModal, setShowSelfEditModal] = useState(false)
  const [selfEditForm, setSelfEditForm] = useState({
    phone: '', personal_email: '', address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  })

  if (pageLoading) {
    return (
      <div className="p-6"><PageSkeleton /></div>
    )
  }

  if (!emp) {
    return (
      <div className="text-center py-20">
        <p className="text-t3 mb-4">{t('employeeNotFound')}</p>
        <Link href="/people"><Button variant="secondary">{t('backToPeople')}</Button></Link>
      </div>
    )
  }

  const empGoals = goals.filter(g => g.employee_id === id)
  const empReviews = reviews.filter(r => r.employee_id === id)
  const empEnrollments = enrollments.filter(e => e.employee_id === id)
  const empLeave = leaveRequests.filter(lr => lr.employee_id === id)
  const empDevices = devices.filter(d => d.assigned_to === id)
  const empExpenses = expenseReports.filter(e => e.employee_id === id)
  const empFeedback = feedback.filter(f => f.to_id === id)
  const empContacts = emergencyContacts.filter(c => c.employee_id === id)
  const empFieldDefs = customFieldDefinitions.filter(d => d.entity_type === 'employee')
  const empFieldValues = customFieldValues.filter(v => v.entity_id === id)

  // Group custom fields by groupName
  const fieldGroups = useMemo(() => {
    const groups: Record<string, typeof empFieldDefs> = {}
    empFieldDefs.forEach(def => {
      const group = def.group_name || 'Other'
      if (!groups[group]) groups[group] = []
      groups[group].push(def)
    })
    // Sort within each group by order_index
    Object.values(groups).forEach(g => g.sort((a, b) => a.order_index - b.order_index))
    return groups
  }, [empFieldDefs])

  // AI-powered employee insights
  const employeeInsight = useMemo(() => emp ? generateEmployeeInsight(emp, { reviews: empReviews, goals: empGoals, enrollments: empEnrollments, leaveRequests: empLeave, mentoringPairs, devices: empDevices, expenseReports: empExpenses, salaryReviews, compBands }) : null, [emp, empGoals, empReviews, empEnrollments, empLeave, empDevices, empExpenses])
  const retentionRisk = useMemo(() => emp ? calculateRetentionRisk(emp, { reviews: empReviews, goals: empGoals, leaveRequests: empLeave, mentoringPairs: mentoringPairs || [], engagementScores: [], salaryReviews: salaryReviews || [] }) : null, [emp, empReviews, empGoals, empLeave, mentoringPairs, salaryReviews])
  const careerRecs = useMemo(() => emp ? suggestCareerPath(emp, employees) : null, [emp, employees])

  // Claude AI enhancement - employee insight narrative
  const { result: rawEnhancedInsight, isLoading: insightLoading } = useAI({
    action: 'enhanceNarrative',
    data: { insight: employeeInsight, employee: emp ? { name: emp.profile?.full_name, title: emp.job_title, level: emp.level } : null },
    fallback: employeeInsight,
    enabled: !!employeeInsight,
    cacheKey: `people-insight-${id}`,
  })
  // Defensive: ensure narrative has correct shape (AI might return unexpected format)
  const enhancedInsight = rawEnhancedInsight && typeof rawEnhancedInsight === 'object' && 'summary' in rawEnhancedInsight
    ? { ...rawEnhancedInsight, summary: String((rawEnhancedInsight as any).summary ?? ''), bulletPoints: Array.isArray((rawEnhancedInsight as any).bulletPoints) ? (rawEnhancedInsight as any).bulletPoints.map((p: any) => typeof p === 'string' ? p : String(p ?? '')) : [] }
    : rawEnhancedInsight

  // Claude AI enhancement - career path suggestions
  const { result: rawEnhancedCareer, isLoading: careerLoading } = useAI({
    action: 'enhanceCareerPath',
    data: { employee: emp ? { name: emp.profile?.full_name, title: emp.job_title, level: emp.level } : null, currentSuggestions: careerRecs },
    fallback: careerRecs,
    enabled: !!careerRecs && careerRecs.length > 0,
    cacheKey: `people-career-${id}`,
  })
  // Defensive: ensure career recs have string titles
  const enhancedCareer = Array.isArray(rawEnhancedCareer)
    ? rawEnhancedCareer.map((rec: any) => ({ ...rec, title: typeof rec.title === 'string' ? rec.title : String(rec.title ?? '') }))
    : rawEnhancedCareer

  const tabs = [
    { id: 'overview', label: t('tabOverview') },
    { id: 'custom_fields', label: 'Custom Fields' },
    { id: 'emergency', label: 'Emergency', count: empContacts.length },
    { id: 'banking', label: 'Banking' },
    { id: 'performance', label: t('tabPerformance'), count: empGoals.length },
    { id: 'learning', label: t('tabLearning'), count: empEnrollments.length },
    { id: 'time', label: t('tabTimeOff'), count: empLeave.length },
    { id: 'devices', label: t('tabDevices'), count: empDevices.length },
    { id: 'expenses', label: t('tabExpenses'), count: empExpenses.length },
  ]

  function openEdit() {
    if (!emp) return
    setEditForm({
      full_name: emp.profile?.full_name || '',
      email: emp.profile?.email || '',
      phone: emp.profile?.phone || '',
      job_title: emp.job_title,
      level: emp.level,
      department_id: emp.department_id,
      country: emp.country,
      role: emp.role,
    })
    setShowEditModal(true)
  }

  function submitEdit() {
    if (!emp) return
    updateEmployee(id, {
      job_title: editForm.job_title,
      level: editForm.level,
      department_id: editForm.department_id,
      country: editForm.country,
      role: editForm.role,
      profile: { ...emp.profile, full_name: editForm.full_name, email: editForm.email, phone: editForm.phone },
    })
    setShowEditModal(false)
  }

  // Custom field helpers
  function getFieldValue(defId: string) {
    return empFieldValues.find(v => v.field_definition_id === defId)
  }

  function saveFieldValue(defId: string, value: string) {
    const existing = getFieldValue(defId)
    if (existing) {
      updateCustomFieldValue(existing.id, { value })
    } else {
      addCustomFieldValue({ field_definition_id: defId, entity_id: id, value })
    }
    setEditingField(null)
    setEditFieldValue('')
  }

  function startEditField(defId: string) {
    const existing = getFieldValue(defId)
    setEditingField(defId)
    setEditFieldValue(existing?.value || '')
  }

  // Emergency contact helpers
  function openAddContact() {
    setEditingContact(null)
    setContactForm({ name: '', relationship: 'spouse', phone: '', email: '', address: '', is_primary: false })
    setShowContactModal(true)
  }

  function openEditContact(contact: typeof empContacts[0]) {
    setEditingContact(contact.id)
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email || '',
      address: contact.address || '',
      is_primary: contact.is_primary,
    })
    setShowContactModal(true)
  }

  function submitContact() {
    if (editingContact) {
      updateEmergencyContact(editingContact, { ...contactForm, employee_id: id })
    } else {
      addEmergencyContact({ ...contactForm, employee_id: id })
    }
    setShowContactModal(false)
  }

  // Banking details helpers
  function openEditBanking() {
    if (!emp) return
    const e = emp as any
    setBankingForm({
      bank_name: e.bank_name || '',
      bank_code: e.bank_code || '',
      bank_account_number: e.bank_account_number || '',
      bank_account_name: e.bank_account_name || '',
      bank_country: e.bank_country || emp.country || '',
      mobile_money_provider: e.mobile_money_provider || '',
      mobile_money_number: e.mobile_money_number || '',
    })
    setShowBankingModal(true)
  }

  function submitBanking() {
    if (!emp) return
    updateEmployee(id, {
      bank_name: bankingForm.bank_name,
      bank_code: bankingForm.bank_code,
      bank_account_number: bankingForm.bank_account_number,
      bank_account_name: bankingForm.bank_account_name,
      bank_country: bankingForm.bank_country,
      mobile_money_provider: bankingForm.mobile_money_provider,
      mobile_money_number: bankingForm.mobile_money_number,
    })
    setShowBankingModal(false)
  }

  const empAny = emp as any
  const hasBankingDetails = emp && (empAny?.bank_account_number || empAny?.mobile_money_number)

  // Self-service profile edit: employees can edit their own limited fields
  const isOwnProfile = id === currentEmployeeId
  const userRole = currentUser?.role || 'employee'
  const isPrivilegedRole = userRole === 'admin' || userRole === 'owner' || userRole === 'hrbp' || userRole === 'manager'

  function openSelfEdit() {
    if (!emp) return
    const primaryContact = empContacts.find(c => c.is_primary) || empContacts[0]
    setSelfEditForm({
      phone: emp.profile?.phone || '',
      personal_email: (emp as any).personal_email || '',
      address: (emp as any).address || emp.country || '',
      emergency_contact_name: primaryContact?.name || '',
      emergency_contact_phone: primaryContact?.phone || '',
    })
    setShowSelfEditModal(true)
  }

  function submitSelfEdit() {
    if (!emp) return
    updateEmployee(id, {
      profile: { ...emp.profile, phone: selfEditForm.phone },
      personal_email: selfEditForm.personal_email,
      address: selfEditForm.address,
    })
    // Update or create primary emergency contact
    if (selfEditForm.emergency_contact_name && selfEditForm.emergency_contact_phone) {
      const primaryContact = empContacts.find(c => c.is_primary) || empContacts[0]
      if (primaryContact) {
        updateEmergencyContact(primaryContact.id, {
          name: selfEditForm.emergency_contact_name,
          phone: selfEditForm.emergency_contact_phone,
          employee_id: id,
          is_primary: true,
          relationship: primaryContact.relationship,
        })
      } else {
        addEmergencyContact({
          name: selfEditForm.emergency_contact_name,
          phone: selfEditForm.emergency_contact_phone,
          employee_id: id,
          is_primary: true,
          relationship: 'other',
        })
      }
    }
    setShowSelfEditModal(false)
  }

  // Render field input based on type
  function renderFieldInput(def: typeof empFieldDefs[0]) {
    const fieldType = def.field_type
    if (fieldType === 'select' && def.options) {
      return (
        <select
          value={editFieldValue}
          onChange={(e) => setEditFieldValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-t1 focus:outline-none focus:ring-1 focus:ring-tempo-500"
        >
          <option value="">Select...</option>
          {(def.options as any[]).map(opt => {
            const text = typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt))
            return <option key={text} value={text}>{text}</option>
          })}
        </select>
      )
    }
    if (fieldType === 'multi_select' && def.options) {
      const selected = editFieldValue ? editFieldValue.split(',').map(s => s.trim()) : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {(def.options as any[]).map(opt => {
            const text = typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt))
            return (
            <button
              key={text}
              onClick={() => {
                const next = selected.includes(text)
                  ? selected.filter(s => s !== text)
                  : [...selected, text]
                setEditFieldValue(next.join(', '))
              }}
              className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                selected.includes(text)
                  ? 'bg-tempo-500/20 border-tempo-500 text-tempo-400'
                  : 'border-white/10 text-t3 hover:border-white/20'
              }`}
            >
              {text}
            </button>
            )
          })}
        </div>
      )
    }
    if (fieldType === 'boolean') {
      return (
        <button
          onClick={() => setEditFieldValue(editFieldValue === 'true' ? 'false' : 'true')}
          className={`relative w-10 h-5 rounded-full transition-colors ${editFieldValue === 'true' ? 'bg-tempo-500' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editFieldValue === 'true' ? 'translate-x-5' : ''}`} />
        </button>
      )
    }
    if (fieldType === 'date') {
      return (
        <input
          type="date"
          value={editFieldValue}
          onChange={(e) => setEditFieldValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-t1 focus:outline-none focus:ring-1 focus:ring-tempo-500"
        />
      )
    }
    if (fieldType === 'number') {
      return (
        <input
          type="number"
          value={editFieldValue}
          onChange={(e) => setEditFieldValue(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-t1 focus:outline-none focus:ring-1 focus:ring-tempo-500"
          placeholder={`Enter ${def.name.toLowerCase()}...`}
        />
      )
    }
    return (
      <input
        type={fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : fieldType === 'phone' ? 'tel' : 'text'}
        value={editFieldValue}
        onChange={(e) => setEditFieldValue(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-t1 focus:outline-none focus:ring-1 focus:ring-tempo-500"
        placeholder={`Enter ${def.name.toLowerCase()}...`}
      />
    )
  }

  // Display a field value
  function renderFieldDisplay(def: typeof empFieldDefs[0], value: string | null | undefined) {
    if (!value) return <span className="text-t3 italic text-xs">Not set</span>
    if (def.field_type === 'boolean') return <Badge variant={value === 'true' ? 'success' : 'default'}>{value === 'true' ? 'Yes' : 'No'}</Badge>
    if (def.field_type === 'url') return <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-tempo-400 hover:underline truncate max-w-[200px] block">{value}</a>
    if (def.field_type === 'multi_select') {
      const items = value.split(',').map(s => s.trim()).filter(Boolean)
      return <div className="flex flex-wrap gap-1">{items.map(item => <Badge key={item} variant="default">{item}</Badge>)}</div>
    }
    return <span className="text-xs text-t1">{value}</span>
  }

  return (
    <>
      {/* Back + Header */}
      <div className="mb-4">
        <button onClick={() => router.push('/people')} className="flex items-center gap-1 text-xs text-t3 hover:text-t1 transition-colors">
          <ArrowLeft size={14} /> {t('backToPeople')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Profile Card */}
        <Card className="md:w-80 flex-shrink-0">
          <div className="flex flex-col items-center text-center">
            <Avatar name={emp.profile?.full_name || ''} size="lg" />
            <h2 className="text-lg font-semibold text-t1 mt-3">{String(emp.profile?.full_name ?? '')}</h2>
            <p className="text-sm text-t2">{String(emp.job_title ?? '')}</p>
            <Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'} className="mt-2">{String(emp.role ?? '')}</Badge>
            {isPrivilegedRole && (
              <Button size="sm" variant="secondary" className="mt-4" onClick={openEdit}><Pencil size={14} /> {t('editProfile')}</Button>
            )}
            {isOwnProfile && !isPrivilegedRole && (
              <Button size="sm" variant="secondary" className="mt-4" onClick={openSelfEdit}><Pencil size={14} /> Edit My Profile</Button>
            )}
          </div>
          <div className="mt-6 space-y-3 border-t border-divider pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-t3" />
              <span className="text-t2">{String(emp.profile?.email ?? '')}</span>
            </div>
            {emp.profile?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-t3" />
                <span className="text-t2">{String(emp.profile.phone)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={14} className="text-t3" />
              <span className="text-t2">{String(emp.country ?? '')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={14} className="text-t3" />
              <span className="text-t2">{String(getDepartmentName(emp.department_id) ?? '')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase size={14} className="text-t3" />
              <span className="text-t2">{String(emp.level ?? '')}</span>
            </div>
          </div>

          {/* Quick Emergency Contact */}
          {empContacts.filter(c => c.is_primary).length > 0 && (
            <div className="mt-4 border-t border-divider pt-4">
              <h4 className="text-xs font-semibold text-t3 uppercase mb-2">Emergency Contact</h4>
              {empContacts.filter(c => c.is_primary).map(c => (
                <div key={c.id} className="space-y-1">
                  <p className="text-xs font-medium text-t1">{String(c.name ?? '')}</p>
                  <p className="text-[0.65rem] text-t3">{String(c.relationship ?? '')}</p>
                  <div className="flex items-center gap-1.5">
                    <Phone size={10} className="text-t3" />
                    <span className="text-xs text-t2">{c.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-4" />

          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* AI Employee Insights */}
              {enhancedInsight && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative md:col-span-2">
                    {insightLoading && <AIEnhancingIndicator isLoading />}
                    <AIInsightPanel title={t('employeeInsight')} narrative={enhancedInsight} />
                  </div>
                  <div className="space-y-4">
                    {retentionRisk && (
                      <Card>
                        <h3 className="text-sm font-semibold text-t1 mb-2">{t('retentionRisk')}</h3>
                        <AIScoreBadge score={retentionRisk} size="md" showBreakdown />
                      </Card>
                    )}
                    {enhancedCareer && enhancedCareer.length > 0 && (
                      <Card>
                        <div className="relative">
                          {careerLoading && <AIEnhancingIndicator isLoading />}
                          <h3 className="text-sm font-semibold text-t1 mb-2">{t('careerPathSuggestions')}</h3>
                          <ul className="space-y-1">
                            {enhancedCareer.map((rec: any, i: number) => (
                              <li key={i} className="text-xs text-t2">- {rec.title}</li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('goals')}</h3>
                {empGoals.length > 0 ? empGoals.map(g => (
                  <div key={g.id} className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-t1">{String(g.title ?? '')}</p>
                      <Progress value={g.progress} showLabel className="mt-1" />
                    </div>
                    <Badge variant={g.status === 'on_track' ? 'success' : g.status === 'at_risk' ? 'warning' : 'error'} />
                  </div>
                )) : <p className="text-xs text-t3">{t('noGoalsAssigned')}</p>}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('reviews')}</h3>
                {empReviews.length > 0 ? empReviews.map(r => (
                  <div key={r.id} className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-t1">{t('reviewType', { type: String(r.type ?? '') })}</p>
                      <p className="text-[0.65rem] text-t3">{t('reviewBy', { name: String(getEmployeeName(r.reviewer_id) ?? '') })}</p>
                    </div>
                    <div className="text-right">
                      {r.overall_rating && <span className="tempo-stat text-tempo-600">{t('ratingOutOf', { rating: String(r.overall_rating) })}</span>}
                      <Badge variant={r.status === 'submitted' ? 'success' : 'warning'} className="ml-2">{String(r.status ?? '').replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                )) : <p className="text-xs text-t3">{t('noReviewsYet')}</p>}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('feedbackReceived')}</h3>
                {empFeedback.length > 0 ? empFeedback.slice(0, 3).map(f => (
                  <div key={f.id} className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-t1">{String(getEmployeeName(f.from_id) ?? '')}</span>
                      <Badge variant={f.type === 'recognition' ? 'success' : 'info'}>{String(f.type ?? '')}</Badge>
                    </div>
                    <p className="text-xs text-t2 mt-1 line-clamp-2">{String(f.content ?? '')}</p>
                  </div>
                )) : <p className="text-xs text-t3">{t('noFeedbackReceived')}</p>}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">{t('devices')}</h3>
                {empDevices.length > 0 ? empDevices.map(d => (
                  <div key={d.id} className="flex items-center justify-between mb-2">
                    <span className="text-xs text-t1">{String(d.brand ?? '')} {String(d.model ?? '')}</span>
                    <Badge>{String(d.type ?? '')}</Badge>
                  </div>
                )) : <p className="text-xs text-t3">{t('noDevicesAssigned')}</p>}
              </Card>
            </div>
            </div>
          )}

          {/* Custom Fields Tab */}
          {activeTab === 'custom_fields' && (
            <div className="space-y-6">
              {Object.keys(fieldGroups).length === 0 && (
                <Card>
                  <div className="text-center py-8">
                    <Hash size={32} className="mx-auto text-t3 mb-3" />
                    <p className="text-sm text-t3">No custom fields defined yet</p>
                    <p className="text-xs text-t3 mt-1">Custom fields can be configured in People settings</p>
                  </div>
                </Card>
              )}
              {Object.entries(fieldGroups).map(([groupName, defs]) => (
                <Card key={groupName}>
                  <h3 className="text-sm font-semibold text-t1 mb-4">{groupName}</h3>
                  <div className="space-y-3">
                    {defs.map(def => {
                      const val = getFieldValue(def.id)
                      const isEditing = editingField === def.id
                      const Icon = FIELD_TYPE_ICONS[def.field_type] || Hash
                      return (
                        <div key={def.id} className="flex items-start gap-3 group">
                          <div className="mt-0.5 p-1.5 rounded bg-white/5">
                            <Icon size={12} className="text-t3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium text-t2">{def.name}</span>
                              {def.is_required && <span className="text-[0.6rem] text-red-400">Required</span>}
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  {renderFieldInput(def)}
                                </div>
                                <button onClick={() => saveFieldValue(def.id, editFieldValue)} className="p-1 text-green-400 hover:text-green-300">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => { setEditingField(null); setEditFieldValue('') }} className="p-1 text-t3 hover:text-t1">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors"
                                onClick={() => startEditField(def.id)}
                              >
                                {renderFieldDisplay(def, val?.value)}
                              </div>
                            )}
                            {def.description && <p className="text-[0.6rem] text-t3 mt-0.5">{def.description}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Emergency Contacts Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-t1">Emergency Contacts</h3>
                {empContacts.length < 3 && (
                  <Button size="sm" onClick={openAddContact}><Plus size={14} /> Add Contact</Button>
                )}
              </div>
              {empContacts.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Heart size={32} className="mx-auto text-t3 mb-3" />
                    <p className="text-sm text-t3">No emergency contacts added</p>
                    <p className="text-xs text-t3 mt-1">Add up to 3 emergency contacts for this employee</p>
                    <Button size="sm" className="mt-4" onClick={openAddContact}><Plus size={14} /> Add Contact</Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empContacts.map(contact => (
                    <Card key={contact.id} className="relative">
                      {contact.is_primary && (
                        <div className="absolute top-3 right-3">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-t1">{contact.name}</h4>
                            {contact.is_primary && <Badge variant="warning">Primary</Badge>}
                          </div>
                          <p className="text-xs text-t3 capitalize mt-0.5">{contact.relationship}</p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-t3" />
                            <span className="text-xs text-t2">{contact.phone}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-t3" />
                              <span className="text-xs text-t2">{contact.email}</span>
                            </div>
                          )}
                          {contact.address && (
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-t3" />
                              <span className="text-xs text-t2 line-clamp-2">{contact.address}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-divider">
                          <Button size="sm" variant="secondary" onClick={() => openEditContact(contact)}>
                            <Pencil size={12} /> Edit
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => deleteEmergencyContact(contact.id)}>
                            <Trash2 size={12} /> Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {empContacts.length >= 3 && (
                <p className="text-xs text-t3 text-center">Maximum of 3 emergency contacts reached</p>
              )}
            </div>
          )}

          {/* Banking Details Tab */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-t1">Banking Details</h3>
                <Button size="sm" onClick={openEditBanking}>
                  <Pencil size={14} /> {hasBankingDetails ? 'Edit' : 'Add'} Banking Details
                </Button>
              </div>
              {!hasBankingDetails ? (
                <Card>
                  <div className="text-center py-8">
                    <Landmark size={32} className="mx-auto text-t3 mb-3" />
                    <p className="text-sm text-t3">No banking details on file</p>
                    <p className="text-xs text-t3 mt-1">Add bank account or mobile money details for payroll payments</p>
                    <Button size="sm" className="mt-4" onClick={openEditBanking}><Plus size={14} /> Add Banking Details</Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Account Card */}
                  {empAny.bank_account_number && (
                    <Card>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Landmark size={16} className="text-tempo-500" />
                          <h4 className="text-sm font-semibold text-t1">Bank Account</h4>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Bank Name</span>
                            <span className="text-xs text-t1 font-medium">{empAny.bank_name || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Bank Code</span>
                            <span className="text-xs text-t1 font-medium">{empAny.bank_code || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Account Number</span>
                            <span className="text-xs text-t1 font-medium">
                              {'•'.repeat(Math.max(0, (empAny.bank_account_number || '').length - 4))}{(empAny.bank_account_number || '').slice(-4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Account Name</span>
                            <span className="text-xs text-t1 font-medium">{empAny.bank_account_name || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Country</span>
                            <span className="text-xs text-t1 font-medium">{empAny.bank_country || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                  {/* Mobile Money Card */}
                  {empAny.mobile_money_number && (
                    <Card>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} className="text-green-500" />
                          <h4 className="text-sm font-semibold text-t1">Mobile Money</h4>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Provider</span>
                            <span className="text-xs text-t1 font-medium">{empAny.mobile_money_provider || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-t3">Mobile Number</span>
                            <span className="text-xs text-t1 font-medium">{empAny.mobile_money_number}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Tax ID Number */}
              <div className="mt-4">
                <Card>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-t1">Tax Identification</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-t3">Tax ID Number (TIN)</span>
                      <span className="text-xs text-t1 font-medium font-mono">{empAny.tax_id_number || 'Not set'}</span>
                    </div>
                    <p className="text-[10px] text-t3">Used for year-end statutory tax forms (P9, H1, PAYE returns).</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <Card padding="none">
              <CardHeader><CardTitle>{t('goalsCardTitle')}</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empGoals.map(g => (
                  <div key={g.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-t1">{String(g.title ?? '')}</p>
                      <Badge variant={g.status === 'on_track' ? 'success' : g.status === 'at_risk' ? 'warning' : 'error'}>{String(g.status ?? '').replace(/_/g, ' ')}</Badge>
                    </div>
                    {g.description && <p className="text-xs text-t2 mb-2">{String(g.description)}</p>}
                    <Progress value={g.progress} showLabel />
                    <p className="text-xs text-t3 mt-1">{t('due', { date: g.due_date })}</p>
                  </div>
                ))}
                {empGoals.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noGoals')}</div>}
              </div>
            </Card>
          )}

          {activeTab === 'learning' && (
            <Card padding="none">
              <CardHeader><CardTitle>{t('courseEnrollments')}</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empEnrollments.map(e => {
                  const course = courses.find(c => c.id === e.course_id)
                  return (
                    <div key={e.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-t1">{String(course?.title ?? '')}</p>
                        <Badge variant={e.status === 'completed' ? 'success' : e.status === 'in_progress' ? 'warning' : 'default'}>{e.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      <Progress value={e.progress} showLabel />
                    </div>
                  )
                })}
                {empEnrollments.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noEnrollments')}</div>}
              </div>
            </Card>
          )}

          {activeTab === 'time' && (
            <Card padding="none">
              <CardHeader><CardTitle>{t('leaveRequests')}</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empLeave.map(lr => (
                  <div key={lr.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">{t('leaveType', { type: String(lr.type ?? '') })}</p>
                      <p className="text-xs text-t3">{t('leaveDateRange', { start: String(lr.start_date ?? ''), end: String(lr.end_date ?? ''), days: String(lr.days ?? '') })}</p>
                      {lr.reason && <p className="text-xs text-t2 mt-1">{String(lr.reason)}</p>}
                    </div>
                    <Badge variant={lr.status === 'approved' ? 'success' : lr.status === 'pending' ? 'warning' : 'error'}>{String(lr.status ?? '')}</Badge>
                  </div>
                ))}
                {empLeave.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noLeaveRequests')}</div>}
              </div>
            </Card>
          )}

          {activeTab === 'devices' && (
            <Card padding="none">
              <CardHeader><CardTitle>{t('assignedDevices')}</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empDevices.map(d => (
                  <div key={d.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">{String(d.brand ?? '')} {String(d.model ?? '')}</p>
                      <p className="text-xs text-t3">{t('serialNumber', { serial: String(d.serial_number ?? '') })}</p>
                    </div>
                    <Badge>{String(d.type ?? '')}</Badge>
                  </div>
                ))}
                {empDevices.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noDevices')}</div>}
              </div>
            </Card>
          )}

          {activeTab === 'expenses' && (
            <Card padding="none">
              <CardHeader><CardTitle>{t('expenseReports')}</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empExpenses.map(e => (
                  <div key={e.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">{String(e.title ?? '')}</p>
                      <p className="text-xs text-t3">{t('expenseAmount', { amount: (e.total_amount ?? 0).toLocaleString(), currency: String(e.currency ?? '') })}</p>
                    </div>
                    <Badge variant={e.status === 'approved' || e.status === 'reimbursed' ? 'success' : e.status === 'submitted' || e.status === 'pending_approval' ? 'warning' : 'default'}>{String(e.status ?? '').replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
                {empExpenses.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noExpenseReports')}</div>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title={t('editProfileModal')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={tp('fullName')} value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            <Input label={tp('email')} type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={tp('jobTitle')} value={editForm.job_title} onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })} />
            <Input label={tp('phone')} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label={tc('department')} value={editForm.department_id} onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
            <Select label={tp('levelLabel')} value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} options={[
              { value: 'Junior', label: tp('levelJunior') }, { value: 'Associate', label: tp('levelAssociate') },
              { value: 'Mid', label: tp('levelMid') }, { value: 'Senior', label: tp('levelSenior') },
              { value: 'Manager', label: tp('levelManager') }, { value: 'Director', label: tp('levelDirector') },
              { value: 'Executive', label: tp('levelExecutive') },
            ]} />
            <Select label={tp('countryLabel')} value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} options={[
              { value: 'Nigeria', label: tc('countryNigeria') }, { value: 'Ghana', label: tc('countryGhana') },
              { value: "Cote d'Ivoire", label: tc('countryCoteDIvoire') }, { value: 'Kenya', label: tc('countryKenya') },
              { value: 'Senegal', label: tc('countrySenegal') },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEdit}>{tc('saveChanges')}</Button>
          </div>
        </div>
      </Modal>

      {/* Self-Service Profile Edit Modal */}
      <Modal open={showSelfEditModal} onClose={() => setShowSelfEditModal(false)} title="Edit My Profile" size="lg">
        <div className="space-y-4">
          <p className="text-xs text-t3 bg-canvas p-3 rounded">You can update your personal contact details below. For changes to your job title, department, or other employment details, please contact HR.</p>
          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider">Contact Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone Number" value={selfEditForm.phone} onChange={(e) => setSelfEditForm({ ...selfEditForm, phone: e.target.value })} placeholder="e.g. +234 801 234 5678" />
            <Input label="Personal Email" type="email" value={selfEditForm.personal_email} onChange={(e) => setSelfEditForm({ ...selfEditForm, personal_email: e.target.value })} placeholder="e.g. name@gmail.com" />
          </div>
          <Input label="Address" value={selfEditForm.address} onChange={(e) => setSelfEditForm({ ...selfEditForm, address: e.target.value })} placeholder="Street address, city, country" />
          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider pt-2">Emergency Contact</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact Name" value={selfEditForm.emergency_contact_name} onChange={(e) => setSelfEditForm({ ...selfEditForm, emergency_contact_name: e.target.value })} placeholder="Full name" />
            <Input label="Emergency Contact Phone" value={selfEditForm.emergency_contact_phone} onChange={(e) => setSelfEditForm({ ...selfEditForm, emergency_contact_phone: e.target.value })} placeholder="e.g. +234 801 234 5678" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSelfEditModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSelfEdit}>
              <Save size={14} /> {tc('saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Banking Details Modal */}
      <Modal open={showBankingModal} onClose={() => setShowBankingModal(false)} title="Banking Details" size="lg">
        <div className="space-y-4">
          <p className="text-xs text-t3 bg-canvas p-3 rounded">Bank account details are used for payroll payments. Ensure accuracy to avoid payment delays.</p>
          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider">Bank Account</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bank Name" placeholder="e.g. First Bank, Standard Chartered" value={bankingForm.bank_name} onChange={(e) => setBankingForm({ ...bankingForm, bank_name: e.target.value })} />
            <Input label="Bank Code / Sort Code" placeholder="e.g. 011, 058" value={bankingForm.bank_code} onChange={(e) => setBankingForm({ ...bankingForm, bank_code: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Number" placeholder="e.g. 0123456789" value={bankingForm.bank_account_number} onChange={(e) => setBankingForm({ ...bankingForm, bank_account_number: e.target.value })} />
            <Input label="Account Holder Name" placeholder="Name as registered with bank" value={bankingForm.bank_account_name} onChange={(e) => setBankingForm({ ...bankingForm, bank_account_name: e.target.value })} />
          </div>
          <Input label="Bank Country" placeholder="e.g. Nigeria, Ghana, Kenya" value={bankingForm.bank_country} onChange={(e) => setBankingForm({ ...bankingForm, bank_country: e.target.value })} />
          <h4 className="text-xs font-semibold text-t2 uppercase tracking-wider pt-2">Mobile Money (Optional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Provider" placeholder="e.g. MTN, M-Pesa, Vodafone Cash" value={bankingForm.mobile_money_provider} onChange={(e) => setBankingForm({ ...bankingForm, mobile_money_provider: e.target.value })} />
            <Input label="Mobile Number" placeholder="e.g. +233 24 123 4567" value={bankingForm.mobile_money_number} onChange={(e) => setBankingForm({ ...bankingForm, mobile_money_number: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBankingModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitBanking}>
              <Save size={14} /> Save Banking Details
            </Button>
          </div>
        </div>
      </Modal>

      {/* Emergency Contact Modal */}
      <Modal open={showContactModal} onClose={() => setShowContactModal(false)} title={editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
            <Select label="Relationship" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} options={[
              { value: 'spouse', label: 'Spouse' },
              { value: 'parent', label: 'Parent' },
              { value: 'sibling', label: 'Sibling' },
              { value: 'child', label: 'Child' },
              { value: 'friend', label: 'Friend' },
              { value: 'other', label: 'Other' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} required />
            <Input label="Email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
          </div>
          <Input label="Address" value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contactForm.is_primary}
              onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-tempo-500 focus:ring-tempo-500"
            />
            <span className="text-sm text-t2">Primary emergency contact</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowContactModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitContact} disabled={!contactForm.name || !contactForm.phone}>
              {editingContact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
