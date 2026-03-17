'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useTempo } from '@/lib/store'
import { useAcademyData } from '@/lib/hooks/use-academy-data'
import { cn } from '@/lib/utils/cn'
import {
  GraduationCap, Plus, Users, BarChart3, Calendar, Award,
  MessageSquare, ChevronRight, ChevronLeft, Check, Upload,
  Globe, Lock, Palette, BookOpen, Settings, Eye, Rocket,
  Send, Bell, Mail, Clock, AlertTriangle, Search,
  ArrowUp, ArrowDown, X, Hash, FileText, Zap,
  TrendingUp, Activity, CheckCircle2, XCircle, Filter,
  MoreHorizontal, Copy, ExternalLink, Sparkles
} from 'lucide-react'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Cohort {
  id: string
  name: string
  start_date: string
  end_date: string
  participant_ids: string[]
  facilitator_name: string
  status: 'upcoming' | 'active' | 'completed'
}

interface Academy {
  id: string
  name: string
  description: string
  slug: string
  logo_url: string
  brand_color: string
  welcome_message: string
  enrollment_type: 'public' | 'private'
  status: 'draft' | 'active' | 'archived'
  cohorts: Cohort[]
  curriculum_course_ids: string[]
  curriculum_path_ids: string[]
  completion_rules: {
    min_courses: number
    require_assessment: boolean
    require_certificate: boolean
  }
  community_enabled: boolean
  languages: string[]
  created_at: string
}

interface Participant {
  id: string
  name: string
  email: string
  business_name: string
  country: string
  language: string
  academy_id: string
  cohort_id: string
  progress: number
  status: 'active' | 'inactive' | 'completed' | 'dropped'
  enrolled_date: string
  last_active: string
}

interface CommunicationLog {
  id: string
  academy_id: string
  type: 'broadcast' | 'automated'
  trigger_name?: string
  subject: string
  recipient_count: number
  status: 'sent' | 'scheduled' | 'failed'
  sent_at: string
}

interface AutomatedTrigger {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND_COLORS = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#9333ea', label: 'Purple' },
  { value: '#059669', label: 'Green' },
  { value: '#dc2626', label: 'Red' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#0891b2', label: 'Cyan' },
]

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'es', label: 'Spanish' },
]

const STORAGE_KEY = 'tempo_academies'
const PARTICIPANTS_KEY = 'tempo_academy_participants'
const COMMS_KEY = 'tempo_academy_communications'

// ─── Seed Data ───────────────────────────────────────────────────────────────

