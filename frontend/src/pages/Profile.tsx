import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { uploadProfilePhoto } from '../utils/cloudinary';
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
  Camera
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
                <div style={{ toggle: '12px' }}>
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
    </div>
  );
};

export default Profile;
