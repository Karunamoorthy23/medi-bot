import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaClock, FaClipboardList, FaComments } from 'react-icons/fa';
import Navbar from '../components/Layout/Navbar';
import AppointmentTable from '../components/AppointmentTable';
import Card from '../components/Widget/Card';
import { apiGet, apiPost } from '../api/client';

const statusOptions = ['all', 'pending', 'approved', 'completed'];

function DashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = () => {
    setError('');
    apiGet('/api/appointments')
      .then((data) => {
        setAppointments(data?.appointments ?? []);
      })
      .catch((err) => {
        setAppointments([]);
        setError(err?.message || 'Failed to load appointments');
      });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const resp = await apiPost(`/api/appointments/delete/${id}`, {});
      if (resp?.success) {
        fetchAppointments();
      }
    } catch (err) {
      setError('Failed to delete appointment');
    }
  };

  const filteredAppointments = useMemo(() => {
    if (selectedStatus === 'all') return appointments;
    return appointments.filter((a) => a.status === selectedStatus);
  }, [appointments, selectedStatus]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-wrapper">
        <section style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--primary-light) 100%)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          flexWrap: 'wrap',
          gap: 'var(--spacing-lg)'
        }}>
          <div style={{ flex: '1 1 400px' }}>
            <p style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Medical Intelligence
            </p>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '12px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Professional Medical Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1.05rem', maxWidth: '600px' }}>
              Track doctor status, upcoming appointments, and quick consultation actions from one secure portal with real-time updates.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/chatbot" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}>Start Consultation</Link>
              <Link to="/appointment" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}>Book Appointment</Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 250px' }}>
            <div style={{ background: 'var(--surface)', padding: '12px 20px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)', alignSelf: 'flex-start', border: '1px solid var(--border-color)' }}>
              <FaClock color="var(--primary-color)" />
              <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{currentTime.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'var(--surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}><FaUserMd color="var(--primary-color)" /> Real-time Doctor Availability</div>
              <div style={{ background: 'var(--surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}><FaClipboardList color="var(--primary-color)" /> Manage Appointments Easily</div>
              <div style={{ background: 'var(--surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}><FaComments color="var(--primary-color)" /> Intelligent AI Chat Support</div>
            </div>
          </div>
        </section>

        <Card title="My Appointments">
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {statusOptions.map((status) => (
              <button
                key={status}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${selectedStatus === status ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  background: selectedStatus === status ? 'var(--primary-color)' : 'var(--surface)',
                  color: selectedStatus === status ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {error ? (
            <div className="text-muted" style={{ color: 'crimson', marginBottom: '12px' }}>
              {error}
            </div>
          ) : null}
          <AppointmentTable
            appointments={filteredAppointments}
            onDelete={handleDeleteAppointment}
          />
        </Card>
      </main>
    </div>
  );
}

export default DashboardPage;
