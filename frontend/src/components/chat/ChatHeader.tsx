import { ArrowLeft, Info, MoreHorizontal, Phone, Search, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatChatTime, useChatData } from "@/lib/chat-data";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatHeader({
  conversationId,
  onBack,
  onToggleInfo,
}: {
  conversationId: string;
  onBack?: () => void;
  onToggleInfo?: () => void;
}) {
  const { getConversation, getUser } = useChatData();
  const conv = getConversation(conversationId);
  const other = conv ? getUser(conv.participantIds[0]) : undefined;
  if (!other) return null;

  const status = other.online
    ? "Online"
    : other.lastSeen ? `Last seen ${formatChatTime(other.lastSeen)}` : "Offline";

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-3 sm:px-4 glass">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition hover:bg-accent lg:hidden ring-focus"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={other.avatar} alt="" />
          <AvatarFallback>{other.name[0]}</AvatarFallback>
        </Avatar>
        {other.online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{other.name}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {other.online && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          <span className="truncate">{conv?.typing ? "typing…" : status}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <IconBtn label="Search in conversation"><Search className="h-4 w-4" /></IconBtn>
        <IconBtn label="Start voice call" className="hidden sm:grid"><Phone className="h-4 w-4" /></IconBtn>
        <IconBtn label="Start video call" className="hidden sm:grid"><Video className="h-4 w-4" /></IconBtn>
        <IconBtn label="Conversation info" onClick={onToggleInfo} className="hidden lg:grid">
          <Info className="h-4 w-4" />
        </IconBtn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More"
              className="grid h-9 w-9 place-items-center rounded-lg transition hover:bg-accent ring-focus"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Mute notifications</DropdownMenuItem>
            <DropdownMenuItem>Search messages</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function IconBtn({
  children, label, onClick, className,
}: { children: React.ReactNode; label: string; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg transition hover:bg-accent ring-focus ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
