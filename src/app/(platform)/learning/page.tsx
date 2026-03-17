'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { GraduationCap, BookOpen, Award, Plus, Clock, Sparkles, Radio, Route, Video, Zap, Users as UsersIcon, FileText, CheckCircle, MessageSquare, Trophy, Heart, Hash, Download, Play, HelpCircle, AlignLeft, ListChecks, PenTool, Search, Star, Shield, Lock, ArrowRight, Filter, Medal, Upload, BarChart3, Settings, Target, TrendingUp, AlertTriangle, Brain, Eye, UserCheck, Briefcase, ChevronRight, CalendarClock, ShieldCheck, Activity, Layers, Globe, Building2, X, Image, Code, Minus, Quote, ChevronDown, GripVertical, Copy, Trash2, Move, Type, LayoutGrid, Send, MousePointerClick } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIScoreBadge, AIPulse } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { analyzeSkillGaps, predictCourseCompletion, generateCourseOutline, suggestLearningPathOrder, generateQuizQuestions, translateContent, calculateLearningROI } from '@/lib/ai-engine'
import type { AIInsight } from '@/lib/ai-engine'
import { aiBuilderTemplates } from '@/lib/demo-data'
import { cn } from '@/lib/utils/cn'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { CoursePlayer } from '@/components/learning/course-player'
import { CertificateDesigner, CertificatePreview } from '@/components/learning/certificate-designer'
import { ContentProviders } from '@/components/learning/content-providers'
import { ScormPlayer } from '@/components/learning/scorm-player'
import Programs from '@/components/learning/programs'
import ScenarioCards from '@/components/learning/scenario-cards'
import SmartReviews from '@/components/learning/smart-reviews'
import InPersonEvents from '@/components/learning/in-person-events'
import VersionHistory from '@/components/learning/version-history'
import { ExpandableStats } from '@/components/ui/expandable-stats'

