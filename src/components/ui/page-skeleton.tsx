import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton'

export function PageSkeleton({ cards = 4, tableRows = 5 }: { cards?: number; tableRows?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={tableRows} />
    </div>
  )
}
