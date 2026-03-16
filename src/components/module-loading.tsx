'use client'

import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui/skeleton'

interface ModuleLoadingProps {
  variant?: 'dashboard' | 'table' | 'cards' | 'detail' | 'form' | 'analytics'
}

/** Page-level loading skeleton shown while module data hydrates */
export function ModuleLoading({ variant = 'table' }: ModuleLoadingProps) {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-3">
          <Skeleton className="w-14 h-3" />
          <Skeleton className="w-3 h-3" />
          <Skeleton className="w-20 h-3" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="w-48 h-6 mb-1" />
            <Skeleton className="w-64 h-3" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-8 h-8" />
          </div>
        </div>
      </div>

      {variant === 'dashboard' && <DashboardSkeleton />}
      {variant === 'table' && <TableSkeleton />}
      {variant === 'cards' && <CardsSkeleton />}
      {variant === 'detail' && <DetailSkeleton />}
      {variant === 'form' && <FormSkeleton />}
      {variant === 'analytics' && <AnalyticsSkeleton />}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      {/* Table */}
      <SkeletonTable rows={5} columns={5} />
    </>
  )
}

function TableSkeleton() {
  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-lg" />
        ))}
      </div>
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* AI banner */}
      <Skeleton className="h-16 mb-4" />
      {/* Table */}
      <SkeletonTable rows={8} columns={6} />
    </>
  )
}

function CardsSkeleton() {
  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-lg" />
        ))}
      </div>
      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </>
  )
}

function DetailSkeleton() {
  return (
    <>
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-16 h-16" />
        <div>
          <Skeleton className="w-40 h-5 mb-2" />
          <Skeleton className="w-28 h-3 mb-1" />
          <Skeleton className="w-48 h-3" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-lg" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={5} columns={4} />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </>
  )
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mb-6">
          <Skeleton className="w-24 h-3 mb-2" />
          <Skeleton className="w-full h-10" />
        </div>
      ))}
      <div className="flex gap-3 mt-8">
        <Skeleton className="w-24 h-10" />
        <Skeleton className="w-20 h-10" />
      </div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-28 h-9 rounded-lg" />
        ))}
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </>
  )
}
