import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BadgeCheck, MapPin, Building2, Globe, Github,
  Settings, MessageCircle, Link as LinkIcon, FileText,
  Image as ImageIcon, Calendar, Briefcase, GraduationCap, Award
} from "lucide-react";
import { toast } from "sonner";

export const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, token } = useAuth();

  const isMe = !username || username === currentUser?.username;

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connect");
  const [connecting, setConnecting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [username, isMe, token]);

  useEffect(() => {
    if (user?.id) {
      fetchUserPosts(user.id);
      if (!isMe) {
        fetchConnectionStatus(user.id);
      }
    }
  }, [user?.id, isMe, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const endpoint = isMe ? "/profile/me" : `/profile/username/${username}`;
      const response = await api.get<any>(endpoint, { token });
      if (response.success && response.data) {
        setUser(response.data);
        if (username && response.data.username && username !== response.data.username) {
          navigate(`/profile/${response.data.username}`, { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Failed to load profile", err);
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const response = await api.get<any>("/posts/feed", { token });
      if (response.success && response.posts) {
        // Filter posts: original posts created by this user OR posts reposted by this user
        const targetId = userId;
        const filtered = response.posts.filter(
          (p: any) => (p.user?.id === targetId && !p.repostedBy) || p.repostedBy?.id === targetId
        );
        setPosts(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch user posts", err);
    }
  };

  const fetchConnectionStatus = async (targetId: string) => {
    try {
      const response = await api.get<any>("/connections", { token });
      if (response.success && response.connections) {
        const conn = response.connections.find(
          (c: any) => c.senderId === targetId || c.receiverId === targetId
        );
        if (conn) {
          if (conn.status === "PENDING") {
            setConnectionStatus("Pending...");
          } else if (conn.status === "ACCEPTED") {
            setConnectionStatus("Connected");
          }
        } else {
          setConnectionStatus("Connect");
        }
      }
    } catch (err) {
      console.error("Failed to check connection status", err);
    }
  };

  const handleConnectRequest = async () => {
    if (!user?.id || connectionStatus !== "Connect") return;
    setConnecting(true);
    setConnectionStatus("Pending...");
    try {
      const response = await api.post<any>(
        "/connections/request",
        { receiverId: user.id },
        { token }
      );
      if (response.success) {
        toast.success("Connection request sent!");
      } else {
        setConnectionStatus("Connect");
        toast.error(response.message || "Failed to send request.");
      }
    } catch (e) {
      setConnectionStatus("Connect");
      toast.error("Failed to send connection request.");
    } finally {
      setConnecting(false);
    }
  };

  const handleMessage = async () => {
    if (!user?.id) return;
    
    try {
      // Create or get conversation from backend
      const res = await api.post<any>("/chat/conversations", { targetUserId: user.id, title: "Chat" }, { token });
      if (res.success && res.conversation) {
        navigate(`/messages?c=${res.conversation.id}`);
      } else {
        toast.error("Failed to start conversation");
      }
    } catch (err) {
      console.error("Failed to sync conversation with backend", err);
      toast.error("Error connecting to chat service");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        <span className="text-sm">Retrieving developer portfolio...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <EmptyState icon={LinkIcon} title="Profile not found" description="The profile you are looking for does not exist." />
      </div>
    );
  }

  const userPosts = posts;
  const mediaPosts = posts.filter((p) => p.imageUrl);
  const projects = user.projects || [];
  const experience = user.experience || [];
  const education = user.education || [];
  const certificates = user.certificates || [];
  const skills = user.skills || [];

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero Header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-40 sm:h-56 bg-radial-glow bg-grid">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        </div>
        <div className="relative -mt-14 px-5 pb-5 sm:px-8 sm:pb-6">
          <div className="flex items-end justify-between gap-4">
            <Avatar className="h-24 w-24 border-4 border-card ring-1 ring-border sm:h-28 sm:w-28 bg-surface">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className="text-2xl">{user.fullName[0]}</AvatarFallback>
            </Avatar>
            <div className="mb-1 flex gap-2">
              {isMe ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/settings">
                    <Settings className="mr-1.5 h-3.5 w-3.5" /> Edit profile
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleMessage}>
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Message
                  </Button>
                  <Button
                    size="sm"
                    variant={connectionStatus === "Connected" ? "outline" : "default"}
                    disabled={connectionStatus !== "Connect" || connecting}
                    onClick={handleConnectRequest}
                  >
                    {connectionStatus}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{user.fullName}</h1>
              {user.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            {user.username && (
              <div className="text-sm font-medium text-muted-foreground mb-0.5">@{user.username}</div>
            )}
            <div className="text-sm text-muted-foreground">{user.headline || "Software Developer"}</div>
            
            {user.bio && (
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">{user.bio}</p>
            )}

            <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Remote, Earth
              </span>
              {joinDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Joined {joinDate}
                </span>
              )}
            </dl>

            {skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {skills.map((s: string) => (
                  <span key={s} className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex p-1 gap-1">
          <TabsTrigger value="posts" className="py-2"><FileText className="mr-1.5 h-3.5 w-3.5" />Posts</TabsTrigger>
          <TabsTrigger value="media" className="py-2"><ImageIcon className="mr-1.5 h-3.5 w-3.5" />Media</TabsTrigger>
          <TabsTrigger value="projects" className="py-2"><Briefcase className="mr-1.5 h-3.5 w-3.5" />Projects</TabsTrigger>
          <TabsTrigger value="experience" className="py-2"><Building2 className="mr-1.5 h-3.5 w-3.5" />Experience</TabsTrigger>
          <TabsTrigger value="education" className="py-2"><GraduationCap className="mr-1.5 h-3.5 w-3.5" />Education</TabsTrigger>
          <TabsTrigger value="certificates" className="py-2"><Award className="mr-1.5 h-3.5 w-3.5" />Certificates</TabsTrigger>
        </TabsList>

        {/* Posts Tab Content */}
        <TabsContent value="posts" className="mt-4 space-y-3">
          {userPosts.length === 0 ? (
            <EmptyState icon={FileText} title="No posts yet" description="When they post updates, they will show up here." />
          ) : (
            userPosts.map((p) => <PostCard key={p.repostedBy ? `${p.id}-repost-${p.repostedBy.id}` : p.id} post={p} />)
          )}
        </TabsContent>

        {/* Media Tab Content */}
        <TabsContent value="media" className="mt-4">
          {mediaPosts.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No media yet" description="Posts with images will appear here." />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {mediaPosts.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Projects Tab Content */}
        <TabsContent value="projects" className="mt-4 space-y-3">
          {projects.length === 0 ? (
            <EmptyState icon={Briefcase} title="No projects added" description="Projects list is currently empty." />
          ) : (
            projects.map((proj: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{proj.title}</h3>
                  <div className="flex gap-2">
                    {proj.repoUrl && (
                      <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Github className="h-3 w-3" /> Repository
                      </a>
                    )}
                    {proj.projectUrl && (
                      <a href={proj.projectUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Demo
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{proj.description}</p>
              </div>
            ))
          )}
        </TabsContent>

        {/* Experience Tab Content */}
        <TabsContent value="experience" className="mt-4 space-y-3">
          {experience.length === 0 ? (
            <EmptyState icon={Building2} title="No work experience" description="No companies or roles added yet." />
          ) : (
            experience.map((exp: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-base">{exp.role}</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {exp.startDate} - {exp.endDate || "Present"}
                  </span>
                </div>
                <div className="text-sm text-primary font-medium">{exp.company}</div>
                {exp.description && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Education Tab Content */}
        <TabsContent value="education" className="mt-4 space-y-3">
          {education.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No education details" description="No schools or degrees listed." />
          ) : (
            education.map((edu: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-base">{edu.degree}</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {edu.startYear} - {edu.endYear || "Present"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{edu.school}</div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Certificates Tab Content */}
        <TabsContent value="certificates" className="mt-4 space-y-3">
          {certificates.length === 0 ? (
            <EmptyState icon={Award} title="No certificates added" description="No professional certifications listed." />
          ) : (
            certificates.map((cert: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">{cert.name}</h3>
                  <div className="text-xs text-muted-foreground">
                    Issued by <span className="text-primary font-medium">{cert.issuer}</span>
                    {cert.issueDate && ` • ${cert.issueDate}`}
                  </div>
                </div>
                {cert.link && (
                  <a href={cert.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                    Verify Link <LinkIcon className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
