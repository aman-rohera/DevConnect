import { Link } from "react-router-dom";
import { useAppData } from "@/lib/app-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Check } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
};

const colorMap: Record<string, string> = {
  like: "text-red-400 bg-red-400/10",
  comment: "text-blue-400 bg-blue-400/10",
  follow: "text-emerald-400 bg-emerald-400/10",
  mention: "text-primary bg-primary/10",
};

export const NotificationsPage = () => {
  const { notifications, getUser, markAllRead } = useAppData();
  const groups = groupByDate(notifications);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gradient">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recent activity from your network.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={markAllRead}>
          <Check className="mr-1.5 h-3.5 w-3.5" /> Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New activity from developers you follow will appear here." />
      ) : (
        <div className="space-y-6">
          {groups.map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {items.map((n) => {
                  const actor = getUser(n.actorId);
                  const Icon = iconMap[n.type as keyof typeof iconMap];
                  return (
                    <li key={n.id} className={`relative flex items-start gap-3 px-4 py-3.5 transition hover:bg-accent/40 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
                      {!n.read && <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />}
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={actor?.avatar} />
                          <AvatarFallback>{actor?.name[0] || "D"}</AvatarFallback>
                        </Avatar>
                        <span className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-card ${colorMap[n.type]}`}>
                          <Icon className="h-2.5 w-2.5" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <Link to={`/profile/${actor?.id}`} className="font-medium hover:underline">
                            {actor?.name}
                          </Link>{" "}
                          <span className="text-muted-foreground">{verb(n.type)}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

function verb(t: string) {
  switch (t) {
    case "like": return "liked your post";
    case "comment": return "commented on your post";
    case "follow": return "started following you";
    case "mention": return "mentioned you";
    default: return "";
  }
}

function groupByDate(items: any[]) {
  const now = Date.now();
  const buckets: Record<string, any[]> = { Today: [], "This week": [], Earlier: [] };
  for (const n of items) {
    const diff = (now - new Date(n.createdAt).getTime()) / 3_600_000;
    if (diff < 24) buckets.Today.push(n);
    else if (diff < 24 * 7) buckets["This week"].push(n);
    else buckets.Earlier.push(n);
  }
  return Object.entries(buckets).filter(([, v]) => v.length > 0);
}

export default NotificationsPage;
