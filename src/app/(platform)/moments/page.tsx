'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { TempoDonutChart, TempoBarChart, CHART_COLORS } from '@/components/ui/charts'
import { useTempo } from '@/lib/store'
import { cn } from '@/lib/utils/cn'
import {
  Heart, Cake, Award, Baby, PartyPopper, Star, UserPlus, ArrowUpRight,
  Calendar, CheckCircle, Plus, Search, Sparkles,
  Trophy, GraduationCap, Users, TrendingUp,
  ThumbsUp,
} from 'lucide-react'

const MOMENT_ICONS: Record<string, React.ReactNode> = {
  birthday: <Cake size={18} />,
  work_anniversary: <Award size={18} />,
  promotion: <TrendingUp size={18} />,
  new_hire: <UserPlus size={18} />,
  return_from_leave: <ArrowUpRight size={18} />,
  retirement: <Star size={18} />,
  first_project: <Trophy size={18} />,
  certification: <GraduationCap size={18} />,
  team_change: <Users size={18} />,
  milestone_achievement: <Sparkles size={18} />,
  baby_born: <Baby size={18} />,
  wedding: <Heart size={18} />,
  custom: <PartyPopper size={18} />,
}

const MOMENT_COLORS: Record<string, string> = {
  birthday: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  work_anniversary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  promotion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  new_hire: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  return_from_leave: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  retirement: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  first_project: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  certification: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  team_change: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  milestone_achievement: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  baby_born: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  wedding: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  custom: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  upcoming: { label: 'Upcoming', variant: 'info' },
  today: { label: 'Today', variant: 'orange' as any },
  celebrated: { label: 'Celebrated', variant: 'success' },
  missed: { label: 'Missed', variant: 'error' },
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'work_anniversary', label: 'Work Anniversary' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'new_hire', label: 'New Hire' },
  { value: 'certification', label: 'Certification' },
  { value: 'milestone_achievement', label: 'Milestone' },
  { value: 'baby_born', label: 'New Baby' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'team_change', label: 'Team Change' },
  { value: 'return_from_leave', label: 'Return from Leave' },
  { value: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'celebrated', label: 'Celebrated' },
  { value: 'missed', label: 'Missed' },
]

const MOMENT_TYPE_OPTIONS = TYPE_OPTIONS.filter(o => o.value !== 'all')

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'manager_only', label: 'Manager Only' },
  { value: 'hr_only', label: 'HR Only' },
]

const CELEBRATION_OPTIONS = [
  { value: 'auto_message', label: 'Auto Message' },
  { value: 'team_shoutout', label: 'Team Shout-out' },
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'none', label: 'None' },
]

