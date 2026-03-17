'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTempo } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'
import {
  BookOpen, Calendar, ClipboardList,
  Award, Play, CheckCircle2, Lock, Clock,
  FileText, Link2, Video, Download, Share2, MessageSquare,
  Pin, ChevronRight, ChevronLeft, Star, Upload, Send,
  Flame, Trophy, Target, Sparkles, ExternalLink
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcademyModule {
  id: string
  number: number
  title: string
  duration: string
  status: 'completed' | 'in_progress' | 'locked'
  progress: number
  score?: number
  timeSpent?: string
  lessons: number
  completedLessons: number
}

interface AcademySession {
  id: string
  title: string
  date: string
  time: string
  type: 'webinar' | 'workshop' | 'mentoring'
  instructor: string
  rsvpd: boolean
  isPast: boolean
  recordingUrl?: string
}

interface AcademyAssignment {
  id: string
  title: string
  dueDate: string
  moduleTitle: string
  status: 'pending' | 'submitted' | 'graded'
  score?: number
  feedback?: string
  maxScore?: number
}

interface DiscussionPost {
  id: string
  author: string
  authorAvatar?: string
  content: string
  timestamp: string
  replyCount: number
  isPinned: boolean
  isFacilitator: boolean
  moduleTag?: string
  replies?: { author: string; content: string; timestamp: string }[]
}

interface AcademyResource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'link' | 'video'
  moduleTitle: string
  url?: string
}

interface AcademyCertificate {
  id: string
  name: string
  dateEarned?: string
  status: 'earned' | 'in_progress'
  requirements: { label: string; met: boolean }[]
}

