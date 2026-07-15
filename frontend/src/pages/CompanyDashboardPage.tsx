import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Users, Briefcase, FileText, Send, Mail } from "lucide-react";

export const CompanyDashboardPage = () => {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get<any>(`/companies/${id}/dashboard`);
        if (res.success && res.dashboard) {
          setDashboard(res.dashboard);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await api.post(`/companies/${id}/invites`, { email: inviteEmail, role: inviteRole });
      alert("Invitation sent!");
      setInviteEmail("");
      // Ideally refresh dashboard here
    } catch (err: any) {
      alert(err.message || "Failed to invite");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-5xl pt-12">
        <EmptyState icon={Building2} title="Access Denied" description="You do not have access to this company dashboard." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Avatar className="h-16 w-16 rounded-lg border border-border">
          <AvatarImage src={dashboard.logoUrl || ""} alt={dashboard.name} className="object-cover" />
          <AvatarFallback className="rounded-lg bg-muted"><Building2 /></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
          <p className="text-muted-foreground">Management Dashboard</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <h3 className="font-medium">Total Members</h3>
          </div>
          <p className="mt-4 text-3xl font-bold">{dashboard.members?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <h3 className="font-medium">Followers</h3>
          </div>
          <p className="mt-4 text-3xl font-bold">{dashboard._count?.followers || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Briefcase className="h-5 w-5" />
            <h3 className="font-medium">Active Jobs</h3>
          </div>
          <p className="mt-4 text-3xl font-bold">{dashboard.jobs?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <h3 className="font-medium">Applications</h3>
          </div>
          <p className="mt-4 text-3xl font-bold">{dashboard._count?.applications || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold">Team Members</h2>
            </div>
            <div className="divide-y divide-border">
              {dashboard.members?.map((m: any) => (
                <div key={m.userId} className="flex items-center gap-4 px-6 py-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.user.profile?.avatarUrl || ""} />
                    <AvatarFallback>{m.user.fullName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{m.user.fullName}</div>
                    <div className="text-xs text-muted-foreground">{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Invite New Member
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email address..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <Button type="submit">
                  <Send className="h-4 w-4 mr-2" /> Send Invite
                </Button>
              </div>
            </form>
          </div>

          {dashboard.invitations?.length > 0 && (
            <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-6 py-4">
                <h2 className="font-semibold">Pending Invitations</h2>
              </div>
              <div className="divide-y divide-border">
                {dashboard.invitations.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <div className="font-medium">{inv.invitee?.fullName || inv.invitee?.email}</div>
                      <div className="text-xs text-muted-foreground">Invited as {inv.role}</div>
                    </div>
                    <div className="text-xs text-muted-foreground border border-border rounded-full px-2 py-1">Pending</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CompanyDashboardPage;
