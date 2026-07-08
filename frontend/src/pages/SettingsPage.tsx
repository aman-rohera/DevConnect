import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadProfilePhoto } from "@/utils/cloudinary";
import { Camera, X, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const SettingsPage = () => {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    headline: "",
    bio: "",
    avatarUrl: "",
    skills: [] as string[],
    projects: [] as any[],
    experience: [] as any[],
    education: [] as any[],
    certificates: [] as any[]
  });

  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Sub-forms local input states
  const [newProj, setNewProj] = useState({ title: "", description: "", projectUrl: "", repoUrl: "" });
  const [newExp, setNewExp] = useState({ company: "", role: "", startDate: "", endDate: "", description: "" });
  const [newEdu, setNewEdu] = useState({ school: "", degree: "", startYear: "", endYear: "" });
  const [newCert, setNewCert] = useState({ name: "", issuer: "", issueDate: "", link: "" });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>("/profile/me", { token });
      if (response.success && response.data) {
        const p = response.data;
        setForm({
          fullName: p.fullName || "",
          headline: p.headline || "",
          bio: p.bio || "",
          avatarUrl: p.avatarUrl || "",
          skills: p.skills || [],
          projects: p.projects || [],
          experience: p.experience || [],
          education: p.education || [],
          certificates: p.certificates || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      toast.error("Failed to load profile settings.");
    } finally {
      setLoading(false);
    }
  };

  const update = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast.info("Uploading avatar...");
    try {
      const secureUrl = await uploadProfilePhoto(file);
      update({ avatarUrl: secureUrl });
      toast.success("Avatar uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Avatar upload failed.");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await api.put<any>("/profile/update", {
        headline: form.headline,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        skills: form.skills,
        projects: form.projects,
        experience: form.experience,
        education: form.education,
        certificates: form.certificates
      }, { token });

      if (response.success) {
        toast.success("Profile updated successfully!");
        await refreshUser();
        navigate("/profile");
      } else {
        toast.error(response.message || "Failed to update profile.");
      }
    } catch (err: any) {
      console.error("Failed to save changes", err);
      toast.error(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        <span className="text-sm">Loading settings profile...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gradient">Edit profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update how others see you on DevConnect.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
        </Button>
      </div>

      {/* Avatar Image Section */}
      <Section title="Avatar Image" description="Your profile photo.">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={form.avatarUrl} />
            <AvatarFallback>{form.fullName[0] || "D"}</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()}>
              <Camera className="mr-1.5 h-3.5 w-3.5" /> Change avatar
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or SVG. Max 2MB.</p>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
          </div>
        </div>
      </Section>

      {/* Basics Section */}
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={form.fullName} disabled className="opacity-60 cursor-not-allowed bg-accent" />
          </Field>
          <Field label="Headline">
            <Input value={form.headline} onChange={(e) => update({ headline: e.target.value })} placeholder="e.g. Backend Architect | Node.js Specialist" />
          </Field>
        </div>
        <Field label="Bio" hint={`${form.bio.length} / 160`}>
          <Textarea rows={3} maxLength={160} value={form.bio} onChange={(e) => update({ bio: e.target.value })} placeholder="Tell us about yourself..." />
        </Field>
      </Section>

      {/* Skills Section */}
      <Section title="Skills" description="Up to 12 skills, technologies, or interests.">
        <div className="flex flex-wrap gap-1.5">
          {form.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs">
              {s}
              <button onClick={() => update({ skills: form.skills.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && skillInput.trim()) {
                e.preventDefault();
                if (form.skills.length < 12 && !form.skills.includes(skillInput.trim())) {
                  update({ skills: [...form.skills, skillInput.trim()] });
                }
                setSkillInput("");
              }
            }}
            placeholder="Add a skill and press Enter"
          />
          <Button variant="outline" onClick={() => {
            if (skillInput.trim() && form.skills.length < 12) {
              update({ skills: [...form.skills, skillInput.trim()] });
              setSkillInput("");
            }
          }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* Projects Section */}
      <Section title="Projects" description="Add or remove showcase projects.">
        <div className="space-y-3">
          {form.projects.map((proj, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{proj.title}</div>
                <div className="text-xs text-muted-foreground truncate">{proj.description}</div>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => update({ projects: form.projects.filter((_, i) => i !== idx) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-4 rounded-xl border border-border bg-surface/50 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add New Project</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Project Title" value={newProj.title} onChange={(e) => setNewProj({ ...newProj, title: e.target.value })} />
            <Input placeholder="Description" value={newProj.description} onChange={(e) => setNewProj({ ...newProj, description: e.target.value })} />
            <Input placeholder="Demo URL (https://...)" value={newProj.projectUrl} onChange={(e) => setNewProj({ ...newProj, projectUrl: e.target.value })} />
            <Input placeholder="Repo URL (https://...)" value={newProj.repoUrl} onChange={(e) => setNewProj({ ...newProj, repoUrl: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => {
            if (!newProj.title.trim() || !newProj.description.trim()) {
              toast.error("Project title and description are required.");
              return;
            }
            update({ projects: [...form.projects, newProj] });
            setNewProj({ title: "", description: "", projectUrl: "", repoUrl: "" });
          }}>
            Add Project
          </Button>
        </div>
      </Section>

      {/* Experience Section */}
      <Section title="Experience" description="Manage work history.">
        <div className="space-y-3">
          {form.experience.map((exp, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
              <div>
                <div className="font-medium text-sm">{exp.role}</div>
                <div className="text-xs text-muted-foreground">{exp.company} • {exp.startDate} - {exp.endDate || "Present"}</div>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => update({ experience: form.experience.filter((_, i) => i !== idx) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-4 rounded-xl border border-border bg-surface/50 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add New Experience</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Company" value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} />
            <Input placeholder="Role" value={newExp.role} onChange={(e) => setNewExp({ ...newExp, role: e.target.value })} />
            <Input placeholder="Start Date (e.g. June 2024)" value={newExp.startDate} onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })} />
            <Input placeholder="End Date (e.g. Present)" value={newExp.endDate} onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })} />
          </div>
          <Textarea placeholder="Description" rows={2} value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} />
          <Button size="sm" onClick={() => {
            if (!newExp.company.trim() || !newExp.role.trim() || !newExp.startDate.trim()) {
              toast.error("Company, role, and start date are required.");
              return;
            }
            update({ experience: [...form.experience, newExp] });
            setNewExp({ company: "", role: "", startDate: "", endDate: "", description: "" });
          }}>
            Add Experience
          </Button>
        </div>
      </Section>

      {/* Education Section */}
      <Section title="Education" description="Manage academic details.">
        <div className="space-y-3">
          {form.education.map((edu, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
              <div>
                <div className="font-medium text-sm">{edu.degree}</div>
                <div className="text-xs text-muted-foreground">{edu.school} • {edu.startYear} - {edu.endYear || "Present"}</div>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => update({ education: form.education.filter((_, i) => i !== idx) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-4 rounded-xl border border-border bg-surface/50 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add New Education</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="School" value={newEdu.school} onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })} />
            <Input placeholder="Degree" value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} />
            <Input placeholder="Start Year (e.g. 2020)" value={newEdu.startYear} onChange={(e) => setNewEdu({ ...newEdu, startYear: e.target.value })} />
            <Input placeholder="End Year (e.g. 2024)" value={newEdu.endYear} onChange={(e) => setNewEdu({ ...newEdu, endYear: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => {
            if (!newEdu.school.trim() || !newEdu.degree.trim() || !newEdu.startYear.trim()) {
              toast.error("School, degree, and start year are required.");
              return;
            }
            update({ education: [...form.education, newEdu] });
            setNewEdu({ school: "", degree: "", startYear: "", endYear: "" });
          }}>
            Add Education
          </Button>
        </div>
      </Section>

      {/* Certificates Section */}
      <Section title="Certificates" description="Add credential details.">
        <div className="space-y-3">
          {form.certificates.map((cert, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
              <div>
                <div className="font-medium text-sm">{cert.name}</div>
                <div className="text-xs text-muted-foreground">{cert.issuer} {cert.issueDate && `• ${cert.issueDate}`}</div>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => update({ certificates: form.certificates.filter((_, i) => i !== idx) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-4 rounded-xl border border-border bg-surface/50 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add New Certificate</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Certificate Name" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} />
            <Input placeholder="Issuer" value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} />
            <Input placeholder="Issue Date (e.g. January 2025)" value={newCert.issueDate} onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })} />
            <Input placeholder="Verification Link (https://...)" value={newCert.link} onChange={(e) => setNewCert({ ...newCert, link: e.target.value })} />
          </div>
          <Button size="sm" onClick={() => {
            if (!newCert.name.trim() || !newCert.issuer.trim()) {
              toast.error("Certificate name and issuer are required.");
              return;
            }
            update({ certificates: [...form.certificates, newCert] });
            setNewCert({ name: "", issuer: "", issueDate: "", link: "" });
          }}>
            Add Certificate
          </Button>
        </div>
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-xl border border-border bg-surface/80 p-3 backdrop-blur shadow-elevated">
        <Button variant="ghost" onClick={() => navigate("/profile")}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-soft">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {hint && <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default SettingsPage;
