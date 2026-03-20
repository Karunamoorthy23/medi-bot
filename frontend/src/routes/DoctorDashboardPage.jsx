import { useMemo, useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/Widget/Card';
import { apiGet, apiPost } from '../api/client';
import {
  FaClipboardList, FaHourglassHalf, FaCheckCircle, FaCheckDouble,
  FaExclamationCircle, FaCalendarDay, FaClock, FaPhoneAlt, FaTimesCircle, FaCog
} from 'react-icons/fa';

const statusOptions = ['all', 'pending', 'approved', 'completed', 'emergency', 'today'];

function DoctorDashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  const [duration, setDuration] = useState('30');
  const [durationSaving, setDurationSaving] = useState(false);
  const [durationError, setDurationError] = useState('');

  const [slotModal, setSlotModal] = useState(null);
  const [slotSaving, setSlotSaving] = useState(false);
  const [slotError, setSlotError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const load = () => {
    setError('');
    apiGet('/api/doctor/appointments')
      .then((data) => setAppointments(data?.appointments ?? []))
      .catch((err) => {
        setAppointments([]);
        setError(err?.message || 'Failed to load appointments');
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAppointments = useMemo(() => {
    const list = appointments;
    if (selectedStatus === 'all') return list;
    if (selectedStatus === 'emergency') return list.filter((a) => a.emergency_level === 'emergency');
    if (selectedStatus === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      return list.filter((a) => a.appointment_date === today);
    }
    return list.filter((a) => a.status === selectedStatus);
  }, [appointments, selectedStatus]);

  const stats = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const approved = appointments.filter((a) => a.status === 'approved').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const total = appointments.length;
    return { pending, approved, completed, total };
  }, [appointments]);

  const saveDuration = async () => {
    setDurationSaving(true);
    setDurationError('');
    try {
      await apiPost('/update_doctor_duration', { duration: Number(duration) });
    } catch (err) {
      setDurationError(err?.message || 'Failed to update duration');
    } finally {
      setDurationSaving(false);
    }
  };

  const updateStatus = async (appointmentId, status) => {
    try {
      await apiPost('/update_appointment_status', { appointment_id: appointmentId, status });
      load();
    } catch (err) {
      setError(err?.message || 'Failed to update appointment');
    }
  };

  const openAssign = (appointmentId) => {
    setSlotError('');
    setSlotModal({
      appointmentId,
      date: new Date().toISOString().slice(0, 10),
      start_time: '09:00',
      duration,
    });
  };

  const saveAssign = async (e) => {
    e.preventDefault();
    if (!slotModal) return;
    setSlotSaving(true);
    setSlotError('');
    try {
      await apiPost('/assign_time_slot', {
        appointment_id: slotModal.appointmentId,
        date: slotModal.date,
        start_time: slotModal.start_time,
        duration: Number(slotModal.duration),
      });
      setSlotModal(null);
      load();
    } catch (err) {
      setSlotError(err?.message || 'Failed to assign slot');
    } finally {
      setSlotSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' },
      approved: { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7' },
      completed: { bg: '#eff6ff', color: '#2563eb', border: '#dbeafe' },
      rejected: { bg: '#fdf2f8', color: '#db2777', border: '#fce7f3' }
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    return (
      <span style={{
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', display: 'inline-block'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="app-shell" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      <main className="page-wrapper" style={{ padding: '24px' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: '#0f172a', margin: '0 0 4px 0', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaClipboardList color="#43cea2" /> Dashboard
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Manage patient appointments and schedules</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <span style={{ width: '8px', height: '8px', background: '#43cea2', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
              {currentTime.toLocaleString()}
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <FaCog color="#94a3b8" />
              <select
                style={{ border: 'none', fontSize: '13px', fontWeight: 500, color: '#334155', outline: 'none', background: 'transparent' }}
                value={duration}
                onChange={(e) => { setDuration(e.target.value); saveDuration(); }}
              >
                <option value="15">15 min duration</option>
                <option value="20">20 min duration</option>
                <option value="30">30 min duration</option>
                <option value="60">60 min duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '12px', background: '#fff7ed', borderRadius: '10px', color: '#ea580c' }}><FaHourglassHalf size={20} /></div>
            <div><div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{stats.pending}</div></div>
          </Card>
          <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}><FaCheckCircle size={20} /></div>
            <div><div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{stats.approved}</div></div>
          </Card>
          <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '10px', color: '#2563eb' }}><FaCheckDouble size={20} /></div>
            <div><div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{stats.completed}</div></div>
          </Card>
          <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '10px', color: '#475569' }}><FaClipboardList size={20} /></div>
            <div><div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Total</div><div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div></div>
          </Card>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: '1px solid',
                borderColor: selectedStatus === status ? '#43cea2' : '#e2e8f0',
                background: selectedStatus === status ? '#e6f9f0' : 'white',
                color: selectedStatus === status ? '#116d4e' : '#64748b',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              {status === 'all' && <FaClipboardList />}
              {status === 'pending' && <FaHourglassHalf />}
              {status === 'approved' && <FaCheckCircle />}
              {status === 'completed' && <FaCheckDouble />}
              {status === 'emergency' && <FaExclamationCircle />}
              {status === 'today' && <FaCalendarDay />}
              <span style={{ textTransform: 'capitalize' }}>{status}</span>
            </button>
          ))}
        </div>

        {error ? (
          <div style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        ) : null}

        {/* Quick Data Table */}
        <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '20%' }}>Patient info</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '15%' }}>Schedule</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '25%' }}>Problem</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '15%' }}>Priority</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '10%' }}>Status</th>
                  <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, textAlign: 'right', width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      No appointments found for current filter.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #e2e8f0', background: app.emergency_level === 'high' ? '#fef2f2' : 'white', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {app.patient_name}
                        </div>
                        <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <FaPhoneAlt size={10} /> {app.contact_number || 'N/A'}
                        </div>
                        <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px' }}>
                          📍 {app.location || 'Not Specified'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>{app.appointment_date || '—'}</div>
                        <div style={{ color: '#64748b', marginTop: '2px' }}>
                          {app.start_time ? `${app.start_time} - ${app.end_time}` : 'TBD'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={app.problem}>
                          {app.problem}
                        </div>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', padding: '4px 8px', borderRadius: '12px', background: app.emergency_level === 'high' ? '#fef2f2' : (app.emergency_level === 'medium' ? '#fff7ed' : '#f0fdf4'), color: app.emergency_level === 'high' ? '#ef4444' : (app.emergency_level === 'medium' ? '#ea580c' : '#16a34a'), border: '1px solid #e2e8f0' }}>
                          {app.emergency_level || 'normal checkup'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        {getStatusBadge(app.status)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openAssign(app.id)}
                                style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                              >
                                <FaClock size={12} /> Assign
                              </button>
                              <button
                                onClick={() => updateStatus(app.id, 'rejected')}
                                style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                              >
                                <FaTimesCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                          {app.status === 'approved' && (
                            <button
                              onClick={() => updateStatus(app.id, 'completed')}
                              style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                            >
                              <FaCheckCircle size={12} /> Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal */}
        {slotModal && (
          <div
            role="dialog"
            aria-modal="true"
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: '16px', zIndex: 100 }}
            onClick={() => setSlotModal(null)}
          >
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>Schedule Appointment</h3>
              <form onSubmit={saveAssign}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Date</label>
                  <input
                    required type="date"
                    value={slotModal.date} onChange={(e) => setSlotModal(p => ({ ...p, date: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Start time</label>
                    <input
                      required type="time"
                      value={slotModal.start_time} onChange={(e) => setSlotModal(p => ({ ...p, start_time: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Minutes</label>
                    <input
                      required type="number" min="5"
                      value={slotModal.duration} onChange={(e) => setSlotModal(p => ({ ...p, duration: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
                {slotError && <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{slotError}</div>}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setSlotModal(null)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={slotSaving} style={{ flex: 1, padding: '10px', background: '#43cea2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Save slot</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div >
  );
}

export default DoctorDashboardPage;
