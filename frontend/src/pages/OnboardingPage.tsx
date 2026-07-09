import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadProfilePhoto } from "@/utils/cloudinary";
import { Camera, X, Plus, Sparkles, ArrowRight, ArrowLeft, Loader2, Award } from "lucide-react";
import { toast } from "sonner";

export const OnboardingPage = () => {
  const { token, refreshUser, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Onboarding Form State
  const [form, setForm] = useState({
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

  // Step 3 Sub-item helper states
  const [hasWork, setHasWork] = useState(false);
  const [exp, setExp] = useState({ company: "", role: "", startDate: "June 2024", endDate: "Present", description: "" });
  
  const [hasEdu, setHasEdu] = useState(false);
  const [edu, setEdu] = useState({ school: "", degree: "", startYear: "2020", endYear: "2024" });

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

  const handleNextStep = () => {
    if (step === 1 && !form.headline.trim()) {
      toast.error("Please provide a headline describing your role.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    
    // Assemble final collections
    const experiencesList = hasWork && exp.company && exp.role ? [exp] : [];
    const educationList = hasEdu && edu.school && edu.degree ? [edu] : [];

    try {
      const response = await api.put<any>("/profile/update", {
        headline: form.headline,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        skills: form.skills,
        projects: form.projects,
        experience: experiencesList,
        education: educationList,
        certificates: form.certificates
      }, { token });

      if (response.success) {
        toast.success("Welcome aboard! Profile setup complete.");
        await refreshUser();
        navigate("/");
      } else {
        toast.error(response.message || "Failed to complete onboarding.");
      }
    } catch (err: any) {
      console.error("Onboarding submission error", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-8 pb-16 space-y-6 animate-slide-up">
      {/* Wizard Progress */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>Step {step} of 3</span>
        <div className="flex gap-1">
          <div className={`h-1.5 w-6 rounded-full transition ${step >= 1 ? "bg-primary" : "bg-border"}`} />
          <div className={`h-1.5 w-6 rounded-full transition ${step >= 2 ? "bg-primary" : "bg-border"}`} />
          <div className={`h-1.5 w-6 rounded-full transition ${step >= 3 ? "bg-primary" : "bg-border"}`} />
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <Card className="p-6 space-y-5 border-border bg-card">
          <div className="text-center space-y-1">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border bg-primary/10 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-gradient">Create Profile</h1>
            <p className="text-xs text-muted-foreground">Let's set up the fundamentals of your profile.</p>
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <Avatar className="h-20 w-20 border-2 border-border bg-surface">
              <AvatarImage src={form.avatarUrl} />
              <AvatarFallback>{currentUser?.fullName?.[0] || "D"}</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={() => avatarRef.current?.click()} className="text-[11px] h-7">
              <Camera className="mr-1 h-3.5 w-3.5" /> Upload Photo
            </Button>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="headline">Professional Headline *</Label>
              <Input
                id="headline"
                placeholder="e.g. Frontend Engineer | React Specialist"
                value={form.headline}
                onChange={(e) => update({ headline: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                maxLength={160}
                placeholder="Tell the developer community about your background, tools, and interests..."
                value={form.bio}
                onChange={(e) => update({ bio: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleNextStep} className="w-full gap-1">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      )}

      {/* Step 2: Skills */}
      {step === 2 && (
        <Card className="p-6 space-y-5 border-border bg-card">
          <div className="text-center space-y-1">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border bg-primary/10 mb-2">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-gradient">Your Skillset</h1>
            <p className="text-xs text-muted-foreground">Select or add your skills to match with other developers.</p>
          </div>

          <div className="space-y-3">
            <Label>Top Skills</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 rounded-lg border border-border bg-background">
              {form.skills.length === 0 ? (
                <span className="text-xs text-muted-foreground italic font-light">No skills added yet.</span>
              ) : (
                form.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded bg-surface border border-border px-2 py-0.5 font-mono text-[10px]">
                    {s}
                    <button onClick={() => update({ skills: form.skills.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2">
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
              placeholder="Add skill (e.g. Next.js, Docker)"
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

          {/* Quick Add Suggestions */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Suggestions</div>
            <div className="flex flex-wrap gap-1.5">
              {["TypeScript", "React", "Node.js", "Python", "PostgreSQL", "Go", "Docker"].map((s) => {
                const hasSkill = form.skills.includes(s);
                return (
                  <button
                    key={s}
                    disabled={hasSkill}
                    onClick={() => update({ skills: [...form.skills, s] })}
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] transition ${hasSkill ? "border-transparent bg-primary/10 text-primary cursor-default" : "border-border bg-surface hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    +{s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={handlePrevStep} className="flex-1 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleNextStep} className="flex-1 gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Experience & Education */}
      {step === 3 && (
        <Card className="p-6 space-y-5 border-border bg-card">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-gradient">Work & Education</h1>
            <p className="text-xs text-muted-foreground">Add your latest educational school or developer role.</p>
          </div>

          {/* Experience Accordion / Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Work Experience</Label>
              <button
                type="button"
                onClick={() => setHasWork(!hasWork)}
                className={`text-xs font-semibold ${hasWork ? "text-destructive" : "text-primary"}`}
              >
                {hasWork ? "Remove" : "+ Add Work"}
              </button>
            </div>
            {hasWork && (
              <div className="p-4 border border-border rounded-xl bg-surface/50 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Company (e.g. Vercel)" value={exp.company} onChange={(e) => setExp({ ...exp, company: e.target.value })} />
                  <Input placeholder="Role (e.g. Developer)" value={exp.role} onChange={(e) => setExp({ ...exp, role: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Start Date" value={exp.startDate} onChange={(e) => setExp({ ...exp, startDate: e.target.value })} />
                  <Input placeholder="End Date" value={exp.endDate} onChange={(e) => setExp({ ...exp, endDate: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          {/* Education Accordion / Toggle */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Education</Label>
              <button
                type="button"
                onClick={() => setHasEdu(!hasEdu)}
                className={`text-xs font-semibold ${hasEdu ? "text-destructive" : "text-primary"}`}
              >
                {hasEdu ? "Remove" : "+ Add School"}
              </button>
            </div>
            {hasEdu && (
              <div className="p-4 border border-border rounded-xl bg-surface/50 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="School Name" value={edu.school} onChange={(e) => setEdu({ ...edu, school: e.target.value })} />
                  <Input placeholder="Degree" value={edu.degree} onChange={(e) => setEdu({ ...edu, degree: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Start Year" value={edu.startYear} onChange={(e) => setEdu({ ...edu, startYear: e.target.value })} />
                  <Input placeholder="End Year" value={edu.endYear} onChange={(e) => setEdu({ ...edu, endYear: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={handlePrevStep} className="flex-1 gap-1" disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleFinish} className="flex-1 gap-1" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving</>
              ) : (
                "Finish Setup"
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OnboardingPage;
