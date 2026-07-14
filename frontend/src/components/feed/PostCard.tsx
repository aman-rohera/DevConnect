import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "@/lib/app-data";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, BadgeCheck, Share2, Loader2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PostCard({ post }: { post: any }) {
  const { getUser, toggleSave } = useAppData();
  const { user: currentUser } = useAuth();
  
  // Resolve author from backend user object if present, else fallback to mock data
  const author = post.user ? {
    id: post.user.id,
    name: post.user.fullName,
    username: post.user.fullName.toLowerCase().replace(/\s+/g, ""),
    avatar: post.user.profile?.avatarUrl || post.user.avatarUrl || "",
    verified: post.user.verified || false,
    bio: post.user.profile?.headline || post.user.headline || "Developer",
    company: ""
  } : getUser(post.authorId);

  // Real backend states
  const [liked, setLiked] = useState(!!post.liked);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [sharesCount, setSharesCount] = useState(post.shares || 0);

  // Comments panel states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Replies states
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // Repost & Send states
  const [shared, setShared] = useState(!!post.shared);
  const [connections, setConnections] = useState<any[]>([]);
  const [sendingToId, setSendingToId] = useState<string | null>(null);

  const isOwner = currentUser?.id === author?.id;

  useEffect(() => {
    if (currentUser) {
      fetchConnections();
    }
  }, [currentUser]);

  const fetchConnections = async () => {
    try {
      const res = await api.get<any>("/connections");
      if (res.success && res.connections) {
        const accepted = res.connections.filter((c: any) => c.status === "ACCEPTED");
        setConnections(accepted);
      }
    } catch (err) {
      console.error("Failed to load connections for send menu", err);
    }
  };

  if (isDeleted) return null;
  if (!author) return null;

  const imageContent = post.imageUrl || post.image;

  const handleLike = async () => {
    // Optimistic UI updates
    setLiked(!liked);
    setLikesCount((prev: number) => prev + (liked ? -1 : 1));

    try {
      const res = await api.post<any>(`/posts/${post.id}/like`, {});
      if (res.success) {
        setLiked(res.liked);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      console.error("Failed to like post", err);
      // Revert optimistic updates
      setLiked(liked);
      setLikesCount(likesCount);
      toast.error("Failed to register like.");
    }
  };

  const handleShare = async () => {
    // Optimistic UI updates
    setShared(!shared);
    setSharesCount((prev: number) => prev + (shared ? -1 : 1));

    try {
      const res = await api.post<any>(`/posts/${post.id}/share`, {});
      if (res.success) {
        setShared(res.shared);
        setSharesCount(res.sharesCount);
        if (res.shared) {
          toast.success("Post reposted successfully!");
        } else {
          toast.success("Repost removed.");
        }
      }
    } catch (err) {
      console.error("Failed to share post", err);
      // Revert optimistic updates
      setShared(shared);
      setSharesCount(sharesCount);
      toast.error("Failed to register share.");
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Post link copied to clipboard!");
  };

  const handleSendToConnection = async (contact: any) => {
    setSendingToId(contact.id);
    try {
      // 1. Create or get conversation
      const convRes = await api.post<any>("/chat/conversations", {
        targetUserId: contact.id
      });
      
      if (convRes.success && convRes.data?.id) {
        const conversationId = convRes.data.id;
        // 2. Send the message containing the post link
        const postLink = `${window.location.origin}/posts/${post.id}`;
        const msgContent = `Check out this post: ${postLink}`;
        
        const msgRes = await api.post<any>("/chat/messages", {
          conversationId,
          content: msgContent
        });
        
        if (msgRes.success) {
          toast.success(`Post shared with ${contact.fullName}!`);
        } else {
          toast.error("Failed to send message.");
        }
      } else {
        toast.error("Failed to open conversation.");
      }
    } catch (err) {
      console.error("Error sharing post via message", err);
      toast.error("Failed to share post via message.");
    } finally {
      setSendingToId(null);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const res = await api.delete<any>(`/posts/${post.id}`);
      if (res.success) {
        toast.success("Post deleted successfully.");
        setIsDeleted(true);
      }
    } catch (err) {
      console.error("Failed to delete post", err);
      toast.error("Failed to delete post.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get<any>(`/posts/${post.id}/comments`);
      if (res.success) {
        setComments(res.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments", err);
      toast.error("Failed to load comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post<any>(`/posts/${post.id}/comments`, {
        content: newComment.trim(),
      });
      if (res.success && res.comment) {
        setNewComment("");
        setComments((prev: any[]) => [res.comment, ...prev]);
        setCommentsCount((prev: number) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to post comment", err);
      toast.error("Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await api.post<any>(`/posts/${post.id}/comments`, {
        content: replyContent.trim(),
        parentCommentId,
      });
      if (res.success && res.comment) {
        setReplyContent("");
        setReplyingToId(null);
        setCommentsCount((prev: number) => prev + 1);
        // Insert reply locally into comment tree
        setComments((prev: any[]) => {
          const insertReply = (list: any[]): any[] => {
            return list.map((c) => {
              if (c.id === parentCommentId) {
                return { ...c, replies: [...(c.replies || []), res.comment] };
              } else if (c.replies && c.replies.length > 0) {
                return { ...c, replies: insertReply(c.replies) };
              }
              return c;
            });
          };
          return insertReply(prev);
        });
      }
    } catch (err) {
      console.error("Failed to post reply", err);
      toast.error("Failed to post reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <article className="group relative rounded-xl border border-border bg-card transition hover:border-border-strong">
      <div className="p-4 sm:p-5">
        {post.repostedBy && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2.5 px-0.5">
            <Repeat2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{post.repostedBy.fullName} reposted</span>
          </div>
        )}
        <header className="flex items-start gap-3">
          <Link to={`/profile/${author.id}`} className="shrink-0">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={author.avatar} />
              <AvatarFallback>{author.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-sm">
              <Link
                to={`/profile/${author.id}`}
                className="truncate font-semibold hover:underline underline-offset-2"
              >
                {author.name}
              </Link>
              {author.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
              <span className="truncate text-muted-foreground">@{author.username}</span>
              <span className="text-muted-foreground">·</span>
              <time className="text-muted-foreground" dateTime={post.createdAt}>
                {formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: false })}
              </time>
            </div>
            {author.bio && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{author.bio}</div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem>Mute @{author.username}</DropdownMenuItem>
              {isOwner ? (
                <DropdownMenuItem className="text-destructive font-medium cursor-pointer" onSelect={() => setShowDeleteConfirm(true)}>
                  Delete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/95">
          {post.content}
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((t: string) => (
              <Link
                key={t}
                to={`/explore?q=%23${t}`}
                className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary transition hover:bg-primary/15"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        {imageContent && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <img src={imageContent} alt="" className="w-full object-cover" loading="lazy" />
          </div>
        )}

        {post.code && (
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed">
            <code>{post.code.source}</code>
          </pre>
        )}

        <footer className="mt-4 flex items-center justify-between gap-1 text-muted-foreground border-t border-border/40 pt-3">
          <Action onClick={handleLike} active={liked} activeClass="text-red-400" icon={<Heart className={cn("h-4 w-4", liked && "fill-current")} />} count={likesCount} label="Like" />
          <Action onClick={handleToggleComments} active={showComments} activeClass="text-primary" icon={<MessageCircle className="h-4 w-4" />} count={commentsCount} label="Comment" />
          <Action onClick={handleShare} active={shared} activeClass="text-emerald-400" icon={<Repeat2 className={cn("h-4 w-4", shared && "fill-current")} />} count={sharesCount} label="Share" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition hover:bg-accent hover:text-foreground text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span>Send</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 p-1">
              <DropdownMenuItem className="cursor-pointer font-medium" onSelect={handleCopyLink}>
                Copy link to post
              </DropdownMenuItem>
              
              {connections.length > 0 && (
                <>
                  <div className="h-px bg-border my-1" />
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Send to Connections
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {connections.map((conn: any) => {
                      const contact = conn.senderId === currentUser?.id ? conn.receiver : conn.sender;
                      const isSending = sendingToId === contact.id;
                      return (
                        <DropdownMenuItem
                          key={contact.id}
                          className="cursor-pointer flex items-center justify-between text-xs py-2"
                          onSelect={() => handleSendToConnection(contact)}
                          disabled={isSending}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-5 w-5 border border-border shrink-0">
                              <AvatarImage src={contact.profile?.avatarUrl || contact.avatarUrl || ""} />
                              <AvatarFallback className="text-[8px]">{contact.fullName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{contact.fullName}</span>
                          </div>
                          {isSending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Action onClick={() => toggleSave(post.id)} active={!!post.saved} activeClass="text-primary" icon={<Bookmark className={cn("h-4 w-4", post.saved && "fill-current")} />} label="Save" />
        </footer>

        {/* Dynamic Comments Drawer */}
        {showComments && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={submittingComment}
              />
              <Button type="submit" size="sm" disabled={submittingComment || !newComment.trim()}>
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </form>

            {loadingComments ? (
              <div className="mt-4 flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="mt-4 text-center text-xs text-muted-foreground py-2">
                Be the first to comment on this post!
              </p>
            ) : (
              <div className="mt-2 divide-y divide-border/20 max-h-[400px] overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    replyingToId={replyingToId}
                    setReplyingToId={setReplyingToId}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    onSubmitReply={handleSubmitReply}
                    submittingReply={submittingReply}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in-50 zoom-in-95 duration-150">
            <h3 className="text-lg font-semibold text-foreground">Delete Post</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Action({
  icon, count, label, onClick, active, activeClass,
}: {
  icon: React.ReactNode; count?: number; label: string;
  onClick?: () => void; active?: boolean; activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition hover:bg-accent hover:text-foreground",
        active && activeClass
      )}
    >
      {icon}
      {typeof count === "number" && <span className="font-mono">{formatCount(count)}</span>}
    </button>
  );
}

function CommentItem({
  comment,
  replyingToId,
  setReplyingToId,
  replyContent,
  setReplyContent,
  onSubmitReply,
  submittingReply,
  depth = 0,
}: {
  comment: any;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (val: string) => void;
  onSubmitReply: (parentId: string) => void;
  submittingReply: boolean;
  depth?: number;
}) {
  const author = {
    name: comment.user?.fullName || "Developer",
    avatar: comment.user?.profile?.avatarUrl || comment.user?.avatarUrl || "",
    bio: comment.user?.profile?.headline || comment.user?.headline || "Developer",
  };

  const isReplying = replyingToId === comment.id;

  return (
    <div className={cn("mt-4 flex flex-col gap-2", depth > 0 && "pl-6 border-l border-border-strong")}>
      <div className="flex gap-2.5 items-start">
        <Avatar className="h-7 w-7 border border-border shrink-0">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="bg-accent/40 rounded-xl px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="font-semibold text-foreground/90">{author.name}</span>
              <span className="text-[9px] text-muted-foreground">
                {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            {author.bio && <p className="text-[10px] text-muted-foreground truncate">{author.bio}</p>}
            <p className="mt-1 text-foreground/95 whitespace-pre-wrap text-[13px] leading-relaxed">{comment.content}</p>
          </div>
          <div className="mt-1 flex gap-3 px-1 text-[10px]">
            <button
              onClick={() => {
                if (isReplying) {
                  setReplyingToId(null);
                } else {
                  setReplyingToId(comment.id);
                  setReplyContent("");
                }
              }}
              className="text-muted-foreground hover:text-primary transition font-medium"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="flex gap-2 pl-9 items-start">
          <div className="flex-1">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              rows={1}
            />
          </div>
          <Button
            size="sm"
            onClick={() => onSubmitReply(comment.id)}
            disabled={submittingReply || !replyContent.trim()}
            className="text-[10px] h-7 px-2.5"
          >
            {submittingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reply"}
          </Button>
        </div>
      )}

      {comment.replies && comment.replies.map((reply: any) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replyingToId={replyingToId}
          setReplyingToId={setReplyingToId}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          onSubmitReply={onSubmitReply}
          submittingReply={submittingReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function formatCount(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}
