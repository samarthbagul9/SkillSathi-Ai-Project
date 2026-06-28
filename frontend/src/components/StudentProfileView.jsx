import { useState, useEffect } from 'react';
import API from '../services/api';

function StudentProfileView() {
  const [profile, setProfile] = useState(null);
  const [masterSkills, setMasterSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form fields
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  // Skill adding
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState('Beginner');
  
  // Resume uploading
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // AI ATS Analysis
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchProfileAndSkills();
  }, []);

  const fetchProfileAndSkills = async () => {
    setLoading(true);
    try {
      // 1. Fetch Student Profile
      const profileRes = await API.get('/profile/student');
      const p = profileRes.data;
      setProfile(p);
      setBio(p.bio || '');
      setEducation(p.educationDetails || '');
      setTargetJob(p.targetJobTitle || '');
      setLinkedin(p.linkedin || '');
      setGithub(p.github || '');

      // 2. Fetch Master Skills
      const skillsRes = await API.get('/skills');
      setMasterSkills(skillsRes.data);
      // 3. Fetch existing AI analysis if scored
      if (p.resumeAtsScore !== null && p.resumeFileName) {
        try {
          const analysisRes = await API.get('/ai/resume-analysis');
          setAtsAnalysis(JSON.parse(analysisRes.data.analysisJson));
        } catch (e) {
          console.error('Failed to load existing ATS analysis details', e);
        }
      }
    } catch (err) {
      console.error('Error fetching profile data', err);
      setMessage({ type: 'danger', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await API.put('/profile/student', {
        bio,
        educationDetails: education,
        targetJobTitle: targetJob,
        linkedin,
        github
      });
      setMessage({ type: 'success', text: 'Profile details updated successfully!' });
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        bio,
        educationDetails: education,
        targetJobTitle: targetJob,
        linkedin,
        github
      }));
    } catch (err) {
      console.error('Error updating profile', err);
      setMessage({ type: 'danger', text: 'Failed to update profile details.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    setMessage({ type: '', text: '' });
    try {
      await API.post('/skills/add', {
        skillId: parseInt(selectedSkillId),
        proficiencyLevel: proficiency
      });
      
      // Refresh profile to show updated skills
      const profileRes = await API.get('/profile/student');
      setProfile(profileRes.data);
      setSelectedSkillId('');
      setMessage({ type: 'success', text: 'Skill added successfully!' });
    } catch (err) {
      console.error('Error adding skill', err);
      setMessage({ type: 'danger', text: 'Failed to add skill.' });
    }
  };

  const handleRemoveSkill = async (skillId) => {
    setMessage({ type: '', text: '' });
    try {
      await API.delete(`/skills/remove/${skillId}`);
      
      // Update local state directly for speedy feedback
      setProfile(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s.skillId !== skillId)
      }));
      setMessage({ type: 'success', text: 'Skill removed successfully.' });
    } catch (err) {
      console.error('Error removing skill', err);
      setMessage({ type: 'danger', text: 'Failed to remove skill.' });
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingResume(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local profile state with new resume name
      setProfile(prev => ({
        ...prev,
        resumeFileName: res.data.fileName
      }));
      setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
    } catch (err) {
      console.error('Resume upload error', err);
      const msg = err.response?.data?.message || 'Failed to upload resume.';
      setMessage({ type: 'danger', text: msg });
    } finally {
      setUploadingResume(false);
      setResumeFile(null);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your resume?')) return;

    setMessage({ type: '', text: '' });
    try {
      await API.delete('/resume');
      setProfile(prev => ({
        ...prev,
        resumeFileName: null,
        resumeAtsScore: null
      }));
      setMessage({ type: 'success', text: 'Resume deleted successfully.' });
    } catch (err) {
      console.error('Error deleting resume', err);
      setMessage({ type: 'danger', text: 'Failed to delete resume.' });
    }
  };

  const handleDownloadResume = async () => {
    try {
      const response = await API.get('/resume/download', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      
      // Get file name from profile or content-disposition
      const fileName = profile.resumeFileName || 'resume.pdf';
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error('Error downloading resume', err);
      setMessage({ type: 'danger', text: 'Failed to download resume.' });
    }
  };

  const handleAnalyzeResume = async () => {
    setAnalyzingResume(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await API.post('/ai/analyze-resume');
      const parsedAnalysis = JSON.parse(res.data.analysis);
      setAtsAnalysis(parsedAnalysis);
      setProfile(prev => ({
        ...prev,
        resumeAtsScore: res.data.atsScore
      }));
      setShowAnalysis(true);
      setMessage({ type: 'success', text: 'AI ATS resume analysis complete!' });
    } catch (err) {
      console.error('Resume analysis error', err);
      setMessage({ type: 'danger', text: 'Failed to run AI resume analysis. Ensure the backend has a valid Gemini key or supports mock fallbacks.' });
    } finally {
      setAnalyzingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Profile...</span>
        </div>
        <p className="text-secondary mt-3">Loading your SkillSathi profile...</p>
      </div>
    );
  }

  // Filter out skills the student already has
  const existingSkillIds = new Set(profile.skills.map(s => s.skillId));
  const availableSkills = masterSkills.filter(s => !existingSkillIds.has(s.id));

  return (
    <div className="container py-4 text-start animate-fade-in">
      <div className="row g-4">
        
        {/* Left Side: General Profile Form */}
        <div className="col-lg-7">
          <div className="glass-card glow-effect h-100">
            <h2 className="text-gradient-primary mb-4" style={{ fontSize: '1.8rem' }}>Career Profile Details</h2>
            
            {message.text && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} border-0 text-white py-2 px-3 mb-4`}
                   style={{ background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="glass-label" htmlFor="fullName">Full Name (Account)</label>
                  <input type="text" id="fullName" className="glass-input" value={profile.fullName} disabled style={{ opacity: 0.6 }} />
                </div>

                <div className="col-12">
                  <label className="glass-label" htmlFor="targetJob">Target Job / Role Title</label>
                  <input
                    type="text"
                    id="targetJob"
                    className="glass-input"
                    placeholder="e.g. Full Stack Developer, Data Scientist"
                    value={targetJob}
                    onChange={(e) => setTargetJob(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="glass-label" htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    className="glass-input"
                    rows="4"
                    placeholder="Briefly describe your career goals, passion, and expertise..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  ></textarea>
                </div>

                <div className="col-12">
                  <label className="glass-label" htmlFor="education">Education History</label>
                  <textarea
                    id="education"
                    className="glass-input"
                    rows="3"
                    placeholder="Degree, College/University name, Graduation year, etc..."
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                  ></textarea>
                </div>

                <div className="col-sm-6">
                  <label className="glass-label" htmlFor="linkedin">LinkedIn URL</label>
                  <input
                    type="url"
                    id="linkedin"
                    className="glass-input"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>

                <div className="col-sm-6">
                  <label className="glass-label" htmlFor="github">GitHub Profile URL</label>
                  <input
                    type="url"
                    id="github"
                    className="glass-input"
                    placeholder="https://github.com/username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button type="submit" className="btn-premium px-4 py-2" disabled={submitting}>
                  {submitting ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Skills & Resume */}
        <div className="col-lg-5">
          <div className="d-flex flex-column gap-4">
            
            {/* Resume Card */}
            <div className="glass-card">
              <h3 className="h4 mb-3 pb-2 border-bottom border-secondary border-opacity-10 text-gradient-secondary">Resume Vault</h3>
              
              {profile.resumeFileName ? (
                <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span className="text-white text-truncate" style={{ maxWidth: '180px', fontWeight: '500' }}>
                        {profile.resumeFileName}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button onClick={handleDownloadResume} className="btn btn-sm btn-outline-light border-0 p-1" title="Download">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button>
                      <button onClick={handleDeleteResume} className="btn btn-sm btn-outline-danger border-0 p-1" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* ATS Score Indicator & AI Insights */}
                  <div className="mt-3">
                    {profile.resumeAtsScore !== null && profile.resumeAtsScore !== undefined ? (
                      <div className="d-flex flex-column gap-2">
                        {/* Circular styled score indicator */}
                        <div className="p-3 rounded-3 text-center mb-2" 
                             style={{ 
                               background: 'rgba(154, 85, 241, 0.03)', 
                               border: '1px solid var(--border-glow)',
                               borderRadius: '12px'
                             }}>
                          <span className="text-secondary d-block" style={{ fontSize: '0.85rem' }}>AI ATS Readiness Score</span>
                          
                          <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                            <span className="display-6 fw-bold text-gradient-primary">
                              {profile.resumeAtsScore}
                            </span>
                            <span className="text-secondary" style={{ fontSize: '1.2rem' }}>/ 100</span>
                          </div>

                          {/* Score Label */}
                          <span className="badge" style={{
                            background: profile.resumeAtsScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : profile.resumeAtsScore >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: profile.resumeAtsScore >= 80 ? 'var(--success)' : profile.resumeAtsScore >= 60 ? 'var(--warning)' : 'var(--danger)',
                            border: profile.resumeAtsScore >= 80 ? '1px solid rgba(16, 185, 129, 0.3)' : profile.resumeAtsScore >= 60 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          }}>
                            {profile.resumeAtsScore >= 80 ? 'Excellent Match' : profile.resumeAtsScore >= 60 ? 'Average Match' : 'Critical Gaps Found'}
                          </span>
                        </div>

                        {/* Analysis Insight Toggle */}
                        {atsAnalysis && (
                          <div className="d-grid gap-2">
                            <button 
                              type="button" 
                              onClick={() => setShowAnalysis(!showAnalysis)} 
                              className="btn-premium-secondary w-100 py-2"
                              style={{ fontSize: '0.85rem' }}
                            >
                              {showAnalysis ? 'Hide AI Career Insights' : 'View AI Career Insights'}
                            </button>
                          </div>
                        )}

                        <div className="d-grid gap-2 mt-1">
                          <button 
                            type="button" 
                            onClick={handleAnalyzeResume} 
                            className="btn btn-sm btn-link text-secondary text-decoration-none"
                            style={{ fontSize: '0.8rem' }}
                            disabled={analyzingResume}
                          >
                            {analyzingResume ? 'Re-analyzing...' : '🔄 Run Re-analysis'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                        <span className="text-secondary d-block mb-2" style={{ fontSize: '0.85rem' }}>No ATS analysis found for this resume.</span>
                        <button 
                          type="button" 
                          onClick={handleAnalyzeResume} 
                          className="btn-premium w-100 py-2"
                          style={{ fontSize: '0.9rem' }}
                          disabled={analyzingResume}
                        >
                          {analyzingResume ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              AI Analyzing...
                            </>
                          ) : (
                            '✨ Run AI ATS Scan'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed rounded-3 mb-3" 
                     style={{ borderStyle: 'dashed', borderColor: 'var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                  
                  <svg className="mb-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  
                  <p className="text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
                    Upload your resume to get instant ATS scores and skill recommendations.
                  </p>

                  <label className="btn-premium-secondary py-2 px-3 cursor-pointer" style={{ cursor: 'pointer' }}>
                    Browse File
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="d-none"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                    />
                  </label>
                  
                  {uploadingResume && (
                    <div className="mt-3 text-center">
                      <span className="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                      <span style={{ fontSize: '0.85rem' }} className="text-secondary">Uploading...</span>
                    </div>
                  )}
                </div>
              )}
              <span className="text-muted d-block mb-2" style={{ fontSize: '0.75rem' }}>* Supported formats: PDF, DOC, DOCX up to 5MB</span>

              {/* Expanded AI Insights Details */}
              {showAnalysis && atsAnalysis && (
                <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 animate-fade-in" style={{ fontSize: '0.9rem' }}>
                  
                  {/* Feedback Paragraph */}
                  <div className="mb-3">
                    <h4 className="h6 text-white mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Feedback</h4>
                    <p className="text-secondary m-0" style={{ lineHeight: '1.5' }}>
                      {atsAnalysis.feedback}
                    </p>
                  </div>

                  {/* Skills Comparison */}
                  <div className="mb-3">
                    <h4 className="h6 text-white mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected vs. Missing Skills</h4>
                    <div className="mb-2">
                      <span className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Detected on Resume:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {atsAnalysis.detectedSkills && atsAnalysis.detectedSkills.map((s, idx) => (
                          <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 py-1 px-2" style={{ fontSize: '0.75rem' }}>
                            {s}
                          </span>
                        ))}
                        {(!atsAnalysis.detectedSkills || atsAnalysis.detectedSkills.length === 0) && (
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>None detected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>AI Suggested Gaps:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {atsAnalysis.missingSkills && atsAnalysis.missingSkills.map((s, idx) => (
                          <span key={idx} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 py-1 px-2" style={{ fontSize: '0.75rem' }}>
                            {s}
                          </span>
                        ))}
                        {(!atsAnalysis.missingSkills || atsAnalysis.missingSkills.length === 0) && (
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>None suggested</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actionable Tips */}
                  <div>
                    <h4 className="h6 text-white mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actionable Improvements</h4>
                    <ul className="text-secondary ps-3 mb-0" style={{ lineHeight: '1.5', fontSize: '0.85rem' }}>
                      {atsAnalysis.improvementTips && atsAnalysis.improvementTips.map((tip, idx) => (
                        <li key={idx} className="mb-1">{tip}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>

            {/* Skills Card */}
            <div className="glass-card">
              <h3 className="h4 mb-3 pb-2 border-bottom border-secondary border-opacity-10 text-gradient-secondary">Skills & Expertise</h3>
              
              {/* Add Skill Form */}
              <form onSubmit={handleAddSkill} className="mb-4">
                <div className="row g-2">
                  <div className="col-7">
                    <select
                      className="glass-input py-2"
                      value={selectedSkillId}
                      onChange={(e) => setSelectedSkillId(e.target.value)}
                      required
                    >
                      <option value="">-- Add Skill --</option>
                      {availableSkills.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-5">
                    <select
                      className="glass-input py-2"
                      value={proficiency}
                      onChange={(e) => setProficiency(e.target.value)}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  
                  <div className="col-12 mt-2">
                    <button type="submit" className="btn-premium w-100 py-2" disabled={!selectedSkillId}>
                      Add to Profile
                    </button>
                  </div>
                </div>
              </form>

              {/* Added Skills List */}
              <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map(s => {
                    // Set color based on proficiency level
                    let badgeBg = 'rgba(255, 255, 255, 0.05)';
                    let badgeBorder = '1px solid var(--border-light)';
                    let glowColor = 'inherit';
                    
                    if (s.proficiencyLevel === 'Expert') {
                      badgeBg = 'rgba(154, 85, 241, 0.15)';
                      badgeBorder = '1px solid var(--border-glow)';
                      glowColor = 'var(--primary)';
                    } else if (s.proficiencyLevel === 'Intermediate') {
                      badgeBg = 'rgba(17, 212, 180, 0.15)';
                      badgeBorder = '1px solid rgba(17, 212, 180, 0.3)';
                      glowColor = 'var(--secondary)';
                    }

                    return (
                      <span 
                        key={s.skillId} 
                        className="badge d-inline-flex align-items-center gap-2 py-2 px-3"
                        style={{ 
                          background: badgeBg, 
                          border: badgeBorder, 
                          color: '#ffffff',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}
                      >
                        {s.skillName} 
                        <span style={{ fontSize: '0.7rem', opacity: 0.8, color: glowColor }}>
                          • {s.proficiencyLevel}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSkill(s.skillId)}
                          className="btn-close btn-close-white p-0" 
                          style={{ fontSize: '0.65rem', marginLeft: '4px' }}
                          aria-label="Remove"
                        ></button>
                      </span>
                    );
                  })
                ) : (
                  <p className="text-secondary m-0 text-center w-100 py-3" style={{ fontSize: '0.9rem' }}>
                    No skills added yet. Choose from the dropdown to add skills.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default StudentProfileView;
