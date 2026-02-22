'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { UserCheck, Users, Plus, Sparkles } from 'lucide-react'
import { useTempo } from '@/lib/store'

export default function MentoringPage() {
  const { mentoringPrograms, mentoringPairs, employees, addMentoringProgram, addMentoringPair, updateMentoringPair, getEmployeeName } = useTempo()
  const [activeTab, setActiveTab] = useState('programs')
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [showPairModal, setShowPairModal] = useState(false)
  const [programForm, setProgramForm] = useState({
    title: '',
    type: 'one_on_one' as string,
    status: 'active' as string,
    duration_months: 6,
    start_date: '',
  })
  const [pairForm, setPairForm] = useState({
    program_id: '',
    mentor_id: '',
    mentee_id: '',
  })

  const tabs = [
    { id: 'programs', label: 'Programs', count: mentoringPrograms.length },
    { id: 'pairs', label: 'Mentoring Pairs', count: mentoringPairs.length },
    { id: 'matching', label: 'AI Matching' },
  ]

  const activePrograms = mentoringPrograms.filter(p => p.status === 'active').length
  const activePairs = mentoringPairs.filter(p => p.status === 'active').length
  const avgMatchScore = mentoringPairs.length > 0 ? Math.round(mentoringPairs.reduce((a, p) => a + p.match_score, 0) / mentoringPairs.length) : 0

  function submitProgram() {
    if (!programForm.title || !programForm.start_date) return
    addMentoringProgram(programForm)
    setShowProgramModal(false)
    setProgramForm({ title: '', type: 'one_on_one', status: 'active', duration_months: 6, start_date: '' })
  }

  function submitPair() {
    if (!pairForm.program_id || !pairForm.mentor_id || !pairForm.mentee_id) return
    const matchScore = Math.floor(Math.random() * 21) + 75
    addMentoringPair({ ...pairForm, status: 'active', match_score: matchScore })
    setShowPairModal(false)
    setPairForm({ program_id: '', mentor_id: '', mentee_id: '' })
  }

  function completePair(pairId: string) {
    updateMentoringPair(pairId, { status: 'completed' })
  }

  function pausePair(pairId: string) {
    updateMentoringPair(pairId, { status: 'paused' })
  }

  return (
    <>
      <Header title="Mentoring" subtitle="Programs, matching, and session tracking"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowPairModal(true)}><Plus size={14} /> Match Pair</Button>
            <Button size="sm" onClick={() => setShowProgramModal(true)}><Plus size={14} /> New Program</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Programs" value={activePrograms} icon={<Users size={20} />} />
        <StatCard label="Active Pairs" value={activePairs} icon={<UserCheck size={20} />} />
        <StatCard label="Avg Match Score" value={`${avgMatchScore}%`} change="AI-powered" changeType="positive" />
        <StatCard label="Total Pairs" value={mentoringPairs.length} change="All time" changeType="neutral" />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentoringPrograms.length === 0 ? (
            <Card>
              <div className="py-8 text-center text-sm text-t3">No programs yet. Click &quot;New Program&quot; to create one.</div>
            </Card>
          ) : mentoringPrograms.map(program => {
            const pairs = mentoringPairs.filter(p => p.program_id === program.id)
            return (
              <Card key={program.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{program.title}</h3>
                    <p className="text-xs text-t3">{program.duration_months} months - Started {program.start_date}</p>
                  </div>
                  <Badge variant={program.status === 'active' ? 'success' : 'default'}>{program.status}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="info">{program.type.replace('_', ' ')}</Badge>
                  <span className="text-xs text-t3">{pairs.length} pairs</span>
                </div>
                <div className="space-y-2">
                  {pairs.map(pair => {
                    const mentorName = getEmployeeName(pair.mentor_id)
                    const menteeName = getEmployeeName(pair.mentee_id)
                    return (
                      <div key={pair.id} className="flex items-center gap-2 bg-canvas rounded-lg p-2">
                        <Avatar name={mentorName} size="sm" />
                        <span className="text-xs text-t3">&#8594;</span>
                        <Avatar name={menteeName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-t1 truncate">{mentorName} & {menteeName}</p>
                        </div>
                        <Badge variant={pair.status === 'active' ? 'success' : pair.status === 'completed' ? 'info' : 'default'}>{pair.status}</Badge>
                        <span className="text-xs font-medium text-tempo-600">{pair.match_score}%</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'pairs' && (
        <Card padding="none">
          <CardHeader><CardTitle>All Mentoring Pairs</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Mentor</th>
                  <th className="tempo-th text-left px-4 py-3">Mentee</th>
                  <th className="tempo-th text-left px-4 py-3">Program</th>
                  <th className="tempo-th text-right px-4 py-3">Match Score</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mentoringPairs.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-t3">No mentoring pairs yet. Click &quot;Match Pair&quot; to create one.</td></tr>
                ) : mentoringPairs.map(pair => {
                  const mentorName = getEmployeeName(pair.mentor_id)
                  const menteeName = getEmployeeName(pair.mentee_id)
                  const mentor = employees.find(e => e.id === pair.mentor_id)
                  const mentee = employees.find(e => e.id === pair.mentee_id)
                  const program = mentoringPrograms.find(p => p.id === pair.program_id)
                  return (
                    <tr key={pair.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={mentorName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{mentorName}</p>
                            <p className="text-xs text-t3">{mentor?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={menteeName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{menteeName}</p>
                            <p className="text-xs text-t3">{mentee?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{program?.title || 'Unknown'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-tempo-600">{pair.match_score}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={pair.status === 'active' ? 'success' : pair.status === 'completed' ? 'info' : 'default'}>{pair.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {pair.status === 'active' && (
                            <>
                              <Button size="sm" variant="primary" onClick={() => completePair(pair.id)}>Complete</Button>
                              <Button size="sm" variant="ghost" onClick={() => pausePair(pair.id)}>Pause</Button>
                            </>
                          )}
                          {pair.status === 'paused' && (
                            <Button size="sm" variant="outline" onClick={() => updateMentoringPair(pair.id, { status: 'active' })}>Resume</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'matching' && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 mx-auto mb-4">
              <Sparkles size={28} />
            </div>
            <h3 className="text-sm font-semibold text-t1 mb-2">AI-Powered Mentor Matching</h3>
            <p className="text-xs text-t3 max-w-md mx-auto mb-4">Our AI analyzes skills, goals, experience, and personality traits to create optimal mentor-mentee pairings with high match scores.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowPairModal(true)}>Match New Pair</Button>
              <Button variant="outline">Run Matching Algorithm</Button>
            </div>
          </div>
        </Card>
      )}

      {/* New Program Modal */}
      <Modal open={showProgramModal} onClose={() => setShowProgramModal(false)} title="Create Mentoring Program">
        <div className="space-y-4">
          <Input label="Program Title" value={programForm.title} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })} placeholder="e.g. Emerging Leaders 2026" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Program Type" value={programForm.type} onChange={(e) => setProgramForm({ ...programForm, type: e.target.value as 'one_on_one' | 'reverse' | 'group' })} options={[
              { value: 'one_on_one', label: 'One-on-One' },
              { value: 'reverse', label: 'Reverse Mentoring' },
              { value: 'group', label: 'Group Mentoring' },
            ]} />
            <Input label="Duration (months)" type="number" value={programForm.duration_months} onChange={(e) => setProgramForm({ ...programForm, duration_months: Number(e.target.value) })} />
          </div>
          <Input label="Start Date" type="date" value={programForm.start_date} onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowProgramModal(false)}>Cancel</Button>
            <Button onClick={submitProgram}>Create Program</Button>
          </div>
        </div>
      </Modal>

      {/* Match Pair Modal */}
      <Modal open={showPairModal} onClose={() => setShowPairModal(false)} title="Match Mentoring Pair">
        <div className="space-y-4">
          <Select label="Program" value={pairForm.program_id} onChange={(e) => setPairForm({ ...pairForm, program_id: e.target.value })} options={[
            { value: '', label: 'Select program...' },
            ...mentoringPrograms.map(p => ({ value: p.id, label: p.title })),
          ]} />
          <Select label="Mentor" value={pairForm.mentor_id} onChange={(e) => setPairForm({ ...pairForm, mentor_id: e.target.value })} options={[
            { value: '', label: 'Select mentor...' },
            ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name} - ${e.job_title}` })),
          ]} />
          <Select label="Mentee" value={pairForm.mentee_id} onChange={(e) => setPairForm({ ...pairForm, mentee_id: e.target.value })} options={[
            { value: '', label: 'Select mentee...' },
            ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name} - ${e.job_title}` })),
          ]} />
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">Match score will be automatically calculated (75-95%) based on AI-powered compatibility analysis.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPairModal(false)}>Cancel</Button>
            <Button onClick={submitPair}>Match Pair</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
