import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw, UserPlus, Users, Compass } from "lucide-react";
import { toast } from "sonner";

export const Recommendations = () => {
  const { user: currentUser, token } = useAuth();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRecommendations();
    fetchConnections();
    fetchPendingRequests();
  }, [token]);

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

  const fetchConnections = async () => {
    try {
      const response = await api.get<any>("/connections", { token });
      if (response.success && response.connections) {
        const statuses: Record<string, string> = {};
        response.connections.forEach((conn: any) => {
          const otherUserId = conn.senderId === currentUser?.id ? conn.receiverId : conn.senderId;
          if (conn.status === "PENDING") statuses[otherUserId] = "Pending...";
          else if (conn.status === "ACCEPTED") statuses[otherUserId] = "Connected";
        });
        setConnectionStatuses(statuses);
      }
    } catch (err) {
      console.error("Failed to fetch connections", err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>("/recommendations", { token });
      if (response.success) {
        setRecommendations(response.recommendations || []);
      } else {
        toast.error(response.message || "Failed to load recommendations.");
      }
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
      toast.error("Failed to fetch recommendations graph.");
    } finally {
      setLoading(false);
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
      }
    } catch (err) {
      console.error("Failed to sync profile", err);
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    setConnectionStatuses((prev) => ({ ...prev, [targetUserId]: "Pending..." }));
    try {
      const response = await api.post<any>(
        "/connections/request",
        { receiverId: targetUserId },
        { token }
      );
      if (response.success) {
        toast.success("Connection request sent!");
      } else {
        setConnectionStatuses((prev) => {
          const updated = { ...prev };
          delete updated[targetUserId];
          return updated;
        });
        toast.error(response.message || "Failed to send request.");
      }
    } catch (err) {
      console.error("Error sending request", err);
      setConnectionStatuses((prev) => {
        const updated = { ...prev };
        delete updated[targetUserId];
        return updated;
      });
      toast.error("Failed to send request.");
    }
  };

  const handleRespondToRequest = async (connectionId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const response = await api.put<any>(
        `/connections/${connectionId}/respond`,
        { action },
        { token }
      );
      if (response.success) {
        toast.success(`Request ${action === "ACCEPT" ? "accepted" : "ignored"}`);
        setPendingRequests((prev) => prev.filter((req) => req.id !== connectionId));
        fetchConnections();
      } else {
        toast.error(response.message || `Failed to ${action.toLowerCase()} request.`);
      }
    } catch (err) {
      console.error("Error responding to request", err);
      toast.error("Error updating connection request.");
    }
  };

  const availableRecommendations = recommendations.filter(
    (rec) => {
      const status = connectionStatuses[rec.user.id];
      return status !== "Connected" && status !== "Pending...";
    }
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gradient">Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">Discover developers with overlapping skillsets.</p>
        </div>
        <Button onClick={syncProfile} disabled={syncing} size="sm" className="self-start sm:self-auto gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Syncing..." : "Sync Graph"}</span>
        </Button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${req.sender.id}`}>
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={req.sender.avatarUrl || ""} />
                      <AvatarFallback>{req.sender.fullName[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to={`/profile/${req.sender.id}`} className="font-semibold text-sm hover:underline">
                      {req.sender.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{req.sender.headline || "Software Developer"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleRespondToRequest(req.id, "REJECT")}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Ignore
                  </Button>
                  <Button size="sm" onClick={() => handleRespondToRequest(req.id, "ACCEPT")}>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations Grid */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" /> Recommended Developers
        </h2>

        {loading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
            <span className="text-xs">Finding matches...</span>
          </div>
        ) : availableRecommendations.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-soft">
            <Users className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-sm mb-1">No recommendations found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Sync your graph or edit your skills to find other developers with overlapping profiles.
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
    </div>
  );
};

export default Recommendations;
