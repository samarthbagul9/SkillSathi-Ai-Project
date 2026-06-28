import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentProfileView from './components/StudentProfileView';
import RecruiterProfileView from './components/RecruiterProfileView';
import StudentJobBoard from './components/StudentJobBoard';
import StudentApplications from './components/StudentApplications';
import RecruiterJobManager from './components/RecruiterJobManager';
import AIMockInterview from './components/AIMockInterview';
import ChatWindow from './components/ChatWindow';
import API from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'login', 'register', 'profile', 'jobs', 'applications', 'interview', 'chat'
  const [activeChatContact, setActiveChatContact] = useState(null);

  const navigateToView = (newView, contact = null) => {
    setActiveChatContact(contact);
    setView(newView);
  };
  
  // Real-Time Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const notifConnectionRef = useRef(null);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    // Check if user is already authenticated on load
    const storedUser = localStorage.getItem('skillsathi_user');
    const token = localStorage.getItem('skillsathi_token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse stored user', e);
        handleLogout();
      }
    }

    // Set up global listener for automatic logout on 401 API responses
    const handleGlobalLogout = () => {
      handleLogout();
      setView('login');
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    
    // Close notification dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen to user logins/logouts to trigger SignalR notification connections
  useEffect(() => {
    if (user) {
      fetchNotifications();
      initNotificationSignalR();
    } else {
      // Disconnect SignalR on logout
      if (notifConnectionRef.current) {
        notifConnectionRef.current.stop();
        notifConnectionRef.current = null;
      }
      setNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
      setUnreadNotifCount(res.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  const initNotificationSignalR = async () => {
    const token = localStorage.getItem('skillsathi_token');
    if (!token) return;

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5008/r/notifications', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      connection.on('ReceiveNotification', (newNotif) => {
        // 1. Add notification to list and increment unread
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadNotifCount(prev => prev + 1);

        // 2. Trigger floating toast alert
        setToast({ show: true, message: newNotif.message });
        
        // Auto dismiss toast in 4 seconds
        setTimeout(() => {
          setToast({ show: false, message: '' });
        }, 4000);
      });

      await connection.start();
      console.log('SignalR Notification Connection Started.');
      notifConnectionRef.current = connection;
    } catch (err) {
      console.error('SignalR Notification connection failed', err);
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await API.post(`/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read', err);
    }
  };

  const handleMarkAllNotifRead = async () => {
    try {
      await API.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
      setShowNotifDropdown(false);
    } catch (err) {
      console.error('Error marking all notifications as read', err);
    }
  };

  const handleLoginSuccess = (authData) => {
    const userData = {
      id: authData.token ? parseJwtUserId(authData.token) : '',
      fullName: authData.fullName,
      email: authData.email,
      userType: authData.userType,
      expiration: authData.expiration
    };
    localStorage.setItem('skillsathi_token', authData.token);
    localStorage.setItem('skillsathi_user', JSON.stringify(userData));
    setUser(userData);
    setView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('skillsathi_token');
    localStorage.removeItem('skillsathi_user');
    setUser(null);
    setActiveChatContact(null);
    setView('home');
  };

  // Basic JWT parser helper to extract User ID from token claims
  const parseJwtUserId = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      // ClaimTypes.NameIdentifier standard key is 'nameid' or 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      return payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || '';
    } catch (e) {
      console.error('Error decoding JWT user ID', e);
      return '';
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      
      {/* Real-time Toast Notification Alert */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className="glass-card animate-fade-in pulse-glow d-flex align-items-center gap-3 p-3 text-white border-0" 
               style={{ background: 'rgba(154, 85, 241, 0.9)', borderRadius: '12px', minWidth: '300px', maxWidth: '400px' }}>
            <div style={{ fontSize: '1.5rem' }}>🔔</div>
            <div className="text-start flex-grow-1" style={{ fontSize: '0.9rem' }}>
              <strong className="d-block" style={{ fontWeight: '700' }}>SkillSathi Alert</strong>
              {toast.message}
            </div>
            <button type="button" onClick={() => setToast({ show: false, message: '' })} className="btn-close btn-close-white" aria-label="Close"></button>
          </div>
        </div>
      )}

      {/* Premium Navbar */}
      <nav className="premium-navbar">
        <div className="container d-flex justify-content-between align-items-center">
          <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }} className="navbar-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="d-inline-block align-text-top">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span className="ms-2">SkillSathi <span style={{ color: 'var(--secondary)' }}>AI</span></span>
          </a>

          <div className="d-flex align-items-center gap-3">
            <button 
              onClick={() => navigateToView('home')} 
              className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'home' ? 'text-white' : 'text-secondary'}`}
              style={{ fontWeight: '500', background: 'none' }}
            >
              Home
            </button>

            {user ? (
              <div className="d-flex align-items-center gap-3">
                
                {/* Role-Based Nav Tabs */}
                {user.userType === 'Student' ? (
                  <>
                    <button 
                      onClick={() => navigateToView('jobs')} 
                      className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'jobs' ? 'text-white' : 'text-secondary'}`}
                      style={{ fontWeight: '500', background: 'none' }}
                    >
                      Job Board
                    </button>
                    <button 
                      onClick={() => navigateToView('applications')} 
                      className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'applications' ? 'text-white' : 'text-secondary'}`}
                      style={{ fontWeight: '500', background: 'none' }}
                    >
                      My Applications
                    </button>
                    <button 
                      onClick={() => navigateToView('interview')} 
                      className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'interview' ? 'text-white' : 'text-secondary'}`}
                      style={{ fontWeight: '500', background: 'none' }}
                    >
                      Interview Prep
                    </button>
                    <button 
                      onClick={() => navigateToView('chat')} 
                      className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'chat' ? 'text-white' : 'text-secondary'}`}
                      style={{ fontWeight: '500', background: 'none' }}
                    >
                      Messages
                    </button>
                  </>
                ) : user.userType === 'Recruiter' ? (
                  <>
                    <button 
                      onClick={() => navigateToView('jobs')} 
                      className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'jobs' ? 'text-white' : 'text-secondary'}`}
                      style={{ fontWeight: '500', background: 'none' }}
                    >
                      Manage Jobs
                    </button>
                    <button 
                      onClick={() => navigateToView('chat')} 
                      className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'chat' ? 'text-white' : 'text-secondary'}`}
                      style={{ fontWeight: '500', background: 'none' }}
                    >
                      Messages
                    </button>
                  </>
                ) : null}

                {user.userType !== 'Admin' && (
                  <button 
                    onClick={() => navigateToView('profile')} 
                    className={`btn btn-link p-0 text-decoration-none border-0 ${view === 'profile' ? 'text-white' : 'text-secondary'}`}
                    style={{ fontWeight: '500', background: 'none' }}
                  >
                    My Profile
                  </button>
                )}

                {/* Real-time Notifications Bell Icon */}
                <div className="position-relative" ref={notifDropdownRef}>
                  <button 
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="btn btn-link p-0 border-0 text-secondary"
                    style={{ background: 'none' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {unreadNotifCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger" 
                            style={{ padding: '4px 6px', fontSize: '0.6rem' }}>
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Glassmorphic Notification Dropdown */}
                  {showNotifDropdown && (
                    <div className="position-absolute end-0 mt-3 glass-card p-3 animate-fade-in text-start" 
                         style={{ width: '320px', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-10">
                        <strong className="text-white">Notifications</strong>
                        {unreadNotifCount > 0 && (
                          <button onClick={handleMarkAllNotifRead} className="btn btn-link p-0 text-decoration-none" style={{ color: 'var(--primary)', fontSize: '0.8rem', background: 'none', border: '0' }}>
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length > 0 ? (
                        <div className="d-flex flex-column gap-2">
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => { if(!n.isRead) handleMarkNotifRead(n.id); }}
                              className={`p-2 rounded-3 cursor-pointer ${!n.isRead ? 'unread-notif' : ''}`}
                              style={{ 
                                background: !n.isRead ? 'rgba(154, 85, 241, 0.08)' : 'transparent',
                                borderLeft: !n.isRead ? '2px solid var(--primary)' : '2px solid transparent',
                                cursor: !n.isRead ? 'pointer' : 'default',
                                fontSize: '0.85rem'
                              }}
                            >
                              <p className="text-white mb-1">{n.message}</p>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-secondary text-center m-0 py-3" style={{ fontSize: '0.85rem' }}>No new alerts.</p>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-secondary d-none d-sm-inline" style={{ fontSize: '0.9rem' }}>
                  Logged in as <strong className="text-white">{user.fullName}</strong>
                </span>
                
                <button onClick={handleLogout} className="btn-premium-secondary py-2 px-3">
                  Logout
                </button>

              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <button onClick={() => setView('login')} className="btn-premium-secondary py-2 px-3">
                  Sign In
                </button>
                <button onClick={() => setView('register')} className="btn-premium py-2 px-3" style={{ fontSize: '0.9rem' }}>
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1 d-flex flex-column justify-content-center">
        {view === 'home' && (
          <Home 
            user={user} 
            onNavigateToLogin={() => setView('login')} 
            onNavigateToRegister={() => setView('register')} 
            onNavigateToView={(targetView) => setView(targetView)}
          />
        )}
        {view === 'login' && (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            onNavigateToRegister={() => setView('register')} 
            onNavigateToForgotPassword={() => setView('forgot-password')}
          />
        )}
        {view === 'register' && (
          <Register 
            onNavigateToLogin={() => setView('login')} 
          />
        )}
        {view === 'forgot-password' && (
          <ForgotPassword 
            onNavigateToLogin={() => setView('login')} 
          />
        )}
        {view === 'profile' && user && (
          user.userType === 'Student' ? <StudentProfileView /> : <RecruiterProfileView />
        )}
        {view === 'jobs' && user && (
          user.userType === 'Student' ? <StudentJobBoard /> : <RecruiterJobManager navigateToView={navigateToView} />
        )}
        {view === 'applications' && user && user.userType === 'Student' && (
          <StudentApplications navigateToView={navigateToView} />
        )}
        {view === 'interview' && user && user.userType === 'Student' && (
          <AIMockInterview />
        )}
        {view === 'chat' && user && (
          <ChatWindow currentUser={user} initialContact={activeChatContact} />
        )}
      </main>

      {/* Premium Footer */}
      <footer className="py-4 mt-5" style={{ background: 'rgba(10, 11, 16, 0.9)', borderTop: '1px solid var(--border-light)' }}>
        <div className="container text-center text-secondary" style={{ fontSize: '0.9rem' }}>
          <p className="mb-2">&copy; {new Date().getFullYear()} SkillSathi AI Platform. Built with .NET 8, EF Core, SignalR, and React.</p>
          <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: '0.8rem' }}>
            <span className="text-muted">CDAC Level Final Year Industry Project</span>
            <span className="text-muted">|</span>
            <span className="text-muted">Team of 5 Members</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
