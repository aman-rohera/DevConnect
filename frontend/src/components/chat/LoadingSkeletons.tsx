export function ConversationListSkeleton() {
  return (
    <ul className="space-y-1 px-2 py-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted/70" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
      {[false, true, false, true, false].map((mine, i) => (
        <div key={i} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className={`h-10 animate-pulse rounded-2xl bg-muted ${mine ? "w-40" : "w-56"}`} />
        </div>
      ))}
    </div>
  );
}
