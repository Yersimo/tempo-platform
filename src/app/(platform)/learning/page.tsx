'use client'

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { GraduationCap, BookOpen, Award, Plus, Clock, Sparkles, Radio, Route, Video, Zap, Users as UsersIcon, FileText, CheckCircle, MessageSquare, Trophy, Heart, Hash, Download, Play, HelpCircle, AlignLeft, ListChecks, PenTool, Search, Star, Shield, Lock, ArrowRight, Filter, Medal, Upload, BarChart3, Settings, Target, TrendingUp, AlertTriangle, Brain, Eye, UserCheck, Briefcase, ChevronRight, CalendarClock, ShieldCheck, Activity, Layers, Globe, Building2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIScoreBadge, AIPulse } from '@/components/ai'
import { analyzeSkillGaps, predictCourseCompletion, generateCourseOutline, suggestLearningPathOrder, generateQuizQuestions, translateContent } from '@/lib/ai-engine'
import { aiBuilderTemplates } from '@/lib/demo-data'
import { cn } from '@/lib/utils/cn'
import { CoursePlayer } from '@/components/learning/course-player'
import { CertificateDesigner, CertificatePreview } from '@/components/learning/certificate-designer'
import { ContentProviders } from '@/components/learning/content-providers'
import { ScormPlayer } from '@/components/learning/scorm-player'

