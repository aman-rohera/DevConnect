import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { uploadProfilePhoto, uploadMediaFile } from '../utils/cloudinary';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { 
  Terminal, 
  Globe, 
  Users, 
  Briefcase, 
  LogOut, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  Code, 
  BookOpen, 
  ExternalLink,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Eye,
  TrendingUp,
  UserPlus,
  Award,
  GraduationCap,
  Camera,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Share2,
  ThumbsUp
} from 'lucide-react';
import type { ApiResponse } from '../types';
import './Profile.css';

interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  projectUrl?: string;
  repoUrl?: string;
}

interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface EducationItem {
  school: string;
  degree: string;
  startYear: string;
  endYear?: string;
}

interface CertificateItem {
  name: string;
  issuer: string;
  issueDate?: string;
  link?: string;
}

export const Profile: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Profile basic fields state
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [createdAtDate, setCreatedAtDate] = useState('');

  // Expanded fields state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [certificates, setCertificateList] = useState<CertificateItem[]>([]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Hidden file input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-forms addition states (for adding items in Edit Mode)
  const [newProject, setNewProject] = useState({ title: '', description: '', repoUrl: '', projectUrl: '' });
  const [newExp, setNewExp] = useState({ company: '', role: '', startDate: '', endDate: '', description: '' });
  const [newEdu, setNewEdu] = useState({ school: '', degree: '', startYear: '', endYear: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', issueDate: '', link: '' });

  // Post Feature States (Local Only)
  interface LocalPost {
    id: string;
    caption: string;
    media: { url: string; type: 'image' | 'video' }[];
    createdAt: string;
    likes: number;
    hasLiked?: boolean;
    commentsCount: number;
    author: { name: string; avatar: string; headline: string };
  }

  const [posts, setPosts] = useState<LocalPost[]>([
    {
      id: 'post-1',
      caption: 'Excited to announce that I have successfully completed the migration of our main backend server from Express interactive transactions to direct connection clients, reducing database response times by 35%! 🚀 #webdev #backend #postgres #prisma @Aisha Vance thanks for the code review advice!',
      media: [
        { url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80', type: 'image' }
      ],
      createdAt: '2 days ago',
      likes: 12,
      hasLiked: false,
      commentsCount: 3,
      author: { name: 'John Doe', avatar: '', headline: 'Software Engineer' }
    },
    {
      id: 'post-2',
      caption: 'Just built a clean dark-blue glassmorphic profile section with timeline components for education and work history. Leveraging custom backdrop filters, harmony colors (indigo-slate glow), and responsive grids. Thoughts on this design? 🎨🔥 #design #uiux #reactjs',
      media: [
        { url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', type: 'image' },
        { url: 'https://images.unsplash.com/photo-1541462608141-2f58c6e68e67?auto=format&fit=crop&w=800&q=80', type: 'image' }
      ],
      createdAt: '5 days ago',
      likes: 24,
      hasLiked: true,
      commentsCount: 8,
      author: { name: 'John Doe', avatar: '', headline: 'Software Engineer' }
    }
  ]);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; previewUrl: string; type: 'image' | 'video' }[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploadingPost, setUploadingPost] = useState(false);
  
  // Mention search states
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [textareaCursorPos, setTextareaCursorPos] = useState(0);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Media carousel active indexes for posts list
  const [activeMediaIndexes, setActiveMediaIndexes] = useState<Record<string, number>>({});

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Interactive mock members sidebar state
  const [mockMembers, setMockMembers] = useState([
    {
      id: 'm1',
      name: 'Linus Torvalds',
      headline: 'Creator of Linux & Git',
      avatar: '💻',
      status: 'Connect'
    },
    {
      id: 'm2',
      name: 'Aisha Vance',
      headline: 'Staff Engineer @ Supabase',
      avatar: '⚡',
      status: 'Connect'
    },
    {
      id: 'm3',
      name: 'Sarah Drasner',
      headline: 'VP of Developer Experience • Author',
      avatar: '🎨',
      status: 'Connect'
    }
  ]);

  // Load user profile details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      setError('');
      try {
        const response = await api.get<ApiResponse<any>>('/profile/me');
        if (response.success && response.data) {
          const profileData = response.data;
          setFullName(profileData.fullName || '');
          setHeadline(profileData.headline || '');
          setBio(profileData.bio || '');
          setAvatarUrl(profileData.avatarUrl || '');
          setSkills(profileData.skills || []);
          setProjects(profileData.projects || []);
          setExperience(profileData.experience || []);
          setEducation(profileData.education || []);
          setCertificateList(profileData.certificates || []);
          
          if (profileData.createdAt) {
            const date = new Date(profileData.createdAt);
            setCreatedAtDate(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile details. Please try again.');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  // Post Actions & Carousel Navigation
  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = !post.hasLiked;
        return {
          ...post,
          hasLiked,
          likes: hasLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  const handleNextMedia = (postId: string, mediaLength: number) => {
    setActiveMediaIndexes(prev => {
      const current = prev[postId] || 0;
      return {
        ...prev,
        [postId]: (current + 1) % mediaLength
      };
    });
  };

  const handlePrevMedia = (postId: string, mediaLength: number) => {
    setActiveMediaIndexes(prev => {
      const current = prev[postId] || 0;
      return {
        ...prev,
        [postId]: (current - 1 + mediaLength) % mediaLength
      };
    });
  };

  // Caption parsing to highlight hashtags and mentions
  const formatCaption = (text: string) => {
    if (!text) return '';
    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('#') && word.length > 1) {
        return <span key={idx} className="highlighted-hashtag">{word}</span>;
      }
      if (word.startsWith('@') && word.length > 1) {
        return <span key={idx} className="highlighted-mention">{word}</span>;
      }
      return word;
    });
  };

  // Post Creator Modal Event Handlers
  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPostCaption(value);
    
    // Check cursor position to trigger mentions suggestions
    const cursorPos = e.target.selectionStart;
    setTextareaCursorPos(cursorPos);
    
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1 && lastAtPos >= textBeforeCursor.lastIndexOf(' ')) {
      const query = textBeforeCursor.slice(lastAtPos + 1);
      setMentionQuery(query);
      setShowMentionDropdown(true);
      
      // Calculate cursor position for absolute dropdown styling
      const textarea = e.target;
      const { offsetTop, offsetLeft } = textarea;
      setMentionPosition({
        top: offsetTop + 60,
        left: Math.min(offsetLeft + (query.length * 8) + 20, 300)
      });
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (memberName: string) => {
    if (!postTextareaRef.current) return;
    
    const formattedName = memberName.replace(/\s+/g, '_'); // Replace spaces with underscores for easier tagging e.g. @Aisha_Vance
    const value = postCaption;
    const textBeforeCursor = value.slice(0, textareaCursorPos);
    const textAfterCursor = value.slice(textareaCursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    const newValue = value.slice(0, lastAtPos) + '@' + formattedName + ' ' + textAfterCursor;
    setPostCaption(newValue);
    setShowMentionDropdown(false);
    
    // Refocus on textarea and set cursor position after inserted mention
    setTimeout(() => {
      if (postTextareaRef.current) {
        postTextareaRef.current.focus();
        const newCursorPos = lastAtPos + formattedName.length + 2; // +2 for @ and trailing space
        postTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: typeof selectedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      newFiles.push({ file, previewUrl, type });
    }
    
    setSelectedFiles([...selectedFiles, ...newFiles]);
    setPreviewIndex(0);
  };

  const handleRemoveSelectedFile = (indexToRemove: number) => {
    const fileToRemove = selectedFiles[indexToRemove];
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    const updated = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updated);
    setPreviewIndex(prev => Math.max(0, Math.min(prev, updated.length - 1)));
  };

  const handlePrevPreview = () => {
    setPreviewIndex(prev => (prev - 1 + selectedFiles.length) % selectedFiles.length);
  };

  const handleNextPreview = () => {
    setPreviewIndex(prev => (prev + 1) % selectedFiles.length);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption.trim() && selectedFiles.length === 0) return;
    
    setUploadingPost(true);
    setError('');
    
    try {
      const uploadedMedia: { url: string; type: 'image' | 'video' }[] = [];
      
      // Upload files sequentially to Cloudinary
      for (const fileObj of selectedFiles) {
        const result = await uploadMediaFile(fileObj.file);
        uploadedMedia.push({
          url: result.url,
          type: result.type
        });
      }

      // Construct local post
      const newPost: LocalPost = {
        id: `post-${Date.now()}`,
        caption: postCaption,
        media: uploadedMedia,
        createdAt: 'Just now',
        likes: 0,
        hasLiked: false,
        commentsCount: 0,
        author: {
          name: user?.fullName || fullName || 'Developer',
          avatar: user?.profile?.avatar_url || avatarUrl || '',
          headline: user?.profile?.headline || headline || 'Software Engineer'
        }
      };

      // Add to posts state
      setPosts([newPost, ...posts]);
      
      // Clean up local blob URLs
      selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));

      // Reset states
      setPostCaption('');
      setSelectedFiles([]);
      setPreviewIndex(0);
      setIsPostModalOpen(false);
      setSuccess('Activity post created successfully!');
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Image or video upload to Cloudinary failed.');
    } finally {
      setUploadingPost(false);
    }
  };

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanSkill = skillInput.trim();
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Cloudinary image upload handlers
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      const secureUrl = await uploadProfilePhoto(file);
      setAvatarUrl(secureUrl);
      setSuccess('Profile photo uploaded to Cloudinary successfully!');
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Image upload to Cloudinary failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Add Item to Array helpers in Edit Mode
  const handleAddProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      setError('Project title and description are required.');
      return;
    }
    setProjects([...projects, { ...newProject }]);
    setNewProject({ title: '', description: '', repoUrl: '', projectUrl: '' });
    setError('');
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, idx) => idx !== index));
  };

  const handleAddExperience = () => {
    if (!newExp.company.trim() || !newExp.role.trim() || !newExp.startDate.trim()) {
      setError('Company, role, and start date are required.');
      return;
    }
    setExperience([...experience, { ...newExp }]);
    setNewExp({ company: '', role: '', startDate: '', endDate: '', description: '' });
    setError('');
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(experience.filter((_, idx) => idx !== index));
  };

  const handleAddEducation = () => {
    if (!newEdu.school.trim() || !newEdu.degree.trim() || !newEdu.startYear.trim()) {
      setError('School, degree, and start year are required.');
      return;
    }
    setEducation([...education, { ...newEdu }]);
    setNewEdu({ school: '', degree: '', startYear: '', endYear: '' });
    setError('');
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, idx) => idx !== index));
  };

  const handleAddCertificate = () => {
    if (!newCert.name.trim() || !newCert.issuer.trim()) {
      setError('Certificate name and issuer are required.');
      return;
    }
    setCertificateList([...certificates, { ...newCert }]);
    setNewCert({ name: '', issuer: '', issueDate: '', link: '' });
    setError('');
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificateList(certificates.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.put<ApiResponse<any>>('/profile/update', {
        headline,
        bio,
        avatarUrl,
        skills,
        projects,
        experience,
        education,
        certificates
      });

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        await refreshUser();
      } else {
        throw new Error(response.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectClick = (id: string) => {
    setMockMembers(prev => prev.map(member => {
      if (member.id === id) {
        const nextStatus = member.status === 'Connect' ? 'Pending...' : member.status === 'Pending...' ? 'Connected' : 'Connect';
        return { ...member, status: nextStatus };
      }
      return member;
    }));
  };

  if (fetching) {
    return (
      <div className="dc-profile-page flex-center">
        <Card glow style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <Terminal className="dc-nav-logo-icon" style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 16px auto', width: '36px', height: '36px' }} />
          <h3 style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>Establishing Secure Connection</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>Fetching developer credentials...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="dc-profile-page">
      {/* Top Navbar */}
      <nav className="dc-nav glass-panel">
        <div className="container dc-nav-content">
          <div className="dc-nav-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Terminal className="dc-nav-logo-icon" />
            <span className="dc-nav-logo-text text-gradient">DevConnect</span>
          </div>

          <div className="dc-nav-links">
            <a href="#" className="dc-nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
              <Globe size={18} />
              <span>Feed</span>
            </a>
            <a href="#network" className="dc-nav-link">
              <Users size={18} />
              <span>Network</span>
            </a>
            <a href="#jobs" className="dc-nav-link">
              <Briefcase size={18} />
              <span>Jobs</span>
            </a>
          </div>

          <div className="dc-nav-user">
            <div className="dc-nav-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="dc-nav-user-badge">ROOT</span>
              <span className="dc-nav-user-name">{user?.fullName || fullName || 'Developer'}</span>
            </div>
            <Button variant="danger" className="dc-nav-logout-btn" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Profile Main Grid */}
      <div className="container dc-profile-grid">
        {/* Left/Main column */}
        <main className="dc-profile-main">
          {error && <div className="dc-alert dc-alert-error">{error}</div>}
          {success && <div className="dc-alert dc-alert-success">{success}</div>}

          {/* Profile Header Card */}
          <Card className="dc-profile-header-card">
            <div className="dc-profile-banner" />
            <div className="dc-profile-header-content">
              <div 
                className={`dc-profile-avatar-outer ${isEditing ? 'dc-editable-avatar' : ''}`}
                onClick={handleAvatarClick}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="dc-profile-avatar-img" />
                ) : (
                  <span className="dc-profile-avatar-fallback">💻</span>
                )}
                
                {isEditing && (
                  <>
                    <div className="dc-avatar-upload-overlay">
                      <Camera size={20} />
                      <span style={{ marginTop: '4px' }}>Upload Photo</span>
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </>
                )}

                {uploadingImage && (
                  <div className="dc-avatar-upload-spinner">
                    <div className="dc-spinner-icon" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="dc-profile-meta-info">
                  <div className="dc-profile-main-details">
                    <h1 className="dc-profile-name-title">{fullName || 'Developer Profile'}</h1>
                    <p className="dc-profile-headline-text">{headline || 'Software Engineer'}</p>
                    
                    <div className="dc-profile-extra-meta">
                      <span className="dc-profile-meta-item">
                        <MapPin size={14} />
                        <span>Remote, Earth</span>
                      </span>
                      <span className="dc-profile-meta-item">
                        <LinkIcon size={14} />
                        <span className="text-gradient">Contact Info</span>
                      </span>
                      {createdAtDate && (
                        <span className="dc-profile-meta-item">
                          <Calendar size={14} />
                          <span>Joined {createdAtDate}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    onClick={() => setIsEditing(true)} 
                    style={{ gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Profile</span>
                  </Button>
                </div>
              ) : (
                <div className="dc-profile-form">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <Input
                      label="Full Name"
                      value={fullName}
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    />
                    <Input
                      label="Professional Headline"
                      placeholder="e.g. Backend Architect | Node.js Specialist"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {!isEditing && (
                <div style={{ display: 'flex', gap: '24px', marginTop: '20px', padding: '16px 0 0 0', borderTop: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} style={{ color: 'hsl(var(--primary))' }} />
                    <span style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                      <strong style={{ color: 'hsl(var(--text-primary))' }}>182</strong> profile views
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: 'hsl(var(--secondary))' }} />
                    <span style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                      <strong style={{ color: 'hsl(var(--text-primary))' }}>1,402</strong> post impressions
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* About Card */}
          <Card className="dc-profile-section-card">
            <h2 className="dc-profile-section-title">About</h2>
            {!isEditing ? (
              <p className="dc-profile-bio-text">
                {bio || 'Write a brief description of your experience, technology interests, and background... Click "Edit Profile" to add details!'}
              </p>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '500', color: 'hsl(var(--text-secondary))' }}>Bio Summary</label>
                <textarea
                  className="dc-create-post-input"
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical', paddingTop: '10px' }}
                  placeholder="Share details about your professional journey..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            )}
          </Card>

          {/* Skills Card */}
          <Card className="dc-profile-section-card">
            <h2 className="dc-profile-section-title">Skills Showcase</h2>
            {isEditing && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="dc-create-post-input"
                    placeholder="e.g. React.js, Python, AWS"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={() => handleAddSkill()} 
                    style={{ width: 'auto', gap: '4px' }}
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="dc-profile-skills-grid">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <span key={index} className="dc-profile-skill-chip">
                    <Code size={12} style={{ color: 'hsl(var(--primary))' }} />
                    <span>{skill}</span>
                    {isEditing && (
                      <button 
                        type="button" 
                        className="dc-profile-skill-remove" 
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>No skills selected yet.</p>
              )}
            </div>
          </Card>

          {/* Experience Card */}
          <Card className="dc-profile-section-card">
            <h2 className="dc-profile-section-title">Experience</h2>
            {isEditing && (
              <div className="dc-profile-sub-form-card">
                <div className="dc-profile-sub-form-header">
                  <span className="dc-profile-sub-form-title">Add Work Experience</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Company Name" 
                    placeholder="e.g. Google" 
                    value={newExp.company} 
                    onChange={e => setNewExp({ ...newExp, company: e.target.value })} 
                  />
                  <Input 
                    label="Role / Title" 
                    placeholder="e.g. Frontend Engineer" 
                    value={newExp.role} 
                    onChange={e => setNewExp({ ...newExp, role: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Start Date" 
                    placeholder="e.g. June 2024" 
                    value={newExp.startDate} 
                    onChange={e => setNewExp({ ...newExp, startDate: e.target.value })} 
                  />
                  <Input 
                    label="End Date" 
                    placeholder="e.g. Present or Dec 2025" 
                    value={newExp.endDate} 
                    onChange={e => setNewExp({ ...newExp, endDate: e.target.value })} 
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Input 
                    label="Short Description" 
                    placeholder="Describe your responsibilities..." 
                    value={newExp.description} 
                    onChange={e => setNewExp({ ...newExp, description: e.target.value })} 
                  />
                </div>
                <Button type="button" variant="primary" style={{ width: 'auto', marginTop: '12px' }} onClick={handleAddExperience}>
                  <Plus size={14} /> Add Experience Item
                </Button>
              </div>
            )}

            {experience.length > 0 ? (
              <div className={!isEditing ? "dc-profile-timeline" : ""}>
                {experience.map((exp, index) => (
                  <div key={index} className={!isEditing ? "dc-profile-timeline-item" : "dc-profile-sub-form-card"} style={isEditing ? { marginBottom: '8px' } : {}}>
                    {!isEditing ? (
                      <>
                        <div className="dc-profile-timeline-dot">
                          <Briefcase size={16} />
                        </div>
                        <div className="dc-profile-timeline-content">
                          <h3 className="dc-profile-timeline-title">{exp.role}</h3>
                          <p className="dc-profile-timeline-subtitle">{exp.company}</p>
                          <span className="dc-profile-timeline-date">{exp.startDate} - {exp.endDate || 'Present'}</span>
                          {exp.description && <p className="dc-profile-timeline-desc">{exp.description}</p>}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{exp.role}</strong> at <strong>{exp.company}</strong>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{exp.startDate} - {exp.endDate || 'Present'}</div>
                        </div>
                        <Button type="button" variant="danger" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => handleRemoveExperience(index)}>
                          <X size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>No experience listed yet.</p>
            )}
          </Card>

          {/* Education Card */}
          <Card className="dc-profile-section-card">
            <h2 className="dc-profile-section-title">Education</h2>
            {isEditing && (
              <div className="dc-profile-sub-form-card">
                <div className="dc-profile-sub-form-header">
                  <span className="dc-profile-sub-form-title">Add School / College Details</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="School / University" 
                    placeholder="e.g. Mumbai University" 
                    value={newEdu.school} 
                    onChange={e => setNewEdu({ ...newEdu, school: e.target.value })} 
                  />
                  <Input 
                    label="Degree / Field of Study" 
                    placeholder="e.g. B.Sc. IT" 
                    value={newEdu.degree} 
                    onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Start Year" 
                    placeholder="e.g. 2021" 
                    value={newEdu.startYear} 
                    onChange={e => setNewEdu({ ...newEdu, startYear: e.target.value })} 
                  />
                  <Input 
                    label="End Year" 
                    placeholder="e.g. 2024" 
                    value={newEdu.endYear} 
                    onChange={e => setNewEdu({ ...newEdu, endYear: e.target.value })} 
                  />
                </div>
                <Button type="button" variant="primary" style={{ width: 'auto' }} onClick={handleAddEducation}>
                  <Plus size={14} /> Add Education Item
                </Button>
              </div>
            )}

            {education.length > 0 ? (
              <div className={!isEditing ? "dc-profile-timeline" : ""}>
                {education.map((edu, index) => (
                  <div key={index} className={!isEditing ? "dc-profile-timeline-item" : "dc-profile-sub-form-card"} style={isEditing ? { marginBottom: '8px' } : {}}>
                    {!isEditing ? (
                      <>
                        <div className="dc-profile-timeline-dot">
                          <GraduationCap size={18} />
                        </div>
                        <div className="dc-profile-timeline-content">
                          <h3 className="dc-profile-timeline-title">{edu.degree}</h3>
                          <p className="dc-profile-timeline-subtitle">{edu.school}</p>
                          <span className="dc-profile-timeline-date">{edu.startYear} - {edu.endYear || 'Present'}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{edu.degree}</strong> at <strong>{edu.school}</strong>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{edu.startYear} - {edu.endYear || 'Present'}</div>
                        </div>
                        <Button type="button" variant="danger" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => handleRemoveEducation(index)}>
                          <X size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>No education listed yet.</p>
            )}
          </Card>

          {/* Certificates Card */}
          <Card className="dc-profile-section-card">
            <h2 className="dc-profile-section-title">Certificates</h2>
            {isEditing && (
              <div className="dc-profile-sub-form-card">
                <div className="dc-profile-sub-form-header">
                  <span className="dc-profile-sub-form-title">Add Certificate details</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Certificate Name" 
                    placeholder="e.g. AWS Cloud Practitioner" 
                    value={newCert.name} 
                    onChange={e => setNewCert({ ...newCert, name: e.target.value })} 
                  />
                  <Input 
                    label="Issuing Authority" 
                    placeholder="e.g. Amazon Web Services" 
                    value={newCert.issuer} 
                    onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Date of Issue" 
                    placeholder="e.g. July 2025" 
                    value={newCert.issueDate} 
                    onChange={e => setNewCert({ ...newCert, issueDate: e.target.value })} 
                  />
                  <Input 
                    label="Verification Link" 
                    placeholder="e.g. https://aws.credentials.com/..." 
                    value={newCert.link} 
                    onChange={e => setNewCert({ ...newCert, link: e.target.value })} 
                  />
                </div>
                <Button type="button" variant="primary" style={{ width: 'auto' }} onClick={handleAddCertificate}>
                  <Plus size={14} /> Add Certificate
                </Button>
              </div>
            )}

            {certificates.length > 0 ? (
              <div className="dc-profile-certificates-list">
                {certificates.map((cert, index) => (
                  <div key={index} className="dc-profile-certificate-item">
                    <div className="dc-profile-certificate-info">
                      <Award className="dc-profile-certificate-icon" size={24} />
                      <div>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{cert.name}</h4>
                        <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>Issued by {cert.issuer} {cert.issueDate && `• ${cert.issueDate}`}</p>
                      </div>
                    </div>
                    <div>
                      {isEditing ? (
                        <Button type="button" variant="danger" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => handleRemoveCertificate(index)}>
                          <X size={12} />
                        </Button>
                      ) : (
                        cert.link && (
                          <a href={cert.link} target="_blank" rel="noopener noreferrer" className="dc-project-link-item" style={{ fontSize: '12px' }}>
                            <span>Show Credential</span>
                            <ExternalLink size={12} />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>No certificates listed yet.</p>
            )}
          </Card>

          {/* Featured Projects Card */}
          <Card className="dc-profile-section-card">
            <h2 className="dc-profile-section-title">Featured Projects</h2>
            {isEditing && (
              <div className="dc-profile-sub-form-card">
                <div className="dc-profile-sub-form-header">
                  <span className="dc-profile-sub-form-title">Add Featured Project</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Project Title" 
                    placeholder="e.g. Chat Application" 
                    value={newProject.title} 
                    onChange={e => setNewProject({ ...newProject, title: e.target.value })} 
                  />
                  <Input 
                    label="Brief Description" 
                    placeholder="e.g. Built using React and socket.io" 
                    value={newProject.description} 
                    onChange={e => setNewProject({ ...newProject, description: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input 
                    label="Repository URL" 
                    placeholder="e.g. https://github.com/..." 
                    value={newProject.repoUrl} 
                    onChange={e => setNewProject({ ...newProject, repoUrl: e.target.value })} 
                  />
                  <Input 
                    label="Live Demo URL" 
                    placeholder="e.g. https://chat.live.com" 
                    value={newProject.projectUrl} 
                    onChange={e => setNewProject({ ...newProject, projectUrl: e.target.value })} 
                  />
                </div>
                <Button type="button" variant="primary" style={{ width: 'auto' }} onClick={handleAddProject}>
                  <Plus size={14} /> Add Project Item
                </Button>
              </div>
            )}

            {projects.length > 0 ? (
              <div className="dc-profile-projects-grid">
                {projects.map((project, index) => (
                  <Card key={index} className="dc-project-card" style={isEditing ? { padding: '12px !important' } : {}}>
                    {isEditing ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{project.title}</strong>
                          <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '2px', lineClamp: 1 }}>{project.description}</p>
                        </div>
                        <Button type="button" variant="danger" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => handleRemoveProject(index)}>
                          <X size={12} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="dc-project-title">{project.title}</h3>
                        <p className="dc-project-desc">{project.description}</p>
                        <div className="dc-project-links">
                          {project.repoUrl && (
                            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="dc-project-link-item">
                              <BookOpen size={12} />
                              <span>Code Repository</span>
                            </a>
                          )}
                          {project.projectUrl && (
                            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="dc-project-link-item">
                              <ExternalLink size={12} />
                              <span>Live Demo</span>
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed hsl(var(--border))', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>No featured projects added yet.</p>
              </div>
            )}
          </Card>

          {/* Post Creation Trigger Card */}
          {!isEditing && (
            <Card className="dc-profile-section-card" onClick={() => setIsPostModalOpen(true)} style={{ cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-dark) / 0.3)' }}>
              <div className="dc-profile-edit-avatar-preview" style={{ width: '40px', height: '40px', margin: 0, flexShrink: 0 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '20px' }}>💻</span>
                )}
              </div>
              <div style={{ flex: 1, height: '40px', borderRadius: '20px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--border) / 0.2)', display: 'flex', alignItems: 'center', paddingLeft: '16px', color: 'hsl(var(--text-muted))', fontSize: '13px', fontWeight: 500 }}>
                Share an update, photos, or videos...
              </div>
            </Card>
          )}

          {/* Posts List Section */}
          {!isEditing && (
            <div className="dc-posts-section" style={{ marginTop: '24px' }}>
              <h2 className="dc-profile-section-title" style={{ marginBottom: '16px' }}>Developer Activity</h2>
              
              {posts.map((post) => {
                const activeMediaIndex = activeMediaIndexes[post.id] || 0;
                const mediaCount = post.media.length;
                
                return (
                  <Card key={post.id} className="dc-post-card" style={{ padding: '20px', marginBottom: '16px', border: '1px solid hsl(var(--border))' }}>
                    {/* Post Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: 'hsl(var(--surface-light))', border: '1.5px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}>
                        {post.author.avatar || (post.author.name === (user?.fullName || fullName) && avatarUrl) ? (
                          <img src={post.author.name === (user?.fullName || fullName) && avatarUrl ? avatarUrl : post.author.avatar} alt="Author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '18px' }}>💻</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                          {post.author.name === (user?.fullName || fullName) ? (user?.fullName || fullName) : post.author.name}
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                          {post.author.name === (user?.fullName || fullName) ? (headline || 'Software Engineer') : post.author.headline}
                        </p>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'block' }}>
                          {post.createdAt}
                        </span>
                      </div>
                    </div>

                    {/* Post Caption */}
                    <p style={{ fontSize: '13.5px', color: 'hsl(var(--text-primary))', lineHeight: '1.6', margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                      {formatCaption(post.caption)}
                    </p>

                    {/* Post Media Swiper / Carousel */}
                    {mediaCount > 0 && (
                      <div className="dc-media-swiper" style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', maxHeight: '420px', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid hsl(var(--border))', marginBottom: '16px' }}>
                        {post.media.map((item, i) => (
                          <div key={i} className={`dc-swiper-slide ${i === activeMediaIndex ? 'active' : ''}`} style={{ display: i === activeMediaIndex ? 'flex' : 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            {item.type === 'video' ? (
                              <video src={item.url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <img src={item.url} alt={`Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                        ))}
                        
                        {/* Navigation arrows */}
                        {mediaCount > 1 && (
                          <>
                            <button type="button" className="dc-swiper-btn prev" onClick={() => handlePrevMedia(post.id, mediaCount)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', zIndex: 10 }}>
                              <ChevronLeft size={16} />
                            </button>
                            <button type="button" className="dc-swiper-btn next" onClick={() => handleNextMedia(post.id, mediaCount)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', zIndex: 10 }}>
                              <ChevronRight size={16} />
                            </button>
                            
                            {/* Index dots */}
                            <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
                              {post.media.map((_, i) => (
                                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === activeMediaIndex ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.4)', transition: 'background 0.2s ease' }} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Post Actions Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px', marginTop: '12px' }}>
                      <button onClick={() => handleLikePost(post.id)} style={{ background: 'transparent', border: 'none', color: post.hasLiked ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                        <ThumbsUp size={16} style={{ fill: post.hasLiked ? 'hsl(var(--primary) / 0.2)' : 'none' }} />
                        <span>{post.likes} Like{post.likes !== 1 ? 's' : ''}</span>
                      </button>
                      
                      <button style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                        <MessageSquare size={16} />
                        <span>{post.commentsCount} Comment{post.commentsCount !== 1 ? 's' : ''}</span>
                      </button>

                      <button style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500, marginLeft: 'auto', padding: 0 }}>
                        <Share2 size={16} />
                        <span>Share</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Form Actions */}
          {isEditing && (
            <div className="dc-profile-actions" style={{ justifyContent: 'flex-end', marginTop: '24px', paddingBottom: '24px' }}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsEditing(false)} 
                style={{ gap: '6px' }}
              >
                <X size={14} />
                <span>Cancel</span>
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                disabled={loading} 
                onClick={handleSave}
                style={{ gap: '6px' }}
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="dc-profile-sidebar">
          <Card className="dc-sidebar-card">
            <h3 className="dc-sidebar-title">Other Members Viewed</h3>
            <div className="dc-rec-list">
              {mockMembers.map((member) => (
                <div key={member.id} className="dc-rec-item">
                  <div className="dc-rec-avatar">
                    <span>{member.avatar}</span>
                  </div>
                  <div className="dc-rec-details">
                    <h4 className="dc-rec-name">{member.name}</h4>
                    <p className="dc-rec-headline">{member.headline}</p>
                    <Button 
                      variant={member.status === 'Connected' ? 'secondary' : member.status === 'Pending...' ? 'secondary' : 'primary'}
                      className="dc-rec-connect-btn"
                      onClick={() => handleConnectClick(member.id)}
                      style={{ gap: '4px' }}
                    >
                      {member.status === 'Connect' && <UserPlus size={12} />}
                      {member.status === 'Connected' && <Check size={12} />}
                      <span>{member.status}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {/* Create Post Modal Overlay */}
      {isPostModalOpen && (
        <div className="dc-post-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="dc-post-modal glass-panel" style={{ width: '90%', maxWidth: '520px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-card))', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Create a Post</h3>
              <button onClick={() => { setIsPostModalOpen(false); setSelectedFiles([]); setPostCaption(''); }} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostSubmit} style={{ padding: '20px' }}>
              {/* Textarea */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <textarea
                  ref={postTextareaRef}
                  value={postCaption}
                  onChange={handleCaptionChange}
                  placeholder="What's on your mind? Use @name to mention, #tags to organize..."
                  style={{ width: '100%', minHeight: '120px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', fontSize: '14px', color: 'hsl(var(--text-primary))', lineHeight: '1.6', padding: 0 }}
                  disabled={uploadingPost}
                />

                {/* Mentions Dropdown */}
                {showMentionDropdown && (
                  <div className="dc-mention-dropdown glass-panel" style={{ position: 'absolute', top: mentionPosition.top, left: mentionPosition.left, zIndex: 1100, width: '180px', borderRadius: '8px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                    <div style={{ padding: '6px 12px', fontSize: '10px', color: 'hsl(var(--text-muted))', borderBottom: '1px solid hsl(var(--border))' }}>MENTION MEMBER</div>
                    {['Linus Torvalds', 'Aisha Vance', 'Sarah Drasner']
                      .filter(name => name.toLowerCase().includes(mentionQuery.toLowerCase()))
                      .map(name => (
                        <div
                          key={name}
                          className="dc-mention-item"
                          onClick={() => handleMentionSelect(name)}
                          style={{ padding: '8px 12px', fontSize: '12px', color: 'hsl(var(--text-primary))', cursor: 'pointer', transition: 'background 0.2s ease' }}
                        >
                          {name}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Selected Files Preview Swiper */}
              {selectedFiles.length > 0 && (
                <div className="dc-media-swiper" style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', maxHeight: '240px', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid hsl(var(--border))', marginBottom: '16px' }}>
                  {selectedFiles.map((fileObj, i) => (
                    <div key={i} style={{ display: i === previewIndex ? 'flex' : 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      {fileObj.type === 'video' ? (
                        <video src={fileObj.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted playsInline />
                      ) : (
                        <img src={fileObj.previewUrl} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      
                      {/* Delete button overlay */}
                      <button type="button" className="dc-slide-delete" onClick={() => handleRemoveSelectedFile(i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', zIndex: 20 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Navigation Arrows for Preview */}
                  {selectedFiles.length > 1 && (
                    <>
                      <button type="button" onClick={handlePrevPreview} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 23, 42, 0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" onClick={handleNextPreview} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 23, 42, 0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <ChevronRight size={16} />
                      </button>
                      
                      {/* Index bubble */}
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.7)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', zIndex: 10 }}>
                        {previewIndex + 1} / {selectedFiles.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', transition: 'color 0.2s ease', padding: '6px 12px', borderRadius: '6px', border: '1px solid hsl(var(--border))', background: 'var(--surface)' }}>
                  <ImageIcon size={16} style={{ color: 'hsl(var(--primary))' }} />
                  <span>Images/Videos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handlePostFileChange}
                    style={{ display: 'none' }}
                    disabled={uploadingPost}
                  />
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={uploadingPost || (!postCaption.trim() && selectedFiles.length === 0)}
                  style={{ marginLeft: 'auto', gap: '6px', width: 'auto', padding: '8px 20px' }}
                >
                  {uploadingPost ? (
                    <>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Post Update</span>
                  )}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
