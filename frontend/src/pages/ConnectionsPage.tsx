import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { UserCard } from "@/components/UserCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Search, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const ConnectionsPage = () => {
  const { user: currentUser, token } = useAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchConnections();
    fetchPendingRequests();
  }, [token]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>("/connections", { token });
      if (response.success) {
        setConnections(response.connections || []);
      }
    } catch (err) {
      console.error("Failed to fetch connections", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get<any>("/connections/pending", { token });
      if (response.success) {
        setPendingRequests(response.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending requests", err);
    }
  };

  const handleRespond = async (connectionId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const response = await api.put<any>(
        `/connections/${connectionId}/respond`,
        { action },
        { token }
      );
      if (response.success) {
        toast.success(`Request ${action === "ACCEPT" ? "accepted" : "ignored"}`);
        setPendingRequests((prev) => prev.filter((r) => r.id !== connectionId));
        fetchConnections();
      }
    } catch (err) {
      console.error("Failed to respond to request", err);
      toast.error("Failed to update request status.");
    }
  };

  const mockConnections = useMemo(() => [
    { id: "u2", name: "Sarah Chen", username: "sarah", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=sarah", bio: "Design engineer @ Linear. Motion, typography, and tiny details." },
    { id: "u3", name: "Kenji Watanabe", username: "kenji", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=kenji", bio: "Infra engineer. Postgres, Kafka, and the joys of on-call." },
    { id: "u4", name: "Priya Patel", username: "priya", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=priya", bio: "iOS + Swift. Building calm software. She/her." },
    { id: "u5", name: "Marco Rossi", username: "marco", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=marco", bio: "OSS maintainer. TypeScript, Vite, and dev tooling." },
    { id: "u6", name: "Amelia Johnson", username: "amelia", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=amelia", bio: "ML research → applied. LLMs, evals, and quiet Sundays." }
  ], []);

  const activeConnections = useMemo(() => {
    const dbConns = connections
      .filter((c) => c.status === "ACCEPTED")
      .map((c) => {
        const otherUser = c.senderId === currentUser?.id ? c.receiver : c.sender;
        return {
          id: otherUser.id,
          name: otherUser.fullName,
          username: otherUser.fullName.toLowerCase().replace(/\s+/g, ""),
          avatar: otherUser.avatarUrl || "",
          bio: otherUser.headline || "Software Developer",
          skills: []
        };
      });
    return [...dbConns, ...mockConnections];
  }, [connections, currentUser?.id, mockConnections]);

  const outgoingRequests = useMemo(() => {
    return connections
      .filter((c) => c.status === "PENDING" && c.senderId === currentUser?.id)
      .map((c) => {
        const otherUser = c.receiver;
        return {
          id: otherUser.id,
          name: otherUser.fullName,
          username: otherUser.fullName.toLowerCase().replace(/\s+/g, ""),
          avatar: otherUser.avatarUrl || "",
          bio: otherUser.headline || "Software Developer",
          skills: []
        };
      });
  }, [connections, currentUser?.id]);

  const filter = (list: any[]) =>
    q ? list.filter((u) => (u.name + u.username).toLowerCase().includes(q.toLowerCase())) : list;

  const filteredConnections = filter(activeConnections);
  const filteredOutgoing = filter(outgoingRequests);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">Connections</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your developer network and connection requests.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter connections…"
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border-strong"
        />
      </div>

      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections">
            Connections <span className="ml-1.5 font-mono text-xs text-muted-foreground">{activeConnections.length}</span>
          </TabsTrigger>
          <TabsTrigger value="requests">
            Received Requests <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">{pendingRequests.length}</span>
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Sent Requests <span className="ml-1.5 font-mono text-xs text-muted-foreground">{outgoingRequests.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <EmptyState icon={Users} title="No connections yet" description="Start connecting with developers in the Network tab." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredConnections.map((u) => <UserCard key={u.id} user={u} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {pendingRequests.length === 0 ? (
            <EmptyState icon={Users} title="No pending requests" description="Incoming request notifications will appear here." />
          ) : (
            <div className="space-y-3 max-w-2xl">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={req.sender.avatarUrl || ""} />
                      <AvatarFallback>{req.sender.fullName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">{req.sender.fullName}</div>
                      <p className="text-xs text-muted-foreground">{req.sender.headline || "Software Developer"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRespond(req.id, "REJECT")}>
                      <X className="mr-1 h-3.5 w-3.5" /> Ignore
                    </Button>
                    <Button size="sm" onClick={() => handleRespond(req.id, "ACCEPT")}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4">
          {filteredOutgoing.length === 0 ? (
            <EmptyState icon={Users} title="No sent requests" description="No outgoing requests currently pending." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredOutgoing.map((u) => (
                <div key={u.id} className="relative">
                  <UserCard user={u} />
                  <span className="absolute top-3 right-3 text-[10px] font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsPage;
