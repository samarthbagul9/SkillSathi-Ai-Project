import { useState } from 'react';
import API from '../services/api';

function ForgotPassword({ onNavigateToLogin }) {
  const [step, setStep] = useState(1); // 1: Request code, 2: Reset password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/auth/forgot-password', { email });
      setSuccess(`A verification reset code has been generated. Use code: ${res.data.code}`);
      setStep(2);
    } catch (err) {
      console.error('Forgot password error', err);
      const msg = err.response?.data?.message || 'Email address not found.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await API.post('/auth/reset-password', {
        email,
        code,
        newPassword
      });

      setSuccess('Password reset successfully. Redirecting to login page...');
      setTimeout(() => {
        onNavigateToLogin();
      }, 2500);
    } catch (err) {
      console.error('Reset password error', err);
      const msg = err.response?.data?.message || 'Reset failed. Make sure your verification code is correct.';
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
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in pulse-glow w-100" style={{ maxWidth: '450px', padding: '40px' }}>
        
        {/* Decorative background glow */}
        <div className="glow-effect"></div>

        <div className="text-center mb-4">
          <h2 className="text-gradient-primary" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Reset Password</h2>
          <p className="text-muted">Recover your SkillSathi account password</p>
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

        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <div className="mb-4 text-start">
              <label className="glass-label" htmlFor="forgotEmail">Email Address</label>
              <input
                type="email"
                id="forgotEmail"
                className="glass-input"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Sending code...
                </>
              ) : (
                'Generate Reset Code'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-3 text-start">
              <label className="glass-label" htmlFor="resetCode">Verification Code</label>
              <input
                type="text"
                id="resetCode"
                className="glass-input"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="mb-4 text-start">
              <label className="glass-label" htmlFor="resetPassword">New Password</label>
              <input
                type="password"
                id="resetPassword"
                className="glass-input"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                  Resetting password...
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-3">
          <button 
            onClick={onNavigateToLogin} 
            className="btn btn-link p-0 border-0 text-decoration-none" 
            style={{ color: 'var(--primary)', fontWeight: '600', background: 'none' }}
          >
            Back to Sign In
          </button>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;
