import { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaUserMd } from 'react-icons/fa';
import Navbar from '../components/Layout/Navbar';
import DoctorCard from '../components/DoctorCard';
import SummaryStats from '../components/SummaryStats';
import { apiGet } from '../api/client';

function DoctorsPage() {
    const [doctors, setDoctors] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const load = () => {
        setError('');
        apiGet('/api/doctors')
            .then((data) => setDoctors(data?.doctors ?? []))
            .catch((err) => {
                setDoctors([]);
                setError(err?.message || 'Failed to load doctors');
            });
    };

    useEffect(() => {
        load();
    }, []);

    const filteredDoctors = useMemo(() => {
        if (!searchTerm.trim()) return doctors;
        const lowTerm = searchTerm.toLowerCase();
        return doctors.filter((d) =>
            d.name.toLowerCase().includes(lowTerm) ||
            d.specialization.toLowerCase().includes(lowTerm) ||
            (d.city && d.city.toLowerCase().includes(lowTerm)) ||
            (d.hospital && d.hospital.toLowerCase().includes(lowTerm))
        );
    }, [doctors, searchTerm]);

    const summary = useMemo(() => {
        const available = doctors.filter((d) => d.available).length;
        const busy = doctors.length - available;
        return { available, busy, total: doctors.length };
    }, [doctors]);

    return (
        <div className="app-shell">
            <Navbar />
            <main className="page-wrapper">
                <section>
                    <div className="flex-between mb-lg" style={{ flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Doctor Availability</h2>
                            <p className="text-muted" style={{ fontSize: '1.1rem' }}>Live status from 50+ connected specialists.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '300px', maxWidth: '600px' }}>
                            <div style={{ position: 'relative', flex: '1' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                    <FaSearch size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name, city, hospital or specialization..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        boxSizing: 'border-box'
                                    }}
                                    className="search-input-hover"
                                />
                            </div>
                            <button className="btn btn-outline" style={{ whiteSpace: 'nowrap', padding: '0 20px', borderRadius: '12px', height: '48px' }} onClick={load}>Refresh</button>
                        </div>
                    </div>
                    {error ? (
                        <div className="text-muted" style={{ color: 'crimson', marginBottom: '12px' }}>
                            {error}
                        </div>
                    ) : null}
                    <SummaryStats summary={summary} />
                    <div className="doctor-grid">
                        {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                                <FaSearch size={40} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                                <h3 style={{ color: '#64748b', margin: 0 }}>No specialists found</h3>
                                <p style={{ color: '#94a3b8' }}>Try adjusting your search terms or location.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DoctorsPage;
