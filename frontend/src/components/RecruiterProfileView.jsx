import { useState, useEffect } from 'react';
import API from '../services/api';

function RecruiterProfileView() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyBio, setCompanyBio] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/profile/recruiter');
      const p = res.data;
      setProfile(p);
      setCompanyName(p.companyName || '');
      setCompanyWebsite(p.companyWebsite || '');
      setCompanyBio(p.companyBio || '');
    } catch (err) {
      console.error('Error fetching recruiter profile', err);
      setMessage({ type: 'danger', text: 'Failed to load company profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!companyName) {
      setMessage({ type: 'danger', text: 'Company Name is required.' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await API.put('/profile/recruiter', {
        companyName,
        companyWebsite,
        companyBio
      });
      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
      setProfile(prev => ({
        ...prev,
        companyName,
        companyWebsite,
        companyBio
      }));
    } catch (err) {
      console.error('Error updating recruiter profile', err);
      setMessage({ type: 'danger', text: 'Failed to update company profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Profile...</span>
        </div>
        <p className="text-secondary mt-3">Loading your company profile...</p>
      </div>
    );
  }

  return (
    <div className="container py-4 text-start animate-fade-in d-flex justify-content-center">
      <div className="glass-card glow-effect w-100" style={{ maxWidth: '700px', padding: '40px' }}>
        <h2 className="text-gradient-secondary mb-4" style={{ fontSize: '1.8rem' }}>Company Profile</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} border-0 text-white py-2 px-3 mb-4`}
               style={{ background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="row g-3">
            <div className="col-12">
              <label className="glass-label" htmlFor="recruiterName">Recruiter Name (Account)</label>
              <input type="text" id="recruiterName" className="glass-input" value={profile.fullName} disabled style={{ opacity: 0.6 }} />
            </div>

            <div className="col-12">
              <label className="glass-label" htmlFor="email">Email Address</label>
              <input type="text" id="email" className="glass-input" value={profile.email} disabled style={{ opacity: 0.6 }} />
            </div>

            <div className="col-12">
              <label className="glass-label" htmlFor="companyName">Company / Organization Name</label>
              <input
                type="text"
                id="companyName"
                className="glass-input"
                placeholder="e.g. Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="glass-label" htmlFor="companyWebsite">Company Website URL</label>
              <input
                type="url"
                id="companyWebsite"
                className="glass-input"
                placeholder="https://example.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="glass-label" htmlFor="companyBio">Company Description / Overview</label>
              <textarea
                id="companyBio"
                className="glass-input"
                rows="5"
                placeholder="Describe your company, industries you hire for, work culture, and key benefits..."
                value={companyBio}
                onChange={(e) => setCompanyBio(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" className="btn-premium px-4 py-2" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #119f88 100%)', boxShadow: '0 4px 15px rgba(17, 212, 180, 0.3)' }} disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Company Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecruiterProfileView;