interface AcademyData {
  name: string
  brandColor: string
  brandColorLight: string
  description: string
  participantName: string
  modules: AcademyModule[]
  sessions: AcademySession[]
  assignments: AcademyAssignment[]
  posts: DiscussionPost[]
  resources: AcademyResource[]
  certificates: AcademyCertificate[]
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_ACADEMIES: Record<string, AcademyData> = {
  'ecobank-sme-2026': {
    name: 'Ecobank SME Academy',
    brandColor: '#00567A',
    brandColorLight: '#E0F2FE',
    description: 'Empowering Small & Medium Enterprises across Africa with essential business skills, financial literacy, and growth strategies.',
    participantName: 'Amara Okonkwo',
    modules: [
      {
        id: 'm1', number: 1, title: 'Business Foundations & Planning',
        duration: '3 hours', status: 'completed', progress: 100, score: 92,
        timeSpent: '3h 12m', lessons: 8, completedLessons: 8,
      },
      {
        id: 'm2', number: 2, title: 'Financial Literacy for SMEs',
        duration: '4 hours', status: 'completed', progress: 100, score: 88,
        timeSpent: '4h 05m', lessons: 10, completedLessons: 10,
      },
      {
        id: 'm3', number: 3, title: 'Digital Marketing & Customer Acquisition',
        duration: '3.5 hours', status: 'in_progress', progress: 60,
        timeSpent: '2h 10m', lessons: 9, completedLessons: 5,
      },
      {
        id: 'm4', number: 4, title: 'Access to Finance & Credit Management',
        duration: '4 hours', status: 'locked', progress: 0,
        lessons: 12, completedLessons: 0,
      },
      {
        id: 'm5', number: 5, title: 'Operations & Supply Chain Optimization',
        duration: '3 hours', status: 'locked', progress: 0,
        lessons: 7, completedLessons: 0,
      },
      {
        id: 'm6', number: 6, title: 'Scaling Your Business & Exit Strategies',
        duration: '3.5 hours', status: 'locked', progress: 0,
        lessons: 8, completedLessons: 0,
      },
    ],
    sessions: [
      {
        id: 's1', title: 'Digital Marketing Masterclass',
        date: '2026-03-20', time: '10:00 AM WAT',
        type: 'webinar', instructor: 'Dr. Ngozi Adeyemi',
        rsvpd: false, isPast: false,
      },
      {
        id: 's2', title: 'Financial Modelling Workshop',
        date: '2026-03-25', time: '2:00 PM WAT',
        type: 'workshop', instructor: 'Mr. Kofi Mensah',
        rsvpd: true, isPast: false,
      },
      {
        id: 's3', title: '1-on-1 Mentoring: Growth Strategy',
        date: '2026-03-28', time: '11:00 AM WAT',
        type: 'mentoring', instructor: 'Ms. Fatima Diallo',
        rsvpd: false, isPast: false,
      },
      {
        id: 's4', title: 'Business Planning Fundamentals',
        date: '2026-03-05', time: '10:00 AM WAT',
        type: 'webinar', instructor: 'Dr. Ngozi Adeyemi',
        rsvpd: true, isPast: true, recordingUrl: '#',
      },
    ],
    assignments: [
      {
        id: 'a1', title: 'Digital Marketing Campaign Plan',
        dueDate: '2026-03-22',
        moduleTitle: 'Digital Marketing & Customer Acquisition',
        status: 'pending',
      },
      {
        id: 'a2', title: 'Cash Flow Analysis Exercise',
        dueDate: '2026-03-10',
        moduleTitle: 'Financial Literacy for SMEs',
        status: 'graded', score: 85, maxScore: 100,
        feedback: 'Excellent analysis of cash flow projections. Consider incorporating seasonal variance in your next iteration. Your expense categorization was thorough and well-organized.',
      },
    ],
    posts: [
      {
        id: 'p1', author: 'Dr. Ngozi Adeyemi', content:
          'Welcome to Week 3! This week we dive into digital marketing strategies tailored for African SMEs. Please complete the pre-reading material before our Thursday webinar. Looking forward to an engaging session!',
        timestamp: '2 hours ago', replyCount: 12, isPinned: true, isFacilitator: true,
        moduleTag: 'Digital Marketing',
      },
      {
        id: 'p2', author: 'Kwame Asante', content:
          'Just finished Module 2 and the financial literacy section on managing working capital was incredibly eye-opening. Anyone else struggling with the cash conversion cycle calculations?',
        timestamp: '5 hours ago', replyCount: 8, isPinned: false, isFacilitator: false,
        moduleTag: 'Financial Literacy',
        replies: [
          { author: 'Zara Ibrahim', content: 'Yes! I found it helpful to draw out the timeline visually. Happy to share my notes.', timestamp: '4 hours ago' },
          { author: 'Amara Okonkwo', content: 'The practice spreadsheet from the resources section really helped me understand it better.', timestamp: '3 hours ago' },
        ],
      },
      {
        id: 'p3', author: 'Fatou Sow', content:
          'Has anyone successfully applied the customer segmentation framework from Module 3 to their business? I run a catering company and I am trying to define my target segments properly.',
        timestamp: '1 day ago', replyCount: 5, isPinned: false, isFacilitator: false,
        moduleTag: 'Digital Marketing',
      },
      {
        id: 'p4', author: 'Emeka Nwosu', content:
          'Pro tip: the Ecobank mobile app has a great SME dashboard feature that aligns perfectly with what we learned in the financial planning module. Worth checking out!',
        timestamp: '2 days ago', replyCount: 15, isPinned: false, isFacilitator: false,
      },
    ],
    resources: [
      {
        id: 'r1', title: 'SME Business Plan Template',
        description: 'Comprehensive template with financial projections, market analysis sections, and executive summary guide.',
        type: 'pdf', moduleTitle: 'Business Foundations & Planning',
      },
      {
        id: 'r2', title: 'Cash Flow Management Toolkit',
        description: 'Interactive spreadsheet for tracking and forecasting your business cash flow over 12 months.',
        type: 'pdf', moduleTitle: 'Financial Literacy for SMEs',
      },
      {
        id: 'r3', title: 'Digital Marketing Playbook for African SMEs',
        description: 'Step-by-step guide covering social media, SEO, and low-cost digital strategies.',
        type: 'pdf', moduleTitle: 'Digital Marketing & Customer Acquisition',
      },
      {
        id: 'r4', title: 'Ecobank SME Finance Portal',
        description: 'Access financing options, credit assessment tools, and loan application resources.',
        type: 'link', moduleTitle: 'Access to Finance & Credit Management',
      },
      {
        id: 'r5', title: 'Customer Acquisition Strategy Workshop Recording',
        description: 'Full recording of the live workshop with Q&A session included.',
        type: 'video', moduleTitle: 'Digital Marketing & Customer Acquisition',
      },
    ],
    certificates: [
      {
        id: 'c1', name: 'Financial Literacy Fundamentals',
        dateEarned: '2026-03-08', status: 'earned',
        requirements: [
          { label: 'Complete Module 2', met: true },
          { label: 'Pass assessment with 80%+', met: true },
          { label: 'Submit Cash Flow Assignment', met: true },
        ],
      },
      {
        id: 'c2', name: 'Ecobank SME Academy Graduate',
        status: 'in_progress',
        requirements: [
          { label: 'Complete all 6 modules', met: false },
          { label: 'Pass all assessments with 70%+', met: false },
          { label: 'Submit all assignments', met: false },
          { label: 'Attend at least 4 live sessions', met: true },
          { label: 'Participate in community discussions', met: true },
        ],
      },
    ],
  },
}

// ─── Helper Components ────────────────────────────────────────────────────────

function CircularProgress({ value, size = 120, strokeWidth = 10, color }: {
  value: number; size?: number; strokeWidth?: number; color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-t1">{value}%</span>
        <span className="text-[0.6rem] text-t3 uppercase tracking-wide">Complete</span>
      </div>
    </div>
  )
}

function CompletionBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-green-600">
      <Sparkles size={14} />
      <span className="text-[0.65rem] font-semibold">Completed!</span>
    </span>
  )
}

function CountdownDisplay({ dateStr }: { dateStr: string }) {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return <span className="text-xs text-t3">Started</span>
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return (
    <span className="text-xs font-medium text-t2">
      {days > 0 ? `${days}d ${hours}h` : `${hours}h`} away
    </span>
  )
}

function SessionTypeBadge({ type }: { type: AcademySession['type'] }) {
  const config = {
    webinar: { label: 'Webinar', variant: 'info' as const },
    workshop: { label: 'Workshop', variant: 'warning' as const },
    mentoring: { label: 'Mentoring', variant: 'success' as const },
  }
  const c = config[type]
  return <Badge variant={c.variant}>{c.label}</Badge>
}

