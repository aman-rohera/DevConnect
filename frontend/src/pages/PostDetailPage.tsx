import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { PostCard } from "@/components/feed/PostCard";
import { Loader2, ArrowLeft, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, token } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [id, token]);

  const fetchPost = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<any>(`/posts/${id}`, { token: token || undefined });
      if (response.success && response.post) {
        setPost(response.post);
      } else {
        setError("Post not found");
      }
    } catch (err: any) {
      console.error("Failed to load post detail", err);
      setError("Post not found or unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      {/* Top back navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link to={isAuthenticated ? "/" : "/login"}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading post...</span>
        </div>
      ) : error || !post ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <h2 className="text-lg font-semibold">Post Not Found</h2>
          <p className="text-sm text-muted-foreground">This post may have been removed or does not exist.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      ) : (
        <PostCard post={post} />
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Guest Navbar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link to="/login" className="flex items-center gap-2 font-bold text-lg text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Code2 className="h-5 w-5" />
              </div>
              <span>DevConnect</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>{content}</main>
      </div>
    );
  }

  return <AppShell>{content}</AppShell>;
};
