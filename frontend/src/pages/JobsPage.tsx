import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Briefcase, Search, MapPin, Calendar, DollarSign,
  Plus, CheckCircle, Bookmark, BookmarkCheck, FileText, Send
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export const JobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [hasCompany, setHasCompany] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Dialog Open States
  const [postOpen, setPostOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "FULL_TIME",
    employmentType: "REMOTE",
    description: "",
    skills: ""
  });

  // Apply Form State
  const defaultResumeName = user ? `${user.username}_resume.pdf` : "MyResume_DevConnect.pdf";
  const [applyForm, setApplyForm] = useState({
    coverLetter: "",
    resumeName: defaultResumeName
  });

  // Keep it updated if user loads late
  useEffect(() => {
    if (user && applyForm.resumeName === "MyResume_DevConnect.pdf") {
      setApplyForm(prev => ({ ...prev, resumeName: `${user.username}_resume.pdf` }));
    }
  }, [user]);

  useEffect(() => {
    fetchJobsData();
  }, []);

  const fetchJobsData = async () => {
    try {
      const [jobsRes, savedRes, appsRes, companiesRes] = await Promise.all([
        api.get<any>("/jobs"),
        api.get<any>("/jobs/saved"),
        api.get<any>("/jobs/applications"),
        api.get<any>("/companies/mine").catch(() => ({ success: false, companies: [] }))
      ]);

      if (jobsRes.success && jobsRes.jobs) {
        setJobs(jobsRes.jobs);
      }

      if (savedRes.success && savedRes.saved) {
        setSavedJobIds(savedRes.saved.map((s: any) => s.jobId));
      }

      if (appsRes.success && appsRes.applications) {
        setApplications(appsRes.applications.map((app: any) => ({
          id: app.id,
          jobId: app.jobId,
          jobTitle: app.job?.title || 'Unknown Role',
          companyName: app.job?.company?.name || 'Unknown Company',
          companyLogo: app.job?.company?.logoUrl || '',
          appliedAt: app.createdAt,
          status: app.status
        })));
      }

      if (companiesRes.success && companiesRes.companies && companiesRes.companies.length > 0) {
        setHasCompany(true);
      }
    } catch (err) {
      console.error("Failed to load jobs", err);
    }
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !newJob.location || !newJob.description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const jobPayload = {
      title: newJob.title,
      companyId: undefined, // Backend expects this if linked to company
      location: newJob.location,
      salaryRange: newJob.salary || "Not Specified",
      type: newJob.type,
      employmentType: newJob.employmentType,
      description: newJob.description,
      requirements: newJob.skills ? newJob.skills.split(",").map(s => s.trim()) : [],
    };

    api.post<any>("/jobs", jobPayload)
      .then(res => {
        if (res.success && res.job) {
          setJobs([res.job, ...jobs]);
          toast.success("Job posting created successfully!");
          setNewJob({
            title: "",
            company: "",
            location: "",
            salary: "",
            type: "FULL_TIME",
            employmentType: "REMOTE",
            description: "",
            skills: ""
          });
          setPostOpen(false);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to create job posting");
      });
  };

  const handleToggleSaveJob = async (jobId: string) => {
    try {
      const res = await api.post<any>(`/jobs/${jobId}/save`, {});
      if (res.success) {
        if (savedJobIds.includes(jobId)) {
          setSavedJobIds(savedJobIds.filter(id => id !== jobId));
          toast.success("Job removed from saved list.");
        } else {
          setSavedJobIds([...savedJobIds, jobId]);
          toast.success("Job saved successfully!");
        }
      }
    } catch (err) {
      toast.error("Failed to save job");
    }
  };

  const handleApplyJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const resumeUrl = user?.profile?.resumeUrl || user?.resumeUrl || "https://example.com/" + applyForm.resumeName;
      const res = await api.post<any>(`/jobs/${selectedJob.id}/apply`, {
        resumeUrl,
        coverLetter: applyForm.coverLetter
      });
      if (res.success) {
        toast.success(`Successfully applied to ${selectedJob.company?.name || selectedJob.company}!`);
        setApplyOpen(false);
        setApplyForm({ coverLetter: "", resumeName: defaultResumeName });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply");
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const companyName = job.company?.name || job.company || "";
      const title = job.title || "";
      const description = job.description || "";
      const location = job.location || "";
      
      const search = searchQuery.toLowerCase();
      const matchesSearch = title.toLowerCase().includes(search) ||
        companyName.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search);
      const matchesLocation = location.toLowerCase().includes(locationQuery.toLowerCase());
      return matchesSearch && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  const savedJobs = useMemo(() => {
    return jobs.filter(job => savedJobIds.includes(job.id));
  }, [jobs, savedJobIds]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gradient">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search open opportunities or post job vacancies to recruit talent.</p>
        </div>

        {hasCompany && (
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 self-start sm:self-auto">
                <Plus className="h-4 w-4" />
                <span>Post a Job</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-xl p-6 border-border bg-surface max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post a Job Opportunity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostJob} className="space-y-4 mt-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="job-title">Job Title *</Label>
                  <Input id="job-title" placeholder="e.g. Lead React Developer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="job-company">Company Name *</Label>
                  <Input id="job-company" placeholder="e.g. Vercel" value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="job-location">Location *</Label>
                  <Input id="job-location" placeholder="e.g. London, UK (or Remote)" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="job-salary">Salary Range</Label>
                  <Input id="job-salary" placeholder="e.g. $120k - $150k" value={newJob.salary} onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="job-type">Job Type</Label>
                  <select
                    id="job-type"
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="job-emp-type">Employment Workspace</Label>
                  <select
                    id="job-emp-type"
                    value={newJob.employmentType}
                    onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-Site</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-skills">Required Skills (Comma separated)</Label>
                <Input id="job-skills" placeholder="React, Node.js, GraphQL" value={newJob.skills} onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-desc">Job Description *</Label>
                <Textarea id="job-desc" rows={4} placeholder="Describe the role responsibilities, team dynamics..." value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setPostOpen(false)}>Cancel</Button>
                <Button type="submit">Post Job</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="find">
        <TabsList>
          <TabsTrigger value="find">Find Jobs</TabsTrigger>
          <TabsTrigger value="saved">
            Saved Jobs <span className="ml-1.5 font-mono text-xs text-muted-foreground">{savedJobIds.length}</span>
          </TabsTrigger>
          <TabsTrigger value="applications">
            My Applications <span className="ml-1.5 font-mono text-xs text-muted-foreground">{applications.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Find Jobs */}
        <TabsContent value="find" className="mt-4 space-y-6">
          {/* Search Row */}
          <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, company, skills..."
                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border-strong"
              />
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Location (e.g. Remote, SF)..."
                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-border-strong"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Jobs List */}
            <div className="space-y-3">
              {filteredJobs.length === 0 ? (
                <EmptyState icon={Briefcase} title="No jobs found" description="Try broadening your search term or checking again later." />
              ) : (
                filteredJobs.map((job) => (
                  <Card
                    key={job.id}
                    className={`p-4 border transition cursor-pointer hover:border-border-strong ${selectedJob?.id === job.id ? "border-primary bg-primary/[0.02]" : "border-border bg-card"}`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0">
                        <img src={job.company?.logoUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${job.id}`} alt={job.company?.name || "Company"} className="h-8 w-8 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm sm:text-base leading-none hover:text-primary transition">{job.title}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSaveJob(job.id);
                            }}
                            className="text-muted-foreground hover:text-primary transition shrink-0 ml-2"
                            aria-label="Save Job"
                          >
                            {savedJobIds.includes(job.id) ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <span className="text-foreground/80">{job.company?.name || "Unknown Company"}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="rounded bg-accent border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase">
                            {job.type.replace("_", " ")}
                          </span>
                          <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 font-mono text-[9px] text-primary uppercase">
                            {job.employmentType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Job Details Sidebar Panel */}
            <div>
              {selectedJob ? (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-5 sticky top-20 shadow-soft">
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-xl border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0">
                      <img src={selectedJob.company?.logoUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${selectedJob.id}`} alt={selectedJob.company?.name || "Company"} className="h-10 w-10 object-contain" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base sm:text-lg leading-tight">{selectedJob.title}</h2>
                      <div className="text-xs text-muted-foreground mt-0.5 font-medium">{selectedJob.company?.name || "Unknown Company"}</div>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-y-3 gap-x-1.5 border-y border-border py-4 text-xs text-muted-foreground">
                    <div className="space-y-0.5">
                      <dt className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Location</dt>
                      <dd className="text-foreground font-medium flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /> {selectedJob.location}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Salary Range</dt>
                      <dd className="text-foreground font-medium flex items-center gap-1"><DollarSign className="h-3 w-3 text-muted-foreground" /> {selectedJob.salary}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Job Type</dt>
                      <dd className="text-foreground font-medium capitalize">{selectedJob.type.toLowerCase().replace("_", " ")}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Posted</dt>
                      <dd className="text-foreground font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(selectedJob.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </dd>
                    </div>
                  </dl>

                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Required Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.skills.map((s: any, idx: number) => {
                          const skillName = s?.skill?.name || s?.name || (typeof s === "string" ? s : "Skill");
                          return (
                            <span key={idx} className="rounded bg-surface border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {skillName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm leading-relaxed">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Job Description</h4>
                    <p className="text-muted-foreground whitespace-pre-line text-xs">{selectedJob.description}</p>
                  </div>

                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleToggleSaveJob(selectedJob.id)}>
                      {savedJobIds.includes(selectedJob.id) ? "Saved" : "Save Job"}
                    </Button>
                    
                    {applications.some(app => app.jobId === selectedJob?.id) ? (
                      <Button size="sm" className="flex-1" variant="secondary" disabled>
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Applied
                      </Button>
                    ) : (
                      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1">Apply Now</Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-md p-6 border-border bg-surface">
                        <DialogHeader>
                          <DialogTitle>Apply to {selectedJob.company?.name || "Company"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleApplyJob} className="space-y-4 mt-3">
                          <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</div>
                            <div className="font-semibold text-sm">{selectedJob.title}</div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="resume-file">Select Resume</Label>
                            <div className="flex items-center gap-2 border border-border rounded-lg bg-background p-2.5 text-xs text-muted-foreground font-mono">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate flex-1">{applyForm.resumeName}</span>
                              {(user?.profile?.resumeUrl || user?.resumeUrl) && (
                                <a 
                                  href={user.profile?.resumeUrl || user.resumeUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline font-semibold tracking-wide mr-2"
                                >
                                  Preview
                                </a>
                              )}
                              <Button type="button" variant="outline" size="icon" className="h-6 w-6 text-[10px]" title="Upload new resume">...</Button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="apply-cover">Cover Letter / Message to Recruiter</Label>
                            <Textarea
                              id="apply-cover"
                              rows={4}
                              placeholder="Introduce yourself and explain why you're a fit..."
                              value={applyForm.coverLetter}
                              onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <Button type="button" variant="ghost" onClick={() => setApplyOpen(false)}>Cancel</Button>
                            <Button type="submit" className="gap-1.5">
                              <Send className="h-3.5 w-3.5" /> Submit Application
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border border-dashed bg-card/40 p-8 text-center text-muted-foreground text-xs h-40 flex items-center justify-center">
                  Select a job posting to view details and apply.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Saved Jobs */}
        <TabsContent value="saved" className="mt-4">
          {savedJobs.length === 0 ? (
            <EmptyState icon={Bookmark} title="No saved jobs" description="Jobs you save will appear here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
              {savedJobs.map((job) => (
                <Card key={job.id} className="p-4 border border-border bg-card flex justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-lg border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0">
                      <img src={job.company?.logoUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${job.id}`} alt={job.company?.name || "Company"} className="h-6 w-6 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                      <div className="text-[11px] text-muted-foreground">{job.company?.name || "Unknown Company"} • {job.location}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive shrink-0 h-8 px-2" onClick={() => handleToggleSaveJob(job.id)}>
                    Remove
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: My Applications */}
        <TabsContent value="applications" className="mt-4">
          {applications.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No applications yet" description="Track the status of roles you have applied for here." />
          ) : (
            <div className="space-y-3 max-w-3xl">
              {applications.map((app) => (
                <Card key={app.id} className="p-4 border border-border bg-card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0">
                      <img src={app.companyLogo} alt={app.companyName} className="h-6 w-6 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{app.jobTitle}</h3>
                      <div className="text-[11px] text-muted-foreground">{app.companyName} • Applied {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase shrink-0">
                    {app.status}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobsPage;
