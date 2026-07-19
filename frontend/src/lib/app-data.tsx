import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

// ------------- Types -------------
export type User = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  cover?: string;
  bio: string;
  location?: string;
  company?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  skills: string[];
  followers: number;
  following: number;
  posts: number;
  verified?: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO
  tags: string[];
  image?: string;
  code?: { lang: string; source: string };
  likes: number;
  comments: number;
  shares: number;
  liked?: boolean;
  saved?: boolean;
};

export type Notification = {
  id: string;
  type: "like" | "comment" | "follow" | "mention";
  actorId: string;
  postId?: string;
  createdAt: string;
  read: boolean;
};

const AV = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;

// ------------- Store -------------
type Ctx = {
  currentUser: User | null;
  users: User[];
  posts: Post[];
  notifications: Notification[];
  following: Set<string>;
  createPost: (data: { content: string; tags: string[]; image?: string }) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
  getUser: (id: string) => User | undefined;
  getUserByUsername: (u: string) => User | undefined;
};

const AppDataCtx = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user: authUser, token } = useAuth();
  const authUserAny = authUser as any;
  
  const [users] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const currentUserId = authUserAny?.id || "you";

  const currentUser = useMemo<User | null>(() => {
    if (!authUserAny) return null;
    return {
      id: authUserAny.id,
      username: authUserAny.email?.split("@")[0] || "dev",
      name: authUserAny.fullName,
      avatar: authUserAny.avatarUrl || AV(authUserAny.id),
      bio: authUserAny.profile?.bio || "",
      location: authUserAny.profile?.location || "",
      website: authUserAny.profile?.website || "",
      skills: authUserAny.skills || [],
      followers: 0,
      following: 0,
      posts: 0,
    };
  }, [authUserAny]);

  // Live data sync
  useEffect(() => {
    if (!token) return;

    const syncData = async () => {
      try {
        const [feedRes, notifRes] = await Promise.all([
          api.get<any>("/posts/feed", { token }),
          api.get<any>("/notifications", { token })
        ]);

        if (feedRes.success && feedRes.posts) {
          setPosts(feedRes.posts.map((p: any) => ({
            id: p.id,
            authorId: p.userId,
            content: p.content,
            createdAt: p.createdAt,
            tags: p.tags || [],
            image: p.imageUrl || undefined,
            likes: p._count?.likes || 0,
            comments: p._count?.comments || 0,
            shares: p._count?.shares || 0,
            liked: p.likedByMe || false,
            saved: p.savedByMe || false
          })));
        }

        if (notifRes.success && notifRes.notifications) {
          setNotifications(notifRes.notifications.map((n: any) => ({
            id: n.id,
            type: n.type.toLowerCase() as "like" | "comment" | "follow" | "mention",
            actorId: n.actorId,
            postId: n.postId || undefined,
            createdAt: n.createdAt,
            read: n.isRead
          })));
        }
      } catch (err) {
        console.error("Failed to sync app data", err);
      }
    };

    syncData();
    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const value = useMemo<Ctx>(() => {
    return {
      currentUser,
      users,
      posts,
      notifications,
      following,
      getUser: (id) => {
        if (id === currentUserId && currentUser) return currentUser;
        const found = users.find((u) => u.id === id);
        if (found) return found;
        return {
          id,
          username: "developer",
          name: "Developer",
          avatar: AV(id),
          bio: "",
          skills: [],
          followers: 0,
          following: 0,
          posts: 0,
        };
      },
      getUserByUsername: (u) => {
        if (currentUser && currentUser.username === u) return currentUser;
        return users.find((x) => x.username === u);
      },
      createPost: async ({ content, tags, image }) => {
        try {
          const res = await api.post<any>("/posts", { content, tags, imageUrl: image }, { token });
          if (res.success && res.post) {
            setPosts((prev) => [
              {
                id: res.post.id,
                authorId: currentUserId,
                content: res.post.content,
                createdAt: res.post.createdAt,
                tags: res.post.tags || [],
                image: res.post.imageUrl || undefined,
                likes: 0,
                comments: 0,
                shares: 0,
                liked: false,
                saved: false
              },
              ...prev,
            ]);
          }
        } catch (err) {
          console.error("Failed to create post", err);
        }
      },
      toggleLike: async (id) => {
        try {
          const res = await api.post<any>(`/posts/${id}/like`, {}, { token });
          if (res.success) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === id
                  ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
                  : p
              )
            );
          }
        } catch (err) {
          console.error("Failed to toggle like", err);
        }
      },
      toggleSave: async (id) => {
        try {
          const res = await api.post<any>(`/posts/${id}/save`, {}, { token });
          if (res.success) {
            setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
          }
        } catch (err) {
          console.error("Failed to toggle save", err);
        }
      },
      toggleFollow: async (uid) => {
        // Optimistic update
        setFollowing((prev) => {
          const next = new Set(prev);
          next.has(uid) ? next.delete(uid) : next.add(uid);
          return next;
        });
      },
      markAllRead: async () => {
        try {
          const res = await api.put<any>("/notifications/read-all", {}, { token });
          if (res.success) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }
        } catch (err) {
          console.error("Failed to mark notifications read", err);
        }
      },
      updateProfile: (_patch) => {
        if (!currentUser) return;
        // Simply trigger refresh on Auth context or let the page update it
      },
    };
  }, [users, posts, notifications, following, currentUser, currentUserId, token]);

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataCtx);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
