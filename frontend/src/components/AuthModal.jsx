import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { api, setStoredToken, setStoredUser } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  
  const hasMinLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        setStoredToken(res.access_token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'register') {
        if (!isPasswordValid) {
          throw new Error('Password must satisfy all complexity requirements');
        }
        await api.register({
          email,
          password,
          full_name: fullName,
          company_name: companyName,
          role: 'customer'
        });
        // Auto-login after registration
        const loginRes = await api.login(email, password);
        setStoredToken(loginRes.access_token);
        setStoredUser(loginRes.user);
        onAuthSuccess(loginRes.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setMessage(res.message);
        if (res.debug_reset_token) {
          setResetToken(res.debug_reset_token);
          setMode('reset');
        }
      } else if (mode === 'reset') {
        const res = await api.resetPassword(resetToken, newPassword);
        setMessage(res.message);
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Authentication operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 className="card-title">
            <Lock size={18} color="var(--primary)" />
            {mode === 'login' && 'Sign In to Brightloop'}
            {mode === 'register' && 'Create Customer Account'}
            {mode === 'forgot' && 'Reset Your Password'}
            {mode === 'reset' && 'Set New Password'}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Eleanor Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company Name (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Vance Cloud Enterprises"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Password complexity checklist for registration */}
              {mode === 'register' && (
                <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Password Requirements:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    <span style={{ color: hasMinLength ? '#10b981' : '#64748b' }}>
                      {hasMinLength ? '✓' : '○'} &gt; 8 characters
                    </span>
                    <span style={{ color: hasUpper ? '#10b981' : '#64748b' }}>
                      {hasUpper ? '✓' : '○'} 1 uppercase
                    </span>
                    <span style={{ color: hasLower ? '#10b981' : '#64748b' }}>
                      {hasLower ? '✓' : '○'} 1 lowercase
                    </span>
                    <span style={{ color: hasSpecial ? '#10b981' : '#64748b' }}>
                      {hasSpecial ? '✓' : '○'} 1 special character
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="form-group">
                <label className="form-label">Reset Token</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Paste token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="New strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || (mode === 'register' && !isPasswordValid)}
            style={{ width: '100%', marginTop: '0.5rem', opacity: (mode === 'register' && !isPasswordValid) ? 0.6 : 1 }}
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Register Account' :
              mode === 'forgot' ? 'Send Reset Link' : 'Set New Password'
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {mode === 'login' && (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
              >
                Register
              </button>
            </span>
          )}
          {mode === 'register' && (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
