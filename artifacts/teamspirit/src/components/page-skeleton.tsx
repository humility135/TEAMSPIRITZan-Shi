import { Skeleton } from "@/components/ui/skeleton";

function SidebarSkeleton() {
  return (
    <div className="hidden md:flex flex-col gap-4 p-4 w-56">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex min-h-screen">
      <SidebarSkeleton />
      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`flex items-end gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-36'} rounded-xl`} />
          </div>
        </div>
      ))}
    </div>
  );
}
