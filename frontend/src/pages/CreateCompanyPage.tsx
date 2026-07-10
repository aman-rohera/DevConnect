import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Info, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CreateCompanyPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    slug: "",
    website: "",
    industry: "",
    size: "",
    headquarters: "",
    description: "",
    logoUrl: "",
    coverUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get<any>("/company-requests/me", { token });
        if (res.success && res.requests?.length > 0) {
          const pending = res.requests.find((r: any) => r.status === "PENDING");
          if (pending) {
            setPendingRequest(pending);
          }
        }
      } catch (error) {
        console.error("Failed to fetch company requests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      let newSlug = prev.slug;
      
      if (name === "companyName" && !isSlugManuallyEdited) {
        newSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      } else if (name === "slug") {
        setIsSlugManuallyEdited(true);
        newSlug = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      }

      return {
        ...prev,
        [name]: value,
        slug: newSlug
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.slug) {
      toast.error("Company Name and URL Slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<any>("/company-requests", formData, { token });
      if (res.success) {
        toast.success("Company request submitted successfully!");
        setPendingRequest(res.request);
      }
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        toast.error(`Validation Error: ${error.errors[0].message}`);
      } else {
        toast.error(error.message || "Failed to submit request");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingRequest) {
    return (
      <div className="mx-auto max-w-2xl w-full p-4 sm:p-6 lg:p-8 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="group mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
          
          <div className="relative">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary ring-4 ring-primary/10 shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">Request Pending</h1>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Your request to create <strong>{pendingRequest.companyName}</strong> has been received and is currently being reviewed by our platform administrators.
            </p>
            
            <div className="mx-auto max-w-sm rounded-lg border border-border/50 bg-background/50 p-4 backdrop-blur text-left">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-primary" />
                <div className="text-sm">
                  <h4 className="font-semibold text-foreground">What happens next?</h4>
                  <p className="mt-1 text-muted-foreground">We review requests to ensure authenticity. Once approved, you will automatically become the owner of the new company page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl w-full p-4 sm:p-6 lg:p-8">
      <button
        onClick={() => navigate(-1)}
        className="group mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 text-primary mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create a Company Page</h1>
        </div>
        <p className="text-muted-foreground ml-1">Submit a request to create a new company page on DevConnect.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Company Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Public URL (Slug) <span className="text-destructive">*</span>
              </label>
              <div className="flex rounded-md border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors overflow-hidden">
                <span className="flex items-center px-3 bg-muted/50 text-muted-foreground text-xs font-medium border-r border-border select-none">
                  devconnect.com/
                </span>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="acme-corp"
                  className="w-full border-0 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Industry</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="">Select industry</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Software Development">Software Development</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Company Size</label>
              <select
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Headquarters</label>
            <input
              type="text"
              name="headquarters"
              value={formData.headquarters}
              onChange={handleChange}
              placeholder="e.g. San Francisco, CA"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your company..."
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Logo URL</label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Cover Image URL</label>
              <input
                type="url"
                name="coverUrl"
                value={formData.coverUrl}
                onChange={handleChange}
                placeholder="https://example.com/cover.png"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                By clicking "Submit Request", you verify that you are an authorized representative of this organization and have the right to create and manage this page.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Request...
                </span>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
