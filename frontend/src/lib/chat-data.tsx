import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

// ============ Types ============
export type ChatUser = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  online?: boolean;
  lastSeen?: string;
};

export type ChatAttachment =
  | { kind: "image"; url: string; name?: string }
  | { kind: "file"; url: string; name: string; size?: string }
  | { kind: "link"; url: string; title: string; description?: string; image?: string };

export type ChatMessage = {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO
  attachments?: ChatAttachment[];
  replyToId?: string;
  edited?: boolean;
  reactions?: { emoji: string; by: string[] }[];
  status?: "sending" | "sent" | "delivered" | "read";
  pinned?: boolean;
};

export type Conversation = {
  id: string;
  participantIds: string[]; // other user ids (1:1 for now)
  lastMessageId?: string;
  unread: number;
  typing?: boolean;
  pinned?: boolean;
  muted?: boolean;
};

// ============ Mocks removed for live backend ============
const AV = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;
const BASE = Date.now();

// ============ Store ============
type Ctx = {
  currentUserId: string;
  users: ChatUser[];
  conversations: Conversation[];
  messages: ChatMessage[];
  totalUnread: number;
  getUser: (id: string) => ChatUser | undefined;
  getMessage: (id: string) => ChatMessage | undefined;
  getMessagesFor: (cid: string) => ChatMessage[];
  getConversation: (cid: string) => Conversation | undefined;
  sendMessage: (
    conversationId: string,
    payload: { content: string; attachments?: ChatAttachment[]; replyToId?: string },
  ) => Promise<void>;
  markRead: (conversationId: string) => void;
  react: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, content: string) => void;
  pinMessage: (messageId: string) => void;
  startConversation: (userId: string) => string;
};

const ChatCtx = createContext<Ctx | null>(null);

export function ChatDataProvider({ children }: { children: ReactNode }) {
  const { user: authUser, token } = useAuth();
  const currentUserId = authUser?.id || "you";
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);

  // Live Sync
  useEffect(() => {
    if (!token) return;
    const fetchLiveChat = async () => {
      try {
        const res = await api.get<any>("/chat/conversations", { token });
        if (res.success && res.conversations) {
          const backendConvs = res.conversations;
          
          const newConvs: Conversation[] = [];
          const newUsers: Record<string, ChatUser> = {};
          let allMsgs: ChatMessage[] = [];
          
          const seenParticipants = new Set<string>();
          const seenMsgIds = new Set<string>();

          for (const c of backendConvs) {
             const others = c.members.filter((m: any) => m.userId !== currentUserId);
             const otherIdsStr = others.map((o: any) => o.userId).sort().join(",");
             
             // Deduplicate 1-on-1 conversations to fix race condition duplicates
             if (others.length === 1) {
               if (seenParticipants.has(otherIdsStr)) continue;
               seenParticipants.add(otherIdsStr);
             }

             for (const m of others) {
               newUsers[m.userId] = {
                 id: m.userId,
                 username: m.user.fullName?.toLowerCase().replace(/\s/g, "") || "dev",
                 name: m.user.fullName || "Developer",
                 avatar: m.user.avatarUrl || AV(m.userId),
                 online: !!m.user.online
               };
             }
             
             newConvs.push({
               id: c.id,
               participantIds: others.map((o: any) => o.userId),
               unread: 0,
               lastMessageId: c.messages?.[0]?.id
             });
             
             // Fetch messages sequentially for simplicity in mock integration
             try {
               const msgRes = await api.get<any>(`/chat/conversations/${c.id}/messages`, { token });
               if (msgRes.success) {
                 for (const m of msgRes.messages) {
                   if (!seenMsgIds.has(m.id)) {
                     seenMsgIds.add(m.id);
                     allMsgs.push({
                       id: m.id,
                       conversationId: c.id,
                       authorId: m.senderId,
                       content: m.content,
                       createdAt: m.createdAt,
                       status: "read"
                     });
                   }
                 }
               }
             } catch (e) {}
          }
          
          setConversations(newConvs);
          setUsers(Object.values(newUsers));
          setMessages(allMsgs);
        }
      } catch (err) {
         console.error("Failed to load live chat", err);
      }
    };
    
    fetchLiveChat();
    const timer = setInterval(fetchLiveChat, 3000); // 3s polling since no WS client
    return () => clearInterval(timer);
  }, [token, currentUserId]);

  const value = useMemo<Ctx>(() => {
    const messagesByConv = new Map<string, ChatMessage[]>();
    for (const m of messages) {
      const arr = messagesByConv.get(m.conversationId) ?? [];
      arr.push(m);
      messagesByConv.set(m.conversationId, arr);
    }

    return {
      currentUserId,
      users,
      conversations,
      messages,
      totalUnread: conversations.reduce((s, c) => s + (c.muted ? 0 : c.unread), 0),
      getUser: (id) => {
        if (id === currentUserId) return { id: currentUserId, username: "you", name: authUser?.fullName || "You", avatar: authUser?.avatarUrl || AV(currentUserId) };
        const found = users.find((u) => u.id === id);
        if (found) return found;
        return { id, username: "user", name: "Developer", avatar: AV(id), online: true };
      },
      getMessage: (id) => messages.find((m) => m.id === id),
      getMessagesFor: (cid) => messagesByConv.get(cid) ?? [],
      getConversation: (cid) => conversations.find((c) => c.id === cid),
      sendMessage: async (conversationId, { content }) => {
        const id = `m_${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          { id, conversationId, authorId: currentUserId, content, createdAt: new Date().toISOString(), status: "sending" },
        ]);
        
        if (token) {
          try {
            await api.post<any>('/chat/messages', { conversationId, content, type: 'TEXT' }, { token });
          } catch (err) {}
        }
      },
      markRead: () => {},
      react: () => {},
      deleteMessage: () => {},
      editMessage: () => {},
      pinMessage: () => {},
      startConversation: (userId) => {
        const existing = conversations.find((c) => c.participantIds.includes(userId));
        return existing ? existing.id : `c_${Date.now()}`;
      },
    };
  }, [conversations, messages, users, currentUserId, authUser, token]);

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

export function useChatData() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChatData must be used within ChatDataProvider");
  return ctx;
}

// Safe hook that returns 0 unread if provider missing (for nav badges before mount)
export function useChatUnread(): number {
  const ctx = useContext(ChatCtx);
  return ctx?.totalUnread ?? 0;
}

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date(BASE);
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  const days = Math.floor(diff / 86400);
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date(BASE);
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "Today";
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function useCurrentBase(): number { return BASE; }
