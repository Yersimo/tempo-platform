'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTempo } from '@/lib/store'
import {
  Rocket, Users, Target, Shield, BarChart3, ArrowRight, ArrowLeft,
  CheckCircle, Building, Briefcase, Globe, Zap, Check, Mail, Loader2,
  BookOpen, Heart, UserPlus, Clock, DollarSign, FolderKanban
} from 'lucide-react'

const steps = [
  {
    id: 'welcome',
    icon: <Rocket size={32} />,
    title: 'Welcome to Tempo',
    subtitle: 'Let\'s set up your workspace in a few quick steps',
  },
  {
    id: 'organization',
    icon: <Building size={32} />,
    title: 'Your Organization',
    subtitle: 'Tell us about your company so we can customize your experience',
  },
  {
    id: 'modules',
    icon: <Zap size={32} />,
    title: 'Choose Your Modules',
    subtitle: 'Select the modules you want to start with. You can always add more later.',
  },
  {
    id: 'team',
    icon: <Users size={32} />,
    title: 'Invite Your Team',
    subtitle: 'Add team members to get started collaborating',
  },
  {
    id: 'complete',
    icon: <CheckCircle size={32} />,
    title: 'You\'re All Set!',
    subtitle: 'Your workspace is ready. Start exploring Tempo.',
  },
]

