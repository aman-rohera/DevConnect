import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Terminal, LogOut, Globe, Users, Briefcase, RefreshCw, UserPlus, Check, X } from 'lucide-react';
import '../pages/Dashboard.css'; // Inherit Dashboard styles
import './Recommendations.css'; // Specific tweaks if needed

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://devconnect-11qm.onrender.com/api');

interface RecommendedUser {
  id: string;
  fullName: string;
  headline: string;
  avatarUrl: string;
}

interface Recommendation {
  user: RecommendedUser;
  commonSkills: number;
  sharedSkills: string[];
}

export const Recommendations: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  // Track connection states per user ID ('Connect' | 'Pending...' | 'Connected')
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRecommendations();
    fetchConnections();
    fetchPendingRequests();
  }, [token]);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const statuses: Record<string, string> = {};
        data.connections.forEach((conn: any) => {
          const otherUserId = conn.senderId === user?.id ? conn.receiverId : conn.senderId;
          // Map backend states to our UI states
          if (conn.status === 'PENDING') statuses[otherUserId] = 'Pending...';
          else if (conn.status === 'ACCEPTED') statuses[otherUserId] = 'Connected';
        });
        setConnectionStatuses(statuses);
      }
    } catch (err) {
      console.error('Failed to fetch connections', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.message || 'Failed to load recommendations');
      }
    } catch (err) {
      setError('An error occurred while fetching recommendations');
    } finally {
      setLoading(false);
    }
  };

  const syncProfile = async () => {
    try {
      setSyncing(true);
      await fetch(`${API_BASE_URL}/recommendations/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await fetchRecommendations();
    } catch (err) {
      console.error('Failed to sync profile', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async (targetUserId: string) => {
    // Optimistically set to pending
    setConnectionStatuses(prev => ({ ...prev, [targetUserId]: 'Pending...' }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/connections/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: targetUserId })
      });
      
      const data = await response.json();
      if (!data.success) {
        // Revert on failure
        setConnectionStatuses(prev => {
          const newStatuses = { ...prev };
          delete newStatuses[targetUserId];
          return newStatuses;
        });
        setError(data.message || 'Failed to send connection request');
      }
    } catch (err) {
      console.error('Error sending request', err);
      // Revert on failure
      setConnectionStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[targetUserId];
        return newStatuses;
      });
    }
  };

  const handleRespondToRequest = async (connectionId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${connectionId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      if (data.success) {
        // Remove the handled request from the UI list
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        // Refresh connection statuses so the UI updates
        fetchConnections();
      } else {
        setError(data.message || `Failed to ${action.toLowerCase()} request`);
      }
    } catch (err) {
      console.error(`Error responding to request`, err);
      setError(`Failed to ${action.toLowerCase()} request`);
    }
  };

  return (
    <div className="dc-dashboard">
      {/* Top Navbar */}
      <nav className="dc-nav glass-panel">
        <div className="container dc-nav-content">
          <div className="dc-nav-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Terminal className="dc-nav-logo-icon" />
            <span className="dc-nav-logo-text text-gradient">DevConnect</span>
          </div>

          <div className="dc-nav-links">
            <a href="#feed" className="dc-nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
              <Globe size={18} />
              <span>Feed</span>
            </a>
            <div className="dc-nav-link dc-nav-link--active" style={{ cursor: 'pointer' }}>
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
              {user?.profile?.avatar_url ? (
                <img 
                  src={user.profile.avatar_url} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span className="dc-profile-avatar-emoji">⚙️</span>
              )}
            </div>
            <h3 className="dc-profile-name">{user?.fullName || 'John Doe'}</h3>
            <p className="dc-profile-headline">{user?.profile?.headline || 'Developer'}</p>

            <div className="dc-profile-divider" />

            <div className="dc-profile-stats">
              <div className="dc-profile-stat-row">
                <span>Profile views</span>
                <span className="dc-stat-highlight">182</span>
              </div>
              <div className="dc-profile-stat-row">
                <span>Connections</span>
                <span className="dc-stat-highlight">48</span>
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
                  <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>No skills added.</p>
                )}
              </div>
            </div>
          </Card>
        </aside>

        {/* Center column: Recommendations */}
        <main className="dc-feed-main">
          
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <Card className="dc-create-post-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'hsl(var(--text-primary))' }}>Pending Requests ({pendingRequests.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'hsl(var(--surface-light))' }}>
                        {req.sender.avatarUrl ? (
                          <img src={req.sender.avatarUrl} alt={req.sender.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '16px' }}>💻</div>
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', color: 'hsl(var(--text-primary))' }}>{req.sender.fullName}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>{req.sender.headline || 'Developer'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" onClick={() => handleRespondToRequest(req.id, 'REJECT')} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'transparent' }}>
                        <X size={14} style={{ marginRight: '4px' }} /> Ignore
                      </Button>
                      <Button variant="primary" onClick={() => handleRespondToRequest(req.id, 'ACCEPT')} style={{ padding: '6px 12px' }}>
                        <Check size={14} style={{ marginRight: '4px' }} /> Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Sync / Header Card */}
          <Card className="dc-create-post-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'hsl(var(--text-primary))' }}>Developer Recommendations</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>Based on your skills graph.</p>
              </div>
              <Button 
                variant="primary" 
                onClick={syncProfile} 
                disabled={syncing}
                style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
              >
                <RefreshCw size={14} className={syncing ? 'net-spin' : ''} />
                <span>{syncing ? 'Syncing...' : 'Sync Graph'}</span>
              </Button>
            </div>
          </Card>

          {error && <div className="dc-alert dc-alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

          {/* Render Recommendations */}
          <div className="net-grid">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <Card key={i} className="dc-post-card net-member-card">
                  <div className="net-card-banner loading"></div>
                  <div className="net-card-avatar-container">
                    <SkeletonLoader variant="circle" width={72} height={72} />
                  </div>
                  <div className="net-card-content">
                    <SkeletonLoader variant="text" width={120} height={18} className="mx-auto" />
                    <SkeletonLoader variant="text" width={160} height={14} className="mt-2 mx-auto" />
                    <div className="mt-4">
                      <SkeletonLoader variant="rectangle" height={30} style={{ borderRadius: '8px' }} />
                    </div>
                  </div>
                </Card>
              ))
            ) : recommendations.length === 0 ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <Card className="dc-post-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Users size={40} style={{ color: 'hsl(var(--text-muted))', margin: '0 auto 16px auto' }} />
                  <h3 style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>No recommendations yet</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>Add more skills to your profile to find overlapping developers.</p>
                </Card>
              </div>
            ) : (
              recommendations.map((rec, idx) => (
                <Card key={idx} className="dc-post-card net-member-card">
                  <div className="net-card-banner"></div>
                  <div className="net-card-avatar-container">
                    {rec.user.avatarUrl ? (
                        <img src={rec.user.avatarUrl} alt={rec.user.fullName} className="net-card-avatar" />
                    ) : (
                        <div className="net-card-avatar fallback">💻</div>
                    )}
                  </div>
                  
                  <div className="net-card-content">
                    <h4 className="net-card-name">{rec.user.fullName}</h4>
                    <p className="net-card-headline">{rec.user.headline || 'Software Engineer'}</p>
                    
                    <div className="net-card-stats">
                      <span className="net-match-badge">
                        {rec.commonSkills} Shared Skill{rec.commonSkills !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Mutual Connections (Dummy UI for now) */}
                    {(() => {
                      const mutuals = [
                        [
                          { name: 'Linus Torvalds', avatar: '💻' },
                          { name: 'Aisha Vance', avatar: '⚡' }
                        ],
                        [
                          { name: 'Sarah Drasner', avatar: '🎨' },
                          { name: 'Linus Torvalds', avatar: '💻' }
                        ],
                        [
                          { name: 'Aisha Vance', avatar: '⚡' }
                        ],
                        [
                          { name: 'Sarah Drasner', avatar: '🎨' },
                          { name: 'Aisha Vance', avatar: '⚡' }
                        ]
                      ][idx % 4];

                      const totalCount = [5, 3, 1, 8][idx % 4];
                      const primaryName = mutuals[0]?.name || 'Developer';

                      return (
                        <div className="net-card-mutual">
                          <div className="net-mutual-avatars">
                            {mutuals.map((m, i) => (
                              <span key={i} className="net-mutual-avatar-mini" title={m.name}>
                                {m.avatar}
                              </span>
                            ))}
                          </div>
                          <span className="net-mutual-text">
                            {totalCount === 1 ? (
                              `${primaryName} is a mutual connection`
                            ) : (
                              `${primaryName} and ${totalCount - 1} other${totalCount - 1 > 1 ? 's' : ''} are mutual connections`
                            )}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="net-card-skills-wrapper">
                      <div className="net-card-skills">
                        {rec.sharedSkills.slice(0, 3).map(skill => (
                          <span key={skill} className="dc-skill-tag net-skill-mini">
                            {skill}
                          </span>
                        ))}
                        {rec.sharedSkills.length > 3 && (
                          <span className="dc-skill-tag net-skill-mini">+{rec.sharedSkills.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="net-card-footer">
                    {(() => {
                      const status = connectionStatuses[rec.user.id] || 'Connect';
                      if (status === 'Connected') {
                        return (
                          <Button variant="secondary" className="net-connect-btn-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }} disabled>
                            <span style={{ fontSize: '18px', marginRight: '4px' }}>✓</span>
                            <span>Connected</span>
                          </Button>
                        );
                      }
                      if (status === 'Pending...') {
                        return (
                          <Button variant="secondary" className="net-connect-btn-full" disabled>
                            <RefreshCw size={16} className="net-spin" />
                            <span>Pending...</span>
                          </Button>
                        );
                      }
                      return (
                        <Button variant="primary" className="net-connect-btn-full" onClick={() => handleConnect(rec.user.id)}>
                          <UserPlus size={16} />
                          <span>Connect</span>
                        </Button>
                      );
                    })()}
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

export default Recommendations;