export default function MomentsPage() {
  const {
    momentsThatMatter, addMoment, acknowledgeMoment,
    employees, getEmployeeName, currentEmployeeId,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('timeline')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMoment, setSelectedMoment] = useState<any>(null)
  const [form, setForm] = useState({
    employee_id: '', type: 'birthday' as string, title: '', description: '',
    date: '', visibility: 'public' as string, celebration_type: 'auto_message' as string,
  })

  const moments = momentsThatMatter || []

  const todayMoments = moments.filter(m => m.status === 'today')
  const upcomingMoments = moments.filter(m => m.status === 'upcoming')
  const celebratedCount = moments.filter(m => m.status === 'celebrated').length
  const totalAcknowledgements = moments.reduce((sum, m) => sum + (m.acknowledged_by?.length || 0), 0)

  const filtered = useMemo(() => {
    return moments.filter(m => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.description.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'all' && m.type !== typeFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      return true
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [moments, search, typeFilter, statusFilter])

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    moments.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [moments])

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map(month => ({
      name: month,
      celebrated: moments.filter(m => m.status === 'celebrated' && new Date(m.date).toLocaleDateString('en', { month: 'short' }) === month).length,
      upcoming: moments.filter(m => m.status === 'upcoming' && new Date(m.date).toLocaleDateString('en', { month: 'short' }) === month).length,
    }))
  }, [moments])

  const handleSubmit = () => {
    if (!form.employee_id || !form.title || !form.date) return
    addMoment(form)
    setShowAddModal(false)
    setForm({ employee_id: '', type: 'birthday', title: '', description: '', date: '', visibility: 'public', celebration_type: 'auto_message' })
  }

  const handleAcknowledge = (id: string) => {
    acknowledgeMoment(id, currentEmployeeId)
  }

  const tabs = [
    { id: 'timeline', label: 'Timeline', count: moments.length },
    { id: 'today', label: 'Today', count: todayMoments.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingMoments.length },
    { id: 'analytics', label: 'Analytics' },
  ]

  const displayMoments = activeTab === 'today' ? todayMoments :
    activeTab === 'upcoming' ? upcomingMoments : filtered

  const employeeOptions = useMemo(() =>
    [{ value: '', label: 'Select employee...' }, ...(employees || []).map((emp: any) => ({ value: emp.id, label: emp.profile?.full_name || emp.id }))],
  [employees])

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Moments That Matter"
        subtitle="Celebrate and acknowledge the meaningful moments in your people's lives"
        actions={
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus size={16} /> Add Moment
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Moments" value={todayMoments.length} icon={<PartyPopper size={20} />} />
        <StatCard label="Upcoming" value={upcomingMoments.length} icon={<Calendar size={20} />} />
        <StatCard label="Celebrated" value={celebratedCount} icon={<CheckCircle size={20} />} />
        <StatCard label="Acknowledgements" value={totalAcknowledgements} icon={<ThumbsUp size={20} />} />
      </div>

      {todayMoments.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-orange-600" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">Today&apos;s Spotlight</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayMoments.map(m => (
                <div key={m.id} className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-orange-100 dark:border-orange-900/50">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', MOMENT_COLORS[m.type])}>
                      {MOMENT_ICONS[m.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{getEmployeeName(m.employee_id)}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAcknowledge(m.id)}>
                          <ThumbsUp size={12} /> Celebrate
                        </Button>
                        <span className="text-xs text-muted-foreground">{m.acknowledged_by?.length || 0} celebrated</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab !== 'analytics' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search moments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} />
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
          </div>

          <div className="space-y-4">
            {displayMoments.length === 0 ? (
              <Card className="p-12 text-center">
                <PartyPopper size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No moments found</p>
              </Card>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
                {displayMoments.map(m => {
                  const isAcked = m.acknowledged_by?.includes(currentEmployeeId)
                  return (
                    <div key={m.id} className="relative flex gap-4 mb-4">
                      <div className="hidden md:flex flex-col items-center">
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center z-10 border-2 border-white dark:border-slate-900 shadow-sm', MOMENT_COLORS[m.type])}>
                          {MOMENT_ICONS[m.type]}
                        </div>
                      </div>
                      <Card className="flex-1 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedMoment(m)}>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center md:hidden', MOMENT_COLORS[m.type])}>
                                {MOMENT_ICONS[m.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm">{m.title}</h4>
                                  <Badge variant={STATUS_BADGE[m.status]?.variant || 'info'}>
                                    {STATUS_BADGE[m.status]?.label || m.status}
                                  </Badge>
                                  <Badge variant="info">
                                    {m.type.replace(/_/g, ' ')}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Avatar name={getEmployeeName(m.employee_id)} size="xs" />
                                  <span className="text-sm text-muted-foreground">{getEmployeeName(m.employee_id)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(m.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {m.acknowledged_by?.length > 0 && (
                                <span className="text-xs text-muted-foreground">{m.acknowledged_by.length} celebrated</span>
                              )}
                              {!isAcked && m.status !== 'missed' && (
                                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={(e) => { e.stopPropagation(); handleAcknowledge(m.id) }}>
                                  <ThumbsUp size={12} /> Celebrate
                                </Button>
                              )}
                              {isAcked && (
                                <Badge variant="success" className="gap-1">
                                  <CheckCircle size={12} /> Celebrated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Moments by Type</CardTitle></CardHeader>
            <div className="p-4">
              <TempoDonutChart data={typeDistribution} height={250} />
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Monthly Moments</CardTitle></CardHeader>
            <div className="p-4">
              <TempoBarChart
                data={monthlyData}
                bars={[
                  { dataKey: 'celebrated', name: 'Celebrated', color: CHART_COLORS.emerald },
                  { dataKey: 'upcoming', name: 'Upcoming', color: CHART_COLORS.amber },
                ]}
                xKey="name"
                height={250}
              />
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Celebration Summary</CardTitle></CardHeader>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(
                  moments.reduce((acc, m) => {
                    const label = m.celebration_type.replace(/_/g, ' ')
                    acc[label] = (acc[label] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedMoment} title={selectedMoment?.title} onClose={() => setSelectedMoment(null)}>
        {selectedMoment && (
          <div className="space-y-4">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto', MOMENT_COLORS[selectedMoment.type])}>
              {MOMENT_ICONS[selectedMoment.type]}
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{selectedMoment.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{getEmployeeName(selectedMoment.employee_id)}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedMoment.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <p className="text-sm">{selectedMoment.description}</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Celebration: {selectedMoment.celebration_type.replace(/_/g, ' ')}</span>
              <span>Visibility: {selectedMoment.visibility.replace(/_/g, ' ')}</span>
            </div>
            {selectedMoment.acknowledged_by?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Celebrated by ({selectedMoment.acknowledged_by.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMoment.acknowledged_by.map((id: string) => (
                    <div key={id} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1">
                      <Avatar name={getEmployeeName(id)} size="xs" />
                      <span className="text-xs">{getEmployeeName(id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {!selectedMoment.acknowledged_by?.includes(currentEmployeeId) && (
                <Button className="flex-1 gap-2" onClick={() => { handleAcknowledge(selectedMoment.id); setSelectedMoment({ ...selectedMoment, acknowledged_by: [...(selectedMoment.acknowledged_by || []), currentEmployeeId] }) }}>
                  <ThumbsUp size={16} /> Celebrate
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedMoment(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal open={showAddModal} title="Add a Moment That Matters" onClose={() => setShowAddModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Employee</label>
            <Select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} options={employeeOptions} />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={MOMENT_TYPE_OPTIONS} />
          </div>
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., 5-Year Work Anniversary" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add a personal message..." rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Visibility</label>
              <Select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} options={VISIBILITY_OPTIONS} />
            </div>
            <div>
              <label className="text-sm font-medium">Celebration</label>
              <Select value={form.celebration_type} onChange={e => setForm(f => ({ ...f, celebration_type: e.target.value }))} options={CELEBRATION_OPTIONS} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>Create Moment</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
