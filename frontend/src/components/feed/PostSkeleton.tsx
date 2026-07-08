export function PostSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-40 rounded animate-shimmer" />
          <div className="h-3 w-24 rounded animate-shimmer" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded animate-shimmer" />
        <div className="h-3 w-5/6 rounded animate-shimmer" />
        <div className="h-3 w-3/5 rounded animate-shimmer" />
      </div>
    </div>
  );
}
