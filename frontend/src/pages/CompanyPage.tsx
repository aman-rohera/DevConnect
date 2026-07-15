import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Users, Briefcase, Globe } from "lucide-react";

export const CompanyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Just visually mocked for now

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get<any>(`/companies/slug/${slug}`);
        if (res.success && res.company) {
          setCompany(res.company);
        }
      } catch (err) {
        console.error("Failed to load company:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [slug]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading company profile...</div>;
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl pt-12">
        <EmptyState icon={Building2} title="Company Not Found" description="The company you are looking for does not exist." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 sm:h-48" />
        <div className="px-6 pb-6 pt-0 sm:px-8">
          <div className="relative -mt-12 mb-4 flex items-end justify-between sm:-mt-16 sm:mb-6">
            <Avatar className="h-24 w-24 rounded-xl border-4 border-surface bg-background shadow-sm sm:h-32 sm:w-32">
              <AvatarImage src={company.logoUrl || ""} alt={company.name} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-muted text-4xl text-muted-foreground">
                <Building2 className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button variant={isFollowing ? "outline" : "default"} onClick={() => setIsFollowing(!isFollowing)}>
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
              {company.isVerified && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary" title="Verified">
                  ✓
                </span>
              )}
            </div>
            <p className="mt-1 text-lg text-muted-foreground">{company.tagline || "No tagline available"}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {company.industry && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                {company.industry}
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {company._count?.followers || 0} followers
            </div>
            {company.employeeCount && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {company.employeeCount} employees
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold">About</h2>
            <div className="mt-4 whitespace-pre-line text-sm text-foreground/90">
              {company.description || "No description provided."}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Recent Posts</h2>
            {company.posts && company.posts.length > 0 ? (
              <div className="space-y-4">
                {company.posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">This company hasn't posted anything yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Open Jobs</h2>
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{company._count?.jobs || 0} active openings</div>
                  <div className="text-xs text-muted-foreground">View all jobs on DevConnect</div>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link to="/jobs">Explore Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CompanyPage;
