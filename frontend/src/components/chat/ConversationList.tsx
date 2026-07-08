import { useMemo, useState } from "react";
import { Search, Plus, MessageSquare, BellOff, Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useChatData, formatChatTime, type Conversation } from "@/lib/chat-data";
import { EmptyState } from "@/components/ui/empty-state";
import { NewConversationDialog } from "./NewConversationDialog";

export function ConversationList({
  activeId,
  onSelect,
}: {
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const { conversations, getUser, getMessage } = useChatData();
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const am = a.lastMessageId ? getMessage(a.lastMessageId) : undefined;
      const bm = b.lastMessageId ? getMessage(b.lastMessageId) : undefined;
      return (bm?.createdAt ?? "").localeCompare(am?.createdAt ?? "");
    });
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter((c) => {
      const u = getUser(c.participantIds[0]);
      const last = c.lastMessageId ? getMessage(c.lastMessageId) : undefined;
      return u?.name.toLowerCase().includes(q) || u?.username.toLowerCase().includes(q) || last?.content.toLowerCase().includes(q);
    });
  }, [conversations, query, getUser, getMessage]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-base font-semibold tracking-tight">Messages</h2>
        <button
          onClick={() => setNewOpen(true)}
          aria-label="Start conversation"
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface transition hover:border-border-strong hover:bg-accent ring-focus"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-border-strong focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          query ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description={`We couldn't find anything for "${query}"`}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Start a new chat to see it here."
            />
          )
        ) : (
          <ul role="list" className="px-2 pb-4">
            {filtered.map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onClick={() => onSelect(c.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <NewConversationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onSelect={(cid) => { setNewOpen(false); onSelect(cid); }}
      />
    </div>
  );
}

function ConversationItem({
  conv, active, onClick,
}: { conv: Conversation; active: boolean; onClick: () => void }) {
  const { getUser, getMessage, currentUserId } = useChatData();
  const other = getUser(conv.participantIds[0]);
  const last = conv.lastMessageId ? getMessage(conv.lastMessageId) : undefined;
  if (!other) return null;
  const preview = last
    ? last.attachments?.[0]?.kind === "image"
      ? "📷 Photo"
      : last.attachments?.[0]?.kind === "file"
      ? `📎 ${(last.attachments[0] as { name: string }).name}`
      : last.content || "…"
    : "No messages yet";
  const prefix = last?.authorId === currentUserId ? "You: " : "";

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ring-focus",
          active ? "bg-accent" : "hover:bg-accent/50",
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="h-11 w-11 border border-border">
            <AvatarImage src={other.avatar} alt="" />
            <AvatarFallback>{other.name[0]}</AvatarFallback>
          </Avatar>
          {other.online && (
            <span
              aria-label="Online"
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{other.name}</span>
            {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />}
            {conv.muted && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
            <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
              {last ? formatChatTime(last.createdAt) : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className={cn(
              "truncate text-xs",
              conv.unread > 0 ? "text-foreground" : "text-muted-foreground",
            )}>
              {conv.typing ? (
                <span className="text-primary">typing…</span>
              ) : (
                <>{prefix}{preview}</>
              )}
            </p>
            {conv.unread > 0 && !conv.muted && (
              <span className="ml-auto grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-medium text-primary-foreground">
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
