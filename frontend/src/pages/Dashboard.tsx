import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PostCard } from "@/components/feed/PostCard";
import { Composer } from "@/components/feed/Composer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Dashboard = () => {
  const { token } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());

  const trending = ["react", "rust", "postgres", "design", "typescript", "ml"];

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, [token]);

  const fetchFeed = async () => {
    try {
      setLoadingPosts(true);
      const data = await api.get<any>("/posts/feed", { token });
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch feed", error);
      toast.error("Failed to load feed posts.");
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const data = await api.get<any>("/recommendations", { token });
      if (data.success && data.recommendations) {
        // Map the recommendations user objects
        const items = data.recommendations
          .map((rec: any) => rec.user)
          .slice(0, 3);
        setSuggestions(items);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations suggestions", error);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    setConnectingIds((prev) => {
      const next = new Set(prev);
      next.add(targetUserId);
      return next;
    });

    try {
      const response = await api.post<any>(
        "/connections/request",
        { receiverId: targetUserId },
        { token }
      );
      if (response.success) {
        toast.success("Connection request sent!");
        // Remove from suggestions since request is pending/active
        setSuggestions((prev) => prev.filter((u) => u.id !== targetUserId));
      } else {
        toast.error(response.message || "Failed to send connection request.");
      }
    } catch (err: any) {
      console.error("Error sending request", err);
      toast.error(err.message || "Failed to send connection request.");
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        {/* Feed Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gradient">Home</h1>
            <p className="mt-1 text-sm text-muted-foreground">Latest from developers you follow.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-xs">
            <button className="rounded-md bg-accent px-2.5 py-1 font-medium">For you</button>
            <button className="rounded-md px-2.5 py-1 text-muted-foreground transition hover:text-foreground">Following</button>
            <button className="rounded-md px-2.5 py-1 text-muted-foreground transition hover:text-foreground">Latest</button>
          </div>
        </div>

        {/* Composer */}
        <div className="hairline rounded-xl bg-card overflow-hidden">
          <Composer onPostCreated={(newPost) => setPosts([newPost, ...posts])} />
        </div>

        {/* Posts feed */}
        <div className="space-y-3">
          {loadingPosts ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading developer updates...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">No posts in feed yet. Start sharing what you're building!</p>
            </div>
          ) : (
            posts.map((p, i) => (
              <div key={p.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <PostCard post={p} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar suggestions & trends */}
      <aside className="hidden lg:block space-y-6">
        {suggestions.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Who to follow
            </div>
            <div className="mt-4 space-y-3">
              {suggestions.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Link to={`/profile/${u.id}`}>
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={u.avatarUrl || ""} />
                      <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <Link to={`/profile/${u.id}`} className="truncate text-sm font-medium hover:underline">
                        {u.fullName}
                      </Link>
                      {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{u.headline || "Software Developer"}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={connectingIds.has(u.id)}
                    onClick={() => handleConnect(u.id)}
                  >
                    {connectingIds.has(u.id) ? "..." : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> Trending tags
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {trending.map((t) => (
              <Link
                key={t}
                to={`/explore?q=%23${t}`}
                className="rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                #{t}
              </Link>
            ))}
          </div>
        </section>

        <p className="px-2 text-xs text-muted-foreground">
          DevConnect · A community for developers · v1.0
        </p>
      </aside>
    </div>
  );
};

export default Dashboard;