function generateId(): string {
  return `acad_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function createSeedParticipants(academyId: string, cohortId: string, count: number, startIndex: number): Participant[] {
  const firstNames = ['Amara', 'Kwame', 'Fatou', 'Ibrahima', 'Aissatou', 'Moussa', 'Mariama', 'Ousmane', 'Adama', 'Binta', 'Sekou', 'Hawa', 'Mamadou', 'Djeneba', 'Aboubacar', 'Kadiatou', 'Saliou', 'Nafissatou', 'Boubacar', 'Oumou']
  const lastNames = ['Diallo', 'Traore', 'Kone', 'Coulibaly', 'Camara', 'Bah', 'Barry', 'Sylla', 'Toure', 'Keita', 'Sow', 'Diop', 'Ndiaye', 'Fall', 'Seck', 'Mbaye', 'Gueye', 'Kane', 'Ly', 'Ba']
  const businesses = ['Akwaba Foods', 'Sahel Trading', 'Baobab Tech', 'Kente Crafts', 'Savanna Logistics', 'Palm Oil Co', 'Cocoa Valley', 'Dakar Imports', 'Abidjan Express', 'Lagos Connect']
  const countries = ['Senegal', 'Ghana', 'Nigeria', 'Ivory Coast', 'Mali', 'Guinea', 'Burkina Faso', 'Togo', 'Benin', 'Cameroon']
  const langs = ['English', 'French', 'Portuguese']
  const statuses: Participant['status'][] = ['active', 'active', 'active', 'active', 'inactive', 'completed']

  return Array.from({ length: count }, (_, i) => {
    const idx = (startIndex + i) % firstNames.length
    const lIdx = (startIndex + i + 3) % lastNames.length
    const fullName = `${firstNames[idx]} ${lastNames[lIdx]}`
    const daysAgo = Math.floor(Math.random() * 30)
    const lastActive = new Date(Date.now() - daysAgo * 86400000).toISOString()
    return {
      id: `part_${academyId}_${i}`,
      name: fullName,
      email: `${firstNames[idx].toLowerCase()}.${lastNames[lIdx].toLowerCase()}@${businesses[i % businesses.length].toLowerCase().replace(/\s/g, '')}.com`,
      business_name: businesses[i % businesses.length],
      country: countries[i % countries.length],
      language: langs[i % langs.length],
      academy_id: academyId,
      cohort_id: cohortId,
      progress: Math.floor(Math.random() * 100),
      status: statuses[i % statuses.length],
      enrolled_date: new Date(Date.now() - (90 + Math.floor(Math.random() * 60)) * 86400000).toISOString().slice(0, 10),
      last_active: lastActive,
    }
  })
}

function createSeedAcademies(): Academy[] {
  return [
    {
      id: 'acad_ecobank_sme',
      name: 'Ecobank SME Academy',
      description: 'A comprehensive programme designed to equip small and medium enterprise owners with the financial literacy, digital tools, and business acumen needed to scale their operations across West Africa.',
      slug: 'ecobank-sme-2026',
      logo_url: '',
      brand_color: '#2563eb',
      welcome_message: 'Welcome to the Ecobank SME Academy! Over the next 12 weeks, you will gain practical skills in financial management, digital marketing, and business strategy.',
      enrollment_type: 'private',
      status: 'active',
      cohorts: [
        {
          id: 'cohort_eco_1',
          name: 'Cohort 2026-Q1',
          start_date: '2026-01-15',
          end_date: '2026-04-15',
          participant_ids: Array.from({ length: 89 }, (_, i) => `part_acad_ecobank_sme_${i}`),
          facilitator_name: 'Dr. Aminata Toure',
          status: 'active',
        },
        {
          id: 'cohort_eco_2',
          name: 'Cohort 2026-Q2',
          start_date: '2026-04-01',
          end_date: '2026-07-01',
          participant_ids: Array.from({ length: 67 }, (_, i) => `part_acad_ecobank_sme_${89 + i}`),
          facilitator_name: 'Prof. Kofi Mensah',
          status: 'upcoming',
        },
      ],
      curriculum_course_ids: ['course_1', 'course_2', 'course_3'],
      curriculum_path_ids: ['path_1'],
      completion_rules: {
        min_courses: 3,
        require_assessment: true,
        require_certificate: true,
      },
      community_enabled: true,
      languages: ['en', 'fr'],
      created_at: '2025-11-01T10:00:00Z',
    },
    {
      id: 'acad_wib',
      name: 'Women in Business Programme',
      description: 'Empowering women entrepreneurs across sub-Saharan Africa with mentorship, funding access, and practical business skills to build resilient, scalable enterprises.',
      slug: 'women-in-business',
      logo_url: '',
      brand_color: '#9333ea',
      welcome_message: 'Welcome to the Women in Business Programme! This is your space to learn, connect, and grow alongside fellow women entrepreneurs.',
      enrollment_type: 'public',
      status: 'active',
      cohorts: [
        {
          id: 'cohort_wib_1',
          name: 'Pioneer Cohort',
          start_date: '2026-02-01',
          end_date: '2026-05-01',
          participant_ids: Array.from({ length: 89 }, (_, i) => `part_acad_wib_${i}`),
          facilitator_name: 'Ngozi Adichie-Okafor',
          status: 'active',
        },
      ],
      curriculum_course_ids: ['course_2', 'course_4'],
      curriculum_path_ids: ['path_2'],
      completion_rules: {
        min_courses: 2,
        require_assessment: true,
        require_certificate: false,
      },
      community_enabled: true,
      languages: ['en', 'fr', 'pt'],
      created_at: '2025-12-15T08:00:00Z',
    },
  ]
}

function createSeedParticipantsFull(): Participant[] {
  const ecoP1 = createSeedParticipants('acad_ecobank_sme', 'cohort_eco_1', 89, 0)
  const ecoP2 = createSeedParticipants('acad_ecobank_sme', 'cohort_eco_2', 67, 89)
  const wibP = createSeedParticipants('acad_wib', 'cohort_wib_1', 89, 0)
  return [...ecoP1, ...ecoP2, ...wibP]
}

function createSeedCommunications(): CommunicationLog[] {
  return [
    { id: 'comm_1', academy_id: 'acad_ecobank_sme', type: 'automated', trigger_name: 'Enrollment Confirmation', subject: 'Welcome to Ecobank SME Academy', recipient_count: 89, status: 'sent', sent_at: '2026-01-15T10:00:00Z' },
    { id: 'comm_2', academy_id: 'acad_ecobank_sme', type: 'broadcast', subject: 'Week 4 Update: Guest Speaker Announcement', recipient_count: 85, status: 'sent', sent_at: '2026-02-12T09:00:00Z' },
    { id: 'comm_3', academy_id: 'acad_ecobank_sme', type: 'automated', trigger_name: 'Session Reminder (24h)', subject: 'Reminder: Financial Literacy Workshop Tomorrow', recipient_count: 89, status: 'sent', sent_at: '2026-02-19T09:00:00Z' },
    { id: 'comm_4', academy_id: 'acad_wib', type: 'automated', trigger_name: 'Enrollment Confirmation', subject: 'Welcome to Women in Business', recipient_count: 89, status: 'sent', sent_at: '2026-02-01T08:00:00Z' },
    { id: 'comm_5', academy_id: 'acad_wib', type: 'broadcast', subject: 'Mentorship Matching Results', recipient_count: 82, status: 'sent', sent_at: '2026-02-20T14:00:00Z' },
    { id: 'comm_6', academy_id: 'acad_ecobank_sme', type: 'automated', trigger_name: 'Assignment Due (48h)', subject: 'Business Plan Due in 48 Hours', recipient_count: 78, status: 'sent', sent_at: '2026-03-01T08:00:00Z' },
  ]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatDate(d: string): string {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ─── Empty Builder State ─────────────────────────────────────────────────────

function emptyAcademy(): Academy {
  return {
    id: generateId(),
    name: '',
    description: '',
    slug: '',
    logo_url: '',
    brand_color: '#2563eb',
    welcome_message: '',
    enrollment_type: 'private',
    status: 'draft',
    cohorts: [],
    curriculum_course_ids: [],
    curriculum_path_ids: [],
    completion_rules: { min_courses: 1, require_assessment: false, require_certificate: false },
    community_enabled: false,
    languages: ['en'],
    created_at: new Date().toISOString(),
  }
}

function emptyCohort(): Cohort {
  return {
    id: `cohort_${Date.now()}`,
    name: '',
    start_date: '',
    end_date: '',
    participant_ids: [],
    facilitator_name: '',
    status: 'upcoming',
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AcademiesPage() {
  const { courses, learningPaths, employees, departments, addToast, currentUser, org } = useTempo()

  // ── Academy Data Hook (API when production, localStorage for demo) ──
  const academyAPI = useAcademyData({ orgId: (org as any)?.id })

  // ── Persisted State ──
  const [academies, setAcademies] = useState<Academy[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [communications, setCommunications] = useState<CommunicationLog[]>([])
  const [loaded, setLoaded] = useState(false)

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('academies')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [draft, setDraft] = useState<Academy>(emptyAcademy())
  const [draftCohort, setDraftCohort] = useState<Cohort>(emptyCohort())
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>('')
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastRecipient, setBroadcastRecipient] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusiness, setInviteBusiness] = useState('')
  const [participantSearch, setParticipantSearch] = useState('')
  const [participantFilterProgramme, setParticipantFilterProgramme] = useState('all')
  const [participantFilterStatus, setParticipantFilterStatus] = useState('all')
  const [emailsPaste, setEmailsPaste] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  // ── Triggers state ──
  const [triggers, setTriggers] = useState<AutomatedTrigger[]>([
    { id: 'enrollment_confirm', name: 'Enrollment Confirmation', description: 'Sent when a participant enrolls in the academy', icon: <CheckCircle2 size={16} />, enabled: true },
    { id: 'session_24h', name: 'Session Reminder (24h)', description: 'Sent 24 hours before a live session', icon: <Clock size={16} />, enabled: true },
    { id: 'session_1h', name: 'Session Reminder (1h)', description: 'Sent 1 hour before a live session', icon: <Bell size={16} />, enabled: true },
    { id: 'assignment_48h', name: 'Assignment Due (48h)', description: 'Sent 48 hours before an assignment deadline', icon: <FileText size={16} />, enabled: true },
    { id: 'certificate_issued', name: 'Certificate Issued', description: 'Sent when a participant earns their certificate', icon: <Award size={16} />, enabled: true },
    { id: 'cohort_start_24h', name: 'Cohort Start (24h)', description: 'Sent 24 hours before a cohort begins', icon: <Calendar size={16} />, enabled: false },
  ])

  // ── Load data: API-first (production), localStorage fallback (demo) ──
  useEffect(() => {
    async function loadData() {
      if (academyAPI.isProduction) {
        // Production mode: fetch from database via API
        try {
          const [apiAcademies, apiParticipants] = await Promise.all([
            academyAPI.fetchAcademies(),
            academyAPI.fetchParticipants(),
          ])
          if (apiAcademies) setAcademies(apiAcademies)
          if (apiParticipants) setParticipants(apiParticipants)
          // Communications loaded per-academy when selected
        } catch (err) {
          console.warn('[Academies] API fetch failed, falling back to localStorage', err)
          loadFromLocalStorage()
        }
      } else {
        // Demo mode: use localStorage
        loadFromLocalStorage()
      }
      setLoaded(true)
    }

    function loadFromLocalStorage() {
      try {
        const storedA = localStorage.getItem(STORAGE_KEY)
        const storedP = localStorage.getItem(PARTICIPANTS_KEY)
        const storedC = localStorage.getItem(COMMS_KEY)
        if (storedA) {
          setAcademies(JSON.parse(storedA))
        } else {
          const seed = createSeedAcademies()
          setAcademies(seed)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
        }
        if (storedP) {
          setParticipants(JSON.parse(storedP))
        } else {
          const seedP = createSeedParticipantsFull()
          setParticipants(seedP)
          localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(seedP))
        }
        if (storedC) {
          setCommunications(JSON.parse(storedC))
        } else {
          const seedC = createSeedCommunications()
          setCommunications(seedC)
          localStorage.setItem(COMMS_KEY, JSON.stringify(seedC))
        }
      } catch {
        setAcademies(createSeedAcademies())
        setParticipants(createSeedParticipantsFull())
        setCommunications(createSeedCommunications())
      }
    }

    loadData()
  }, [academyAPI.isProduction]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load communications when selected academy changes (production mode) ──
  useEffect(() => {
    if (!academyAPI.isProduction || !selectedAcademyId || !loaded) return
    academyAPI.fetchCommunications(selectedAcademyId).then(comms => {
      if (comms) setCommunications(comms)
    }).catch(() => {})
  }, [selectedAcademyId, academyAPI.isProduction, loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist changes (demo mode only) ──
  useEffect(() => {
    if (!loaded || academyAPI.isProduction) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(academies))
  }, [academies, loaded, academyAPI.isProduction])

  useEffect(() => {
    if (!loaded || academyAPI.isProduction) return
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants))
  }, [participants, loaded, academyAPI.isProduction])

  useEffect(() => {
    if (!loaded || academyAPI.isProduction) return
    localStorage.setItem(COMMS_KEY, JSON.stringify(communications))
  }, [communications, loaded, academyAPI.isProduction])

  // ── Auto-select academy for dashboard ──
  useEffect(() => {
    if (!selectedAcademyId && academies.length > 0) {
      const active = academies.find(a => a.status === 'active')
      setSelectedAcademyId(active?.id || academies[0].id)
    }
  }, [academies, selectedAcademyId])

  // ── Derived data ──
  const selectedAcademy = academies.find(a => a.id === selectedAcademyId)

  const academyParticipants = useMemo(() => {
    if (!selectedAcademy) return []
    return participants.filter(p => p.academy_id === selectedAcademy.id)
  }, [selectedAcademy, participants])

  const academyComms = useMemo(() => {
    if (!selectedAcademy) return []
    return communications.filter(c => c.academy_id === selectedAcademy.id)
  }, [selectedAcademy, communications])

  const flaggedParticipants = useMemo(() => {
    return academyParticipants.filter(p => p.status === 'active' && daysSince(p.last_active) >= 7)
  }, [academyParticipants])

  const allParticipantsFiltered = useMemo(() => {
    let filtered = participants
    if (participantSearch) {
      const q = participantSearch.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.business_name.toLowerCase().includes(q)
      )
    }
    if (participantFilterProgramme !== 'all') {
      filtered = filtered.filter(p => p.academy_id === participantFilterProgramme)
    }
    if (participantFilterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === participantFilterStatus)
    }
    return filtered
  }, [participants, participantSearch, participantFilterProgramme, participantFilterStatus])

  const totalParticipantCount = useMemo(() => {
    if (!selectedAcademy) return 0
    return selectedAcademy.cohorts.reduce((sum, c) => sum + c.participant_ids.length, 0)
  }, [selectedAcademy])

  const completionRate = useMemo(() => {
    if (academyParticipants.length === 0) return 0
    const completed = academyParticipants.filter(p => p.status === 'completed').length
    return Math.round((completed / academyParticipants.length) * 100)
  }, [academyParticipants])

  // ── Handlers ──
  const openWizard = useCallback(() => {
    setDraft(emptyAcademy())
    setDraftCohort(emptyCohort())
    setWizardStep(0)
    setWizardOpen(true)
  }, [])

  const saveAcademy = useCallback((status: 'draft' | 'active') => {
    const newAcademy: Academy = { ...draft, status, created_at: new Date().toISOString() }
    if (newAcademy.cohorts.length === 0 && draftCohort.name) {
      newAcademy.cohorts = [draftCohort]
    }
    setAcademies(prev => [...prev, newAcademy])
    setWizardOpen(false)
    addToast(status === 'active' ? `${newAcademy.name} launched successfully!` : `${newAcademy.name} saved as draft`, 'success')
  }, [draft, draftCohort, addToast])

  const sendBroadcast = useCallback(() => {
    if (!selectedAcademy || !broadcastSubject) return
    const recipientCount = broadcastRecipient === 'all' ? totalParticipantCount : 1
    const newComm: CommunicationLog = {
      id: `comm_${Date.now()}`,
      academy_id: selectedAcademy.id,
      type: 'broadcast',
      subject: broadcastSubject,
      recipient_count: recipientCount,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }
    setCommunications(prev => [newComm, ...prev])
    setBroadcastOpen(false)
    setBroadcastSubject('')
    setBroadcastBody('')
    addToast(`Broadcast sent to ${recipientCount} participants`, 'success')
  }, [selectedAcademy, broadcastSubject, broadcastRecipient, totalParticipantCount, addToast])

  const sendNudge = useCallback((participant: Participant) => {
    addToast(`Nudge sent to ${participant.name}`, 'success')
  }, [addToast])

  const inviteParticipant = useCallback(() => {
    if (!inviteName || !inviteEmail || !selectedAcademy) return
    const newP: Participant = {
      id: `part_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      business_name: inviteBusiness,
      country: 'Unknown',
      language: 'English',
      academy_id: selectedAcademy.id,
      cohort_id: selectedAcademy.cohorts[0]?.id || '',
      progress: 0,
      status: 'active',
      enrolled_date: new Date().toISOString().slice(0, 10),
      last_active: new Date().toISOString(),
    }
    setParticipants(prev => [...prev, newP])
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteBusiness('')
    addToast(`Invitation sent to ${inviteName}`, 'success')
  }, [inviteName, inviteEmail, inviteBusiness, selectedAcademy, addToast])

  const updateDraft = useCallback((updates: Partial<Academy>) => {
    setDraft(prev => ({ ...prev, ...updates }))
  }, [])

  const toggleCurriculumCourse = useCallback((courseId: string) => {
    setDraft(prev => {
      const ids = prev.curriculum_course_ids.includes(courseId)
        ? prev.curriculum_course_ids.filter(id => id !== courseId)
        : [...prev.curriculum_course_ids, courseId]
      return { ...prev, curriculum_course_ids: ids }
    })
  }, [])

  const toggleCurriculumPath = useCallback((pathId: string) => {
    setDraft(prev => {
      const ids = prev.curriculum_path_ids.includes(pathId)
        ? prev.curriculum_path_ids.filter(id => id !== pathId)
        : [...prev.curriculum_path_ids, pathId]
      return { ...prev, curriculum_path_ids: ids }
    })
  }, [])

  const moveCourse = useCallback((index: number, direction: 'up' | 'down') => {
    setDraft(prev => {
      const ids = [...prev.curriculum_course_ids]
      const swapIdx = direction === 'up' ? index - 1 : index + 1
      if (swapIdx < 0 || swapIdx >= ids.length) return prev
      const temp = ids[index]
      ids[index] = ids[swapIdx]
      ids[swapIdx] = temp
      return { ...prev, curriculum_course_ids: ids }
    })
  }, [])

  const toggleLanguage = useCallback((langId: string) => {
    setDraft(prev => {
      const langs = prev.languages.includes(langId)
        ? prev.languages.filter(l => l !== langId)
        : [...prev.languages, langId]
      return { ...prev, languages: langs }
    })
  }, [])

  const toggleTrigger = useCallback((triggerId: string) => {
    setTriggers(prev => prev.map(t => t.id === triggerId ? { ...t, enabled: !t.enabled } : t))
  }, [])

  // ── Tabs Config ──
  const tabs = [
    { id: 'academies', label: 'Academies' },
    { id: 'builder', label: 'Academy Builder' },
    { id: 'dashboard', label: 'Programme Dashboard' },
    { id: 'communications', label: 'Communications' },
    { id: 'participants', label: 'Participants' },
  ]

  // ── Wizard Steps ──
  const wizardSteps = [
    { label: 'Brand', icon: <Palette size={16} /> },
    { label: 'Enrollment', icon: <Globe size={16} /> },
    { label: 'Curriculum', icon: <BookOpen size={16} /> },
    { label: 'Cohorts', icon: <Users size={16} /> },
    { label: 'Settings', icon: <Settings size={16} /> },
    { label: 'Review', icon: <Rocket size={16} /> },
  ]

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-tempo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ─── Course/Path name helpers ──────────────────────────────────────────────

  function getCourseName(id: string): string {
    const c = (courses || []).find((c: any) => c.id === id) as any
    return c?.title || c?.name || `Course ${id.slice(-4)}`
  }

  function getPathName(id: string): string {
    const p = (learningPaths || []).find((lp: any) => lp.id === id) as any
    return p?.title || p?.name || `Path ${id.slice(-4)}`
  }

  function getAcademyName(id: string): string {
    return academies.find(a => a.id === id)?.name || 'Unknown'
  }

  function getCohortName(academyId: string, cohortId: string): string {
    const acad = academies.find(a => a.id === academyId)
    return acad?.cohorts.find(c => c.id === cohortId)?.name || 'Unknown'
  }

  // ─── Render: Status Badge ─────────────────────────────────────────────────

  function renderStatusBadge(status: string) {
    const variant = status === 'active' ? 'success' : status === 'draft' ? 'warning' : status === 'completed' ? 'info' : 'default'
    return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  // ─── Render: Tab 1 — Academies ──────────────────────────────────────────

  function renderAcademiesList() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">Your Academies</h2>
            <p className="text-sm text-t3 mt-0.5">{academies.length} programme{academies.length !== 1 ? 's' : ''} created</p>
          </div>
          <Button onClick={openWizard} size="md">
            <Plus size={16} />
            Create Academy
          </Button>
        </div>

        {academies.length === 0 ? (
          <Card className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center mb-4">
              <GraduationCap size={28} className="text-tempo-600" />
            </div>
            <h3 className="text-base font-semibold text-t1 mb-2">No academies yet</h3>
            <p className="text-sm text-t3 mb-6 max-w-md mx-auto">
              Create your first academy to start building learning programmes for external participants.
            </p>
            <Button onClick={openWizard}>
              <Plus size={16} />
              Create Your First Academy
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {academies.map(academy => {
              const participantCount = academy.cohorts.reduce((sum, c) => sum + c.participant_ids.length, 0)
              const acParticipants = participants.filter(p => p.academy_id === academy.id)
              const acCompletion = acParticipants.length > 0
                ? Math.round((acParticipants.filter(p => p.status === 'completed').length / acParticipants.length) * 100)
                : 0
              const activeCount = acParticipants.filter(p => p.status === 'active').length
              const completedCount = acParticipants.filter(p => p.status === 'completed').length
              const atRiskCount = acParticipants.filter(p => p.status === 'inactive').length

              return (
                <Card
                  key={academy.id}
                  clickable
                  onClick={() => {
                    setSelectedAcademyId(academy.id)
                    setActiveTab('dashboard')
                  }}
                  className="group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-sm"
                      style={{ backgroundColor: academy.brand_color }}
                    >
                      {academy.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-t1 truncate">{academy.name}</h3>
                        {renderStatusBadge(academy.status)}
                      </div>
                      <p className="text-sm text-t3 line-clamp-2">{academy.description}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-4 bg-canvas rounded-xl p-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-t1">{participantCount}</p>
                      <p className="text-[0.6rem] text-t3 uppercase tracking-wider">Enrolled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{activeCount}</p>
                      <p className="text-[0.6rem] text-t3 uppercase tracking-wider">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-t1">{academy.cohorts.length}</p>
                      <p className="text-[0.6rem] text-t3 uppercase tracking-wider">Cohorts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-t1">{acCompletion}%</p>
                      <p className="text-[0.6rem] text-t3 uppercase tracking-wider">Completion</p>
                    </div>
                  </div>

                  {/* Progress + At Risk */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-t3">{completedCount} completed · {atRiskCount > 0 ? `${atRiskCount} at risk` : 'none at risk'}</span>
                      <span className="text-xs font-bold text-t1">{acCompletion}%</span>
                    </div>
                    <Progress value={acCompletion} showLabel={false} size="sm" color="orange" />
                  </div>

                  {/* Cohort Snapshots */}
                  <div className="space-y-2 mb-4">
                    {academy.cohorts.slice(0, 2).map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-t2">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          c.status === 'active' ? 'bg-green-500' : c.status === 'upcoming' ? 'bg-blue-400' : 'bg-gray-300'
                        )} />
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="text-t3 ml-auto shrink-0">{c.participant_ids.length} participants · {c.facilitator_name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-divider flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {academy.languages.map(l => (
                        <span key={l} className="text-[0.6rem] uppercase bg-canvas px-1.5 py-0.5 rounded font-medium text-t3">{l}</span>
                      ))}
                      <span className="text-[0.6rem] text-t3 ml-2">{academy.enrollment_type === 'private' ? '🔒 Private' : '🌐 Public'}</span>
                    </div>
                    <span className="text-xs text-t3 flex items-center gap-1 group-hover:text-tempo-600 transition-colors font-medium">
                      Open Dashboard <ChevronRight size={12} />
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ─── Render: Tab 2 — Academy Builder (Inline Wizard) ────────────────────

  function renderBuilderTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">Academy Builder</h2>
            <p className="text-sm text-t3 mt-0.5">Create a new academy programme step by step</p>
          </div>
        </div>

        {/* Stepper */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-divider">
            <div className="flex items-center gap-2">
              {wizardSteps.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <button
                    onClick={() => setWizardStep(i)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      wizardStep === i
                        ? 'bg-tempo-50 text-tempo-700 ring-1 ring-tempo-200'
                        : wizardStep > i
                        ? 'text-success bg-green-50'
                        : 'text-t3 hover:text-t2 hover:bg-canvas'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold',
                      wizardStep === i
                        ? 'bg-tempo-600 text-white'
                        : wizardStep > i
                        ? 'bg-success text-white'
                        : 'bg-gray-200 text-t3'
                    )}>
                      {wizardStep > i ? <Check size={12} /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {i < wizardSteps.length - 1 && (
                    <ChevronRight size={14} className="text-gray-300 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 min-h-[280px]">
            {wizardStep === 0 && renderStep1Brand()}
            {wizardStep === 1 && renderStep2Enrollment()}
            {wizardStep === 2 && renderStep3Curriculum()}
            {wizardStep === 3 && renderStep4Cohorts()}
            {wizardStep === 4 && renderStep5Settings()}
            {wizardStep === 5 && renderStep6Review()}
          </div>

          <div className="px-6 py-4 border-t border-divider flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
              disabled={wizardStep === 0}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {wizardStep === wizardSteps.length - 1 ? (
                <>
                  <Button variant="secondary" onClick={() => saveAcademy('draft')}>
                    Save as Draft
                  </Button>
                  <Button onClick={() => saveAcademy('active')}>
                    <Rocket size={16} />
                    Launch Academy
                  </Button>
                </>
              ) : (
                <Button onClick={() => setWizardStep(Math.min(wizardSteps.length - 1, wizardStep + 1))}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ─── Step 1: Brand ────────────────────────────────────────────────────────

  function renderStep1Brand() {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-base font-semibold text-t1 mb-1">Brand Your Academy</h3>
          <p className="text-sm text-t3">Define how your academy looks and feels to participants.</p>
        </div>

        <Input
          label="Academy Name"
          id="academy-name"
          placeholder="e.g., Ecobank Digital Skills Academy"
          value={draft.name}
          onChange={e => updateDraft({ name: e.target.value, slug: slugify(e.target.value) })}
        />

        <Textarea
          label="Description"
          id="academy-desc"
          placeholder="Describe what participants will learn and achieve..."
          value={draft.description}
          onChange={e => updateDraft({ description: e.target.value })}
          rows={3}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Academy Logo</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-tempo-300 transition-colors cursor-pointer">
            <Upload size={24} className="mx-auto text-t3 mb-2" />
            <p className="text-sm text-t2 font-medium">Drop your logo here or click to upload</p>
            <p className="text-xs text-t3 mt-1">PNG, JPG up to 2MB. Recommended 256x256px.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Brand Color</label>
          <div className="flex gap-3">
            {BRAND_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => updateDraft({ brand_color: color.value })}
                className={cn(
                  'w-10 h-10 rounded-xl transition-all duration-200',
                  draft.brand_color === color.value
                    ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <Textarea
          label="Welcome Message"
          id="welcome-msg"
          placeholder="Write a personal welcome message for new participants..."
          value={draft.welcome_message}
          onChange={e => updateDraft({ welcome_message: e.target.value })}
          rows={3}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Slug</label>
          <div className="flex items-center gap-2 text-sm text-t3 bg-canvas rounded-xl px-4 py-2.5">
            <Globe size={14} />
            <span>academy.tempo.com/</span>
            <span className="text-t1 font-medium">{draft.slug || 'your-academy'}</span>
          </div>
        </div>

        {/* Live Preview */}
        {draft.name && (
          <div className="mt-6 pt-6 border-t border-divider">
            <p className="text-xs font-medium text-t2 tracking-wide uppercase mb-3">Preview</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="h-24 flex items-center justify-center" style={{ backgroundColor: draft.brand_color }}>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{draft.name.charAt(0)}</span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <h4 className="font-semibold text-t1">{draft.name}</h4>
                <p className="text-xs text-t3 mt-1 line-clamp-2">{draft.description || 'Your academy description will appear here.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Step 2: Enrollment ───────────────────────────────────────────────────

  function renderStep2Enrollment() {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-base font-semibold text-t1 mb-1">Enrollment Settings</h3>
          <p className="text-sm text-t3">Control how participants discover and join your academy.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Enrollment Type</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateDraft({ enrollment_type: 'public' })}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                draft.enrollment_type === 'public'
                  ? 'border-tempo-500 bg-tempo-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Globe size={20} className={draft.enrollment_type === 'public' ? 'text-tempo-600' : 'text-t3'} />
              <p className="text-sm font-semibold text-t1 mt-2">Public</p>
              <p className="text-xs text-t3 mt-1">Anyone with the link can enroll. Great for open programmes.</p>
            </button>
            <button
              onClick={() => updateDraft({ enrollment_type: 'private' })}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                draft.enrollment_type === 'private'
                  ? 'border-tempo-500 bg-tempo-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <Lock size={20} className={draft.enrollment_type === 'private' ? 'text-tempo-600' : 'text-t3'} />
              <p className="text-sm font-semibold text-t1 mt-2">Private</p>
              <p className="text-xs text-t3 mt-1">Invite-only. Participants must be added manually or via CSV.</p>
            </button>
          </div>
        </div>

        {draft.enrollment_type === 'public' && (
          <div className="p-4 bg-tempo-50 rounded-xl border border-tempo-200">
            <p className="text-xs font-medium text-tempo-700 uppercase tracking-wide mb-2">Public Enrollment URL</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-t1 font-mono border border-tempo-200">
                https://academy.tempo.com/{draft.slug || 'your-academy'}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`https://academy.tempo.com/${draft.slug || 'your-academy'}`)
                  addToast('URL copied to clipboard', 'success')
                }}
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Supported Languages</label>
          <div className="flex flex-wrap gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                  draft.languages.includes(lang.id)
                    ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                    : 'border-gray-200 text-t2 hover:border-gray-300'
                )}
              >
                {draft.languages.includes(lang.id) && <Check size={14} />}
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 3: Curriculum ───────────────────────────────────────────────────

  function renderStep3Curriculum() {
    const availableCourses = courses || []
    const availablePaths = learningPaths || []

    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-base font-semibold text-t1 mb-1">Build Your Curriculum</h3>
          <p className="text-sm text-t3">Select courses and learning paths to include in this academy.</p>
        </div>

        {/* Selected Count */}
        <div className="flex items-center gap-4">
          <Badge variant="orange">
            {draft.curriculum_course_ids.length} course{draft.curriculum_course_ids.length !== 1 ? 's' : ''} selected
          </Badge>
          <Badge variant="info">
            {draft.curriculum_path_ids.length} path{draft.curriculum_path_ids.length !== 1 ? 's' : ''} selected
          </Badge>
        </div>

        {/* Courses */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-t1">Courses</h4>
          {availableCourses.length === 0 ? (
            <div className="p-4 bg-canvas rounded-xl text-center">
              <p className="text-sm text-t3">No courses available. Create courses in the Learning module first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableCourses.map((course: any) => {
                const isSelected = draft.curriculum_course_ids.includes(course.id)
                const idx = draft.curriculum_course_ids.indexOf(course.id)
                return (
                  <div
                    key={course.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                      isSelected ? 'border-tempo-300 bg-tempo-50' : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => toggleCurriculumCourse(course.id)}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                      isSelected ? 'bg-tempo-600 border-tempo-600' : 'border-gray-300'
                    )}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1 truncate">{course.title || course.name}</p>
                      <p className="text-xs text-t3">{course.category || 'General'}</p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          className="p-1 rounded hover:bg-white transition-colors text-t3 hover:text-t1 disabled:opacity-30"
                          onClick={() => moveCourse(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-white transition-colors text-t3 hover:text-t1 disabled:opacity-30"
                          onClick={() => moveCourse(idx, 'down')}
                          disabled={idx === draft.curriculum_course_ids.length - 1}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <span className="text-[0.6rem] bg-tempo-100 text-tempo-700 px-1.5 py-0.5 rounded font-medium ml-1">
                          #{idx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Learning Paths */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-t1">Learning Paths</h4>
          {availablePaths.length === 0 ? (
            <div className="p-4 bg-canvas rounded-xl text-center">
              <p className="text-sm text-t3">No learning paths available.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availablePaths.map((path: any) => {
                const isSelected = draft.curriculum_path_ids.includes(path.id)
                return (
                  <div
                    key={path.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                      isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => toggleCurriculumPath(path.id)}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                      isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    )}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1 truncate">{path.title || path.name}</p>
                      <p className="text-xs text-t3">{path.course_count || 0} courses</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Step 4: Cohorts ──────────────────────────────────────────────────────

  function renderStep4Cohorts() {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-base font-semibold text-t1 mb-1">Set Up Your First Cohort</h3>
          <p className="text-sm text-t3">Group participants into cohorts for structured learning.</p>
        </div>

        <Input
          label="Cohort Name"
          id="cohort-name"
          placeholder="e.g., Q2 2026 Cohort"
          value={draftCohort.name}
          onChange={e => setDraftCohort(prev => ({ ...prev, name: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            id="cohort-start"
            type="date"
            value={draftCohort.start_date}
            onChange={e => setDraftCohort(prev => ({ ...prev, start_date: e.target.value }))}
          />
          <Input
            label="End Date"
            id="cohort-end"
            type="date"
            value={draftCohort.end_date}
            onChange={e => setDraftCohort(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>

        <Input
          label="Facilitator Name"
          id="facilitator"
          placeholder="e.g., Dr. Aminata Toure"
          value={draftCohort.facilitator_name}
          onChange={e => setDraftCohort(prev => ({ ...prev, facilitator_name: e.target.value }))}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-t2 tracking-wide uppercase">Upload Participant List (CSV)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-tempo-300 transition-colors cursor-pointer">
            <Upload size={20} className="mx-auto text-t3 mb-2" />
            <p className="text-sm text-t2 font-medium">Drop CSV file here</p>
            <p className="text-xs text-t3 mt-1">Columns: name, email, business_name, country</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-divider" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-t3 uppercase tracking-wide">Or paste emails</span>
          </div>
        </div>

        <Textarea
          label="Paste Email Addresses"
          id="emails-paste"
          placeholder="one@example.com&#10;two@example.com&#10;three@example.com"
          value={emailsPaste}
          onChange={e => setEmailsPaste(e.target.value)}
          rows={4}
        />

        {emailsPaste && (
          <div className="p-3 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs text-green-700 font-medium">
              {emailsPaste.split('\n').filter(e => e.trim().includes('@')).length} valid email addresses detected
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── Step 5: Settings ─────────────────────────────────────────────────────

  function renderStep5Settings() {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-base font-semibold text-t1 mb-1">Academy Settings</h3>
          <p className="text-sm text-t3">Configure community features and completion rules.</p>
        </div>

        {/* Community Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <MessageSquare size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-t1">Community Forum</p>
              <p className="text-xs text-t3">Enable discussion boards for participants to collaborate</p>
            </div>
          </div>
          <button
            onClick={() => updateDraft({ community_enabled: !draft.community_enabled })}
            className={cn(
              'w-11 h-6 rounded-full transition-all duration-200 relative',
              draft.community_enabled ? 'bg-tempo-600' : 'bg-gray-300'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
              draft.community_enabled ? 'left-[22px]' : 'left-0.5'
            )} />
          </button>
        </div>

        {/* Completion Rules */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-t1">Completion Rules</h4>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-t2 tracking-wide uppercase">
              Minimum Courses to Complete: {draft.completion_rules.min_courses}
            </label>
            <input
              type="range"
              min={1}
              max={Math.max(draft.curriculum_course_ids.length, 10)}
              value={draft.completion_rules.min_courses}
              onChange={e => updateDraft({
                completion_rules: { ...draft.completion_rules, min_courses: parseInt(e.target.value) }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-tempo-600"
            />
            <div className="flex justify-between text-xs text-t3">
              <span>1</span>
              <span>{Math.max(draft.curriculum_course_ids.length, 10)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-t1">Require Final Assessment</p>
              <p className="text-xs text-t3">Participants must pass a final assessment to complete</p>
            </div>
            <button
              onClick={() => updateDraft({
                completion_rules: { ...draft.completion_rules, require_assessment: !draft.completion_rules.require_assessment }
              })}
              className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 relative',
                draft.completion_rules.require_assessment ? 'bg-tempo-600' : 'bg-gray-300'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
                draft.completion_rules.require_assessment ? 'left-[22px]' : 'left-0.5'
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-t1">Issue Certificate on Completion</p>
              <p className="text-xs text-t3">Automatically generate and send a branded certificate</p>
            </div>
            <button
              onClick={() => updateDraft({
                completion_rules: { ...draft.completion_rules, require_certificate: !draft.completion_rules.require_certificate }
              })}
              className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 relative',
                draft.completion_rules.require_certificate ? 'bg-tempo-600' : 'bg-gray-300'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
                draft.completion_rules.require_certificate ? 'left-[22px]' : 'left-0.5'
              )} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 6: Review & Launch ──────────────────────────────────────────────

  function renderStep6Review() {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h3 className="text-base font-semibold text-t1 mb-1">Review & Launch</h3>
          <p className="text-sm text-t3">Review your academy configuration before going live.</p>
        </div>

        {/* Brand Summary */}
        <Card padding="none">
          <div className="h-20 flex items-center gap-4 px-6" style={{ backgroundColor: draft.brand_color }}>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">{draft.name?.charAt(0) || '?'}</span>
            </div>
            <div>
              <h4 className="text-white font-semibold">{draft.name || 'Untitled Academy'}</h4>
              <p className="text-white/70 text-xs">academy.tempo.com/{draft.slug || 'your-academy'}</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-t2">{draft.description || 'No description provided.'}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-canvas rounded-xl">
                <p className="text-lg font-bold text-t1">{draft.enrollment_type === 'public' ? 'Public' : 'Private'}</p>
                <p className="text-[0.65rem] text-t3 uppercase tracking-wider">Enrollment</p>
              </div>
              <div className="text-center p-3 bg-canvas rounded-xl">
                <p className="text-lg font-bold text-t1">{draft.curriculum_course_ids.length}</p>
                <p className="text-[0.65rem] text-t3 uppercase tracking-wider">Courses</p>
              </div>
              <div className="text-center p-3 bg-canvas rounded-xl">
                <p className="text-lg font-bold text-t1">{draft.languages.length}</p>
                <p className="text-[0.65rem] text-t3 uppercase tracking-wider">Languages</p>
              </div>
              <div className="text-center p-3 bg-canvas rounded-xl">
                <p className="text-lg font-bold text-t1">{draft.community_enabled ? 'Yes' : 'No'}</p>
                <p className="text-[0.65rem] text-t3 uppercase tracking-wider">Community</p>
              </div>
            </div>

            {/* Completion Rules */}
            <div className="p-4 bg-canvas rounded-xl space-y-2">
              <p className="text-xs font-medium text-t2 uppercase tracking-wide">Completion Rules</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">Min {draft.completion_rules.min_courses} courses</Badge>
                {draft.completion_rules.require_assessment && <Badge variant="warning">Assessment Required</Badge>}
                {draft.completion_rules.require_certificate && <Badge variant="success">Certificate Issued</Badge>}
              </div>
            </div>

            {/* Cohort info */}
            {draftCohort.name && (
              <div className="p-4 bg-canvas rounded-xl space-y-2">
                <p className="text-xs font-medium text-t2 uppercase tracking-wide">First Cohort</p>
                <p className="text-sm text-t1 font-medium">{draftCohort.name}</p>
                <p className="text-xs text-t3">
                  {draftCohort.start_date ? formatDate(draftCohort.start_date) : '--'} to{' '}
                  {draftCohort.end_date ? formatDate(draftCohort.end_date) : '--'}
                </p>
                {draftCohort.facilitator_name && (
                  <p className="text-xs text-t3">Facilitator: {draftCohort.facilitator_name}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Eye size={16} />
            Preview Participant View
          </Button>
        </div>

        {/* Preview Modal */}
        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Participant View Preview" size="lg">
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="h-32 flex items-center justify-center" style={{ backgroundColor: draft.brand_color }}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-3xl font-bold">{draft.name?.charAt(0) || '?'}</span>
                  </div>
                  <h3 className="text-white text-xl font-bold">{draft.name || 'Your Academy'}</h3>
                </div>
              </div>
              <div className="p-6 bg-white">
                <p className="text-sm text-t2 mb-4">{draft.welcome_message || 'Welcome to this academy!'}</p>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-t1">Your Courses</h4>
                  {draft.curriculum_course_ids.length > 0 ? (
                    draft.curriculum_course_ids.map((id, i) => (
                      <div key={id} className="flex items-center gap-3 p-3 bg-canvas rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-tempo-100 text-tempo-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm text-t1">{getCourseName(id)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-t3">No courses added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // ─── Render: Tab 3 — Programme Dashboard ──────────────────────────────────

  function renderDashboardTab() {
    if (academies.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-sm text-t3">Create an academy first to view the dashboard.</p>
        </div>
      )
    }

    const activeParticipants = academyParticipants.filter(p => p.status === 'active').length
    const completedParticipants = academyParticipants.filter(p => p.status === 'completed').length
    const communityPosts = selectedAcademy?.community_enabled ? Math.floor(Math.random() * 50 + 30) : 0
    const sessionsThisWeek = 3

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">Programme Dashboard</h2>
            <p className="text-sm text-t3 mt-0.5">Monitor performance and engagement</p>
          </div>
          <div className="w-64">
            <Select
              value={selectedAcademyId}
              onChange={e => setSelectedAcademyId(e.target.value)}
              options={academies.filter(a => a.status === 'active').map(a => ({
                value: a.id,
                label: a.name,
              }))}
              placeholder="Select Academy"
            />
          </div>
        </div>

        {selectedAcademy && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Total Enrolled"
                value={totalParticipantCount}
                icon={<Users size={18} />}
                change="+12 this week"
                changeType="positive"
              />
              <StatCard
                label="Active"
                value={activeParticipants}
                icon={<Activity size={18} />}
                change={`${Math.round((activeParticipants / Math.max(totalParticipantCount, 1)) * 100)}% of total`}
                changeType="neutral"
              />
              <StatCard
                label="Completion Rate"
                value={`${completionRate}%`}
                icon={<TrendingUp size={18} />}
                change="+3% vs last week"
                changeType="positive"
              />
              <StatCard
                label="Sessions This Week"
                value={sessionsThisWeek}
                icon={<Calendar size={18} />}
              />
              <StatCard
                label="Certificates"
                value={completedParticipants}
                icon={<Award size={18} />}
                change={`${completedParticipants} issued`}
                changeType="positive"
              />
              <StatCard
                label="Community Posts"
                value={communityPosts}
                icon={<MessageSquare size={18} />}
                change={communityPosts > 0 ? '+8 today' : 'Disabled'}
                changeType={communityPosts > 0 ? 'positive' : 'neutral'}
              />
            </div>

            {/* Cohort Health Table */}
            <Card padding="none">
              <CardHeader>
                <CardTitle>Cohort Health</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Cohort</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Enrolled</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Completion</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Avg Progress</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">At Risk</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Facilitator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAcademy.cohorts.map(cohort => {
                      const cohortParts = participants.filter(p => p.cohort_id === cohort.id)
                      const cohortCompletion = cohortParts.length > 0
                        ? Math.round((cohortParts.filter(p => p.status === 'completed').length / cohortParts.length) * 100)
                        : 0
                      const avgProgress = cohortParts.length > 0
                        ? Math.round(cohortParts.reduce((sum, p) => sum + p.progress, 0) / cohortParts.length)
                        : 0
                      const atRisk = cohortParts.filter(p => p.status === 'active' && daysSince(p.last_active) >= 7).length

                      return (
                        <tr key={cohort.id} className="border-b border-divider last:border-0 hover:bg-canvas/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-t1">{cohort.name}</p>
                            <p className="text-xs text-t3">{formatDate(cohort.start_date)} - {formatDate(cohort.end_date)}</p>
                          </td>
                          <td className="px-6 py-4">{renderStatusBadge(cohort.status)}</td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-t1">{cohort.participant_ids.length}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={cohortCompletion} size="sm" className="w-16" />
                              <span className="text-xs font-medium text-t2 tabular-nums">{cohortCompletion}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={avgProgress} size="sm" color="success" className="w-16" />
                              <span className="text-xs font-medium text-t2 tabular-nums">{avgProgress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {atRisk > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-error">
                                <AlertTriangle size={12} />
                                {atRisk}
                              </span>
                            ) : (
                              <span className="text-xs text-success font-medium">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar name={cohort.facilitator_name} size="xs" />
                              <span className="text-sm text-t1">{cohort.facilitator_name}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Two-Column: Engagement + Flagged */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-t1">Weekly Engagement</h3>
                  <p className="text-xs text-t3">Activity over the past 8 weeks</p>
                </div>
                <Badge variant="orange">Live Data</Badge>
              </div>
              <div className="h-48 flex items-end gap-3 px-2">
                {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((week, i) => {
                  const heights = [35, 52, 48, 65, 72, 68, 80, 75]
                  return (
                    <div key={week} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                        style={{
                          height: `${heights[i]}%`,
                          backgroundColor: selectedAcademy.brand_color,
                          opacity: i === 7 ? 1 : 0.6 + (i * 0.05),
                        }}
                      />
                      <span className="text-[0.6rem] text-t3 font-medium">{week}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card padding="none">
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-warning" />
                  <CardTitle>Flagged Participants</CardTitle>
                  {flaggedParticipants.length > 0 && (
                    <Badge variant="warning">{flaggedParticipants.length}</Badge>
                  )}
                </div>
              </CardHeader>
              {flaggedParticipants.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-success mb-2" />
                  <p className="text-sm text-t3">All participants are active. No one is flagged.</p>
                </div>
              ) : (
                <div className="divide-y divide-divider">
                  {flaggedParticipants.slice(0, 10).map(p => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-canvas/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-t1">{p.name}</p>
                          <p className="text-xs text-t3">{p.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-error font-medium">Inactive {daysSince(p.last_active)} days</p>
                          <p className="text-xs text-t3">Progress: {p.progress}%</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => sendNudge(p)}>
                          <Send size={12} />
                          Send Nudge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            </div>
          </>
        )}
      </div>
    )
  }

  // ─── Render: Tab 4 — Communications ────────────────────────────────────────

  function renderCommunicationsTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">Communications</h2>
            <p className="text-sm text-t3 mt-0.5">Manage automated triggers and broadcast messages</p>
          </div>
          <Button onClick={() => setBroadcastOpen(true)}>
            <Send size={16} />
            New Broadcast
          </Button>
        </div>

        {/* Automated Triggers */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-tempo-600" />
              <CardTitle>Automated Triggers</CardTitle>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {triggers.map(trigger => (
              <div key={trigger.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    trigger.enabled ? 'bg-tempo-50 text-tempo-600' : 'bg-gray-100 text-t3'
                  )}>
                    {trigger.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-t1">{trigger.name}</p>
                    <p className="text-xs text-t3">{trigger.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleTrigger(trigger.id)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-all duration-200 relative',
                    trigger.enabled ? 'bg-tempo-600' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
                    trigger.enabled ? 'left-[22px]' : 'left-0.5'
                  )} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Communication Log */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-t3" />
              <CardTitle>Communication Log</CardTitle>
              <Badge variant="default">{communications.length}</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Academy</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Recipients</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {communications.map(comm => (
                  <tr key={comm.id} className="border-b border-divider last:border-0 hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-t2">{formatDate(comm.sent_at)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={comm.type === 'broadcast' ? 'orange' : 'info'}>
                        {comm.type === 'broadcast' ? 'Broadcast' : 'Automated'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-t1 font-medium max-w-xs truncate">{comm.subject}</td>
                    <td className="px-6 py-3 text-sm text-t2">{getAcademyName(comm.academy_id)}</td>
                    <td className="px-6 py-3 text-sm text-t1 text-right font-medium">{comm.recipient_count}</td>
                    <td className="px-6 py-3">
                      <Badge variant={comm.status === 'sent' ? 'success' : comm.status === 'failed' ? 'error' : 'warning'}>
                        {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Broadcast Modal */}
        <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="New Broadcast" size="lg">
          <div className="space-y-4">
            <Select
              label="Academy"
              value={selectedAcademyId}
              onChange={e => setSelectedAcademyId(e.target.value)}
              options={academies.map(a => ({ value: a.id, label: a.name }))}
              placeholder="Select Academy"
            />

            <Select
              label="Recipients"
              value={broadcastRecipient}
              onChange={e => setBroadcastRecipient(e.target.value)}
              options={[
                { value: 'all', label: 'Full Cohort (All Participants)' },
                ...(selectedAcademy?.cohorts.map(c => ({
                  value: c.id,
                  label: `${c.name} (${c.participant_ids.length} participants)`,
                })) || []),
              ]}
              placeholder="Select Recipients"
            />

            <Input
              label="Subject"
              id="broadcast-subject"
              placeholder="e.g., Important Update: Schedule Change"
              value={broadcastSubject}
              onChange={e => setBroadcastSubject(e.target.value)}
            />

            <Textarea
              label="Message Body"
              id="broadcast-body"
              placeholder="Write your message to participants..."
              value={broadcastBody}
              onChange={e => setBroadcastBody(e.target.value)}
              rows={6}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
              <Button onClick={sendBroadcast} disabled={!broadcastSubject}>
                <Send size={16} />
                Send Broadcast
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // ─── Render: Tab 5 — Participants ──────────────────────────────────────────

  function renderParticipantsTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">Participants</h2>
            <p className="text-sm text-t3 mt-0.5">{participants.length} total participants across all academies</p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <Plus size={16} />
            Invite Participant
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name, email, or business..."
                value={participantSearch}
                onChange={e => setParticipantSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <div className="w-48">
              <Select
                value={participantFilterProgramme}
                onChange={e => setParticipantFilterProgramme(e.target.value)}
                options={[
                  { value: 'all', label: 'All Programmes' },
                  ...academies.map(a => ({ value: a.id, label: a.name })),
                ]}
                placeholder="Programme"
              />
            </div>
            <div className="w-40">
              <Select
                value={participantFilterStatus}
                onChange={e => setParticipantFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'dropped', label: 'Dropped' },
                ]}
                placeholder="Status"
              />
            </div>
          </div>
        </Card>

        {/* Participants Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Business</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Country</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Language</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Programme</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Cohort</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-t3 uppercase tracking-wider">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {allParticipantsFiltered.slice(0, 50).map(p => (
                  <tr key={p.id} className="border-b border-divider last:border-0 hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} size="xs" />
                        <span className="text-sm font-medium text-t1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-t2 max-w-[180px] truncate">{p.email}</td>
                    <td className="px-6 py-3 text-sm text-t2">{p.business_name}</td>
                    <td className="px-6 py-3 text-sm text-t2">{p.country}</td>
                    <td className="px-6 py-3 text-sm text-t2">{p.language}</td>
                    <td className="px-6 py-3 text-sm text-t2 max-w-[150px] truncate">{getAcademyName(p.academy_id)}</td>
                    <td className="px-6 py-3 text-sm text-t2">{getCohortName(p.academy_id, p.cohort_id)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={p.progress} size="sm" className="w-14" />
                        <span className="text-xs font-medium text-t2 tabular-nums w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">{renderStatusBadge(p.status)}</td>
                    <td className="px-6 py-3 text-sm text-t3">{formatDate(p.enrolled_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allParticipantsFiltered.length > 50 && (
            <div className="px-6 py-3 border-t border-divider text-center">
              <p className="text-xs text-t3">
                Showing 50 of {allParticipantsFiltered.length} participants
              </p>
            </div>
          )}
        </Card>

        {/* Invite Modal */}
        <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Participant">
          <div className="space-y-4">
            <Select
              label="Academy"
              value={selectedAcademyId}
              onChange={e => setSelectedAcademyId(e.target.value)}
              options={academies.map(a => ({ value: a.id, label: a.name }))}
              placeholder="Select Academy"
            />

            <Input
              label="Full Name"
              id="invite-name"
              placeholder="e.g., Kwame Asante"
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
            />

            <Input
              label="Email Address"
              id="invite-email"
              placeholder="kwame@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />

            <Input
              label="Business Name"
              id="invite-business"
              placeholder="e.g., Akwaba Foods Ltd"
              value={inviteBusiness}
              onChange={e => setInviteBusiness(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={inviteParticipant} disabled={!inviteName || !inviteEmail}>
                <Send size={16} />
                Send Invitation
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header
        title="Academies"
        subtitle="Create and manage learning programmes for external participants"
        actions={
          <Button onClick={openWizard}>
            <Plus size={16} />
            Create Academy
          </Button>
        }
      />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <Tabs
          tabs={tabs}
          active={activeTab}
          onChange={setActiveTab}
          maxVisible={5}
        />

        {activeTab === 'academies' && renderAcademiesList()}
        {activeTab === 'builder' && renderBuilderTab()}
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'communications' && renderCommunicationsTab()}
        {activeTab === 'participants' && renderParticipantsTab()}
      </div>

      {/* Wizard Modal (also accessible from Create button) */}
      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)} title="Create New Academy" size="xl">
        <div className="space-y-6">
          {/* Modal Stepper */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {wizardSteps.map((step, i) => (
              <button
                key={step.label}
                onClick={() => setWizardStep(i)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
                  wizardStep === i
                    ? 'bg-tempo-50 text-tempo-700'
                    : wizardStep > i
                    ? 'text-success'
                    : 'text-t3'
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold',
                  wizardStep === i ? 'bg-tempo-600 text-white' : wizardStep > i ? 'bg-success text-white' : 'bg-gray-200 text-t3'
                )}>
                  {wizardStep > i ? <Check size={10} /> : i + 1}
                </span>
                {step.label}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[280px]">
            {wizardStep === 0 && renderStep1Brand()}
            {wizardStep === 1 && renderStep2Enrollment()}
            {wizardStep === 2 && renderStep3Curriculum()}
            {wizardStep === 3 && renderStep4Cohorts()}
            {wizardStep === 4 && renderStep5Settings()}
            {wizardStep === 5 && renderStep6Review()}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-divider">
            <Button
              variant="ghost"
              onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
              disabled={wizardStep === 0}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {wizardStep === wizardSteps.length - 1 ? (
                <>
                  <Button variant="secondary" onClick={() => saveAcademy('draft')}>
                    Save as Draft
                  </Button>
                  <Button onClick={() => saveAcademy('active')}>
                    <Rocket size={16} />
                    Launch Academy
                  </Button>
                </>
              ) : (
                <Button onClick={() => setWizardStep(Math.min(wizardSteps.length - 1, wizardStep + 1))}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
