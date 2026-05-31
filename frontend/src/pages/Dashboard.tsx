import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Terminal, LogOut, Code, Award, Users, Briefcase, Globe, Send, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Mock post entries for developers
  const devPosts = [
    {
      id: 1,
      author: 'Linus Torvalds',
      headline: 'Creator of Linux & Git',
      avatar: '💻',
      time: '2 hours ago',
      content: 'Just finalized merging the latest Rust-in-Linux updates for kernel v6.15. The stability improvements in memory handling are proving to be extremely solid. Keep committing!',
      tags: ['#linux', '#rust', '#kernel', '#opensource'],
      likes: 342,
      comments: 48,
    },
    {
      id: 2,
      author: 'Aisha Vance',
      headline: 'Staff Engineer @ Supabase',
      avatar: '⚡',
      time: '5 hours ago',
      content: 'Excited to announce our new PostgreSQL triggers for real-time edge streaming! Coupled with standard Row-Level Security (RLS), security is enforced directly at the db level. Check out our open-source docs.',
      tags: ['#postgres', '#supabase', '#realtime', '#backend'],
      likes: 189,
      comments: 15,
    },
  ];

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
            <span className="dc-nav-user-badge">ROOT</span>
            <span className="dc-nav-user-name">{user?.fullName || 'Developer'}</span>
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
          <Card hoverable className="dc-profile-card">
            <div className="dc-profile-avatar-wrapper">
              <span className="dc-profile-avatar-emoji">⚙️</span>
            </div>
            <h3 className="dc-profile-name">{user?.fullName || 'John Doe'}</h3>
            <p className="dc-profile-headline">{user?.profile?.headline || 'Full Stack Engineer'}</p>

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
                  user.profile.skills.map((skill, index) => (
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
          <Card className="dc-create-post-card">
            <div className="dc-create-post-header">
              <div className="dc-create-avatar">📝</div>
              <input
                type="text"
                placeholder="What are you working on today?"
                className="dc-create-post-input"
              />
            </div>
            <div className="dc-create-post-actions">
              <button className="dc-post-action-btn">
                <Code size={16} />
                <span>Share Code</span>
              </button>
              <button className="dc-post-action-btn">
                <Award size={16} />
                <span>Add Project</span>
              </button>
              <Button variant="primary" className="dc-post-submit-btn">
                <Send size={14} />
                <span>Post</span>
              </Button>
            </div>
          </Card>

          {/* Render Feed Posts */}
          <div className="dc-feed-posts">
            {devPosts.map((post) => (
              <Card key={post.id} className="dc-post-card">
                <div className="dc-post-header">
                  <div className="dc-post-avatar-circle">{post.avatar}</div>
                  <div>
                    <h4 className="dc-post-author">{post.author}</h4>
                    <p className="dc-post-headline-sub">{post.headline} • <span className="dc-post-time">{post.time}</span></p>
                  </div>
                </div>

                <div className="dc-post-body">
                  <p className="dc-post-content">{post.content}</p>
                  <div className="dc-post-tags">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="dc-post-tag">{tag}</span>
                    ))}
                  </div>
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
            ))}
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
