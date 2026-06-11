// Reusable shimmer skeleton primitives.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/[0.06] ${className}`} />;
}

function Card({ children }: { children?: React.ReactNode }) {
  return <div className="card p-5">{children}</div>;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Skeleton className="h-4 w-28" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton className="h-2.5 w-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Skeleton className="h-4 w-24" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        </Card>
      </div>
      <Card>
        <Skeleton className="h-4 w-36" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
        </div>
      </Card>
    </div>
  );
}

export function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="card divide-y divide-white/[0.05] overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CampaignDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-2.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="flex min-h-[78vh] w-full max-w-4xl flex-1 flex-col">
      <div className="flex-1 space-y-7 py-6">
        {/* user bubble */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-64 rounded-2xl" />
        </div>
        {/* assistant block */}
        <div className="flex gap-4">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-28 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-40 rounded-2xl" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-3 h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
