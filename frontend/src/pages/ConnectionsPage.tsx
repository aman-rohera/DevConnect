import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { UserCard } from "@/components/UserCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Search, Check, X, Loader2, RefreshCw, UserPlus, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const ConnectionsPage = () => {
  const { user: currentUser, token } = useAuth();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [rawConnections, setRawConnections] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (token && currentUser) {
      loadAllData();
    }
  }, [token, currentUser]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchConnections(),
        fetchPendingRequests(),
        fetchRecommendations()
      ]);
    } catch (err) {
      console.error("Failed to load connections page data", err);
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

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await api.get<any>("/recommendations", { token });
      if (response.success) {
        setRecommendations(response.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await api.get<any>("/connections", { token });
      if (response.success && response.connections) {
        const rawConns = response.connections || [];
        setRawConnections(rawConns);

        const activeConns = rawConns.filter((c: any) => c.status === "ACCEPTED");
        const outgoing = rawConns.filter((c: any) => c.status === "PENDING" && c.senderId === currentUser?.id);

        // Resolve active connection user details from profile endpoint
        const resolvedActive = await Promise.all(
          activeConns.map(async (c: any) => {
            const otherUserId = c.senderId === currentUser?.id ? c.receiverId : c.senderId;
            try {
              const res = await api.get<any>(`/profile/${otherUserId}`, { token });
              if (res.success && res.data) {
                return {
                  id: res.data.id,
                  name: res.data.fullName,
                  username: res.data.fullName.toLowerCase().replace(/\s+/g, ""),
                  avatar: res.data.avatarUrl || "",
                  bio: res.data.headline || "Software Developer",
                  skills: res.data.skills || [],
                  isReal: true
                };
              }
            } catch (err) {
              console.error(`Failed to resolve connection user profile ${otherUserId}`, err);
            }
            return {
              id: otherUserId,
              name: "Developer Connection",
              username: "developer_connection",
              avatar: "",
              bio: "Software Developer",
              skills: [],
              isReal: true
            };
          })
        );
        setConnections(resolvedActive);

        // Resolve outgoing pending request user details from profile endpoint
        const resolvedOutgoing = await Promise.all(
          outgoing.map(async (c: any) => {
            const otherUserId = c.receiverId;
            try {
              const res = await api.get<any>(`/profile/${otherUserId}`, { token });
              if (res.success && res.data) {
                return {
                  id: res.data.id,
                  name: res.data.fullName,
                  username: res.data.fullName.toLowerCase().replace(/\s+/g, ""),
                  avatar: res.data.avatarUrl || "",
                  bio: res.data.headline || "Software Developer",
                  skills: res.data.skills || []
                };
              }
            } catch (err) {
              console.error(`Failed to resolve outgoing request user profile ${otherUserId}`, err);
            }
            return {
              id: otherUserId,
              name: "Developer",
              username: "developer",
              avatar: "",
              bio: "Software Developer",
              skills: []
            };
          })
        );
        setOutgoingRequests(resolvedOutgoing);
      }
    } catch (err) {
      console.error("Failed to fetch connections", err);
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
      } else {
        toast.error(response.message || `Failed to ${action.toLowerCase()} request.`);
      }
    } catch (err) {
      console.error("Failed to respond to request", err);
      toast.error("Failed to update request status.");
    }
  };

  const handleConnect = async (targetUserId: string) => {
    // Optimistic UI updates by adding connection in state
    setRawConnections((prev) => [
      ...prev,
      { senderId: currentUser?.id, receiverId: targetUserId, status: "PENDING" }
    ]);
    try {
      const response = await api.post<any>(
        "/connections/request",
        { receiverId: targetUserId },
        { token }
      );
      if (response.success) {
        toast.success("Connection request sent!");
        await fetchConnections();
      } else {
        toast.error(response.message || "Failed to send request.");
        await fetchConnections();
      }
    } catch (err) {
      console.error("Error sending request", err);
      toast.error("Failed to send request.");
      await fetchConnections();
    }
  };

  const syncProfile = async () => {
    try {
      setSyncing(true);
      toast.info("Syncing developer skills graph...");
      const response = await api.post<any>("/recommendations/sync", {}, { token });
      if (response.success) {
        toast.success("Graph synced successfully!");
        await fetchRecommendations();
      } else {
        toast.error(response.message || "Failed to sync graph.");
      }
    } catch (err) {
      console.error("Failed to sync profile", err);
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const mockConnections = useMemo(() => [
    { id: "u2", name: "Sarah Chen", username: "sarah", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=sarah", bio: "Design engineer @ Linear. Motion, typography, and tiny details.", skills: ["React", "TypeScript", "UI/UX"] },
    { id: "u3", name: "Kenji Watanabe", username: "kenji", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=kenji", bio: "Infra engineer. Postgres, Kafka, and the joys of on-call.", skills: ["PostgreSQL", "Go", "Docker"] },
    { id: "u4", name: "Priya Patel", username: "priya", avatar: "https://api.dicebear.com/9.x/glass/svg?seed=priya", bio: "iOS + Swift. Building calm software. She/her.", skills: ["iOS", "Swift", "SwiftUI"] }
  ], []);

  const activeConnections = useMemo(() => {
    return [...connections, ...mockConnections];
  }, [connections, mockConnections]);

  const connectionStatusesMap = useMemo(() => {
    const statuses: Record<string, string> = {};
    rawConnections.forEach((conn: any) => {
      const otherUserId = conn.senderId === currentUser?.id ? conn.receiverId : conn.senderId;
      if (conn.status === "PENDING") statuses[otherUserId] = "Pending...";
      else if (conn.status === "ACCEPTED") statuses[otherUserId] = "Connected";
    });
    return statuses;
  }, [rawConnections, currentUser?.id]);

  const availableRecommendations = useMemo(() => {
    return recommendations.filter(
      (rec) => {
        const status = connectionStatusesMap[rec.user.id];
        return status !== "Connected" && status !== "Pending...";
      }
    );
  }, [recommendations, connectionStatusesMap]);

  const filter = (list: any[]) =>
    q ? list.filter((u) => (u.name + u.username).toLowerCase().includes(q.toLowerCase())) : list;

  const filteredConnections = filter(activeConnections);
  const filteredOutgoing = filter(outgoingRequests);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gradient">Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your developer connections and explore recommendations.</p>
        </div>
        <Button onClick={syncProfile} disabled={syncing} size="sm" className="self-start sm:self-auto gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Syncing..." : "Sync Graph"}</span>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter connections or recommendations…"
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

        {/* Tab 1: Current Connections + Recommended Section */}
        <TabsContent value="connections" className="mt-4 space-y-8">
          {/* Active Connections List */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Active Connections ({activeConnections.length})
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredConnections.length === 0 ? (
              <EmptyState icon={Users} title="No connections yet" description="Start connecting with developers in the recommendations list below." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredConnections.map((u) => <UserCard key={u.id} user={u} />)}
              </div>
            )}
          </section>

          {/* Recommendations list */}
          <section className="space-y-4 border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" /> Recommended Developers
              </h2>
            </div>

            {loadingRecommendations ? (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                <span className="text-xs">Finding matches...</span>
              </div>
            ) : availableRecommendations.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center shadow-soft">
                <Users className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <h3 className="font-semibold text-xs mb-1">No recommendations found</h3>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Sync your developer graph or add skills to find matching developer profiles.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {availableRecommendations.map((rec) => (
                  <div key={rec.user.id} className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 flex flex-col justify-between shadow-soft hover:border-border-strong transition">
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/5 to-transparent" />
                    <div className="relative flex items-start gap-4">
                      <Link to={`/profile/${rec.user.id}`}>
                        <Avatar className="h-14 w-14 border border-border bg-surface">
                          <AvatarImage src={rec.user.avatarUrl || ""} />
                          <AvatarFallback>{rec.user.fullName[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/profile/${rec.user.id}`} className="font-semibold text-[15px] hover:underline truncate block">
                          {rec.user.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate mb-2">{rec.user.headline || "Software Developer"}</p>
                        
                        {rec.commonSkills > 0 && (
                          <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary mb-3">
                            {rec.commonSkills} Shared Skill{rec.commonSkills > 1 ? "s" : ""}
                          </span>
                        )}

                        {rec.sharedSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rec.sharedSkills.slice(0, 3).map((skill: string) => (
                              <span key={skill} className="rounded bg-surface border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                            {rec.sharedSkills.length > 3 && (
                              <span className="rounded bg-surface border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                                +{rec.sharedSkills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to={`/profile/${rec.user.id}`}>View profile</Link>
                      </Button>
                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleConnect(rec.user.id)}>
                        <UserPlus className="h-3.5 w-3.5" /> Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* Tab 2: Incoming Received Requests */}
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
                      <Link to={`/profile/${req.sender.id}`} className="font-semibold text-sm hover:underline">
                        {req.sender.fullName}
                      </Link>
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

        {/* Tab 3: Outgoing Sent Requests */}
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
