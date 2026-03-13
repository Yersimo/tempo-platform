'use client'

import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Users, Wallet, Shield, Briefcase, MessageSquare,
  TrendingUp, Banknote, GraduationCap, HeartPulse, UserCheck, UserMinus,
  FileText, Clock, Receipt, Plane, Globe, ShieldCheck, Cloud, Laptop,
  AppWindow, KeyRound, Lock, Store, PieChart, CreditCard, CircleDollarSign,
  FolderKanban, Compass, UserPlus, Zap, BarChart3, FileSignature, Blocks,
  FlaskConical, Network, Code, Settings, BookOpen,
} from 'lucide-react'
import type { DocGroup } from '@/lib/docs/types'

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Users, Wallet, Shield, Briefcase, MessageSquare,
  TrendingUp, Banknote, GraduationCap, HeartPulse, UserCheck, UserMinus,
  FileText, Clock, Receipt, Plane, Globe, ShieldCheck, Cloud, Laptop,
  AppWindow, KeyRound, Lock, Store, PieChart, CreditCard, CircleDollarSign,
  FolderKanban, Compass, UserPlus, Zap, BarChart3, FileSignature, Blocks,
  FlaskConical, Network, Code, Settings, BookOpen,
}

interface DocModuleCardProps {
  slug: string
  title: string
  subtitle: string
  icon: string
  group: DocGroup
  workflowCount: number
  hasContent: boolean
  onClick: () => void
}

export function DocModuleCard({
  title,
  subtitle,
  icon,
  workflowCount,
  hasContent,
  onClick,
}: DocModuleCardProps) {
  const IconComponent = iconMap[icon] || BookOpen

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left bg-card border border-border rounded-[var(--radius-card)] p-5',
        'transition-all duration-150',
        hasContent
          ? 'hover:shadow-md hover:border-tempo-200 cursor-pointer'
          : 'opacity-60 cursor-default'
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
            hasContent
              ? 'bg-tempo-50 text-tempo-600'
              : 'bg-canvas text-t3'
          )}
        >
          <IconComponent size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-t1 truncate">
              {title}
            </h3>
            {!hasContent && (
              <span className="flex-shrink-0 text-[0.6rem] font-medium text-t3 bg-canvas border border-divider px-1.5 py-0.5 rounded-[var(--radius-pill)]">
                Coming soon
              </span>
            )}
          </div>
          <p className="text-xs text-t3 mt-0.5 line-clamp-2">{subtitle}</p>
          {hasContent && workflowCount > 0 && (
            <div className="mt-2.5">
              <Badge variant="orange">
                {workflowCount} workflow{workflowCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