const availableModules = [
  { id: 'performance', name: 'Performance', desc: 'Goals, reviews, feedback', icon: <Target size={18} /> },
  { id: 'people', name: 'People', desc: 'Employee directory', icon: <Users size={18} /> },
  { id: 'recruiting', name: 'Recruiting', desc: 'Job postings, pipeline', icon: <UserPlus size={18} /> },
  { id: 'payroll', name: 'Payroll', desc: 'Pay runs, deductions', icon: <DollarSign size={18} /> },
  { id: 'time', name: 'Time & Attendance', desc: 'Leave, timesheets', icon: <Clock size={18} /> },
  { id: 'learning', name: 'Learning', desc: 'Courses, enrollment', icon: <BookOpen size={18} /> },
  { id: 'benefits', name: 'Benefits', desc: 'Plans, enrollment', icon: <Heart size={18} /> },
  { id: 'compensation', name: 'Compensation', desc: 'Bands, salary reviews', icon: <Briefcase size={18} /> },
  { id: 'engagement', name: 'Engagement', desc: 'Surveys, eNPS', icon: <BarChart3 size={18} /> },
  { id: 'expense', name: 'Expenses', desc: 'Reports, approvals', icon: <Globe size={18} /> },
  { id: 'projects', name: 'Projects', desc: 'Tasks, milestones', icon: <FolderKanban size={18} /> },
  { id: 'analytics', name: 'Analytics', desc: 'Insights, dashboards', icon: <Shield size={18} /> },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { org, updateOrg } = useTempo()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedModules, setSelectedModules] = useState<string[]>(['performance', 'people', 'analytics'])
  const [companySize, setCompanySize] = useState(org?.size || '')
  const [industry, setIndustry] = useState(org?.industry || '')
  const [inviteEmails, setInviteEmails] = useState('')
  const [saving, setSaving] = useState(false)
  const [invitesSent, setInvitesSent] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const isFirst = currentStep === 0

  const saveOrgDetails = async () => {
    if (!companySize && !industry) return
    setSaving(true)
    try {
      // Save via the data API
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org?.id,
          data: { size: companySize, industry },
        }),
      })
      // Update local store
      if (updateOrg) {
        updateOrg({ size: companySize, industry })
      }
    } catch (err) {
      console.error('Failed to save org details:', err)
    } finally {
      setSaving(false)
    }
  }

  const saveModules = async () => {
    setSaving(true)
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org?.id,
          data: { enabled_modules: selectedModules },
        }),
      })
    } catch (err) {
      console.error('Failed to save modules:', err)
    } finally {
      setSaving(false)
    }
  }

  const sendInvites = async () => {
    const emails = inviteEmails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'))

    if (emails.length === 0) return

    setSaving(true)
    setInviteError('')
    try {
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, role: 'employee' }),
      })
      if (res.ok) {
        setInvitesSent(true)
      } else {
        const data = await res.json()
        setInviteError(data.error || 'Failed to send invitations')
      }
    } catch {
      setInviteError('Failed to send invitations. You can invite people later from Settings.')
    } finally {
      setSaving(false)
    }
  }

  const completeOnboarding = async () => {
    setSaving(true)
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org?.id,
          data: { onboarding_completed: true },
        }),
      })
    } catch {
      // Non-blocking — they can still proceed
    } finally {
      setSaving(false)
    }
    router.push('/dashboard')
  }

  const next = async () => {
    if (isLast) {
      await completeOnboarding()
      return
    }

    // Persist data when leaving certain steps
    if (step.id === 'organization') {
      await saveOrgDetails()
    } else if (step.id === 'modules') {
      await saveModules()
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const prev = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center gap-2">
              <div className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? 'bg-tempo-600' : 'bg-border'}`} />
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-[14px] border border-border p-8 min-h-[400px] flex flex-col">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 mx-auto mb-4">
              {step.icon}
            </div>
            <h1 className="text-2xl font-light text-t1 tracking-tight mb-2">{step.title}</h1>
            <p className="text-sm text-t3">{step.subtitle}</p>
          </div>

          {/* Step-specific content */}
          <div className="flex-1">
            {step.id === 'welcome' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                  <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-t1">16 Integrated Modules</p>
                    <p className="text-xs text-t3">HR, Performance, Payroll, Benefits, and more — all unified.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                  <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-t1">AI-Powered Insights</p>
                    <p className="text-xs text-t3">Get intelligent recommendations for your workforce decisions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                  <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-t1">Enterprise Security</p>
                    <p className="text-xs text-t3">RBAC, MFA, audit logging, and encryption built in.</p>
                  </div>
                </div>
              </div>
            )}

            {step.id === 'organization' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="text-sm font-medium text-t1 block mb-1.5">Company Size</label>
                  <select
                    value={companySize}
                    onChange={e => setCompanySize(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  >
                    <option value="">Select size...</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1,000 employees</option>
                    <option value="1001-5000">1,001-5,000 employees</option>
                    <option value="5000+">5,000+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-t1 block mb-1.5">Industry</label>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  >
                    <option value="">Select industry...</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance & Banking</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail & E-commerce</option>
                    <option value="education">Education</option>
                    <option value="consulting">Consulting & Professional Services</option>
                    <option value="energy">Energy & Utilities</option>
                    <option value="telecom">Telecommunications</option>
                    <option value="government">Government & Public Sector</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {step.id === 'modules' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                {availableModules.map(mod => {
                  const selected = selectedModules.includes(mod.id)
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                        selected
                          ? 'bg-tempo-50 border-tempo-600/30 ring-1 ring-tempo-600/20'
                          : 'bg-canvas border-border hover:border-tempo-600/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-tempo-600 text-white' : 'bg-canvas border border-border text-t3'}`}>
                        {selected ? <Check size={14} /> : mod.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-t1">{mod.name}</p>
                        <p className="text-xs text-t3">{mod.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {step.id === 'team' && (
              <div className="space-y-4 max-w-md mx-auto">
                {invitesSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <Mail size={24} className="text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-t1">Invitations sent!</p>
                    <p className="text-xs text-t3 mt-1">Your team members will receive an email with a link to join.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-t1 block mb-1.5">Email Addresses</label>
                      <textarea
                        value={inviteEmails}
                        onChange={e => setInviteEmails(e.target.value)}
                        placeholder={"alice@company.com\nbob@company.com\ncarol@company.com"}
                        className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none h-32 resize-none"
                      />
                      <p className="text-xs text-t3 mt-1.5">Enter one email per line. They&apos;ll receive an invitation to join your workspace.</p>
                    </div>
                    {inviteError && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>
                    )}
                    {inviteEmails.trim() && (
                      <Button onClick={sendInvites} disabled={saving} className="w-full">
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Mail size={14} /> Send Invitations</>}
                      </Button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="text-sm text-t3 hover:text-t1 font-medium block mx-auto"
                >
                  Skip — I&apos;ll invite people later
                </button>
              </div>
            )}

            {step.id === 'complete' && (
              <div className="space-y-4 max-w-md mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-3 rounded-lg bg-canvas border border-border">
                    <p className="text-xs text-t3">Modules Enabled</p>
                    <p className="text-lg font-semibold text-t1">{selectedModules.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-canvas border border-border">
                    <p className="text-xs text-t3">Organization</p>
                    <p className="text-lg font-semibold text-t1 truncate">{org?.name || 'Ready'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={prev}
              disabled={isFirst || saving}
              className={isFirst ? 'invisible' : ''}
            >
              <ArrowLeft size={14} /> Back
            </Button>
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? 'bg-tempo-600' : 'bg-border'}`} />
              ))}
            </div>
            {step.id !== 'team' && (
              <Button onClick={next} disabled={saving}>
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : isLast ? (
                  <>Go to Dashboard <ArrowRight size={14} /></>
                ) : (
                  <>Continue <ArrowRight size={14} /></>
                )}
              </Button>
            )}
            {step.id === 'team' && !invitesSent && !inviteEmails.trim() && (
              <Button onClick={next}>
                Continue <ArrowRight size={14} />
              </Button>
            )}
            {step.id === 'team' && invitesSent && (
              <Button onClick={next}>
                Continue <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