// ─── Tab Content Components ───────────────────────────────────────────────────

function HomeTab({ data, onTabChange }: { data: AcademyData; onTabChange: (tab: string) => void }) {
  const completedModules = data.modules.filter(m => m.status === 'completed').length
  const totalModules = data.modules.length
  const overallProgress = Math.round((completedModules / totalModules) * 100 +
    (data.modules.find(m => m.status === 'in_progress')?.progress ?? 0) / totalModules)

  const currentModule = data.modules.find(m => m.status === 'in_progress')
  const nextSession = data.sessions.filter(s => !s.isPast)[0]
  const pendingAssignment = data.assignments.find(a => a.status === 'pending')
  const recentPosts = data.posts.slice(0, 2)
  const earnedCerts = data.certificates.filter(c => c.status === 'earned').length
  const totalCerts = data.certificates.length

  return (
    <div className="space-y-5">
      {/* Programme Banner */}
      <div
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data.brandColor}, ${data.brandColor}CC)` }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 bg-white -ml-8 -mb-8" />
        <div className="relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <BookOpen size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold mb-1">{data.name}</h1>
          <p className="text-sm opacity-90">{data.description}</p>
        </div>
      </div>

      {/* Welcome + Progress */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-t1 mb-1">
              Welcome, {data.participantName.split(' ')[0]}!
            </h2>
            <p className="text-xs text-t3 mb-3">
              You are making great progress. Keep up the momentum!
            </p>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-t2">
                  {completedModules} of {totalModules} modules complete
                </span>
                <span className="text-xs font-bold text-t1">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} size="md" color="success" />
            </div>
          </div>
        </div>
        {currentModule && (
          <Button
            size="sm"
            className="mt-3 w-full sm:w-auto"
            onClick={() => onTabChange('curriculum')}
          >
            <Play size={14} />
            Continue: {currentModule.title}
          </Button>
        )}
      </Card>

      {/* Two-Column Layout: Session + Assignment | Community + Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Next Session */}
          {nextSession && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-t3" />
                <span className="text-xs font-semibold text-t2 uppercase tracking-wide">Next Session</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{nextSession.title}</h3>
                  <p className="text-xs text-t3 mb-1">
                    {formatDate(nextSession.date)} at {nextSession.time}
                  </p>
                  <div className="flex items-center gap-2">
                    <SessionTypeBadge type={nextSession.type} />
                    <CountdownDisplay dateStr={nextSession.date} />
                  </div>
                </div>
                <Button size="sm" variant={nextSession.rsvpd ? 'secondary' : 'primary'}>
                  {nextSession.rsvpd ? 'Joined' : 'Join'}
                </Button>
              </div>
            </Card>
          )}

          {/* Pending Assignment Alert */}
          {pendingAssignment && (
            <Card
              className="border-amber-200 bg-amber-50/50 cursor-pointer"
              onClick={() => onTabChange('assignments')}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-t1">{pendingAssignment.title}</h3>
                  <p className="text-xs text-t3">Due {formatDate(pendingAssignment.dueDate)}</p>
                </div>
                <ChevronRight size={16} className="text-t3 shrink-0" />
              </div>
            </Card>
          )}

          {/* Certificate Status */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <Award size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-t1">Certificate Progress</h3>
                <p className="text-xs text-t3">
                  {earnedCerts} of {totalCerts} certificates earned
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onTabChange('certificates')}>
                View <ChevronRight size={14} />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Community */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide">Community Highlights</h3>
              <button
                onClick={() => onTabChange('community')}
                className="text-xs text-tempo-600 font-medium hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentPosts.map(post => (
                <Card key={post.id} className="!p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={post.author} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-t1">{post.author}</span>
                        {post.isFacilitator && <Badge variant="ai">Facilitator</Badge>}
                        <span className="text-[0.6rem] text-t3">{post.timestamp}</span>
                      </div>
                      <p className="text-xs text-t2 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-t3">
                        <MessageSquare size={12} />
                        <span className="text-[0.6rem]">{post.replyCount} replies</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CurriculumTab({ data }: { data: AcademyData }) {
  const completedModules = data.modules.filter(m => m.status === 'completed').length
  const totalModules = data.modules.length
  const overallProgress = Math.round(
    data.modules.reduce((sum, m) => sum + m.progress, 0) / totalModules
  )

  return (
    <div className="space-y-5">
      {/* Overall Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-t1">Overall Progress</h3>
          <span className="text-xs font-bold text-t1">{completedModules}/{totalModules} Modules</span>
        </div>
        <Progress value={overallProgress} size="md" color="success" showLabel />
      </Card>

      {/* Module List */}
      <div className="space-y-3">
        {data.modules.map((mod) => (
          <Card key={mod.id} className={cn(mod.status === 'locked' && 'opacity-60')}>
            <div className="flex items-start gap-3">
              {/* Module Number Circle */}
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                mod.status === 'completed' && 'bg-green-100 text-green-600',
                mod.status === 'in_progress' && 'bg-amber-100 text-amber-600',
                mod.status === 'locked' && 'bg-gray-100 text-gray-400',
              )}>
                {mod.status === 'completed' ? (
                  <CheckCircle2 size={18} />
                ) : mod.status === 'locked' ? (
                  <Lock size={14} />
                ) : (
                  mod.number
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[0.6rem] text-t3 uppercase tracking-wide font-medium">
                    Module {mod.number}
                  </span>
                  {mod.status === 'completed' && <CompletionBadge />}
                </div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{mod.title}</h3>
                <div className="flex items-center gap-3 text-[0.65rem] text-t3 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {mod.duration}
                  </span>
                  <span>{mod.completedLessons}/{mod.lessons} lessons</span>
                </div>

                {mod.status !== 'locked' && (
                  <Progress value={mod.progress} size="sm" color={mod.status === 'completed' ? 'success' : 'orange'} showLabel />
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-3 flex justify-end">
              {mod.status === 'completed' && (
                <Button size="sm" variant="ghost" className="text-green-600">
                  <CheckCircle2 size={14} /> Completed
                </Button>
              )}
              {mod.status === 'in_progress' && (
                <Button size="sm">
                  <Play size={14} /> Continue
                </Button>
              )}
              {mod.status === 'locked' && (
                <Button size="sm" variant="secondary" disabled>
                  <Lock size={14} /> Locked
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CalendarTab({ data }: { data: AcademyData }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 2, 1)) // March 2026

  const upcomingSessions = data.sessions.filter(s => !s.isPast)
  const pastSessions = data.sessions.filter(s => s.isPast)
  const [rsvpState, setRsvpState] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    data.sessions.forEach(s => { state[s.id] = s.rsvpd })
    return state
  })

  // Build calendar grid
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })

  const sessionDates = new Set(
    data.sessions.map(s => {
      const d = new Date(s.date)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })
  )

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i)

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const toggleRsvp = (sessionId: string) => {
    setRsvpState(prev => ({ ...prev, [sessionId]: !prev[sessionId] }))
  }

  return (
    <div className="space-y-5">
      {/* Month Calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-canvas rounded-lg transition-colors">
            <ChevronLeft size={16} className="text-t2" />
          </button>
          <h3 className="text-sm font-semibold text-t1">{monthName}</h3>
          <button onClick={nextMonth} className="p-1.5 hover:bg-canvas rounded-lg transition-colors">
            <ChevronRight size={16} className="text-t2" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-[0.6rem] font-medium text-t3 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((day, i) => {
            const hasSession = day && sessionDates.has(`${year}-${month}-${day}`)
            const isToday = day === 17 && month === 2 && year === 2026
            return (
              <div
                key={i}
                className={cn(
                  'py-1.5 text-xs rounded-lg relative',
                  day ? 'text-t1' : '',
                  isToday && 'bg-tempo-100 font-bold text-tempo-700',
                  hasSession && !isToday && 'font-medium',
                )}
              >
                {day || ''}
                {hasSession && (
                  <div
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: data.brandColor }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3">Upcoming Sessions</h3>
        <div className="space-y-3">
          {upcomingSessions.map(session => (
            <Card key={session.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-t1 mb-1">{session.title}</h4>
                  <p className="text-xs text-t3 mb-1.5">
                    {formatDate(session.date)} at {session.time}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SessionTypeBadge type={session.type} />
                    <span className="text-[0.65rem] text-t3">{session.instructor}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={rsvpState[session.id] ? 'secondary' : 'primary'}
                  onClick={() => toggleRsvp(session.id)}
                >
                  {rsvpState[session.id] ? 'RSVPd' : 'RSVP'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3">Past Sessions</h3>
          <div className="space-y-3">
            {pastSessions.map(session => (
              <Card key={session.id} className="opacity-80">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-t1 mb-1">{session.title}</h4>
                    <p className="text-xs text-t3 mb-1.5">
                      {formatDate(session.date)} at {session.time}
                    </p>
                    <SessionTypeBadge type={session.type} />
                  </div>
                  {session.recordingUrl && (
                    <Button size="sm" variant="ghost">
                      <Video size={14} /> Watch
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AssignmentsTab({ data }: { data: AcademyData }) {
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<AcademyAssignment | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackAssignment, setFeedbackAssignment] = useState<AcademyAssignment | null>(null)

  const pending = data.assignments.filter(a => a.status === 'pending')
  const submitted = data.assignments.filter(a => a.status === 'submitted')
  const graded = data.assignments.filter(a => a.status === 'graded')

  const openSubmitModal = (assignment: AcademyAssignment) => {
    setSelectedAssignment(assignment)
    setSubmissionText('')
    setSubmitModalOpen(true)
  }

  const openFeedbackModal = (assignment: AcademyAssignment) => {
    setFeedbackAssignment(assignment)
    setFeedbackModalOpen(true)
  }

  const statusBadge = (status: AcademyAssignment['status']) => {
    const config = {
      pending: { label: 'Pending', variant: 'warning' as const },
      submitted: { label: 'Submitted', variant: 'info' as const },
      graded: { label: 'Graded', variant: 'success' as const },
    }
    const c = config[status]
    return <Badge variant={c.variant}>{c.label}</Badge>
  }

  function AssignmentCard({ assignment }: { assignment: AcademyAssignment }) {
    return (
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-t1">{assignment.title}</h4>
              {statusBadge(assignment.status)}
            </div>
            <p className="text-xs text-t3 mb-1">{assignment.moduleTitle}</p>
            <p className="text-xs text-t3">
              {assignment.status === 'pending' ? 'Due' : 'Submitted'}: {formatDate(assignment.dueDate)}
            </p>
            {assignment.status === 'graded' && assignment.score !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-bold text-t1">
                  {assignment.score}/{assignment.maxScore}
                </span>
                <Progress
                  value={assignment.score}
                  max={assignment.maxScore}
                  size="sm"
                  color={assignment.score >= 70 ? 'success' : 'warning'}
                  className="flex-1 max-w-[120px]"
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {assignment.status === 'pending' && (
            <Button size="sm" onClick={() => openSubmitModal(assignment)}>
              <Upload size={14} /> Submit
            </Button>
          )}
          {assignment.status === 'graded' && assignment.feedback && (
            <Button size="sm" variant="ghost" onClick={() => openFeedbackModal(assignment)}>
              View Feedback <ChevronRight size={14} />
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock size={13} /> Pending ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <Card className="text-center !py-8">
            <CheckCircle2 size={24} className="mx-auto text-green-400 mb-2" />
            <p className="text-xs text-t3">No pending assignments</p>
          </Card>
        ) : (
          <div className="space-y-3">{pending.map(a => <AssignmentCard key={a.id} assignment={a} />)}</div>
        )}
      </div>

      {/* Submitted */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Send size={13} /> Submitted ({submitted.length})
        </h3>
        {submitted.length === 0 ? (
          <Card className="text-center !py-8">
            <p className="text-xs text-t3">No submitted assignments awaiting grading</p>
          </Card>
        ) : (
          <div className="space-y-3">{submitted.map(a => <AssignmentCard key={a.id} assignment={a} />)}</div>
        )}
      </div>

      {/* Graded */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Star size={13} /> Graded ({graded.length})
        </h3>
        {graded.length === 0 ? (
          <Card className="text-center !py-8">
            <p className="text-xs text-t3">No graded assignments yet</p>
          </Card>
        ) : (
          <div className="space-y-3">{graded.map(a => <AssignmentCard key={a.id} assignment={a} />)}</div>
        )}
      </div>

      {/* Submit Modal */}
      <Modal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={`Submit: ${selectedAssignment?.title ?? ''}`}
        description={`${selectedAssignment?.moduleTitle ?? ''} - Due ${selectedAssignment ? formatDate(selectedAssignment.dueDate) : ''}`}
      >
        <div className="space-y-4">
          <Textarea
            label="Your Response"
            placeholder="Write your assignment response here..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            rows={6}
          />
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Upload size={24} className="mx-auto text-t3 mb-2" />
            <p className="text-xs text-t3 mb-1">Drag and drop files here, or click to browse</p>
            <p className="text-[0.6rem] text-t3">PDF, DOC, XLSX up to 10MB</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!submissionText.trim()}>
              <Send size={14} /> Submit Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title={`Feedback: ${feedbackAssignment?.title ?? ''}`}
      >
        {feedbackAssignment && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-t1">
                  {feedbackAssignment.score}/{feedbackAssignment.maxScore}
                </div>
                <div className="text-[0.6rem] text-t3 uppercase tracking-wide">Score</div>
              </div>
              <Progress
                value={feedbackAssignment.score ?? 0}
                max={feedbackAssignment.maxScore}
                size="md"
                color={(feedbackAssignment.score ?? 0) >= 70 ? 'success' : 'warning'}
                className="flex-1"
              />
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-green-800 mb-2">Instructor Feedback</h4>
              <p className="text-xs text-green-700 leading-relaxed">{feedbackAssignment.feedback}</p>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setFeedbackModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CommunityTab({ data }: { data: AcademyData }) {
  const [newPostModal, setNewPostModal] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  const pinnedPosts = data.posts.filter(p => p.isPinned)
  const regularPosts = data.posts.filter(p => !p.isPinned)

  const filteredRegularPosts = moduleFilter === 'all'
    ? regularPosts
    : regularPosts.filter(p => p.moduleTag === moduleFilter)

  const moduleTagOptions = useMemo(() => {
    const tags = new Set(data.posts.map(p => p.moduleTag).filter(Boolean))
    return ['all', ...Array.from(tags)] as string[]
  }, [data.posts])

  const toggleExpand = (postId: string) => {
    setExpandedPostId(prev => prev === postId ? null : postId)
  }

  function PostCard({ post }: { post: DiscussionPost }) {
    const isExpanded = expandedPostId === post.id
    return (
      <Card className={cn(post.isPinned && 'border-tempo-200 bg-tempo-50/30')}>
        {post.isPinned && (
          <div className="flex items-center gap-1.5 mb-2">
            <Pin size={11} className="text-tempo-600" />
            <span className="text-[0.6rem] font-semibold text-tempo-600 uppercase tracking-wide">Pinned</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Avatar name={post.author} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-t1">{post.author}</span>
              {post.isFacilitator && <Badge variant="ai">Facilitator</Badge>}
              {post.moduleTag && <Badge variant="default">{post.moduleTag}</Badge>}
              <span className="text-[0.6rem] text-t3">{post.timestamp}</span>
            </div>
            <p className="text-xs text-t2 leading-relaxed">{post.content}</p>
            <button
              onClick={() => toggleExpand(post.id)}
              className="flex items-center gap-1.5 mt-2 text-[0.65rem] text-t3 hover:text-t1 transition-colors"
            >
              <MessageSquare size={12} />
              {post.replyCount} replies
              {post.replies && post.replies.length > 0 && (
                <ChevronRight size={12} className={cn('transition-transform', isExpanded && 'rotate-90')} />
              )}
            </button>

            {/* Expanded Replies */}
            {isExpanded && post.replies && post.replies.length > 0 && (
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">
                {post.replies.map((reply, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Avatar name={reply.author} size="xs" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.65rem] font-semibold text-t1">{reply.author}</span>
                        <span className="text-[0.6rem] text-t3">{reply.timestamp}</span>
                      </div>
                      <p className="text-xs text-t2 mt-0.5">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-t1">Discussions</h3>
        <Button size="sm" onClick={() => setNewPostModal(true)}>
          <MessageSquare size={14} /> New Post
        </Button>
      </div>

      {/* Module Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {moduleTagOptions.map(tag => (
          <button
            key={tag}
            onClick={() => setModuleFilter(tag)}
            className={cn(
              'text-[0.65rem] px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors',
              moduleFilter === tag
                ? 'bg-tempo-100 text-tempo-700'
                : 'bg-canvas text-t3 hover:text-t1'
            )}
          >
            {tag === 'all' ? 'All Topics' : tag}
          </button>
        ))}
      </div>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          {pinnedPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {/* Regular Posts */}
      <div className="space-y-3">
        {filteredRegularPosts.map(post => <PostCard key={post.id} post={post} />)}
        {filteredRegularPosts.length === 0 && (
          <Card className="text-center !py-8">
            <MessageSquare size={24} className="mx-auto text-t3 mb-2 opacity-40" />
            <p className="text-xs text-t3">No posts in this category yet</p>
          </Card>
        )}
      </div>

      {/* New Post Modal */}
      <Modal
        open={newPostModal}
        onClose={() => setNewPostModal(false)}
        title="New Discussion Post"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="What would you like to discuss?"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
          />
          <Textarea
            label="Content"
            placeholder="Share your thoughts, questions, or insights..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={5}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setNewPostModal(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!postTitle.trim() || !postContent.trim()}>
              <Send size={14} /> Post
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ResourcesTab({ data }: { data: AcademyData }) {
  const grouped = useMemo(() => {
    const groups: Record<string, AcademyResource[]> = {}
    data.resources.forEach(r => {
      if (!groups[r.moduleTitle]) groups[r.moduleTitle] = []
      groups[r.moduleTitle].push(r)
    })
    return groups
  }, [data.resources])

  const typeIcon = (type: AcademyResource['type']) => {
    switch (type) {
      case 'pdf': return <FileText size={18} className="text-red-500" />
      case 'link': return <Link2 size={18} className="text-blue-500" />
      case 'video': return <Video size={18} className="text-purple-500" />
    }
  }

  const typeLabel = (type: AcademyResource['type']) => {
    switch (type) {
      case 'pdf': return 'PDF Document'
      case 'link': return 'External Link'
      case 'video': return 'Video'
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([moduleTitle, resources]) => (
        <div key={moduleTitle}>
          <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3">{moduleTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.map(resource => (
              <Card key={resource.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center shrink-0">
                    {typeIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-t1 mb-0.5">{resource.title}</h4>
                    <p className="text-xs text-t3 mb-2 line-clamp-2">{resource.description}</p>
                    <Badge variant="default">{typeLabel(resource.type)}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="secondary">
                    {resource.type === 'pdf' ? (
                      <><Download size={14} /> Download</>
                    ) : resource.type === 'video' ? (
                      <><Play size={14} /> Watch</>
                    ) : (
                      <><ExternalLink size={14} /> Open</>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CertificatesTab({ data }: { data: AcademyData }) {
  const earned = data.certificates.filter(c => c.status === 'earned')
  const inProgress = data.certificates.filter(c => c.status === 'in_progress')

  return (
    <div className="space-y-6">
      {/* Earned Certificates */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Trophy size={13} className="text-amber-500" /> Earned ({earned.length})
        </h3>
        {earned.length === 0 ? (
          <Card className="text-center !py-8">
            <Award size={28} className="mx-auto text-t3 opacity-30 mb-2" />
            <p className="text-xs text-t3">Complete requirements to earn certificates</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {earned.map(cert => (
              <Card key={cert.id} className="border-green-200 bg-green-50/30">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <Award size={22} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-t1">{cert.name}</h4>
                      <CompletionBadge />
                    </div>
                    <p className="text-xs text-t3">Earned on {cert.dateEarned ? formatDate(cert.dateEarned) : ''}</p>
                    <div className="mt-2 space-y-1">
                      {cert.requirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                          <span className="text-[0.65rem] text-green-700">{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button size="sm" variant="secondary">
                    <Download size={14} /> Download PDF
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Share2 size={14} /> Share
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* In Progress */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Target size={13} /> In Progress ({inProgress.length})
        </h3>
        <div className="space-y-3">
          {inProgress.map(cert => {
            const metCount = cert.requirements.filter(r => r.met).length
            const totalReqs = cert.requirements.length
            return (
              <Card key={cert.id}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Award size={22} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-t1 mb-1">{cert.name}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-t3">{metCount} of {totalReqs} requirements met</span>
                      <Progress value={metCount} max={totalReqs} size="sm" color="orange" className="flex-1 max-w-[100px]" />
                    </div>
                    <div className="space-y-1.5">
                      {cert.requirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {req.met ? (
                            <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <span className={cn(
                            'text-[0.65rem]',
                            req.met ? 'text-green-700 line-through' : 'text-t2'
                          )}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MyProgressTab({ data }: { data: AcademyData }) {
  const completedModules = data.modules.filter(m => m.status === 'completed').length
  const totalModules = data.modules.length
  const overallProgress = Math.round(
    data.modules.reduce((sum, m) => sum + m.progress, 0) / totalModules
  )

  const totalTimeMinutes = data.modules.reduce((sum, m) => {
    if (!m.timeSpent) return sum
    const parts = m.timeSpent.match(/(\d+)h\s*(\d+)m/)
    if (!parts) return sum
    return sum + parseInt(parts[1]) * 60 + parseInt(parts[2])
  }, 0)

  const totalHours = Math.floor(totalTimeMinutes / 60)
  const totalMins = totalTimeMinutes % 60

  const avgScore = (() => {
    const scored = data.modules.filter(m => m.score !== undefined)
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((sum, m) => sum + (m.score ?? 0), 0) / scored.length)
  })()

  const streakDays = 7 // demo value

  return (
    <div className="space-y-5">
      {/* Circular Progress */}
      <Card className="flex flex-col items-center !py-8">
        <CircularProgress value={overallProgress} size={140} strokeWidth={12} color={data.brandColor} />
        <h3 className="text-sm font-bold text-t1 mt-4">Overall Completion</h3>
        <p className="text-xs text-t3">{completedModules} of {totalModules} modules completed</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center !p-4">
          <Flame size={20} className="mx-auto text-orange-500 mb-1" />
          <div className="text-lg font-bold text-t1">{streakDays}</div>
          <div className="text-[0.6rem] text-t3 uppercase tracking-wide">Day Streak</div>
        </Card>
        <Card className="text-center !p-4">
          <Clock size={20} className="mx-auto text-blue-500 mb-1" />
          <div className="text-lg font-bold text-t1">{totalHours}h {totalMins}m</div>
          <div className="text-[0.6rem] text-t3 uppercase tracking-wide">Time Invested</div>
        </Card>
        <Card className="text-center !p-4">
          <Star size={20} className="mx-auto text-amber-500 mb-1" />
          <div className="text-lg font-bold text-t1">{avgScore}%</div>
          <div className="text-[0.6rem] text-t3 uppercase tracking-wide">Avg Score</div>
        </Card>
      </div>

      {/* Module Breakdown */}
      <div>
        <h3 className="text-xs font-semibold text-t2 uppercase tracking-wide mb-3">Module Breakdown</h3>
        <div className="space-y-2">
          {data.modules.map(mod => (
            <Card key={mod.id} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                  mod.status === 'completed' && 'bg-green-100 text-green-600',
                  mod.status === 'in_progress' && 'bg-amber-100 text-amber-600',
                  mod.status === 'locked' && 'bg-gray-100 text-gray-400',
                )}>
                  {mod.status === 'completed' ? (
                    <CheckCircle2 size={14} />
                  ) : mod.status === 'locked' ? (
                    <Lock size={12} />
                  ) : (
                    mod.number
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-t1 mb-1 truncate">{mod.title}</h4>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={mod.progress}
                      size="sm"
                      color={mod.status === 'completed' ? 'success' : mod.status === 'in_progress' ? 'orange' : 'orange'}
                      className="flex-1"
                    />
                    <span className="text-[0.6rem] font-medium text-t2 tabular-nums w-8 text-right">
                      {mod.progress}%
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  {mod.score !== undefined && (
                    <div className="text-xs font-bold text-t1">{mod.score}%</div>
                  )}
                  {mod.timeSpent && (
                    <div className="text-[0.6rem] text-t3">{mod.timeSpent}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Learning Streak */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Flame size={18} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-t1">Learning Streak</h3>
            <p className="text-xs text-t3">{streakDays} days active in a row</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-6 rounded-md',
                i < streakDays ? 'bg-orange-400' : i < 10 ? 'bg-orange-200' : 'bg-gray-100',
              )}
              title={`Day ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[0.55rem] text-t3">2 weeks ago</span>
          <span className="text-[0.55rem] text-t3">Today</span>
        </div>
      </Card>
    </div>
  )
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const ACADEMY_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'community', label: 'Community' },
  { id: 'resources', label: 'Resources' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'progress', label: 'My Progress' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AcademyWorkspacePage() {
  const params = useParams()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState('home')
  const [apiAcademy, setApiAcademy] = useState<AcademyData | null>(null)
  const [apiLoading, setApiLoading] = useState(true)

  // Try to load from API first (production mode)
  useEffect(() => {
    async function loadFromAPI() {
      try {
        const res = await fetch(`/api/academy?action=get-by-slug&slug=${encodeURIComponent(slug)}`)
        if (!res.ok) throw new Error('Not found')
        const { data: acad } = await res.json()
        if (!acad) throw new Error('No data')

        // Fetch related data in parallel
        const [coursesRes, sessionsRes, assignmentsRes, discussionsRes, resourcesRes, certsRes] = await Promise.all([
          fetch(`/api/academy?action=courses&academyId=${acad.id}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/academy?action=sessions&academyId=${acad.id}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/academy?action=assignments&academyId=${acad.id}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/academy?action=discussions&academyId=${acad.id}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/academy?action=resources&academyId=${acad.id}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/academy?action=certificates&academyId=${acad.id}`).then(r => r.json()).catch(() => ({ data: [] })),
        ])

        const brandColor = acad.brandColor || acad.brand_color || '#00567A'

        setApiAcademy({
          name: acad.name,
          brandColor,
          brandColorLight: `${brandColor}15`,
          description: acad.description || '',
          participantName: 'Participant', // Will be updated when participant auth is integrated
          modules: (coursesRes.data || []).map((c: any, i: number) => ({
            id: c.id, number: c.moduleNumber || c.module_number || i + 1,
            title: c.title || `Module ${i + 1}`, duration: `${c.durationHours || 6} hours`,
            status: 'locked' as const, progress: 0, lessons: 8, completedLessons: 0,
          })),
          sessions: (sessionsRes.data || []).map((s: any) => ({
            id: s.id, title: s.title,
            date: s.scheduledDate || s.scheduled_date || '',
            time: s.scheduledTime || s.scheduled_time || '',
            type: s.type || 'webinar', instructor: s.instructor || '',
            rsvpd: false, isPast: new Date(s.scheduledDate || s.scheduled_date) < new Date(),
            recordingUrl: s.recordingUrl || s.recording_url,
          })),
          assignments: (assignmentsRes.data || []).map((a: any) => ({
            id: a.id, title: a.title,
            dueDate: a.dueDate || a.due_date || '',
            moduleTitle: '', status: 'pending' as const,
            maxScore: a.maxScore || a.max_score || 100,
          })),
          posts: (discussionsRes.data || []).map((d: any) => ({
            id: d.id, author: d.facilitatorName || d.facilitator_name || 'Participant',
            content: d.content, timestamp: 'Recently',
            replyCount: d.replyCount || d.reply_count || 0,
            isPinned: d.isPinned || d.is_pinned || false,
            isFacilitator: d.isFacilitator || d.is_facilitator || false,
            moduleTag: d.moduleTag || d.module_tag,
          })),
          resources: (resourcesRes.data || []).map((r: any) => ({
            id: r.id, title: r.title, description: r.description || '',
            type: r.type || 'pdf', moduleTitle: '', url: r.url,
          })),
          certificates: (certsRes.data || []).map((c: any) => ({
            id: c.id, name: c.name,
            dateEarned: c.issuedAt || c.issued_at,
            status: c.status || 'in_progress',
            requirements: (() => {
              try {
                const reqs = typeof c.requirements === 'string' ? JSON.parse(c.requirements) : c.requirements
                return Array.isArray(reqs) ? reqs : []
              } catch { return [] }
            })(),
          })),
        })
      } catch {
        // API not available or academy not in DB — fall through to demo data
      } finally {
        setApiLoading(false)
      }
    }
    loadFromAPI()
  }, [slug])

  // Use API data if available, otherwise fall back to demo
  const academy = apiAcademy || DEMO_ACADEMIES[slug]

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (apiLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-tempo-300 border-t-tempo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-t3">Loading academy...</p>
        </div>
      </div>
    )
  }

  if (!academy) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-sm text-center">
          <BookOpen size={32} className="mx-auto text-t3 mb-3 opacity-40" />
          <h2 className="text-sm font-semibold text-t1 mb-1">Academy Not Found</h2>
          <p className="text-xs text-t3">
            The academy &quot;{slug}&quot; does not exist or you do not have access.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-8"
      style={{ '--academy-brand': academy.brandColor, '--academy-brand-light': academy.brandColorLight } as React.CSSProperties}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-3 py-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: academy.brandColor }}
            >
              <BookOpen size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-t1 truncate">{academy.name}</h1>
            </div>
          </div>
          <Tabs
            tabs={ACADEMY_TABS}
            active={activeTab}
            onChange={handleTabChange}
            maxVisible={6}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5">
        {activeTab === 'home' && <HomeTab data={academy} onTabChange={handleTabChange} />}
        {activeTab === 'curriculum' && <CurriculumTab data={academy} />}
        {activeTab === 'calendar' && <CalendarTab data={academy} />}
        {activeTab === 'assignments' && <AssignmentsTab data={academy} />}
        {activeTab === 'community' && <CommunityTab data={academy} />}
        {activeTab === 'resources' && <ResourcesTab data={academy} />}
        {activeTab === 'certificates' && <CertificatesTab data={academy} />}
        {activeTab === 'progress' && <MyProgressTab data={academy} />}
      </div>
    </div>
  )
}
