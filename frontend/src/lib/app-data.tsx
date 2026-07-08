import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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

// ------------- Mock data -------------
const AV = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${seed}`;
// Fixed base for stable SSR (no Date.now at module scope)
const BASE = new Date("2026-07-03T12:00:00Z").getTime();
const ago = (mins: number) => new Date(BASE - mins * 60_000).toISOString();

const seedUsers: User[] = [
  {
    id: "u1", username: "you", name: "Alex Rivera",
    avatar: AV("alex"), cover: "",
    bio: "Building tools for developers. Ex-Stripe. Rust, TypeScript, distributed systems.",
    location: "San Francisco, CA", company: "Independent",
    website: "https://alex.dev", github: "alexrivera", linkedin: "alex-rivera",
    skills: ["TypeScript", "Rust", "React", "PostgreSQL", "Kubernetes", "gRPC"],
    followers: 2843, following: 412, posts: 87, verified: true,
  },
  {
    id: "u2", username: "sarah", name: "Sarah Chen",
    avatar: AV("sarah"),
    bio: "Design engineer @ Linear. Motion, typography, and tiny details.",
    location: "New York", company: "Linear",
    skills: ["React", "Motion", "Figma", "CSS"],
    followers: 12400, following: 231, posts: 214, verified: true,
  },
  {
    id: "u3", username: "kenji", name: "Kenji Watanabe",
    avatar: AV("kenji"),
    bio: "Infra engineer. Talking about Postgres, Kafka, and the joys of on-call.",
    location: "Tokyo", company: "Stripe",
    skills: ["Go", "PostgreSQL", "Kafka", "AWS"],
    followers: 5210, following: 189, posts: 132,
  },
  {
    id: "u4", username: "priya", name: "Priya Patel",
    avatar: AV("priya"),
    bio: "iOS + Swift. Building calm software. She/her.",
    location: "London", company: "Freelance",
    skills: ["Swift", "SwiftUI", "Objective-C"],
    followers: 3820, following: 512, posts: 65,
  },
  {
    id: "u5", username: "marco", name: "Marco Rossi",
    avatar: AV("marco"),
    bio: "OSS maintainer. TypeScript, Vite, and dev tooling.",
    location: "Berlin", company: "OSS",
    skills: ["TypeScript", "Vite", "Rollup", "Node"],
    followers: 8930, following: 340, posts: 421,
  },
  {
    id: "u6", username: "amelia", name: "Amelia Johnson",
    avatar: AV("amelia"),
    bio: "ML research → applied. LLMs, evals, and quiet Sundays.",
    location: "Toronto", company: "Cohere",
    skills: ["Python", "PyTorch", "JAX"],
    followers: 15600, following: 92, posts: 78, verified: true,
  },
];

const seedPosts: Post[] = [
  {
    id: "p1", authorId: "u2",
    content:
      "Shipped a redesign of the command menu today. The trick with keyboard-first UI is that every microsecond of latency shows. We moved fuzzy search into a web worker and it feels instant now. ⌘K forever.",
    createdAt: ago(24), tags: ["design", "react", "performance"],
    likes: 342, comments: 28, shares: 12,
  },
  {
    id: "p2", authorId: "u3",
    content:
      "PSA: your Postgres primary shouldn't be doing analytical queries. Read replicas are cheap. Your users on the login page paying for someone's ad-hoc COUNT(*) is not.",
    createdAt: ago(96), tags: ["postgres", "backend"],
    likes: 891, comments: 74, shares: 156,
  },
  {
    id: "p3", authorId: "u5",
    content:
      "Rewrote our dev-server watcher in Rust. Cold start dropped from 1.4s → 180ms. Native filesystem events are underrated. Blog post coming this week.",
    createdAt: ago(180), tags: ["rust", "tooling", "oss"],
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=1200&q=80",
    likes: 2103, comments: 142, shares: 380,
  },
  {
    id: "p4", authorId: "u6",
    content:
      "Reminder: evals are the actual product when you ship with LLMs. Your prompt is a hyperparameter — you need a test set before you tune it.",
    createdAt: ago(360), tags: ["ml", "llm"],
    likes: 1240, comments: 89, shares: 210,
  },
  {
    id: "p5", authorId: "u4",
    content:
      "SwiftUI tip: prefer @Observable over ObservableObject on iOS 17+. Fewer re-renders, cleaner ergonomics, and it composes with @Bindable really nicely.",
    createdAt: ago(720), tags: ["swift", "ios"],
    code: {
      lang: "swift",
      source: `@Observable\nfinal class FeedModel {\n  var posts: [Post] = []\n  func refresh() async { /* ... */ }\n}`,
    },
    likes: 512, comments: 33, shares: 47,
  },
  {
    id: "p6", authorId: "u2",
    content:
      "Typography rant: 16px body text is a floor, not a ceiling. Increase line-height before you increase font-size. Reading is a rhythm.",
    createdAt: ago(1400), tags: ["design", "typography"],
    likes: 780, comments: 51, shares: 90,
  },
];

const seedNotifications: Notification[] = [
  { id: "n1", type: "like", actorId: "u2", postId: "p1", createdAt: ago(5), read: false },
  { id: "n2", type: "follow", actorId: "u6", createdAt: ago(40), read: false },
  { id: "n3", type: "comment", actorId: "u3", postId: "p1", createdAt: ago(120), read: false },
  { id: "n4", type: "mention", actorId: "u5", postId: "p3", createdAt: ago(300), read: true },
  { id: "n5", type: "like", actorId: "u4", postId: "p1", createdAt: ago(900), read: true },
  { id: "n6", type: "follow", actorId: "u3", createdAt: ago(1500), read: true },
];

// ------------- Store -------------
type Ctx = {
  currentUser: User;
  users: User[];
  posts: Post[];
  notifications: Notification[];
  following: Set<string>;
  createPost: (data: { content: string; tags: string[]; image?: string }) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  toggleFollow: (userId: string) => void;
  markAllRead: () => void;
  updateProfile: (patch: Partial<User>) => void;
  getUser: (id: string) => User | undefined;
  getUserByUsername: (u: string) => User | undefined;
};

const AppDataCtx = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const [following, setFollowing] = useState<Set<string>>(new Set(["u2", "u5"]));

  const value = useMemo<Ctx>(() => {
    const currentUser = users[0];
    return {
      currentUser,
      users,
      posts,
      notifications,
      following,
      getUser: (id) => users.find((u) => u.id === id),
      getUserByUsername: (u) => users.find((x) => x.username === u),
      createPost: ({ content, tags, image }) =>
        setPosts((prev) => [
          {
            id: `p${Date.now()}`, authorId: currentUser.id, content, tags,
            image, createdAt: new Date().toISOString(),
            likes: 0, comments: 0, shares: 0,
          },
          ...prev,
        ]),
      toggleLike: (id) =>
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
              : p
          )
        ),
      toggleSave: (id) =>
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))),
      toggleFollow: (uid) =>
        setFollowing((prev) => {
          const next = new Set(prev);
          next.has(uid) ? next.delete(uid) : next.add(uid);
          return next;
        }),
      markAllRead: () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
      updateProfile: (patch) =>
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u))),
    };
  }, [users, posts, notifications, following]);

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataCtx);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
