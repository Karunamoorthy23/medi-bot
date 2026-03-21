import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserMd, FaLock } from 'react-icons/fa';
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
            const data = await apiPost('/api/doctor/login', { doctor_name: doctorName, password });
            if (data?.doctor?.name) {
                localStorage.setItem('doctorName', data.doctor.name);
            }
            navigate('/doctor-dashboard');
        } catch (err) {
            setError(err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split">
            {/* Left side: Generated Medical Image */}
            <div className="auth-split-image" style={{ backgroundImage: 'url(/medical_login_bg.png)', flex: '1.2' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(67, 206, 162, 0.4), rgba(24, 90, 157, 0.85))' }}></div>
                <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white' }}>
                    <h2 style={{ fontSize: '50px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-1.5px', lineHeight: '1.1' }}>
                        Empowering providers<br />with better tools.
                    </h2>
                    <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6' }}>
                        Access the Medi@ portal to efficiently manage your schedule, review patient records, and deliver exceptional care.
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
                                background: 'linear-gradient(135deg, #43cea2, #185a9d)',
                                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px rgba(67, 206, 162, 0.3)'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1px', fontFamily: 'Inter, sans-serif' }}>
                                medi<span style={{ color: '#43cea2' }}>pro</span>
                            </span>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', margin: '0' }}>Doctor Portal</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '16px' }}>Secure login for medical professionals.</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Select Doctor</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                                    <FaUserMd />
                                </div>
                                <select
                                    required
                                    className="form-control"
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    style={{ paddingLeft: '44px', height: '52px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f9fafb', fontSize: '15px', appearance: 'none', width: '100%' }}
                                >
                                    <option value="">Choose your profile...</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.name}>
                                            {d.name} ({d.specialization}) {d.email ? ` - ${d.email}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
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
                                    style={{ paddingLeft: '44px', height: '52px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f9fafb', fontSize: '15px', width: '100%' }}
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
                            className="btn"
                            style={{
                                width: '100%', height: '52px', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
                                marginTop: '8px', background: 'linear-gradient(135deg, #43cea2, #185a9d)',
                                boxShadow: '0 8px 20px rgba(67, 206, 162, 0.3)', transition: 'all 0.3s ease', border: 'none', color: 'white', cursor: 'pointer'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Accessing...' : 'Access Portal'}
                        </button>
                    </form>

                    <div className="text-center" style={{ marginTop: '40px' }}>
                        <div style={{ height: '1px', background: '#e2e8f0', margin: '24px 0', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'transparent', padding: '0 16px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>OR</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link to="/login" style={{
                                color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500',
                                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
                                borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc', transition: 'all 0.2s', width: '100%', justifyContent: 'center', boxSizing: 'border-box'
                            }}>
                                Sign in as a Patient
                            </Link>
                            <Link to="/doctor-register" style={{
                                color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500',
                                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
                                borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc', transition: 'all 0.2s', width: '100%', justifyContent: 'center', boxSizing: 'border-box'
                            }}>
                                Don't have an account? <strong style={{ color: '#43cea2' }}>Create account</strong>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorLoginPage;
