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
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.custom-select-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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
                            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Select Doctor Account</label>
                            <div style={{ position: 'relative' }} className="custom-select-container">
                                <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}>
                                    <FaUserMd />
                                </div>
                                <div
                                    onClick={() => !loading && setIsOpen(!isOpen)}
                                    style={{
                                        paddingLeft: '44px', paddingRight: '44px', height: '52px', borderRadius: '12px',
                                        border: '1px solid var(--border-color)', backgroundColor: '#f9fafb',
                                        fontSize: '15px', width: '100%', display: 'flex', alignItems: 'center',
                                        cursor: loading ? 'not-allowed' : 'pointer', boxSizing: 'border-box',
                                        color: doctorName ? 'var(--text-primary)' : 'var(--text-muted)'
                                    }}
                                >
                                    {doctorName ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>{doctorName}</span>
                                            {doctors.find(d => d.name === doctorName)?.specialization && (
                                                <span style={{ fontSize: '12px', opacity: 0.7 }}>{doctors.find(d => d.name === doctorName).specialization}</span>
                                            )}
                                        </div>
                                    ) : 'Choose your profile...'}
                                </div>
                                <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>

                                {isOpen && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                                        backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        border: '1px solid var(--border-color)', zIndex: 1000, overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                                                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            {doctors.filter(d =>
                                                d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).length > 0 ? (
                                                doctors.filter(d =>
                                                    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
                                                ).map((d) => (
                                                    <div
                                                        key={d.id}
                                                        onClick={() => {
                                                            setDoctorName(d.name);
                                                            setIsOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                        style={{
                                                            padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                                                            backgroundColor: doctorName === d.name ? '#f1f5f9' : 'transparent',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={(e) => { if (doctorName !== d.name) e.target.style.backgroundColor = 'transparent' }}
                                                    >
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{d.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                            <span>{d.specialization}</span>
                                                            {d.email && <span style={{ opacity: 0.7 }}>{d.email}</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                                    No doctors found matching "{searchTerm}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
