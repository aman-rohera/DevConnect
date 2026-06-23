import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Terminal, LogOut, Award, Users, Briefcase, Globe, ThumbsUp, MessageSquare, Share2, Image as ImageIcon } from 'lucide-react';
import { uploadProfilePhoto } from '../utils/cloudinary';
import { api } from '../services/api';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<any[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFeed();
  }, [token]);

  const fetchFeed = async () => {
    try {
      const data = await api.get<any>('/posts/feed', { token });
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch feed', error);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Reusing the cloudinary upload utility
      const secureUrl = await uploadProfilePhoto(file);
      setPostImageUrl(secureUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postImageUrl) return;

    setIsPosting(true);
    try {
      const data = await api.post<any>('/posts', { content: postContent, imageUrl: postImageUrl }, { token });
      if (data.success) {
        setPostContent('');
        setPostImageUrl('');
        // Add new post to the top of the feed
        setPosts([data.post, ...posts]);
      }
    } catch (error) {
      console.error('Failed to create post', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="dc-dashboard">
      {/* Top Navbar */}
      <nav className="dc-nav glass-panel">
        <div className="container dc-nav-content">
          <div className="dc-nav-left">
            <Terminal className="dc-nav-logo-icon" />
            <span className="dc-nav-logo-text text-gradient">DevConnect</span>
          </div>

          <div className="dc-nav-links">
            <a href="#feed" className="dc-nav-link dc-nav-link--active">
              <Globe size={18} />
              <span>Feed</span>
            </a>
            <div className="dc-nav-link" onClick={() => navigate('/recommendations')} style={{ cursor: 'pointer' }}>
              <Users size={18} />
              <span>Network</span>
            </div>
            <a href="#jobs" className="dc-nav-link">
              <Briefcase size={18} />
              <span>Jobs</span>
            </a>
          </div>

          <div className="dc-nav-user">
            <div className="dc-nav-user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="dc-nav-user-badge">ROOT</span>
              <span className="dc-nav-user-name">{user?.fullName || 'Developer'}</span>
            </div>
            <Button variant="danger" className="dc-nav-logout-btn" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <div className="container dc-dashboard-content">
        {/* Left column: Profile card */}
        <aside className="dc-profile-aside">
          <Card hoverable className="dc-profile-card" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div className="dc-profile-avatar-wrapper" style={{ overflow: 'hidden' }}>
              {user?.profile?.avatar_url || user?.avatarUrl ? (
                <img 
                  src={user?.profile?.avatar_url || user?.avatarUrl} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span className="dc-profile-avatar-emoji">⚙️</span>
              )}
            </div>
            <h3 className="dc-profile-name">{user?.fullName || 'John Doe'}</h3>
            <p className="dc-profile-headline">{user?.profile?.headline || user?.headline || 'Full Stack Engineer'}</p>

            <div className="dc-profile-divider" />

            <div className="dc-profile-stats">
              <div className="dc-profile-stat-row">
                <span>Profile views</span>
                <span className="dc-stat-highlight">182</span>
              </div>
              <div className="dc-profile-stat-row">
                <span>Post impressions</span>
                <span className="dc-stat-highlight">1,402</span>
              </div>
            </div>

            <div className="dc-profile-divider" />

            <div className="dc-profile-skills-sec">
              <h4>Active Skills</h4>
              <div className="dc-skills-tags">
                {user?.profile?.skills && user.profile.skills.length > 0 ? (
                  user.profile.skills.map((skill: any, index: number) => (
                    <span key={index} className="dc-skill-tag">
                      {skill}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="dc-skill-tag">React</span>
                    <span className="dc-skill-tag">NodeJS</span>
                    <span className="dc-skill-tag">Supabase</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </aside>

        {/* Center column: Feed */}
        <main className="dc-feed-main">
          {/* Create Post Card */}
          <Card className="dc-create-post-card" style={{ padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid hsl(var(--border))' }}>
                {user?.profile?.avatar_url || user?.avatarUrl ? (
                  <img src={user?.profile?.avatar_url || user?.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--surface-light))', fontSize: '20px' }}>💻</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  placeholder="Start a post..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  style={{ 
                    width: '100%', 
                    minHeight: postContent || postImageUrl ? '100px' : '48px', 
                    background: 'hsl(var(--surface-light))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '24px', 
                    padding: '12px 20px', 
                    color: 'hsl(var(--text-primary))', 
                    resize: 'none',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => e.target.style.borderRadius = '12px'}
                  onBlur={(e) => { if (!postContent && !postImageUrl) e.target.style.borderRadius = '24px'; }}
                />
                
                {postImageUrl && (
                  <div style={{ marginTop: '12px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                    <img src={postImageUrl} alt="Post preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
                    <button 
                      onClick={() => setPostImageUrl('')} 
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleImageClick} 
                  disabled={uploadingImage}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: 'hsl(var(--text-secondary))', cursor: uploadingImage ? 'wait' : 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'hsl(var(--surface-light))'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ImageIcon size={20} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{uploadingImage ? 'Uploading...' : 'Media'}</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'hsl(var(--surface-light))'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <Briefcase size={20} style={{ color: '#a855f7' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Job</span>
                </button>
                
                <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '8px', color: 'hsl(var(--text-secondary))', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'hsl(var(--surface-light))'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <Award size={20} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Article</span>
                </button>
              </div>

              <Button 
                variant="primary" 
                onClick={handleCreatePost} 
                disabled={isPosting || uploadingImage || (!postContent.trim() && !postImageUrl)}
                style={{ padding: '8px 24px', borderRadius: '20px', fontWeight: 600, opacity: (!postContent.trim() && !postImageUrl) ? 0.5 : 1 }}
              >
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </Card>

          {/* Render Feed Posts */}
          <div className="dc-feed-posts">
            {posts.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '20px' }}>No posts yet. Be the first to share something!</p>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="dc-post-card">
                  <div className="dc-post-header">
                    <div className="dc-post-avatar-circle" style={{ overflow: 'hidden' }}>
                      {post.user.avatarUrl ? (
                        <img src={post.user.avatarUrl} alt={post.user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '💻'
                      )}
                    </div>
                    <div>
                      <h4 className="dc-post-author">{post.user.fullName}</h4>
                      <p className="dc-post-headline-sub">
                        {post.user.headline} • <span className="dc-post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="dc-post-body">
                    {post.content && <p className="dc-post-content">{post.content}</p>}
                    {post.imageUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <img src={post.imageUrl} alt="Post content" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                      </div>
                    )}
                  </div>

                  <div className="dc-post-footer">
                    <button className="dc-post-footer-btn">
                      <ThumbsUp size={16} />
                      <span>{post.likes} Likes</span>
                    </button>
                    <button className="dc-post-footer-btn">
                      <MessageSquare size={16} />
                      <span>{post.comments} Comments</span>
                    </button>
                    <button className="dc-post-footer-btn">
                      <Share2 size={16} />
                      <span>Share</span>
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>

        {/* Right column: Trends */}
        <aside className="dc-trends-aside">
          <Card className="dc-trends-card">
            <h3 className="dc-trends-title">Developer Trends</h3>
            <ul className="dc-trends-list">
              <li className="dc-trend-item">
                <span className="dc-trend-rank">1</span>
                <div>
                  <h4>#rust-lang</h4>
                  <p>1,249 discussions this week</p>
                </div>
              </li>
              <li className="dc-trend-item">
                <span className="dc-trend-rank">2</span>
                <div>
                  <h4>#supabase-postgres</h4>
                  <p>843 discussions this week</p>
                </div>
              </li>
              <li className="dc-trend-item">
                <span className="dc-trend-rank">3</span>
                <div>
                  <h4>#vite-8-beta</h4>
                  <p>512 discussions this week</p>
                </div>
              </li>
              <li className="dc-trend-item">
                <span className="dc-trend-rank">4</span>
                <div>
                  <h4>#web-assembly</h4>
                  <p>402 discussions this week</p>
                </div>
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
};
