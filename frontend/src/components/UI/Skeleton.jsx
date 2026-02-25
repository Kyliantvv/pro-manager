export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton rounded-lg bg-[var(--color-border)] ${className}`} />
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="surface rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[0,1,2].map(i => <Skeleton key={i} className="w-7 h-7 rounded-full ring-2 ring-[var(--color-surface)]" />)}
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="surface rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
      </div>
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 h-full">
      {[0,1,2,3].map(col => (
        <div key={col} className="flex-1 min-w-[260px] space-y-3">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : col === 2 ? 2 : 1 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ))}
    </div>
  )
}
