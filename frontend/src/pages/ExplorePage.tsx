import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/lib/app-data";
import { PostCard } from "@/components/feed/PostCard";
import { UserCard } from "@/components/UserCard";
import { Search, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";

const recent = ["react hooks", "rust async", "postgres index", "@sarah"];
const skills = ["React", "TypeScript", "Rust", "Go", "Swift", "Python", "PostgreSQL", "Kubernetes", "Design"];

export const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(q);
  const { users, posts, currentUser } = useAppData();

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const filteredUsers = useMemo(() => {
    if (!query) return [];
    const s = query.toLowerCase().replace(/^#/, "");
    return users.filter((u) =>
      u.id !== currentUser.id &&
      (u.name.toLowerCase().includes(s) ||
       u.username.toLowerCase().includes(s) ||
       u.skills.some((k) => k.toLowerCase().includes(s)))
    );
  }, [query, users, currentUser.id]);

  const filteredPosts = useMemo(() => {
    if (!query) return [];
    const s = query.toLowerCase().replace(/^#/, "");
    return posts.filter((p) =>
      p.content.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s))
    );
  }, [query, posts]);

  const active = query.trim().length > 0;

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">Explore</h1>
        <p className="mt-1 text-sm text-muted-foreground">Discover developers, posts, and topics.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search people, posts, or tags…"
          autoFocus
          className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-11 text-[15px] outline-none placeholder:text-muted-foreground transition focus:border-primary/60 focus:shadow-glow"
        />
        {query && (
          <button
            onClick={() => handleSearchChange("")}
            aria-label="Clear"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!active && (
        <>
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent</h2>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button key={r} onClick={() => handleSearchChange(r)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition hover:border-border-strong hover:text-foreground">
                  {r}
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Browse by skill</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <button key={s} onClick={() => handleSearchChange(s)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition hover:border-primary/50 hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {active && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              People ({filteredUsers.length})
            </h2>
            {filteredUsers.length === 0 ? (
              <EmptyState icon={Search} title="No people found" description="Try a different name, handle, or skill." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredUsers.map((u) => <UserCard key={u.id} user={u} />)}
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Posts ({filteredPosts.length})
            </h2>
            {filteredPosts.length === 0 ? (
              <EmptyState icon={Search} title="No posts found" description="Try broader keywords or a different tag." />
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
