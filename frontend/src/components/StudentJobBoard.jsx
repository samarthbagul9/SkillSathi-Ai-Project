import { useState, useEffect } from 'react';
import API from '../services/api';

function StudentJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (searchVal = search, locVal = location, typeVal = jobType) => {
    setLoading(true);
    try {
      const params = {};
      if (searchVal) params.search = searchVal;
      if (locVal) params.location = locVal;
      if (typeVal) params.jobType = typeVal;

      const res = await API.get('/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchJobs(e.target.value, location, jobType);
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    fetchJobs(search, e.target.value, jobType);
  };

  const handleJobTypeChange = (e) => {
    setJobType(e.target.value);
    fetchJobs(search, location, e.target.value);
  };

  const handleApply = async (jobId) => {
    setApplying(true);
    setMessage({ type: '', text: '' });

    try {
      await API.post(`/jobs/${jobId}/apply`);
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      setTimeout(() => {
        setSelectedJob(null);
        setMessage({ type: '', text: '' });
      }, 2000);
      
      // Update jobs list counts
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, applicationsCount: j.applicationsCount + 1 } : j));
    } catch (err) {
      console.error('Application error', err);
      const msg = err.response?.data?.message || 'Failed to submit application. Ensure you have set up your profile.';
      setMessage({ type: 'danger', text: msg });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="container py-4 text-start animate-fade-in">
      <h2 className="text-gradient-primary mb-4" style={{ fontSize: '2.2rem' }}>Careers & Job Opportunities</h2>

      {/* Filter and Search Bar */}
      <div className="glass-card mb-4 p-3">
        <div className="row g-3">
          <div className="col-md-5">
            <input
              type="text"
              className="glass-input"
              placeholder="Search by Job Title or Keywords..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="col-md-3 col-sm-6">
            <select className="glass-input" value={location} onChange={handleLocationChange}>
              <option value="">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <div className="col-md-4 col-sm-6">
            <select className="glass-input" value={jobType} onChange={handleJobTypeChange}>
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List Grid */}
      {loading ? (
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
                    <div>
                      <h3 className="h5 text-white mb-0">{job.Title}</h3>
                      <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{job.companyName}</span>
                    </div>
                    <span className="badge rounded-pill px-2 py-1" 
                          style={{ background: 'rgba(154, 85, 241, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }}>
                      {job.jobType}
                    </span>
                  </div>

                  <p className="text-secondary text-truncate-3 mb-3" style={{ fontSize: '0.9rem' }}>
                    {job.Description}
                  </p>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3 text-secondary" style={{ fontSize: '0.85rem' }}>
                    <span className="d-flex align-items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {job.Location}
                    </span>
                    {job.salaryRange && (
                      <span className="d-flex align-items-center gap-1">
                        💰 {job.salaryRange}
                      </span>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {job.applicationsCount} applicant{job.applicationsCount !== 1 ? 's' : ''}
                    </span>
                    <button 
                      onClick={() => setSelectedJob(job)} 
                      className="btn-premium py-1 px-3" 
                      style={{ borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card text-center p-5 text-secondary">
          <p className="m-0">No active job postings found matching your search filters.</p>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card p-4 border-0 text-start overflow-auto" style={{ maxHeight: '90vh' }}>
              
              {/* Header */}
              <div className="modal-header border-0 p-0 mb-4 d-flex justify-content-between align-items-start">
                <div>
                  <h2 className="text-gradient-primary mb-1" style={{ fontSize: '1.8rem' }}>{selectedJob.Title}</h2>
                  <h4 className="h5 text-white">{selectedJob.companyName}</h4>
                  {selectedJob.companyWebsite && (
                    <a href={selectedJob.companyWebsite} target="_blank" rel="noreferrer" className="text-decoration-none" style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>
                      Visit Company Website &rarr;
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => { setSelectedJob(null); setMessage({ type: '', text: '' }); }}
                  className="btn-close btn-close-white border-0 p-1" 
                  aria-label="Close"
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-0">
                {message.text && (
                  <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} border-0 text-white py-2 px-3 mb-4`}
                       style={{ background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                    {message.text}
                  </div>
                )}

                <div className="row g-4">
                  <div className="col-md-8">
                    <div className="mb-4">
                      <h4 className="h5 text-white mb-2 pb-1 border-bottom border-secondary border-opacity-10">Job Description</h4>
                      <p className="text-secondary" style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {selectedJob.Description}
                      </p>
                    </div>

                    <div className="mb-3">
                      <h4 className="h5 text-white mb-2 pb-1 border-bottom border-secondary border-opacity-10">Requirements & Skills</h4>
                      <p className="text-secondary" style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {selectedJob.Requirements}
                      </p>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 rounded-3 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                      <h4 className="h6 text-white mb-3 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>Job Summary</h4>
                      <div className="d-flex flex-column gap-3" style={{ fontSize: '0.9rem' }}>
                        <div>
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Location</span>
                          <span className="text-white">📍 {selectedJob.Location}</span>
                        </div>
                        <div>
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Job Type</span>
                          <span className="text-white">💼 {selectedJob.jobType}</span>
                        </div>
                        {selectedJob.salaryRange && (
                          <div>
                            <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Salary Bracket</span>
                            <span className="text-white">💰 {selectedJob.salaryRange}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Posted On</span>
                          <span className="text-white">📅 {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <button 
                        onClick={() => handleApply(selectedJob.id)} 
                        className="btn-premium w-100 py-3" 
                        disabled={applying}
                      >
                        {applying ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Applying...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentJobBoard;
