import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatData, type ChatMessage } from "@/lib/chat-data";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { UserInfoPanel } from "@/components/chat/UserInfoPanel";

export const MessagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations, markRead } = useChatData();
  const [showInfo, setShowInfo] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);

  const activeId = searchParams.get("c") || conversations[0]?.id;

  useEffect(() => {
    if (activeId) markRead(activeId);
    setReplyTo(null);
    setEditing(null);
  }, [activeId, markRead]);

  const select = (id: string) => {
    setSearchParams({ c: id }, { replace: true });
  };
  
  const back = () => {
    setSearchParams({}, { replace: true });
  };

  // Mobile: show either list or chat
  const showChatOnMobile = !!searchParams.get("c");

  return (
    <div
      className={cn(
        "-mx-4 -my-6 sm:-my-8",
        "h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-3.5rem)]",
        "grid grid-cols-1 lg:grid-cols-[320px_1fr]",
        showInfo && "lg:grid-cols-[320px_1fr_300px]",
      )}
    >
      {/* Conversation list */}
      <div
        className={cn(
          "min-h-0 border-border bg-sidebar lg:border-r",
          showChatOnMobile ? "hidden lg:flex lg:flex-col" : "flex flex-col",
        )}
      >
        <ConversationList activeId={activeId} onSelect={select} />
      </div>

      {/* Chat panel */}
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col",
          !showChatOnMobile && "hidden lg:flex",
        )}
      >
        {activeId ? (
          <>
            <div className="flex items-center">
              <div className="flex-1">
                <ChatHeader
                  conversationId={activeId}
                  onBack={back}
                  onToggleInfo={() => setShowInfo((v) => !v)}
                />
              </div>
            </div>
            <MessageList
              conversationId={activeId}
              onReply={(m) => { setReplyTo(m); setEditing(null); }}
              onEdit={(m) => { setEditing(m); setReplyTo(null); }}
            />
            <MessageComposer
              conversationId={activeId}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              editing={editing}
              onCancelEdit={() => setEditing(null)}
            />
          </>
        ) : (
          <EmptyChatState />
        )}
      </div>

      {/* Info panel */}
      {showInfo && activeId && (
        <div className="hidden min-h-0 lg:block">
          <UserInfoPanel conversationId={activeId} />
        </div>
      )}
    </div>
  );
};

function EmptyChatState() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface shadow-elevated">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-gradient">Your messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a conversation from the list, or start a new one to begin chatting.
        </p>
      </div>
    </div>
  );
}

export default MessagesPage;
