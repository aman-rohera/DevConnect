import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const Profile: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load user profile details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiRequest('/profile/me');
        setFullName(response.data.fullName || '');
        setHeadline(response.data.headline || '');
        setBio(response.data.bio || '');
        setAvatarUrl(response.data.avatarUrl || '');
        setSkills(response.data.skills || []);
      } catch (err: any) {
        setError('Failed to load profile details.');
      }
    };

    fetchProfile();
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSkill = skillInput.trim();
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiRequest('/profile/update', {
        method: 'PUT',
        body: {
          headline,
          bio,
          avatarUrl,
          skills
        }
      });

      setSuccess('Profile updated successfully!');
      // Update local storage representation
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.fullName = response.data.fullName;
      localStorage.setItem('user', JSON.stringify(localUser));
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <header className="navbar">
        <div className="logo" onClick={() => navigate('/')}>DevConnect</div>
        <nav className="nav-links">
          <span className="nav-link" onClick={() => navigate('/')}>Dashboard</span>
          <span className="nav-link active">Profile Settings</span>
          <span className="nav-link" onClick={handleLogout}>Logout</span>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Edit Developer Profile</h2>
          
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSave} className="profile-grid">
            {/* Sidebar Column: Avatar Preview */}
            <div className="avatar-upload-container">
              <div className="avatar-preview">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" />
                ) : (
                  fullName.charAt(0) || 'D'
                )}
              </div>
              <div className="form-group" style={{ width: '100%' }}>
                <label className="form-label">Avatar Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            </div>

            {/* Main Fields Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  disabled
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Professional Headline</label>
                <input
                  type="text"
                  className="form-input"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Backend Architect | Node.js Specialist"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio (Brief Summary)</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell other developers about your background, interests, and typical workflow..."
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              {/* Skills Tag Management */}
              <div className="form-group">
                <label className="form-label">Skills Showcase</label>
                <div className="skills-input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. React.js, PostgreSQL"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(e);
                      }
                    }}
                  />
                  <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={handleAddSkill}>
                    Add
                  </button>
                </div>
                
                <div className="tags-container">
                  {skills.map((skill, index) => (
                    <span key={index} className="tag">
                      {skill}
                      <button type="button" className="tag-remove" onClick={() => handleRemoveSkill(skill)}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                disabled={loading}
                style={{ width: '200px', marginTop: '1rem', alignSelf: 'flex-end' }}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
