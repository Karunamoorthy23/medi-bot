import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Widget/Card';
import { apiPost } from '../api/client';

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
      await apiPost('/api/login', { identifier, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface-hover) 100%)' }}>
      <Card className="auth-card" style={{ borderTop: '4px solid var(--primary-color)'}}>
        <div className="auth-header">
          <div style={{ width: '48px', height: '48px', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 16px' }}>M</div>
          <h1>Welcome Back</h1>
          <p>Login to access your patient portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="john_doe or patient@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="text-muted" style={{ color: 'crimson', marginTop: '8px' }}>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            Login securely
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '24px', fontSize: '0.9rem' }}>
          <p className="text-muted" style={{ marginBottom: '8px' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Create account</Link>
          </p>
          <Link to="/doctor-login" style={{ color: 'var(--text-secondary)' }}>Are you a doctor? Sign in here</Link>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