export default function LearningPage() {
  const { courses, enrollments, learningPaths, liveSessions, courseBlocks, quizQuestions, discussions, studyGroups, complianceTraining, autoEnrollRules, assessmentAttempts, learningAssignments, coursePrerequisites, scormPackages, scormTracking, contentLibrary, learnerBadges, learnerPoints, certificateTemplates, employees, departments, reviews, goals, addCourse, addEnrollment, updateEnrollment, addLearningPath, addLiveSession, addCourseBlock, updateCourseBlock, deleteCourseBlock, addQuizQuestion, updateQuizQuestion, deleteQuizQuestion, addDiscussion, updateDiscussion, addStudyGroup, updateStudyGroup, addComplianceTraining, updateComplianceTraining, addAutoEnrollRule, updateAutoEnrollRule, deleteAutoEnrollRule, addAssessmentAttempt, updateAssessmentAttempt, addLearningAssignment, updateLearningAssignment, addCoursePrerequisite, deleteCoursePrerequisite, addScormPackage, updateScormPackage, addContentLibraryItem, addLearnerBadge, addLearnerPoints, addCertificateTemplate, updateCertificateTemplate, getEmployeeName, getDepartmentName, currentEmployeeId, currentUser, addToast, ensureModulesLoaded, complianceRequirements, addComplianceRequirement, deleteComplianceRequirement } = useTempo()

  useEffect(() => { ensureModulesLoaded?.(['courses', 'enrollments', 'complianceRequirements']) }, [ensureModulesLoaded])

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

  // Document upload state
  const [docUploadState, setDocUploadState] = useState<'idle' | 'parsing' | 'done'>('idle')
  const [docParsingProgress, setDocParsingProgress] = useState(0)
  const [docParsingStage, setDocParsingStage] = useState('')
  const [parsedDocCourse, setParsedDocCourse] = useState<{ title: string; modules: Array<{ title: string; lessons: string[]; duration_minutes: number }>; questions: number; description: string } | null>(null)

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

  function submitCourse() {
    if (!courseForm.title) return
    addCourse(courseForm)
    setShowCourseModal(false)
    setCourseForm({ title: '', description: '', category: 'Leadership', duration_hours: 8, format: 'online', level: 'beginner', is_mandatory: false })
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
    if (!selectedCourseId || newEnrollees.length === 0) return
    newEnrollees.forEach(emp => {
      addEnrollment({ employee_id: emp.id, course_id: selectedCourseId, status: 'enrolled', progress: 0 })
    })
    const courseName = courses.find(c => c.id === selectedCourseId)?.title || ''
    addToast(t('massEnrollSuccess', { count: newEnrollees.length, course: courseName }))
    resetEnrollModal()
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
    addCourse({
      title: generatedOutline.title,
      description: generatedOutline.description,
      category: 'AI Generated',
      duration_hours: generatedOutline.total_duration_hours,
      format: 'online',
      level: generatedOutline.level,
      is_mandatory: false,
    })
    setShowBuilderModal(false)
    setGeneratedOutline(null)
    setBuilderForm({ topic: '', level: 'beginner', duration: 8 })
  }

  function submitSession() {
    if (!sessionForm.title || !sessionForm.instructor) return
    addLiveSession({
      ...sessionForm,
      enrolled_count: 0,
      status: 'upcoming',
    })
    setShowSessionModal(false)
    setSessionForm({ title: '', course_id: '', instructor: '', scheduled_at: '', duration_minutes: 60, type: 'webinar', capacity: 50, meeting_url: '' })
  }

  function submitPath() {
    if (!pathForm.title || pathForm.course_ids.length === 0) return
    const selectedCourses = courses.filter(c => pathForm.course_ids.includes(c.id))
    addLearningPath({
      ...pathForm,
      estimated_hours: selectedCourses.reduce((a, c) => a + c.duration_hours, 0),
    })
    setShowPathModal(false)
    setPathForm({ title: '', description: '', course_ids: [], level: 'beginner' })
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
    if (!blockForm.title || !selectedBuilderCourse) return
    addCourseBlock({ ...blockForm, course_id: selectedBuilderCourse })
    setShowBlockModal(false)
    setBlockForm({ type: 'text', title: '', content: '', duration_minutes: 10, module_index: 0, order: 0, status: 'draft' })
  }

  // Quiz Builder handlers
  function submitQuestion() {
    if (!questionForm.question) return
    addQuizQuestion({ ...questionForm, course_id: selectedQuizCourse || questionForm.course_id })
    setShowQuestionModal(false)
    setQuestionForm({ type: 'multiple_choice', question: '', options: ['', '', '', ''], correct_answer: '', points: 10, explanation: '', course_id: '' })
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

  // Block type icon helper
  const blockTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <AlignLeft size={14} />
      case 'video': return <Play size={14} />
      case 'quiz': return <HelpCircle size={14} />
      case 'interactive': return <ListChecks size={14} />
      case 'download': return <Download size={14} />
      default: return <FileText size={14} />
    }
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
  function simulateDocumentParsing(filename: string) {
    setDocUploadState('parsing')
    setDocParsingProgress(0)
    const stages = [
      { progress: 15, stage: t('extractingContent') },
      { progress: 35, stage: t('identifyingTopics') },
      { progress: 60, stage: t('generatingModules') },
      { progress: 80, stage: t('creatingAssessments') },
      { progress: 95, stage: t('finalizingCourse') },
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < stages.length) {
        setDocParsingProgress(stages[i].progress)
        setDocParsingStage(stages[i].stage)
        i++
      } else {
        clearInterval(interval)
        setDocParsingProgress(100)
        setDocUploadState('done')
        const title = filename.replace(/\.(pdf|docx|pptx)$/i, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        setParsedDocCourse({
          title: `${title} - Complete Training`,
          description: `Auto-generated course from ${filename}. Covers all key topics with assessments.`,
          modules: [
            { title: 'Introduction & Overview', lessons: ['Course objectives', 'Key terminology', 'Industry context'], duration_minutes: 30 },
            { title: 'Core Concepts', lessons: ['Fundamental principles', 'Best practices', 'Case studies', 'Common pitfalls'], duration_minutes: 45 },
            { title: 'Advanced Topics', lessons: ['Advanced techniques', 'Real-world applications', 'Expert insights'], duration_minutes: 40 },
            { title: 'Practical Exercises', lessons: ['Hands-on workshop', 'Group activity', 'Individual assessment'], duration_minutes: 35 },
            { title: 'Assessment & Certification', lessons: ['Knowledge check', 'Final assessment', 'Certificate issuance'], duration_minutes: 20 },
          ],
          questions: 15,
        })
      }
    }, 800)
  }

  function handleDocFileSelect() {
    simulateDocumentParsing('Company_Expense_Policy_2026.pdf')
  }

  function handleSaveDocCourse() {
    if (!parsedDocCourse) return
    addCourse({
      title: parsedDocCourse.title,
      description: parsedDocCourse.description,
      category: 'AI Generated',
      duration_hours: Math.ceil(parsedDocCourse.modules.reduce((a, m) => a + m.duration_minutes, 0) / 60),
      format: 'online',
      level: 'intermediate',
      is_mandatory: false,
    })
    addToast('Course created from document')
    setDocUploadState('idle')
    setParsedDocCourse(null)
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
                className="w-full pl-9 pr-4 py-2 text-xs bg-canvas border border-divider rounded-lg focus:outline-none focus:border-tempo-400 focus:ring-1 focus:ring-tempo-400"
              />
            </div>
            <select value={catalogCategory} onChange={(e) => setCatalogCategory(e.target.value)}
              className="text-xs bg-canvas border border-divider rounded-lg px-3 py-2 focus:outline-none focus:border-tempo-400">
              <option value="all">{t('allCategories')}</option>
              {catalogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={catalogLevel} onChange={(e) => setCatalogLevel(e.target.value)}
              className="text-xs bg-canvas border border-divider rounded-lg px-3 py-2 focus:outline-none focus:border-tempo-400">
              <option value="all">{t('allLevels')}</option>
              <option value="beginner">{t('levelBeginner')}</option>
              <option value="intermediate">{t('levelIntermediate')}</option>
              <option value="advanced">{t('levelAdvanced')}</option>
            </select>
            <select value={catalogFormat} onChange={(e) => setCatalogFormat(e.target.value)}
              className="text-xs bg-canvas border border-divider rounded-lg px-3 py-2 focus:outline-none focus:border-tempo-400">
              <option value="all">{t('allFormats')}</option>
              <option value="online">{t('formatOnline')}</option>
              <option value="classroom">{t('formatClassroom')}</option>
              <option value="blended">{t('formatBlended')}</option>
            </select>
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
                  <h3 className="text-sm font-semibold text-t1 mb-1">{course.title}</h3>
                  <p className="text-xs text-t3 mb-2 line-clamp-2">{course.description}</p>

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

          {filteredCatalog.length === 0 && (
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
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noEnrollments')}</div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label={t('complianceRate')} value={`${complianceStats.complianceRate}%`} icon={<ShieldCheck size={20} />} />
            <StatCard label={t('mandatoryCourses')} value={complianceStats.mandatoryCount} icon={<Shield size={20} />} />
            <StatCard label={t('overdueTrainings')} value={complianceStats.overdueCount} change={complianceStats.overdueCount > 0 ? 'Action required' : 'All clear'} changeType={complianceStats.overdueCount > 0 ? 'negative' : 'positive'} />
            <StatCard label={t('upcomingDue')} value={complianceStats.upcomingCount} change="Next 30 days" changeType="neutral" />
          </div>

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
                        <button key={i} onClick={() => setActiveAssessment(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQ.id]: opt } } : null)}
                          className={cn('w-full text-left p-3 rounded-lg border text-sm transition-colors',
                            activeAssessment.answers[currentQ.id] === opt
                              ? 'border-tempo-500 bg-tempo-50 text-tempo-700'
                              : 'border-divider hover:border-tempo-300')}>
                          {opt}
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
              <button onClick={handleDocFileSelect}
                className="w-full border-2 border-dashed border-divider rounded-xl p-8 text-center hover:border-tempo-400 hover:bg-tempo-50/30 transition-all group">
                <Upload size={28} className="mx-auto text-t3 group-hover:text-tempo-600 mb-2" />
                <p className="text-sm font-medium text-t2 group-hover:text-tempo-600">{t('dropPdfHere')}</p>
                <p className="text-xs text-t3 mt-1">{t('pdfHint')}</p>
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
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-tempo-600" />
                    <h4 className="text-sm font-semibold text-t1">{parsedDocCourse.title}</h4>
                    <Badge variant="success">{t('documentParsed')}</Badge>
                  </div>
                  <p className="text-xs text-t3 mb-3">{parsedDocCourse.description}</p>
                  <div className="flex items-center gap-4 text-xs text-t3 mb-3">
                    <span>{t('moduleCount', { count: parsedDocCourse.modules.length })}</span>
                    <span>{t('questionCount', { count: parsedDocCourse.questions })}</span>
                  </div>
                  <div className="space-y-2">
                    {parsedDocCourse.modules.map((mod, i) => (
                      <div key={i} className="bg-surface rounded-lg p-3">
                        <p className="text-xs font-medium text-t1 mb-1">{mod.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {mod.lessons.map((lesson, j) => (
                            <span key={j} className="text-[0.6rem] bg-canvas px-2 py-0.5 rounded text-t3">{lesson}</span>
                          ))}
                        </div>
                        <p className="text-[0.6rem] text-t3 mt-1">{mod.duration_minutes} min</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => { setDocUploadState('idle'); setParsedDocCourse(null) }}>{tc('cancel')}</Button>
                  <Button onClick={handleSaveDocCourse}><Sparkles size={14} /> {t('applyGeneratedCourse')}</Button>
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
            <Card><div className="text-center py-8 text-sm text-t3">{t('noEnrollments')}</div></Card>
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
            <Card><div className="text-center py-8 text-sm text-t3">{t('noEnrollments')}</div></Card>
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
                    <button onClick={() => deleteAutoEnrollRule(rule.id)}
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

      {/* Course Builder Tab */}
      {activeTab === 'course-builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Course Outline Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('courseOutlineSidebar')}</h3>
              <div className="space-y-2">
                {courses.map(course => {
                  const blocks = courseBlocks.filter(b => b.course_id === course.id)
                  const isSelected = selectedBuilderCourse === course.id
                  return (
                    <button key={course.id} onClick={() => setSelectedBuilderCourse(course.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${isSelected ? 'bg-tempo-50 border border-tempo-200' : 'hover:bg-canvas'}`}>
                      <p className="font-medium text-t1">{course.title}</p>
                      <p className="text-t3 mt-0.5">{t('blocksCount', { count: blocks.length })} - {course.duration_hours}h</p>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Content Blocks */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('courseBuilder')}</h3>
                <p className="text-xs text-t3">{t('courseBuilderDesc')}</p>
                {/* Collaborative authoring indicator */}
                {selectedBuilderCourse && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-green-400 border-2 border-surface" />
                      <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-surface" />
                    </div>
                    <span className="text-[0.6rem] text-green-600 flex items-center gap-1"><Eye size={10} /> {t('liveEditing')} · {t('currentEditors')}: 2</span>
                  </div>
                )}
              </div>
              {selectedBuilderCourse && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAiWritingOpen(!aiWritingOpen)}>
                    <Brain size={14} /> AI Assistant
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const outline = generateCourseOutline(courses.find(c => c.id === selectedBuilderCourse)?.title || 'Course', 'intermediate', 8)
                    outline.modules.forEach((mod, mi) => {
                      mod.lessons.forEach((lesson, li) => {
                        addCourseBlock({ course_id: selectedBuilderCourse, module_index: mi, order: li, type: 'text', title: lesson, content: `Content for ${lesson}`, duration_minutes: mod.duration_minutes / mod.lessons.length, status: 'draft' })
                      })
                    })
                  }}>
                    <Sparkles size={14} /> {t('aiGenerateContent')}
                  </Button>
                  <div className="relative group/bulk-translate">
                    <Button size="sm" variant="outline"><Globe size={14} /> Translate All</Button>
                    <div className="absolute right-0 top-full mt-1 bg-surface border border-divider rounded-lg shadow-lg p-2 hidden group-hover/bulk-translate:block z-20 w-36 max-h-48 overflow-y-auto">
                      {['French', 'Spanish', 'Portuguese', 'Arabic', 'Swahili', 'German', 'Chinese', 'Japanese', 'Hindi'].map(lang => (
                        <button key={lang} onClick={() => {
                          const blocks = courseBlocks.filter(b => b.course_id === selectedBuilderCourse)
                          blocks.forEach((block, i) => {
                            setTimeout(() => handleTranslateBlock(block.id, lang), i * 300)
                          })
                        }} className="w-full text-left text-[0.6rem] px-2 py-1.5 rounded hover:bg-canvas text-t2 hover:text-t1 transition-colors">{lang}</button>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setShowBlockModal(true)}><Plus size={14} /> {t('addBlock')}</Button>
                </div>
              )}
            </div>

            {/* Sana-inspired AI Writing Assistant Panel */}
            {aiWritingOpen && (
              <Card className="border-tempo-200 bg-tempo-50/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-tempo-600" />
                    <h4 className="text-sm font-semibold text-t1">AI Writing Assistant</h4>
                    <Badge variant="ai">Claude</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setAiWritingOpen(false); setAiWritingResult('') }}>×</Button>
                </div>
                <Textarea value={aiWritingText} onChange={(e) => setAiWritingText(e.target.value)} placeholder="Paste or type content here for AI assistance..." rows={4} className="mb-3" />
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { action: 'continue', label: 'Continue writing', icon: <PenTool size={12} /> },
                    { action: 'shorten', label: 'Shorten', icon: <AlignLeft size={12} /> },
                    { action: 'rephrase', label: 'Rephrase', icon: <Zap size={12} /> },
                    { action: 'simplify', label: 'Simplify', icon: <BookOpen size={12} /> },
                    { action: 'add_examples', label: 'Add examples', icon: <ListChecks size={12} /> },
                    { action: 'generate_quiz', label: 'Generate quiz', icon: <HelpCircle size={12} /> },
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
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-tempo-600" />
                      <span className="text-[0.6rem] text-tempo-600 font-medium uppercase">AI Result</span>
                    </div>
                    <p className="text-xs text-t1 whitespace-pre-wrap">{aiWritingResult}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="primary" onClick={() => { setAiWritingText(aiWritingResult); setAiWritingResult('') }}>Use this</Button>
                      <Button size="sm" variant="outline" onClick={() => setAiWritingResult('')}>Discard</Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {!selectedBuilderCourse ? (
              <Card><div className="text-center py-12 text-sm text-t3">{t('noCourseSelected')}</div></Card>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const modules = [...new Set(filteredBlocks.map(b => b.module_index))].sort((a, b) => a - b)
                  return modules.map(mi => (
                    <Card key={mi}>
                      <h4 className="text-xs font-semibold text-t1 mb-3">{t('moduleN', { n: mi + 1 })}</h4>
                      <div className="space-y-2">
                        {filteredBlocks.filter(b => b.module_index === mi).map(block => (
                          <div key={block.id} className="flex items-center gap-3 p-2 rounded-lg bg-canvas group">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-t3">
                              {blockTypeIcon(block.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-t1">{block.title}</p>
                              <p className="text-[0.6rem] text-t3">{block.type} - {block.duration_minutes} {t('minutes')}</p>
                            </div>
                            <Badge variant={block.status === 'published' ? 'success' : 'default'}>{block.status === 'published' ? t('statusPublished') : t('statusDraft')}</Badge>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="outline" onClick={() => { setAiWritingText(block.content || block.title); setAiWritingOpen(true) }}><Sparkles size={10} /> AI</Button>
                              <div className="relative group/translate">
                                <Button size="sm" variant="outline" disabled={translatingBlock === block.id}>
                                  {translatingBlock === block.id ? <><AIPulse size="sm" /> Translating...</> : <><Globe size={10} /> Translate</>}
                                </Button>
                                <div className="absolute right-0 top-full mt-1 bg-surface border border-divider rounded-lg shadow-lg p-2 hidden group-hover/translate:block z-20 w-36 max-h-48 overflow-y-auto">
                                  {['French', 'Spanish', 'Portuguese', 'Arabic', 'Swahili', 'German', 'Chinese', 'Japanese', 'Hindi', 'Yoruba', 'Hausa', 'Igbo'].map(lang => (
                                    <button key={lang} onClick={() => handleTranslateBlock(block.id, lang)} className="w-full text-left text-[0.6rem] px-2 py-1.5 rounded hover:bg-canvas text-t2 hover:text-t1 transition-colors">{lang}</button>
                                  ))}
                                </div>
                              </div>
                              {block.status === 'draft' && (
                                <Button size="sm" variant="outline" onClick={() => updateCourseBlock(block.id, { status: 'published' })}>{t('publishBlock')}</Button>
                              )}
                              <Button size="sm" variant="secondary" onClick={() => deleteCourseBlock(block.id)}>×</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                })()}
                {filteredBlocks.length === 0 && (
                  <Card><div className="text-center py-8 text-sm text-t3">{t('selectCourseToEdit')}</div></Card>
                )}

                {/* SCORM Packages Section */}
                {selectedBuilderCourse && (
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-t1 flex items-center gap-2"><Layers size={14} className="text-tempo-400" /> SCORM Packages</h4>
                      <Button size="sm" variant="outline" onClick={() => { setScormUploadCourse(selectedBuilderCourse); setShowScormUploadModal(true) }}><Upload size={12} /> Upload SCORM</Button>
                    </div>
                    {scormPackages.filter(p => p.course_id === selectedBuilderCourse).length > 0 ? (
                      <div className="space-y-2">
                        {scormPackages.filter(p => p.course_id === selectedBuilderCourse).map(pkg => {
                          const tracking = scormTracking.filter(t => t.package_id === pkg.id)
                          return (
                            <div key={pkg.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                              <div className="w-9 h-9 rounded-lg bg-tempo-500/10 flex items-center justify-center"><Layers size={16} className="text-tempo-400" /></div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-t1">{(pkg.metadata as any)?.title || 'SCORM Package'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="info" className="text-[0.5rem]">{pkg.version === 'scorm_1_2' ? 'SCORM 1.2' : pkg.version === 'scorm_2004' ? 'SCORM 2004' : 'xAPI'}</Badge>
                                  <span className="text-[0.55rem] text-t3">{(pkg.metadata as any)?.duration || 'N/A'}</span>
                                  <span className="text-[0.55rem] text-t3">Mastery: {(pkg.metadata as any)?.mastery_score || 'N/A'}%</span>
                                </div>
                              </div>
                              <Badge variant={pkg.status === 'ready' ? 'success' : pkg.status === 'error' ? 'error' : 'default'}>{pkg.status}</Badge>
                              {pkg.status === 'ready' && (
                                <Button size="sm" variant="primary" onClick={() => handleLaunchScorm(pkg)}>
                                  <Play size={12} /> Launch
                                </Button>
                              )}
                              {tracking.length > 0 && (
                                <div className="text-right">
                                  <p className="text-[0.6rem] text-t3">{tracking.length} tracked</p>
                                  <p className="text-[0.55rem] text-t3">{tracking.filter(t => t.lesson_status === 'completed' || t.lesson_status === 'passed').length} completed</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-t3">
                        <Layers size={24} className="mx-auto mb-2" />
                        <p className="text-xs">No SCORM packages uploaded for this course</p>
                        <p className="text-[0.55rem] mt-1">Upload a SCORM 1.2, 2004, or xAPI package</p>
                      </div>
                    )}
                  </Card>
                )}

                {/* Prerequisites Section */}
                {selectedBuilderCourse && (
                  <Card>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-t1 flex items-center gap-2"><Lock size={14} className="text-amber-400" /> Prerequisites</h4>
                      <Button size="sm" variant="outline" onClick={() => { setPrereqForm({ ...prereqForm, course_id: selectedBuilderCourse }); setShowPrereqModal(true) }}><Plus size={12} /> Add</Button>
                    </div>
                    {(() => {
                      const prereqs = getPrerequisitesForCourse(selectedBuilderCourse)
                      if (prereqs.length === 0) return <p className="text-xs text-t3 text-center py-4">No prerequisites configured</p>
                      return (
                        <div className="space-y-2">
                          {/* Prerequisite Chain Visualization */}
                          <div className="flex items-center gap-2 flex-wrap mb-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                            {prereqs.map((p, i) => (
                              <div key={p.id} className="flex items-center gap-2">
                                <div className={cn('px-2 py-1 rounded text-[0.6rem] font-medium border', p.isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')}>
                                  {p.prerequisiteCourse?.title || 'Unknown'}
                                </div>
                                {i < prereqs.length - 1 && <ArrowRight size={12} className="text-t3" />}
                              </div>
                            ))}
                            <ArrowRight size={12} className="text-t3" />
                            <div className="px-2 py-1 rounded text-[0.6rem] font-medium bg-tempo-500/10 text-tempo-400 border border-tempo-500/20">
                              {courses.find(c => c.id === selectedBuilderCourse)?.title}
                            </div>
                          </div>
                          {prereqs.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', p.isCompleted ? 'bg-green-500/10' : 'bg-amber-500/10')}>
                                {p.isCompleted ? <CheckCircle size={14} className="text-green-400" /> : <Lock size={14} className="text-amber-400" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-t1">{p.prerequisiteCourse?.title || 'Unknown Course'}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant={p.type === 'required' ? 'error' : 'info'} className="text-[0.5rem]">{p.type}</Badge>
                                  {p.minimum_score && <span className="text-[0.55rem] text-t3">Min. score: {p.minimum_score}%</span>}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => deleteCoursePrerequisite(p.id)}>x</Button>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </Card>
                )}

                {/* SCORM Tracking Display (if SCORM packages exist) */}
                {selectedBuilderCourse && scormTracking.filter(t => scormPackages.some(p => p.course_id === selectedBuilderCourse && p.id === t.package_id)).length > 0 && (
                  <Card>
                    <h4 className="text-xs font-semibold text-t1 mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-blue-400" /> SCORM Tracking Data</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-white/10"><th className="text-left py-2 px-2 text-t3 font-medium">Learner</th><th className="text-left py-2 px-2 text-t3 font-medium">Status</th><th className="text-right py-2 px-2 text-t3 font-medium">Score</th><th className="text-right py-2 px-2 text-t3 font-medium">Time</th><th className="text-right py-2 px-2 text-t3 font-medium">Last Access</th></tr></thead>
                        <tbody>
                          {scormTracking.filter(t => scormPackages.some(p => p.course_id === selectedBuilderCourse && p.id === t.package_id)).map(track => {
                            const enrollment = enrollments.find(e => e.id === track.enrollment_id)
                            return (
                              <tr key={track.id} className="border-b border-white/5">
                                <td className="py-2 px-2">{enrollment ? getEmployeeName(enrollment.employee_id) : 'Unknown'}</td>
                                <td className="py-2 px-2"><Badge variant={track.lesson_status === 'completed' || track.lesson_status === 'passed' ? 'success' : track.lesson_status === 'failed' ? 'error' : 'default'} className="text-[0.5rem]">{track.lesson_status}</Badge></td>
                                <td className="py-2 px-2 text-right">{track.score_raw !== null ? `${track.score_raw}/${track.score_max}` : '-'}</td>
                                <td className="py-2 px-2 text-right text-t3">{track.total_time || '-'}</td>
                                <td className="py-2 px-2 text-right text-t3">{new Date(track.last_accessed).toLocaleDateString()}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                            <span key={i} className={`text-[0.6rem] px-2 py-0.5 rounded ${opt === q.correct_answer ? 'bg-green-50 text-green-700 font-medium' : 'text-t3'}`}>
                              {opt.includes(':') ? opt : opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-tempo-600">{q.points} {t('points')}</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => deleteQuizQuestion(q.id)}>×</Button>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Certifications" value={certifications.length} icon={<Award size={20} />} />
            <StatCard label="Valid" value={certifications.filter(c => c.status === 'valid').length} icon={<CheckCircle size={20} />} />
            <StatCard label="Expiring Soon" value={certifications.filter(c => c.status === 'expiring_soon').length} icon={<AlertTriangle size={20} />} />
            <StatCard label="Expired" value={certifications.filter(c => c.status === 'expired').length} icon={<Shield size={20} />} />
          </div>

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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Avg Retention" value={`${spacedRepetitionData.length > 0 ? Math.round(spacedRepetitionData.reduce((a, s) => a + s.retentionScore, 0) / spacedRepetitionData.length) : 0}%`} icon={<Brain size={20} />} />
            <StatCard label="Needs Review" value={spacedRepetitionData.filter(s => s.needsReview).length} icon={<AlertTriangle size={20} />} />
            <StatCard label="Strong Retention" value={spacedRepetitionData.filter(s => s.retentionScore >= 80).length} icon={<TrendingUp size={20} />} />
            <StatCard label="Courses Completed" value={spacedRepetitionData.length} icon={<CheckCircle size={20} />} />
          </div>

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Requests" value={extRequests.length} icon={<Briefcase size={20} />} />
            <StatCard label="Pending" value={extRequests.filter(r => r.status === 'pending' || r.status === 'manager_approved').length} icon={<Clock size={20} />} change="Awaiting approval" changeType="neutral" />
            <StatCard label="Approved" value={extRequests.filter(r => r.status === 'approved').length} icon={<CheckCircle size={20} />} change="Enrolled" changeType="positive" />
            <StatCard label="Total Cost" value={`GHS ${extRequests.filter(r => r.status !== 'rejected').reduce((s, r) => s + (r.cost || 0), 0).toLocaleString()}`} icon={<TrendingUp size={20} />} />
          </div>

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
            <Button onClick={submitCourse}>{t('createCourse')}</Button>
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
                <select className="px-3 py-2 text-xs bg-white border border-divider rounded-lg text-t2 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                  value={enrollCourseCategory} onChange={(e) => setEnrollCourseCategory(e.target.value)}>
                  <option value="all">{t('allCategories')}</option>
                  {courseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select className="px-3 py-2 text-xs bg-white border border-divider rounded-lg text-t2 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
                  value={enrollCourseLevel} onChange={(e) => setEnrollCourseLevel(e.target.value)}>
                  <option value="all">{t('allLevels')}</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
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
                <Button onClick={submitMassEnrollment} disabled={!selectedCourseId || newEnrollees.length === 0}>
                  {t('enrollCount', { count: newEnrollees.length })}
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
            <Button onClick={submitSession}>{t('scheduleSession')}</Button>
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
            <Button onClick={submitPath}>{t('createPath')}</Button>
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
            <Button onClick={submitBlock}>{t('addBlock')}</Button>
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
                    <input type="radio" name="correct" checked={questionForm.correct_answer === opt} onChange={() => setQuestionForm({ ...questionForm, correct_answer: opt })} className="text-tempo-600" />
                    {questionForm.type === 'true_false' ? (
                      <span className="text-xs text-t1">{opt}</span>
                    ) : (
                      <Input value={opt} onChange={(e) => { const opts = [...questionForm.options]; opts[i] = e.target.value; setQuestionForm({ ...questionForm, options: opts }) }} placeholder={`Option ${i + 1}`} />
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
            <Button onClick={submitQuestion}>{t('addQuestion')}</Button>
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
                            <span key={j} className={`text-[0.6rem] px-1.5 py-0.5 rounded ${opt === q.correct_answer ? 'bg-green-50 text-green-700' : 'bg-canvas text-t3'}`}>{opt}</span>
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
