import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Users, Briefcase, FileText, Send, Mail, Plus, ArrowRight } from "lucide-react";

export const CompanyDashboardPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [managedCompanies, setManagedCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EMPLOYEE");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      if (id) setDashboard(null);
      try {
        if (!id) {
          const mineRes = await api.get<any>("/companies/mine");
          if (mineRes.success && mineRes.companies) {
            setManagedCompanies(mineRes.companies);
          }
          setLoading(false);
          return;
        }

        const res = await api.get<any>(`/companies/${id}/dashboard`);
        if (res.success && res.dashboard) {
          setDashboard(res.dashboard);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        if (id) setLoading(false);
      }
    };
    fetchDashboard();
  }, [id, navigate]);

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

  const handleUpdateAppStatus = async (appId: string, newStatus: string) => {
    try {
      await api.put(`/jobs/applications/${appId}/status`, { status: newStatus });
      setDashboard((prev: any) => ({
        ...prev,
        jobs: prev.jobs.map((job: any) => ({
          ...job,
          applications: job.applications.map((app: any) => 
            app.id === appId ? { ...app, status: newStatus } : app
          )
        }))
      }));
    } catch (err: any) {
      alert("Failed to update status.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!dashboard) {
    if (!id) {
      if (managedCompanies.length === 0) {
        return (
          <div className="mx-auto max-w-5xl pt-12">
            <EmptyState icon={Building2} title="No Companies" description="You do not manage any companies yet." />
            <div className="mt-4 flex justify-center">
              <Button asChild>
                <Link to="/companies/create">Create a Company</Link>
              </Button>
            </div>
          </div>
        );
      }
      return (
        <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-8">
          <h1 className="text-2xl font-bold tracking-tight">Your Managed Companies</h1>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {managedCompanies.map(company => (
              <Link key={company.id} to={`/companies/${company.id}/manage`} className="block group">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md h-full flex flex-col">
                  <Avatar className="h-12 w-12 rounded-lg border border-border mb-4">
                    <AvatarImage src={company.logoUrl} />
                    <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{company.description}</p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    Manage Dashboard <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
            <Link to="/companies/create" className="block">
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px] hover:bg-muted/50 transition">
                <div className="rounded-full bg-primary/10 p-3 text-primary mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-foreground">Create New Company</h3>
                <p className="text-sm text-muted-foreground mt-1">Start a new company profile</p>
              </div>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl pt-12">
        <EmptyState icon={Building2} title="Access Denied" description="You do not manage any companies or lack permission to view this dashboard." />
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link to="/companies/create">Create a Company</Link>
          </Button>
        </div>
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

      {/* Active Jobs & Applications */}
      <div className="space-y-6 pt-6">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3">Active Jobs & Applications</h2>
        
        {dashboard.jobs?.length === 0 ? (
          <EmptyState icon={Briefcase} title="No active jobs" description="Post a job to start receiving applications." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {dashboard.jobs?.map((job: any) => (
              <div key={job.id} className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
                <div className="border-b border-border bg-muted/30 px-6 py-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1">{job.location} • {job.type?.replace("_", " ")}</div>
                    </div>
                    <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold shrink-0">
                      {job.applications?.length || 0} Applicants
                    </div>
                  </div>
                </div>
                
                <div className="p-0 flex-1 flex flex-col">
                  {job.applications?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground flex-1 flex items-center justify-center border-t border-border">
                      No applications yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {job.applications?.map((app: any) => (
                        <div key={app.id} className="p-4 px-6 flex items-start gap-4 hover:bg-muted/50 transition">
                          <Link to={`/profile/${app.user?.username || app.user?.id}`} className="shrink-0">
                            <Avatar className="h-10 w-10 shrink-0 hover:opacity-80 transition-opacity">
                              <AvatarImage src={app.user?.profile?.avatarUrl} />
                              <AvatarFallback>{app.user?.fullName?.[0]}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/profile/${app.user?.username || app.user?.id}`} className="hover:underline">
                              <div className="font-medium truncate">{app.user?.fullName}</div>
                            </Link>
                            <div className="text-xs text-muted-foreground truncate">{app.user?.email}</div>
                            <div className="mt-2 flex items-center gap-3">
                              <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <FileText className="h-3 w-3" /> View Resume
                              </a>
                              <select 
                                value={app.status} 
                                onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                                className="text-[10px] uppercase font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded outline-none bg-background cursor-pointer hover:border-primary/50 transition"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="REVIEWING">Reviewing</option>
                                <option value="INTERVIEWING">Interviewing</option>
                                <option value="OFFERED">Offered</option>
                                <option value="HIRED">Hired</option>
                                <option value="REJECTED">Rejected</option>
                              </select>
                            </div>
                            {app.coverLetter && (
                              <div className="mt-2 text-xs text-muted-foreground bg-background rounded-md border border-border p-2 italic line-clamp-2">
                                "{app.coverLetter}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default CompanyDashboardPage;
