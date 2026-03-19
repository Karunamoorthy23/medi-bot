import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Layout/Navbar';
import DoctorCard from '../components/DoctorCard';
import SummaryStats from '../components/SummaryStats';
import { apiGet } from '../api/client';

function DoctorsPage() {
    const [doctors, setDoctors] = useState([]);
    const [error, setError] = useState('');

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
                    <div className="flex-between mb-lg">
                        <div>
                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Doctor Availability</h2>
                            <p className="text-muted">Live status from connected specialists.</p>
                        </div>
                        <button className="btn btn-outline" onClick={load}>Refresh data</button>
                    </div>
                    {error ? (
                        <div className="text-muted" style={{ color: 'crimson', marginBottom: '12px' }}>
                            {error}
                        </div>
                    ) : null}
                    <SummaryStats summary={summary} />
                    <div className="doctor-grid">
                        {doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default DoctorsPage;
