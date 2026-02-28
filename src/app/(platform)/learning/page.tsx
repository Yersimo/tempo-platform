'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { GraduationCap, BookOpen, Award, Plus, Clock, Sparkles, Radio, Route, Video, Zap, Users as UsersIcon, FileText, CheckCircle, MessageSquare, Trophy, Heart, Hash, Download, Play, HelpCircle, AlignLeft, ListChecks, PenTool, Search, Star, Shield, Lock, ArrowRight, Filter, Medal, Upload, BarChart3, Settings, Target, TrendingUp, AlertTriangle, Brain, Eye, UserCheck, Briefcase, ChevronRight, CalendarClock, ShieldCheck, Activity, Layers } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIScoreBadge, AIPulse } from '@/components/ai'
import { analyzeSkillGaps, predictCourseCompletion, generateCourseOutline, suggestLearningPathOrder, generateQuizQuestions } from '@/lib/ai-engine'
import { aiBuilderTemplates } from '@/lib/demo-data'
import { cn } from '@/lib/utils/cn'

export default function LearningPage() {
  const { courses, enrollments, learningPaths, liveSessions, courseBlocks, quizQuestions, discussions, studyGroups, complianceTraining, autoEnrollRules, assessmentAttempts, learningAssignments, employees, departments, reviews, goals, addCourse, addEnrollment, updateEnrollment, addLearningPath, addLiveSession, addCourseBlock, updateCourseBlock, deleteCourseBlock, addQuizQuestion, updateQuizQuestion, deleteQuizQuestion, addDiscussion, updateDiscussion, addStudyGroup, updateStudyGroup, addComplianceTraining, updateComplianceTraining, addAutoEnrollRule, updateAutoEnrollRule, deleteAutoEnrollRule, addAssessmentAttempt, updateAssessmentAttempt, addLearningAssignment, updateLearningAssignment, getEmployeeName, currentEmployeeId, addToast } = useTempo()
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
  const [enrollForm, setEnrollForm] = useState({
    employee_id: '',
    course_id: '',
  })

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

  // Admin state
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState({ name: '', condition_type: 'department_join' as string, condition_value: '', action_type: 'enroll_course' as string, action_target_id: '', action_target_name: '', is_active: true })

  // Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ employee_id: '', course_id: '', reason: '', due_date: '' })

  // Compliance policy upload
  const [compliancePolicyState, setCompliancePolicyState] = useState<'idle' | 'parsing' | 'done'>('idle')

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
  ]

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

  function submitEnrollment() {
    if (!enrollForm.employee_id || !enrollForm.course_id) return
    addEnrollment({ employee_id: enrollForm.employee_id, course_id: enrollForm.course_id, status: 'enrolled', progress: 0 })
    setShowEnrollModal(false)
    setEnrollForm({ employee_id: '', course_id: '' })
  }

  function handleEnroll(courseId: string) {
    addEnrollment({ employee_id: currentEmployeeId, course_id: courseId, status: 'enrolled', progress: 0 })
  }

  function handleStartEnrollment(enrollmentId: string) {
    updateEnrollment(enrollmentId, { status: 'in_progress', progress: 10 })
  }

  function handleCompleteEnrollment(enrollmentId: string) {
    updateEnrollment(enrollmentId, { status: 'completed', progress: 100, completed_at: new Date().toISOString() })
  }

  function handleGenerateOutline() {
    if (!builderForm.topic) return
    const outline = generateCourseOutline(builderForm.topic, builderForm.level, builderForm.duration)
    setGeneratedOutline(outline)
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
                        <Button size="sm" variant="primary" onClick={() => handleCompleteEnrollment(enr.id)}>{t('resumeLearning')}</Button>
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
              const hasPrerequisites = course.level === 'advanced' || course.level === 'intermediate'
              return (
                <Card key={course.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={course.is_mandatory ? 'error' : 'default'}>{course.is_mandatory ? t('mandatory') : course.category}</Badge>
                      {hasPrerequisites && (
                        <span title={t('prerequisitesRequired')} className="text-amber-500"><Lock size={12} /></span>
                      )}
                    </div>
                    <Badge>{course.level}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-t1 mb-1">{course.title}</h3>
                  <p className="text-xs text-t3 mb-2 line-clamp-2">{course.description}</p>

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
                    ) : enrolled ? (
                      <Badge variant="success">{tc('enrolled')}</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEnroll(course.id)}>{t('enroll')}</Button>
                    )}
                  </div>

                  {/* SCORM/xAPI + Adaptive Learning indicators */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-divider">
                    {course.format === 'online' && (
                      <div className="flex items-center gap-1">
                        <Shield size={10} className="text-gray-400" />
                        <span className="text-[0.55rem] text-t3">{t('scormCompatible')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Brain size={10} className="text-tempo-500" />
                      <span className="text-[0.55rem] text-tempo-600">{t('adaptiveDifficulty')}</span>
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
                      <Button size="sm" variant="primary" onClick={() => handleStartEnrollment(enr.id)}>{tc('start')}</Button>
                    )}
                    {enr.status === 'in_progress' && (
                      <Button size="sm" variant="primary" onClick={() => handleCompleteEnrollment(enr.id)}>{tc('complete')}</Button>
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
                  <Button size="sm" onClick={() => setShowBlockModal(true)}><Plus size={14} /> {t('addBlock')}</Button>
                </div>
              )}
            </div>

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

      {/* Enroll Employee Modal */}
      <Modal open={showEnrollModal} onClose={() => setShowEnrollModal(false)} title={t('enrollModal')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={enrollForm.employee_id} onChange={(e) => setEnrollForm({ ...enrollForm, employee_id: e.target.value })} options={[
            { value: '', label: t('selectEmployeePlaceholder') },
            ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' })),
          ]} />
          <Select label={t('courseTitle')} value={enrollForm.course_id} onChange={(e) => setEnrollForm({ ...enrollForm, course_id: e.target.value })} options={[
            { value: '', label: t('selectCoursePlaceholder') },
            ...courses.map(c => ({ value: c.id, label: c.title })),
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEnrollment}>{t('enrollButton')}</Button>
          </div>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowBuilderModal(false)}>{tc('cancel')}</Button>
                <Button onClick={handleGenerateOutline}><Sparkles size={14} /> {t('generateOutline')}</Button>
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
            <div className="border-2 border-tempo-200 rounded-xl p-8 bg-gradient-to-br from-white to-tempo-50/30 text-center relative overflow-hidden">
              {/* Decorative elements */}
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
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <Shield size={12} className="text-gray-400" />
                  <span className="text-[0.6rem] text-gray-500 font-medium">{t('verifiedCertificate')}</span>
                </div>
              </div>
            </div>

            <div className="bg-canvas rounded-lg p-3 flex items-center gap-3">
              <Sparkles size={14} className="text-tempo-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-t1">{t('adaptiveLearning')}</p>
                <p className="text-[0.6rem] text-t3">{t('adaptiveLearningDesc')}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCertificateModal(false)}>{tc('close')}</Button>
              <Button onClick={() => {
                // Print certificate
                const printWindow = window.open('', '_blank')
                if (printWindow) {
                  printWindow.document.write(`<html><head><title>Certificate - ${certificateCourse.title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff}div{text-align:center;padding:60px;border:3px solid #ea580c;border-radius:16px;max-width:600px}h1{color:#ea580c;font-size:14px;letter-spacing:3px;text-transform:uppercase}h2{font-size:24px;margin:8px 0}h3{font-size:20px;color:#333}p{color:#666;font-size:13px}hr{border:none;height:2px;background:#ea580c;width:60px;margin:20px auto}</style></head><body><div><h1>Certificate of Completion</h1><h2>${certificateCourse.title}</h2><hr/><p>Awarded to</p><h3>${certificateCourse.employeeName}</h3><p>Completed on ${new Date(certificateCourse.completedAt).toLocaleDateString()}</p><p style="margin-top:30px;font-size:11px;color:#999">Verified by Tempo Platform</p></div></body></html>`)
                  printWindow.document.close()
                  printWindow.print()
                }
              }}>
                <Download size={14} /> {t('printCertificate')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
    </>
  )
}
