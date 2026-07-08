import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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

// ============ Mock data ============
const AV = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;
const BASE = new Date("2026-07-03T12:00:00Z").getTime();
const ago = (mins: number) => new Date(BASE - mins * 60_000).toISOString();

const users: ChatUser[] = [
  { id: "u2", username: "sarah", name: "Sarah Chen", avatar: AV("sarah"), online: true },
  { id: "u3", username: "kenji", name: "Kenji Watanabe", avatar: AV("kenji"), online: false, lastSeen: ago(35) },
  { id: "u4", username: "priya", name: "Priya Patel", avatar: AV("priya"), online: true },
  { id: "u5", username: "marco", name: "Marco Rossi", avatar: AV("marco"), online: false, lastSeen: ago(240) },
  { id: "u6", username: "amelia", name: "Amelia Johnson", avatar: AV("amelia"), online: true },
];

const initialConversations: Conversation[] = [
  { id: "c1", participantIds: ["u2"], lastMessageId: "m1_5", unread: 2, typing: true, pinned: true },
  { id: "c2", participantIds: ["u3"], lastMessageId: "m2_3", unread: 0 },
  { id: "c3", participantIds: ["u6"], lastMessageId: "m3_4", unread: 1 },
  { id: "c4", participantIds: ["u5"], lastMessageId: "m4_2", unread: 0 },
  { id: "c5", participantIds: ["u4"], lastMessageId: "m5_1", unread: 0, muted: true },
];

const initialMessages: ChatMessage[] = [
  // c1 - Sarah
  { id: "m1_1", conversationId: "c1", authorId: "u2", content: "hey! did you catch the new command menu ship? 🚀", createdAt: ago(60 * 26), status: "read" },
  { id: "m1_2", conversationId: "c1", authorId: "you", content: "yes it feels *instant* now. what did you do?", createdAt: ago(60 * 25), status: "read" },
  { id: "m1_3", conversationId: "c1", authorId: "u2", content: "moved fuzzy search into a worker + preloaded the top 200 results. tokens matter.", createdAt: ago(60 * 25), status: "read" },
  { id: "m1_4", conversationId: "c1", authorId: "u2", content: "here's the before/after", createdAt: ago(60 * 24), status: "read",
    attachments: [{ kind: "image", url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1200&q=80" }] },
  { id: "m1_5", conversationId: "c1", authorId: "u2", content: "sending you the writeup tomorrow ✨", createdAt: ago(6), status: "delivered" },
  // c2 - Kenji
  { id: "m2_1", conversationId: "c2", authorId: "u3", content: "postgres replica is back green ✅", createdAt: ago(60 * 8), status: "read" },
  { id: "m2_2", conversationId: "c2", authorId: "you", content: "legend. thanks for staying late.", createdAt: ago(60 * 8), status: "read" },
  { id: "m2_3", conversationId: "c2", authorId: "u3", content: "we should schedule a post-mortem. maybe fri?", createdAt: ago(60 * 7), status: "read" },
  // c3 - Amelia
  { id: "m3_1", conversationId: "c3", authorId: "u6", content: "got a minute to look at these eval results?", createdAt: ago(60 * 3), status: "read" },
  { id: "m3_2", conversationId: "c3", authorId: "u6", content: "", createdAt: ago(60 * 3), status: "read",
    attachments: [{ kind: "file", url: "#", name: "eval-run-v42.json", size: "1.2 MB" }] },
  { id: "m3_3", conversationId: "c3", authorId: "you", content: "reading now — the accuracy dip on multi-turn is interesting", createdAt: ago(60 * 2), status: "read" },
  { id: "m3_4", conversationId: "c3", authorId: "u6", content: "🎯", createdAt: ago(45), status: "delivered" },
  // c4 - Marco
  { id: "m4_1", conversationId: "c4", authorId: "u5", content: "check this out", createdAt: ago(60 * 20), status: "read",
    attachments: [{ kind: "link", url: "https://vitejs.dev", title: "Vite | Next Generation Frontend Tooling", description: "Get ready for a development environment that can finally catch up with you." }] },
  { id: "m4_2", conversationId: "c4", authorId: "you", content: "underrated. i've been using it for the new dev-server", createdAt: ago(60 * 19), status: "read" },
  // c5 - Priya
  { id: "m5_1", conversationId: "c5", authorId: "u4", content: "coffee next week? ☕", createdAt: ago(60 * 72), status: "read" },
];

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
  ) => void;
  markRead: (conversationId: string) => void;
  react: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, content: string) => void;
  pinMessage: (messageId: string) => void;
  startConversation: (userId: string) => string;
};

const ChatCtx = createContext<Ctx | null>(null);

export function ChatDataProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const currentUserId = "you";

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
      getUser: (id) => (id === currentUserId ? { id: "you", username: "you", name: "You", avatar: AV("you") } : users.find((u) => u.id === id)),
      getMessage: (id) => messages.find((m) => m.id === id),
      getMessagesFor: (cid) => messagesByConv.get(cid) ?? [],
      getConversation: (cid) => conversations.find((c) => c.id === cid),
      sendMessage: (conversationId, { content, attachments, replyToId }) => {
        const id = `m_${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id, conversationId, authorId: currentUserId, content,
            attachments, replyToId, createdAt: new Date().toISOString(), status: "sent",
          },
        ]);
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, lastMessageId: id } : c)),
        );
      },
      markRead: (conversationId) => {
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)));
      },
      react: (messageId, emoji) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions ?? [])];
            const idx = reactions.findIndex((r) => r.emoji === emoji);
            if (idx === -1) reactions.push({ emoji, by: [currentUserId] });
            else {
              const by = reactions[idx].by;
              reactions[idx] = {
                emoji,
                by: by.includes(currentUserId) ? by.filter((b) => b !== currentUserId) : [...by, currentUserId],
              };
            }
            return { ...m, reactions: reactions.filter((r) => r.by.length > 0) };
          }),
        );
      },
      deleteMessage: (messageId) => setMessages((prev) => prev.filter((m) => m.id !== messageId)),
      editMessage: (messageId, content) =>
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content, edited: true } : m))),
      pinMessage: (messageId) =>
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m))),
      startConversation: (userId) => {
        const existing = conversations.find((c) => c.participantIds.includes(userId));
        if (existing) return existing.id;
        const id = `c_${Date.now()}`;
        setConversations((prev) => [{ id, participantIds: [userId], unread: 0 }, ...prev]);
        return id;
      },
    };
  }, [conversations, messages]);

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
