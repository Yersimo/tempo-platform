'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { allModuleSlugs } from '@/lib/docs/registry'
import { DOC_GROUP_LABELS } from '@/lib/docs/types'
import { ArrowRight } from 'lucide-react'
import {
  LayoutDashboard, Users, Wallet, Shield, Briefcase, MessageSquare,
  TrendingUp, Banknote, GraduationCap, HeartPulse, UserCheck, UserMinus,
  FileText, Clock, Receipt, Plane, Globe, ShieldCheck, Cloud, Laptop,
  AppWindow, KeyRound, Lock, Store, PieChart, CreditCard, CircleDollarSign,
  FolderKanban, Compass, UserPlus, Zap, BarChart3, FileSignature, Blocks,
  FlaskConical, Network, Code, Settings, BookOpen,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Users, Wallet, Shield, Briefcase, MessageSquare,
  TrendingUp, Banknote, GraduationCap, HeartPulse, UserCheck, UserMinus,
  FileText, Clock, Receipt, Plane, Globe, ShieldCheck, Cloud, Laptop,
  AppWindow, KeyRound, Lock, Store, PieChart, CreditCard, CircleDollarSign,
  FolderKanban, Compass, UserPlus, Zap, BarChart3, FileSignature, Blocks,
  FlaskConical, Network, Code, Settings, BookOpen,
}

interface DocRelatedModulesProps {
  slugs: string[]
  className?: string
}

export function DocRelatedModules({ slugs, className }: DocRelatedModulesProps) {
  const modules = slugs
    .map((slug) => allModuleSlugs.find((m) => m.slug === slug))
    .filter(Boolean) as typeof allModuleSlugs

  if (modules.length === 0) return null

  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin',
        className
      )}
    >
      {modules.map((mod) => {
        const IconComponent = iconMap[mod.icon] || BookOpen

        return (
          <Link
            key={mod.slug}
            href={`/help/${mod.slug}`}
            className={cn(
              'group flex-shrink-0 w-52 bg-card border border-border rounded-[var(--radius-card)] p-4',
              'hover:shadow-md hover:border-tempo-200 transition-all'
            )}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-tempo-50 text-tempo-600 flex items-center justify-center flex-shrink-0">
                <IconComponent size={14} />
              </div>
              <h4 className="text-sm font-semibold text-t1 truncate">
                {mod.title}
              </h4>
            </div>
            <p className="text-[0.65rem] text-t3 mb-2">
              {DOC_GROUP_LABELS[mod.group]}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-tempo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View docs
              <ArrowRight size={12} />
            </span>
          </Link>
        )
      })}
    </div>
  )
}
