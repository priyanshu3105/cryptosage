export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse-soft rounded-md bg-muted ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="surface-card p-6">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-4 h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface-card flex items-center gap-4 p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end"><Skeleton className="h-10 w-48 rounded-2xl" /></div>
      <div className="flex justify-start"><Skeleton className="h-20 w-64 rounded-2xl" /></div>
      <div className="flex justify-end"><Skeleton className="h-10 w-36 rounded-2xl" /></div>
    </div>
  );
}
