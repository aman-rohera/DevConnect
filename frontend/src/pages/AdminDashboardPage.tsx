
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { ShieldAlert, Users, Building2, Briefcase, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminDashboardPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not admin (double check, route wrapper should also handle this)
  useEffect(() => {
    if (user?.role !== "ADMIN") {
      toast.error("Unauthorized. You must be an Admin.");
      // Optional: navigate("/")
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await api.get<any>("/admin/dashboard-stats", { token });
        if (res.success) setStats(res.stats);
      } else if (activeTab === "requests") {
        const res = await api.get<any>("/admin/company-requests?status=PENDING", { token });
        if (res.success) setRequests(res.requests);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, token]);

  const handleApprove = async (id: string) => {
    try {
      const res = await api.put<any>(`/admin/company-requests/${id}/approve`, {}, { token });
      if (res.success) {
        toast.success("Company request approved!");
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Enter a reason for rejection (required):");
    if (!reason || reason.length < 5) {
      toast.error("Rejection reason must be at least 5 characters.");
      return;
    }
    try {
      const res = await api.put<any>(`/admin/company-requests/${id}/reject`, { reason }, { token });
      if (res.success) {
        toast.success("Company request rejected.");
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: ShieldAlert },
    { id: "requests", label: "Company Requests", icon: Building2 },
  ];

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view the Admin Dashboard.</p>
        <p className="text-sm mt-4">Tip: Manually change your user role to "ADMIN" in Prisma Studio to access this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl w-full p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-primary" /> Platform Administration
        </h1>
        <p className="text-muted-foreground mt-1">Manage users, companies, and platform moderation.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && stats && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
                <StatCard title="Total Companies" value={stats.totalCompanies} icon={Building2} />
                <StatCard title="Total Jobs" value={stats.totalJobs} icon={Briefcase} />
                <StatCard title="Pending Requests" value={stats.pendingRequests} icon={FileText} highlight />
              </div>
            )}

            {activeTab === "requests" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Pending Company Requests</h2>
                {requests.length === 0 ? (
                  <div className="rounded-xl border border-border border-dashed bg-surface p-12 text-center text-muted-foreground">
                    No pending company requests at the moment.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {requests.map((req) => (
                      <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{req.companyName}</h3>
                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-500 border border-yellow-500/20">
                              PENDING
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground grid gap-1">
                            <p><strong>URL Slug:</strong> devconnect.com/{req.slug}</p>
                            <p><strong>Requester:</strong> {req.requester?.fullName} ({req.requester?.email})</p>
                            {req.description && <p className="mt-1 line-clamp-2"><strong>Bio:</strong> {req.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReject(req.id)}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:bg-primary-hover"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, highlight }: any) {
  return (
    <div className={cn(
      "rounded-xl border p-6 flex flex-col gap-4 shadow-sm",
      highlight ? "border-primary/50 bg-primary/5" : "border-border bg-surface"
    )}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
        <Icon className={cn("h-5 w-5", highlight ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
