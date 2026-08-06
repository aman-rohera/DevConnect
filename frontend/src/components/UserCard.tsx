import { Link } from "react-router-dom";
import { useAppData } from "@/lib/app-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";

export function UserCard({ user, compact }: { user: any; compact?: boolean }) {
  const { following, toggleFollow, currentUser } = useAppData();
  const isMe = currentUser ? user.id === currentUser.id : false;
  const isFollowing = following.has(user.id);

  const name = user.fullName || user.name || "Developer";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-border-strong">
      <Link to={`/profile/${user.username || user.id}`}>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={user.avatarUrl || user.avatar || user.profile?.avatarUrl || ""} alt={name} />
          <AvatarFallback>{(user.fullName || user.name || "D")[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            to={`/profile/${user.username || user.id}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {name}
          </Link>
          {user.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
        </div>
        <div className="truncate text-xs text-muted-foreground">@{user.username || user.id.slice(0, 8)}</div>
        {!compact && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{user.bio || user.headline || "Software Developer"}</p>}
      </div>
      {!isMe && (
        <Button
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          onClick={() => toggleFollow(user.id)}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
