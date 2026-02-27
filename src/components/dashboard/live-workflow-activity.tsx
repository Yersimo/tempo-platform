'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Zap, CheckCircle2, XCircle, Loader2, ChevronRight, Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function durationStr(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt)
  const end = completedAt ? new Date(completedAt) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '<1m'
  if (diffMins < 60) return `${diffMins}m`
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return `${hours}h ${mins}m`
}

export function LiveWorkflowActivity() {
  const { workflows, workflowRuns } = useTempo()
  const router = useRouter()
  const t = useTranslations('dashboard')

  // Get 5 most recent workflow runs sorted by started_at
  const recentRuns = useMemo(() => {
    return [...workflowRuns]
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, 5)
      .map(run => {
        const workflow = workflows.find(w => w.id === run.workflow_id)
        return { ...run, workflowTitle: workflow?.title || 'Unknown Workflow' }
      })
  }, [workflowRuns, workflows])

  const runningCount = recentRuns.filter(r => r.status === 'running').length

  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-tempo-600" />
            <CardTitle>{t('liveActivity')}</CardTitle>
            {runningCount > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[0.65rem] font-medium text-green-600">{runningCount} running</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/workflow-studio')}>
            View Studio <ChevronRight size={14} />
          </Button>
        </div>
      </CardHeader>
      <div className="divide-y divide-divider">
        {recentRuns.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Zap size={24} className="mx-auto text-t3 mb-2" />
            <p className="text-sm text-t3">No recent workflow runs</p>
          </div>
        ) : (
          recentRuns.map(run => (
            <div
              key={run.id}
              onClick={() => router.push('/workflow-studio')}
              role="link"
              className="px-6 py-3 flex items-center gap-3 hover:bg-canvas/50 transition-colors cursor-pointer"
            >
              {/* Status indicator */}
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                run.status === 'running' ? 'bg-green-50 text-green-600' :
                run.status === 'completed' ? 'bg-gray-50 text-gray-500' :
                run.status === 'failed' ? 'bg-red-50 text-red-500' :
                'bg-gray-50 text-gray-400'
              )}>
                {run.status === 'running' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : run.status === 'completed' ? (
                  <CheckCircle2 size={16} />
                ) : run.status === 'failed' ? (
                  <XCircle size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-medium text-t1 truncate">{run.workflowTitle}</p>
                  <Badge variant={
                    run.status === 'running' ? 'success' :
                    run.status === 'completed' ? 'default' :
                    run.status === 'failed' ? 'error' :
                    'default'
                  }>
                    {run.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[0.65rem] text-t3">
                  <span>{(run.context as unknown as Record<string, string>)?.employee_name || 'System'}</span>
                  <span>·</span>
                  <span>{durationStr(run.started_at, run.completed_at)}</span>
                  <span>·</span>
                  <span>{timeAgo(run.started_at)}</span>
                </div>
              </div>

              <ChevronRight size={14} className="text-t3 flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
