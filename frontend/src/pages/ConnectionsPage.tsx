import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { UserCard } from "@/components/UserCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Search, Check, X, UserPlus, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const ConnectionsPage = () => {
  const { user: currentUser, token } = useAuth();
  const [q, setQ] = useState("");
  const [, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [rawConnections, setRawConnections] = useState<any[]>([]);
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
        autoSyncAndFetchRecommendations()
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

  const autoSyncAndFetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      // Auto-sync developer skills graph in background whenever page is opened
      try {
        await api.post<any>("/recommendations/sync", {}, { token });
      } catch (syncErr) {
        console.warn("Graph auto-sync warning:", syncErr);
      }

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

        const outgoing = rawConns.filter((c: any) => c.status === "PENDING" && c.senderId === currentUser?.id);

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
                  avatar: res.data.avatarUrl || res.data.profile?.avatarUrl || "",
                  avatarUrl: res.data.avatarUrl || res.data.profile?.avatarUrl || "",
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
    q ? list.filter((u) => (u.name || u.user?.fullName || "").toLowerCase().includes(q.toLowerCase())) : list;

  const filteredRecommendations = filter(availableRecommendations);
  const filteredOutgoing = filter(outgoingRequests);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">Network</h1>
        <p className="mt-1 text-sm text-muted-foreground">Discover developer recommendations and manage connection requests.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter recommendations or requests…"
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border-strong"
        />
      </div>

      <Tabs defaultValue="recommendations">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="w-full sm:w-auto flex justify-start sm:inline-flex">
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm">
              Recommendations <span className="ml-1.5 font-mono text-xs text-muted-foreground">{availableRecommendations.length}</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm">
              Received Requests <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">{pendingRequests.length}</span>
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="text-xs sm:text-sm">
              Sent Requests <span className="ml-1.5 font-mono text-xs text-muted-foreground">{outgoingRequests.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Recommendations */}
        <TabsContent value="recommendations" className="mt-4">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" /> Recommended Developers
              </h2>
            </div>

            {loadingRecommendations ? (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                <span className="text-xs">Updating recommendations...</span>
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center shadow-soft">
                <Users className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <h3 className="font-semibold text-xs mb-1">No recommendations found</h3>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Add skills or education to your profile to find matching developer profiles.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredRecommendations.map((rec) => (
                  <div key={rec.user.id} className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 flex flex-col justify-between shadow-soft hover:border-border-strong transition">
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/5 to-transparent" />
                    <div className="relative flex items-start gap-4">
                      <Link to={`/profile/${rec.user.username || rec.user.id}`}>
                        <Avatar className="h-14 w-14 border border-border bg-surface">
                          <AvatarImage src={rec.user.avatarUrl || rec.user.profile?.avatarUrl || rec.user.avatar || ""} />
                          <AvatarFallback>{(rec.user.fullName || rec.user.name || "D")[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/profile/${rec.user.username || rec.user.id}`} className="font-semibold text-[15px] hover:underline truncate block">
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
                        <Link to={`/profile/${rec.user.username || rec.user.id}`}>View profile</Link>
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
                      <AvatarImage src={req.sender.avatarUrl || req.sender.profile?.avatarUrl || req.sender.avatar || ""} />
                      <AvatarFallback>{(req.sender.fullName || req.sender.name || "D")[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link to={`/profile/${req.sender.username || req.sender.id}`} className="font-semibold text-sm hover:underline">
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
