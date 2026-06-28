import { useState } from 'react';
import API from '../services/api';

function Login({ onLoginSuccess, onNavigateToRegister, onNavigateToForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      const data = response.data;
      
      // Save credentials locally
      localStorage.setItem('skillsathi_token', data.token);
      localStorage.setItem('skillsathi_user', JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        userType: data.userType,
        expiration: data.expiration
      }));

      onLoginSuccess(data);
    } catch (err) {
      console.error('Login error', err);
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in pulse-glow w-100" style={{ maxWidth: '450px', padding: '40px' }}>
        
        {/* Decorative background glow */}
        <div className="glow-effect"></div>

        <div className="text-center mb-4">
          <h2 className="text-gradient-primary" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Welcome Back</h2>
          <p className="text-muted">Empower your career with SkillSathi AI</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 text-white py-2 px-3 mb-3" 
               style={{ background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="glass-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="glass-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4 text-start">
            <div className="d-flex justify-content-between align-items-center">
              <label className="glass-label mb-0" htmlFor="password">Password</label>
              <button 
                type="button"
                onClick={onNavigateToForgotPassword}
                className="btn btn-link p-0 border-0 text-decoration-none"
                style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500', background: 'none' }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              id="password"
              className="glass-input mt-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-premium w-100 py-3 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
            New to SkillSathi?{' '}
            <button 
              onClick={onNavigateToRegister} 
              className="btn btn-link p-0 border-0 text-decoration-none" 
              style={{ color: 'var(--primary)', fontWeight: '600', background: 'none' }}
            >
              Create an account
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;
