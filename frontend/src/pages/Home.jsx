import React, { useState, useEffect } from 'react';
import API from '../services/api';

function Home({ user, onNavigateToLogin, onNavigateToRegister, onNavigateToView }) {
  
  // ==================== ADMIN STATE & OPERATIONS ====================
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [actionLoading, setActionLoading] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Recruiter Dashboard State
  const [recruiterStats, setRecruiterStats] = useState(null);
  const [loadingRecruiterStats, setLoadingRecruiterStats] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.userType === 'Admin') {
        fetchAdminStats();
        fetchAdminUsers();
      } else if (user.userType === 'Recruiter') {
        fetchRecruiterStats();
      }
    }
  }, [user]);

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching admin stats', err);
      setAdminError('Failed to load system statistics.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await API.get('/admin/users');
      setUsersList(res.data);
    } catch (err) {
      console.error('Error fetching admin users', err);
      setAdminError('Failed to load users directory.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRecruiterStats = async () => {
    setLoadingRecruiterStats(true);
    try {
      const res = await API.get('/jobs/recruiter/dashboard-stats');
      setRecruiterStats(res.data);
    } catch (err) {
      console.error('Error fetching recruiter stats', err);
    } finally {
      setLoadingRecruiterStats(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    setActionLoading(userId);
    setAdminError(null);
    setSuccessMessage(null);
    try {
      const res = await API.post(`/admin/users/${userId}/toggle-status`);
      setSuccessMessage(res.data.message);
      // Update local state
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isActive: res.data.isActive } : u));
      // Refresh stats
      fetchAdminStats();
    } catch (err) {
      console.error('Error toggling user status', err);
      setAdminError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user? This will permanently remove their profile, jobs, applications, and all chat history. This action cannot be undone.')) {
      return;
    }
    setActionLoading(userId);
    setAdminError(null);
    setSuccessMessage(null);
    try {
      const res = await API.delete(`/admin/users/${userId}`);
      setSuccessMessage(res.data.message);
      // Remove from local state
      setUsersList(prev => prev.filter(u => u.id !== userId));
      // Refresh stats
      fetchAdminStats();
    } catch (err) {
      console.error('Error deleting user', err);
      setAdminError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  
  // ==================== GUEST LANDING PAGE ====================
  if (!user) {
    return (
      <div className="container py-5">
        {/* Hero Section */}
        <div className="text-center py-5 animate-fade-in glow-effect">
          <span className="badge rounded-pill mb-3 px-3 py-2" 
                style={{ background: 'rgba(154, 85, 241, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }}>
            ✨ Your Ultimate AI Career Companion
          </span>
          <h1 className="display-3 fw-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Elevate Your Employability with <br />
            <span className="text-gradient-primary">SkillSathi AI</span>
          </h1>
          <p className="lead text-secondary mx-auto mb-5" style={{ maxWidth: '700px', fontSize: '1.25rem' }}>
            An intelligent ecosystem bridging the gap between talent and opportunity. Get automated resume scoring, skill-gap analysis, personalized roadmaps, and real-time recruiter matching.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button onClick={onNavigateToRegister} className="btn-premium px-4 py-3" style={{ fontSize: '1.1rem' }}>
              Launch Your Career
            </button>
            <button onClick={onNavigateToLogin} className="btn-premium-secondary px-4 py-3" style={{ fontSize: '1.1rem' }}>
              Sign In to SkillSathi
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="row g-4 mt-5 pt-4">
          <div className="col-md-4">
            <div className="glass-card hoverable h-100">
              <div className="mb-3 d-inline-flex p-3 rounded-3" style={{ background: 'rgba(154, 85, 241, 0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 className="h4 mb-2">ATS Resume Analyzer</h3>
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                Upload your resume to get instant ATS scores, keyword optimization recommendations, and readability feedback powered by Gemini AI.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-card hoverable h-100">
              <div className="mb-3 d-inline-flex p-3 rounded-3" style={{ background: 'rgba(17, 212, 180, 0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <h3 className="h4 mb-2">Skill Gap & Roadmaps</h3>
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                Map your skills against target job roles. Discover missing credentials and get a personalized learning roadmap dynamically built for you.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-card hoverable h-100">
              <div className="mb-3 d-inline-flex p-3 rounded-3" style={{ background: 'rgba(154, 85, 241, 0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="h4 mb-2">Real-Time Interview Prep</h3>
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                Practice mock interviews with AI-generated questions tailored to your profile, and chat instantly with recruiters via integrated SignalR chat.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Stats Banner */}
        <div className="glass-card mt-5 py-4 text-center">
          <div className="row">
            <div className="col-4 border-end border-secondary border-opacity-10">
              <h3 className="display-6 fw-bold text-gradient-primary">94%</h3>
              <p className="text-secondary mb-0">Hiring Accuracy</p>
            </div>
            <div className="col-4 border-end border-secondary border-opacity-10">
              <h3 className="display-6 fw-bold text-gradient-secondary">10k+</h3>
              <p className="text-secondary mb-0">Students Mentored</p>
            </div>
            <div className="col-4">
              <h3 className="display-6 fw-bold text-gradient-primary">300+</h3>
              <p className="text-secondary mb-0">Partner Corporates</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STUDENT DASHBOARD ====================
  if (user.userType === 'Student') {
    return (
      <div className="container py-4 text-start">
        {/* Welcome Banner */}
        <div className="glass-card mb-4 glow-effect d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2 className="display-6 fw-bold mb-2">Welcome Back, <span className="text-gradient-primary">{user.fullName}</span>!</h2>
            <p className="text-secondary mb-0">Ready to boost your employability score today? Here is your profile summary.</p>
          </div>
          <span className="badge px-4 py-2 mt-2 mt-md-0" style={{ background: 'rgba(154, 85, 241, 0.15)', border: '1px solid var(--border-glow)', color: 'var(--primary)' }}>
            Student Profile
          </span>
        </div>

        <div className="row g-4">
          {/* Quick Actions Column */}
          <div className="col-lg-4">
            <div className="glass-card h-100">
              <h3 className="h4 mb-3 pb-2 border-bottom border-secondary border-opacity-10">Quick Actions</h3>
              <div className="d-grid gap-2">
                <button onClick={() => onNavigateToView && onNavigateToView('profile')} className="btn-premium text-start py-3">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Upload & Analyze Resume
                </button>
                <button onClick={() => onNavigateToView && onNavigateToView('profile')} className="btn-premium-secondary text-start py-3">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  Inspect Skill Gaps
                </button>
                <button onClick={() => onNavigateToView && onNavigateToView('interview')} className="btn-premium-secondary text-start py-3">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Prepare AI Mock Interview
                </button>
                <button onClick={() => onNavigateToView && onNavigateToView('jobs')} className="btn-premium-secondary text-start py-3">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Browse Job Opportunities
                </button>
              </div>
            </div>
          </div>

          {/* Employability Stats Column */}
          <div className="col-lg-8">
            <div className="glass-card h-100">
              <h3 className="h4 mb-3 pb-2 border-bottom border-secondary border-opacity-10">Employability Scorecard</h3>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                    <span className="text-secondary d-block mb-1">ATS Resume Score</span>
                    <div className="d-flex align-items-baseline">
                      <span className="h1 fw-bold text-gradient-primary mb-0">78</span>
                      <span className="text-secondary ms-1">/ 100</span>
                    </div>
                    <div className="progress mt-2" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar" style={{ width: '78%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                    <span className="text-secondary d-block mb-1">Skill Match Rate</span>
                    <div className="d-flex align-items-baseline">
                      <span className="h1 fw-bold text-gradient-secondary mb-0">65%</span>
                    </div>
                    <div className="progress mt-2" style={{ height: '6px', background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar" style={{ width: '65%', background: 'var(--secondary)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Pathways Teaser */}
              <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(154, 85, 241, 0.05)', border: '1px solid var(--border-glow)' }}>
                <h4 className="h5 mb-2" style={{ color: 'var(--primary)' }}>🔥 Recommended Next Steps</h4>
                <p className="text-secondary mb-2" style={{ fontSize: '0.9rem' }}>
                  Based on your target role <strong>Full Stack Developer</strong>, we found 3 critical skill gaps: <em>Docker, ASP.NET Core Web API, and Redux Toolkit</em>.
                </p>
                <a href="#roadmap" className="text-decoration-none" style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                  View Custom Learning Pathway &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RECRUITER DASHBOARD ====================
  if (user.userType === 'Recruiter') {
    return (
      <div className="container py-4 text-start">
        {/* Welcome Banner */}
        <div className="glass-card mb-4 glow-effect d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2 className="display-6 fw-bold mb-2">Recruiter Suite</h2>
            <p className="text-secondary mb-0">Manage job listings, review AI-shortlisted candidates, and chat with talent.</p>
          </div>
          <span className="badge px-4 py-2 mt-2 mt-md-0" style={{ background: 'rgba(17, 212, 180, 0.15)', border: '1px solid var(--secondary-glow)', color: 'var(--secondary)' }}>
            Recruiter Account
          </span>
        </div>

        <div className="row g-4">
          {/* Quick Actions Column */}
          <div className="col-lg-4">
            <div className="glass-card h-100">
              <h3 className="h4 mb-3 pb-2 border-bottom border-secondary border-opacity-10">Recruitment Controls</h3>
              <div className="d-grid gap-2">
                <button onClick={() => onNavigateToView && onNavigateToView('jobs')} className="btn-premium text-start py-3" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #119f88 100%)', boxShadow: '0 4px 15px rgba(17, 212, 180, 0.3)' }}>
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Post a New Job
                </button>
                <button onClick={() => onNavigateToView && onNavigateToView('jobs')} className="btn-premium-secondary text-start py-3">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  AI Candidate Finder
                </button>
                <button onClick={() => onNavigateToView && onNavigateToView('chat')} className="btn-premium-secondary text-start py-3">
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  SignalR Chat Inbox
                </button>
              </div>
            </div>
          </div>

          {/* Hiring Analytics Column */}
          <div className="col-lg-8">
            <div className="glass-card h-100">
              <h3 className="h4 mb-3 pb-2 border-bottom border-secondary border-opacity-10">Hiring Metrics</h3>
              
              {loadingRecruiterStats ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading metrics...</span>
                  </div>
                </div>
              ) : recruiterStats ? (
                <>
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                        <span className="text-secondary d-block mb-1" style={{ fontSize: '0.85rem' }}>Active Job Postings</span>
                        <span className="h1 fw-bold text-gradient-primary mb-0">{recruiterStats.activeJobsCount}</span>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                        <span className="text-secondary d-block mb-1" style={{ fontSize: '0.85rem' }}>Total Applications</span>
                        <span className="h1 fw-bold text-gradient-secondary mb-0">{recruiterStats.totalApplicationsCount}</span>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                        <span className="text-secondary d-block mb-1" style={{ fontSize: '0.85rem' }}>AI Shortlisted</span>
                        <span className="h1 fw-bold text-gradient-primary mb-0" style={{ color: 'var(--success)' }}>{recruiterStats.shortlistedCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Applications Teaser */}
                  <div className="mt-4">
                    <h4 className="h5 mb-3">Recent Applications</h4>
                    <div className="d-grid gap-2">
                      {recruiterStats.recentApplications.length > 0 ? (
                        recruiterStats.recentApplications.map(app => (
                          <div key={app.applicationId} className="p-2 px-3 rounded-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)' }}>
                            <div>
                              <strong className="d-block text-white" style={{ fontSize: '0.95rem' }}>{app.studentName}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {app.targetJobTitle || 'Candidate'} | Match: {app.aiMatchScore !== null ? `${app.aiMatchScore}%` : 'N/A'} (for {app.jobTitle})
                              </span>
                            </div>
                            <span className={`badge bg-${app.status === 'Shortlisted' ? 'success' : app.status === 'Rejected' ? 'danger' : 'warning'} bg-opacity-10 text-${app.status === 'Shortlisted' ? 'success' : app.status === 'Rejected' ? 'danger' : 'warning'} border border-${app.status === 'Shortlisted' ? 'success' : app.status === 'Rejected' ? 'danger' : 'warning'} border-opacity-20 py-1 px-2`} style={{ fontSize: '0.75rem' }}>
                              {app.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-secondary text-center py-3 m-0" style={{ fontSize: '0.9rem' }}>No recent applications found.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-secondary text-center py-5 m-0" style={{ fontSize: '0.9rem' }}>Failed to load recruiter stats.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ADMIN DASHBOARD ====================
  if (user.userType === 'Admin') {
    // Show spinner if loading statistics and list on initial load
    if (loadingStats && loadingUsers && !stats) {
      return (
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary mt-3">Loading administrative control center...</p>
        </div>
      );
    }

    // Filtered users list
    const filteredUsers = usersList.filter(u => {
      const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.extraInfo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'All' || u.userType === filterRole;
      return matchesSearch && matchesRole;
    });

    return (
      <div className="container py-4 text-start">
        {/* Welcome Header */}
        <div className="glass-card mb-4 glow-effect d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2 className="display-6 fw-bold mb-2">Admin Control Center</h2>
            <p className="text-secondary mb-0">Monitor system metrics, analyze student employability gaps, and manage user directories.</p>
          </div>
          <button onClick={() => { fetchAdminStats(); fetchAdminUsers(); }} className="btn-premium py-2 px-3 mt-2 mt-md-0 d-flex align-items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh System
          </button>
        </div>

        {/* Feedback Alerts */}
        {adminError && (
          <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-20 text-danger mb-4 rounded-3 d-flex justify-content-between align-items-center" role="alert">
            <span><strong>Error:</strong> {adminError}</span>
            <button type="button" onClick={() => setAdminError(null)} className="btn-close btn-close-white" aria-label="Close"></button>
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success bg-success bg-opacity-10 border-success border-opacity-20 text-success mb-4 rounded-3 d-flex justify-content-between align-items-center" role="alert">
            <span><strong>Success:</strong> {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="btn-close btn-close-white" aria-label="Close"></button>
          </div>
        )}

        {/* Stats Row */}
        {stats && (
          <div className="row g-4 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="glass-card h-100 p-3 text-center">
                <span className="text-secondary d-block mb-1" style={{ fontSize: '0.9rem' }}>Total Accounts</span>
                <span className="h2 fw-bold text-gradient-primary">{stats.totalUsers}</span>
                <span className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                  {stats.totalStudents} Students / {stats.totalRecruiters} Recruiters
                </span>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="glass-card h-100 p-3 text-center">
                <span className="text-secondary d-block mb-1" style={{ fontSize: '0.9rem' }}>Active Job Board</span>
                <span className="h2 fw-bold text-gradient-secondary">{stats.activeJobs}</span>
                <span className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                  Out of {stats.totalJobs} total postings
                </span>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="glass-card h-100 p-3 text-center">
                <span className="text-secondary d-block mb-1" style={{ fontSize: '0.9rem' }}>Job Applications</span>
                <span className="h2 fw-bold text-gradient-primary">{stats.totalApplications}</span>
                <span className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                  {stats.shortlistedApplications} Shortlisted / {stats.rejectedApplications} Rejected
                </span>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="glass-card h-100 p-3 text-center">
                <span className="text-secondary d-block mb-1" style={{ fontSize: '0.9rem' }}>Platform Infrastructure</span>
                <span className="h5 fw-bold text-white d-block mb-1" style={{ fontSize: '1.1rem' }}>
                  💾 {stats.databaseType}
                </span>
                <span className={`badge ${stats.geminiStatus.includes('Live') ? 'bg-success bg-opacity-10 text-success border-success border-opacity-20' : 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-20'} border px-2 py-1`} style={{ fontSize: '0.75rem' }}>
                  🤖 AI Status: {stats.geminiStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Grid */}
        {stats && (
          <div className="row g-4 mb-4">
            {/* Application Pipeline Split */}
            <div className="col-lg-6">
              <div className="glass-card h-100">
                <h3 className="h5 mb-3 pb-2 border-bottom border-secondary border-opacity-10 text-white">Application Pipeline Funnel</h3>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                      <span className="text-secondary">Applied (Awaiting Review)</span>
                      <strong className="text-info">{stats.appliedApplications} ({stats.totalApplications > 0 ? Math.round((stats.appliedApplications / stats.totalApplications) * 100) : 0}%)</strong>
                    </div>
                    <div className="progress" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar bg-info" style={{ width: `${stats.totalApplications > 0 ? (stats.appliedApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                      <span className="text-secondary">Shortlisted / Hired</span>
                      <strong className="text-success">{stats.shortlistedApplications} ({stats.totalApplications > 0 ? Math.round((stats.shortlistedApplications / stats.totalApplications) * 100) : 0}%)</strong>
                    </div>
                    <div className="progress" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar bg-success" style={{ width: `${stats.totalApplications > 0 ? (stats.shortlistedApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                      <span className="text-secondary">Rejected</span>
                      <strong className="text-danger">{stats.rejectedApplications} ({stats.totalApplications > 0 ? Math.round((stats.rejectedApplications / stats.totalApplications) * 100) : 0}%)</strong>
                    </div>
                    <div className="progress" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                      <div className="progress-bar bg-danger" style={{ width: `${stats.totalApplications > 0 ? (stats.rejectedApplications / stats.totalApplications) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Student Skills */}
            <div className="col-lg-6">
              <div className="glass-card h-100">
                <h3 className="h5 mb-3 pb-2 border-bottom border-secondary border-opacity-10 text-white">Top Student Skills Registered</h3>
                {stats.popularSkills.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {stats.popularSkills.map((sk, idx) => {
                      // Normalize percentage relative to total students
                      const maxCount = stats.totalStudents || 1;
                      const percentage = Math.round((sk.count / maxCount) * 100);
                      return (
                        <div key={idx}>
                          <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                            <span className="text-white fw-bold">{sk.skillName}</span>
                            <span className="text-secondary">{sk.count} {sk.count === 1 ? 'student' : 'students'} ({percentage}%)</span>
                          </div>
                          <div className="progress" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                            <div className="progress-bar" style={{ width: `${percentage}%`, background: 'var(--primary)' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-secondary text-center py-4 my-0" style={{ fontSize: '0.9rem' }}>No student skills seeded or selected yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Directory Table */}
        <div className="glass-card">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 border-bottom border-secondary border-opacity-10">
            <h3 className="h4 mb-0 text-white">User Accounts Directory</h3>
            <div className="d-flex gap-2 flex-grow-1 flex-sm-grow-0" style={{ maxWidth: '400px' }}>
              {/* Search input */}
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, target..."
                className="form-control text-white border-secondary border-opacity-25 py-2"
                style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', fontSize: '0.85rem' }}
              />
              {/* Filter Dropdown */}
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-select text-white border-secondary border-opacity-25 py-2"
                style={{ background: 'rgba(20, 21, 28, 0.95)', borderRadius: '8px', fontSize: '0.85rem', width: '130px' }}
              >
                <option value="All">All Roles</option>
                <option value="Student">Students</option>
                <option value="Recruiter">Recruiters</option>
                <option value="Admin">Admins</option>
              </select>
            </div>
          </div>

          {loadingUsers && usersList.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="table-responsive mt-3 rounded-3" style={{ border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)', overflowX: 'auto' }}>
              <table className="table table-dark table-hover mb-0 align-middle" style={{ background: 'transparent' }}>
                <thead>
                  <tr className="text-secondary" style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                    <th scope="col" className="ps-3 py-3" style={{ background: 'transparent' }}>User</th>
                    <th scope="col" className="py-3" style={{ background: 'transparent' }}>System Role</th>
                    <th scope="col" className="py-3" style={{ background: 'transparent' }}>Profile Context</th>
                    <th scope="col" className="py-3" style={{ background: 'transparent' }}>Registered</th>
                    <th scope="col" className="py-3" style={{ background: 'transparent' }}>Status</th>
                    <th scope="col" className="text-end pe-3 py-3" style={{ background: 'transparent' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const initials = u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    
                    // Style badges based on role
                    let roleBadgeStyle = { background: 'rgba(154, 85, 241, 0.12)', border: '1px solid var(--border-glow)', color: 'var(--primary)' };
                    if (u.userType === 'Recruiter') {
                      roleBadgeStyle = { background: 'rgba(17, 212, 180, 0.12)', border: '1px solid var(--secondary-glow)', color: 'var(--secondary)' };
                    } else if (u.userType === 'Admin') {
                      roleBadgeStyle = { background: 'rgba(255, 193, 7, 0.12)', border: '1px solid rgba(255, 193, 7, 0.3)', color: '#ffc107' };
                    }

                    const isSelf = u.id === user.id;

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'transparent' }}>
                        <td className="ps-3 py-3" style={{ background: 'transparent' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white" 
                                 style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              {initials}
                            </div>
                            <div>
                              <strong className="d-block text-white" style={{ fontSize: '0.9rem' }}>{u.fullName} {isSelf && <span className="text-muted" style={{ fontSize: '0.75rem' }}>(You)</span>}</strong>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ background: 'transparent' }}>
                          <span className="badge py-1 px-2.5" style={{ ...roleBadgeStyle, fontSize: '0.75rem' }}>
                            {u.userType}
                          </span>
                        </td>
                        <td className="text-secondary" style={{ background: 'transparent', fontSize: '0.8rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.extraInfo}
                        </td>
                        <td className="text-secondary" style={{ background: 'transparent', fontSize: '0.8rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ background: 'transparent' }}>
                          {u.isActive ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 py-1 px-2 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                              <span className="pulse-indicator bg-success" style={{ width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }}></span>
                              Active
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 py-1 px-2 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'red', display: 'inline-block' }}></span>
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-3 py-3" style={{ background: 'transparent' }}>
                          <div className="d-inline-flex gap-2">
                            {/* Toggle Suspend Button */}
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              disabled={isSelf || actionLoading === u.id}
                              className={`btn btn-sm ${u.isActive ? 'btn-outline-warning border-warning border-opacity-20' : 'btn-outline-success border-success border-opacity-20'} py-1.5 px-2`}
                              style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                              title={u.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {actionLoading === u.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : u.isActive ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                                </svg>
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={isSelf || actionLoading === u.id}
                              className="btn btn-sm btn-outline-danger border-danger border-opacity-20 py-1.5 px-2"
                              style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                              title="Delete Account"
                            >
                              {actionLoading === u.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary text-center py-5 my-0" style={{ fontSize: '0.95rem' }}>No users found matching filters.</p>
          )}
        </div>
      </div>
    );
  }}

export default Home;
