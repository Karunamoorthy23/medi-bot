import { Link, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaStethoscope, FaUserCircle, FaSignOutAlt, FaBell, FaHeartbeat } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../api/client';

function Navbar() {
    const location = useLocation();
    const isDoctor = location.pathname.startsWith('/doctor-');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        let mounted = true;

        // First try local storage for immediate display
        if (isDoctor) {
            const storedDoctor = localStorage.getItem('doctorName');
            if (storedDoctor) setUserName(`Dr. ${storedDoctor}`);
        } else {
            const storedUser = localStorage.getItem('userName');
            if (storedUser) setUserName(storedUser);
        }

        // Then try API sync
        apiGet('/api/session')
            .then(data => {
                if (!mounted) return;
                if (isDoctor && data?.doctor) {
                    setUserName(`Dr. ${data.doctor.name}`);
                    localStorage.setItem('doctorName', data.doctor.name);
                } else if (!isDoctor && data?.user) {
                    setUserName(data.user.username);
                    localStorage.setItem('userName', data.user.username);
                }
            })
            .catch(err => console.error('Failed to fetch session', err));

        return () => { mounted = false; };
    }, [isDoctor]);

    const handleLogout = () => {
        if (isDoctor) {
            localStorage.removeItem('doctorName');
            apiPost('/api/doctor/logout').catch(console.error);
        } else {
            localStorage.removeItem('userName');
            apiPost('/api/logout').catch(console.error);
        }
    };

    const defaultName = isDoctor ? 'Doctor' : 'User';
    const displayName = userName || defaultName;

    return (
        <header style={{
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border-color)',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                    width: '42px', height: '42px',
                    background: isDoctor
                        ? 'linear-gradient(135deg, #43cea2, #185a9d)'
                        : 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                    color: 'white',
                    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isDoctor ? '0 8px 16px rgba(67, 206, 162, 0.3)' : '0 8px 16px rgba(59, 130, 246, 0.3)'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{
                        fontSize: '24px',
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontWeight: 800,
                        letterSpacing: '-1px',
                        lineHeight: 1.1,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        medi<span style={{ color: isDoctor ? '#43cea2' : 'var(--primary-color)' }}>pro</span>
                    </h2>
                    <span style={{
                        fontSize: '0.7rem',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        marginTop: '2px'
                    }}>
                        {isDoctor ? 'Doctor Portal' : 'Patient Portal'}
                    </span>
                </div>
            </div>

            <nav style={{ display: 'flex', gap: '8px' }}>
                {isDoctor ? (
                    <>
                        <Link to="/doctor-dashboard" className="btn btn-outline" style={{ border: 'none' }}>Portal</Link>
                    </>
                ) : (
                    <>
                        <Link to="/dashboard" className="btn btn-outline" style={{ border: 'none' }}>Dashboard</Link>
                        <Link to="/doctors" className="btn btn-outline" style={{ border: 'none' }}>Doctors</Link>
                        <Link to="/chatbot" className="btn btn-outline" style={{ border: 'none' }}>Chatbot</Link>
                        <Link to="/appointment" className="btn btn-outline" style={{ border: 'none' }}>Appointments</Link>
                    </>
                )}
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="btn btn-outline" style={{ padding: '8px', border: 'none', borderRadius: '50%' }}>
                    <FaBell size={18} color="var(--text-secondary)" />
                </button>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '4px 12px',
                    backgroundColor: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem', fontWeight: 500
                }}>
                    <FaUserCircle size={16} color="var(--text-secondary)" />
                    {displayName}
                </div>
                <Link to={isDoctor ? "/doctor-login" : "/login"}
                    onClick={handleLogout}
                    className="btn btn-outline text-danger"
                    style={{ padding: '8px', border: 'none', borderRadius: '50%' }}
                    title="Logout">
                    <FaSignOutAlt size={18} />
                </Link>
            </div>
        </header>
    );
}

export default Navbar;
