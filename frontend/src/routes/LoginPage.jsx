import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../api/client';
import { FaUser, FaLock } from 'react-icons/fa';

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('/api/login', { identifier, password });
      if (data?.user?.username) {
        localStorage.setItem('userName', data.user.username);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* Left side: Generated Medical Image */}
      <div className="auth-split-image" style={{ backgroundImage: 'url(/medical_login_bg.png)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(30, 64, 175, 0.85))' }}></div>
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white' }}>
          <h2 style={{ fontSize: '50px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-1.5px', lineHeight: '1.1' }}>
            Advancing healthcare<br />through technology.
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6' }}>
            Join our secure patient portal to seamlessly manage your appointments, access clinical records, and connect with your healthcare providers.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="auth-split-form">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="auth-header" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1px', fontFamily: 'Inter, sans-serif' }}>
                medi<span style={{ color: 'var(--primary-color)' }}>pro</span>
              </span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', margin: '0' }}>Patient Login</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '16px' }}>Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Username or Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <FaUser />
                </div>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Enter your username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  style={{ paddingLeft: '44px', height: '52px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f9fafb', fontSize: '15px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <FaLock />
                </div>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingLeft: '44px', height: '52px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f9fafb', fontSize: '15px' }}
                />
              </div>
            </div>

            {error ? (
              <div style={{ padding: '12px', backgroundColor: 'var(--danger-light)', color: 'var(--danger-color)', borderRadius: '8px', fontSize: '14px', border: '1px solid #fecaca' }}>
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%', height: '52px', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
                marginTop: '8px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)', transition: 'all 0.3s ease', border: 'none', color: 'white', cursor: 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center" style={{ marginTop: '40px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
              Don't have an account? <Link to="/register" style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Create account</Link>
            </p>
            <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'transparent', padding: '0 16px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>OR</span>
            </div>
            <Link to="/doctor-login" style={{
              color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500',
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc', transition: 'all 0.2s', width: '100%', justifyContent: 'center'
            }}>
              Sign in as a Doctor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
