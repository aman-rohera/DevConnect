import { Link } from "react-router-dom";
import { useAppData } from "@/lib/app-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, BadgeCheck, Share2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PostCard({ post }: { post: any }) {
  const { getUser, toggleLike, toggleSave } = useAppData();
  
  // Resolve author from backend user object if present, else fallback to mock data
  const author = post.user ? {
    id: post.user.id,
    name: post.user.fullName,
    username: post.user.fullName.toLowerCase().replace(/\s+/g, ""),
    avatar: post.user.avatarUrl || "",
    verified: post.user.verified || false,
    bio: post.user.headline || "Developer",
    company: ""
  } : getUser(post.authorId);

  if (!author) return null;

  const imageContent = post.imageUrl || post.image;

  return (
    <article className="group relative rounded-xl border border-border bg-card transition hover:border-border-strong">
      <div className="p-4 sm:p-5">
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
              <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
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

        <footer className="mt-4 flex items-center justify-between gap-1 text-muted-foreground">
          <Action onClick={() => toggleLike(post.id)} active={!!post.liked} activeClass="text-red-400" icon={<Heart className={cn("h-4 w-4", post.liked && "fill-current")} />} count={post.likes} label="Like" />
          <Action icon={<MessageCircle className="h-4 w-4" />} count={post.comments} label="Comment" />
          <Action icon={<Repeat2 className="h-4 w-4" />} count={post.shares} label="Share" activeClass="text-emerald-400" />
          <Action icon={<Share2 className="h-4 w-4" />} label="Send" />
          <Action onClick={() => toggleSave(post.id)} active={!!post.saved} activeClass="text-primary" icon={<Bookmark className={cn("h-4 w-4", post.saved && "fill-current")} />} label="Save" />
        </footer>
      </div>
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

function formatCount(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}
