import { useState } from "react";
import {
  Check, CheckCheck, Copy, CornerUpLeft, Edit3, Forward, MoreHorizontal, Pin, Smile, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatData, type ChatMessage } from "@/lib/chat-data";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏", "🔥"];

function isEmojiOnly(str: string) {
  if (!str.trim()) return false;
  // Rough heuristic: no letters/digits, short-ish
  return !/\p{L}|\p{N}/u.test(str) && str.trim().length <= 12;
}

export function MessageBubble({
  message, isMine, isFirst, isLast, onReply, onEdit,
}: {
  message: ChatMessage;
  isMine: boolean;
  isFirst: boolean;
  isLast: boolean;
  onReply: (m: ChatMessage) => void;
  onEdit: (m: ChatMessage) => void;
}) {
  const { react, deleteMessage, pinMessage, getMessage, getUser } = useChatData();
  const [reactOpen, setReactOpen] = useState(false);

  const replyTo = message.replyToId ? getMessage(message.replyToId) : undefined;
  const replyAuthor = replyTo ? getUser(replyTo.authorId) : undefined;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "numeric", minute: "2-digit",
  });

  const emojiOnly = isEmojiOnly(message.content);
  const hasAttachments = !!message.attachments?.length;

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Message copied");
  };

  const radius = cn(
    "rounded-2xl",
    isMine
      ? cn(!isFirst && "rounded-tr-md", !isLast && "rounded-br-md")
      : cn(!isFirst && "rounded-tl-md", !isLast && "rounded-bl-md"),
  );

  return (
    <div className={cn("group/msg relative flex items-center gap-1.5", isMine && "flex-row-reverse")}>
      {/* Bubble */}
      <div className="max-w-[85%] sm:max-w-md">
        {message.pinned && (
          <div className={cn("mb-1 flex items-center gap-1 text-[10px] text-muted-foreground", isMine && "justify-end")}>
            <Pin className="h-2.5 w-2.5" /> Pinned
          </div>
        )}
        {emojiOnly && !hasAttachments ? (
          <div className={cn("text-4xl leading-tight", isMine && "text-right")}>{message.content}</div>
        ) : (
          <div
            className={cn(
              "relative px-3.5 py-2 text-sm shadow-sm",
              radius,
              isMine
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-surface text-foreground",
            )}
          >
            {replyTo && (
              <div className={cn(
                "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs",
                isMine ? "border-primary-foreground/40 bg-primary-foreground/10" : "border-primary/60 bg-accent/60",
              )}>
                <div className={cn("font-medium", isMine ? "text-primary-foreground/90" : "text-foreground")}>
                  {replyAuthor?.name ?? "Unknown"}
                </div>
                <div className={cn("truncate", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {replyTo.content || "Attachment"}
                </div>
              </div>
            )}

            {message.attachments?.map((att, i) => (
              <div key={i} className={cn(message.content && "mb-2")}>
                {att.kind === "image" && (
                  <img
                    src={att.url}
                    alt={att.name ?? ""}
                    className="max-h-80 w-full rounded-lg border border-border object-cover"
                    loading="lazy"
                  />
                )}
                {att.kind === "file" && (
                  <a
                    href={att.url}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5",
                      isMine ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background",
                    )}
                  >
                    <div className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-md",
                      isMine ? "bg-primary-foreground/20" : "bg-accent",
                    )}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{att.name}</div>
                      {att.size && <div className={cn("text-[10px]", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>{att.size}</div>}
                    </div>
                  </a>
                )}
                {att.kind === "link" && (
                  <a href={att.url} target="_blank" rel="noopener noreferrer"
                     className={cn(
                       "block overflow-hidden rounded-lg border",
                       isMine ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background",
                     )}
                  >
                    {att.image && <img src={att.image} alt="" className="h-28 w-full object-cover" />}
                    <div className="p-2.5">
                      <div className="truncate text-xs font-semibold">{att.title}</div>
                      {att.description && (
                        <div className={cn("mt-0.5 line-clamp-2 text-[11px]", isMine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {att.description}
                        </div>
                      )}
                    </div>
                  </a>
                )}
              </div>
            ))}

            {message.content && (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            )}

            <div className={cn(
              "mt-1 flex items-center gap-1 text-[10px]",
              isMine ? "justify-end text-primary-foreground/70" : "text-muted-foreground",
            )}>
              {message.edited && <span>edited</span>}
              <span>{time}</span>
              {isMine && (
                message.status === "read"
                  ? <CheckCheck className="h-3 w-3 text-sky-300" />
                  : message.status === "delivered"
                  ? <CheckCheck className="h-3 w-3" />
                  : <Check className="h-3 w-3" />
              )}
            </div>
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", isMine && "justify-end")}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => react(message.id, r.emoji)}
                className="flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[11px] transition hover:border-border-strong"
              >
                <span>{r.emoji}</span>
                <span className="font-mono text-muted-foreground">{r.by.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions (hover) */}
      <div className={cn(
        "flex items-center gap-0.5 opacity-0 transition group-hover/msg:opacity-100",
      )}>
        <Popover open={reactOpen} onOpenChange={setReactOpen}>
          <PopoverTrigger asChild>
            <button aria-label="React" className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background hover:bg-accent ring-focus">
              <Smile className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" side="top" align={isMine ? "end" : "start"}>
            <div className="flex gap-0.5">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => { react(message.id, e); setReactOpen(false); }}
                  className="grid h-8 w-8 place-items-center rounded-md text-base transition hover:bg-accent"
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <button
          aria-label="Reply"
          onClick={() => onReply(message)}
          className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background hover:bg-accent ring-focus"
        >
          <CornerUpLeft className="h-3.5 w-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="More" className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background hover:bg-accent ring-focus">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMine ? "end" : "start"} className="w-40">
            <DropdownMenuItem onClick={copy}><Copy className="mr-2 h-3.5 w-3.5" /> Copy</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReply(message)}><CornerUpLeft className="mr-2 h-3.5 w-3.5" /> Reply</DropdownMenuItem>
            <DropdownMenuItem><Forward className="mr-2 h-3.5 w-3.5" /> Forward</DropdownMenuItem>
            <DropdownMenuItem onClick={() => pinMessage(message.id)}>
              <Pin className="mr-2 h-3.5 w-3.5" /> {message.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            {isMine && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(message)}>
                  <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteMessage(message.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
