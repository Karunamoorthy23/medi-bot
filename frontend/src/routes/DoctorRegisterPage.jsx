import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserMd, FaEnvelope, FaLock, FaStethoscope, FaClock } from 'react-icons/fa';
import { apiPost } from '../api/client';

const SPECIALIZATIONS = [
    'General Physician',
    'Cardiologist',
    'Dermatologist',
    'Endocrinologist',
    'Gastroenterologist',
    'Neurologist',
    'Ophthalmologist',
    'Orthopedic Doctor',
    'Pediatrician',
    'Psychiatrist',
    'Pulmonologist',
    'Radiologist',
    'Rheumatologist',
    'Surgeon',
    'Urologist',
];

function DoctorRegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        specialization: '',
        password: '',
        confirmPassword: '',
        consultation_duration: 30,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await apiPost('/api/doctor/register', {
                name: form.name,
                email: form.email,
                specialization: form.specialization,
                password: form.password,
                consultation_duration: Number(form.consultation_duration),
            });
            setSuccess(true);
            setTimeout(() => navigate('/doctor-login'), 1800);
        } catch (err) {
            setError(err?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        paddingLeft: '44px',
        height: '52px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        backgroundColor: '#f9fafb',
        fontSize: '15px',
        width: '100%',
        boxSizing: 'border-box',
    };
    const iconStyle = {
        position: 'absolute', top: '50%', left: '16px',
        transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
    };

    return (
        <div className="auth-split">
            {/* Left panel */}
            <div className="auth-split-image" style={{ backgroundImage: 'url(/medical_login_bg.png)', flex: '1.2' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(67,206,162,0.4), rgba(24,90,157,0.85))' }} />
                <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white' }}>
                    <h2 style={{ fontSize: '46px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-1.5px', lineHeight: '1.1' }}>
                        Join the Medi@<br />Doctor Network.
                    </h2>
                    <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6' }}>
                        Register your profile to manage appointments, consult with patients and leverage AI-powered tools for better healthcare delivery.
                    </p>

                    <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { icon: '🗓️', text: 'Smart appointment scheduling' },
                            { icon: '🤖', text: 'AI-assisted patient consultation' },
                            { icon: '📋', text: 'Real-time patient record access' },
                        ].map(item => (
                            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                                <span style={{ fontSize: '15px', opacity: 0.9 }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel: form */}
            <div className="auth-split-form" style={{ overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '420px', padding: '20px 0' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'linear-gradient(135deg, #43cea2, #185a9d)',
                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(67,206,162,0.3)'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                            medi<span style={{ color: '#43cea2' }}>pro</span>
                        </span>
                    </div>

                    <h1 style={{ fontSize: '30px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px' }}>Create Doctor Account</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 32px', fontSize: '15px' }}>All fields are required unless noted.</p>

                    {success ? (
                        <div style={{
                            padding: '20px', borderRadius: '12px',
                            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                            color: '#166534', textAlign: 'center', fontSize: '15px'
                        }}>
                            ✅ <strong>Account created!</strong> Redirecting to login...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Full Name */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={iconStyle}><FaUserMd /></div>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="form-control"
                                        placeholder="Dr. John Smith"
                                        value={form.name}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={iconStyle}><FaEnvelope /></div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="form-control"
                                        placeholder="dr.smith@hospital.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Specialization */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Specialization <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={iconStyle}><FaStethoscope /></div>
                                    <select
                                        name="specialization"
                                        required
                                        className="form-control"
                                        value={form.specialization}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, appearance: 'none' }}
                                    >
                                        <option value="">Select specialization</option>
                                        {SPECIALIZATIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Consultation Duration */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Consultation Duration (minutes) <span style={{ color: '#94a3b8', fontWeight: 400 }}>— optional</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={iconStyle}><FaClock /></div>
                                    <select
                                        name="consultation_duration"
                                        className="form-control"
                                        value={form.consultation_duration}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, appearance: 'none' }}
                                    >
                                        {[15, 20, 30, 45, 60].map(m => (
                                            <option key={m} value={m}>{m} minutes</option>
                                        ))}
                                    </select>
                                    <div style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Password <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={iconStyle}><FaLock /></div>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="form-control"
                                        placeholder="Min. 6 characters"
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={iconStyle}><FaLock /></div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        className="form-control"
                                        placeholder="Re-enter your password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '10px', fontSize: '14px', border: '1px solid #fecaca' }}>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn"
                                disabled={loading}
                                style={{
                                    width: '100%', height: '52px', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
                                    background: 'linear-gradient(135deg, #43cea2, #185a9d)',
                                    boxShadow: '0 8px 20px rgba(67,206,162,0.3)', border: 'none', color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {loading ? 'Creating Account...' : 'Create Doctor Account'}
                            </button>
                        </form>
                    )}

                    {/* Footer links */}
                    <div style={{ marginTop: '32px' }}>
                        <div style={{ height: '1px', background: '#e2e8f0', margin: '0 0 24px', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '0 16px', color: 'var(--text-muted)', fontSize: '13px' }}>OR</span>
                        </div>
                        <Link
                            to="/doctor-login"
                            style={{
                                color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '500',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px 24px', borderRadius: '12px',
                                border: '1px solid var(--border-color)', backgroundColor: '#f8fafc',
                                transition: 'all 0.2s', width: '100%', boxSizing: 'border-box',
                            }}
                        >
                            Already have an account? <strong>Sign in</strong>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorRegisterPage;