export default function LearningPage() {
  const { courses, enrollments, learningPaths, liveSessions, courseBlocks, quizQuestions, discussions, studyGroups, complianceTraining, autoEnrollRules, assessmentAttempts, learningAssignments, coursePrerequisites, scormPackages, scormTracking, contentLibrary, learnerBadges, learnerPoints, certificateTemplates, employees, departments, reviews, goals, addCourse, updateCourse, addEnrollment, updateEnrollment, addLearningPath, addLiveSession, addCourseBlock, updateCourseBlock, deleteCourseBlock, addQuizQuestion, updateQuizQuestion, deleteQuizQuestion, addDiscussion, updateDiscussion, addStudyGroup, updateStudyGroup, addComplianceTraining, updateComplianceTraining, addAutoEnrollRule, updateAutoEnrollRule, deleteAutoEnrollRule, addAssessmentAttempt, updateAssessmentAttempt, addLearningAssignment, updateLearningAssignment, addCoursePrerequisite, deleteCoursePrerequisite, addScormPackage, updateScormPackage, addContentLibraryItem, addLearnerBadge, addLearnerPoints, addCertificateTemplate, updateCertificateTemplate, getEmployeeName, getDepartmentName, currentEmployeeId, currentUser, addToast, ensureModulesLoaded, complianceRequirements, addComplianceRequirement, deleteComplianceRequirement } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['courses', 'enrollments', 'complianceRequirements'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [ensureModulesLoaded])

  const t = useTranslations('learning')
  const tc = useTranslations('common')
  const [activeTab, setActiveTab] = useState('home')

  // Catalog search & filter state
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategory, setCatalogCategory] = useState('all')
  const [catalogLevel, setCatalogLevel] = useState('all')
  const [catalogFormat, setCatalogFormat] = useState('all')

  // Certificate & rating state
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [certificateCourse, setCertificateCourse] = useState<{ title: string; employeeName: string; completedAt: string } | null>(null)

  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Leadership',
    duration_hours: 8,
    format: 'online' as string,
    level: 'beginner' as string,
    is_mandatory: false,
  })
  // Mass enrollment modal state
  const [enrollStep, setEnrollStep] = useState<1 | 2>(1)
  const [enrollMode, setEnrollMode] = useState<'individual' | 'department' | 'country' | 'level' | 'all'>('individual')
  const [enrollSearch, setEnrollSearch] = useState('')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(new Set())
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set())
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set())
  const [enrollCourseSearch, setEnrollCourseSearch] = useState('')
  const [enrollCourseCategory, setEnrollCourseCategory] = useState('all')
  const [enrollCourseLevel, setEnrollCourseLevel] = useState('all')
  const [selectedCourseId, setSelectedCourseId] = useState('')

  // AI Builder state
  const [showBuilderModal, setShowBuilderModal] = useState(false)
  const [builderForm, setBuilderForm] = useState({ topic: '', level: 'beginner' as string, duration: 8 })
  const [generatedOutline, setGeneratedOutline] = useState<ReturnType<typeof generateCourseOutline> | null>(null)

  // Live Session state
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    title: '', course_id: '', instructor: '', scheduled_at: '', duration_minutes: 60,
    type: 'webinar' as string, capacity: 50, meeting_url: '',
  })

  // Learning Path state
  const [showPathModal, setShowPathModal] = useState(false)
  const [pathForm, setPathForm] = useState({ title: '', description: '', course_ids: [] as string[], level: 'beginner' as string })

  // Course Builder state
  const [selectedBuilderCourse, setSelectedBuilderCourse] = useState<string>('')
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({ type: 'text' as string, title: '', content: '', duration_minutes: 10, module_index: 0, order: 0, status: 'draft' as string })

  // Articulate-style authoring state
  const [authoringMode, setAuthoringMode] = useState(false)
  const [showNewCourseFlow, setShowNewCourseFlow] = useState(false)
  const [newCourseForm, setNewCourseForm] = useState({ title: '', description: '', category: 'General', level: 'beginner' as string, cover_color: 'tempo' })
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [showBlockPicker, setShowBlockPicker] = useState<number | null>(null) // insert position index
  const [dragBlockId, setDragBlockId] = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // Quiz Builder state
  const [selectedQuizCourse, setSelectedQuizCourse] = useState<string>('')
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [questionForm, setQuestionForm] = useState({ type: 'multiple_choice' as string, question: '', options: ['', '', '', ''] as string[], correct_answer: '', points: 10, explanation: '', course_id: '' })
  const [showAIQuizModal, setShowAIQuizModal] = useState(false)
  const [aiQuizTopic, setAiQuizTopic] = useState('')
  const [aiQuizCount, setAiQuizCount] = useState(5)
  const [generatedQuestions, setGeneratedQuestions] = useState<ReturnType<typeof generateQuizQuestions> | null>(null)

  // Social Learning state
  const [socialSubTab, setSocialSubTab] = useState<'discussions' | 'groups' | 'leaderboard'>('discussions')
  const [showDiscussionModal, setShowDiscussionModal] = useState(false)
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '', course_id: '' as string | null, tags: '' })
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupForm, setGroupForm] = useState({ name: '', description: '', course_id: '', max_members: 10, meeting_frequency: 'biweekly' as string })

  // Course Detail View state
  const [courseDetailId, setCourseDetailId] = useState<string | null>(null)
  const courseDetail = courseDetailId ? courses.find((c: any) => c.id === courseDetailId) : null

  // Document upload state
  const [docUploadState, setDocUploadState] = useState<'idle' | 'parsing' | 'done'>('idle')
  const [docParsingProgress, setDocParsingProgress] = useState(0)
  const [docParsingStage, setDocParsingStage] = useState('')
  const [docDragOver, setDocDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedFileContent, setUploadedFileContent] = useState('')
  const docFileInputRef = useMemo(() => ({ current: null as HTMLInputElement | null }), [])
  const [parsedDocCourse, setParsedDocCourse] = useState<{
    title: string
    description: string
    modules: Array<{
      title: string
      lessons: Array<{ title: string; type: string; content: string; duration_minutes: number }>
      duration_minutes: number
    }>
    quizQuestions: Array<{ question: string; type: string; options: string[]; correct_answer: string; points: number }>
  } | null>(null)

  // Assessment state
  const [activeAssessment, setActiveAssessment] = useState<{ courseId: string; questionIndex: number; answers: Record<string, string>; startedAt: string } | null>(null)
  const [showAssessmentResult, setShowAssessmentResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null)

  // T5 #39: Course exemption state — persisted via compliance_requirements store
  const [showExemptionModal, setShowExemptionModal] = useState(false)
  const exemptions = useMemo(() => complianceRequirements.filter((r: any) => r.type === 'course_exemption' || r.requirementType === 'course_exemption'), [complianceRequirements])
  const [exemptionForm, setExemptionForm] = useState({ course_id: '', criteria_type: 'role' as string, criteria_value: '', reason: '' })

  function addExemption() {
    if (!exemptionForm.course_id || !exemptionForm.criteria_value) return
    addComplianceRequirement({
      type: 'course_exemption',
      requirementType: 'course_exemption',
      course_id: exemptionForm.course_id,
      criteria_type: exemptionForm.criteria_type,
      criteria_value: exemptionForm.criteria_value,
      reason: exemptionForm.reason,
      name: `Exempt ${exemptionForm.criteria_type}: ${exemptionForm.criteria_value}`,
      status: 'active',
    })
    setExemptionForm({ course_id: '', criteria_type: 'role', criteria_value: '', reason: '' })
    setShowExemptionModal(false)
    addToast('Exemption added')
  }

  function isExempt(employeeId: string, courseId: string) {
    const emp = employees.find(e => e.id === employeeId)
    if (!emp) return false
    return exemptions.some((ex: any) => {
      const exCourseId = ex.course_id || ex.courseId
      if (exCourseId !== courseId) return false
      const cType = ex.criteria_type || ex.criteriaType
      const cValue = ex.criteria_value || ex.criteriaValue
      if (cType === 'role' && emp.role === cValue) return true
      if (cType === 'country' && emp.country === cValue) return true
      if (cType === 'level' && emp.level === cValue) return true
      return false
    })
  }

  function removeExemption(id: string) {
    deleteComplianceRequirement(id)
    addToast('Exemption removed')
  }

  // Admin state
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState({ name: '', condition_type: 'department_join' as string, condition_value: '', action_type: 'enroll_course' as string, action_target_id: '', action_target_name: '', is_active: true })

  // Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ employee_id: '', course_id: '', reason: '', due_date: '' })

  // Compliance policy upload
  const [compliancePolicyState, setCompliancePolicyState] = useState<'idle' | 'parsing' | 'done'>('idle')

  // Content Library state
  const [librarySearch, setLibrarySearch] = useState('')
  const [libraryProvider, setLibraryProvider] = useState('all')
  const [libraryCategory, setLibraryCategory] = useState('all')
  const [libraryLevel, setLibraryLevel] = useState('all')
  const [libraryLanguage, setLibraryLanguage] = useState('all')
  const [showContentDetailModal, setShowContentDetailModal] = useState(false)
  const [selectedContentItem, setSelectedContentItem] = useState<typeof contentLibrary[number] | null>(null)

  // Course Player state
  const [playerEnrollmentId, setPlayerEnrollmentId] = useState<string | null>(null)
  const [playerCourseId, setPlayerCourseId] = useState<string | null>(null)

  function openPlayer(enrollmentId: string, courseId: string) {
    const enr = enrollments.find(e => e.id === enrollmentId)
    if (enr?.status === 'enrolled') {
      updateEnrollment(enrollmentId, { status: 'in_progress', progress: 5 })
    }
    setPlayerEnrollmentId(enrollmentId)
    setPlayerCourseId(courseId)
  }

  // Gamification state
  const [gamificationSubTab, setGamificationSubTab] = useState<'leaderboard' | 'badges' | 'points' | 'challenges'>('leaderboard')

  // Transcript state
  const [transcriptEmployee, setTranscriptEmployee] = useState('')
  const [transcriptDateFrom, setTranscriptDateFrom] = useState('')
  const [transcriptDateTo, setTranscriptDateTo] = useState('')
  const [transcriptCategory, setTranscriptCategory] = useState('all')

  // Prerequisites state
  const [showPrereqModal, setShowPrereqModal] = useState(false)
  const [prereqForm, setPrereqForm] = useState({ course_id: '', prerequisite_course_id: '', type: 'required' as string, minimum_score: '' })

  // SCORM upload state
  const [showScormUploadModal, setShowScormUploadModal] = useState(false)
  const [scormUploadCourse, setScormUploadCourse] = useState('')
  const [scormUploadVersion, setScormUploadVersion] = useState('scorm_2004')
  const [scormUploadProgress, setScormUploadProgress] = useState(0)
  const [scormUploadState, setScormUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle')

  // Certificate Designer state
  const [showCertDesigner, setShowCertDesigner] = useState(false)

  // Content Providers state
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set(['udemy_business', 'linkedin_learning']))
  const [providerItemCounts, setProviderItemCounts] = useState<Record<string, number>>({ udemy_business: 847, linkedin_learning: 612 })

  // Saving state for form submissions
  const [saving, setSaving] = useState(false)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; type: string; id: string; name: string }>({ show: false, type: '', id: '', name: '' })

  function confirmDelete(type: string, id: string, name: string) {
    setDeleteConfirm({ show: true, type, id, name })
  }

  function executeDelete() {
    const { type, id } = deleteConfirm
    if (type === 'block') deleteCourseBlock(id)
    else if (type === 'question') deleteQuizQuestion(id)
    else if (type === 'rule') deleteAutoEnrollRule(id)
    else if (type === 'prerequisite') deleteCoursePrerequisite(id)
    addToast(`${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} deleted`)
    setDeleteConfirm({ show: false, type: '', id: '', name: '' })
  }

  // SCORM Player state
  const [scormPlayerOpen, setScormPlayerOpen] = useState(false)
  const [scormPlayerPackage, setScormPlayerPackage] = useState<any>(null)

  // Download for Offline state
  const [downloadedCourses, setDownloadedCourses] = useState<Set<string>>(new Set())
  const [downloadingCourse, setDownloadingCourse] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Translate state
  const [translateLang, setTranslateLang] = useState('')
  const [translatingBlock, setTranslatingBlock] = useState<string | null>(null)

  // External Training Request state
  const [showExtReqModal, setShowExtReqModal] = useState(false)
  const [extRequests, setExtRequests] = useState<any[]>([])
  const [extReqForm, setExtReqForm] = useState({ title: '', provider: '', url: '', cost: '', justification: '', format: 'online' as string })
  const canApproveTraining = currentUser?.role === 'manager' || currentUser?.role === 'hrbp' || currentUser?.role === 'admin' || currentUser?.role === 'owner'

  // Seed course blocks for courses that don't have any (critical for course player)
  const [blocksSeeded, setBlocksSeeded] = useState(false)
  useEffect(() => {
    if (!blocksSeeded && courses.length > 0) {
      const coursesWithBlocks = new Set(courseBlocks.map((b: any) => b.course_id))
      const coursesNeedingBlocks = courses.filter((c: any) => !coursesWithBlocks.has(c.id))
      if (coursesNeedingBlocks.length > 0) {
        coursesNeedingBlocks.forEach((course: any) => {
          const cat = (course.category || 'General').toLowerCase()
          const modules = [
            { title: `Introduction to ${course.title}`, type: 'text', content: `Welcome to ${course.title}. ${course.description || 'This course will help you build essential skills and knowledge.'}`, duration: 15, module: 0, order: 0 },
            { title: 'Core Concepts & Fundamentals', type: 'video', content: `https://videos.tempo.com/${course.id}-fundamentals.mp4`, duration: 20, module: 0, order: 1 },
            { title: 'Key Principles & Best Practices', type: 'text', content: `This section covers the fundamental principles of ${cat}. You\'ll learn about industry standards, proven methodologies, and practical techniques that are used by leading organizations worldwide. Topics include strategic frameworks, analytical approaches, and implementation guidelines.`, duration: 25, module: 1, order: 0 },
            { title: 'Practical Application Workshop', type: 'interactive', content: `Hands-on exercise: Apply the concepts from ${course.title} to real-world scenarios. Work through case studies and practice problems.`, duration: 30, module: 1, order: 1 },
            { title: 'Advanced Topics & Case Studies', type: 'video', content: `https://videos.tempo.com/${course.id}-advanced.mp4`, duration: 25, module: 2, order: 0 },
            { title: 'Knowledge Check Quiz', type: 'quiz', content: '', duration: 15, module: 2, order: 1 },
            { title: 'Summary & Next Steps', type: 'text', content: `Congratulations on completing ${course.title}! You\'ve learned the key concepts, best practices, and practical applications. Continue your learning journey by exploring related courses in our catalog.`, duration: 10, module: 3, order: 0 },
            { title: 'Resources & Reference Guide', type: 'download', content: `https://docs.tempo.com/${course.id}-resources.pdf`, duration: 5, module: 3, order: 1 },
          ]
          modules.forEach(m => {
            addCourseBlock({
              course_id: course.id,
              module_index: m.module,
              order: m.order,
              type: m.type,
              title: m.title,
              content: m.content,
              duration_minutes: m.duration,
              status: 'published',
            })
          })
        })
      }
      setBlocksSeeded(true)
    }
  }, [blocksSeeded, courses.length, courseBlocks.length])

  // Seed live sessions when empty
  const [sessionsSeeded, setSessionsSeeded] = useState(false)
  useEffect(() => {
    if (!sessionsSeeded && liveSessions.length === 0 && courses.length > 0) {
      const now = new Date()
      const sessionData = [
        { title: 'New Hire Orientation Webinar', type: 'webinar', instructor: 'Sarah Johnson', capacity: 200, enrolled_count: 145, duration_minutes: 60, daysOffset: 2, status: 'upcoming' },
        { title: 'Quarterly Compliance Update', type: 'webinar', instructor: 'David Chen', capacity: 300, enrolled_count: 210, duration_minutes: 45, daysOffset: 5, status: 'upcoming' },
        { title: 'Leadership Workshop: Coaching Skills', type: 'workshop', instructor: 'Maria Santos', capacity: 30, enrolled_count: 28, duration_minutes: 120, daysOffset: 7, status: 'upcoming' },
        { title: 'Tech Talk: AI in Banking', type: 'webinar', instructor: 'James Okafor', capacity: 150, enrolled_count: 89, duration_minutes: 60, daysOffset: 10, status: 'upcoming' },
        { title: 'Expert Q&A: Risk Management', type: 'q_and_a', instructor: 'Priya Sharma', capacity: 100, enrolled_count: 65, duration_minutes: 45, daysOffset: 14, status: 'upcoming' },
      ]
      sessionData.forEach((s, i) => {
        const scheduledAt = new Date(now)
        scheduledAt.setDate(scheduledAt.getDate() + s.daysOffset)
        scheduledAt.setHours(10 + i, 0, 0, 0)
        addLiveSession({
          course_id: courses[i % courses.length]?.id || courses[0]?.id,
          title: s.title,
          instructor: s.instructor,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: s.duration_minutes,
          type: s.type,
          capacity: s.capacity,
          enrolled_count: s.enrolled_count,
          meeting_url: `https://meet.tempo.com/session-${i + 1}`,
          status: s.status,
        })
      })
      setSessionsSeeded(true)
    }
  }, [sessionsSeeded, liveSessions.length, courses.length])

  // Seed learning paths when empty
  const [pathsSeeded, setPathsSeeded] = useState(false)
  useEffect(() => {
    if (!pathsSeeded && learningPaths.length === 0 && courses.length >= 3) {
      const pathData = [
        { title: 'New Manager Essentials', description: 'Essential skills and knowledge for first-time managers covering leadership, communication, and team management', level: 'intermediate', courseCount: 3, estimatedHours: 40 },
        { title: 'Compliance Mastery', description: 'Mandatory compliance training pathway covering all regulatory requirements', level: 'beginner', courseCount: 2, estimatedHours: 12 },
        { title: 'Digital Transformation Specialist', description: 'Advanced pathway for employees leading digital initiatives and technology adoption', level: 'advanced', courseCount: 3, estimatedHours: 36 },
        { title: 'Customer Excellence Track', description: 'Build world-class customer service skills from foundational to advanced levels', level: 'intermediate', courseCount: 2, estimatedHours: 20 },
      ]
      pathData.forEach((p, i) => {
        const courseIds = courses.slice(i * 2, i * 2 + p.courseCount).map((c: any) => c.id)
        if (courseIds.length > 0) {
          addLearningPath({
            title: p.title,
            description: p.description,
            course_ids: courseIds,
            estimated_hours: p.estimatedHours,
            level: p.level,
          })
        }
      })
      setPathsSeeded(true)
    }
  }, [pathsSeeded, learningPaths.length, courses.length])

  // Seed quiz questions for demo
  const [quizSeeded, setQuizSeeded] = useState(false)
  useEffect(() => {
    if (!quizSeeded && quizQuestions.length === 0 && courses.length > 0) {
      const amlCourse = courses.find((c: any) => c.title?.toLowerCase().includes('aml')) || courses[0]
      if (amlCourse) {
        const questions = [
          { course_id: amlCourse.id, question: 'What does AML stand for?', options: JSON.stringify(['Anti-Money Laundering', 'Asset Management Liability', 'Annual Monetary Limit', 'Automated Money Ledger']), correct_answer: 'Anti-Money Laundering', points: 10, position: 1 },
          { course_id: amlCourse.id, question: 'Which is a red flag for money laundering?', options: JSON.stringify(['Regular payroll deposits', 'Structuring deposits below reporting thresholds', 'Paying utility bills', 'Receiving a tax refund']), correct_answer: 'Structuring deposits below reporting thresholds', points: 10, position: 2 },
          { course_id: amlCourse.id, question: 'What is the primary purpose of KYC?', options: JSON.stringify(['Marketing to customers', 'Verifying customer identity and assessing risk', 'Setting interest rates', 'Processing loan applications']), correct_answer: 'Verifying customer identity and assessing risk', points: 10, position: 3 },
          { course_id: amlCourse.id, question: 'Which body sets global AML standards?', options: JSON.stringify(['World Bank', 'IMF', 'FATF', 'WTO']), correct_answer: 'FATF', points: 10, position: 4 },
          { course_id: amlCourse.id, question: 'What is a Suspicious Activity Report (SAR)?', options: JSON.stringify(['Employee performance review', 'Report filed when transactions appear suspicious', 'Customer complaint form', 'Internal audit report']), correct_answer: 'Report filed when transactions appear suspicious', points: 10, position: 5 },
        ]
        questions.forEach(q => addQuizQuestion(q))
        setQuizSeeded(true)
      }
    }
  }, [quizSeeded, quizQuestions.length, courses.length])

  const tabs = [
    { id: 'home', label: t('tabHome') },
    { id: 'catalog', label: t('tabCourseCatalog'), count: courses.length },
    { id: 'enrollments', label: t('tabEnrollments'), count: enrollments.filter(e => e.status !== 'completed').length },
    { id: 'compliance', label: t('tabCompliance'), count: complianceTraining.length },
    { id: 'assessments', label: t('tabAssessments'), count: assessmentAttempts.length },
    { id: 'skills', label: t('tabSkillsMatrix') },
    { id: 'builder', label: t('aiBuilder'), count: aiBuilderTemplates.length },
    { id: 'sessions', label: t('liveSessions'), count: liveSessions.filter(s => s.status === 'upcoming').length },
    { id: 'paths', label: t('learningPaths'), count: learningPaths.length },
    { id: 'programs', label: 'Programs' },
    { id: 'analytics', label: t('tabAnalytics') },
    { id: 'admin', label: t('tabAdmin'), count: autoEnrollRules.filter(r => r.is_active).length },
    { id: 'course-builder', label: t('tabCourseBuilder'), count: courseBlocks.length },
    { id: 'quiz-builder', label: t('tabQuizBuilder'), count: quizQuestions.length },
    { id: 'social', label: t('tabSocialLearning'), count: discussions.length },
    { id: 'content-library', label: 'Content Library', count: contentLibrary.length },
    { id: 'gamification', label: 'Gamification', count: learnerBadges.length },
    { id: 'certifications', label: 'Certifications' },
    { id: 'adaptive', label: 'Adaptive Learning' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'external-training', label: 'External Training', count: extRequests.length },
    { id: 'scenarios', label: 'AI Scenarios' },
    { id: 'smart-reviews', label: 'Smart Reviews' },
    { id: 'events', label: 'Events' },
    { id: 'version-history', label: 'Version History' },
  ]

  // SeamlessHR-inspired: Certification tracking with expiration
  const certifications = useMemo(() => {
    return complianceTraining.filter(ct => ct.status === 'completed').map(ct => {
      const course = courses.find(c => c.id === ct.course_id)
      const completedDate = new Date(ct.deadline)
      const expiryDate = new Date(completedDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return {
        ...ct,
        courseTitle: course?.title || 'Unknown',
        completedDate: completedDate.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysUntilExpiry,
        status: daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry < 30 ? 'expiring_soon' : 'valid',
      }
    })
  }, [complianceTraining, courses])

  // Spaced repetition scores (simulated based on enrollment dates)
  const spacedRepetitionData = useMemo(() => {
    return enrollments.filter(e => e.status === 'completed').map(e => {
      const course = courses.find(c => c.id === e.course_id)
      const completedAt = e.completed_at ? new Date(e.completed_at) : new Date()
      const daysSince = Math.ceil((Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24))
      const retentionScore = Math.max(20, Math.round(100 * Math.exp(-0.02 * daysSince)))
      return {
        courseTitle: course?.title || 'Unknown',
        completedAt: completedAt.toISOString().split('T')[0],
        daysSince,
        retentionScore,
        needsReview: retentionScore < 60,
        nextReviewDate: new Date(Date.now() + (retentionScore > 80 ? 30 : retentionScore > 60 ? 14 : 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }
    }).sort((a, b) => a.retentionScore - b.retentionScore)
  }, [enrollments, courses])

  const completedCount = enrollments.filter(e => e.status === 'completed').length
  const inProgressCount = enrollments.filter(e => e.status === 'in_progress').length
  const totalHours = courses.reduce((a, c) => a + c.duration_hours, 0)
  const completionRate = enrollments.length > 0 ? Math.round(completedCount / enrollments.length * 100) : 0

  const skillGaps = useMemo(() => analyzeSkillGaps(courses, enrollments), [courses, enrollments])

  const skillCoverageInsight = useMemo(() => ({
    id: 'ai-skill-coverage',
    category: 'trend' as const,
    severity: 'info' as const,
    title: t('skillCoverageAnalysis'),
    description: t('skillCoverageDesc', { gapCount: skillGaps.length, avgCoverage: skillGaps.length > 0 ? Math.round(skillGaps.reduce((a, g) => a + g.coverage, 0) / skillGaps.length) : 0 }),
    confidence: 'high' as const,
    confidenceScore: 85,
    suggestedAction: t('skillCoverageAction'),
    module: 'learning',
  }), [skillGaps])

  const aiLearningInsights = useMemo((): AIInsight[] => {
    const roi = calculateLearningROI(enrollments, employees, reviews)
    const insights: AIInsight[] = []
    if (roi.performanceImprovementPct !== 0) {
      insights.push({
        id: 'ai-lrn-perf',
        category: 'trend',
        severity: roi.performanceImprovementPct > 5 ? 'positive' : roi.performanceImprovementPct < 0 ? 'warning' : 'info',
        title: `Performance ${roi.performanceImprovementPct > 0 ? 'Improvement' : 'Gap'}: ${roi.performanceImprovementPct > 0 ? '+' : ''}${roi.performanceImprovementPct}%`,
        description: roi.breakdown.find(b => b.metric === 'Performance Improvement')?.explanation || 'Learners show different performance ratings compared to non-learners.',
        confidence: roi.confidence,
        confidenceScore: roi.confidence === 'high' ? 85 : roi.confidence === 'medium' ? 65 : 40,
        suggestedAction: roi.performanceImprovementPct < 5 ? 'Increase course completion rates to improve ROI' : undefined,
        module: 'learning',
      })
    }
    if (roi.retentionImpactPct > 0) {
      insights.push({
        id: 'ai-lrn-retention',
        category: 'prediction',
        severity: roi.retentionImpactPct >= 10 ? 'positive' : 'info',
        title: `Retention Impact: +${roi.retentionImpactPct}%`,
        description: roi.breakdown.find(b => b.metric === 'Retention Impact')?.explanation || 'Training completion correlates with higher retention.',
        confidence: roi.confidence,
        confidenceScore: roi.confidence === 'high' ? 80 : roi.confidence === 'medium' ? 60 : 35,
        module: 'learning',
      })
    }
    if (roi.costPerLearner > 0) {
      insights.push({
        id: 'ai-lrn-cost',
        category: 'score',
        severity: roi.costPerLearner > 1000 ? 'warning' : 'info',
        title: `Cost per Learner: $${roi.costPerLearner.toLocaleString()}`,
        description: roi.breakdown.find(b => b.metric === 'Cost per Learner')?.explanation || 'Estimated training cost per active learner.',
        confidence: roi.confidence,
        confidenceScore: roi.confidence === 'high' ? 75 : roi.confidence === 'medium' ? 55 : 35,
        suggestedAction: roi.costPerLearner > 1000 ? 'Consider blended learning to reduce per-learner costs' : undefined,
        module: 'learning',
      })
    }
    // Add skill gap insights
    const lowCoverageGaps = skillGaps.filter(g => g.coverage < 50)
    if (lowCoverageGaps.length > 0) {
      insights.push({
        id: 'ai-lrn-gaps',
        category: 'alert',
        severity: lowCoverageGaps.length >= 3 ? 'warning' : 'info',
        title: `${lowCoverageGaps.length} Skill ${lowCoverageGaps.length === 1 ? 'Area' : 'Areas'} Below 50% Coverage`,
        description: `Categories with low coverage: ${lowCoverageGaps.slice(0, 3).map(g => g.category).join(', ')}. Consider adding more courses in these areas.`,
        confidence: 'high',
        confidenceScore: 90,
        suggestedAction: 'Create courses for underserved skill categories',
        module: 'learning',
      })
    }
    return insights
  }, [enrollments, employees, reviews, skillGaps])

  function submitCourse() {
    if (!courseForm.title.trim()) { addToast('Course title is required'); return }
    if (!courseForm.category.trim()) { addToast('Course category is required'); return }
    if (!courseForm.duration_hours || courseForm.duration_hours <= 0) { addToast('Duration must be greater than 0'); return }
    setSaving(true)
    addCourse(courseForm)
    setShowCourseModal(false)
    setCourseForm({ title: '', description: '', category: 'Leadership', duration_hours: 8, format: 'online', level: 'beginner', is_mandatory: false })
    setSaving(false)
  }

  // Mass enrollment helpers
  function toggleSetItem<T>(set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
    setter(prev => { const next = new Set(prev); if (next.has(item)) next.delete(item); else next.add(item); return next })
  }
  function toggleEmployeeSelection(empId: string) {
    setSelectedEmployeeIds(prev => { const next = new Set(prev); if (next.has(empId)) next.delete(empId); else next.add(empId); return next })
  }
  function resetEnrollModal() {
    setShowEnrollModal(false); setEnrollStep(1); setEnrollMode('individual')
    setEnrollSearch(''); setSelectedEmployeeIds(new Set()); setSelectedDepartments(new Set())
    setSelectedCountries(new Set()); setSelectedLevels(new Set())
    setEnrollCourseSearch(''); setEnrollCourseCategory('all'); setEnrollCourseLevel('all'); setSelectedCourseId('')
  }
  function submitMassEnrollment() {
    if (!selectedCourseId) { addToast('Please select a course for enrollment'); return }
    if (newEnrollees.length === 0) { addToast('Please select at least one employee to enroll'); return }
    setSaving(true)
    newEnrollees.forEach(emp => {
      addEnrollment({ employee_id: emp.id, course_id: selectedCourseId, status: 'enrolled', progress: 0 })
    })
    const courseName = courses.find(c => c.id === selectedCourseId)?.title || ''
    addToast(t('massEnrollSuccess', { count: newEnrollees.length, course: courseName }))
    resetEnrollModal()
    setSaving(false)
  }

  function handleEnroll(courseId: string) {
    addEnrollment({ employee_id: currentEmployeeId, course_id: courseId, status: 'enrolled', progress: 0 })
  }

  // External Training Request handlers
  function submitExtRequest() {
    if (!extReqForm.title || !extReqForm.provider) return
    setExtRequests(prev => [...prev, {
      id: crypto.randomUUID(),
      employee_id: currentEmployeeId,
      employee_name: getEmployeeName(currentEmployeeId),
      ...extReqForm,
      cost: extReqForm.cost ? Number(extReqForm.cost) : 0,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }])
    setShowExtReqModal(false)
    setExtReqForm({ title: '', provider: '', url: '', cost: '', justification: '', format: 'online' })
    addToast('External training request submitted')
  }
  function approveExtRequest(id: string, nextStatus: string) {
    setExtRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      if (nextStatus === 'approved') {
        addCourse({ title: r.title, description: `External: ${r.provider}`, category: 'External', duration_hours: 8, format: r.format, level: 'intermediate', is_mandatory: false })
        addEnrollment({ employee_id: r.employee_id, course_id: crypto.randomUUID(), status: 'enrolled', progress: 0 })
        addToast(`Course "${r.title}" created and employee enrolled`)
      }
      return { ...r, status: nextStatus, [`${nextStatus}_at`]: new Date().toISOString() }
    }))
  }
  function rejectExtRequest(id: string) {
    setExtRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
    addToast('External training request rejected')
  }

  function handleStartEnrollment(enrollmentId: string) {
    updateEnrollment(enrollmentId, { status: 'in_progress', progress: 10 })
  }

  function handleCompleteEnrollment(enrollmentId: string) {
    updateEnrollment(enrollmentId, { status: 'completed', progress: 100, completed_at: new Date().toISOString() })
  }

  // Certificate auto-issuance + gamification on course completion
  function handleCourseCompleted(courseId: string) {
    const course = courses.find(c => c.id === courseId)
    if (!course) return
    const employeeName = getEmployeeName(currentEmployeeId)
    const completedAt = new Date().toISOString()

    // Auto-generate certificate
    const template = certificateTemplates.length > 0 ? certificateTemplates[0] : null
    addCertificateTemplate({
      name: `${course.title} — ${employeeName}`,
      layout: (template as any)?.layout || 'modern',
      accentColor: (template as any)?.accentColor || '#f97316',
      borderStyle: (template as any)?.borderStyle || 'simple',
      showLogo: true,
      showSeal: true,
      signatory1: (template as any)?.signatory1 || 'Chief Learning Officer',
      signatory1Title: (template as any)?.signatory1Title || 'Head of L&D',
      signatory2: (template as any)?.signatory2 || 'HR Director',
      signatory2Title: (template as any)?.signatory2Title || 'Human Resources',
      orgName: (template as any)?.orgName || 'Tempo Platform',
      fontFamily: (template as any)?.fontFamily || 'sans',
      course_id: courseId,
      employee_id: currentEmployeeId,
      employee_name: employeeName,
      course_title: course.title,
      completed_at: completedAt,
    })

    // Show certificate modal
    setCertificateCourse({ title: course.title, employeeName, completedAt })

    // Award gamification: 100 points for course completion
    addLearnerPoints({ employee_id: currentEmployeeId, points: 100, reason: `Completed: ${course.title}`, source: 'course_completion', source_id: courseId })

    // Count completed courses for badge logic
    const completedCourseCount = enrollments.filter(e => e.employee_id === currentEmployeeId && e.status === 'completed').length + 1 // +1 for current

    // "Course Completer" badge on every completion
    addLearnerBadge({ employee_id: currentEmployeeId, badge_name: 'Course Completer', badge_icon: 'trophy', badge_description: `Completed ${course.title}`, course_id: courseId })

    // "First Steps" badge on first course completion
    if (completedCourseCount === 1) {
      addLearnerBadge({ employee_id: currentEmployeeId, badge_name: 'First Steps', badge_icon: 'star', badge_description: 'Completed your first course!', course_id: courseId })
    }

    // "Learning Champion" badge at 5 completions
    if (completedCourseCount === 5) {
      addLearnerBadge({ employee_id: currentEmployeeId, badge_name: 'Learning Champion', badge_icon: 'medal', badge_description: 'Completed 5 courses!', course_id: courseId })
    }
  }

  // Gamification on quiz pass
  function handleQuizPassed(courseId: string, quizTitle: string, score: number) {
    addLearnerPoints({ employee_id: currentEmployeeId, points: 50, reason: `Quiz passed: ${quizTitle} (${score}%)`, source: 'quiz_pass', source_id: courseId })
  }

  // AI Writing Assistant state (Sana-inspired)
  const [aiWritingOpen, setAiWritingOpen] = useState(false)
  const [aiWritingText, setAiWritingText] = useState('')
  const [aiWritingResult, setAiWritingResult] = useState('')
  const [aiWritingLoading, setAiWritingLoading] = useState(false)
  const [aiWritingAction, setAiWritingAction] = useState('')

  // Certification tracking state (SeamlessHR-inspired)
  const [showCertModal, setShowCertModal] = useState(false)

  // AI-powered course generation (calls Claude API)
  const [aiGenerating, setAiGenerating] = useState(false)

  async function handleAiWritingAssist(action: string, text: string) {
    setAiWritingLoading(true)
    setAiWritingAction(action)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'demo' },
        body: JSON.stringify({ action: 'aiWritingAssist', data: { action, text } }),
      })
      const json = await res.json()
      if (json.result?.result) {
        setAiWritingResult(json.result.result)
      } else if (json.fallback) {
        // Fallback: simple deterministic transform
        if (action === 'shorten') setAiWritingResult(text.split('. ').slice(0, Math.ceil(text.split('. ').length / 2)).join('. ') + '.')
        else if (action === 'continue') setAiWritingResult(text + '\n\nFurthermore, this concept extends to practical applications in the workplace. Teams that embrace these principles see measurable improvements in both efficiency and employee satisfaction.')
        else setAiWritingResult(text)
      }
    } catch {
      setAiWritingResult(text)
    }
    setAiWritingLoading(false)
  }

  async function handleGenerateOutline() {
    if (!builderForm.topic) return
    setAiGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'demo' },
        body: JSON.stringify({ action: 'generateCourseContent', data: { topic: builderForm.topic, level: builderForm.level, duration_hours: builderForm.duration } }),
      })
      const json = await res.json()
      if (json.result?.modules) {
        setGeneratedOutline({
          title: json.result.title || builderForm.topic,
          description: json.result.description || `AI-generated course on ${builderForm.topic}`,
          level: builderForm.level,
          total_duration_hours: builderForm.duration,
          modules: json.result.modules.map((m: any) => ({
            title: m.title,
            duration_minutes: m.duration_minutes || Math.round((builderForm.duration * 60) / json.result.modules.length),
            lessons: m.lessons?.map((l: any) => typeof l === 'string' ? l : l.title) || [],
          })),
        })
      } else {
        // Fallback to deterministic generation
        const outline = generateCourseOutline(builderForm.topic, builderForm.level, builderForm.duration)
        setGeneratedOutline(outline)
      }
    } catch {
      const outline = generateCourseOutline(builderForm.topic, builderForm.level, builderForm.duration)
      setGeneratedOutline(outline)
    }
    setAiGenerating(false)
  }

  function handleSaveGeneratedCourse() {
    if (!generatedOutline) return
    const courseId = crypto.randomUUID()

    // 1. Create the course
    addCourse({
      id: courseId,
      title: generatedOutline.title,
      description: generatedOutline.description,
      category: 'AI Generated',
      duration_hours: generatedOutline.total_duration_hours,
      format: 'online',
      level: generatedOutline.level,
      is_mandatory: false,
    })

    // 2. Generate content blocks for each module's lessons
    generatedOutline.modules.forEach((mod, mi) => {
      const lessonTypes = ['text', 'video', 'text', 'interactive', 'quiz']
      mod.lessons.forEach((lessonTitle, li) => {
        const type = lessonTypes[li % lessonTypes.length]
        const durationPerLesson = Math.round(mod.duration_minutes / Math.max(mod.lessons.length, 1))
        addCourseBlock({
          course_id: courseId,
          module_index: mi,
          order: li,
          type,
          title: typeof lessonTitle === 'string' ? lessonTitle : (lessonTitle as any).title || `Lesson ${li + 1}`,
          content: type === 'text'
            ? `This lesson covers ${typeof lessonTitle === 'string' ? lessonTitle : 'the topic'}. You will learn key concepts, best practices, and practical techniques.\n\n**Learning Objectives:**\n• Understand the core principles\n• Apply concepts to real-world scenarios\n• Evaluate different approaches and their trade-offs`
            : type === 'video'
            ? `https://videos.tempo.com/ai-courses/${courseId}/module-${mi + 1}-lesson-${li + 1}.mp4`
            : type === 'interactive'
            ? `**Hands-on Exercise**\n\nApply what you've learned about ${typeof lessonTitle === 'string' ? lessonTitle : 'this topic'} through this practical activity.\n\n1. Review the scenario presented\n2. Identify the key challenges\n3. Propose your solution\n4. Compare with best practices`
            : '',
          duration_minutes: durationPerLesson,
          status: 'published',
        })
      })
    })

    // 3. Generate quiz questions
    generatedOutline.modules.forEach((mod, mi) => {
      addQuizQuestion({
        course_id: courseId,
        question: `What is the most important aspect of ${mod.title.replace(/^Module \d+:\s*/, '')}?`,
        type: 'multiple_choice',
        options: ['Understanding fundamentals', 'Practical application', 'Both understanding and application', 'Neither'],
        correct_answer: 'Both understanding and application',
        points: 10,
      })
      addQuizQuestion({
        course_id: courseId,
        question: `${mod.title.replace(/^Module \d+:\s*/, '')} is only relevant in theoretical contexts.`,
        type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'False',
        points: 5,
      })
    })

    const totalLessons = generatedOutline.modules.reduce((a, m) => a + m.lessons.length, 0)
    addToast(`Course "${generatedOutline.title}" created with ${totalLessons} lessons — opening in Studio`)
    setShowBuilderModal(false)
    setGeneratedOutline(null)
    setBuilderForm({ topic: '', level: 'beginner', duration: 8 })
    // Switch to Course Studio and select the new course for editing
    setTimeout(() => {
      setSelectedBuilderCourse(courseId)
      setAuthoringMode(true)
      setActiveTab('course-builder')
    }, 200)
  }

  function submitSession() {
    if (!sessionForm.title.trim()) { addToast('Session title is required'); return }
    if (!sessionForm.course_id) { addToast('Please select a course for this session'); return }
    if (!sessionForm.instructor.trim()) { addToast('Instructor name is required'); return }
    if (!sessionForm.scheduled_at) { addToast('Scheduled date/time is required'); return }
    setSaving(true)
    addLiveSession({
      ...sessionForm,
      enrolled_count: 0,
      status: 'upcoming',
    })
    setShowSessionModal(false)
    setSessionForm({ title: '', course_id: '', instructor: '', scheduled_at: '', duration_minutes: 60, type: 'webinar', capacity: 50, meeting_url: '' })
    setSaving(false)
  }

  function submitPath() {
    if (!pathForm.title.trim()) { addToast('Learning path title is required'); return }
    if (pathForm.course_ids.length === 0) { addToast('Please add at least one course to the learning path'); return }
    setSaving(true)
    const selectedCourses = courses.filter(c => pathForm.course_ids.includes(c.id))
    addLearningPath({
      ...pathForm,
      estimated_hours: selectedCourses.reduce((a, c) => a + c.duration_hours, 0),
    })
    setShowPathModal(false)
    setPathForm({ title: '', description: '', course_ids: [], level: 'beginner' })
    setSaving(false)
  }

  function toggleCourseInPath(courseId: string) {
    setPathForm(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId],
    }))
  }

  // Course Builder handlers
  function submitBlock() {
    if (!selectedBuilderCourse) { addToast('Please select a course first'); return }
    if (!blockForm.title.trim()) { addToast('Block title is required'); return }
    setSaving(true)
    addCourseBlock({ ...blockForm, course_id: selectedBuilderCourse })
    setShowBlockModal(false)
    setBlockForm({ type: 'text', title: '', content: '', duration_minutes: 10, module_index: 0, order: 0, status: 'draft' })
    setSaving(false)
  }

  // Quiz Builder handlers
  function submitQuestion() {
    if (!questionForm.question.trim()) { addToast('Question text is required'); return }
    const filledOptions = questionForm.options.filter(o => o.trim())
    if (filledOptions.length < 2) { addToast('Please provide at least 2 answer options'); return }
    setSaving(true)
    addQuizQuestion({ ...questionForm, course_id: selectedQuizCourse || questionForm.course_id })
    setShowQuestionModal(false)
    setQuestionForm({ type: 'multiple_choice', question: '', options: ['', '', '', ''], correct_answer: '', points: 10, explanation: '', course_id: '' })
    setSaving(false)
  }

  function handleGenerateQuiz() {
    if (!aiQuizTopic) return
    const questions = generateQuizQuestions(aiQuizTopic, aiQuizCount)
    setGeneratedQuestions(questions)
  }

  function handleAddGeneratedToBank() {
    if (!generatedQuestions) return
    generatedQuestions.forEach(q => {
      addQuizQuestion({ ...q, course_id: selectedQuizCourse })
    })
    setShowAIQuizModal(false)
    setGeneratedQuestions(null)
    setAiQuizTopic('')
  }

  // Social Learning handlers
  function submitDiscussion() {
    if (!discussionForm.title || !discussionForm.content) return
    addDiscussion({ ...discussionForm, author_id: currentEmployeeId, tags: discussionForm.tags.split(',').map(t => t.trim()).filter(Boolean), course_id: discussionForm.course_id || null })
    setShowDiscussionModal(false)
    setDiscussionForm({ title: '', content: '', course_id: '', tags: '' })
  }

  function submitStudyGroup() {
    if (!groupForm.name) return
    addStudyGroup({ ...groupForm, member_ids: [currentEmployeeId], created_by: currentEmployeeId })
    setShowGroupModal(false)
    setGroupForm({ name: '', description: '', course_id: '', max_members: 10, meeting_frequency: 'biweekly' })
  }

  function handleLikeDiscussion(id: string) {
    const disc = discussions.find(d => d.id === id)
    if (disc) updateDiscussion(id, { likes: (disc.likes || 0) + 1 })
  }

  function handleJoinGroup(id: string) {
    const group = studyGroups.find(g => g.id === id)
    if (group && !group.member_ids.includes(currentEmployeeId)) {
      updateStudyGroup(id, { member_ids: [...group.member_ids, currentEmployeeId] })
    }
  }

  // Safe option text extractor — handles both string and {id, text} object formats
  const optText = (opt: any): string => typeof opt === 'string' ? opt : (opt?.text || opt?.label || String(opt))

  // Simple inline markdown renderer for block editor preview
  const renderMd = (text: string) => {
    if (!text) return null
    return text.split('\n').map((line, li) => {
      // Process inline formatting
      const parts: React.ReactNode[] = []
      let remaining = line
      let key = 0
      while (remaining.length > 0) {
        // Bold **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
        // Bullet points
        if (remaining.match(/^[•\-\*]\s/)) {
          parts.push(<span key={key++} className="inline-flex items-start gap-1.5"><span className="text-tempo-400 mt-px">•</span><span>{renderMdInline(remaining.replace(/^[•\-\*]\s/, ''))}</span></span>)
          remaining = ''
        } else if (remaining.match(/^\d+\.\s/)) {
          const num = remaining.match(/^(\d+)\.\s/)
          parts.push(<span key={key++} className="inline-flex items-start gap-1.5"><span className="text-tempo-400 font-medium">{num?.[1]}.</span><span>{renderMdInline(remaining.replace(/^\d+\.\s/, ''))}</span></span>)
          remaining = ''
        } else if (boldMatch && boldMatch.index !== undefined) {
          if (boldMatch.index > 0) parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>)
          parts.push(<strong key={key++} className="font-semibold text-t1">{boldMatch[1]}</strong>)
          remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
        } else {
          parts.push(<span key={key++}>{remaining}</span>)
          remaining = ''
        }
      }
      return <span key={li} className="block">{parts}</span>
    })
  }
  const renderMdInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>)
        parts.push(<strong key={key++} className="font-semibold text-t1">{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      } else {
        parts.push(<span key={key++}>{remaining}</span>)
        remaining = ''
      }
    }
    return parts
  }

  // Block type icon helper
  const blockTypeIcon = (type: string, size = 14) => {
    switch (type) {
      case 'text': return <AlignLeft size={size} />
      case 'video': return <Play size={size} />
      case 'quiz': return <HelpCircle size={size} />
      case 'interactive': return <ListChecks size={size} />
      case 'download': return <Download size={size} />
      case 'image': return <Image size={size} />
      case 'divider': return <Minus size={size} />
      case 'callout': return <Quote size={size} />
      case 'code': return <Code size={size} />
      case 'accordion': return <ChevronDown size={size} />
      case 'embed': return <Globe size={size} />
      case 'heading': return <Type size={size} />
      case 'columns': return <LayoutGrid size={size} />
      case 'infographic': return <BarChart3 size={size} />
      case 'button': return <MousePointerClick size={size} />
      default: return <FileText size={size} />
    }
  }

  // Block type categories for the block picker
  const BLOCK_CATEGORIES = [
    { label: 'Content', types: [
      { type: 'text', label: 'Text Block', desc: 'Rich text content with formatting' },
      { type: 'heading', label: 'Heading', desc: 'Section heading or title' },
      { type: 'image', label: 'Image', desc: 'Photo, illustration, or graphic' },
      { type: 'video', label: 'Video Embed', desc: 'YouTube, Vimeo, or uploaded video' },
      { type: 'callout', label: 'Callout / Tip', desc: 'Highlighted info, warning, or tip' },
    ]},
    { label: 'Interactive', types: [
      { type: 'quiz', label: 'Knowledge Check', desc: 'Multiple choice or true/false question' },
      { type: 'interactive', label: 'Interactive', desc: 'Sortable, flashcard, or scenario' },
      { type: 'accordion', label: 'Accordion', desc: 'Expandable content sections' },
      { type: 'button', label: 'Button / CTA', desc: 'Clickable action button' },
    ]},
    { label: 'Layout', types: [
      { type: 'divider', label: 'Divider', desc: 'Visual separator between sections' },
      { type: 'columns', label: 'Two Columns', desc: 'Side-by-side content layout' },
      { type: 'infographic', label: 'Infographic', desc: 'Animated data visualization' },
    ]},
    { label: 'Resources', types: [
      { type: 'download', label: 'File Download', desc: 'Downloadable PDF, DOCX, or asset' },
      { type: 'embed', label: 'Web Embed', desc: 'External webpage or widget' },
      { type: 'code', label: 'Code Block', desc: 'Syntax-highlighted code snippet' },
    ]},
  ]

  // Handle creating a new course from scratch
  function handleCreateNewCourse() {
    if (!newCourseForm.title.trim()) { addToast('Course title is required'); return }
    const courseId = crypto.randomUUID()
    addCourse({
      id: courseId,
      title: newCourseForm.title,
      description: newCourseForm.description,
      category: newCourseForm.category,
      level: newCourseForm.level,
      format: 'online',
      duration_hours: 0,
      is_mandatory: false,
      status: 'draft',
    })
    setShowNewCourseFlow(false)
    setNewCourseForm({ title: '', description: '', category: 'General', level: 'beginner', cover_color: 'tempo' })
    // Immediately select the new course for editing
    setTimeout(() => {
      setSelectedBuilderCourse(courseId)
      setAuthoringMode(true)
      setEditingBlockId(null)
    }, 100)
  }

  // Insert a new block at a specific position
  function insertBlockAt(type: string, position: number) {
    if (!selectedBuilderCourse) return
    const defaultContent: Record<string, { title: string; content: string; duration: number }> = {
      text: { title: 'Text Block', content: 'Start writing your content here...', duration: 5 },
      heading: { title: 'Section Heading', content: 'New Section', duration: 1 },
      image: { title: 'Image', content: '{"url":"","alt":"Describe this image","caption":""}', duration: 2 },
      video: { title: 'Video', content: '{"url":"","caption":"Add a video URL (YouTube, Vimeo)"}', duration: 10 },
      callout: { title: 'Callout', content: '{"style":"info","text":"Add an important note, tip, or warning here."}', duration: 2 },
      quiz: { title: 'Knowledge Check', content: '{"question":"What did you learn?","options":["Option A","Option B","Option C","Option D"],"correct":0}', duration: 3 },
      interactive: { title: 'Interactive Activity', content: '{"type":"flashcard","items":[{"front":"Term","back":"Definition"}]}', duration: 5 },
      accordion: { title: 'Accordion', content: '{"sections":[{"heading":"Section 1","body":"Content here..."},{"heading":"Section 2","body":"More content..."}]}', duration: 3 },
      divider: { title: 'Divider', content: '{"style":"line"}', duration: 0 },
      columns: { title: 'Two Columns', content: '{"left":"Left column content...","right":"Right column content..."}', duration: 3 },
      infographic: { title: 'Infographic', content: '{"items":[{"label":"Metric 1","value":"85%"},{"label":"Metric 2","value":"120+"}]}', duration: 3 },
      download: { title: 'File Download', content: '{"filename":"resource.pdf","url":"","description":"Download this resource"}', duration: 1 },
      embed: { title: 'Web Embed', content: '{"url":"","height":400}', duration: 5 },
      code: { title: 'Code Block', content: '{"language":"javascript","code":"// Your code here\\nconsole.log(\\"Hello World\\");"}', duration: 3 },
      button: { title: 'Button', content: '{"label":"Learn More","url":"#","style":"primary"}', duration: 1 },
    }
    const def = defaultContent[type] || { title: 'Block', content: '', duration: 5 }
    // Reorder existing blocks that come after the insertion point
    const existing = filteredBlocks
    existing.filter(b => b.order >= position).forEach(b => {
      updateCourseBlock(b.id, { order: b.order + 1 })
    })
    addCourseBlock({
      course_id: selectedBuilderCourse,
      module_index: 0,
      order: position,
      type,
      title: def.title,
      content: def.content,
      duration_minutes: def.duration,
      status: 'draft',
    })
    setShowBlockPicker(null)
    setEditingBlockId(null)
  }

  // Move block via drag-and-drop
  function moveBlock(blockId: string, newOrder: number) {
    const block = filteredBlocks.find(b => b.id === blockId)
    if (!block || block.order === newOrder) return
    const oldOrder = block.order
    filteredBlocks.forEach(b => {
      if (b.id === blockId) return
      if (oldOrder < newOrder) {
        // Moving down: shift items between old+1 and new up by 1
        if (b.order > oldOrder && b.order <= newOrder) updateCourseBlock(b.id, { order: b.order - 1 })
      } else {
        // Moving up: shift items between new and old-1 down by 1
        if (b.order >= newOrder && b.order < oldOrder) updateCourseBlock(b.id, { order: b.order + 1 })
      }
    })
    updateCourseBlock(blockId, { order: newOrder })
    setDragBlockId(null)
    setDragOverIdx(null)
  }

  // Publish all blocks at once
  function publishAllBlocks() {
    filteredBlocks.forEach(b => {
      if (b.status !== 'published') updateCourseBlock(b.id, { status: 'published' })
    })
    if (selectedBuilderCourse) {
      const totalMinutes = filteredBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0)
      updateCourse(selectedBuilderCourse, { status: 'published', duration_hours: Math.max(1, Math.round(totalMinutes / 60)) })
    }
    addToast('Course published successfully!')
  }

  // Export course as SCORM 1.2 package (HTML download)
  function exportScormPackage() {
    if (!selectedBuilderCourse) return
    const course = courses.find(c => c.id === selectedBuilderCourse)
    if (!course) return
    const blocks = filteredBlocks.sort((a, b) => a.order - b.order)

    // Build course HTML content
    const blockHtml = blocks.map(block => {
      let parsed: any = {}
      try { parsed = JSON.parse(block.content || '{}') } catch { parsed = { text: block.content || '' } }
      const mdToHtml = (text: string) => (text || '')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-\*]\s(.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>')

      switch (block.type) {
        case 'heading': return `<h2 style="font-size:1.5rem;font-weight:700;border-bottom:2px solid #ea580c;padding-bottom:0.5rem;margin:2rem 0 1rem">${block.content || block.title}</h2>`
        case 'text': return `<div style="margin:1.5rem 0"><h3 style="font-weight:600;margin-bottom:0.5rem">${block.title}</h3><div style="line-height:1.8">${mdToHtml(block.content || '')}</div></div>`
        case 'image': return parsed.url ? `<div style="margin:1.5rem 0;text-align:center"><img src="${parsed.url}" alt="${parsed.alt || ''}" style="max-width:100%;border-radius:8px">${parsed.caption ? `<p style="font-size:0.85rem;color:#888;margin-top:0.5rem"><em>${parsed.caption}</em></p>` : ''}</div>` : `<div style="margin:1.5rem 0;padding:2rem;background:#f0f4ff;border-radius:8px;text-align:center;color:#64748b">[Image: ${block.title}]</div>`
        case 'callout': return `<div style="margin:1.5rem 0;padding:1rem 1.5rem;border-left:4px solid ${parsed.style === 'warning' ? '#f59e0b' : parsed.style === 'important' ? '#ef4444' : parsed.style === 'tip' ? '#22c55e' : '#3b82f6'};background:${parsed.style === 'warning' ? '#fffbeb' : parsed.style === 'important' ? '#fef2f2' : parsed.style === 'tip' ? '#f0fdf4' : '#eff6ff'};border-radius:8px"><strong style="text-transform:uppercase;font-size:0.75rem;letter-spacing:0.05em">${parsed.style || 'info'}</strong><div style="margin-top:0.5rem">${mdToHtml(parsed.text || '')}</div></div>`
        case 'quiz': return `<div style="margin:1.5rem 0;padding:1.5rem;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px"><h3 style="font-weight:600">Quiz: ${block.title}</h3><p style="margin:0.75rem 0">${parsed.question || ''}</p>${(parsed.options || []).map((o: string, i: number) => `<div style="padding:0.5rem;margin:0.25rem 0;background:${parsed.correct === i ? '#dcfce7' : '#f9fafb'};border-radius:4px">${String.fromCharCode(65 + i)}. ${o}</div>`).join('')}</div>`
        case 'accordion': return `<div style="margin:1.5rem 0">${(parsed.sections || []).map((s: any) => `<details style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:0.5rem"><summary style="padding:0.75rem 1rem;font-weight:600;cursor:pointer">${s.heading}</summary><div style="padding:0.75rem 1rem;border-top:1px solid #e5e7eb">${mdToHtml(s.body || '')}</div></details>`).join('')}</div>`
        case 'columns': return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin:1.5rem 0"><div style="padding:1rem;background:#f9fafb;border-radius:8px">${mdToHtml(parsed.left || '')}</div><div style="padding:1rem;background:#f9fafb;border-radius:8px">${mdToHtml(parsed.right || '')}</div></div>`
        case 'code': return `<pre style="margin:1.5rem 0;background:#1e1e1e;color:#4ec9b0;padding:1.25rem;border-radius:8px;overflow-x:auto;font-family:monospace"><code>${(parsed.code || '').replace(/</g, '&lt;')}</code></pre>`
        case 'divider': return `<hr style="margin:2rem auto;border:none;border-top:2px solid #e5e7eb;max-width:200px">`
        case 'download': return `<div style="margin:1.5rem 0;padding:1rem;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:1rem"><span style="font-size:1.5rem">📥</span><div><strong>${parsed.filename || 'resource.pdf'}</strong><br><small style="color:#888">${parsed.description || ''}</small></div></div>`
        case 'button': return `<div style="text-align:center;margin:2rem 0"><a href="${parsed.url || '#'}" style="display:inline-block;padding:0.75rem 2rem;background:#ea580c;color:white;border-radius:8px;text-decoration:none;font-weight:600">${parsed.label || 'Continue'}</a></div>`
        case 'embed': return parsed.url ? `<iframe src="${parsed.url}" style="width:100%;height:${parsed.height || 400}px;border:none;border-radius:8px;margin:1.5rem 0"></iframe>` : ''
        default: return `<div style="margin:1.5rem 0"><h3>${block.title}</h3><p>${block.content || ''}</p></div>`
      }
    }).join('\n')

    const imsmanifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course-${selectedBuilderCourse}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org-1">
    <organization identifier="org-1"><title>${(course.title || 'Course').replace(/[<>&]/g, '')}</title>
      <item identifier="item-1" identifierref="res-1"><title>${(course.title || 'Course').replace(/[<>&]/g, '')}</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`

    const scormApi = `var API={LMSInitialize:function(){return"true"},LMSFinish:function(){return"true"},LMSGetValue:function(e){return""},LMSSetValue:function(e,v){return"true"},LMSCommit:function(){return"true"},LMSGetLastError:function(){return"0"},LMSGetErrorString:function(){return""},LMSGetDiagnostic:function(){return""}};`

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${(course.title || 'Course').replace(/[<>&]/g, '')}</title>
<script>${scormApi}<\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;background:#f9fafb}
.container{max-width:800px;margin:0 auto;padding:2rem}
.header{background:linear-gradient(135deg,#ea580c,#c2410c);color:white;padding:3rem 2rem;border-radius:16px;margin-bottom:2rem;text-align:center}
.header h1{font-size:2rem;font-weight:800;margin-bottom:0.5rem}
.header p{opacity:0.9;font-size:0.95rem}
.content{background:white;border-radius:16px;padding:2.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
.progress-bar{position:sticky;top:0;z-index:10;background:white;padding:1rem 0;border-bottom:1px solid #e5e7eb;margin-bottom:1.5rem}
.progress-track{height:6px;background:#e5e7eb;border-radius:3px}
.progress-fill{height:100%;background:#ea580c;border-radius:3px;transition:width 0.3s;width:0%}
.nav{display:flex;justify-content:space-between;margin-top:2rem;padding-top:1.5rem;border-top:1px solid #e5e7eb}
.nav button{padding:0.5rem 1.5rem;border-radius:8px;border:1px solid #e5e7eb;background:white;cursor:pointer;font-size:0.9rem}
.nav button.primary{background:#ea580c;color:white;border:none}
.nav button:disabled{opacity:0.4;cursor:not-allowed}
li{list-style:none}
</style></head>
<body>
<div class="container">
<div class="header"><h1>${(course.title || 'Course').replace(/[<>&]/g, '')}</h1><p>${(course.description || '').replace(/[<>&]/g, '')}</p></div>
<div class="content">
<div class="progress-bar"><div class="progress-track"><div class="progress-fill" id="progress"></div></div></div>
${blockHtml}
</div>
</div>
<script>
window.onload=function(){
  if(typeof API!=='undefined')API.LMSInitialize('');
  var el=document.getElementById('progress');
  if(el)el.style.width='100%';
  if(typeof API!=='undefined'){API.LMSSetValue('cmi.core.lesson_status','completed');API.LMSCommit('');API.LMSFinish('');}
};
<\/script>
</body></html>`

    // Create a zip-like package using Blob. For true SCORM compliance, bundle manifest + HTML.
    // We'll provide both files as separate downloads wrapped in a single HTML that self-contains.
    // For simplicity, download as a standalone HTML SCORM player
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(course.title || 'Course').replace(/[^a-zA-Z0-9]/g, '-')}-SCORM.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Also download the manifest separately
    const manifestBlob = new Blob([imsmanifest], { type: 'application/xml' })
    const manifestUrl = URL.createObjectURL(manifestBlob)
    const b = document.createElement('a')
    b.href = manifestUrl
    b.download = 'imsmanifest.xml'
    document.body.appendChild(b)
    b.click()
    document.body.removeChild(b)
    URL.revokeObjectURL(manifestUrl)

    addToast('SCORM package exported — index.html + imsmanifest.xml downloaded')
  }

  // Duplicate a block
  function duplicateBlock(block: any) {
    addCourseBlock({
      course_id: block.course_id,
      module_index: block.module_index,
      order: block.order + 1,
      type: block.type,
      title: block.title + ' (copy)',
      content: block.content,
      duration_minutes: block.duration_minutes,
      status: 'draft',
    })
  }

  // Current employee info for personalized homepage
  const currentEmployee = employees.find(e => e.id === currentEmployeeId)
  const currentEmployeeName = currentEmployee?.profile.full_name.split(' ')[0] || 'Learner'
  const myEnrollments = useMemo(() => enrollments.filter(e => e.employee_id === currentEmployeeId), [enrollments, currentEmployeeId])
  const myInProgress = myEnrollments.filter(e => e.status === 'in_progress')
  const myCompleted = myEnrollments.filter(e => e.status === 'completed')
  const myAssessments = useMemo(() => assessmentAttempts.filter(a => a.employee_id === currentEmployeeId), [assessmentAttempts, currentEmployeeId])
  const myAssignments = useMemo(() => learningAssignments.filter(a => a.employee_id === currentEmployeeId), [learningAssignments, currentEmployeeId])

  // AI personalized recommendations (deterministic)
  const personalizedRecs = useMemo(() => {
    const notEnrolled = courses.filter(c => !enrollments.some(e => e.course_id === c.id && e.employee_id === currentEmployeeId))
    return notEnrolled.slice(0, 4).map((c, i) => ({
      ...c,
      reason: i === 0 ? 'performanceGap' : i === 1 ? 'careerPath' : i === 2 ? 'roleBased' : 'peerPopular',
    }))
  }, [courses, enrollments, currentEmployeeId])

  // Compliance computed data
  const complianceStats = useMemo(() => {
    const mandatoryCourses = courses.filter(c => c.is_mandatory)
    const allEmployeeCount = employees.length
    const mandatoryEnrollments = enrollments.filter(e => mandatoryCourses.some(c => c.id === e.course_id))
    const completedMandatory = mandatoryEnrollments.filter(e => e.status === 'completed')
    const complianceRate = allEmployeeCount > 0 && mandatoryCourses.length > 0
      ? Math.round((completedMandatory.length / (allEmployeeCount * mandatoryCourses.length)) * 100)
      : 0
    const overdueCount = complianceTraining.filter(ct => new Date(ct.deadline) < new Date()).length
    const upcomingCount = complianceTraining.filter(ct => {
      const d = new Date(ct.deadline)
      const now = new Date()
      return d > now && d < new Date(now.getTime() + 30 * 86400000)
    }).length
    return { complianceRate, mandatoryCount: mandatoryCourses.length, overdueCount, upcomingCount, totalRequired: allEmployeeCount * mandatoryCourses.length, totalCompleted: completedMandatory.length }
  }, [courses, enrollments, employees, complianceTraining])

  // Department compliance breakdown
  const deptCompliance = useMemo(() => {
    return departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department_id === dept.id)
      const mandatoryCourses = courses.filter(c => c.is_mandatory)
      const deptMandatoryEnrollments = enrollments.filter(e =>
        deptEmployees.some(emp => emp.id === e.employee_id) && mandatoryCourses.some(c => c.id === e.course_id)
      )
      const completed = deptMandatoryEnrollments.filter(e => e.status === 'completed').length
      const required = deptEmployees.length * mandatoryCourses.length
      return { department: dept.name, rate: required > 0 ? Math.round((completed / required) * 100) : 0, completed, required, employeeCount: deptEmployees.length }
    })
  }, [departments, employees, courses, enrollments])

  // Assessment center data
  const availableAssessments = useMemo(() => {
    return courses.filter(c => quizQuestions.some(q => q.course_id === c.id)).map(c => {
      const questions = quizQuestions.filter(q => q.course_id === c.id)
      const myAttempts = assessmentAttempts.filter(a => a.course_id === c.id && a.employee_id === currentEmployeeId)
      const bestScore = myAttempts.length > 0 ? Math.max(...myAttempts.map(a => a.score)) : null
      return { course: c, questionCount: questions.length, attempts: myAttempts.length, maxAttempts: 3, bestScore, passed: myAttempts.some(a => a.status === 'passed') }
    })
  }, [courses, quizQuestions, assessmentAttempts, currentEmployeeId])

  // Mass enrollment computed data
  const uniqueCountries = useMemo(() => [...new Set(employees.map(e => e.country))].sort(), [employees])
  const uniqueLevels = useMemo(() => [...new Set(employees.map(e => e.level))], [employees])
  const enrollTargetEmployees = useMemo(() => {
    switch (enrollMode) {
      case 'individual':
        return employees.filter(emp => {
          if (!enrollSearch) return true
          const q = enrollSearch.toLowerCase()
          return emp.profile?.full_name.toLowerCase().includes(q) || emp.profile?.email.toLowerCase().includes(q) || emp.job_title.toLowerCase().includes(q)
        })
      case 'department':
        return selectedDepartments.size > 0 ? employees.filter(emp => selectedDepartments.has(emp.department_id)) : []
      case 'country':
        return selectedCountries.size > 0 ? employees.filter(emp => selectedCountries.has(emp.country)) : []
      case 'level':
        return selectedLevels.size > 0 ? employees.filter(emp => selectedLevels.has(emp.level)) : []
      case 'all':
        return employees
      default: return []
    }
  }, [employees, enrollMode, enrollSearch, selectedDepartments, selectedCountries, selectedLevels])

  const enrollSelectedEmployees = useMemo(() => {
    if (enrollMode === 'individual') return employees.filter(e => selectedEmployeeIds.has(e.id))
    return enrollTargetEmployees
  }, [enrollMode, employees, selectedEmployeeIds, enrollTargetEmployees])

  const alreadyEnrolledIds = useMemo(() => {
    if (!selectedCourseId) return new Set<string>()
    return new Set(enrollments.filter(e => e.course_id === selectedCourseId).map(e => e.employee_id))
  }, [enrollments, selectedCourseId])

  const newEnrollees = useMemo(() => enrollSelectedEmployees.filter(e => !alreadyEnrolledIds.has(e.id)), [enrollSelectedEmployees, alreadyEnrolledIds])
  const skippedEnrollees = useMemo(() => enrollSelectedEmployees.filter(e => alreadyEnrolledIds.has(e.id)), [enrollSelectedEmployees, alreadyEnrolledIds])

  const filteredEnrollCourses = useMemo(() => {
    return courses.filter(c => {
      const matchSearch = !enrollCourseSearch || c.title.toLowerCase().includes(enrollCourseSearch.toLowerCase()) || c.description.toLowerCase().includes(enrollCourseSearch.toLowerCase())
      const matchCategory = enrollCourseCategory === 'all' || c.category === enrollCourseCategory
      const matchLevel = enrollCourseLevel === 'all' || c.level === enrollCourseLevel
      return matchSearch && matchCategory && matchLevel
    })
  }, [courses, enrollCourseSearch, enrollCourseCategory, enrollCourseLevel])

  const courseCategories = useMemo(() => [...new Set(courses.map(c => c.category))], [courses])

  // Analytics data
  const analyticsData = useMemo(() => {
    const monthlyCompletions = [12, 18, 15, 22, 19, 25, 28, 24, 30, 27, 32, 35]
    const deptLearningHours = departments.map(d => {
      const deptEmps = employees.filter(e => e.department_id === d.id)
      const deptEnrollments = enrollments.filter(e => deptEmps.some(emp => emp.id === e.employee_id))
      const completedHours = deptEnrollments.filter(e => e.status === 'completed').reduce((acc, e) => {
        const course = courses.find(c => c.id === e.course_id)
        return acc + (course?.duration_hours || 0)
      }, 0)
      return { name: d.name, hours: completedHours, enrollments: deptEnrollments.length }
    })
    const courseEffectiveness = courses.slice(0, 6).map(c => {
      const courseEnrollments = enrollments.filter(e => e.course_id === c.id)
      const completed = courseEnrollments.filter(e => e.status === 'completed').length
      const hash = c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
      return { title: c.title, completionRate: courseEnrollments.length > 0 ? Math.round((completed / courseEnrollments.length) * 100) : 0, avgScore: 65 + (hash % 30), satisfaction: 3.5 + (hash % 15) / 10, dropoff: 5 + (hash % 20) }
    })
    return { monthlyCompletions, deptLearningHours, courseEffectiveness, roiMultiplier: 4.2, performanceImprovement: 18, retentionImpact: 23, costPerLearner: 450, totalInvestment: 135000 }
  }, [departments, employees, enrollments, courses])

  // Simulate document parsing
  // ── Document Upload & Course Generation ──────────────────────────
  function handleDocFileSelect() {
    // Create and trigger a real file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.docx,.pptx,.txt,.md,.csv,.doc'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) processUploadedFile(file)
    }
    input.click()
  }

  function handleDocDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDocDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processUploadedFile(file)
  }

  async function processUploadedFile(file: File) {
    setUploadedFileName(file.name)
    setDocUploadState('parsing')
    setDocParsingProgress(0)
    setDocParsingStage('Uploading document to server...')

    try {
      // Send file to server for proper text extraction (handles PDF, DOCX, PPTX, etc.)
      setDocParsingProgress(10)
      setDocParsingStage('Extracting text from document...')

      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        addToast(err.error || 'Failed to parse document')
        setDocUploadState('idle')
        return
      }

      const parsed = await res.json() as {
        filename: string
        textLength: number
        wordCount: number
        sections: Array<{ heading: string; content: string; level: number }>
        fullText: string
      }

      setUploadedFileContent(parsed.fullText)
      setDocParsingProgress(30)
      setDocParsingStage('Analyzing document structure...')

      // Small delay for UI feedback
      await new Promise(r => setTimeout(r, 400))
      setDocParsingProgress(50)
      setDocParsingStage('Generating course modules from content...')
      await new Promise(r => setTimeout(r, 400))

      buildCourseFromSections(file.name, parsed.sections, parsed.fullText)

      setDocParsingProgress(100)
      setDocUploadState('done')
    } catch (e) {
      // Fallback: read text files client-side
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (['txt', 'md', 'csv'].includes(ext || '')) {
        const text = await file.text()
        setUploadedFileContent(text)
        const fallbackSections = text.split(/\n\n+/).filter(p => p.trim().length > 30).map((p, i) => ({
          heading: p.split(/[.!?\n]/)[0]?.trim().substring(0, 80) || `Section ${i + 1}`,
          content: p.trim(),
          level: 1,
        }))
        buildCourseFromSections(file.name, fallbackSections, text)
        setDocParsingProgress(100)
        setDocUploadState('done')
      } else {
        addToast('Failed to parse document. Please try a different file format.')
        setDocUploadState('idle')
      }
    }
  }

  // Duration formatting — use ranges for estimates instead of exact times
  function formatLessonDuration(mins: number): string {
    if (mins <= 1) return '~1m'
    if (mins <= 3) return '1-3m'
    if (mins <= 5) return '3-5m'
    if (mins <= 8) return '5-8m'
    if (mins <= 12) return '8-12m'
    if (mins <= 15) return '10-15m'
    if (mins <= 20) return '15-20m'
    return `${Math.floor(mins / 5) * 5}-${Math.ceil(mins / 5) * 5}m`
  }

  function formatDurationRange(totalMins: number): string {
    if (totalMins < 60) return `${Math.max(1, Math.floor(totalMins * 0.8))}-${Math.ceil(totalMins * 1.2)} min`
    const lowH = Math.max(1, Math.floor((totalMins * 0.8) / 60))
    const highH = Math.ceil((totalMins * 1.2) / 60)
    return lowH === highH ? `~${lowH}h` : `${lowH}-${highH}h`
  }

  // Decode HTML entities and clean up extracted text
  function cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s{3,}/g, '  ').trim()
  }

  // Create a short, clean title from a heading (max ~60 chars)
  function cleanTitle(raw: string, maxLen = 60): string {
    let t = cleanText(raw)
    // Remove redundant prefixes like "SUCCESS PROFILE Success Profile"
    t = t.replace(/^([A-Z\s]+)\s+\1/i, '$1')
    // Remove duplicate case variations: "WORD Word" → "Word"
    t = t.replace(/\b([A-Z]+)\s+(\1)/gi, (_, a: string, b: string) => b.charAt(0).toUpperCase() + b.slice(1).toLowerCase())
    // For titles with "Key: Description" pattern, keep just the key part if too long
    if (t.length > maxLen && t.includes(':')) {
      const keyPart = t.split(':')[0].trim()
      if (keyPart.length >= 5 && keyPart.length <= maxLen) t = keyPart
    }
    // Truncate at a word boundary
    if (t.length > maxLen) {
      t = t.substring(0, maxLen).replace(/\s+\S*$/, '')
    }
    return t
  }

  // Split raw content into structured bullet points / paragraphs for lesson content
  function formatContentForLesson(rawContent: string, heading: string): string {
    const content = cleanText(rawContent)
    const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean)

    // Group into logical blocks
    const blocks: string[] = []
    let currentBlock: string[] = []

    for (const line of lines) {
      // Detect sub-headings (ALL CAPS lines, or lines ending with colon)
      const isSubheading = (/^[A-Z][A-Z\s&,\-:]{3,60}$/.test(line) && !/[a-z]/.test(line)) ||
        /^[A-Z][A-Za-z\s&]{2,40}:\s*$/.test(line)

      if (isSubheading) {
        if (currentBlock.length > 0) blocks.push(currentBlock.join('\n'))
        currentBlock = [`\n**${cleanTitle(line, 80)}**\n`]
      } else {
        // If line looks like a bullet item or short KPI/metric
        const isBullet = /^[-•●▪]\s/.test(line) || /^\d+[.)]\s/.test(line)
        if (isBullet) {
          currentBlock.push(`- ${line.replace(/^[-•●▪\d.)]+\s*/, '')}`)
        } else {
          currentBlock.push(line)
        }
      }
    }
    if (currentBlock.length > 0) blocks.push(currentBlock.join('\n'))

    return `## ${cleanTitle(heading)}\n\n${blocks.join('\n\n')}`
  }

  function buildCourseFromSections(
    filename: string,
    sections: Array<{ heading: string; content: string; level: number }>,
    fullText: string,
  ) {
    const baseName = filename.replace(/\.(pdf|docx|pptx|txt|md|csv|doc)$/i, '').replace(/[-_]/g, ' ')
    const title = cleanTitle(baseName.replace(/\b\w/g, l => l.toUpperCase()).trim(), 80)

    // Clean all sections
    const cleanedSections = sections
      .map(s => ({ heading: cleanTitle(s.heading), content: cleanText(s.content), level: s.level }))
      .filter(s => s.content.length > 20)

    // Group sections into modules — use level-1 headings as module boundaries when available
    const level1Indices = cleanedSections.map((s, i) => s.level === 1 ? i : -1).filter(i => i >= 0)

    type ModuleGroup = { title: string; sections: typeof cleanedSections }
    let moduleGroups: ModuleGroup[] = []

    if (level1Indices.length >= 2 && level1Indices.length <= 8) {
      // Use document's own structure
      for (let i = 0; i < level1Indices.length; i++) {
        const start = level1Indices[i]
        const end = i + 1 < level1Indices.length ? level1Indices[i + 1] : cleanedSections.length
        const group = cleanedSections.slice(start, end)
        moduleGroups.push({ title: group[0].heading, sections: group })
      }
    } else {
      // Evenly distribute
      const moduleCount = Math.max(2, Math.min(6, Math.ceil(cleanedSections.length / 3)))
      const perModule = Math.ceil(cleanedSections.length / moduleCount)
      for (let i = 0; i < cleanedSections.length; i += perModule) {
        const group = cleanedSections.slice(i, i + perModule)
        moduleGroups.push({ title: group[0].heading, sections: group })
      }
    }

    const modules: Array<{
      title: string
      lessons: Array<{ title: string; type: string; content: string; duration_minutes: number }>
      duration_minutes: number
    }> = []

    const quizQuestionsList: Array<{ question: string; type: string; options: string[]; correct_answer: string; points: number }> = []

    moduleGroups.forEach((mod, mi) => {
      const modTitle = cleanTitle(mod.title, 50)
      const modContent = mod.sections.map(s => s.content).join('\n\n')
      const lessons: Array<{ title: string; type: string; content: string; duration_minutes: number }> = []
      const wordCount = modContent.split(/\s+/).length

      // Short label for lesson titles (avoid repeating long module name)
      const shortLabel = modTitle.length > 30 ? `Module ${mi + 1}` : modTitle

      // Lesson 1: Core Reading — formatted document content
      const formattedContent = mod.sections.map(s => formatContentForLesson(s.content, s.heading)).join('\n\n---\n\n')
      lessons.push({
        title: mi === 0 ? `Introduction: ${shortLabel}` : `${shortLabel} — Core Reading`,
        type: 'text',
        content: formattedContent,
        duration_minutes: Math.max(5, Math.min(30, Math.ceil(wordCount / 200))),
      })

      // Lesson 2: Visual Infographic — key points with embedded SVG graphics
      const keyPoints = extractKeyPoints(modContent)
      const keyTerms = extractKeyTerms(modContent)

      // Generate SVG infographic data as JSON (rendered by course player)
      const infographicData = {
        type: 'infographic',
        title: `Key Takeaways: ${modTitle}`,
        points: keyPoints.map((p, i) => ({ id: i + 1, text: p, color: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899'][i % 6] })),
        terms: keyTerms,
        checkQuestions: [
          `Can you explain the main purpose of ${modTitle.toLowerCase()}?`,
          `What are the critical success factors?`,
          `How does this connect to the broader context?`,
        ],
      }
      const summaryContent = `<!--INFOGRAPHIC:${JSON.stringify(infographicData)}-->\n\n` +
        `## Key Takeaways: ${modTitle}\n\n` +
        (keyPoints.length > 0
          ? `**What You Need to Know:**\n\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}`
          : `**Summary:**\n\n${modContent.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 4).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n\n')}`) +
        (keyTerms.length > 0 ? `\n\n---\n\n**Key Concepts:**\n\n${keyTerms.map(t => `- **${t}**`).join('\n')}` : '') +
        `\n\n---\n\n**Learning Check:**\n- Can you explain the main purpose of ${modTitle.toLowerCase()}?\n- What are the critical success factors?\n- How does this connect to the broader context?`
      lessons.push({
        title: `${shortLabel} — Visual Summary`,
        type: 'infographic',
        content: summaryContent,
        duration_minutes: 6,
      })

      // Lesson 3: Applied Scenario (only if enough content)
      if (wordCount > 100) {
        const scenario = buildScenario(modTitle, modContent, keyPoints)
        lessons.push({
          title: `${shortLabel} — Practice Scenario`,
          type: 'interactive',
          content: scenario,
          duration_minutes: 12,
        })
      }

      // Lesson 4: Module Quiz
      lessons.push({
        title: `${shortLabel} — Knowledge Check`,
        type: 'quiz',
        content: '',
        duration_minutes: 8,
      })

      // Generate quiz questions from actual content
      const modQuestions = generateQuestionsFromContent(modTitle, modContent, keyPoints, keyTerms)
      quizQuestionsList.push(...modQuestions)

      modules.push({
        title: modTitle,
        lessons,
        duration_minutes: lessons.reduce((a, l) => a + l.duration_minutes, 0),
      })
    })

    // Final summary module
    const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0)
    modules.push({
      title: 'Course Summary & Final Assessment',
      lessons: [
        {
          title: `Course Summary: ${title}`,
          type: 'text',
          content: `## Course Complete: ${title}\n\n**Modules Covered:**\n\n${modules.map((m, i) => `${i + 1}. **${m.title}**`).join('\n')}\n\n**Total Content:** ${totalLessons} lessons across ${modules.length} modules\n\n**Next Steps:**\n- Review any modules you found challenging\n- Apply the concepts in your daily work\n- Share insights with your team\n- Complete the final assessment for your certificate`,
          duration_minutes: 5,
        },
        {
          title: 'Final Assessment',
          type: 'quiz',
          content: '',
          duration_minutes: 15,
        },
      ],
      duration_minutes: 20,
    })

    setParsedDocCourse({
      title: `${title} — Training Course`,
      description: `Auto-generated from "${filename}". ${modules.length} modules, ${totalLessons + 2} lessons, ${quizQuestionsList.length} quiz questions — all built from the document's actual content and structure.`,
      modules,
      quizQuestions: quizQuestionsList,
    })
  }

  function extractKeyPoints(text: string): string[] {
    const clean = cleanText(text)
    const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 200)
    // Remove duplicate/near-duplicate sentences
    const unique = sentences.filter((s, i) => !sentences.slice(0, i).some(prev => prev.toLowerCase() === s.toLowerCase()))
    const indicators = ['must', 'should', 'require', 'important', 'essential', 'key', 'critical', 'ensure', 'necessary', 'responsible', 'obligat', 'comply', 'mandatory', 'recommend', 'accountable', 'drive', 'lead', 'oversee']
    const important = unique.filter(s => indicators.some(ind => s.toLowerCase().includes(ind)))
    if (important.length >= 3) return important.slice(0, 6)
    // Fallback: first sentence of each paragraph
    return clean.split(/\n\n+/).map(p => p.split(/[.!?]/)[0]?.trim()).filter(s => s && s.length > 15 && s.length < 200).slice(0, 6)
  }

  function extractKeyTerms(text: string): string[] {
    const clean = cleanText(text)
    const terms = new Set<string>()
    // Capitalized multi-word phrases (likely proper nouns / concepts)
    const capsMatches = clean.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || []
    capsMatches.forEach(m => { if (m.length > 5 && m.length < 50 && !['The ', 'This ', 'That ', 'These '].some(p => m.startsWith(p))) terms.add(m) })
    // ALL CAPS acronyms with context (e.g. "P&L", "CCB", "NPS")
    const acronyms = clean.match(/\b[A-Z]{2,6}\b/g) || []
    acronyms.forEach(a => { if (!['THE', 'AND', 'FOR', 'WITH', 'FROM', 'KEY', 'ALL'].includes(a)) terms.add(a) })
    return Array.from(terms).slice(0, 10)
  }

  function buildScenario(modTitle: string, content: string, keyPoints: string[]): string {
    const title = cleanTitle(modTitle, 50)
    const topPoints = keyPoints.slice(0, 3)
    return `## Practice Scenario: ${title}\n\n` +
      `**Situation:** You have been asked to evaluate your organization's approach to ${title.toLowerCase()}. ` +
      `Using what you've learned in this module, consider the following:\n\n` +
      (topPoints.length > 0
        ? `**Key Areas to Address:**\n\n` + topPoints.map((p, i) => `${i + 1}. ${p}\n   - How does this apply to your current role?\n   - What specific actions would you take?`).join('\n\n')
        : `**Consider:**\n- What are the main objectives of ${title.toLowerCase()}?\n- Who are the key stakeholders?\n- What metrics would you use to measure success?`) +
      `\n\n**Deliverable:**\nPrepare a brief action plan that includes:\n` +
      `- Current state assessment\n` +
      `- 3 priority improvements\n` +
      `- Timeline and success metrics\n` +
      `- Key risks and mitigations`
  }

  function generateQuestionsFromContent(
    modTitle: string,
    content: string,
    keyPoints: string[],
    keyTerms: string[],
  ): Array<{ question: string; type: string; options: string[]; correct_answer: string; points: number }> {
    const title = cleanTitle(modTitle, 50)
    const questions: Array<{ question: string; type: string; options: string[]; correct_answer: string; points: number }> = []

    // Q1: Multiple choice from a key point
    if (keyPoints.length > 0) {
      const point = keyPoints[0]
      const correctSnippet = point.length > 80 ? point.substring(0, 77) + '...' : point
      questions.push({
        question: `Which of the following best describes a key requirement of "${title}"?`,
        type: 'multiple_choice',
        options: [
          correctSnippet,
          `${title} has no formal requirements or guidelines`,
          `Only senior management is involved in ${title.toLowerCase()}`,
          `${title} is optional and does not impact operations`,
        ],
        correct_answer: correctSnippet,
        points: 10,
      })
    }

    // Q2: True/false from content
    if (keyPoints.length > 1) {
      const statement = keyPoints[1].length > 100 ? keyPoints[1].substring(0, 97) + '...' : keyPoints[1]
      questions.push({
        question: `True or False: ${statement}`,
        type: 'true_false',
        options: ['True', 'False'],
        correct_answer: 'True',
        points: 5,
      })
    }

    // Q3: Fill-in-the-blank from key terms
    if (keyTerms.length > 0) {
      const term = keyTerms[0]
      questions.push({
        question: `A key concept covered in the "${title}" module is _____.`,
        type: 'fill_blank',
        options: [],
        correct_answer: term,
        points: 10,
      })
    } else {
      questions.push({
        question: `Effective ${title.toLowerCase()} requires ongoing _____ and review.`,
        type: 'fill_blank',
        options: [],
        correct_answer: 'monitoring',
        points: 10,
      })
    }

    return questions
  }

  function handleSaveDocCourse() {
    if (!parsedDocCourse) return
    const courseId = crypto.randomUUID()
    const totalMinutes = parsedDocCourse.modules.reduce((a, m) => a + m.duration_minutes, 0)

    // 1. Create the course with our own ID
    addCourse({
      id: courseId,
      title: parsedDocCourse.title,
      description: parsedDocCourse.description,
      category: 'AI Generated',
      duration_hours: Math.ceil(totalMinutes / 60),
      format: 'online',
      level: 'intermediate',
      is_mandatory: false,
    })

    // 2. Create all content blocks for each module
    parsedDocCourse.modules.forEach((mod, mi) => {
      mod.lessons.forEach((lesson, li) => {
        addCourseBlock({
          course_id: courseId,
          module_index: mi,
          order: li,
          type: lesson.type,
          title: lesson.title,
          content: lesson.content,
          duration_minutes: lesson.duration_minutes,
          status: 'published',
        })
      })
    })

    // 3. Create quiz questions linked to this course
    parsedDocCourse.quizQuestions.forEach((q) => {
      addQuizQuestion({
        course_id: courseId,
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
      })
    })

    addToast(`Course "${parsedDocCourse.title}" created — opening in Studio for editing`)
    setDocUploadState('idle')
    setParsedDocCourse(null)
    setUploadedFileName('')
    setUploadedFileContent('')
    // Switch to Course Studio and select the new course for editing
    setTimeout(() => {
      setSelectedBuilderCourse(courseId)
      setAuthoringMode(true)
      setActiveTab('course-builder')
    }, 200)
  }

  // Assessment handlers
  function startAssessment(courseId: string) {
    setActiveAssessment({ courseId, questionIndex: 0, answers: {}, startedAt: new Date().toISOString() })
    setShowAssessmentResult(null)
  }

  function submitAssessmentAnswers() {
    if (!activeAssessment) return
    const courseQuestions = quizQuestions.filter(q => q.course_id === activeAssessment.courseId)
    const correct = courseQuestions.filter(q => activeAssessment.answers[q.id] === q.correct_answer).length
    const score = Math.round((correct / courseQuestions.length) * 100)
    const passed = score >= 70
    const existingAttempts = assessmentAttempts.filter(a => a.course_id === activeAssessment.courseId && a.employee_id === currentEmployeeId)
    const course = courses.find(c => c.id === activeAssessment.courseId)
    addAssessmentAttempt({
      employee_id: currentEmployeeId,
      course_id: activeAssessment.courseId,
      quiz_title: `${course?.title || 'Course'} Assessment`,
      score,
      passing_score: 70,
      total_questions: courseQuestions.length,
      correct_answers: correct,
      time_taken_minutes: Math.round((new Date().getTime() - new Date(activeAssessment.startedAt).getTime()) / 60000) || 1,
      attempt_number: existingAttempts.length + 1,
      max_attempts: 3,
      status: passed ? 'passed' : 'failed',
      completed_at: new Date().toISOString(),
      answers: activeAssessment.answers,
    })
    setShowAssessmentResult({ score, passed, correct, total: courseQuestions.length })
    setActiveAssessment(null)
  }

  // Admin rule submit
  function submitRule() {
    if (!ruleForm.name || !ruleForm.condition_value) return
    addAutoEnrollRule(ruleForm)
    setShowRuleModal(false)
    setRuleForm({ name: '', condition_type: 'department_join', condition_value: '', action_type: 'enroll_course', action_target_id: '', action_target_name: '', is_active: true })
  }

  // Assignment submit
  function submitAssignment() {
    if (!assignForm.employee_id || !assignForm.course_id) return
    addLearningAssignment({ ...assignForm, assigned_by: currentEmployeeId, linked_review_id: null, status: 'not_started' })
    setShowAssignModal(false)
    setAssignForm({ employee_id: '', course_id: '', reason: '', due_date: '' })
  }

  // Send compliance reminder
  function sendComplianceReminder(employeeId: string) {
    addToast(t('reminderSent'))
  }

  // Leaderboard data
  const leaderboardData = useMemo(() => {
    return employees.slice(0, 10).map((emp, i) => {
      const empEnrollments = enrollments.filter(e => e.employee_id === emp.id)
      const completed = empEnrollments.filter(e => e.status === 'completed').length
      const totalProgress = empEnrollments.reduce((a, e) => a + (e.progress || 0), 0)
      return {
        id: emp.id,
        name: emp.profile.full_name,
        points: completed * 100 + totalProgress,
        coursesCompleted: completed,
        streak: Math.max(1, completed * 2 + (i % 5)),
      }
    }).sort((a, b) => b.points - a.points)
  }, [employees, enrollments])

  // Catalog search & filter
  const filteredCatalog = useMemo(() => {
    return courses.filter(course => {
      const matchSearch = !catalogSearch || course.title.toLowerCase().includes(catalogSearch.toLowerCase()) || course.description.toLowerCase().includes(catalogSearch.toLowerCase())
      const matchCategory = catalogCategory === 'all' || course.category === catalogCategory
      const matchLevel = catalogLevel === 'all' || course.level === catalogLevel
      const matchFormat = catalogFormat === 'all' || course.format === catalogFormat
      return matchSearch && matchCategory && matchLevel && matchFormat
    })
  }, [courses, catalogSearch, catalogCategory, catalogLevel, catalogFormat])

  const catalogCategories = useMemo(() => [...new Set(courses.map(c => c.category))].sort(), [courses])

  // Course ratings (deterministic from course id hash)
  const getCourseRating = (courseId: string) => {
    const hash = courseId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return { rating: 3.5 + (hash % 15) / 10, reviews: 12 + (hash % 88) }
  }

  // Certificate generation
  function handleViewCertificate(enrollmentId: string) {
    const enr = enrollments.find(e => e.id === enrollmentId)
    if (!enr || enr.status !== 'completed') return
    const course = courses.find(c => c.id === enr.course_id)
    const empName = getEmployeeName(enr.employee_id)
    setCertificateCourse({
      title: course?.title || 'Course',
      employeeName: empName,
      completedAt: enr.completed_at || new Date().toISOString(),
    })
    setShowCertificateModal(true)
  }

  // Content Library computed data
  const filteredContentLibrary = useMemo(() => {
    return contentLibrary.filter(item => {
      const matchSearch = !librarySearch || item.title.toLowerCase().includes(librarySearch.toLowerCase()) || (item.category || '').toLowerCase().includes(librarySearch.toLowerCase()) || (item.tags as string[] || []).some(t => t.toLowerCase().includes(librarySearch.toLowerCase()))
      const matchProvider = libraryProvider === 'all' || item.provider === libraryProvider
      const matchCategory = libraryCategory === 'all' || item.category === libraryCategory
      const matchLevel = libraryLevel === 'all' || item.level === libraryLevel
      const matchLanguage = libraryLanguage === 'all' || item.language === libraryLanguage
      return matchSearch && matchProvider && matchCategory && matchLevel && matchLanguage
    })
  }, [contentLibrary, librarySearch, libraryProvider, libraryCategory, libraryLevel, libraryLanguage])

  const featuredContent = useMemo(() => contentLibrary.filter(c => c.is_featured), [contentLibrary])
  const libraryCategories = useMemo(() => [...new Set(contentLibrary.map(c => c.category).filter(Boolean))].sort(), [contentLibrary])
  const libraryProviders = useMemo(() => [...new Set(contentLibrary.map(c => c.provider))].sort(), [contentLibrary])
  const libraryLanguages = useMemo(() => [...new Set(contentLibrary.map(c => c.language).filter(Boolean))].sort(), [contentLibrary])

  const providerLabel = (p: string) => {
    switch (p) {
      case 'go1': return 'Go1'
      case 'linkedin_learning': return 'LinkedIn Learning'
      case 'udemy_business': return 'Udemy Business'
      case 'coursera': return 'Coursera'
      case 'internal': return 'Internal'
      case 'custom': return 'Custom'
      case 'opensesame': return 'OpenSesame'
      case 'skillsoft': return 'Skillsoft'
      default: return p
    }
  }

  const providerColor = (p: string) => {
    switch (p) {
      case 'go1': return 'bg-pink-500/10 text-pink-400 border-pink-500/20'
      case 'linkedin_learning': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'udemy_business': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'coursera': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'internal': return 'bg-tempo-500/10 text-tempo-400 border-tempo-500/20'
      case 'opensesame': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'skillsoft': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  // Download for Offline handler
  function handleDownloadForOffline(courseId: string) {
    if (downloadedCourses.has(courseId) || downloadingCourse) return
    setDownloadingCourse(courseId)
    setDownloadProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 100) {
        p = 100
        clearInterval(iv)
        setDownloadedCourses(prev => new Set([...prev, courseId]))
        setDownloadingCourse(null)
        setDownloadProgress(0)
        addToast('Course downloaded for offline access')
      }
      setDownloadProgress(Math.min(100, Math.round(p)))
    }, 200)
  }

  // Translate block handler
  function handleTranslateBlock(blockId: string, lang: string) {
    const block = courseBlocks.find(b => b.id === blockId)
    if (!block) return
    setTranslatingBlock(blockId)
    setTimeout(() => {
      const translatedContent = translateContent(block.content || block.title, lang)
      const translatedTitle = translateContent(block.title, lang)
      addCourseBlock({
        course_id: block.course_id,
        module_index: block.module_index,
        order: (block.order || 0) + 0.5,
        type: block.type,
        title: `${translatedTitle} (${lang})`,
        content: translatedContent,
        duration_minutes: block.duration_minutes,
        status: 'draft',
        language: lang,
      })
      setTranslatingBlock(null)
      addToast(`Block translated to ${lang}`)
    }, 800)
  }

  // SCORM Player launch handler
  function handleLaunchScorm(pkg: any) {
    setScormPlayerPackage(pkg)
    setScormPlayerOpen(true)
  }

  // Content Provider handlers — deterministic item counts based on provider seed
  const providerSeedCounts: Record<string, number> = { udemy_business: 847, linkedin_learning: 612, coursera: 423, go1: 1052, opensesame: 538, skillsoft: 764 }
  const providerSyncIncrements: Record<string, number> = { udemy_business: 32, linkedin_learning: 24, coursera: 18, go1: 45, opensesame: 27, skillsoft: 36 }
  function handleProviderConnect(providerId: string) {
    setConnectedProviders(prev => new Set([...prev, providerId]))
    setProviderItemCounts(prev => ({ ...prev, [providerId]: providerSeedCounts[providerId] || 350 }))
  }
  function handleProviderSync(providerId: string) {
    setProviderItemCounts(prev => ({ ...prev, [providerId]: (prev[providerId] || 0) + (providerSyncIncrements[providerId] || 20) }))
  }
  function handleProviderDisconnect(providerId: string) {
    setConnectedProviders(prev => { const next = new Set(prev); next.delete(providerId); return next })
    setProviderItemCounts(prev => { const next = { ...prev }; delete next[providerId]; return next })
  }

  // Gamification computed data
  const employeeIds = useMemo(() => new Set(employees.map(e => e.id)), [employees])
  const gamificationLeaderboard = useMemo(() => {
    const pointsByEmp = new Map<string, number>()
    learnerPoints.filter(p => employeeIds.has(p.employee_id)).forEach(p => {
      pointsByEmp.set(p.employee_id, (pointsByEmp.get(p.employee_id) ?? 0) + p.points)
    })
    const badgesByEmp = new Map<string, number>()
    learnerBadges.filter(b => employeeIds.has(b.employee_id)).forEach(b => {
      badgesByEmp.set(b.employee_id, (badgesByEmp.get(b.employee_id) ?? 0) + 1)
    })
    return [...pointsByEmp.entries()].map(([empId, pts]) => ({
      id: empId,
      name: getEmployeeName(empId),
      points: pts,
      badges: badgesByEmp.get(empId) ?? 0,
      coursesCompleted: enrollments.filter(e => e.employee_id === empId && e.status === 'completed').length,
    })).sort((a, b) => b.points - a.points)
  }, [learnerPoints, learnerBadges, enrollments, getEmployeeName, employeeIds])

  const myPoints = useMemo(() => {
    return learnerPoints.filter(p => p.employee_id === currentEmployeeId).reduce((a, p) => a + p.points, 0)
  }, [learnerPoints, currentEmployeeId])

  const myBadges = useMemo(() => {
    return learnerBadges.filter(b => b.employee_id === currentEmployeeId)
  }, [learnerBadges, currentEmployeeId])

  const pointBreakdown = useMemo(() => {
    const breakdown = new Map<string, number>()
    learnerPoints.filter(p => p.employee_id === currentEmployeeId).forEach(p => {
      breakdown.set(p.source, (breakdown.get(p.source) ?? 0) + p.points)
    })
    return [...breakdown.entries()].map(([source, points]) => ({ source, points })).sort((a, b) => b.points - a.points)
  }, [learnerPoints, currentEmployeeId])

  const allBadgeTypes = [
    { type: 'course_complete', name: 'Course Complete', icon: 'award', description: 'Complete any course', color: 'text-green-400' },
    { type: 'path_complete', name: 'Path Completer', icon: 'map', description: 'Complete a full learning path', color: 'text-blue-400' },
    { type: 'streak_7', name: '7-Day Streak', icon: 'flame', description: 'Maintain a 7-day learning streak', color: 'text-orange-400' },
    { type: 'streak_30', name: '30-Day Streak', icon: 'flame', description: 'Maintain a 30-day learning streak', color: 'text-red-400' },
    { type: 'first_quiz_perfect', name: 'Perfect Score', icon: 'star', description: 'Get 100% on your first quiz attempt', color: 'text-yellow-400' },
    { type: 'top_learner', name: 'Top Learner', icon: 'crown', description: 'Rank in top 10% of learners', color: 'text-purple-400' },
    { type: 'compliance_champion', name: 'Compliance Champion', icon: 'shield', description: 'Complete all mandatory compliance courses', color: 'text-emerald-400' },
    { type: 'mentor', name: 'Knowledge Mentor', icon: 'users', description: 'Help 5 peers with their learning', color: 'text-cyan-400' },
  ]

  const sourceLabel = (s: string) => {
    switch (s) {
      case 'course_complete': return 'Course Completions'
      case 'quiz_score': return 'Quiz Scores'
      case 'streak_bonus': return 'Streak Bonuses'
      case 'discussion_post': return 'Discussion Posts'
      case 'peer_help': return 'Peer Help'
      default: return s
    }
  }

  // Transcript computed data
  const transcriptEmployeeId = transcriptEmployee || currentEmployeeId
  const transcriptData = useMemo(() => {
    const empEnrollments = enrollments.filter(e => e.employee_id === transcriptEmployeeId && e.status === 'completed')
    return empEnrollments.map(e => {
      const course = courses.find(c => c.id === e.course_id)
      const attempt = assessmentAttempts.find(a => a.course_id === e.course_id && a.employee_id === transcriptEmployeeId && a.status === 'passed')
      return {
        enrollmentId: e.id,
        courseId: e.course_id,
        courseTitle: course?.title || 'Unknown',
        category: course?.category || 'General',
        completedAt: e.completed_at || '',
        durationHours: course?.duration_hours || 0,
        score: attempt?.score || null,
        format: course?.format || 'online',
        level: course?.level || 'beginner',
      }
    }).filter(t => {
      const matchCategory = transcriptCategory === 'all' || t.category === transcriptCategory
      const matchDateFrom = !transcriptDateFrom || t.completedAt >= transcriptDateFrom
      const matchDateTo = !transcriptDateTo || t.completedAt <= transcriptDateTo
      return matchCategory && matchDateFrom && matchDateTo
    }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  }, [enrollments, courses, assessmentAttempts, transcriptEmployeeId, transcriptCategory, transcriptDateFrom, transcriptDateTo])

  const transcriptSummary = useMemo(() => ({
    totalCourses: transcriptData.length,
    totalHours: transcriptData.reduce((a, t) => a + t.durationHours, 0),
    avgScore: transcriptData.filter(t => t.score).length > 0 ? Math.round(transcriptData.filter(t => t.score).reduce((a, t) => a + (t.score || 0), 0) / transcriptData.filter(t => t.score).length) : null,
    certificates: transcriptData.length,
  }), [transcriptData])

  // SCORM file upload handler — reads real file metadata, shows progress animation, then persists
  const scormFileRef = { current: null as File | null }
  function handleScormFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !scormUploadCourse) return
    scormFileRef.current = file
    processScormUpload(file)
  }

  async function processScormUpload(file: File) {
    setScormUploadState('uploading')
    setScormUploadProgress(0)

    // Animate progress for UX feedback
    const steps = [20, 50, 70, 90, 100] as const
    const states: Array<'uploading' | 'processing' | 'done'> = ['uploading', 'uploading', 'processing', 'processing', 'done']
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 400))
      setScormUploadProgress(steps[i])
      setScormUploadState(states[i])
    }

    // Use actual file metadata
    const courseTitle = courses.find(c => c.id === scormUploadCourse)?.title || 'SCORM Package'
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    addScormPackage({
      course_id: scormUploadCourse,
      package_url: `/scorm/${file.name}`,
      version: scormUploadVersion,
      entry_point: 'index.html',
      metadata: { title: courseTitle, description: `Uploaded: ${file.name} (${fileSizeMB} MB)`, duration: '2 hours', mastery_score: 70 },
      status: 'ready',
    })
    addToast(`SCORM package "${file.name}" uploaded successfully`)

    await new Promise(r => setTimeout(r, 800))
    setShowScormUploadModal(false)
    setScormUploadState('idle')
    setScormUploadProgress(0)
    setScormUploadCourse('')
    scormFileRef.current = null
  }

  // Prerequisite helpers
  function getPrerequisitesForCourse(courseId: string) {
    return coursePrerequisites.filter(p => p.course_id === courseId).map(p => ({
      ...p,
      prerequisiteCourse: courses.find(c => c.id === p.prerequisite_course_id),
      isCompleted: enrollments.some(e => e.course_id === p.prerequisite_course_id && e.employee_id === currentEmployeeId && e.status === 'completed'),
    }))
  }

  function handleAddPrerequisite() {
    if (!prereqForm.course_id || !prereqForm.prerequisite_course_id) return
    addCoursePrerequisite({ ...prereqForm, minimum_score: prereqForm.minimum_score ? parseInt(prereqForm.minimum_score) : null })
    setShowPrereqModal(false)
    setPrereqForm({ course_id: '', prerequisite_course_id: '', type: 'required', minimum_score: '' })
  }

  function handleAddToOrgCatalog(item: typeof contentLibrary[number]) {
    addCourse({
      title: item.title,
      description: `Imported from ${providerLabel(item.provider)}`,
      category: item.category || 'General',
      duration_hours: Math.ceil((item.duration_minutes || 60) / 60),
      format: item.format || 'online',
      level: item.level || 'beginner',
      is_mandatory: false,
    })
    addToast(`Added "${item.title}" to course catalog`)
  }

  // Transcript PDF export
  function exportTranscriptPDF() {
    const empName = getEmployeeName(transcriptEmployeeId)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const rows = transcriptData.map(t => `<tr><td style="padding:8px;border-bottom:1px solid #333">${t.courseTitle}</td><td style="padding:8px;border-bottom:1px solid #333">${t.category}</td><td style="padding:8px;border-bottom:1px solid #333">${t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '-'}</td><td style="padding:8px;border-bottom:1px solid #333">${t.score ? t.score + '%' : '-'}</td><td style="padding:8px;border-bottom:1px solid #333">${t.durationHours}h</td></tr>`).join('')
      printWindow.document.write(`<html><head><title>Learning Transcript - ${empName}</title><style>body{font-family:-apple-system,sans-serif;padding:40px;color:#fff;background:#0a0a0a}h1{color:#ea580c;font-size:20px}h2{font-size:16px;color:#ccc}table{width:100%;border-collapse:collapse;margin-top:20px}th{text-align:left;padding:8px;border-bottom:2px solid #ea580c;color:#ea580c;font-size:13px}td{font-size:13px;color:#ccc}.summary{display:flex;gap:30px;margin:20px 0}.stat{text-align:center}.stat-val{font-size:24px;font-weight:bold;color:#ea580c}.stat-label{font-size:11px;color:#999}</style></head><body><h1>Learning Transcript</h1><h2>${empName}</h2><div class="summary"><div class="stat"><div class="stat-val">${transcriptSummary.totalCourses}</div><div class="stat-label">Courses</div></div><div class="stat"><div class="stat-val">${transcriptSummary.totalHours}h</div><div class="stat-label">Total Hours</div></div><div class="stat"><div class="stat-val">${transcriptSummary.certificates}</div><div class="stat-label">Certificates</div></div>${transcriptSummary.avgScore ? `<div class="stat"><div class="stat-val">${transcriptSummary.avgScore}%</div><div class="stat-label">Avg Score</div></div>` : ''}</div><table><thead><tr><th>Course</th><th>Category</th><th>Completed</th><th>Score</th><th>Hours</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:30px;font-size:11px;color:#666">Generated by Tempo Platform on ${new Date().toLocaleDateString()}</p></body></html>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Filtered blocks for selected course
  const filteredBlocks = useMemo(() => {
    if (!selectedBuilderCourse) return []
    return courseBlocks.filter(b => b.course_id === selectedBuilderCourse).sort((a, b) => a.module_index === b.module_index ? a.order - b.order : a.module_index - b.module_index)
  }, [courseBlocks, selectedBuilderCourse])

  // Filtered quiz questions
  const filteredQuestions = useMemo(() => {
    if (!selectedQuizCourse) return quizQuestions
    return quizQuestions.filter(q => q.course_id === selectedQuizCourse)
  }, [quizQuestions, selectedQuizCourse])

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEnrollModal(true)}><Plus size={14} /> {t('enrollEmployee')}</Button>
            <Button size="sm" onClick={() => setShowCourseModal(true)}><Plus size={14} /> {t('newCourse')}</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <StatCard label={t('totalCourses')} value={courses.length} icon={<BookOpen size={20} />} />
        <StatCard label={t('inProgress')} value={inProgressCount} change={t('completed', { count: completedCount })} changeType="positive" href="/people" />
        <StatCard label={t('completionRate')} value={`${completionRate}%`} icon={<Award size={20} />} />
        <StatCard label={t('totalHours')} value={totalHours} change={t('availableContent')} changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label={t('liveSessions')} value={liveSessions.filter(s => s.status === 'upcoming').length} icon={<Radio size={20} />} />
        <StatCard label={t('totalPaths')} value={learningPaths.length} icon={<Route size={20} />} />
      </div>

      {/* AI Insights Card */}
      {aiLearningInsights.length > 0 && (
        <AIInsightsCard
          insights={aiLearningInsights}
          title="Learning AI Insights"
          maxVisible={3}
          className="mb-6"
        />
      )}

      {/* AI Skill Coverage Insight */}
      <div className="mb-6">
        <AIInsightCard insight={skillCoverageInsight} compact />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* AI Personalized Homepage */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-t1 mb-1">{t('homeWelcome', { name: currentEmployeeName })}</h3>
                <p className="text-xs text-t3">{t('homeSubtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-tempo-600" />
                <Badge variant="ai">{tc('aiPowered')}</Badge>
              </div>
            </div>
          </Card>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center"><BookOpen size={18} className="text-tempo-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-t1">{myInProgress.length}</p>
                  <p className="text-[0.6rem] text-t3">{t('coursesStarted')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Clock size={18} className="text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-t1">{myCompleted.reduce((a, e) => { const c = courses.find(c => c.id === e.course_id); return a + (c?.duration_hours || 0) }, 0)}</p>
                  <p className="text-[0.6rem] text-t3">{t('hoursLearned')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Award size={18} className="text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-t1">{myCompleted.length}</p>
                  <p className="text-[0.6rem] text-t3">{t('certificatesEarned')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Target size={18} className="text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-t1">{t('daysStreak', { count: 12 })}</p>
                  <p className="text-[0.6rem] text-t3">{t('currentStreak')}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Resume Learning */}
          {myInProgress.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><Play size={14} className="text-tempo-600" /> {t('resumeLearning')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myInProgress.map(enr => {
                  const course = courses.find(c => c.id === enr.course_id)
                  return (
                    <Card key={enr.id}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-tempo-50 flex items-center justify-center"><GraduationCap size={22} className="text-tempo-600" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-t1">{course?.title}</p>
                          <p className="text-xs text-t3">{course?.category} · {course?.duration_hours}h</p>
                          <Progress value={enr.progress} showLabel className="mt-1" color="orange" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Button size="sm" variant="primary" onClick={() => openPlayer(enr.id, enr.course_id)}>{t('resumeLearning')}</Button>
                          {downloadedCourses.has(enr.course_id) ? (
                            <Badge variant="success" className="text-[0.5rem] justify-center"><Download size={10} /> Offline</Badge>
                          ) : downloadingCourse === enr.course_id ? (
                            <div className="w-full">
                              <Progress value={downloadProgress} color="orange" />
                              <p className="text-[0.5rem] text-t3 text-center mt-0.5">{downloadProgress}%</p>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="text-[0.6rem]" onClick={() => handleDownloadForOffline(enr.course_id)}><Download size={10} /> Offline</Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Manager Learning Assignments (Tempo Differentiator) */}
          {myAssignments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><Briefcase size={14} className="text-blue-600" /> {t('learningAssignments')}</h4>
              <div className="space-y-2">
                {myAssignments.map(assignment => {
                  const course = courses.find(c => c.id === assignment.course_id)
                  const assignerName = getEmployeeName(assignment.assigned_by)
                  return (
                    <Card key={assignment.id}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><UserCheck size={16} className="text-blue-600" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-t1">{course?.title}</p>
                          <p className="text-xs text-t3">{t('assignedBy', { name: assignerName })} · {assignment.reason}</p>
                          {assignment.linked_review_id && <Badge variant="ai">{t('linkedToReview')}</Badge>}
                        </div>
                        <div className="text-right">
                          <Badge variant={assignment.status === 'in_progress' ? 'warning' : assignment.status === 'not_started' ? 'default' : 'success'}>{assignment.status.replace('_', ' ')}</Badge>
                          {assignment.due_date && <p className="text-[0.6rem] text-t3 mt-1">{t('dueIn', { days: Math.max(0, Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / 86400000)) })}</p>}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Recommendations (Performance-Linked) */}
          <div>
            <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><Sparkles size={14} className="text-tempo-600" /> {t('recommendedForYou')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {personalizedRecs.map(rec => (
                <Card key={rec.id}>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="ai">{t('aiRecommended')}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-t1 mb-1">{rec.title}</h3>
                  <p className="text-xs text-t3 mb-2 line-clamp-2">{rec.description}</p>
                  <p className="text-[0.6rem] text-tempo-600 mb-3 flex items-center gap-1">
                    {rec.reason === 'performanceGap' && <><TrendingUp size={10} /> {t('basedOnPerformance')}</>}
                    {rec.reason === 'careerPath' && <><ArrowRight size={10} /> {t('basedOnCareerPath')}</>}
                    {rec.reason === 'roleBased' && <><Briefcase size={10} /> {t('basedOnRole', { role: currentEmployee?.job_title || '' })}</>}
                    {rec.reason === 'peerPopular' && <><UsersIcon size={10} /> {t('basedOnPeers')}</>}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-t3"><Clock size={10} className="inline" /> {rec.duration_hours}h</span>
                    <Button size="sm" variant="outline" onClick={() => handleEnroll(rec.id)}>{t('enroll')}</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Compliance Deadlines */}
          {complianceTraining.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-600" /> {t('upcomingDeadlines')}</h4>
              <Card padding="none">
                <div className="divide-y divide-divider">
                  {complianceTraining.slice(0, 3).map(ct => {
                    const daysUntil = Math.ceil((new Date(ct.deadline).getTime() - Date.now()) / 86400000)
                    return (
                      <div key={ct.id} className="px-6 py-3 flex items-center gap-4">
                        <ShieldCheck size={16} className={daysUntil < 0 ? 'text-red-500' : daysUntil < 14 ? 'text-amber-500' : 'text-green-500'} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-t1">{ct.title}</p>
                          <p className="text-xs text-t3">{ct.regulatory_body}</p>
                        </div>
                        <Badge variant={daysUntil < 0 ? 'error' : daysUntil < 14 ? 'warning' : 'success'}>
                          {daysUntil < 0 ? t('overdueDays', { days: Math.abs(daysUntil) }) : t('dueIn', { days: daysUntil })}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder={t('searchCourses')}
                className="w-full pl-9 pr-8 py-2 text-xs bg-canvas border border-divider rounded-lg focus:outline-none focus:border-tempo-400 focus:ring-1 focus:ring-tempo-400"
              />
              {catalogSearch && (
                <button onClick={() => setCatalogSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <Select value={catalogCategory} onChange={(e) => setCatalogCategory(e.target.value)}
              className="text-xs bg-canvas border border-divider rounded-lg px-3 py-2 focus:outline-none focus:border-tempo-400"
              options={[{value: 'all', label: t('allCategories')}, ...catalogCategories.map(cat => ({value: cat, label: cat}))]} />
            <Select value={catalogLevel} onChange={(e) => setCatalogLevel(e.target.value)}
              className="text-xs bg-canvas border border-divider rounded-lg px-3 py-2 focus:outline-none focus:border-tempo-400"
              options={[{value: 'all', label: t('allLevels')}, {value: 'beginner', label: t('levelBeginner')}, {value: 'intermediate', label: t('levelIntermediate')}, {value: 'advanced', label: t('levelAdvanced')}]} />
            <Select value={catalogFormat} onChange={(e) => setCatalogFormat(e.target.value)}
              className="text-xs bg-canvas border border-divider rounded-lg px-3 py-2 focus:outline-none focus:border-tempo-400"
              options={[{value: 'all', label: t('allFormats')}, {value: 'online', label: t('formatOnline')}, {value: 'classroom', label: t('formatClassroom')}, {value: 'blended', label: t('formatBlended')}]} />
            {(catalogSearch || catalogCategory !== 'all' || catalogLevel !== 'all' || catalogFormat !== 'all') && (
              <button onClick={() => { setCatalogSearch(''); setCatalogCategory('all'); setCatalogLevel('all'); setCatalogFormat('all') }}
                className="text-xs text-tempo-600 hover:text-tempo-700 font-medium">
                {tc('clearFilters')}
              </button>
            )}
          </div>

          <p className="text-xs text-t3">{t('showingCourses', { count: filteredCatalog.length, total: courses.length })}</p>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(course => {
              const { rating, reviews } = getCourseRating(course.id)
              const enrolled = enrollments.some(e => e.course_id === course.id && e.employee_id === currentEmployeeId)
              const myEnrollment = enrollments.find(e => e.course_id === course.id && e.employee_id === currentEmployeeId)
              const coursePrereqs = getPrerequisitesForCourse(course.id)
              const requiredPrereqs = coursePrereqs.filter(p => p.type === 'required')
              const unmetPrereqs = requiredPrereqs.filter(p => !p.isCompleted)
              const hasUnmetPrereqs = unmetPrereqs.length > 0
              const hasScorm = scormPackages.some(p => p.course_id === course.id)
              return (
                <Card key={course.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={course.is_mandatory ? 'error' : 'default'}>{course.is_mandatory ? t('mandatory') : course.category}</Badge>
                      {coursePrereqs.length > 0 && (
                        <span title={hasUnmetPrereqs ? 'Prerequisites not met' : 'All prerequisites met'} className={hasUnmetPrereqs ? 'text-amber-500' : 'text-green-500'}><Lock size={12} /></span>
                      )}
                      {hasScorm && (
                        <span title="SCORM content available" className="text-blue-400"><Layers size={12} /></span>
                      )}
                    </div>
                    <Badge>{course.level}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-t1 mb-1 cursor-pointer hover:text-tempo-600 transition-colors" onClick={() => setCourseDetailId(course.id)}>{course.title}</h3>
                  <p className="text-xs text-t3 mb-2 line-clamp-2 cursor-pointer" onClick={() => setCourseDetailId(course.id)}>{course.description}</p>

                  {/* Prerequisites indicator */}
                  {coursePrereqs.length > 0 && (
                    <div className="mb-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-[0.6rem] font-medium text-t2 mb-1">Prerequisites:</p>
                      {coursePrereqs.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 text-[0.55rem]">
                          {p.isCompleted ? <CheckCircle size={9} className="text-green-400" /> : <Lock size={9} className="text-amber-400" />}
                          <span className={p.isCompleted ? 'text-green-400' : 'text-amber-400'}>{p.prerequisiteCourse?.title}</span>
                          <Badge variant={p.type === 'required' ? 'error' : 'info'} className="text-[0.4rem] py-0 px-1">{p.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ratings */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={10} className={star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-[0.6rem] text-t2 font-medium">{rating.toFixed(1)}</span>
                    <span className="text-[0.6rem] text-t3">({reviews} {t('reviews')})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-t3">
                      <Clock size={12} /> {course.duration_hours}h
                      <span className="capitalize">{course.format}</span>
                    </div>
                    {myEnrollment?.status === 'completed' ? (
                      <Button size="sm" variant="outline" onClick={() => handleViewCertificate(myEnrollment.id)}>
                        <Medal size={12} /> {t('certificate')}
                      </Button>
                    ) : enrolled && myEnrollment ? (
                      <Button size="sm" variant="primary" onClick={() => openPlayer(myEnrollment.id, course.id)}>
                        <Play size={12} /> {myEnrollment.status === 'in_progress' ? 'Continue' : 'Start'}
                      </Button>
                    ) : hasUnmetPrereqs ? (
                      <Badge variant="warning" className="text-[0.6rem]"><Lock size={10} /> Locked</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEnroll(course.id)}>{t('enroll')}</Button>
                    )}
                  </div>

                  {/* SCORM/xAPI + Adaptive Learning + Offline indicators */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-divider">
                    {hasScorm && (
                      <div className="flex items-center gap-1">
                        <Layers size={10} className="text-blue-400" />
                        <span className="text-[0.55rem] text-blue-400">SCORM</span>
                      </div>
                    )}
                    {course.format === 'online' && !hasScorm && (
                      <div className="flex items-center gap-1">
                        <Shield size={10} className="text-gray-400" />
                        <span className="text-[0.55rem] text-t3">{t('scormCompatible')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Brain size={10} className="text-tempo-500" />
                      <span className="text-[0.55rem] text-tempo-600">{t('adaptiveDifficulty')}</span>
                    </div>
                    <div className="ml-auto">
                      {downloadedCourses.has(course.id) ? (
                        <Badge variant="success" className="text-[0.5rem]"><Download size={9} /> Offline</Badge>
                      ) : downloadingCourse === course.id ? (
                        <span className="text-[0.5rem] text-tempo-500">{downloadProgress}%</span>
                      ) : enrolled ? (
                        <button onClick={() => handleDownloadForOffline(course.id)} className="text-[0.55rem] text-t3 hover:text-tempo-500 flex items-center gap-1 transition-colors"><Download size={10} /> Offline</button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {filteredCatalog.length === 0 && courses.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <BookOpen size={40} className="mx-auto text-t3 mb-3 opacity-50" />
                <p className="text-sm font-medium text-t1 mb-1">No courses yet</p>
                <p className="text-xs text-t3 mb-4">Create your first course or use AI to generate one</p>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" onClick={() => setShowCourseModal(true)}><Plus size={14} /> Create Course</Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('builder')}><Sparkles size={14} /> AI Builder</Button>
                </div>
              </div>
            </Card>
          )}
          {filteredCatalog.length === 0 && courses.length > 0 && (
            <Card>
              <div className="text-center py-12">
                <Search size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t2 mb-1">{t('noCoursesFound')}</p>
                <p className="text-xs text-t3">{t('tryDifferentSearch')}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <Card padding="none">
          <CardHeader><CardTitle>{t('allEnrollments')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {enrollments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <GraduationCap size={40} className="mx-auto text-t3 mb-3 opacity-50" />
                <p className="text-sm font-medium text-t1 mb-1">No enrollments yet</p>
                <p className="text-xs text-t3 mb-4">Enroll employees in courses to track their progress</p>
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" onClick={() => setShowEnrollModal(true)}><Plus size={14} /> Enroll Employees</Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('catalog')}><BookOpen size={14} /> Browse Catalog</Button>
                </div>
              </div>
            ) : enrollments.map(enr => {
              const course = courses.find(c => c.id === enr.course_id)
              const empName = getEmployeeName(enr.employee_id)
              return (
                <div key={enr.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <GraduationCap size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{course?.title || t('unknownCourse')}</p>
                    <p className="text-xs text-t3">{empName} - {course?.category}</p>
                  </div>
                  <div className="w-32">
                    <Progress value={enr.progress} showLabel color={enr.status === 'completed' ? 'success' : 'orange'} />
                  </div>
                  <Badge variant={enr.status === 'completed' ? 'success' : enr.status === 'in_progress' ? 'warning' : 'default'}>
                    {enr.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex gap-1">
                    {enr.status === 'enrolled' && (
                      <Button size="sm" variant="primary" onClick={() => openPlayer(enr.id, enr.course_id)}>{tc('start')}</Button>
                    )}
                    {enr.status === 'in_progress' && (
                      <Button size="sm" variant="primary" onClick={() => openPlayer(enr.id, enr.course_id)}>Continue</Button>
                    )}
                    {enr.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => handleViewCertificate(enr.id)}>
                        <Medal size={12} /> {t('certificate')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Compliance Training Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('complianceOverview')}</h3>
              <p className="text-xs text-t3">{t('complianceDesc')}</p>
            </div>
            <div className="flex gap-2">
              {compliancePolicyState === 'idle' && (
                <Button size="sm" variant="outline" onClick={() => {
                  setCompliancePolicyState('parsing')
                  setTimeout(() => {
                    setCompliancePolicyState('done')
                    addToast(t('policyParsed', { count: 4 }))
                  }, 2000)
                }}>
                  <Upload size={14} /> {t('uploadCompliancePolicy')}
                </Button>
              )}
              {compliancePolicyState === 'parsing' && (
                <Badge variant="ai"><AIPulse size="sm" /> {t('parsingDocument')}</Badge>
              )}
              {compliancePolicyState === 'done' && (
                <Badge variant="success"><ShieldCheck size={12} /> {t('policyParsed', { count: 4 })}</Badge>
              )}
            </div>
          </div>

          {/* Compliance Stats */}
          <ExpandableStats>
            <StatCard label={t('complianceRate')} value={`${complianceStats.complianceRate}%`} icon={<ShieldCheck size={20} />} />
            <StatCard label={t('mandatoryCourses')} value={complianceStats.mandatoryCount} icon={<Shield size={20} />} />
            <StatCard label={t('overdueTrainings')} value={complianceStats.overdueCount} change={complianceStats.overdueCount > 0 ? 'Action required' : 'All clear'} changeType={complianceStats.overdueCount > 0 ? 'negative' : 'positive'} />
            <StatCard label={t('upcomingDue')} value={complianceStats.upcomingCount} change="Next 30 days" changeType="neutral" />
          </ExpandableStats>

          {/* Compliance Trainings */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('regulatoryRequirements')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {complianceTraining.map(ct => {
                const daysUntil = Math.ceil((new Date(ct.deadline).getTime() - Date.now()) / 86400000)
                const course = ct.course_id ? courses.find(c => c.id === ct.course_id) : null
                return (
                  <div key={ct.id} className="px-6 py-4 flex items-center gap-4">
                    <ShieldCheck size={18} className={daysUntil < 0 ? 'text-red-500' : daysUntil < 30 ? 'text-amber-500' : 'text-green-500'} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-t1">{ct.title}</p>
                      <p className="text-xs text-t3">{ct.regulatory_body} · {ct.frequency}</p>
                      {course && <p className="text-[0.6rem] text-tempo-600">{course.title}</p>}
                      {ct.penalty && <p className="text-[0.6rem] text-red-500">Penalty: {ct.penalty}</p>}
                    </div>
                    <Badge variant={daysUntil < 0 ? 'error' : daysUntil < 30 ? 'warning' : 'success'}>
                      {daysUntil < 0 ? t('overdueDays', { days: Math.abs(daysUntil) }) : t('dueIn', { days: daysUntil })}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Department Compliance */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('deptCompliance')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {deptCompliance.map(dc => (
                <div key={dc.department} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{dc.department}</p>
                    <p className="text-[0.6rem] text-t3">{dc.completed}/{dc.required} completed · {dc.employeeCount} employees</p>
                  </div>
                  <div className="w-32">
                    <Progress value={dc.rate} showLabel color={dc.rate >= 80 ? 'success' : dc.rate >= 50 ? 'orange' : 'error'} />
                  </div>
                  <Badge variant={dc.rate >= 80 ? 'success' : dc.rate >= 50 ? 'warning' : 'error'}>
                    {dc.rate >= 80 ? t('compliant') : t('nonCompliant')}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Employee Compliance Status */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('employeeCompliance')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {employees.slice(0, 10).map(emp => {
                const mandatoryCourseIds = courses.filter(c => c.is_mandatory).map(c => c.id)
                const empMandatoryEnrollments = enrollments.filter(e => e.employee_id === emp.id && mandatoryCourseIds.includes(e.course_id))
                const completedMandatory = empMandatoryEnrollments.filter(e => e.status === 'completed').length
                const totalMandatory = mandatoryCourseIds.length
                const isCompliant = completedMandatory >= totalMandatory
                return (
                  <div key={emp.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-tempo-100 flex items-center justify-center text-xs font-medium text-tempo-600">
                      {emp.profile.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-t1">{emp.profile.full_name}</p>
                      <p className="text-[0.6rem] text-t3">{emp.job_title} · {completedMandatory}/{totalMandatory} mandatory</p>
                    </div>
                    <Badge variant={isCompliant ? 'success' : 'error'}>
                      {isCompliant ? t('compliant') : t('nonCompliant')}
                    </Badge>
                    {!isCompliant && (
                      <Button size="sm" variant="outline" onClick={() => sendComplianceReminder(emp.id)}>{t('sendReminder')}</Button>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Assessment Center Tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          {activeAssessment ? (() => {
            const courseQuestions = quizQuestions.filter(q => q.course_id === activeAssessment.courseId)
            const currentQ = courseQuestions[activeAssessment.questionIndex]
            const course = courses.find(c => c.id === activeAssessment.courseId)
            if (!currentQ) return null
            return (
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{course?.title} - Assessment</h3>
                    <p className="text-xs text-t3">{t('questionOf', { current: activeAssessment.questionIndex + 1, total: courseQuestions.length })}</p>
                  </div>
                  <Progress value={Math.round(((activeAssessment.questionIndex + 1) / courseQuestions.length) * 100)} showLabel className="w-32" />
                </div>

                <div className="bg-canvas rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>{currentQ.type === 'multiple_choice' ? t('typeMultipleChoice') : currentQ.type === 'true_false' ? t('typeTrueFalse') : currentQ.type === 'fill_blank' ? t('typeFillBlank') : t('typeEssay')}</Badge>
                    <span className="text-xs text-t3">{currentQ.points} {t('points')}</span>
                  </div>
                  <p className="text-sm font-medium text-t1 mb-4">{currentQ.question}</p>

                  {(currentQ.type === 'multiple_choice' || currentQ.type === 'true_false') && (
                    <div className="space-y-2">
                      {(currentQ.type === 'true_false' ? ['True', 'False'] : currentQ.options).map((opt, i) => (
                        <button key={i} onClick={() => setActiveAssessment(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: optText(opt) } } : null)}
                          className={cn('w-full text-left p-3 rounded-lg border text-sm transition-colors',
                            activeAssessment.answers[currentQ.id] === optText(opt)
                              ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                              : 'border-divider hover:border-tempo-300')}>
                          {optText(opt)}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQ.type === 'fill_blank' && (
                    <input type="text" value={activeAssessment.answers[currentQ.id] || ''}
                      onChange={(e) => setActiveAssessment(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: e.target.value } } : null)}
                      className="w-full p-3 border border-divider rounded-lg text-sm focus:outline-none focus:border-tempo-500"
                      placeholder="Type your answer..." />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="secondary" onClick={() => setActiveAssessment(prev => prev && prev.questionIndex > 0 ? { ...prev, questionIndex: prev.questionIndex - 1 } : prev)}
                    disabled={activeAssessment.questionIndex === 0}>{t('prevQuestion')}</Button>
                  {activeAssessment.questionIndex < courseQuestions.length - 1 ? (
                    <Button onClick={() => setActiveAssessment(prev => prev ? { ...prev, questionIndex: prev.questionIndex + 1 } : null)}>{t('nextQuestion')}</Button>
                  ) : (
                    <Button onClick={submitAssessmentAnswers}>{t('submitAssessment')}</Button>
                  )}
                </div>
              </Card>
            )
          })() : showAssessmentResult ? (
            <Card>
              <div className="text-center py-8">
                <div className={cn('w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4', showAssessmentResult.passed ? 'bg-green-100' : 'bg-red-100')}>
                  {showAssessmentResult.passed ? <CheckCircle size={36} className="text-green-600" /> : <AlertTriangle size={36} className="text-red-600" />}
                </div>
                <h3 className="text-lg font-bold text-t1 mb-1">{t('assessmentResult')}</h3>
                <Badge variant={showAssessmentResult.passed ? 'success' : 'error'} className="mb-4">
                  {showAssessmentResult.passed ? t('passed') : t('failed')}
                </Badge>
                <p className="text-3xl font-bold text-t1 mb-1">{showAssessmentResult.score}%</p>
                <p className="text-xs text-t3 mb-2">{t('passingRequired', { score: 70 })}</p>
                <p className="text-xs text-t3">{t('correctAnswers')}: {showAssessmentResult.correct}/{showAssessmentResult.total}</p>
                <Button className="mt-6" onClick={() => setShowAssessmentResult(null)}>{tc('back')}</Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{t('assessmentCenter')}</h3>
                  <p className="text-xs text-t3">{t('assessmentDesc')}</p>
                </div>
              </div>

              {/* Available Assessments */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableAssessments.map(assess => (
                  <Card key={assess.course.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={assess.passed ? 'success' : 'default'}>{assess.passed ? t('passed') : assess.course.category}</Badge>
                      <span className="text-xs text-t3">{assess.questionCount} questions</span>
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{assess.course.title}</h3>
                    <p className="text-xs text-t3 mb-3">{assess.course.description}</p>
                    {assess.bestScore !== null && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-t3">{t('bestScore')}: <span className="font-semibold text-t1">{assess.bestScore}%</span></span>
                        <span className="text-xs text-t3">{t('attemptsUsed', { used: assess.attempts, max: assess.maxAttempts })}</span>
                      </div>
                    )}
                    <Button size="sm" variant={assess.passed ? 'outline' : 'primary'}
                      onClick={() => startAssessment(assess.course.id)}
                      disabled={assess.attempts >= assess.maxAttempts && !assess.passed}>
                      {assess.passed ? t('retakeAssessment') : assess.attempts > 0 ? t('retakeAssessment') : t('startAssessment')}
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Assessment History */}
              {myAssessments.length > 0 && (
                <Card padding="none">
                  <CardHeader><CardTitle>{t('assessmentHistory')}</CardTitle></CardHeader>
                  <div className="divide-y divide-divider">
                    {myAssessments.map(att => (
                      <div key={att.id} className="px-6 py-3 flex items-center gap-4">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', att.status === 'passed' ? 'bg-green-100' : 'bg-red-100')}>
                          {att.status === 'passed' ? <CheckCircle size={14} className="text-green-600" /> : <AlertTriangle size={14} className="text-red-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-t1">{att.quiz_title}</p>
                          <p className="text-[0.6rem] text-t3">{t('attemptDate')}: {new Date(att.completed_at).toLocaleDateString()} · {att.time_taken_minutes} min</p>
                        </div>
                        <span className="text-sm font-bold text-t1">{att.score}%</span>
                        <Badge variant={att.status === 'passed' ? 'success' : 'error'}>{att.status === 'passed' ? t('passed') : t('failed')}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'skills' && (() => {
        // Build skills matrix from courses and enrollments
        const categories = [...new Set(courses.map(c => c.category))].filter(Boolean)
        const defaultCategories = ['Leadership', 'Technical', 'Compliance', 'Management', 'Service', 'Technology']
        const allCategories = categories.length > 0 ? categories : defaultCategories
        const skillsData = allCategories.map(cat => {
          const catCourses = courses.filter(c => c.category === cat)
          const catEnrollments = enrollments.filter(e => catCourses.some(c => c.id === e.course_id))
          const completedEnrollments = catEnrollments.filter(e => e.status === 'completed')
          const proficiency = catEnrollments.length > 0
            ? Math.round(catEnrollments.reduce((a, e) => a + e.progress, 0) / catEnrollments.length)
            : 0
          const uniqueEmployees = new Set(catEnrollments.map(e => e.employee_id)).size
          return { skill: cat, proficiency, count: uniqueEmployees, courseCount: catCourses.length }
        })
        // Add skill gap categories that have no courses yet
        const gapCategories = skillGaps.filter(g => !allCategories.includes(g.category))
        gapCategories.forEach(g => {
          skillsData.push({ skill: g.category, proficiency: g.coverage, count: 0, courseCount: 0 })
        })
        return (
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('skillsMatrix')}</h3>
            {skillsData.length === 0 ? (
              <div className="text-center py-8 text-sm text-t3">{t('skillsMatrixEmpty')}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {skillsData.map((item) => (
                  <div key={item.skill} className="bg-canvas rounded-lg p-4">
                    <p className="text-xs font-medium text-t1 mb-2">{item.skill}</p>
                    <Progress value={item.proficiency} showLabel />
                    <p className="text-[0.6rem] text-t3 mt-1">{t('enrolledAcross', { count: item.count, courseCount: item.courseCount })}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}

      {/* AI Course Builder Tab */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('aiBuilder')}</h3>
              <p className="text-xs text-t3">{t('aiBuilderDescription')}</p>
            </div>
            <Button size="sm" onClick={() => { setGeneratedOutline(null); setShowBuilderModal(true) }}>
              <Sparkles size={14} /> {t('createFromScratch')}
            </Button>
          </div>

          {/* AI Course Generation from Documents */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-tempo-600" />
              <h4 className="text-sm font-semibold text-t1">{t('docUploadTitle')}</h4>
              <Badge variant="ai">{tc('aiPowered')}</Badge>
            </div>
            <p className="text-xs text-t3 mb-4">{t('docUploadDesc')}</p>

            {docUploadState === 'idle' && (
              <button
                onClick={handleDocFileSelect}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDocDragOver(true) }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDocDragOver(false) }}
                onDrop={handleDocDrop}
                className={cn(
                  'w-full border-2 border-dashed rounded-xl p-8 text-center transition-all group',
                  docDragOver
                    ? 'border-tempo-500 bg-tempo-50/50 scale-[1.02]'
                    : 'border-divider hover:border-tempo-400 hover:bg-tempo-50/30'
                )}>
                <Upload size={32} className={cn('mx-auto mb-3 transition-colors', docDragOver ? 'text-tempo-600' : 'text-t3 group-hover:text-tempo-600')} />
                <p className={cn('text-sm font-semibold mb-1 transition-colors', docDragOver ? 'text-tempo-600' : 'text-t2 group-hover:text-tempo-600')}>
                  {docDragOver ? 'Drop your file here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-t3 mt-1">PDF, Word, PowerPoint, or text files — AI will generate a complete course</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-[0.6rem] text-t3">
                  <span className="px-2 py-0.5 border border-divider rounded">.pdf</span>
                  <span className="px-2 py-0.5 border border-divider rounded">.docx</span>
                  <span className="px-2 py-0.5 border border-divider rounded">.pptx</span>
                  <span className="px-2 py-0.5 border border-divider rounded">.txt</span>
                </div>
              </button>
            )}

            {docUploadState === 'parsing' && (
              <div className="bg-canvas rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AIPulse size="md" />
                  <div>
                    <p className="text-sm font-medium text-t1">{t('parsingDocument')}</p>
                    <p className="text-xs text-t3">{docParsingStage}</p>
                  </div>
                </div>
                <Progress value={docParsingProgress} showLabel color="orange" />
              </div>
            )}

            {docUploadState === 'done' && parsedDocCourse && (
              <div className="space-y-4">
                <div className="bg-canvas rounded-xl p-4">
                  {/* Editable course title */}
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-tempo-600" />
                    <input
                      className="text-sm font-semibold text-t1 bg-transparent border-b border-transparent hover:border-divider focus:border-tempo-500 focus:outline-none transition-colors flex-1"
                      value={parsedDocCourse.title}
                      onChange={(e) => setParsedDocCourse({ ...parsedDocCourse, title: e.target.value })}
                    />
                    <Badge variant="success">Ready to Create</Badge>
                  </div>
                  {/* Editable description */}
                  <textarea
                    className="text-xs text-t3 mb-3 w-full bg-transparent border border-transparent hover:border-divider focus:border-tempo-500 focus:outline-none rounded px-1 py-0.5 resize-none transition-colors"
                    rows={2}
                    value={parsedDocCourse.description}
                    onChange={(e) => setParsedDocCourse({ ...parsedDocCourse, description: e.target.value })}
                  />
                  <div className="flex items-center gap-4 text-xs text-t3 mb-3">
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {parsedDocCourse.modules.length} modules</span>
                    <span className="flex items-center gap-1"><FileText size={12} /> {parsedDocCourse.modules.reduce((a, m) => a + m.lessons.length, 0)} lessons</span>
                    <span className="flex items-center gap-1"><HelpCircle size={12} /> {parsedDocCourse.quizQuestions.length} quiz questions</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDurationRange(parsedDocCourse.modules.reduce((a, m) => a + m.duration_minutes, 0))} total</span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {parsedDocCourse.modules.map((mod, mi) => (
                      <div key={mi} className="bg-surface rounded-lg p-3 group/mod">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            className="text-xs font-semibold text-t1 bg-transparent border-b border-transparent hover:border-divider focus:border-tempo-500 focus:outline-none flex-1 mr-2 transition-colors"
                            value={`Module ${mi + 1}: ${mod.title}`}
                            onChange={(e) => {
                              const newTitle = e.target.value.replace(/^Module \d+:\s*/, '')
                              const updated = { ...parsedDocCourse, modules: parsedDocCourse.modules.map((m, i) => i === mi ? { ...m, title: newTitle } : m) }
                              setParsedDocCourse(updated)
                            }}
                          />
                          <span className="text-[0.6rem] text-t3 shrink-0">{formatDurationRange(mod.duration_minutes)}</span>
                        </div>
                        <div className="space-y-1">
                          {mod.lessons.map((lesson, li) => (
                            <div key={li} className="flex items-center gap-2 text-[0.65rem] text-t2 group/lesson">
                              {lesson.type === 'text' && <FileText size={10} className="text-blue-500 shrink-0" />}
                              {lesson.type === 'infographic' && <BarChart3 size={10} className="text-violet-500 shrink-0" />}
                              {lesson.type === 'video' && <Video size={10} className="text-purple-500 shrink-0" />}
                              {lesson.type === 'interactive' && <Zap size={10} className="text-amber-500 shrink-0" />}
                              {lesson.type === 'quiz' && <HelpCircle size={10} className="text-green-500 shrink-0" />}
                              {lesson.type === 'download' && <Download size={10} className="text-gray-500 shrink-0" />}
                              <input
                                className="flex-1 bg-transparent border-b border-transparent hover:border-divider focus:border-tempo-500 focus:outline-none transition-colors text-[0.65rem]"
                                value={lesson.title}
                                onChange={(e) => {
                                  const updated = { ...parsedDocCourse, modules: parsedDocCourse.modules.map((m, i) =>
                                    i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, title: e.target.value } : l) } : m
                                  )}
                                  setParsedDocCourse(updated)
                                }}
                              />
                              <span className="text-t3 shrink-0">{formatLessonDuration(lesson.duration_minutes)}</span>
                              <button
                                className="opacity-0 group-hover/lesson:opacity-100 text-red-400 hover:text-red-600 transition-opacity shrink-0"
                                title="Remove lesson"
                                onClick={() => {
                                  const newLessons = mod.lessons.filter((_, j) => j !== li)
                                  const updated = { ...parsedDocCourse, modules: parsedDocCourse.modules.map((m, i) =>
                                    i === mi ? { ...m, lessons: newLessons, duration_minutes: newLessons.reduce((a, l) => a + l.duration_minutes, 0) } : m
                                  ).filter(m => m.lessons.length > 0) }
                                  setParsedDocCourse(updated)
                                }}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[0.6rem] text-t3 mt-2 italic">Click any title to edit. Hover lessons to remove.</p>
                </div>
                {uploadedFileName && (
                  <div className="flex items-center gap-2 text-xs text-t3 bg-canvas rounded-lg px-3 py-2">
                    <FileText size={14} className="text-tempo-600" />
                    <span>Source: <strong>{uploadedFileName}</strong></span>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => { setDocUploadState('idle'); setParsedDocCourse(null); setUploadedFileName(''); setUploadedFileContent('') }}>Cancel</Button>
                  <Button onClick={handleSaveDocCourse}><Sparkles size={14} /> Create Course ({parsedDocCourse.modules.reduce((a, m) => a + m.lessons.length, 0)} lessons)</Button>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiBuilderTemplates.map(tpl => (
              <Card key={tpl.id}>
                <div className="flex items-start justify-between mb-2">
                  <Badge>{tpl.category}</Badge>
                  <Sparkles size={14} className="text-tempo-600" />
                </div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{tpl.title}</h3>
                <p className="text-xs text-t3 mb-3 line-clamp-2">{tpl.description}</p>
                <div className="flex items-center justify-between text-xs text-t3">
                  <span>{tpl.estimated_duration}h - {tpl.module_count} {t('modules')}</span>
                  <Button size="sm" variant="outline" onClick={() => {
                    setBuilderForm({ topic: tpl.title, level: 'intermediate', duration: tpl.estimated_duration })
                    setGeneratedOutline(null)
                    setShowBuilderModal(true)
                  }}>{t('generateCourse')}</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-t1">{t('liveSessions')}</h3>
            <Button size="sm" onClick={() => setShowSessionModal(true)}>
              <Plus size={14} /> {t('scheduleSession')}
            </Button>
          </div>

          {liveSessions.length === 0 ? (
            <Card><div className="text-center py-8 text-sm text-t3">No live sessions scheduled yet. Click &quot;Schedule Session&quot; to create one.</div></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveSessions.map(session => {
                const course = courses.find(c => c.id === session.course_id)
                return (
                  <Card key={session.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={session.status === 'upcoming' ? 'info' : session.status === 'completed' ? 'default' : 'success'}>
                        {session.status === 'upcoming' ? t('upcoming') : session.status === 'completed' ? tc('completed') : t('liveNow')}
                      </Badge>
                      <Badge>{session.type === 'q_and_a' ? t('qAndA') : session.type === 'workshop' ? t('workshop') : t('webinar')}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{session.title}</h3>
                    {course && <p className="text-xs text-t3 mb-2">{course.title}</p>}
                    <div className="space-y-1 text-xs text-t3 mb-3">
                      <div className="flex items-center gap-2"><UsersIcon size={12} /> {t('instructor')}: {session.instructor}</div>
                      <div className="flex items-center gap-2"><Clock size={12} /> {new Date(session.scheduled_at).toLocaleDateString()} - {session.duration_minutes}min</div>
                      <div className="flex items-center gap-2"><Video size={12} /> {t('capacity')}: {session.enrolled_count}/{session.capacity}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Progress value={Math.round((session.enrolled_count / session.capacity) * 100)} className="flex-1 mr-3" />
                      {session.status === 'upcoming' && (
                        <Button size="sm" variant="primary" onClick={() => session.meeting_url ? window.open(session.meeting_url, '_blank') : addToast('Meeting link not yet available')}>
                          {t('joinSession')}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Learning Paths Tab */}
      {activeTab === 'paths' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-t1">{t('learningPaths')}</h3>
            <Button size="sm" onClick={() => setShowPathModal(true)}>
              <Plus size={14} /> {t('createPath')}
            </Button>
          </div>

          {learningPaths.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Route size={40} className="mx-auto text-t3 mb-3 opacity-50" />
                <p className="text-sm font-medium text-t1 mb-1">No learning paths</p>
                <p className="text-xs text-t3 mb-4">Create structured learning journeys for your team</p>
                <Button size="sm" onClick={() => setShowPathModal(true)}><Plus size={14} /> Create Learning Path</Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPaths.map(path => {
                const pathCourses = courses.filter(c => path.course_ids.includes(c.id))
                const pathEnrollments = enrollments.filter(e => path.course_ids.includes(e.course_id))
                const avgProgress = pathEnrollments.length > 0
                  ? Math.round(pathEnrollments.reduce((a, e) => a + e.progress, 0) / pathEnrollments.length)
                  : 0
                return (
                  <Card key={path.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={path.level === 'advanced' ? 'error' : path.level === 'intermediate' ? 'warning' : 'default'}>
                        {path.level}
                      </Badge>
                      <Route size={14} className="text-tempo-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{path.title}</h3>
                    <p className="text-xs text-t3 mb-3 line-clamp-2">{path.description}</p>
                    <div className="space-y-2 mb-3">
                      {pathCourses.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-xs">
                          <BookOpen size={10} className="text-t3" />
                          <span className="text-t2">{c.title}</span>
                          <span className="text-t3 ml-auto">{c.duration_hours}h</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-t3 pt-2 border-t border-divider">
                      <span>{t('estimatedHours')}: {path.estimated_hours}h</span>
                      <span>{pathCourses.length} {t('coursesInPath')}</span>
                    </div>
                    {avgProgress > 0 && (
                      <div className="mt-2">
                        <Progress value={avgProgress} showLabel color="orange" />
                      </div>
                    )}
                    {/* Enroll in Path button */}
                    {(() => {
                      const allEnrolled = pathCourses.every(c => enrollments.some(e => e.course_id === c.id && e.employee_id === currentEmployeeId))
                      return !allEnrolled ? (
                        <div className="mt-3 pt-2 border-t border-divider">
                          <Button size="sm" variant="primary" className="w-full" onClick={() => {
                            let enrolled = 0
                            pathCourses.forEach(c => {
                              const alreadyEnrolled = enrollments.some(e => e.course_id === c.id && e.employee_id === currentEmployeeId)
                              if (!alreadyEnrolled) {
                                addEnrollment({ employee_id: currentEmployeeId, course_id: c.id, status: 'enrolled', progress: 0 })
                                enrolled++
                              }
                            })
                            addToast(`Enrolled in ${enrolled} course${enrolled !== 1 ? 's' : ''} from "${path.title}"`)
                          }}>
                            <ArrowRight size={12} /> Enroll in Path
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2 border-t border-divider flex items-center gap-1.5 text-xs text-green-600">
                          <CheckCircle size={12} /> Enrolled in all courses
                        </div>
                      )
                    })()}
                    {/* Career Path Integration (Tempo Differentiator) */}
                    {path.level === 'advanced' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-divider">
                        <Briefcase size={10} className="text-purple-500" />
                        <span className="text-[0.6rem] text-purple-600 font-medium">{t('linkedToCareer')} · {t('requiredForPromotion', { role: 'Senior Manager' })}</span>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <Programs
          courses={courses}
          employees={employees}
          departments={departments}
          enrollments={enrollments}
          getEmployeeName={getEmployeeName}
          getDepartmentName={getDepartmentName}
          addToast={addToast}
        />
      )}

      {/* Analytics Dashboard Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('analyticsOverview')}</h3>
              <p className="text-xs text-t3">{t('analyticsDesc')}</p>
            </div>
            <Badge variant="ai"><Sparkles size={12} /> {tc('aiPowered')}</Badge>
          </div>

          {/* ROI Dashboard (Tempo Differentiator) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label={t('roiMultiplier')} value={`${analyticsData.roiMultiplier}x`} icon={<TrendingUp size={20} />} change="vs 3.1x last quarter" changeType="positive" />
            <StatCard label={t('performanceImprovement')} value={`+${analyticsData.performanceImprovement}%`} icon={<Activity size={20} />} change={t('afterTraining')} changeType="positive" />
            <StatCard label={t('retentionImpact')} value={`+${analyticsData.retentionImpact}%`} icon={<UsersIcon size={20} />} change="Year over year" changeType="positive" />
            <StatCard label={t('costPerLearner')} value={`$${analyticsData.costPerLearner}`} icon={<BarChart3 size={20} />} change={tc('perEmployee')} changeType="neutral" />
            <StatCard label={t('totalInvestment')} value={`$${(analyticsData.totalInvestment / 1000).toFixed(0)}K`} icon={<Layers size={20} />} change="Annual budget" changeType="neutral" />
          </div>

          {/* AI Insight */}
          <AIInsightCard insight={{
            id: 'ai-roi-learning',
            category: 'recommendation' as const,
            severity: 'positive' as const,
            title: t('roiDashboard'),
            description: t('roiDesc'),
            confidence: 'high' as const,
            confidenceScore: 88,
            suggestedAction: 'Invest 15% more in technical training for highest ROI impact',
            module: 'learning',
          }} compact />

          {/* Course Effectiveness */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('courseEffectiveness')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-canvas">
                  <tr>
                    <th className="text-left px-6 py-3 text-t3 font-medium">Course</th>
                    <th className="text-center px-4 py-3 text-t3 font-medium">{t('completionRate')}</th>
                    <th className="text-center px-4 py-3 text-t3 font-medium">{t('avgScore')}</th>
                    <th className="text-center px-4 py-3 text-t3 font-medium">{t('satisfactionScore')}</th>
                    <th className="text-center px-4 py-3 text-t3 font-medium">{t('dropoffRate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {analyticsData.courseEffectiveness.map(ce => (
                    <tr key={ce.title}>
                      <td className="px-6 py-3 font-medium text-t1">{ce.title}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={ce.completionRate} className="w-16" />
                          <span>{ce.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{ce.avgScore}%</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span>{ce.satisfaction.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-amber-600">{ce.dropoff}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Department Comparison */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('departmentComparison')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {analyticsData.deptLearningHours.filter(d => d.enrollments > 0).map(d => (
                <div key={d.name} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{d.name}</p>
                    <p className="text-[0.6rem] text-t3">{d.enrollments} enrollments · {d.hours}h completed</p>
                  </div>
                  <div className="w-40">
                    <Progress value={Math.min(100, d.hours * 2)} showLabel />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Completion Trend */}
          <Card>
            <h4 className="text-sm font-semibold text-t1 mb-4">{t('completionTrends')}</h4>
            <div className="flex items-end gap-2 h-32">
              {analyticsData.monthlyCompletions.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-tempo-100 rounded-t" style={{ height: `${(v / 35) * 100}%` }}>
                    <div className="w-full bg-tempo-500 rounded-t h-full" />
                  </div>
                  <span className="text-[0.5rem] text-t3">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Administration Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Auto-Enrollment Rules Section */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('autoEnrollment')}</h3>
              <p className="text-xs text-t3">{t('autoEnrollmentDesc')}</p>
            </div>
            <Button size="sm" onClick={() => setShowRuleModal(true)}><Plus size={14} /> {t('createRule')}</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autoEnrollRules.map(rule => (
              <Card key={rule.id}>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={rule.is_active ? 'success' : 'default'}>{rule.is_active ? tc('active') : tc('inactive')}</Badge>
                  <div className="flex gap-1">
                    <button onClick={() => updateAutoEnrollRule(rule.id, { is_active: !rule.is_active })}
                      className="text-xs text-t3 hover:text-tempo-600">{rule.is_active ? tc('deactivate') : tc('activate')}</button>
                    <button onClick={() => confirmDelete('rule', rule.id, rule.name)}
                      className="text-xs text-red-500 hover:text-red-700 ml-2">×</button>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{rule.name}</h3>
                <div className="space-y-1 text-xs text-t3 mb-3">
                  <p><span className="font-medium text-t2">{t('ruleCondition')}:</span> {rule.condition_type === 'department_join' ? t('whenEmployeeJoins') : rule.condition_type === 'role_match' ? t('whenRoleIs') : t('whenComplianceDue')}: {rule.condition_value}</p>
                  <p><span className="font-medium text-t2">{t('ruleAction')}:</span> {rule.action_type === 'enroll_course' ? t('enrollInCourse') : t('enrollInPath')}: {rule.action_target_name}</p>
                </div>
                <div className="flex items-center justify-between text-[0.6rem] text-t3 pt-2 border-t border-divider">
                  <span>{t('ruleTriggered', { count: rule.triggered_count })}</span>
                  <span>{new Date(rule.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Manager Learning Plans Section (Tempo Differentiator) */}
          <div className="flex items-center justify-between mt-8">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('managerLearningPlans')}</h3>
              <p className="text-xs text-t3">{t('managerPlansDesc')}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAssignModal(true)}><Plus size={14} /> {t('assignLearning')}</Button>
          </div>

          <Card padding="none">
            <CardHeader><CardTitle>{t('learningAssignments')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {learningAssignments.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-t3">{t('noAssignments')}</div>
              ) : learningAssignments.map(assignment => {
                const emp = employees.find(e => e.id === assignment.employee_id)
                const course = courses.find(c => c.id === assignment.course_id)
                const assigner = employees.find(e => e.id === assignment.assigned_by)
                const daysUntil = assignment.due_date ? Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / 86400000) : null
                return (
                  <div key={assignment.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                      {(emp?.profile.full_name || '?').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-t1">{emp?.profile.full_name} → {course?.title}</p>
                      <p className="text-xs text-t3">{t('assignedBy', { name: assigner?.profile.full_name || 'Manager' })} · {assignment.reason}</p>
                      {assignment.linked_review_id && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="ai">{t('performanceLinked')}</Badge>
                          <span className="text-[0.6rem] text-t3">{t('fromPerformanceReview')}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant={assignment.status === 'in_progress' ? 'warning' : assignment.status === 'completed' ? 'success' : 'default'}>{assignment.status.replace('_', ' ')}</Badge>
                    {daysUntil !== null && (
                      <span className={cn('text-xs', daysUntil < 7 ? 'text-red-500' : 'text-t3')}>
                        {daysUntil < 0 ? t('overdueDays', { days: Math.abs(daysUntil) }) : t('dueIn', { days: daysUntil })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* T5 #39: Mandatory Course Exemptions */}
          <div className="flex items-center justify-between mt-8">
            <div>
              <h3 className="text-sm font-semibold text-t1">Course Exemptions</h3>
              <p className="text-xs text-t3">Define which roles, countries, or levels are exempt from mandatory courses</p>
            </div>
            <Button size="sm" onClick={() => setShowExemptionModal(true)}><Plus size={14} /> Add Exemption</Button>
          </div>
          {exemptions.length > 0 ? (
            <Card padding="none">
              <div className="divide-y divide-divider">
                {exemptions.map((ex: any) => {
                  const course = courses.find(c => c.id === (ex.course_id || ex.courseId))
                  return (
                    <div key={ex.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-t1">{course?.title || 'Unknown course'}</p>
                        <p className="text-xs text-t3">Exempt: {ex.criteria_type || ex.criteriaType} = {ex.criteria_value || ex.criteriaValue} {(ex.reason) ? `— ${ex.reason}` : ''}</p>
                      </div>
                      <button onClick={() => removeExemption(ex.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  )
                })}
              </div>
            </Card>
          ) : (
            <Card><p className="text-sm text-t3 text-center py-4">No exemptions defined. All employees must complete mandatory courses.</p></Card>
          )}

          <Modal open={showExemptionModal} onClose={() => setShowExemptionModal(false)} title="Add Course Exemption">
            <div className="space-y-4">
              <Select label="Mandatory Course" value={exemptionForm.course_id} onChange={e => setExemptionForm(f => ({ ...f, course_id: e.target.value }))}
                options={[{ value: '', label: 'Select course...' }, ...courses.filter(c => c.is_mandatory).map(c => ({ value: c.id, label: c.title }))]} />
              <Select label="Exemption Criteria" value={exemptionForm.criteria_type} onChange={e => setExemptionForm(f => ({ ...f, criteria_type: e.target.value }))}
                options={[{ value: 'role', label: 'By Role' }, { value: 'country', label: 'By Country' }, { value: 'level', label: 'By Level' }]} />
              <Input label="Criteria Value" value={exemptionForm.criteria_value} onChange={e => setExemptionForm(f => ({ ...f, criteria_value: e.target.value }))} placeholder={exemptionForm.criteria_type === 'role' ? 'e.g. manager' : exemptionForm.criteria_type === 'country' ? 'e.g. Ghana' : 'e.g. Senior'} />
              <Input label="Reason (optional)" value={exemptionForm.reason} onChange={e => setExemptionForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Already certified externally" />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowExemptionModal(false)}>Cancel</Button>
                <Button onClick={addExemption} disabled={!exemptionForm.course_id || !exemptionForm.criteria_value}>Add Exemption</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Course Builder Tab — Articulate-style Authoring */}
      {activeTab === 'course-builder' && (
        <div className="space-y-4">
          {/* Top toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-t1">Course Studio</h3>
              {selectedBuilderCourse && (() => {
                const course = courses.find(c => c.id === selectedBuilderCourse)
                return course ? (
                  <div className="flex items-center gap-2">
                    <Badge variant={(course as any).status === 'published' ? 'success' : 'default'}>{(course as any).status === 'published' ? 'Live' : 'Draft'}</Badge>
                    <span className="text-xs text-t3">{filteredBlocks.length} blocks · {filteredBlocks.reduce((s, b) => s + (b.duration_minutes || 0), 0)} min</span>
                  </div>
                ) : null
              })()}
            </div>
            <div className="flex items-center gap-2">
              {selectedBuilderCourse && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setAiWritingOpen(!aiWritingOpen)}>
                    <Sparkles size={14} /> AI Assist
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const outline = generateCourseOutline(courses.find(c => c.id === selectedBuilderCourse)?.title || 'Course', 'intermediate', 8)
                    outline.modules.forEach((mod, mi) => {
                      mod.lessons.forEach((lesson, li) => {
                        addCourseBlock({ course_id: selectedBuilderCourse, module_index: mi, order: li, type: 'text', title: lesson, content: `Content for ${lesson}`, duration_minutes: mod.duration_minutes / mod.lessons.length, status: 'draft' })
                      })
                    })
                  }}>
                    <Sparkles size={14} /> Auto-Generate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    // One-click preview: auto-enroll if needed, then launch player
                    const existing = enrollments.find(e => e.course_id === selectedBuilderCourse && e.employee_id === currentEmployeeId)
                    if (existing) {
                      setPlayerCourseId(selectedBuilderCourse)
                      setPlayerEnrollmentId(existing.id)
                    } else {
                      const enrollId = crypto.randomUUID()
                      addEnrollment({ id: enrollId, employee_id: currentEmployeeId, course_id: selectedBuilderCourse, status: 'enrolled', progress: 0 })
                      // Launch immediately with pre-generated ID
                      setTimeout(() => {
                        setPlayerCourseId(selectedBuilderCourse)
                        setPlayerEnrollmentId(enrollId)
                      }, 100)
                    }
                  }}>
                    <Eye size={14} /> Preview
                  </Button>
                  <Button size="sm" variant="primary" onClick={publishAllBlocks}>
                    <Send size={14} /> Publish Course
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => setShowNewCourseFlow(true)}>
                <Plus size={14} /> New Course
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left Sidebar — Course List + Outline */}
            <div className="lg:col-span-1 space-y-3">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-t1">My Courses</h4>
                </div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {courses.map(course => {
                    const blocks = courseBlocks.filter(b => b.course_id === course.id)
                    const isSelected = selectedBuilderCourse === course.id
                    const publishedCount = blocks.filter(b => b.status === 'published').length
                    return (
                      <button key={course.id} onClick={() => { setSelectedBuilderCourse(course.id); setAuthoringMode(true); setEditingBlockId(null) }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${isSelected ? 'bg-tempo-500/10 border border-tempo-500/20 shadow-sm' : 'hover:bg-canvas border border-transparent'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${(course as any).status === 'published' ? 'bg-green-400' : 'bg-amber-400'}`} />
                          <p className="font-medium text-t1 truncate flex-1">{course.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-4">
                          <span className="text-[0.6rem] text-t3">{blocks.length} blocks</span>
                          {blocks.length > 0 && (
                            <div className="flex-1 h-1 bg-canvas rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${blocks.length ? (publishedCount / blocks.length) * 100 : 0}%` }} />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Card>

              {/* Block outline for selected course */}
              {selectedBuilderCourse && filteredBlocks.length > 0 && (
                <Card>
                  <h4 className="text-xs font-semibold text-t1 mb-2">Outline</h4>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {filteredBlocks.map((block, idx) => (
                      <button key={block.id} onClick={() => setEditingBlockId(block.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-[0.65rem] transition-colors flex items-center gap-1.5 ${editingBlockId === block.id ? 'bg-tempo-500/10 text-tempo-600' : 'hover:bg-canvas text-t2'}`}>
                        <span className="text-t3 w-4 text-right shrink-0">{idx + 1}</span>
                        {blockTypeIcon(block.type, 10)}
                        <span className="truncate">{block.title}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Main Authoring Canvas */}
            <div className="lg:col-span-4">
              {/* AI Writing Assistant Panel (collapsible) */}
              {aiWritingOpen && (
                <Card className="border-tempo-200 bg-tempo-50/30 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-tempo-600" />
                      <h4 className="text-sm font-semibold text-t1">AI Writing Assistant</h4>
                      <Badge variant="ai">Claude</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { setAiWritingOpen(false); setAiWritingResult('') }}>×</Button>
                  </div>
                  <Textarea value={aiWritingText} onChange={(e) => setAiWritingText(e.target.value)} placeholder="Paste or type content here for AI assistance..." rows={3} className="mb-3" />
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { action: 'continue', label: 'Continue', icon: <PenTool size={12} /> },
                      { action: 'shorten', label: 'Shorten', icon: <AlignLeft size={12} /> },
                      { action: 'rephrase', label: 'Rephrase', icon: <Zap size={12} /> },
                      { action: 'simplify', label: 'Simplify', icon: <BookOpen size={12} /> },
                      { action: 'add_examples', label: 'Examples', icon: <ListChecks size={12} /> },
                      { action: 'generate_quiz', label: 'Quiz', icon: <HelpCircle size={12} /> },
                    ].map(({ action, label, icon }) => (
                      <Button key={action} size="sm" variant={aiWritingAction === action && aiWritingLoading ? 'primary' : 'outline'}
                        onClick={() => handleAiWritingAssist(action, aiWritingText)}
                        disabled={aiWritingLoading || !aiWritingText}>
                        {aiWritingLoading && aiWritingAction === action ? <AIPulse size="sm" /> : icon} {label}
                      </Button>
                    ))}
                  </div>
                  {aiWritingResult && (
                    <div className="bg-surface rounded-lg p-3 border border-divider">
                      <p className="text-xs text-t1 whitespace-pre-wrap">{aiWritingResult}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="primary" onClick={() => { setAiWritingText(aiWritingResult); setAiWritingResult('') }}>Use this</Button>
                        <Button size="sm" variant="outline" onClick={() => setAiWritingResult('')}>Discard</Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {!selectedBuilderCourse ? (
                /* Empty state — no course selected */
                <div className="space-y-4">
                  <Card>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-tempo-500/10 flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={28} className="text-tempo-400" />
                      </div>
                      <h3 className="text-base font-semibold text-t1 mb-2">Create Your First Course</h3>
                      <p className="text-xs text-t3 max-w-md mx-auto mb-6">Build interactive courses with text, images, videos, quizzes, and more. Just like Articulate Rise — but built right into Tempo.</p>
                      <div className="flex justify-center gap-3">
                        <Button onClick={() => setShowNewCourseFlow(true)}>
                          <Plus size={14} /> Start from Scratch
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('builder')}>
                          <Sparkles size={14} /> Generate with AI
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Starter Templates */}
                  <Card>
                    <h4 className="text-sm font-semibold text-t1 mb-1">Quick Start Templates</h4>
                    <p className="text-[0.65rem] text-t3 mb-4">Pick a template to get started instantly — customize everything after</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { title: 'Employee Onboarding', desc: 'Welcome pack, policies, role setup', icon: <UserCheck size={20} />, color: 'from-green-500 to-emerald-500', blocks: [
                          { type: 'heading', title: 'Welcome to the Team', content: 'Welcome to the Team' },
                          { type: 'text', title: 'Company Overview', content: 'Welcome to our company! This section introduces our mission, values, and culture.\n\n**Our Mission:** To deliver exceptional value to our customers and communities.\n\n**Core Values:**\n• Integrity in everything we do\n• Innovation and continuous improvement\n• Collaboration and teamwork\n• Customer-first mindset' },
                          { type: 'image', title: 'Office & Team', content: '{"url":"","alt":"Our office and team","caption":"Meet your new colleagues"}' },
                          { type: 'accordion', title: 'Key Policies', content: '{"sections":[{"heading":"Working Hours & Flexibility","body":"Our standard working hours are 9am-5pm with flexible start times. Remote work is available 2 days per week."},{"heading":"Leave & Time Off","body":"You are entitled to 25 days annual leave plus public holidays. Leave requests should be submitted at least 2 weeks in advance."},{"heading":"Code of Conduct","body":"We maintain a professional, inclusive workplace. Please review the full code of conduct in the employee handbook."}]}' },
                          { type: 'callout', title: 'Important Tip', content: '{"style":"tip","text":"Set up your IT accounts, Slack workspace, and email signature in your first week. Ask your buddy if you need help!"}' },
                          { type: 'quiz', title: 'Onboarding Check', content: '{"question":"What is the best way to request time off?","options":["Email your manager","Submit through the leave system","Text a colleague","Skip work without notice"],"correct":1}' },
                          { type: 'download', title: 'Employee Handbook', content: '{"filename":"Employee-Handbook.pdf","url":"","description":"Complete employee handbook with all policies and procedures"}' },
                        ]},
                        { title: 'Compliance Training', desc: 'Policies, regulations, assessments', icon: <Shield size={20} />, color: 'from-blue-500 to-indigo-500', blocks: [
                          { type: 'heading', title: 'Compliance Training', content: 'Annual Compliance Training' },
                          { type: 'text', title: 'Why Compliance Matters', content: 'Compliance training is essential for protecting our organization, our clients, and ourselves.\n\n**Key Areas:**\n• Regulatory requirements\n• Data privacy and protection\n• Anti-money laundering (AML)\n• Anti-bribery and corruption\n• Workplace safety' },
                          { type: 'callout', title: 'Regulatory Notice', content: '{"style":"important","text":"This training is mandatory for all employees and must be completed within 30 days. Failure to complete may result in restricted system access."}' },
                          { type: 'text', title: 'Data Privacy Essentials', content: 'Protecting personal data is a legal obligation under GDPR, CCPA, and other regulations.\n\n**Key Principles:**\n1. Only collect data you genuinely need\n2. Store data securely with encryption\n3. Never share personal data without authorization\n4. Report any data breaches immediately\n5. Delete data when no longer needed' },
                          { type: 'quiz', title: 'Compliance Check', content: '{"question":"What should you do if you suspect a data breach?","options":["Ignore it","Report it immediately to the compliance team","Try to fix it yourself","Wait until the next meeting"],"correct":1}' },
                          { type: 'quiz', title: 'AML Knowledge Check', content: '{"question":"Which of these is a red flag for potential money laundering?","options":["A customer makes regular monthly payments","A customer makes unusually large cash deposits","A customer opens a savings account","A customer asks about interest rates"],"correct":1}' },
                        ]},
                        { title: 'Skills Workshop', desc: 'Lessons, exercises, certification', icon: <Target size={20} />, color: 'from-purple-500 to-pink-500', blocks: [
                          { type: 'heading', title: 'Skills Workshop', content: 'Skills Workshop' },
                          { type: 'text', title: 'Workshop Overview', content: "Welcome to this skills development workshop. By the end of this course, you will have practical skills you can apply immediately.\n\n**What You'll Learn:**\n• Core concepts and frameworks\n• Hands-on techniques\n• Real-world application strategies\n• Self-assessment tools" },
                          { type: 'columns', title: 'Key Concepts', content: '{"left":"**Theory:** Understand the fundamental principles that drive success in this area. We will cover the latest research and proven frameworks.","right":"**Practice:** Apply what you have learned through guided exercises and real-world scenarios. Each activity builds on the previous one."}' },
                          { type: 'interactive', title: 'Hands-on Exercise', content: '{"type":"scenario","items":[{"front":"Apply the framework to a real scenario","back":"Follow the step-by-step guide to practice"}]}' },
                          { type: 'quiz', title: 'Skills Assessment', content: '{"question":"What is the most effective way to develop a new skill?","options":["Read about it once","Practice consistently with feedback","Watch others do it","Attend a single workshop"],"correct":1}' },
                          { type: 'button', title: 'Get Certified', content: '{"label":"Complete & Get Certificate","url":"#","style":"primary"}' },
                        ]},
                      ].map(template => (
                        <button key={template.title} onClick={() => {
                          const courseId = crypto.randomUUID()
                          addCourse({
                            id: courseId,
                            title: template.title,
                            description: template.desc,
                            category: template.title.includes('Compliance') ? 'Compliance' : template.title.includes('Onboard') ? 'Onboarding' : 'General',
                            level: 'beginner',
                            format: 'online',
                            duration_hours: 1,
                            is_mandatory: template.title.includes('Compliance'),
                            status: 'draft',
                          })
                          template.blocks.forEach((b, i) => {
                            addCourseBlock({ course_id: courseId, module_index: 0, order: i, type: b.type, title: b.title, content: b.content, duration_minutes: b.type === 'heading' ? 1 : b.type === 'quiz' ? 3 : 5, status: 'draft' })
                          })
                          setTimeout(() => {
                            setSelectedBuilderCourse(courseId)
                            setAuthoringMode(true)
                            addToast(`"${template.title}" template loaded — customize it to fit your needs`)
                          }, 150)
                        }}
                          className="text-left p-4 rounded-xl border border-divider hover:border-tempo-200 hover:shadow-md transition-all group">
                          <div className={`w-full h-16 rounded-lg bg-gradient-to-r ${template.color} mb-3 flex items-center justify-center text-white opacity-80 group-hover:opacity-100 transition-opacity`}>
                            {template.icon}
                          </div>
                          <p className="text-sm font-semibold text-t1">{template.title}</p>
                          <p className="text-[0.65rem] text-t3 mt-0.5">{template.desc}</p>
                          <p className="text-[0.6rem] text-tempo-500 mt-2 flex items-center gap-1"><Sparkles size={10} /> {template.blocks.length} blocks ready</p>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : (
                /* Authoring canvas with blocks */
                <div className="space-y-0">
                  {/* Course header card */}
                  {(() => {
                    const course = courses.find(c => c.id === selectedBuilderCourse)
                    if (!course) return null
                    const coverColors: Record<string, string> = { tempo: 'from-tempo-600 to-orange-500', blue: 'from-blue-600 to-cyan-500', green: 'from-green-600 to-emerald-500', purple: 'from-purple-600 to-pink-500', red: 'from-red-600 to-rose-500' }
                    return (
                      <div className={`rounded-xl bg-gradient-to-r ${coverColors[newCourseForm.cover_color] || coverColors.tempo} p-6 mb-4`}>
                        <input
                          className="text-lg font-bold text-white bg-transparent border-none outline-none w-full placeholder-white/60"
                          value={course.title}
                          onChange={(e) => updateCourse(course.id, { title: e.target.value })}
                          placeholder="Course Title"
                        />
                        <input
                          className="text-xs text-white/80 bg-transparent border-none outline-none w-full mt-1 placeholder-white/40"
                          value={course.description || ''}
                          onChange={(e) => updateCourse(course.id, { description: e.target.value })}
                          placeholder="Add a description..."
                        />
                        <div className="flex items-center gap-3 mt-3">
                          <Badge className="bg-white/20 text-white border-0 text-[0.6rem]">{course.level || 'Beginner'}</Badge>
                          <Badge className="bg-white/20 text-white border-0 text-[0.6rem]">{course.category || 'General'}</Badge>
                          <span className="text-[0.6rem] text-white/60">{filteredBlocks.length} blocks · {filteredBlocks.reduce((s, b) => s + (b.duration_minutes || 0), 0)} min total</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Insert block at top */}
                  <div className="flex justify-center py-2">
                    <button onClick={() => setShowBlockPicker(showBlockPicker === 0 ? null : 0)}
                      className="group flex items-center gap-1 text-t3 hover:text-tempo-500 transition-colors">
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:border-solid">
                        <Plus size={12} />
                      </div>
                      <span className="text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity">Add block</span>
                    </button>
                  </div>
                  {showBlockPicker === 0 && (
                    <div className="mb-2">
                      <Card className="border-tempo-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {BLOCK_CATEGORIES.map(cat => (
                            <div key={cat.label}>
                              <p className="text-[0.6rem] font-semibold text-t3 uppercase tracking-wider mb-2">{cat.label}</p>
                              <div className="space-y-1">
                                {cat.types.map(bt => (
                                  <button key={bt.type} onClick={() => insertBlockAt(bt.type, 0)}
                                    className="w-full text-left p-2 rounded-lg hover:bg-tempo-50 transition-colors group/bt flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-canvas flex items-center justify-center text-t3 group-hover/bt:text-tempo-500 group-hover/bt:bg-tempo-100 transition-colors">
                                      {blockTypeIcon(bt.type, 14)}
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-t1">{bt.label}</p>
                                      <p className="text-[0.55rem] text-t3">{bt.desc}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Render each block as a visual card */}
                  {filteredBlocks.map((block, idx) => {
                    const isEditing = editingBlockId === block.id
                    const isDragging = dragBlockId === block.id
                    const isDragOver = dragOverIdx === idx

                    // Parse JSON content safely
                    let parsed: any = {}
                    try { parsed = JSON.parse(block.content || '{}') } catch { parsed = { text: block.content || '' } }

                    return (
                      <div key={block.id}>
                        {/* Block card */}
                        <div
                          className={`relative group rounded-xl border transition-all ${isEditing ? 'border-tempo-400 shadow-lg shadow-tempo-500/10 ring-1 ring-tempo-400/30' : 'border-divider hover:border-tempo-200'} ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'border-t-2 border-t-tempo-500' : ''} bg-surface`}
                          draggable
                          onDragStart={() => setDragBlockId(block.id)}
                          onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
                          onDragEnd={() => { if (dragBlockId && dragOverIdx !== null) moveBlock(dragBlockId, dragOverIdx); setDragBlockId(null); setDragOverIdx(null) }}
                          onClick={() => setEditingBlockId(block.id)}
                        >
                          {/* Block toolbar — visible on hover or when editing */}
                          <div className={`absolute -top-3 right-3 flex items-center gap-1 bg-surface border border-divider rounded-lg px-1.5 py-0.5 shadow-sm z-10 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            <span className="text-[0.55rem] text-t3 px-1 flex items-center gap-1">{blockTypeIcon(block.type, 10)} {block.type}</span>
                            <div className="w-px h-3 bg-divider" />
                            <button onClick={(e) => { e.stopPropagation(); setAiWritingText(block.content || block.title); setAiWritingOpen(true) }} className="p-1 rounded hover:bg-canvas text-t3 hover:text-tempo-500" title="AI Assist"><Sparkles size={11} /></button>
                            <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block) }} className="p-1 rounded hover:bg-canvas text-t3 hover:text-blue-500" title="Duplicate"><Copy size={11} /></button>
                            <button className="p-1 rounded hover:bg-canvas text-t3 cursor-grab active:cursor-grabbing" title="Drag to reorder"><GripVertical size={11} /></button>
                            <button onClick={(e) => { e.stopPropagation(); confirmDelete('block', block.id, block.title) }} className="p-1 rounded hover:bg-canvas text-t3 hover:text-red-500" title="Delete"><Trash2 size={11} /></button>
                          </div>

                          {/* Block content preview / editor */}
                          <div className="p-4">
                            {/* TEXT block */}
                            {block.type === 'text' && (
                              <div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input className="text-sm font-semibold text-t1 bg-transparent border-none outline-none w-full" value={block.title} onChange={(e) => updateCourseBlock(block.id, { title: e.target.value })} />
                                    <textarea className="text-xs text-t2 bg-canvas rounded-lg p-3 w-full min-h-[120px] border border-divider outline-none focus:border-tempo-400 resize-y font-mono" value={block.content || ''} onChange={(e) => updateCourseBlock(block.id, { content: e.target.value })} />
                                    <p className="text-[0.55rem] text-t3">Formatting: **bold**, • bullet, 1. numbered list</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm font-semibold text-t1 mb-1">{block.title}</p>
                                    <div className="text-xs text-t2 line-clamp-4 leading-relaxed">{renderMd(block.content || '')}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* HEADING block */}
                            {block.type === 'heading' && (
                              <div className="py-2">
                                {isEditing ? (
                                  <input className="text-lg font-bold text-t1 bg-transparent border-none outline-none w-full border-b-2 border-tempo-200 pb-2" value={block.content || block.title} onChange={(e) => updateCourseBlock(block.id, { content: e.target.value, title: e.target.value })} />
                                ) : (
                                  <h2 className="text-lg font-bold text-t1 border-b border-divider pb-2">{block.content || block.title}</h2>
                                )}
                              </div>
                            )}

                            {/* IMAGE block */}
                            {block.type === 'image' && (
                              <div>
                                {parsed.url ? (
                                  <div className="rounded-lg overflow-hidden">
                                    <img src={parsed.url} alt={parsed.alt || ''} className="w-full max-h-64 object-cover rounded-lg" />
                                    {parsed.caption && <p className="text-[0.65rem] text-t3 mt-2 text-center italic">{parsed.caption}</p>}
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-divider rounded-xl p-8 text-center">
                                    <Image size={32} className="mx-auto text-t3 mb-2" />
                                    <p className="text-xs text-t3 mb-3">Drop an image or enter URL</p>
                                    {isEditing && (
                                      <div className="space-y-2 max-w-sm mx-auto">
                                        <input className="text-xs bg-canvas rounded-lg px-3 py-2 w-full border border-divider outline-none focus:border-tempo-400" placeholder="Image URL (https://...)" onChange={(e) => {
                                          try { const p = JSON.parse(block.content || '{}'); p.url = e.target.value; updateCourseBlock(block.id, { content: JSON.stringify(p) }) } catch { updateCourseBlock(block.id, { content: JSON.stringify({ url: e.target.value, alt: '', caption: '' }) }) }
                                        }} />
                                        <input className="text-xs bg-canvas rounded-lg px-3 py-2 w-full border border-divider outline-none focus:border-tempo-400" placeholder="Alt text / caption" onChange={(e) => {
                                          try { const p = JSON.parse(block.content || '{}'); p.alt = e.target.value; p.caption = e.target.value; updateCourseBlock(block.id, { content: JSON.stringify(p) }) } catch {}
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* VIDEO block */}
                            {block.type === 'video' && (
                              <div>
                                {parsed.url ? (
                                  <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                                    <div className="text-center">
                                      <Play size={40} className="text-white/60 mx-auto" />
                                      <p className="text-xs text-white/40 mt-2">{parsed.url}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-divider rounded-xl p-8 text-center">
                                    <Video size={32} className="mx-auto text-t3 mb-2" />
                                    <p className="text-xs text-t3 mb-3">Add a video (YouTube, Vimeo, or direct URL)</p>
                                    {isEditing && (
                                      <input className="text-xs bg-canvas rounded-lg px-3 py-2 w-full max-w-sm mx-auto border border-divider outline-none focus:border-tempo-400" placeholder="Video URL" onChange={(e) => {
                                        updateCourseBlock(block.id, { content: JSON.stringify({ url: e.target.value, caption: '' }) })
                                      }} />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* CALLOUT block */}
                            {block.type === 'callout' && (() => {
                              const style = parsed.style || 'info'
                              const styles: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
                                info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: <AlertTriangle size={16} className="text-blue-400" />, label: 'Info' },
                                tip: { bg: 'bg-green-500/5', border: 'border-green-500/20', icon: <CheckCircle size={16} className="text-green-400" />, label: 'Tip' },
                                warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: <AlertTriangle size={16} className="text-amber-400" />, label: 'Warning' },
                                important: { bg: 'bg-red-500/5', border: 'border-red-500/20', icon: <Shield size={16} className="text-red-400" />, label: 'Important' },
                              }
                              const s = styles[style] || styles.info
                              return (
                                <div className={`${s.bg} border ${s.border} rounded-lg p-4 flex gap-3`}>
                                  <div className="shrink-0 mt-0.5">{s.icon}</div>
                                  <div className="flex-1">
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <div className="flex gap-2 mb-2">
                                          {Object.keys(styles).map(st => (
                                            <button key={st} onClick={(e) => { e.stopPropagation(); const p = { ...parsed, style: st }; updateCourseBlock(block.id, { content: JSON.stringify(p) }) }}
                                              className={`text-[0.6rem] px-2 py-0.5 rounded ${style === st ? 'bg-tempo-500 text-white' : 'bg-canvas text-t3'}`}>{st}</button>
                                          ))}
                                        </div>
                                        <textarea className="text-xs text-t1 bg-transparent w-full min-h-[60px] outline-none resize-y" value={parsed.text || ''} onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, text: e.target.value }) })} />
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-[0.6rem] font-semibold text-t3 uppercase mb-1">{s.label}</p>
                                        <div className="text-xs text-t1 leading-relaxed">{renderMd(parsed.text || 'Add callout text...')}</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}

                            {/* QUIZ block */}
                            {block.type === 'quiz' && (
                              <div className="bg-tempo-50/30 rounded-lg p-4 border border-tempo-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <HelpCircle size={16} className="text-tempo-500" />
                                  <span className="text-xs font-semibold text-tempo-600">Knowledge Check</span>
                                </div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input className="text-sm font-medium text-t1 bg-transparent w-full outline-none border-b border-tempo-200 pb-1" value={parsed.question || ''} placeholder="Enter your question..." onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, question: e.target.value }) })} />
                                    <div className="space-y-1.5 mt-2">
                                      {(parsed.options || ['', '', '', '']).map((opt: any, oi: number) => (
                                        <div key={oi} className="flex items-center gap-2">
                                          <button onClick={(e) => { e.stopPropagation(); updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, correct: oi }) }) }}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${parsed.correct === oi ? 'border-green-500 bg-green-500' : 'border-divider'}`}>
                                            {parsed.correct === oi && <CheckCircle size={10} className="text-white" />}
                                          </button>
                                          <input className="text-xs bg-canvas rounded px-2 py-1.5 flex-1 border border-divider outline-none focus:border-tempo-400" value={optText(opt)} placeholder={`Option ${oi + 1}`} onChange={(e) => {
                                            const opts = [...(parsed.options || ['', '', '', ''])]; opts[oi] = e.target.value
                                            updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, options: opts }) })
                                          }} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm font-medium text-t1 mb-2">{parsed.question || 'Question...'}</p>
                                    <div className="space-y-1">
                                      {(parsed.options || []).map((opt: any, oi: number) => (
                                        <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg ${parsed.correct === oi ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-canvas text-t2'}`}>
                                          {String.fromCharCode(65 + oi)}. {optText(opt)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* DIVIDER block */}
                            {block.type === 'divider' && (
                              <div className="py-4">
                                <hr className="border-divider" />
                              </div>
                            )}

                            {/* ACCORDION block */}
                            {block.type === 'accordion' && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-t1 mb-2">{block.title}</p>
                                {(parsed.sections || []).map((sec: any, si: number) => (
                                  <div key={si} className="border border-divider rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between p-3 bg-canvas cursor-pointer">
                                      {isEditing ? (
                                        <input className="text-xs font-medium text-t1 bg-transparent outline-none flex-1" value={sec.heading} onChange={(e) => {
                                          const secs = [...(parsed.sections || [])]; secs[si] = { ...secs[si], heading: e.target.value }
                                          updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, sections: secs }) })
                                        }} />
                                      ) : (
                                        <p className="text-xs font-medium text-t1">{sec.heading}</p>
                                      )}
                                      <ChevronDown size={14} className="text-t3" />
                                    </div>
                                    <div className="p-3 border-t border-divider">
                                      {isEditing ? (
                                        <textarea className="text-xs text-t2 bg-transparent w-full min-h-[40px] outline-none resize-y" value={sec.body} onChange={(e) => {
                                          const secs = [...(parsed.sections || [])]; secs[si] = { ...secs[si], body: e.target.value }
                                          updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, sections: secs }) })
                                        }} />
                                      ) : (
                                        <p className="text-xs text-t2">{sec.body}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {isEditing && (
                                  <button onClick={(e) => { e.stopPropagation(); const secs = [...(parsed.sections || []), { heading: 'New Section', body: 'Content...' }]; updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, sections: secs }) }) }}
                                    className="text-[0.65rem] text-tempo-500 hover:text-tempo-600 flex items-center gap-1"><Plus size={12} /> Add section</button>
                                )}
                              </div>
                            )}

                            {/* COLUMNS block */}
                            {block.type === 'columns' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-canvas rounded-lg border border-divider">
                                  {isEditing ? (
                                    <textarea className="text-xs text-t2 bg-transparent w-full min-h-[80px] outline-none resize-y" value={parsed.left || ''} onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, left: e.target.value }) })} placeholder="Left column..." />
                                  ) : (
                                    <div className="text-xs text-t2 leading-relaxed">{renderMd(parsed.left || 'Left column')}</div>
                                  )}
                                </div>
                                <div className="p-3 bg-canvas rounded-lg border border-divider">
                                  {isEditing ? (
                                    <textarea className="text-xs text-t2 bg-transparent w-full min-h-[80px] outline-none resize-y" value={parsed.right || ''} onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, right: e.target.value }) })} placeholder="Right column..." />
                                  ) : (
                                    <div className="text-xs text-t2 leading-relaxed">{renderMd(parsed.right || 'Right column')}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* CODE block */}
                            {block.type === 'code' && (
                              <div className="bg-[#1e1e1e] rounded-lg overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d]">
                                  {isEditing ? (
                                    <input className="text-[0.6rem] text-gray-400 bg-transparent outline-none" value={parsed.language || 'javascript'} onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, language: e.target.value }) })} />
                                  ) : (
                                    <span className="text-[0.6rem] text-gray-400">{parsed.language || 'javascript'}</span>
                                  )}
                                  <button className="text-[0.6rem] text-gray-400 hover:text-white"><Copy size={10} /> Copy</button>
                                </div>
                                {isEditing ? (
                                  <textarea className="text-xs text-green-400 font-mono bg-transparent w-full p-3 min-h-[100px] outline-none resize-y" value={parsed.code || ''} onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, code: e.target.value }) })} />
                                ) : (
                                  <pre className="text-xs text-green-400 font-mono p-3 overflow-x-auto"><code>{parsed.code || '// code here'}</code></pre>
                                )}
                              </div>
                            )}

                            {/* DOWNLOAD block */}
                            {block.type === 'download' && (
                              <div className="flex items-center gap-3 p-3 bg-canvas rounded-lg border border-divider">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Download size={18} className="text-blue-400" /></div>
                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="space-y-1">
                                      <input className="text-xs font-medium text-t1 bg-transparent outline-none w-full" value={parsed.filename || ''} placeholder="File name" onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, filename: e.target.value }), title: e.target.value })} />
                                      <input className="text-[0.65rem] text-t3 bg-transparent outline-none w-full" value={parsed.description || ''} placeholder="Description" onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, description: e.target.value }) })} />
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-xs font-medium text-t1">{parsed.filename || 'resource.pdf'}</p>
                                      <p className="text-[0.6rem] text-t3">{parsed.description || 'Download this resource'}</p>
                                    </>
                                  )}
                                </div>
                                <Button size="sm" variant="outline"><Download size={12} /> Download</Button>
                              </div>
                            )}

                            {/* EMBED block */}
                            {block.type === 'embed' && (
                              <div>
                                {parsed.url ? (
                                  <div className="rounded-lg overflow-hidden border border-divider" style={{ height: parsed.height || 400 }}>
                                    <div className="w-full h-full bg-canvas flex items-center justify-center">
                                      <div className="text-center">
                                        <Globe size={24} className="mx-auto text-t3 mb-2" />
                                        <p className="text-xs text-t3">{parsed.url}</p>
                                        <p className="text-[0.55rem] text-t3 mt-1">Embedded content</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-divider rounded-xl p-8 text-center">
                                    <Globe size={32} className="mx-auto text-t3 mb-2" />
                                    <p className="text-xs text-t3">Embed external content</p>
                                    {isEditing && (
                                      <input className="text-xs bg-canvas rounded-lg px-3 py-2 w-full max-w-sm mx-auto mt-3 border border-divider outline-none focus:border-tempo-400" placeholder="URL to embed" onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ url: e.target.value, height: 400 }) })} />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* BUTTON block */}
                            {block.type === 'button' && (
                              <div className="text-center py-4">
                                {isEditing ? (
                                  <div className="space-y-2 max-w-xs mx-auto">
                                    <input className="text-xs bg-canvas rounded-lg px-3 py-2 w-full border border-divider outline-none" value={parsed.label || ''} placeholder="Button text" onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, label: e.target.value }), title: e.target.value })} />
                                    <input className="text-xs bg-canvas rounded-lg px-3 py-2 w-full border border-divider outline-none" value={parsed.url || ''} placeholder="Button URL" onChange={(e) => updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, url: e.target.value }) })} />
                                  </div>
                                ) : (
                                  <button className="px-6 py-2.5 rounded-lg bg-tempo-500 text-white text-sm font-medium hover:bg-tempo-600 transition-colors">
                                    {parsed.label || 'Click Here'}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* INTERACTIVE block */}
                            {block.type === 'interactive' && (
                              <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-lg p-4 border border-purple-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <ListChecks size={16} className="text-purple-400" />
                                  <span className="text-xs font-semibold text-purple-600">Interactive Activity</span>
                                </div>
                                {isEditing ? (
                                  <textarea className="text-xs text-t2 bg-canvas rounded-lg p-3 w-full min-h-[80px] border border-divider outline-none resize-y" value={block.content || ''} onChange={(e) => updateCourseBlock(block.id, { content: e.target.value })} />
                                ) : (
                                  <p className="text-xs text-t2">{block.title}</p>
                                )}
                              </div>
                            )}

                            {/* INFOGRAPHIC block */}
                            {block.type === 'infographic' && (
                              <div className="bg-gradient-to-br from-tempo-500/5 to-orange-500/5 rounded-lg p-4 border border-tempo-500/10">
                                <div className="flex items-center gap-2 mb-3">
                                  <BarChart3 size={16} className="text-tempo-500" />
                                  <span className="text-xs font-semibold text-tempo-600">Infographic</span>
                                </div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    {(parsed.items || []).map((item: any, ii: number) => (
                                      <div key={ii} className="flex gap-2">
                                        <input className="text-xs bg-canvas rounded px-2 py-1 flex-1 border border-divider outline-none" value={item.label} placeholder="Label" onChange={(e) => {
                                          const items = [...(parsed.items || [])]; items[ii] = { ...items[ii], label: e.target.value }
                                          updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, items }) })
                                        }} />
                                        <input className="text-xs bg-canvas rounded px-2 py-1 w-20 border border-divider outline-none" value={item.value} placeholder="Value" onChange={(e) => {
                                          const items = [...(parsed.items || [])]; items[ii] = { ...items[ii], value: e.target.value }
                                          updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, items }) })
                                        }} />
                                      </div>
                                    ))}
                                    <button onClick={(e) => { e.stopPropagation(); const items = [...(parsed.items || []), { label: 'New', value: '0' }]; updateCourseBlock(block.id, { content: JSON.stringify({ ...parsed, items }) }) }}
                                      className="text-[0.65rem] text-tempo-500 flex items-center gap-1"><Plus size={12} /> Add item</button>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-3">
                                    {(parsed.items || []).map((item: any, ii: number) => (
                                      <div key={ii} className="text-center p-3 bg-surface rounded-lg">
                                        <p className="text-lg font-bold text-tempo-500">{item.value}</p>
                                        <p className="text-[0.6rem] text-t3">{item.label}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Status & duration row */}
                            {isEditing && (
                              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-divider">
                                <div className="flex items-center gap-2">
                                  <Clock size={11} className="text-t3" />
                                  <input type="number" className="text-[0.65rem] bg-canvas rounded px-2 py-1 w-14 border border-divider outline-none" value={block.duration_minutes} onChange={(e) => updateCourseBlock(block.id, { duration_minutes: Number(e.target.value) })} />
                                  <span className="text-[0.6rem] text-t3">min</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); updateCourseBlock(block.id, { status: block.status === 'published' ? 'draft' : 'published' }) }}
                                  className={`text-[0.65rem] px-2 py-0.5 rounded ${block.status === 'published' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                  {block.status === 'published' ? 'Published' : 'Draft'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Insert block between */}
                        <div className="flex justify-center py-1.5">
                          <button onClick={() => setShowBlockPicker(showBlockPicker === idx + 1 ? null : idx + 1)}
                            className="group flex items-center gap-1 text-t3 hover:text-tempo-500 transition-colors">
                            <div className="w-5 h-5 rounded-full border-2 border-dashed border-current flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus size={10} />
                            </div>
                          </button>
                        </div>

                        {/* Block picker dropdown */}
                        {showBlockPicker === idx + 1 && (
                          <div className="mb-2">
                            <Card className="border-tempo-200">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {BLOCK_CATEGORIES.map(cat => (
                                  <div key={cat.label}>
                                    <p className="text-[0.6rem] font-semibold text-t3 uppercase tracking-wider mb-2">{cat.label}</p>
                                    <div className="space-y-1">
                                      {cat.types.map(bt => (
                                        <button key={bt.type} onClick={() => insertBlockAt(bt.type, idx + 1)}
                                          className="w-full text-left p-2 rounded-lg hover:bg-tempo-50 transition-colors group/bt flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-lg bg-canvas flex items-center justify-center text-t3 group-hover/bt:text-tempo-500 group-hover/bt:bg-tempo-100 transition-colors">
                                            {blockTypeIcon(bt.type, 14)}
                                          </div>
                                          <div>
                                            <p className="text-xs font-medium text-t1">{bt.label}</p>
                                            <p className="text-[0.55rem] text-t3">{bt.desc}</p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Empty state for course with no blocks */}
                  {filteredBlocks.length === 0 && (
                    <Card>
                      <div className="text-center py-12">
                        <div className="w-14 h-14 rounded-xl bg-tempo-500/10 flex items-center justify-center mx-auto mb-3">
                          <Plus size={24} className="text-tempo-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-t1 mb-1">Start building your course</h4>
                        <p className="text-xs text-t3 mb-4">Add blocks to build your lesson — text, images, quizzes, and more</p>
                        <div className="flex justify-center gap-2 flex-wrap">
                          {[{ type: 'text', label: 'Text' }, { type: 'heading', label: 'Heading' }, { type: 'image', label: 'Image' }, { type: 'video', label: 'Video' }, { type: 'callout', label: 'Callout' }, { type: 'quiz', label: 'Quiz' }, { type: 'accordion', label: 'Accordion' }, { type: 'columns', label: 'Columns' }].map(bt => (
                            <Button key={bt.type} size="sm" variant="outline" onClick={() => insertBlockAt(bt.type, 0)}>
                              {blockTypeIcon(bt.type, 12)} {bt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Quick-add toolbar (visible when blocks exist) */}
                  {filteredBlocks.length > 0 && (
                    <div className="sticky bottom-4 z-20 flex justify-center">
                      <div className="bg-surface/95 backdrop-blur-sm border border-divider rounded-2xl shadow-lg px-3 py-2 flex items-center gap-1.5">
                        <span className="text-[0.55rem] text-t3 px-1">Quick add:</span>
                        {[{ type: 'text', label: 'Text' }, { type: 'image', label: 'Image' }, { type: 'callout', label: 'Callout' }, { type: 'quiz', label: 'Quiz' }, { type: 'divider', label: 'Divider' }].map(bt => (
                          <button key={bt.type} onClick={() => insertBlockAt(bt.type, filteredBlocks.length)}
                            className="flex items-center gap-1 text-[0.6rem] text-t2 hover:text-tempo-500 px-2 py-1.5 rounded-lg hover:bg-tempo-50 transition-colors" title={`Add ${bt.label}`}>
                            {blockTypeIcon(bt.type, 11)} {bt.label}
                          </button>
                        ))}
                        <div className="w-px h-4 bg-divider mx-0.5" />
                        <button onClick={() => setShowBlockPicker(filteredBlocks.length)}
                          className="flex items-center gap-1 text-[0.6rem] text-tempo-500 font-medium px-2 py-1.5 rounded-lg hover:bg-tempo-50 transition-colors">
                          <Plus size={11} /> All blocks
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SCORM & Prerequisites (collapsed) */}
                  {selectedBuilderCourse && (
                    <div className="mt-6 space-y-3">
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-t3 hover:text-t1 transition-colors">
                          <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                          <Layers size={14} className="text-tempo-400" /> SCORM Packages
                        </summary>
                        <div className="mt-2 pl-6">
                          <Card>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-t3">{scormPackages.filter(p => p.course_id === selectedBuilderCourse).length} packages</span>
                              <Button size="sm" variant="outline" onClick={() => exportScormPackage()}><Download size={12} /> Export SCORM</Button>
                              <Button size="sm" variant="outline" onClick={() => { setScormUploadCourse(selectedBuilderCourse); setShowScormUploadModal(true) }}><Upload size={12} /> Upload SCORM</Button>
                            </div>
                            {scormPackages.filter(p => p.course_id === selectedBuilderCourse).map(pkg => (
                              <div key={pkg.id} className="flex items-center gap-3 p-2 rounded-lg bg-canvas mb-1">
                                <Layers size={14} className="text-tempo-400" />
                                <span className="text-xs text-t1 flex-1">{(pkg.metadata as any)?.title || 'SCORM Package'}</span>
                                <Badge variant={pkg.status === 'ready' ? 'success' : 'default'} className="text-[0.5rem]">{pkg.status}</Badge>
                              </div>
                            ))}
                          </Card>
                        </div>
                      </details>
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-t3 hover:text-t1 transition-colors">
                          <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                          <Lock size={14} className="text-amber-400" /> Prerequisites
                        </summary>
                        <div className="mt-2 pl-6">
                          <Card>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-t3">{getPrerequisitesForCourse(selectedBuilderCourse).length} prerequisites</span>
                              <Button size="sm" variant="outline" onClick={() => { setPrereqForm({ ...prereqForm, course_id: selectedBuilderCourse }); setShowPrereqModal(true) }}><Plus size={12} /> Add</Button>
                            </div>
                            {getPrerequisitesForCourse(selectedBuilderCourse).map(p => (
                              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-canvas mb-1">
                                {p.isCompleted ? <CheckCircle size={12} className="text-green-400" /> : <Lock size={12} className="text-amber-400" />}
                                <span className="text-xs text-t1 flex-1">{p.prerequisiteCourse?.title || 'Unknown'}</span>
                                <Badge variant={p.type === 'required' ? 'error' : 'info'} className="text-[0.5rem]">{p.type}</Badge>
                              </div>
                            ))}
                          </Card>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Course Modal */}
      <Modal open={showNewCourseFlow} onClose={() => setShowNewCourseFlow(false)} title="Create New Course" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3 mb-4">
            {[
              { id: 'tempo', from: 'from-tempo-600', to: 'to-orange-500' },
              { id: 'blue', from: 'from-blue-600', to: 'to-cyan-500' },
              { id: 'green', from: 'from-green-600', to: 'to-emerald-500' },
              { id: 'purple', from: 'from-purple-600', to: 'to-pink-500' },
              { id: 'red', from: 'from-red-600', to: 'to-rose-500' },
            ].map(c => (
              <button key={c.id} onClick={() => setNewCourseForm({ ...newCourseForm, cover_color: c.id })}
                className={`h-12 rounded-lg bg-gradient-to-r ${c.from} ${c.to} transition-all ${newCourseForm.cover_color === c.id ? 'ring-2 ring-tempo-400 ring-offset-2 ring-offset-surface scale-105' : 'opacity-60 hover:opacity-100'}`} />
            ))}
          </div>
          <Input label="Course Title" value={newCourseForm.title} onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })} placeholder="e.g. Introduction to Project Management" />
          <Textarea label="Description" value={newCourseForm.description} onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })} rows={2} placeholder="What will learners gain from this course?" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={newCourseForm.category} onChange={(e) => setNewCourseForm({ ...newCourseForm, category: e.target.value })} options={[
              { value: 'General', label: 'General' },
              { value: 'Leadership', label: 'Leadership' },
              { value: 'Technical', label: 'Technical' },
              { value: 'Compliance', label: 'Compliance' },
              { value: 'Onboarding', label: 'Onboarding' },
              { value: 'Sales', label: 'Sales' },
              { value: 'HR', label: 'HR' },
              { value: 'Product', label: 'Product' },
            ]} />
            <Select label="Level" value={newCourseForm.level} onChange={(e) => setNewCourseForm({ ...newCourseForm, level: e.target.value })} options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewCourseFlow(false)}>Cancel</Button>
            <Button onClick={handleCreateNewCourse} disabled={!newCourseForm.title.trim()}>
              <Plus size={14} /> Create &amp; Start Building
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quiz Builder Tab */}
      {activeTab === 'quiz-builder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('quizBuilder')}</h3>
              <p className="text-xs text-t3">{t('quizBuilderDesc')}</p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedQuizCourse} onChange={(e) => setSelectedQuizCourse(e.target.value)} options={[
                { value: '', label: t('filterByCourse') },
                ...courses.map(c => ({ value: c.id, label: c.title })),
              ]} />
              <Button size="sm" variant="outline" onClick={() => setShowAIQuizModal(true)}><Sparkles size={14} /> {t('aiGenerateQuiz')}</Button>
              <Button size="sm" onClick={() => setShowQuestionModal(true)}><Plus size={14} /> {t('addQuestion')}</Button>
            </div>
          </div>

          {/* Quiz Settings Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs font-medium text-t1 mb-1">{t('questionBank')}</p>
              <p className="text-2xl font-bold text-tempo-600">{filteredQuestions.length}</p>
              <p className="text-[0.6rem] text-t3">{t('questionsInBank', { count: quizQuestions.length })}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-t1 mb-1">{t('passingScore')}</p>
              <p className="text-2xl font-bold text-t1">70%</p>
              <p className="text-[0.6rem] text-t3">{t('quizSettings')}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-t1 mb-1">{t('timeLimit')}</p>
              <p className="text-2xl font-bold text-t1">30</p>
              <p className="text-[0.6rem] text-t3">{t('timeLimitMinutes', { minutes: 30 })}</p>
            </Card>
            <Card>
              <p className="text-xs font-medium text-t1 mb-1">{t('attemptsAllowed')}</p>
              <p className="text-2xl font-bold text-t1">3</p>
              <p className="text-[0.6rem] text-t3">{t('randomizeQuestions')}</p>
            </Card>
          </div>

          {/* Questions List */}
          <Card padding="none">
            <CardHeader><CardTitle>{t('questionBank')}</CardTitle></CardHeader>
            <div className="divide-y divide-divider">
              {filteredQuestions.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-t3">{t('noDiscussions')}</div>
              ) : filteredQuestions.map(q => {
                const course = courses.find(c => c.id === q.course_id)
                return (
                  <div key={q.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 mt-0.5">
                      {q.type === 'multiple_choice' ? <ListChecks size={14} /> : q.type === 'true_false' ? <CheckCircle size={14} /> : q.type === 'essay' ? <PenTool size={14} /> : <HelpCircle size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-t1">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{q.type === 'multiple_choice' ? t('typeMultipleChoice') : q.type === 'true_false' ? t('typeTrueFalse') : q.type === 'fill_blank' ? t('typeFillBlank') : q.type === 'matching' ? t('typeMatching') : t('typeEssay')}</Badge>
                        {course && <span className="text-[0.6rem] text-t3">{course.title}</span>}
                      </div>
                      {q.options.length > 0 && q.type !== 'essay' && (
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          {q.options.map((opt, i) => (
                            <span key={i} className={`text-[0.6rem] px-2 py-0.5 rounded ${optText(opt) === q.correct_answer ? 'bg-green-50 text-green-700 font-medium' : 'text-t3'}`}>
                              {optText(opt)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-tempo-600">{q.points} {t('points')}</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => confirmDelete('question', q.id, q.question)}>×</Button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Social Learning Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-t1">{t('socialLearning')}</h3>
              <p className="text-xs text-t3">{t('socialLearningDesc')}</p>
            </div>
            <div className="flex gap-2">
              {socialSubTab === 'discussions' && <Button size="sm" onClick={() => setShowDiscussionModal(true)}><Plus size={14} /> {t('newDiscussion')}</Button>}
              {socialSubTab === 'groups' && <Button size="sm" onClick={() => setShowGroupModal(true)}><Plus size={14} /> {t('createStudyGroup')}</Button>}
            </div>
          </div>

          {/* Social Sub-tabs */}
          <div className="flex gap-2 mb-4">
            {(['discussions', 'groups', 'leaderboard'] as const).map(tab => (
              <button key={tab} onClick={() => setSocialSubTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${socialSubTab === tab ? 'bg-tempo-600 text-white' : 'bg-canvas text-t2 hover:bg-surface'}`}>
                {tab === 'discussions' ? t('discussions') : tab === 'groups' ? t('studyGroups') : t('leaderboard')}
              </button>
            ))}
          </div>

          {/* Discussions */}
          {socialSubTab === 'discussions' && (
            <div className="space-y-3">
              {discussions.length === 0 ? (
                <Card><div className="text-center py-8 text-sm text-t3">{t('noDiscussions')}</div></Card>
              ) : discussions.map(disc => {
                const author = employees.find(e => e.id === disc.author_id)
                const course = disc.course_id ? courses.find(c => c.id === disc.course_id) : null
                return (
                  <Card key={disc.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-tempo-100 flex items-center justify-center text-tempo-600 text-xs font-medium">
                        {(author?.profile.full_name || '?').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-t1">{author?.profile.full_name || 'Unknown'}</span>
                          <span className="text-[0.6rem] text-t3">{new Date(disc.created_at).toLocaleDateString()}</span>
                          {course && <Badge variant="default">{course.title}</Badge>}
                        </div>
                        <h4 className="text-sm font-semibold text-t1 mb-1">{disc.title}</h4>
                        <p className="text-xs text-t3 line-clamp-2 mb-2">{disc.content}</p>
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleLikeDiscussion(disc.id)} className="flex items-center gap-1 text-xs text-t3 hover:text-tempo-600">
                            <Heart size={12} /> {t('likesCount', { count: disc.likes })}
                          </button>
                          <span className="flex items-center gap-1 text-xs text-t3">
                            <MessageSquare size={12} /> {t('repliesCount', { count: disc.replies })}
                          </span>
                          {disc.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 text-[0.6rem] text-tempo-600">
                              <Hash size={10} />{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Study Groups */}
          {socialSubTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups.map(group => {
                const course = courses.find(c => c.id === group.course_id)
                const isMember = group.member_ids.includes(currentEmployeeId)
                return (
                  <Card key={group.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={isMember ? 'success' : 'default'}>{isMember ? 'Member' : 'Open'}</Badge>
                      <UsersIcon size={14} className="text-tempo-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-t1 mb-1">{group.name}</h3>
                    <p className="text-xs text-t3 mb-3 line-clamp-2">{group.description}</p>
                    {course && <p className="text-[0.6rem] text-t3 mb-2">{course.title}</p>}
                    <div className="space-y-1 text-xs text-t3 mb-3">
                      <div className="flex items-center gap-2">
                        <UsersIcon size={12} /> {t('membersCount', { count: group.member_ids.length, max: group.max_members })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} /> {t('nextMeeting')}: {new Date(group.next_meeting).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio size={12} /> {group.meeting_frequency === 'weekly' ? t('frequencyWeekly') : group.meeting_frequency === 'biweekly' ? t('frequencyBiweekly') : t('frequencyMonthly')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {group.member_ids.slice(0, 4).map(mid => {
                          const member = employees.find(e => e.id === mid)
                          return (
                            <div key={mid} className="w-6 h-6 rounded-full bg-tempo-100 border-2 border-surface flex items-center justify-center text-[0.5rem] text-tempo-600 font-medium">
                              {(member?.profile.full_name || '?').charAt(0)}
                            </div>
                          )
                        })}
                        {group.member_ids.length > 4 && <span className="text-[0.6rem] text-t3 ml-1">+{group.member_ids.length - 4}</span>}
                      </div>
                      <div className="ml-auto">
                        {!isMember && group.member_ids.length < group.max_members && (
                          <Button size="sm" variant="primary" onClick={() => handleJoinGroup(group.id)}>{t('joinGroup')}</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Leaderboard */}
          {socialSubTab === 'leaderboard' && (
            <Card padding="none">
              <CardHeader><CardTitle><Trophy size={16} className="inline mr-2 text-gray-400" />{t('leaderboard')}</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {leaderboardData.map((learner, i) => (
                  <div key={learner.id} className="px-6 py-3 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gray-200 text-gray-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-gray-100 text-gray-500' : 'bg-canvas text-t3'}`}>
                      {i + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-tempo-100 flex items-center justify-center text-xs font-medium text-tempo-600">
                      {learner.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-t1">{learner.name}</p>
                      <p className="text-[0.6rem] text-t3">{learner.coursesCompleted} {t('coursesCompleted')} - {learner.streak} day {t('streak')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-tempo-600">{learner.points}</p>
                      <p className="text-[0.6rem] text-t3">{t('points')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Content Library Tab */}
      {activeTab === 'content-library' && (
        <div className="space-y-6">
          {/* Content Provider Integrations */}
          <ContentProviders
            connectedProviders={connectedProviders}
            onConnect={handleProviderConnect}
            onSync={handleProviderSync}
            onDisconnect={handleProviderDisconnect}
            itemCounts={providerItemCounts}
          />

          {/* Featured Section */}
          {featuredContent.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><Star size={16} className="text-yellow-500" /> Featured Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {featuredContent.map(item => (
                  <Card key={item.id} className="cursor-pointer hover:border-tempo-500/30 transition-colors" onClick={() => { setSelectedContentItem(item); setShowContentDetailModal(true) }}>
                    <div className="aspect-video bg-gradient-to-br from-tempo-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center">
                      <Globe size={32} className="text-tempo-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-t1 line-clamp-2">{item.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[0.6rem] px-1.5 py-0.5 rounded border', providerColor(item.provider))}>{providerLabel(item.provider)}</span>
                        <Badge variant="info" className="text-[0.6rem]">{item.level}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[0.6rem] text-t3">
                        <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500 fill-yellow-500" /> {item.rating}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {Math.round((item.duration_minutes || 0) / 60)}h</span>
                        <span className="flex items-center gap-1"><UsersIcon size={10} /> {(item.enrollment_count || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search content library..." value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} />
            </div>
            <Select value={libraryProvider} onChange={e => setLibraryProvider(e.target.value)} options={[{ value: 'all', label: 'All Providers' }, ...libraryProviders.map(p => ({ value: p, label: providerLabel(p) }))]} />
            <Select value={libraryCategory} onChange={e => setLibraryCategory(e.target.value)} options={[{ value: 'all', label: 'All Categories' }, ...libraryCategories.map(c => ({ value: c!, label: c! }))]} />
            <Select value={libraryLevel} onChange={e => setLibraryLevel(e.target.value)} options={[{ value: 'all', label: 'All Levels' }, { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
            <Select value={libraryLanguage} onChange={e => setLibraryLanguage(e.target.value)} options={[{ value: 'all', label: 'All Languages' }, ...libraryLanguages.map(l => ({ value: l!, label: l! }))]} />
          </div>

          {/* Results */}
          <div className="text-xs text-t3 mb-2">{filteredContentLibrary.length} items found</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredContentLibrary.map(item => (
              <Card key={item.id} className="hover:border-white/20 transition-colors">
                <div className="flex gap-3">
                  <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-tempo-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-tempo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-t1 line-clamp-2 mb-1">{item.title}</h4>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('text-[0.55rem] px-1 py-0.5 rounded border', providerColor(item.provider))}>{providerLabel(item.provider)}</span>
                      {item.category && <span className="text-[0.55rem] text-t3">{item.category}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[0.6rem] text-t3">
                      {item.rating && <span className="flex items-center gap-0.5"><Star size={9} className="text-yellow-500 fill-yellow-500" /> {item.rating}</span>}
                      <span className="flex items-center gap-0.5"><Clock size={9} /> {Math.round((item.duration_minutes || 0) / 60)}h</span>
                      <Badge variant="info" className="text-[0.5rem] py-0">{item.level}</Badge>
                      {item.language !== 'English' && <Badge variant="info" className="text-[0.5rem] py-0">{item.language}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                  <Button size="sm" variant="outline" className="flex-1 text-[0.6rem]" onClick={() => { setSelectedContentItem(item); setShowContentDetailModal(true) }}><Eye size={12} /> Preview</Button>
                  <Button size="sm" className="flex-1 text-[0.6rem]" onClick={() => handleAddToOrgCatalog(item)}><Plus size={12} /> Add to Catalog</Button>
                </div>
              </Card>
            ))}
          </div>
          {filteredContentLibrary.length === 0 && (
            <Card><div className="text-center py-8"><Globe size={32} className="mx-auto text-t3 mb-2" /><p className="text-sm text-t3">No content found matching your filters</p></div></Card>
          )}
        </div>
      )}

      {/* Gamification Tab */}
      {activeTab === 'gamification' && (
        <div className="space-y-6">
          {/* My Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Trophy size={18} className="text-yellow-500" /></div>
                <div><p className="text-2xl font-bold text-t1">{myPoints}</p><p className="text-[0.6rem] text-t3">My Points</p></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Medal size={18} className="text-purple-500" /></div>
                <div><p className="text-2xl font-bold text-t1">{myBadges.length}</p><p className="text-[0.6rem] text-t3">My Badges</p></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tempo-500/10 flex items-center justify-center"><TrendingUp size={18} className="text-tempo-500" /></div>
                <div><p className="text-2xl font-bold text-t1">#{gamificationLeaderboard.findIndex(l => l.id === currentEmployeeId) + 1 || '-'}</p><p className="text-[0.6rem] text-t3">My Rank</p></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Zap size={18} className="text-green-500" /></div>
                <div><p className="text-2xl font-bold text-t1">{myCompleted.length}</p><p className="text-[0.6rem] text-t3">Courses Done</p></div>
              </div>
            </Card>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            {(['leaderboard', 'badges', 'points', 'challenges'] as const).map(tab => (
              <button key={tab} onClick={() => setGamificationSubTab(tab)} className={cn('px-3 py-1.5 text-xs rounded-lg transition-colors', gamificationSubTab === tab ? 'bg-tempo-500/20 text-tempo-400' : 'text-t3 hover:text-t1')}>
                {tab === 'leaderboard' ? 'Leaderboard' : tab === 'badges' ? 'Badge Showcase' : tab === 'points' ? 'Points' : 'Challenges'}
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          {gamificationSubTab === 'leaderboard' && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy size={16} className="text-yellow-500" /> Top Learners Leaderboard</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/10"><th className="text-left py-2 px-3 text-t3 font-medium">Rank</th><th className="text-left py-2 px-3 text-t3 font-medium">Learner</th><th className="text-right py-2 px-3 text-t3 font-medium">Points</th><th className="text-right py-2 px-3 text-t3 font-medium">Badges</th><th className="text-right py-2 px-3 text-t3 font-medium">Courses</th></tr></thead>
                  <tbody>
                    {gamificationLeaderboard.map((entry, i) => (
                      <tr key={entry.id} className={cn('border-b border-white/5', entry.id === currentEmployeeId && 'bg-tempo-500/5')}>
                        <td className="py-2.5 px-3">
                          {i === 0 ? <span className="text-yellow-500 font-bold text-sm">1</span> : i === 1 ? <span className="text-gray-400 font-bold text-sm">2</span> : i === 2 ? <span className="text-orange-600 font-bold text-sm">3</span> : <span className="text-t3">{i + 1}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={entry.name} size="sm" />
                            <span className="font-medium text-t1">{entry.name}</span>
                            {entry.id === currentEmployeeId && <Badge variant="ai" className="text-[0.5rem]">You</Badge>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-tempo-400">{entry.points.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">{entry.badges}</td>
                        <td className="py-2.5 px-3 text-right">{entry.coursesCompleted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Badge Showcase */}
          {gamificationSubTab === 'badges' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-t1">All Available Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {allBadgeTypes.map(badge => {
                  const earned = myBadges.find(b => b.badge_type === badge.type)
                  return (
                    <Card key={badge.type} className={cn('text-center transition-all', earned ? 'border-tempo-500/30' : 'opacity-50')}>
                      <div className={cn('w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center', earned ? 'bg-tempo-500/20' : 'bg-white/5')}>
                        {badge.icon === 'award' ? <Award size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'trophy' ? <Trophy size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'zap' ? <Zap size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'star' ? <Star size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'shield' ? <Shield size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'flame' ? <Activity size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'crown' ? <Trophy size={24} className={earned ? badge.color : 'text-t3'} /> :
                         badge.icon === 'map' ? <Route size={24} className={earned ? badge.color : 'text-t3'} /> :
                         <UsersIcon size={24} className={earned ? badge.color : 'text-t3'} />}
                      </div>
                      <h4 className="text-xs font-semibold text-t1 mb-1">{badge.name}</h4>
                      <p className="text-[0.6rem] text-t3 mb-2">{badge.description}</p>
                      {earned ? (
                        <Badge variant="success" className="text-[0.55rem]">Earned {new Date(earned.earned_at).toLocaleDateString()}</Badge>
                      ) : (
                        <Badge variant="info" className="text-[0.55rem]">Not Earned</Badge>
                      )}
                    </Card>
                  )
                })}
              </div>

              {myBadges.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-t1 mt-6 mb-3">My Earned Badges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {myBadges.map(badge => (
                      <Card key={badge.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tempo-500/20 flex items-center justify-center shrink-0">
                          <Award size={18} className="text-tempo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-t1">{badge.badge_name}</h4>
                          <p className="text-[0.55rem] text-t3">{badge.description}</p>
                          <p className="text-[0.5rem] text-t3 mt-0.5">{new Date(badge.earned_at).toLocaleDateString()}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Points Breakdown */}
          {gamificationSubTab === 'points' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Points Breakdown</CardTitle></CardHeader>
                <div className="space-y-3">
                  {pointBreakdown.length > 0 ? pointBreakdown.map(({ source, points }) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-tempo-500/10 flex items-center justify-center">
                          {source === 'course_complete' ? <CheckCircle size={14} className="text-green-400" /> :
                           source === 'quiz_score' ? <Brain size={14} className="text-purple-400" /> :
                           source === 'streak_bonus' ? <Activity size={14} className="text-orange-400" /> :
                           source === 'discussion_post' ? <MessageSquare size={14} className="text-blue-400" /> :
                           <Heart size={14} className="text-pink-400" />}
                        </div>
                        <span className="text-xs text-t1">{sourceLabel(source)}</span>
                      </div>
                      <span className="text-sm font-semibold text-tempo-400">{points} pts</span>
                    </div>
                  )) : (
                    <p className="text-xs text-t3 text-center py-4">No points earned yet. Complete courses to earn points!</p>
                  )}
                </div>
              </Card>

              {/* Recent Points Activity */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
                <div className="space-y-2">
                  {learnerPoints.filter(p => p.employee_id === currentEmployeeId).sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()).slice(0, 10).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-xs text-t1">{p.description}</p>
                        <p className="text-[0.55rem] text-t3">{new Date(p.earned_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-semibold text-green-400">+{p.points}</span>
                    </div>
                  ))}
                  {learnerPoints.filter(p => p.employee_id === currentEmployeeId).length === 0 && (
                    <p className="text-xs text-t3 text-center py-4">No activity yet</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Challenges */}
          {gamificationSubTab === 'challenges' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target size={16} className="text-tempo-400" /> Monthly Challenges</CardTitle></CardHeader>
                <div className="space-y-4">
                  {[
                    { title: 'Course Completer', description: 'Complete 3 courses this month', target: 3, current: myCompleted.filter(e => e.completed_at && new Date(e.completed_at).getMonth() === new Date().getMonth()).length, reward: 300, icon: <BookOpen size={16} /> },
                    { title: 'Quiz Master', description: 'Score 90%+ on 2 assessments', target: 2, current: assessmentAttempts.filter(a => a.employee_id === currentEmployeeId && a.score >= 90).length, reward: 200, icon: <Brain size={16} /> },
                    { title: 'Discussion Leader', description: 'Post in 3 discussions', target: 3, current: discussions.filter(d => d.author_id === currentEmployeeId).length, reward: 150, icon: <MessageSquare size={16} /> },
                    { title: 'Learning Streak', description: 'Maintain a 14-day streak', target: 14, current: 7, reward: 500, icon: <Activity size={16} /> },
                  ].map((challenge, i) => {
                    const pct = Math.min(100, Math.round((challenge.current / challenge.target) * 100))
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-tempo-500/10 flex items-center justify-center shrink-0 text-tempo-400">{challenge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-semibold text-t1">{challenge.title}</h4>
                            <Badge variant={pct >= 100 ? 'success' : 'info'} className="text-[0.55rem]">{pct >= 100 ? 'Completed' : `${challenge.current}/${challenge.target}`}</Badge>
                          </div>
                          <p className="text-[0.6rem] text-t3 mb-2">{challenge.description}</p>
                          <Progress value={pct} className="h-1.5 mb-1" />
                          <p className="text-[0.55rem] text-yellow-400">Reward: {challenge.reward} points</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Certifications Tab (SeamlessHR-inspired) */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">Certification Management</h3>
              <p className="text-xs text-t3">Track certifications, expiration dates, and renewal requirements</p>
            </div>
            <Button size="sm" onClick={() => setShowCertDesigner(true)}>
              <PenTool size={14} /> Design Template
            </Button>
          </div>

          {/* Certificate Templates */}
          {certificateTemplates.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-t2 mb-2">Certificate Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {certificateTemplates.map((tpl: any) => (
                  <Card key={tpl.id} className="cursor-pointer hover:border-tempo-500/30 transition-colors" onClick={() => setShowCertDesigner(true)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${tpl.accentColor}20` }}>
                        <Award size={18} style={{ color: tpl.accentColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-t1">{tpl.name}</p>
                        <p className="text-[0.6rem] text-t3 capitalize">{tpl.layout} · {tpl.fontFamily}</p>
                      </div>
                      <Badge variant="default" className="text-[0.5rem]">{tpl.layout}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <ExpandableStats>
            <StatCard label="Total Certifications" value={certifications.length} icon={<Award size={20} />} />
            <StatCard label="Valid" value={certifications.filter(c => c.status === 'valid').length} icon={<CheckCircle size={20} />} />
            <StatCard label="Expiring Soon" value={certifications.filter(c => c.status === 'expiring_soon').length} icon={<AlertTriangle size={20} />} />
            <StatCard label="Expired" value={certifications.filter(c => c.status === 'expired').length} icon={<Shield size={20} />} />
          </ExpandableStats>

          {certifications.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Award size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t2 font-medium">No certifications yet</p>
                <p className="text-xs text-t3 mt-1">Complete compliance training courses to earn certifications</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-divider">
                      <th className="text-left py-2.5 px-3 text-t3 font-medium">Certification</th>
                      <th className="text-left py-2.5 px-3 text-t3 font-medium">Completed</th>
                      <th className="text-left py-2.5 px-3 text-t3 font-medium">Expires</th>
                      <th className="text-right py-2.5 px-3 text-t3 font-medium">Days Left</th>
                      <th className="text-right py-2.5 px-3 text-t3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certifications.map((cert, i) => (
                      <tr key={i} className="border-b border-divider/50 hover:bg-canvas transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', cert.status === 'valid' ? 'bg-green-500/10' : cert.status === 'expiring_soon' ? 'bg-amber-500/10' : 'bg-red-500/10')}>
                              <Award size={14} className={cert.status === 'valid' ? 'text-green-500' : cert.status === 'expiring_soon' ? 'text-amber-500' : 'text-red-500'} />
                            </div>
                            <span className="font-medium text-t1">{cert.courseTitle}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-t2">{cert.completedDate}</td>
                        <td className="py-2.5 px-3 text-t2">{cert.expiryDate}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={cert.daysUntilExpiry < 0 ? 'text-red-500 font-semibold' : cert.daysUntilExpiry < 30 ? 'text-amber-500 font-semibold' : 'text-t2'}>
                            {cert.daysUntilExpiry < 0 ? `${Math.abs(cert.daysUntilExpiry)}d overdue` : `${cert.daysUntilExpiry}d`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant={cert.status === 'valid' ? 'success' : cert.status === 'expiring_soon' ? 'warning' : 'error'}>
                            {cert.status === 'valid' ? 'Valid' : cert.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Adaptive Learning Tab (SeamlessHR + Sana-inspired) */}
      {activeTab === 'adaptive' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">Adaptive Learning <Badge variant="ai">AI-Powered</Badge></h3>
              <p className="text-xs text-t3">Spaced repetition and knowledge retention tracking to maximize learning outcomes</p>
            </div>
          </div>

          <ExpandableStats>
            <StatCard label="Avg Retention" value={`${spacedRepetitionData.length > 0 ? Math.round(spacedRepetitionData.reduce((a, s) => a + s.retentionScore, 0) / spacedRepetitionData.length) : 0}%`} icon={<Brain size={20} />} />
            <StatCard label="Needs Review" value={spacedRepetitionData.filter(s => s.needsReview).length} icon={<AlertTriangle size={20} />} />
            <StatCard label="Strong Retention" value={spacedRepetitionData.filter(s => s.retentionScore >= 80).length} icon={<TrendingUp size={20} />} />
            <StatCard label="Courses Completed" value={spacedRepetitionData.length} icon={<CheckCircle size={20} />} />
          </ExpandableStats>

          {spacedRepetitionData.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Brain size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t2 font-medium">No completed courses yet</p>
                <p className="text-xs text-t3 mt-1">Complete courses to start tracking knowledge retention</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Knowledge Retention Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {spacedRepetitionData.slice(0, 9).map((item, i) => (
                  <Card key={i} className={item.needsReview ? 'border-amber-200 bg-amber-50/20' : ''}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-t1 truncate flex-1">{item.courseTitle}</span>
                      {item.needsReview && <Badge variant="warning">Review needed</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <Progress value={item.retentionScore} color={item.retentionScore >= 80 ? 'success' : item.retentionScore >= 60 ? 'orange' : 'warning'} />
                      </div>
                      <span className={cn('text-sm font-bold', item.retentionScore >= 80 ? 'text-green-600' : item.retentionScore >= 60 ? 'text-blue-600' : 'text-amber-600')}>
                        {item.retentionScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[0.6rem] text-t3">
                      <span>Completed {item.daysSince}d ago</span>
                      <span>Next review: {item.nextReviewDate}</span>
                    </div>
                    {item.needsReview && (
                      <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => addToast('Spaced repetition quiz would launch here')}>
                        <Play size={10} /> Start Review Quiz
                      </Button>
                    )}
                  </Card>
                ))}
              </div>

              {/* Forgetting Curve Explanation */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} className="text-tempo-600" />
                  <h4 className="text-sm font-semibold text-t1">How Adaptive Learning Works</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-canvas rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-tempo-100 flex items-center justify-center text-tempo-600 mb-2 text-sm font-bold">1</div>
                    <p className="text-xs font-medium text-t1 mb-1">Track Retention</p>
                    <p className="text-[0.6rem] text-t3">Knowledge retention is modeled using the Ebbinghaus forgetting curve, estimating how much you remember over time.</p>
                  </div>
                  <div className="bg-canvas rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-tempo-100 flex items-center justify-center text-tempo-600 mb-2 text-sm font-bold">2</div>
                    <p className="text-xs font-medium text-t1 mb-1">Smart Scheduling</p>
                    <p className="text-[0.6rem] text-t3">Review quizzes are scheduled at optimal intervals. Low retention triggers earlier reviews. Strong retention extends intervals.</p>
                  </div>
                  <div className="bg-canvas rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-tempo-100 flex items-center justify-center text-tempo-600 mb-2 text-sm font-bold">3</div>
                    <p className="text-xs font-medium text-t1 mb-1">Reinforce & Grow</p>
                    <p className="text-[0.6rem] text-t3">Each successful review strengthens neural pathways, making knowledge permanent. The system adapts difficulty based on your performance.</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Transcript Tab */}
      {activeTab === 'transcript' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">Learning Transcript</h3>
              <p className="text-[0.6rem] text-t3">Formal record of completed courses and certifications</p>
            </div>
            <Button size="sm" onClick={exportTranscriptPDF}><Download size={14} /> Export PDF</Button>
          </div>

          {/* Employee Selector & Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={transcriptEmployee || currentEmployeeId} onChange={e => setTranscriptEmployee(e.target.value)} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
            <Select value={transcriptCategory} onChange={e => setTranscriptCategory(e.target.value)} options={[{ value: 'all', label: 'All Categories' }, ...courseCategories.map(c => ({ value: c, label: c }))]} />
            <Input type="date" value={transcriptDateFrom} onChange={e => setTranscriptDateFrom(e.target.value)} placeholder="From" />
            <Input type="date" value={transcriptDateTo} onChange={e => setTranscriptDateTo(e.target.value)} placeholder="To" />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-t1">{transcriptSummary.totalCourses}</p>
                <p className="text-[0.6rem] text-t3">Courses Completed</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-t1">{transcriptSummary.totalHours}h</p>
                <p className="text-[0.6rem] text-t3">Total Hours</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-t1">{transcriptSummary.certificates}</p>
                <p className="text-[0.6rem] text-t3">Certificates Earned</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-t1">{transcriptSummary.avgScore ? `${transcriptSummary.avgScore}%` : '-'}</p>
                <p className="text-[0.6rem] text-t3">Average Score</p>
              </div>
            </Card>
          </div>

          {/* Transcript Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-t3 font-medium">Course</th>
                  <th className="text-left py-2 px-3 text-t3 font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-t3 font-medium">Level</th>
                  <th className="text-left py-2 px-3 text-t3 font-medium">Completed</th>
                  <th className="text-right py-2 px-3 text-t3 font-medium">Score</th>
                  <th className="text-right py-2 px-3 text-t3 font-medium">Hours</th>
                  <th className="text-center py-2 px-3 text-t3 font-medium">Certificate</th>
                </tr></thead>
                <tbody>
                  {transcriptData.map(entry => (
                    <tr key={entry.enrollmentId} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={14} className="text-tempo-400 shrink-0" />
                          <span className="font-medium text-t1">{entry.courseTitle}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3"><Badge variant="info" className="text-[0.55rem]">{entry.category}</Badge></td>
                      <td className="py-2.5 px-3"><span className="text-t2 capitalize">{entry.level}</span></td>
                      <td className="py-2.5 px-3"><span className="text-t2">{entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : '-'}</span></td>
                      <td className="py-2.5 px-3 text-right">{entry.score ? <span className={cn('font-medium', entry.score >= 80 ? 'text-green-400' : entry.score >= 60 ? 'text-yellow-400' : 'text-red-400')}>{entry.score}%</span> : <span className="text-t3">-</span>}</td>
                      <td className="py-2.5 px-3 text-right text-t2">{entry.durationHours}h</td>
                      <td className="py-2.5 px-3 text-center">
                        <Button size="sm" variant="ghost" className="text-[0.6rem]" onClick={() => handleViewCertificate(entry.enrollmentId)}>
                          <Award size={12} className="text-tempo-400" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transcriptData.length === 0 && (
                <div className="text-center py-8"><FileText size={32} className="mx-auto text-t3 mb-2" /><p className="text-sm text-t3">No completed courses found</p></div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* External Training Tab */}
      {activeTab === 'external-training' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-t1">External Training Requests</h2>
              <p className="text-xs text-t3">Request approval for external courses, certifications, and conferences</p>
            </div>
            <Button size="sm" onClick={() => setShowExtReqModal(true)}><Plus size={14} /> Request External Training</Button>
          </div>

          {/* Stats */}
          <ExpandableStats>
            <StatCard label="Total Requests" value={extRequests.length} icon={<Briefcase size={20} />} />
            <StatCard label="Pending" value={extRequests.filter(r => r.status === 'pending' || r.status === 'manager_approved').length} icon={<Clock size={20} />} change="Awaiting approval" changeType="neutral" />
            <StatCard label="Approved" value={extRequests.filter(r => r.status === 'approved').length} icon={<CheckCircle size={20} />} change="Enrolled" changeType="positive" />
            <StatCard label="Total Cost" value={`GHS ${extRequests.filter(r => r.status !== 'rejected').reduce((s, r) => s + (r.cost || 0), 0).toLocaleString()}`} icon={<TrendingUp size={20} />} />
          </ExpandableStats>

          {/* Requests Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Requests</CardTitle>
                <Badge variant="info">{extRequests.length} total</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Course / Program</th>
                    <th className="tempo-th text-left px-4 py-3">Provider</th>
                    <th className="tempo-th text-left px-4 py-3">Requested By</th>
                    <th className="tempo-th text-center px-4 py-3">Cost</th>
                    <th className="tempo-th text-center px-4 py-3">Format</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                    <th className="tempo-th text-left px-4 py-3">Submitted</th>
                    {canApproveTraining && <th className="tempo-th text-center px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {extRequests.map(req => (
                    <tr key={req.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-t1">{req.title}</p>
                          {req.url && <a href={req.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-tempo-400 hover:underline">{req.url}</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{req.provider}</td>
                      <td className="px-4 py-3 text-xs text-t2">{req.employee_name}</td>
                      <td className="px-4 py-3 text-xs text-center text-t1 font-medium">{req.cost > 0 ? `GHS ${req.cost.toLocaleString()}` : 'Free'}</td>
                      <td className="px-4 py-3 text-center"><Badge variant="info" className="text-[10px] capitalize">{req.format}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : req.status === 'manager_approved' ? 'info' : 'warning'}>
                          {req.status === 'manager_approved' ? 'Manager Approved' : req.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t3">{new Date(req.submitted_at).toLocaleDateString()}</td>
                      {canApproveTraining && (
                        <td className="px-4 py-3 text-center">
                          {req.status === 'pending' && req.employee_id !== currentEmployeeId && (
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" onClick={() => approveExtRequest(req.id, 'manager_approved')}>Approve</Button>
                              <Button size="sm" variant="ghost" onClick={() => rejectExtRequest(req.id)}>Reject</Button>
                            </div>
                          )}
                          {req.status === 'manager_approved' && (
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" onClick={() => approveExtRequest(req.id, 'approved')}>Final Approve</Button>
                              <Button size="sm" variant="ghost" onClick={() => rejectExtRequest(req.id)}>Reject</Button>
                            </div>
                          )}
                          {(req.status === 'approved' || req.status === 'rejected') && <span className="text-xs text-t3">—</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                  {extRequests.length === 0 && (
                    <tr><td colSpan={canApproveTraining ? 8 : 7} className="px-6 py-12 text-center text-sm text-t3">No external training requests yet. Click &quot;Request External Training&quot; to submit one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <ScenarioCards employees={employees} currentEmployeeId={currentEmployeeId} addToast={addToast} />
      )}

      {activeTab === 'smart-reviews' && (
        <SmartReviews courses={courses} enrollments={enrollments} quizQuestions={quizQuestions} addToast={addToast} />
      )}

      {activeTab === 'events' && (
        <InPersonEvents employees={employees} courses={courses} currentEmployeeId={currentEmployeeId} getEmployeeName={getEmployeeName} addToast={addToast} />
      )}

      {activeTab === 'version-history' && (
        <VersionHistory courseId={selectedBuilderCourse || courses[0]?.id || ''} courseTitle={courses.find(c => c.id === (selectedBuilderCourse || courses[0]?.id))?.title || 'Course'} courseBlocks={courseBlocks} getEmployeeName={getEmployeeName} addToast={addToast} />
      )}

      {/* External Training Request Modal */}
      <Modal open={showExtReqModal} onClose={() => setShowExtReqModal(false)} title="Request External Training">
        <div className="space-y-4">
          <Input label="Course / Program Title" value={extReqForm.title} onChange={e => setExtReqForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. AWS Solutions Architect Certification" />
          <Input label="Training Provider" value={extReqForm.provider} onChange={e => setExtReqForm(f => ({ ...f, provider: e.target.value }))} placeholder="e.g. Coursera, Udemy, KNUST" />
          <Input label="Course URL (optional)" value={extReqForm.url} onChange={e => setExtReqForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Estimated Cost (GHS)" type="number" value={extReqForm.cost} onChange={e => setExtReqForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" />
            <Select label="Format" value={extReqForm.format} onChange={e => setExtReqForm(f => ({ ...f, format: e.target.value }))} options={[
              { value: 'online', label: 'Online' },
              { value: 'in_person', label: 'In Person' },
              { value: 'blended', label: 'Blended' },
              { value: 'conference', label: 'Conference' },
            ]} />
          </div>
          <Textarea label="Business Justification" value={extReqForm.justification} onChange={e => setExtReqForm(f => ({ ...f, justification: e.target.value }))} placeholder="Explain how this training aligns with your role and development goals..." rows={3} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowExtReqModal(false)}>Cancel</Button>
            <Button onClick={submitExtRequest} disabled={!extReqForm.title || !extReqForm.provider}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      {/* Content Detail Modal */}
      <Modal open={showContentDetailModal} onClose={() => setShowContentDetailModal(false)} title="Content Details" size="lg">
        {selectedContentItem && (
          <div className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-tempo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <div className="text-center"><Globe size={40} className="mx-auto text-tempo-400 mb-2" /><p className="text-xs text-t3">Preview not available</p></div>
            </div>
            <div>
              <h3 className="text-base font-bold text-t1 mb-1">{selectedContentItem.title}</h3>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn('text-xs px-2 py-0.5 rounded border', providerColor(selectedContentItem.provider))}>{providerLabel(selectedContentItem.provider)}</span>
                <Badge variant="info">{selectedContentItem.level}</Badge>
                {selectedContentItem.language !== 'English' && <Badge variant="info">{selectedContentItem.language}</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-2 bg-white/[0.02] rounded-lg"><p className="text-lg font-bold text-t1">{selectedContentItem.rating}</p><p className="text-[0.6rem] text-t3">Rating</p></div>
              <div className="text-center p-2 bg-white/[0.02] rounded-lg"><p className="text-lg font-bold text-t1">{Math.round((selectedContentItem.duration_minutes || 0) / 60)}h</p><p className="text-[0.6rem] text-t3">Duration</p></div>
              <div className="text-center p-2 bg-white/[0.02] rounded-lg"><p className="text-lg font-bold text-t1">{(selectedContentItem.enrollment_count || 0).toLocaleString()}</p><p className="text-[0.6rem] text-t3">Enrolled</p></div>
              <div className="text-center p-2 bg-white/[0.02] rounded-lg"><p className="text-lg font-bold text-t1">{selectedContentItem.format}</p><p className="text-[0.6rem] text-t3">Format</p></div>
            </div>
            {selectedContentItem.tags && (selectedContentItem.tags as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(selectedContentItem.tags as string[]).map(tag => (
                  <Badge key={tag} variant="info" className="text-[0.55rem]">{tag}</Badge>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowContentDetailModal(false)}>Close</Button>
              <Button onClick={() => { handleAddToOrgCatalog(selectedContentItem); setShowContentDetailModal(false) }}><Plus size={14} /> Add to Course Catalog</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Prerequisite Modal */}
      <Modal open={showPrereqModal} onClose={() => setShowPrereqModal(false)} title="Add Prerequisite">
        <div className="space-y-4">
          <Select label="Course" value={prereqForm.course_id} onChange={e => setPrereqForm({ ...prereqForm, course_id: e.target.value })} options={[{ value: '', label: 'Select course...' }, ...courses.map(c => ({ value: c.id, label: c.title }))]} />
          <Select label="Prerequisite Course" value={prereqForm.prerequisite_course_id} onChange={e => setPrereqForm({ ...prereqForm, prerequisite_course_id: e.target.value })} options={[{ value: '', label: 'Select prerequisite...' }, ...courses.filter(c => c.id !== prereqForm.course_id).map(c => ({ value: c.id, label: c.title }))]} />
          <Select label="Type" value={prereqForm.type} onChange={e => setPrereqForm({ ...prereqForm, type: e.target.value })} options={[{ value: 'required', label: 'Required' }, { value: 'recommended', label: 'Recommended' }]} />
          {prereqForm.type === 'required' && (
            <Input label="Minimum Score (%)" type="number" value={prereqForm.minimum_score} onChange={e => setPrereqForm({ ...prereqForm, minimum_score: e.target.value })} placeholder="e.g. 70" />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPrereqModal(false)}>Cancel</Button>
            <Button onClick={handleAddPrerequisite}>Add Prerequisite</Button>
          </div>
        </div>
      </Modal>

      {/* SCORM Upload Modal */}
      <Modal open={showScormUploadModal} onClose={() => setShowScormUploadModal(false)} title="Upload SCORM Package">
        <div className="space-y-4">
          <Select label="Course" value={scormUploadCourse} onChange={e => setScormUploadCourse(e.target.value)} options={[{ value: '', label: 'Select course...' }, ...courses.map(c => ({ value: c.id, label: c.title }))]} />
          <Select label="SCORM Version" value={scormUploadVersion} onChange={e => setScormUploadVersion(e.target.value)} options={[{ value: 'scorm_1_2', label: 'SCORM 1.2' }, { value: 'scorm_2004', label: 'SCORM 2004' }, { value: 'xapi', label: 'xAPI (Tin Can)' }]} />
          {scormUploadState === 'idle' && (
            <label className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-tempo-500/30 transition-colors block">
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleScormFileSelect}
                disabled={!scormUploadCourse}
              />
              <Upload size={32} className="mx-auto text-t3 mb-2" />
              <p className="text-xs text-t1 font-medium mb-1">{scormUploadCourse ? 'Drop SCORM package here or click to upload' : 'Select a course first'}</p>
              <p className="text-[0.6rem] text-t3">Supports .zip files up to 500MB</p>
            </label>
          )}
          {scormUploadState !== 'idle' && (
            <div className="space-y-3">
              <Progress value={scormUploadProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-t2">{scormUploadState === 'uploading' ? 'Uploading...' : scormUploadState === 'processing' ? 'Processing SCORM manifest...' : 'Complete!'}</span>
                <span className="text-tempo-400">{scormUploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* New Course Modal */}
      <Modal open={showCourseModal} onClose={() => setShowCourseModal(false)} title={t('createCourseModal')}>
        <div className="space-y-4">
          <Input label={t('courseTitle')} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder={t('courseTitlePlaceholder')} />
          <Textarea label={t('courseDescription')} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder={t('courseDescPlaceholder')} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('categoryLabel')} value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} options={[
              { value: 'Leadership', label: t('categoryLeadership') },
              { value: 'Technical', label: t('categoryTechnical') },
              { value: 'Compliance', label: t('categoryCompliance') },
              { value: 'Management', label: t('categoryManagement') },
              { value: 'Service', label: t('categoryService') },
              { value: 'Technology', label: t('categoryTechnology') },
            ]} />
            <Input label={t('durationHours')} type="number" value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('format')} value={courseForm.format} onChange={(e) => setCourseForm({ ...courseForm, format: e.target.value as 'online' | 'classroom' | 'blended' })} options={[
              { value: 'online', label: t('formatOnline') },
              { value: 'classroom', label: t('formatClassroom') },
              { value: 'blended', label: t('formatBlended') },
            ]} />
            <Select label={t('level')} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })} options={[
              { value: 'beginner', label: t('levelBeginner') },
              { value: 'intermediate', label: t('levelIntermediate') },
              { value: 'advanced', label: t('levelAdvanced') },
            ]} />
          </div>
          <label className="flex items-center gap-2 text-xs text-t1">
            <input type="checkbox" checked={courseForm.is_mandatory} onChange={(e) => setCourseForm({ ...courseForm, is_mandatory: e.target.checked })} className="rounded border-divider" />
            {t('mandatoryCourse')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCourseModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCourse} disabled={saving}>{saving ? 'Saving...' : t('createCourse')}</Button>
          </div>
        </div>
      </Modal>

      {/* Mass Enroll Employee Modal */}
      <Modal open={showEnrollModal} onClose={resetEnrollModal} title={t('massEnrollTitle')} description={t('massEnrollDesc')} size="xl">
        <div className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', enrollStep >= 1 ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3')}>
                {enrollStep > 1 ? <CheckCircle size={14} /> : '1'}
              </div>
              <span className={cn('text-xs font-medium', enrollStep >= 1 ? 'text-t1' : 'text-t3')}>{t('stepEmployees')}</span>
            </div>
            <div className="flex-1 h-px bg-divider" />
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', enrollStep >= 2 ? 'bg-tempo-600 text-white' : 'bg-gray-200 text-t3')}>2</div>
              <span className={cn('text-xs font-medium', enrollStep >= 2 ? 'text-t1' : 'text-t3')}>{t('stepCourse')}</span>
            </div>
          </div>

          {enrollStep === 1 && (
            <>
              {/* Mode Toggle Pills */}
              <div className="flex gap-1 bg-canvas rounded-lg p-1">
                {([
                  { id: 'individual' as const, label: t('enrollModeIndividual'), icon: UserCheck },
                  { id: 'department' as const, label: t('enrollModeDepartment'), icon: Building2 },
                  { id: 'country' as const, label: t('enrollModeCountry'), icon: Globe },
                  { id: 'level' as const, label: t('enrollModeLevel'), icon: Layers },
                  { id: 'all' as const, label: t('enrollModeAll'), icon: UsersIcon },
                ]).map(mode => (
                  <button key={mode.id} onClick={() => { setEnrollMode(mode.id); setEnrollSearch(''); setSelectedEmployeeIds(new Set()); setSelectedDepartments(new Set()); setSelectedCountries(new Set()); setSelectedLevels(new Set()) }}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center',
                      enrollMode === mode.id ? 'bg-white text-tempo-700 shadow-sm' : 'text-t3 hover:text-t1')}>
                    <mode.icon size={13} />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Individual Mode: Search + Checkbox List */}
              {enrollMode === 'individual' && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                    <input type="text" placeholder={t('searchEmployeesPlaceholder')} value={enrollSearch} onChange={(e) => setEnrollSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600" />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                    <label className="flex items-center gap-3 px-4 py-2.5 bg-canvas cursor-pointer sticky top-0 z-10 border-b border-divider">
                      <input type="checkbox" className="rounded border-border accent-[var(--color-tempo-600)]"
                        checked={enrollTargetEmployees.length > 0 && enrollTargetEmployees.every(e => selectedEmployeeIds.has(e.id))}
                        onChange={(e) => { if (e.target.checked) setSelectedEmployeeIds(new Set(enrollTargetEmployees.map(emp => emp.id))); else setSelectedEmployeeIds(new Set()) }} />
                      <span className="text-xs font-medium text-t2">{t('selectAll')} ({enrollTargetEmployees.length})</span>
                    </label>
                    {enrollTargetEmployees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-canvas/50 cursor-pointer">
                        <input type="checkbox" className="rounded border-border accent-[var(--color-tempo-600)]" checked={selectedEmployeeIds.has(emp.id)} onChange={() => toggleEmployeeSelection(emp.id)} />
                        <Avatar name={emp.profile?.full_name || ''} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                          <p className="text-[0.65rem] text-t3 truncate">{emp.profile?.email}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-t2">{emp.job_title}</p>
                          <p className="text-[0.65rem] text-t3">{getDepartmentName(emp.department_id)} · {emp.country}</p>
                        </div>
                      </label>
                    ))}
                    {enrollTargetEmployees.length === 0 && (
                      <div className="px-4 py-8 text-center text-xs text-t3">{t('noEmployeesMatch')}</div>
                    )}
                  </div>
                </>
              )}

              {/* Department Mode: Toggle Chips + Preview List */}
              {enrollMode === 'department' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {departments.map(dept => {
                      const count = employees.filter(e => e.department_id === dept.id).length
                      return (
                        <button key={dept.id} onClick={() => toggleSetItem(selectedDepartments, setSelectedDepartments, dept.id)}
                          className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            selectedDepartments.has(dept.id) ? 'bg-tempo-100 border-tempo-300 text-tempo-700 font-medium' : 'border-divider text-t3 hover:text-t1 hover:border-gray-300')}>
                          {dept.name} <span className="text-[0.6rem] ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  {enrollTargetEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                      {enrollTargetEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-4 py-2">
                          <Avatar name={emp.profile?.full_name || ''} size="sm" />
                          <span className="text-xs font-medium text-t1">{emp.profile?.full_name}</span>
                          <span className="text-xs text-t3 ml-auto">{emp.job_title} · {emp.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Country Mode: Toggle Chips + Preview List */}
              {enrollMode === 'country' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCountries.map(country => {
                      const count = employees.filter(e => e.country === country).length
                      return (
                        <button key={country} onClick={() => toggleSetItem(selectedCountries, setSelectedCountries, country)}
                          className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            selectedCountries.has(country) ? 'bg-tempo-100 border-tempo-300 text-tempo-700 font-medium' : 'border-divider text-t3 hover:text-t1 hover:border-gray-300')}>
                          {country} <span className="text-[0.6rem] ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  {enrollTargetEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                      {enrollTargetEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-4 py-2">
                          <Avatar name={emp.profile?.full_name || ''} size="sm" />
                          <span className="text-xs font-medium text-t1">{emp.profile?.full_name}</span>
                          <span className="text-xs text-t3 ml-auto">{getDepartmentName(emp.department_id)} · {emp.level}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Level Mode: Toggle Chips + Preview List */}
              {enrollMode === 'level' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {uniqueLevels.map(level => {
                      const count = employees.filter(e => e.level === level).length
                      return (
                        <button key={level} onClick={() => toggleSetItem(selectedLevels, setSelectedLevels, level)}
                          className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            selectedLevels.has(level) ? 'bg-tempo-100 border-tempo-300 text-tempo-700 font-medium' : 'border-divider text-t3 hover:text-t1 hover:border-gray-300')}>
                          {level} <span className="text-[0.6rem] ml-1">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  {enrollTargetEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                      {enrollTargetEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-4 py-2">
                          <Avatar name={emp.profile?.full_name || ''} size="sm" />
                          <span className="text-xs font-medium text-t1">{emp.profile?.full_name}</span>
                          <span className="text-xs text-t3 ml-auto">{getDepartmentName(emp.department_id)} · {emp.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Entire Company Mode */}
              {enrollMode === 'all' && (
                <div className="bg-canvas rounded-lg p-6 text-center">
                  <UsersIcon size={32} className="mx-auto text-tempo-600 mb-2" />
                  <p className="text-sm font-semibold text-t1">{t('entireCompanySelected')}</p>
                  <p className="text-xs text-t3 mt-1">{t('allEmployeesWillBeEnrolled', { count: employees.length })}</p>
                </div>
              )}

              {/* Footer Step 1 */}
              <div className="flex items-center justify-between pt-2 border-t border-divider">
                <p className="text-xs text-t2 font-medium">
                  {enrollSelectedEmployees.length > 0 ? t('employeesSelected', { count: enrollSelectedEmployees.length }) : t('noEmployeesSelected')}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={resetEnrollModal}>{tc('cancel')}</Button>
                  <Button onClick={() => setEnrollStep(2)} disabled={enrollSelectedEmployees.length === 0}>
                    {t('nextSelectCourse')} <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {enrollStep === 2 && (
            <>
              {/* Course Search + Filters */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                  <input type="text" placeholder={t('searchCoursesPlaceholder')} value={enrollCourseSearch} onChange={(e) => setEnrollCourseSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600" />
                </div>
                <Select className="px-3 py-2 text-xs bg-white border border-divider rounded-lg text-t2 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                  value={enrollCourseCategory} onChange={(e) => setEnrollCourseCategory(e.target.value)}
                  options={[{value: 'all', label: t('allCategories')}, ...courseCategories.map(cat => ({value: cat, label: cat}))]} />
                <Select className="px-3 py-2 text-xs bg-white border border-divider rounded-lg text-t2 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                  value={enrollCourseLevel} onChange={(e) => setEnrollCourseLevel(e.target.value)}
                  options={[{value: 'all', label: t('allLevels')}, {value: 'beginner', label: 'Beginner'}, {value: 'intermediate', label: 'Intermediate'}, {value: 'advanced', label: 'Advanced'}]} />
              </div>

              {/* Course Radio List */}
              <div className="max-h-56 overflow-y-auto border border-divider rounded-lg divide-y divide-divider">
                {filteredEnrollCourses.map(course => (
                  <label key={course.id} className={cn('flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                    selectedCourseId === course.id ? 'bg-tempo-50' : 'hover:bg-canvas/50')}>
                    <input type="radio" name="enroll-course" className="accent-[var(--color-tempo-600)]" checked={selectedCourseId === course.id} onChange={() => setSelectedCourseId(course.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-t1">{course.title}</p>
                        {course.is_mandatory && <Badge variant="warning">Mandatory</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge>{course.category}</Badge>
                        <Badge>{course.format}</Badge>
                        <Badge>{course.level}</Badge>
                        <span className="text-[0.6rem] text-t3">{course.duration_hours}h</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Enrollment Summary */}
              {selectedCourseId && (
                <div className="space-y-3">
                  <h4 className="text-[0.65rem] font-semibold text-t2 uppercase tracking-wider">{t('enrollmentSummary')}</h4>
                  <div className="bg-canvas rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-t1">{courses.find(c => c.id === selectedCourseId)?.title}</span>
                      <Badge variant="info">{courses.find(c => c.id === selectedCourseId)?.duration_hours}h · {courses.find(c => c.id === selectedCourseId)?.format}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-divider">
                      <div className="text-center">
                        <p className="text-xl font-bold text-t1">{enrollSelectedEmployees.length}</p>
                        <p className="text-[0.6rem] text-t3">{t('totalSelected')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{newEnrollees.length}</p>
                        <p className="text-[0.6rem] text-t3">{t('newEnrollments')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-amber-500">{skippedEnrollees.length}</p>
                        <p className="text-[0.6rem] text-t3">{t('alreadyEnrolledSkipped')}</p>
                      </div>
                    </div>
                    {skippedEnrollees.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-divider">
                        <p className="text-[0.6rem] text-t3 mb-1.5">{t('alreadyEnrolledList')}:</p>
                        <div className="flex flex-wrap gap-1">
                          {skippedEnrollees.map(emp => <Badge key={emp.id} variant="warning">{emp.profile?.full_name}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Step 2 */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
                <Button variant="secondary" onClick={() => setEnrollStep(1)}>{tc('back')}</Button>
                <Button variant="secondary" onClick={resetEnrollModal}>{tc('cancel')}</Button>
                <Button onClick={submitMassEnrollment} disabled={saving || !selectedCourseId || newEnrollees.length === 0}>
                  {saving ? 'Enrolling...' : t('enrollCount', { count: newEnrollees.length })}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* AI Course Builder Modal */}
      <Modal open={showBuilderModal} onClose={() => setShowBuilderModal(false)} title={t('aiBuilder')} size="lg">
        <div className="space-y-4">
          {!generatedOutline ? (
            <>
              <Input label={t('topic')} value={builderForm.topic} onChange={(e) => setBuilderForm({ ...builderForm, topic: e.target.value })} placeholder="e.g. Project Management, Data Analysis..." />
              <div className="grid grid-cols-2 gap-4">
                <Select label={t('level')} value={builderForm.level} onChange={(e) => setBuilderForm({ ...builderForm, level: e.target.value })} options={[
                  { value: 'beginner', label: t('levelBeginner') },
                  { value: 'intermediate', label: t('levelIntermediate') },
                  { value: 'advanced', label: t('levelAdvanced') },
                ]} />
                <Input label={t('duration') + ' (hours)'} type="number" min={1} max={100} value={builderForm.duration} onChange={(e) => setBuilderForm({ ...builderForm, duration: Number(e.target.value) })} />
              </div>
              {aiGenerating && (
                <div className="bg-tempo-50/50 rounded-xl p-6 border border-tempo-200">
                  <div className="flex items-center gap-3 mb-3">
                    <AIPulse size="md" />
                    <div>
                      <p className="text-sm font-medium text-t1">Generating course with AI...</p>
                      <p className="text-xs text-t3">Claude is creating a structured course outline with lesson content</p>
                    </div>
                  </div>
                  <Progress value={65} showLabel color="orange" />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowBuilderModal(false)}>{tc('cancel')}</Button>
                <Button onClick={handleGenerateOutline} disabled={aiGenerating || !builderForm.topic}>
                  {aiGenerating ? <><AIPulse size="sm" /> Generating...</> : <><Sparkles size={14} /> {t('generateOutline')}</>}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-tempo-600" />
                  <h4 className="text-sm font-semibold text-t1">{generatedOutline.title}</h4>
                </div>
                <p className="text-xs text-t3 mb-4">{generatedOutline.description}</p>
                <div className="space-y-3">
                  {generatedOutline.modules.map((mod, i) => (
                    <div key={i} className="bg-surface rounded-lg p-3">
                      <p className="text-xs font-medium text-t1 mb-1">{mod.title}</p>
                      <p className="text-[0.6rem] text-t3 mb-2">{mod.duration_minutes} min</p>
                      <div className="space-y-1">
                        {mod.lessons.map((lesson, j) => (
                          <div key={j} className="text-[0.6rem] text-t2 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-tempo-100 text-tempo-600 flex items-center justify-center text-[0.5rem]">{j + 1}</span>
                            {lesson}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setGeneratedOutline(null)}>{tc('back')}</Button>
                <Button onClick={handleSaveGeneratedCourse}><Zap size={14} /> {t('saveAsCourse')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Schedule Live Session Modal */}
      <Modal open={showSessionModal} onClose={() => setShowSessionModal(false)} title={t('scheduleSession')}>
        <div className="space-y-4">
          <Input label={t('courseTitle')} value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} placeholder="Session title..." />
          <Select label={t('courseTitle')} value={sessionForm.course_id} onChange={(e) => setSessionForm({ ...sessionForm, course_id: e.target.value })} options={[
            { value: '', label: '-- Select Course --' },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('instructor')} value={sessionForm.instructor} onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })} />
            <Input label={tc('date')} type="datetime-local" value={sessionForm.scheduled_at} onChange={(e) => setSessionForm({ ...sessionForm, scheduled_at: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label={t('sessionType')} value={sessionForm.type} onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })} options={[
              { value: 'webinar', label: t('webinar') },
              { value: 'workshop', label: t('workshop') },
              { value: 'q_and_a', label: t('qAndA') },
            ]} />
            <Input label={t('duration') + ' (min)'} type="number" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: Number(e.target.value) })} />
            <Input label={t('capacity')} type="number" value={sessionForm.capacity} onChange={(e) => setSessionForm({ ...sessionForm, capacity: Number(e.target.value) })} />
          </div>
          <Input label={t('meetingUrl')} value={sessionForm.meeting_url} onChange={(e) => setSessionForm({ ...sessionForm, meeting_url: e.target.value })} placeholder="https://meet.tempo.com/..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSessionModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSession} disabled={saving}>{saving ? 'Saving...' : t('scheduleSession')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Learning Path Modal */}
      <Modal open={showPathModal} onClose={() => setShowPathModal(false)} title={t('createPath')} size="lg">
        <div className="space-y-4">
          <Input label={t('courseTitle')} value={pathForm.title} onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })} placeholder="Path name..." />
          <Textarea label={t('courseDescription')} value={pathForm.description} onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })} rows={2} placeholder="Describe this learning path..." />
          <Select label={t('level')} value={pathForm.level} onChange={(e) => setPathForm({ ...pathForm, level: e.target.value })} options={[
            { value: 'beginner', label: t('levelBeginner') },
            { value: 'intermediate', label: t('levelIntermediate') },
            { value: 'advanced', label: t('levelAdvanced') },
          ]} />
          <div>
            <p className="text-xs font-medium text-t1 mb-2">{t('courseSequence')}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {courses.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-canvas cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathForm.course_ids.includes(c.id)}
                    onChange={() => toggleCourseInPath(c.id)}
                    className="rounded border-divider"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-t1">{c.title}</p>
                    <p className="text-[0.6rem] text-t3">{c.category} - {c.duration_hours}h - {c.level}</p>
                  </div>
                </label>
              ))}
            </div>
            {pathForm.course_ids.length > 0 && (
              <p className="text-xs text-t3 mt-2">
                {pathForm.course_ids.length} {t('coursesInPath')} - {t('estimatedHours')}: {courses.filter(c => pathForm.course_ids.includes(c.id)).reduce((a, c) => a + c.duration_hours, 0)}h
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPathModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPath} disabled={saving}>{saving ? 'Saving...' : t('createPath')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Content Block Modal */}
      <Modal open={showBlockModal} onClose={() => setShowBlockModal(false)} title={t('addBlock')}>
        <div className="space-y-4">
          <Select label={t('blockType')} value={blockForm.type} onChange={(e) => setBlockForm({ ...blockForm, type: e.target.value })} options={[
            { value: 'text', label: t('blockTypeText') },
            { value: 'video', label: t('blockTypeVideo') },
            { value: 'quiz', label: t('blockTypeQuiz') },
            { value: 'interactive', label: t('blockTypeInteractive') },
            { value: 'download', label: t('blockTypeDownload') },
          ]} />
          <Input label={t('blockTitle')} value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} placeholder="Block title..." />
          <Textarea label={t('blockContent')} value={blockForm.content} onChange={(e) => setBlockForm({ ...blockForm, content: e.target.value })} rows={3} placeholder="Block content or URL..." />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('blockDuration')} type="number" value={blockForm.duration_minutes} onChange={(e) => setBlockForm({ ...blockForm, duration_minutes: Number(e.target.value) })} />
            <Input label={t('moduleN', { n: '' })} type="number" value={blockForm.module_index} onChange={(e) => setBlockForm({ ...blockForm, module_index: Number(e.target.value) })} />
            <Select label={t('blockStatus')} value={blockForm.status} onChange={(e) => setBlockForm({ ...blockForm, status: e.target.value })} options={[
              { value: 'draft', label: t('statusDraft') },
              { value: 'published', label: t('statusPublished') },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBlockModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitBlock} disabled={saving}>{saving ? 'Saving...' : t('addBlock')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Question Modal */}
      <Modal open={showQuestionModal} onClose={() => setShowQuestionModal(false)} title={t('addQuestion')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('questionType')} value={questionForm.type} onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })} options={[
              { value: 'multiple_choice', label: t('typeMultipleChoice') },
              { value: 'true_false', label: t('typeTrueFalse') },
              { value: 'fill_blank', label: t('typeFillBlank') },
              { value: 'matching', label: t('typeMatching') },
              { value: 'essay', label: t('typeEssay') },
            ]} />
            <Select label={t('courseTitle')} value={questionForm.course_id || selectedQuizCourse} onChange={(e) => setQuestionForm({ ...questionForm, course_id: e.target.value })} options={[
              { value: '', label: t('selectCoursePlaceholder') },
              ...courses.map(c => ({ value: c.id, label: c.title })),
            ]} />
          </div>
          <Textarea label={t('questionText')} value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} rows={2} placeholder="Enter your question..." />
          {(questionForm.type === 'multiple_choice' || questionForm.type === 'true_false') && (
            <div>
              <p className="text-xs font-medium text-t1 mb-2">{t('options')}</p>
              <div className="space-y-2">
                {(questionForm.type === 'true_false' ? ['True', 'False'] : questionForm.options).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={questionForm.correct_answer === optText(opt)} onChange={() => setQuestionForm({ ...questionForm, correct_answer: optText(opt) })} className="text-tempo-600" />
                    {questionForm.type === 'true_false' ? (
                      <span className="text-xs text-t1">{optText(opt)}</span>
                    ) : (
                      <Input value={optText(opt)} onChange={(e) => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm({ ...questionForm, options: opts }) }} placeholder={`Option ${i + 1}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {questionForm.type === 'fill_blank' && (
            <Input label={t('correctAnswer')} value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })} placeholder="Correct answer..." />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('pointValue')} type="number" value={questionForm.points} onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} />
            <Input label={t('explanation')} value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} placeholder="Why this is correct..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitQuestion} disabled={saving}>{saving ? 'Saving...' : t('addQuestion')}</Button>
          </div>
        </div>
      </Modal>

      {/* AI Quiz Generator Modal */}
      <Modal open={showAIQuizModal} onClose={() => setShowAIQuizModal(false)} title={t('aiGenerateQuiz')} size="lg">
        <div className="space-y-4">
          {!generatedQuestions ? (
            <>
              <p className="text-xs text-t3">{t('aiGenerateQuizDesc')}</p>
              <Input label={t('topic')} value={aiQuizTopic} onChange={(e) => setAiQuizTopic(e.target.value)} placeholder="e.g. Leadership, Compliance..." />
              <Input label={t('questionBank')} type="number" min={1} max={10} value={aiQuizCount} onChange={(e) => setAiQuizCount(Number(e.target.value))} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowAIQuizModal(false)}>{tc('cancel')}</Button>
                <Button onClick={handleGenerateQuiz}><Sparkles size={14} /> {t('generateQuestions')}</Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-tempo-600" />
                  <h4 className="text-sm font-semibold text-t1">{t('questionsGenerated', { count: generatedQuestions.length })}</h4>
                </div>
                <div className="space-y-3">
                  {generatedQuestions.map((q, i) => (
                    <div key={i} className="bg-surface rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{q.type === 'multiple_choice' ? t('typeMultipleChoice') : q.type === 'true_false' ? t('typeTrueFalse') : t('typeFillBlank')}</Badge>
                        <span className="text-[0.6rem] text-t3">{q.points} {t('points')}</span>
                      </div>
                      <p className="text-xs text-t1 mb-1">{q.question}</p>
                      {q.options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.options.map((opt, j) => (
                            <span key={j} className={`text-[0.6rem] px-1.5 py-0.5 rounded ${optText(opt) === q.correct_answer ? 'bg-green-50 text-green-700' : 'bg-canvas text-t3'}`}>{optText(opt)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setGeneratedQuestions(null)}>{tc('back')}</Button>
                <Button onClick={handleAddGeneratedToBank}><Zap size={14} /> {t('addToBank')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* New Discussion Modal */}
      <Modal open={showDiscussionModal} onClose={() => setShowDiscussionModal(false)} title={t('newDiscussion')}>
        <div className="space-y-4">
          <Input label={t('discussionTitle')} value={discussionForm.title} onChange={(e) => setDiscussionForm({ ...discussionForm, title: e.target.value })} placeholder="Discussion topic..." />
          <Textarea label={t('discussionContent')} value={discussionForm.content} onChange={(e) => setDiscussionForm({ ...discussionForm, content: e.target.value })} rows={3} placeholder="Share your thoughts..." />
          <Select label={t('courseTitle')} value={discussionForm.course_id || ''} onChange={(e) => setDiscussionForm({ ...discussionForm, course_id: e.target.value || null })} options={[
            { value: '', label: '-- General Discussion --' },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <Input label={t('discussionTags')} value={discussionForm.tags} onChange={(e) => setDiscussionForm({ ...discussionForm, tags: e.target.value })} placeholder="leadership, compliance (comma separated)" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDiscussionModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitDiscussion}>{tc('submit')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create Study Group Modal */}
      <Modal open={showGroupModal} onClose={() => setShowGroupModal(false)} title={t('createStudyGroup')}>
        <div className="space-y-4">
          <Input label={t('groupName')} value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="Group name..." />
          <Textarea label={t('groupDescription')} value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} rows={2} placeholder="What will your group study?" />
          <Select label={t('courseTitle')} value={groupForm.course_id} onChange={(e) => setGroupForm({ ...groupForm, course_id: e.target.value })} options={[
            { value: '', label: t('selectCoursePlaceholder') },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('maxMembers')} type="number" value={groupForm.max_members} onChange={(e) => setGroupForm({ ...groupForm, max_members: Number(e.target.value) })} />
            <Select label={t('meetingFrequency')} value={groupForm.meeting_frequency} onChange={(e) => setGroupForm({ ...groupForm, meeting_frequency: e.target.value })} options={[
              { value: 'weekly', label: t('frequencyWeekly') },
              { value: 'biweekly', label: t('frequencyBiweekly') },
              { value: 'monthly', label: t('frequencyMonthly') },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowGroupModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitStudyGroup}>{t('createStudyGroup')}</Button>
          </div>
        </div>
      </Modal>

      {/* Certificate Modal */}
      <Modal open={showCertificateModal} onClose={() => setShowCertificateModal(false)} title={t('completionCertificate')} size="lg">
        {certificateCourse && (
          <div className="space-y-4">
            {certificateTemplates.length > 0 ? (
              <CertificatePreview
                template={certificateTemplates[0] as any}
                employeeName={certificateCourse.employeeName}
                courseName={certificateCourse.title}
                completedAt={new Date(certificateCourse.completedAt).toLocaleDateString()}
                showActions
              />
            ) : (
              <div className="border-2 border-tempo-200 rounded-xl p-8 bg-gradient-to-br from-white to-tempo-50/30 text-center relative overflow-hidden print-certificate">
                <div className="absolute top-0 left-0 w-20 h-20 bg-tempo-100/30 rounded-br-full" />
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-tempo-100/30 rounded-tl-full" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-tempo-100 flex items-center justify-center mx-auto mb-4">
                    <Award size={32} className="text-tempo-600" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-tempo-600 font-semibold mb-2">{t('certificateOfCompletion')}</p>
                  <h3 className="text-xl font-bold text-t1 mb-1">{certificateCourse.title}</h3>
                  <div className="w-16 h-0.5 bg-tempo-300 mx-auto my-4" />
                  <p className="text-sm text-t2 mb-1">{t('awardedTo')}</p>
                  <p className="text-lg font-semibold text-t1 mb-4">{certificateCourse.employeeName}</p>
                  <div className="flex items-center justify-center gap-4 text-xs text-t3">
                    <span>{t('completedOn')}: {new Date(certificateCourse.completedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Tempo Platform</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="secondary" onClick={() => setShowCertificateModal(false)}>{tc('close')}</Button>
              <Button onClick={() => window.print()}>
                <Download size={14} /> {t('printCertificate')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Certificate Designer */}
      <CertificateDesigner
        open={showCertDesigner}
        onClose={() => setShowCertDesigner(false)}
        onSave={(template) => {
          addCertificateTemplate(template)
          setShowCertDesigner(false)
        }}
      />

      {/* SCORM Runtime Player */}
      {scormPlayerOpen && scormPlayerPackage && (
        <ScormPlayer
          open={scormPlayerOpen}
          onClose={() => { setScormPlayerOpen(false); setScormPlayerPackage(null) }}
          packageData={scormPlayerPackage}
          onComplete={(score, totalTime) => {
            addToast(`SCORM complete — Score: ${score}%, Time: ${totalTime}`)
            setScormPlayerOpen(false)
            setScormPlayerPackage(null)
          }}
        />
      )}

      {/* Auto-Enrollment Rule Modal */}
      <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title={t('createRule')}>
        <div className="space-y-4">
          <Input label={t('ruleName')} value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g. New Hire Compliance" />
          <Select label={t('ruleCondition')} value={ruleForm.condition_type} onChange={(e) => setRuleForm({ ...ruleForm, condition_type: e.target.value })} options={[
            { value: 'department_join', label: t('whenEmployeeJoins') },
            { value: 'role_match', label: t('whenRoleIs') },
            { value: 'compliance_due', label: t('whenComplianceDue') },
          ]} />
          <Input label="Condition Value" value={ruleForm.condition_value} onChange={(e) => setRuleForm({ ...ruleForm, condition_value: e.target.value })} placeholder="e.g. dept-1,dept-2 or Manager,Director" />
          <Select label={t('ruleAction')} value={ruleForm.action_type} onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })} options={[
            { value: 'enroll_course', label: t('enrollInCourse') },
            { value: 'enroll_path', label: t('enrollInPath') },
          ]} />
          <Select label="Target" value={ruleForm.action_target_id} onChange={(e) => {
            const target = ruleForm.action_type === 'enroll_course'
              ? courses.find(c => c.id === e.target.value)
              : learningPaths.find(p => p.id === e.target.value)
            setRuleForm({ ...ruleForm, action_target_id: e.target.value, action_target_name: (target as any)?.title || '' })
          }} options={[
            { value: '', label: '-- Select --' },
            ...(ruleForm.action_type === 'enroll_course'
              ? courses.map(c => ({ value: c.id, label: c.title }))
              : learningPaths.map(p => ({ value: p.id, label: p.title }))),
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRuleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitRule}>{t('createRule')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Learning Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title={t('assignLearning')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })} options={[
            { value: '', label: t('selectEmployeePlaceholder') },
            ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' })),
          ]} />
          <Select label={t('courseTitle')} value={assignForm.course_id} onChange={(e) => setAssignForm({ ...assignForm, course_id: e.target.value })} options={[
            { value: '', label: t('selectCoursePlaceholder') },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <Textarea label="Reason" value={assignForm.reason} onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })} rows={2} placeholder="Why is this learning assigned?" />
          <Input label="Due Date" type="date" value={assignForm.due_date} onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAssignment}>{t('assignLearning')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirm.show} onClose={() => setDeleteConfirm({ show: false, type: '', id: '', name: '' })} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-sm text-t2">
            Are you sure you want to delete this {deleteConfirm.type}?
          </p>
          <p className="text-xs text-t3 bg-canvas rounded-lg p-3 border border-divider truncate">
            {deleteConfirm.name}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm({ show: false, type: '', id: '', name: '' })}>{tc('cancel')}</Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={executeDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Course Detail Modal */}
      <Modal open={!!courseDetailId} onClose={() => setCourseDetailId(null)} title={courseDetail?.title || 'Course Details'} size="lg">
        {courseDetail && (() => {
          const detailBlocks = courseBlocks.filter((b: any) => b.course_id === courseDetail.id && b.status === 'published')
          const detailModules = new Map<number, any[]>()
          detailBlocks.forEach((b: any) => {
            if (!detailModules.has(b.module_index)) detailModules.set(b.module_index, [])
            detailModules.get(b.module_index)!.push(b)
          })
          const moduleList = [...detailModules.entries()].sort((a, b) => a[0] - b[0])
          const totalMinutes = detailBlocks.reduce((s: number, b: any) => s + (b.duration_minutes || 0), 0)
          const myEnrollment = enrollments.find((e: any) => e.course_id === courseDetail.id && e.employee_id === currentEmployeeId)
          const { rating, reviews: reviewCount } = getCourseRating(courseDetail.id)
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={courseDetail.is_mandatory ? 'error' : 'default'}>{courseDetail.is_mandatory ? 'Mandatory' : courseDetail.category}</Badge>
                <Badge>{courseDetail.level}</Badge>
                <Badge variant="info">{courseDetail.format}</Badge>
              </div>
              <p className="text-sm text-t2">{courseDetail.description}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-bg2 rounded-lg">
                  <Clock size={16} className="mx-auto text-t3 mb-1" />
                  <p className="text-sm font-semibold text-t1">{courseDetail.duration_hours}h</p>
                  <p className="text-[0.6rem] text-t3">Duration</p>
                </div>
                <div className="text-center p-3 bg-bg2 rounded-lg">
                  <BookOpen size={16} className="mx-auto text-t3 mb-1" />
                  <p className="text-sm font-semibold text-t1">{detailBlocks.length}</p>
                  <p className="text-[0.6rem] text-t3">Lessons</p>
                </div>
                <div className="text-center p-3 bg-bg2 rounded-lg">
                  <Star size={16} className="mx-auto text-yellow-400 mb-1" />
                  <p className="text-sm font-semibold text-t1">{rating.toFixed(1)}</p>
                  <p className="text-[0.6rem] text-t3">{reviewCount} reviews</p>
                </div>
              </div>
              {moduleList.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-t1 mb-3">Course Content</h4>
                  <div className="space-y-2">
                    {moduleList.map(([moduleIdx, blocks]) => (
                      <div key={moduleIdx} className="border border-divider rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-bg2 text-xs font-medium text-t1">Module {moduleIdx + 1} · {blocks.length} lessons · {blocks.reduce((s: number, b: any) => s + (b.duration_minutes || 0), 0)} min</div>
                        <div className="divide-y divide-divider">
                          {blocks.sort((a: any, b: any) => a.order - b.order).map((block: any) => (
                            <div key={block.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                              {block.type === 'video' ? <Video size={12} className="text-blue-500" /> :
                               block.type === 'quiz' ? <HelpCircle size={12} className="text-purple-500" /> :
                               block.type === 'interactive' ? <Zap size={12} className="text-green-500" /> :
                               block.type === 'download' ? <Download size={12} className="text-orange-500" /> :
                               <FileText size={12} className="text-t3" />}
                              <span className="text-t2 flex-1">{block.title}</span>
                              <span className="text-t3">{block.duration_minutes}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[0.6rem] text-t3 mt-2">Total: {totalMinutes} minutes across {moduleList.length} modules</p>
                </div>
              )}
              <div className="flex items-center gap-3 pt-3 border-t border-divider">
                {myEnrollment?.status === 'completed' ? (
                  <Button variant="primary" className="flex-1" onClick={() => { setCourseDetailId(null); handleViewCertificate(myEnrollment.id) }}>
                    <Medal size={14} /> View Certificate
                  </Button>
                ) : myEnrollment ? (
                  <Button variant="primary" className="flex-1" onClick={() => { setCourseDetailId(null); openPlayer(myEnrollment.id, courseDetail.id) }}>
                    <Play size={14} /> {myEnrollment.status === 'in_progress' ? 'Continue Learning' : 'Start Course'}
                  </Button>
                ) : (
                  <Button variant="primary" className="flex-1" onClick={() => { handleEnroll(courseDetail.id); setCourseDetailId(null) }}>
                    <Plus size={14} /> Enroll Now
                  </Button>
                )}
                <Button variant="outline" onClick={() => setCourseDetailId(null)}>Close</Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Course Player */}
      {playerEnrollmentId && playerCourseId && (
        <CoursePlayer
          courseId={playerCourseId}
          enrollmentId={playerEnrollmentId}
          onClose={() => {
            setPlayerEnrollmentId(null)
            setPlayerCourseId(null)
            // Show certificate modal if one was just generated
            if (certificateCourse) setShowCertificateModal(true)
          }}
          onCourseCompleted={handleCourseCompleted}
          onQuizPassed={handleQuizPassed}
        />
      )}
    </>
  )
}
