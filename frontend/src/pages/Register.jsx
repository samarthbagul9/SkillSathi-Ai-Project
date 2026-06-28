import { useState } from 'react';
import API from '../services/api';

function Register({ onNavigateToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Student'); // "Student" or "Recruiter"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !userType) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await API.post('/auth/register', {
        fullName,
        email,
        password,
        userType
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        onNavigateToLogin();
      }, 2000);
    } catch (err) {
      console.error('Registration error', err);
      const msg = err.response?.data?.message || 'Registration failed. Please check your inputs.';
      const subErrors = err.response?.data?.errors;
      if (subErrors && Array.isArray(subErrors)) {
        setError(`${msg} ${subErrors.join(' ')}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '90vh', padding: '40px 0' }}>
      <div className="glass-card animate-fade-in w-100" style={{ maxWidth: '500px', padding: '40px' }}>
        
        <div className="glow-effect"></div>

        <div className="text-center mb-4">
          <h2 className="text-gradient-primary" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Join SkillSathi</h2>
          <p className="text-muted">Create an account to start your journey</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 text-white py-2 px-3 mb-3" 
               style={{ background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success border-0 text-white py-2 px-3 mb-3" 
               style={{ background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="glass-label" htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              className="glass-input"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 text-start">
            <label className="glass-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="glass-input"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 text-start">
            <label className="glass-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="glass-input"
              placeholder="•••••••• (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Styled Premium Selector for User Type */}
          <div className="mb-4 text-start">
            <label className="glass-label mb-2">I want to join as a:</label>
            <div className="row g-2">
              <div className="col-6">
                <div 
                  className={`glass-card hoverable text-center p-3 cursor-pointer ${userType === 'Student' ? 'active-type' : ''}`}
                  onClick={() => setUserType('Student')}
                  style={{
                    border: userType === 'Student' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: userType === 'Student' ? 'rgba(154, 85, 241, 0.12)' : 'var(--bg-card)',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <h4 style={{ fontSize: '1.1rem', color: userType === 'Student' ? '#ffffff' : 'var(--text-secondary)' }}>Student</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Build career readiness</span>
                </div>
              </div>
              <div className="col-6">
                <div 
                  className={`glass-card hoverable text-center p-3 cursor-pointer ${userType === 'Recruiter' ? 'active-type' : ''}`}
                  onClick={() => setUserType('Recruiter')}
                  style={{
                    border: userType === 'Recruiter' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: userType === 'Recruiter' ? 'rgba(154, 85, 241, 0.12)' : 'var(--bg-card)',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <h4 style={{ fontSize: '1.1rem', color: userType === 'Recruiter' ? '#ffffff' : 'var(--text-secondary)' }}>Recruiter</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Find perfect candidates</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-premium w-100 py-3 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating account...
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <button 
              onClick={onNavigateToLogin} 
              className="btn btn-link p-0 border-0 text-decoration-none" 
              style={{ color: 'var(--primary)', fontWeight: '600', background: 'none' }}
            >
              Sign In
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;
