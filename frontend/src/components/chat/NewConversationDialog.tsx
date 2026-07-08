import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatData } from "@/lib/chat-data";

export function NewConversationDialog({
  open, onOpenChange, onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (conversationId: string) => void;
}) {
  const { users, startConversation } = useChatData();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(s) || u.username.toLowerCase().includes(s));
  }, [users, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-border bg-surface">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>Start a conversation</DialogTitle>
        </DialogHeader>
        <div className="px-5 pt-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border-strong focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <div className="max-h-80 overflow-y-auto px-2 pb-3 pt-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No people found.</div>
          ) : (
            <ul>
              {filtered.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => onSelect(startConversation(u.id))}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-accent ring-focus"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={u.avatar} alt="" />
                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                      </Avatar>
                      {u.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{u.name}</div>
                      <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
