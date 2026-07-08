export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="Typing"
      className="flex items-center gap-1 rounded-2xl border border-border bg-surface px-3 py-2.5"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  );
}
