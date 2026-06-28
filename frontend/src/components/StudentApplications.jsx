import { useState, useEffect } from 'react';
import API from '../services/api';

function StudentApplications({ navigateToView }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await API.get('/jobs/applications');
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching applications', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Shortlisted':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(154, 85, 241, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-glow)' };
    }
  };

  return (
    <div className="container py-4 text-start animate-fade-in">
      <h2 className="text-gradient-primary mb-4" style={{ fontSize: '2.2rem' }}>My Applications</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Applications...</span>
          </div>
        </div>
      ) : applications.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {applications.map(app => {
            const statusStyle = getStatusStyle(app.status);
            return (
              <div key={app.applicationId} className="glass-card">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h3 className="h5 text-white mb-1">{app.jobTitle}</h3>
                    <h4 className="h6 text-secondary mb-0">{app.companyName}</h4>
                  </div>
                  <span 
                    className="badge px-3 py-2"
                    style={{ background: statusStyle.bg, color: statusStyle.color, border: statusStyle.border, borderRadius: '20px' }}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="row g-3 text-secondary align-items-center" style={{ fontSize: '0.9rem' }}>
                  <div className="col-sm-4">
                    <span>📍 {app.location}</span>
                  </div>
                  <div className="col-sm-4">
                    <span>💼 {app.jobType}</span>
                  </div>
                  <div className="col-sm-4">
                    <span>📅 Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Progressive Status Timeline */}
                <div className="mt-4 pt-3 border-top border-secondary border-opacity-10">
                  <h4 className="h6 text-white mb-3" style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Application Stage</h4>
                  
                  <div className="position-relative d-flex justify-content-between align-items-center mx-auto" style={{ maxWidth: '450px', height: '30px' }}>
                    
                    {/* Background Progress Line */}
                    <div 
                      className="position-absolute w-100" 
                      style={{ 
                        height: '3px', 
                        background: app.status === 'Rejected' 
                          ? 'linear-gradient(90deg, var(--primary) 50%, var(--danger) 100%)'
                          : app.status === 'Shortlisted'
                            ? 'linear-gradient(90deg, var(--primary) 50%, var(--success) 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                        zIndex: 1, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        borderRadius: '10px'
                      }}
                    ></div>

                    {/* Step 1: Applied */}
                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center" 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: 'var(--primary)',
                          border: '2px solid #ffffff'
                        }}
                      >
                        <span className="text-white" style={{ fontSize: '0.65rem' }}>✓</span>
                      </div>
                      <span className="text-secondary mt-1" style={{ fontSize: '0.75rem' }}>Applied</span>
                    </div>

                    {/* Step 2: Evaluation */}
                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center" 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: app.status !== 'Applied' ? 'var(--primary)' : 'rgba(25, 28, 41, 0.9)',
                          border: app.status !== 'Applied' ? '2px solid #ffffff' : '2px solid var(--border-light)'
                        }}
                      >
                        {app.status !== 'Applied' && <span className="text-white" style={{ fontSize: '0.65rem' }}>✓</span>}
                      </div>
                      <span className="text-secondary mt-1" style={{ fontSize: '0.75rem' }}>Reviewing</span>
                    </div>

                    {/* Step 3: Decision */}
                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center" 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          background: app.status === 'Shortlisted' 
                            ? 'var(--success)' 
                            : app.status === 'Rejected' 
                              ? 'var(--danger)' 
                              : 'rgba(25, 28, 41, 0.9)',
                          border: app.status !== 'Applied' && app.status !== 'Reviewing' 
                            ? '2px solid #ffffff' 
                            : '2px solid var(--border-light)'
                        }}
                      >
                        {(app.status === 'Shortlisted' || app.status === 'Rejected') && <span className="text-white" style={{ fontSize: '0.65rem' }}>✓</span>}
                      </div>
                      <span className="text-secondary mt-1" style={{ fontSize: '0.75rem' }}>
                        {app.status === 'Rejected' ? 'Rejected' : app.status === 'Shortlisted' ? 'Shortlisted' : 'Decision'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Recruiter Feedback Section */}
                {app.feedback && (
                  <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.02)', borderLeft: '3px solid var(--primary)' }}>
                    <h5 className="text-white mb-1" style={{ fontSize: '0.9rem' }}>Recruiter Note:</h5>
                    <p className="text-secondary m-0" style={{ fontSize: '0.85rem' }}>{app.feedback}</p>
                  </div>
                )}

                <div className="d-flex justify-content-end mt-3 pt-3 border-top border-secondary border-opacity-10">
                  <button 
                    onClick={() => navigateToView && navigateToView('chat', { userId: app.recruiterId, fullName: `${app.companyName} Recruiter`, userType: 'Recruiter' })}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                    style={{ border: '1px solid var(--border-glow)', color: 'var(--primary)' }}
                  >
                    💬 Message Recruiter
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card text-center p-5 text-secondary">
          <p className="m-0">You haven't submitted any job applications yet.</p>
        </div>
      )}
    </div>
  );
}

export default StudentApplications;
