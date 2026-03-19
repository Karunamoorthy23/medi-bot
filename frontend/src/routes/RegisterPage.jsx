import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Widget/Card';
import { apiPost } from '../api/client';

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost('/api/register', { username, email, password });
      navigate('/login');
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface-hover) 100%)' }}>
      <Card className="auth-card">
        <div className="auth-header">
          <div style={{ width: '48px', height: '48px', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 16px' }}>M</div>
          <h1>Create Account</h1>
          <p>Join MediPro patient portal</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="new-password"
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
            Register Account
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '24px', fontSize: '0.9rem' }}>
          <p className="text-muted">
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Login here</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default RegisterPage;
