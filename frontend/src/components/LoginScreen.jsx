import React, { useState } from 'react';
import { Droplet, Mail, Lock, User, ChevronLeft } from 'lucide-react';
import '../styles/Auth.css';
import { apiCall } from '../api';
import MouseGlow from './MouseGlow';

function LoginScreen({ onLogin, resetToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(!!resetToken);
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo123');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, name };

      const response = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        return;
      }

      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiCall('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setSuccess(data.message);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await apiCall('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to reset password');
        return;
      }
      setSuccess('Password updated! You can now log in.');
      setIsReset(false);
      setIsForgot(false);
      setIsLogin(true);
      // Clear token from URL
      window.history.replaceState({}, '', '/');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <MouseGlow />
      <div className="auth-background">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>

      <div className="auth-content">
        <div className="auth-header">
          <Droplet className="auth-logo" />
          <h1>Synced</h1>
          <p>Track cycles. Skip the drama.</p>
        </div>

        <div className="auth-card">

          {/* RESET PASSWORD (from email link) */}
          {isReset && (
            <>
              <div className="auth-reset-header">
                <h2>Set a new password</h2>
                <p>Choose something you'll actually remember this time.</p>
              </div>
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type="password"
                      placeholder="Same again"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

          {/* FORGOT PASSWORD */}
          {!isReset && isForgot && (
            <>
              <button className="auth-back-btn" onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}>
                <ChevronLeft size={16} /> Back to login
              </button>
              <div className="auth-reset-header">
                <h2>Forgot password?</h2>
                <p>Enter your email and we'll send a reset link.</p>
              </div>
              {success ? (
                <div className="success-message">{success}</div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-wrapper">
                      <Mail size={18} />
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {error && <div className="error-message">{error}</div>}
                  <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* LOGIN / SIGNUP */}
          {!isReset && !isForgot && (
            <>
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                >
                  Login
                </button>
                <button
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <button type="submit" className="auth-button" disabled={loading}>
                  {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
                </button>
              </form>

              {isLogin && (
                <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                  <button
                    className="auth-link"
                    onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <div className="auth-footer">
                <p>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    className="auth-link"
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  >
                    {isLogin ? 'Sign up' : 'Login'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="auth-features">
          <div className="feature">
            <span className="feature-icon">📱</span>
            <p>One account for the whole family</p>
          </div>
          <div className="feature">
            <span className="feature-icon">😂</span>
            <p>Actually funny copy</p>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <p>Real tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;