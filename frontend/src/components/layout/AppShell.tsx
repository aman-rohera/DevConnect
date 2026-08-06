import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Bell, Users, User as UserIcon, Settings,
  Search, Plus, LogOut, Sparkles, MessageSquare, Briefcase, Building2, ShieldAlert
} from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { useChatUnread } from "@/lib/chat-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Composer } from "@/components/feed/Composer";


const nav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/messages", label: "Messages", icon: MessageSquare, messagesBadge: true },
  { to: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { to: "/connections", label: "Connections", icon: Users },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useAppData();
  const unread = notifications.filter((n) => !n.read).length;
  const chatUnread = useChatUnread();
  const [composeOpen, setComposeOpen] = useState(false);

  const currentUser = {
    name: authUser?.fullName || "Developer",
    username: authUser?.fullName ? authUser.fullName.toLowerCase().replace(/\s+/g, "") : "developer",
    avatar: authUser?.avatarUrl || authUser?.profile?.avatar_url || ""
  };

  const badgeFor = (item: { badge?: boolean; messagesBadge?: boolean }) =>
    item.badge ? unread : item.messagesBadge ? chatUnread : undefined;

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">DevConnect</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} badge={badgeFor(item)} />
          ))}
        </nav>

        <div className="px-3 pb-3">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:bg-primary-hover ring-focus">
                <Plus className="h-4 w-4" />
                New post
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 border-border bg-surface">
              <Composer onDone={() => setComposeOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-sidebar-accent ring-focus">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{currentUser.name}</div>
                  <div className="truncate text-xs text-muted-foreground">@{currentUser.username}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Signed in</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/companies/create")} className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" /> Create Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/companies/manage")} className="cursor-pointer">
                <Briefcase className="mr-2 h-4 w-4" /> Manage Companies
              </DropdownMenuItem>
              {authUser?.role === "ADMIN" && (
                <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer font-semibold text-primary">
                  <ShieldAlert className="mr-2 h-4 w-4" /> Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Top bar (mobile + desktop utility) */}
      <header className="sticky top-0 z-20 h-14 border-b border-border glass lg:pl-[260px]">
        <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-chart-2">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">DevConnect</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-transparent transition hover:border-border hover:bg-surface">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary pulse-dot" />
              )}
            </Link>

            {/* Mobile Profile & Logout Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="grid h-9 w-9 place-items-center rounded-full ring-focus">
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-medium">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground">@{currentUser.username}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/companies/create")} className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" /> Create Company
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/companies/manage")} className="cursor-pointer">
                    <Briefcase className="mr-2 h-4 w-4" /> Manage Companies
                  </DropdownMenuItem>
                  {authUser?.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer font-semibold text-primary">
                      <ShieldAlert className="mr-2 h-4 w-4" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="lg:pl-[260px] pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex h-14 items-center justify-around rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xl shadow-2xl lg:hidden px-2">
        {nav.map((item) => (
          <BottomItem key={item.to} {...item} badge={badgeFor(item)} />
        ))}
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <button aria-label="New post" className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-primary to-chart-2 text-primary-foreground shadow-glow active:scale-95 transition-transform">
              <Plus className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 border-border bg-surface">
            <Composer onDone={() => setComposeOpen(false)} />
          </DialogContent>
        </Dialog>
      </nav>
    </div>
  );
}

function NavItem({
  to, label, icon: Icon, exact, badge,
}: { to: string; label: string; icon: any; exact?: boolean; badge?: number }) {
  const location = useLocation();
  const pathname = location.pathname;
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ring-focus",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />}
      <Icon className={cn("h-4 w-4 transition", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
          {badge}
        </span>
      )}
    </Link>
  );
}

function BottomItem({ to, label, icon: Icon, exact, badge }: any) {
  const location = useLocation();
  const pathname = location.pathname;
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "relative flex flex-col items-center justify-center h-10 w-10 rounded-xl transition-all duration-200",
        active ? "bg-primary/15 text-primary scale-105" : "text-muted-foreground hover:text-foreground active:scale-95"
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform", active && "stroke-[2.25px]")} />
      {active && (
        <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
      )}
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
