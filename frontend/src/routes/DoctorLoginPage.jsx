import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Widget/Card';
import { FaUserMd } from 'react-icons/fa';
import { apiGet, apiPost } from '../api/client';

function DoctorLoginPage() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [doctorName, setDoctorName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        apiGet('/api/public/doctors')
            .then((data) => {
                if (cancelled) return;
                setDoctors(data?.doctors ?? []);
            })
            .catch(() => {
                if (cancelled) return;
                setDoctors([]);
            });
        return () => { cancelled = true; };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiPost('/api/doctor/login', { doctor_name: doctorName, password });
            navigate('/doctor-dashboard');
        } catch (err) {
            setError(err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, #f0f4fb 0%, #e2e8f0 100%)'}}>
            <Card className="auth-card" style={{ borderTop: '4px solid #43cea2'}}>
                <div className="auth-header">
                    <div style={{ width: '48px', height: '48px', background: '#43cea2', color: 'white', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 16px' }}>
                        <FaUserMd />
                    </div>
                    <h1 style={{ color: '#43cea2' }}>MediBot Portal</h1>
                    <p>Secure login for medical professionals</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Doctor Name</label>
                        <select
                            required
                            className="form-control"
                            value={doctorName}
                            onChange={(e) => setDoctorName(e.target.value)}
                        >
                            <option value="">Select Doctor</option>
                            {doctors.map((d) => (
                                <option key={d.id} value={d.name}>
                                    {d.name} ({d.specialization})
                                </option>
                            ))}
                        </select>
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
                        className="btn"
                        style={{ background: '#43cea2', color: 'white', width: '100%', padding: '12px', marginTop: '8px', border: 'none' }}
                        disabled={loading}
                    >
                        Access Portal
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '24px', fontSize: '0.9rem' }}>
                    <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Are you a patient? Go back</Link>
                </div>
            </Card>
        </div>
    );
}

export default DoctorLoginPage;
