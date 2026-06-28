import { useState, useEffect } from 'react';
import API from '../services/api';

function RecruiterJobManager({ navigateToView }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list', 'post', 'applicants'
  
  // Post Job Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  
  // Applicants State
  const [activeJob, setActiveJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRecruiterJobs();
  }, []);

  const fetchRecruiterJobs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/jobs/recruiter');
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching recruiter jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await API.post('/jobs', {
        title,
        description,
        requirements,
        location,
        salaryRange,
        jobType
      });
      
      setMessage({ type: 'success', text: 'Job posted successfully!' });
      
      // Clear form
      setTitle('');
      setDescription('');
      setRequirements('');
      setLocation('');
      setSalaryRange('');
      setJobType('Full-time');
      
      // Refresh jobs list and go back
      await fetchRecruiterJobs();
      setTimeout(() => {
        setView('list');
        setMessage({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      console.error('Error posting job', err);
      setMessage({ type: 'danger', text: 'Failed to post job listing.' });
    }
  };

  const handleViewApplicants = async (job) => {
    setActiveJob(job);
    setView('applicants');
    setLoadingApplicants(true);
    try {
      const res = await API.get(`/jobs/${job.id}/applicants`);
      setApplicants(res.data);
    } catch (err) {
      console.error('Error fetching applicants', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    setUpdatingAppId(appId);
    setMessage({ type: '', text: '' });

    try {
      await API.put(`/jobs/applications/${appId}/status`, {
        status,
        feedback: feedback || null
      });

      setMessage({ type: 'success', text: `Candidate successfully ${status.toLowerCase()}!` });
      setFeedback('');
      
      // Refresh applicants list
      if (activeJob) {
        const res = await API.get(`/jobs/${activeJob.id}/applicants`);
        setApplicants(res.data);
      }
    } catch (err) {
      console.error('Error updating candidate status', err);
      setMessage({ type: 'danger', text: 'Failed to update candidate status.' });
    } finally {
      setUpdatingAppId(null);
      // Auto clear message after 2 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  };

  const handleDownloadResume = async (studentId, fileName) => {
    try {
      const response = await API.get(`/resume/download/${studentId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'resume.pdf';
      link.click();
    } catch (err) {
      console.error('Error downloading candidate resume', err);
      alert('Failed to download candidate resume.');
    }
  };

  return (
    <div className="container py-4 text-start animate-fade-in">
      
      {/* Header section with toggle buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-gradient-secondary mb-1" style={{ fontSize: '2.2rem' }}>Job Postings Manager</h2>
          <p className="text-secondary mb-0">Create job listings and manage applicant pipelines.</p>
        </div>
        
        <div>
          {view === 'list' && (
            <button onClick={() => setView('post')} className="btn-premium px-4 py-2">
              + Post New Job
            </button>
          )}
          {view !== 'list' && (
            <button onClick={() => { setView('list'); setActiveJob(null); setMessage({ type: '', text: '' }); }} className="btn-premium-secondary px-4 py-2">
              &larr; Back to Listings
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} border-0 text-white py-2 px-3 mb-4`}
             style={{ background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
          {message.text}
        </div>
      )}

      {/* ==================== 1. LIST VIEW ==================== */}
      {view === 'list' && (
        loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Jobs...</span>
            </div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="row g-3">
            {jobs.map(job => (
              <div key={job.id} className="col-md-6">
                <div className="glass-card hoverable h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h3 className="h5 text-white mb-0">{job.Title}</h3>
                      <span className="badge rounded-pill px-2 py-1" 
                            style={{ background: 'rgba(17, 212, 180, 0.15)', color: 'var(--secondary)', border: '1px solid rgba(17, 212, 180, 0.3)' }}>
                        {job.jobType}
                      </span>
                    </div>
                    
                    <p className="text-secondary text-truncate-2 mb-3" style={{ fontSize: '0.9rem' }}>
                      {job.Description}
                    </p>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 text-secondary" style={{ fontSize: '0.85rem' }}>
                      <span>📍 {job.Location}</span>
                      {job.salaryRange && <span>💰 {job.salaryRange}</span>}
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10">
                      <span className="text-white" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        📊 {job.applicationsCount} Applicant{job.applicationsCount !== 1 ? 's' : ''}
                      </span>
                      <button 
                        onClick={() => handleViewApplicants(job)} 
                        className="btn-premium py-1 px-3" 
                        style={{ borderRadius: '6px', fontSize: '0.85rem', background: 'linear-gradient(135deg, var(--secondary) 0%, #119f88 100%)', boxShadow: 'none' }}
                      >
                        Manage Applicants
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card text-center p-5 text-secondary">
            <p className="mb-3">You haven't posted any jobs yet.</p>
            <button onClick={() => setView('post')} className="btn-premium px-4 py-2">
              Post Your First Job
            </button>
          </div>
        )
      )}

      {/* ==================== 2. POST JOB VIEW ==================== */}
      {view === 'post' && (
        <div className="glass-card glow-effect mx-auto" style={{ maxWidth: '800px' }}>
          <h3 className="h4 mb-4 text-white">Create a New Job Listing</h3>
          
          <form onSubmit={handlePostJob}>
            <div className="row g-3">
              <div className="col-12">
                <label className="glass-label" htmlFor="jobTitle">Job Title</label>
                <input
                  type="text"
                  id="jobTitle"
                  className="glass-input"
                  placeholder="e.g. Senior ASP.NET Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-sm-6">
                <label className="glass-label" htmlFor="jobLocation">Location</label>
                <select className="glass-input" id="jobLocation" value={location} onChange={(e) => setLocation(e.target.value)} required>
                  <option value="">Select Location</option>
                  <option value="Remote">Remote</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div className="col-sm-6">
                <label className="glass-label" htmlFor="jobType">Job Type</label>
                <select className="glass-input" id="jobType" value={jobType} onChange={(e) => setJobType(e.target.value)} required>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="col-12">
                <label className="glass-label" htmlFor="salaryRange">Salary Package / Range (Optional)</label>
                <input
                  type="text"
                  id="salaryRange"
                  className="glass-input"
                  placeholder="e.g. 8 - 12 LPA"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="glass-label" htmlFor="jobDesc">Detailed Job Description</label>
                <textarea
                  id="jobDesc"
                  className="glass-input"
                  rows="6"
                  placeholder="Outline the day-to-day responsibilities, about the team, and what the candidate will work on..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="col-12">
                <label className="glass-label" htmlFor="jobReqs">Key Requirements & Technical Skills</label>
                <textarea
                  id="jobReqs"
                  className="glass-input"
                  rows="4"
                  placeholder="Specify mandatory technical stacks, experience level, qualifications, and certifications..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>

            <div className="mt-4">
              <button type="submit" className="btn-premium px-4 py-2">
                Publish Job Listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. APPLICANTS VIEW ==================== */}
      {view === 'applicants' && activeJob && (
        <div>
          {/* Job summary bar */}
          <div className="glass-card mb-4 p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h3 className="h4 text-white mb-1">{activeJob.Title}</h3>
              <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                📍 {activeJob.Location} • 💼 {activeJob.jobType}
              </span>
            </div>
            <span className="badge px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)' }}>
              {applicants.length} Applicant{applicants.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingApplicants ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading Candidates...</span>
              </div>
            </div>
          ) : applicants.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {applicants.map(candidate => (
                <div key={candidate.applicationId} className="glass-card">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                    <div>
                      <h4 className="text-white mb-1">{candidate.studentName}</h4>
                      <span className="text-secondary d-block" style={{ fontSize: '0.9rem' }}>📧 {candidate.studentEmail}</span>
                      <span className="text-secondary d-block" style={{ fontSize: '0.9rem' }}>🎯 Target Role: <strong>{candidate.targetJobTitle}</strong></span>
                    </div>

                    <div className="d-flex flex-column align-items-end gap-2">
                      <span className={`badge py-1 px-3`} style={{
                        background: candidate.status === 'Shortlisted' ? 'rgba(16, 185, 129, 0.15)' : candidate.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: candidate.status === 'Shortlisted' ? 'var(--success)' : candidate.status === 'Rejected' ? 'var(--danger)' : 'var(--text-secondary)',
                        border: candidate.status === 'Shortlisted' ? '1px solid rgba(16, 185, 129, 0.3)' : candidate.status === 'Rejected' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-light)',
                        borderRadius: '20px'
                      }}>
                        {candidate.status}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Applied on: {new Date(candidate.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10 flex-wrap gap-3">
                    
                    {/* Resume download */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {candidate.resumeFileName ? (
                        <button 
                          onClick={() => handleDownloadResume(candidate.studentId, candidate.resumeFileName)}
                          className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2"
                        >
                          📄 Download Resume
                        </button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>No Resume Uploaded</span>
                      )}

                      <button 
                        onClick={() => navigateToView && navigateToView('chat', { userId: candidate.studentId, fullName: candidate.studentName, userType: 'Student' })}
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2"
                        style={{ border: '1px solid var(--border-glow)', color: 'var(--primary)' }}
                      >
                        💬 Message Candidate
                      </button>
                    </div>

                    {/* Shortlist/Reject tools */}
                    {candidate.status === 'Applied' && (
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        
                        {/* Interactive Feedback Box */}
                        <input
                          type="text"
                          className="glass-input py-1 px-2"
                          placeholder="Optional feedback..."
                          style={{ maxWidth: '180px', fontSize: '0.85rem' }}
                          value={updatingAppId === candidate.applicationId ? feedback : ''}
                          onChange={(e) => {
                            setUpdatingAppId(candidate.applicationId);
                            setFeedback(e.target.value);
                          }}
                        />

                        <button 
                          onClick={() => handleUpdateStatus(candidate.applicationId, 'Shortlisted')}
                          className="btn btn-sm btn-success px-3"
                          disabled={updatingAppId !== null && updatingAppId !== candidate.applicationId}
                        >
                          Shortlist
                        </button>
                        
                        <button 
                          onClick={() => handleUpdateStatus(candidate.applicationId, 'Rejected')}
                          className="btn btn-sm btn-danger px-3"
                          disabled={updatingAppId !== null && updatingAppId !== candidate.applicationId}
                        >
                          Reject
                        </button>

                      </div>
                    )}

                    {candidate.status !== 'Applied' && (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Processed candidate pipeline
                      </span>
                    )}

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-center p-5 text-secondary">
              <p className="m-0">No candidates have applied for this job listing yet.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default RecruiterJobManager;
