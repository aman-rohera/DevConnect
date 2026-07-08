import { useEffect, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  formatDateSeparator, useChatData, type ChatMessage,
} from "@/lib/chat-data";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageSquare } from "lucide-react";

export function MessageList({
  conversationId,
  onReply,
  onEdit,
}: {
  conversationId: string;
  onReply: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
}) {
  const { getMessagesFor, currentUserId, getUser, getConversation } = useChatData();
  const messages = getMessagesFor(conversationId);
  const conv = getConversation(conversationId);
  const other = conv ? getUser(conv.participantIds[0]) : undefined;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, conversationId, conv?.typing]);

  // Group by day + author sequences
  const groups = useMemo(() => {
    const g: { day: string; items: { isMine: boolean; author: string; msgs: ChatMessage[] }[] }[] = [];
    let currentDay = "";
    let currentGroup: { day: string; items: { isMine: boolean; author: string; msgs: ChatMessage[] }[] } | null = null;
    let lastAuthor = "";
    for (const m of messages) {
      const day = new Date(m.createdAt).toDateString();
      if (day !== currentDay) {
        currentDay = day;
        currentGroup = { day: m.createdAt, items: [] };
        g.push(currentGroup);
        lastAuthor = "";
      }
      const isMine = m.authorId === currentUserId;
      if (m.authorId !== lastAuthor) {
        currentGroup!.items.push({ isMine, author: m.authorId, msgs: [m] });
        lastAuthor = m.authorId;
      } else {
        currentGroup!.items[currentGroup!.items.length - 1].msgs.push(m);
      }
    }
    return g;
  }, [messages, currentUserId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">Say hello{other ? ` to ${other.name.split(" ")[0]}` : ""}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            This is the beginning of your conversation. Messages are frontend only for now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 space-y-6">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-4">
            <DateDivider iso={group.day} />
            {group.items.map((seq, si) => {
              const author = getUser(seq.author);
              return (
                <div key={si} className={cn("flex items-end gap-2", seq.isMine && "flex-row-reverse")}>
                  {!seq.isMine && (
                    <Avatar className="h-8 w-8 shrink-0 border border-border">
                      <AvatarImage src={author?.avatar} alt="" />
                      <AvatarFallback>{author?.name?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("flex min-w-0 flex-col gap-1", seq.isMine ? "items-end" : "items-start")}>
                    {seq.msgs.map((m, mi) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        isMine={seq.isMine}
                        isFirst={mi === 0}
                        isLast={mi === seq.msgs.length - 1}
                        onReply={onReply}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {conv?.typing && other && (
          <div className="flex items-end gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={other.avatar} alt="" />
              <AvatarFallback>{other.name[0]}</AvatarFallback>
            </Avatar>
            <TypingIndicator />
          </div>
        )}
      </div>
    </div>
  );
}

function DateDivider({ iso }: { iso: string }) {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <span className="relative rounded-full border border-border bg-background px-3 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {formatDateSeparator(iso)}
      </span>
    </div>
  );
}
