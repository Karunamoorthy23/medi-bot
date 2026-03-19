import { useMemo, useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/Widget/Card';
import { apiGet, apiPost } from '../api/client';

const statusOptions = ['all', 'pending', 'approved', 'completed', 'emergency', 'today'];

function DoctorDashboardPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  const [duration, setDuration] = useState('30');
  const [durationSaving, setDurationSaving] = useState(false);
  const [durationError, setDurationError] = useState('');

  const [slotModal, setSlotModal] = useState(null); // { appointmentId, date, start_time, duration }
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

  return (
    <div className="app-shell" style={{ background: '#f5f5f5', minHeight: '100vh' }}>
      <Navbar />
      <main className="page-wrapper" style={{ maxWidth: '1400px', margin: '30px auto', padding: '0 20px' }}>

        <div style={{ background: '#43cea2', color: 'white', padding: '10px 20px', borderRadius: '30px', display: 'inline-flex', alignItems: 'center', marginBottom: '20px', fontSize: '16px', fontWeight: 600, boxShadow: '0 2px 10px rgba(67, 206, 162, 0.3)' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'white', borderRadius: '50%', marginRight: '10px', animation: 'pulse 1.5s infinite' }}></span>
          {currentTime.toLocaleString()}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#43cea2' }}>{stats.pending}</div>
            <div style={{ color: '#666', marginTop: '5px' }}>Pending Requests</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#43cea2' }}>{stats.approved}</div>
            <div style={{ color: '#666', marginTop: '5px' }}>Approved</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#43cea2' }}>{stats.completed}</div>
            <div style={{ color: '#666', marginTop: '5px' }}>Completed</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#43cea2' }}>{stats.total}</div>
            <div style={{ color: '#666', marginTop: '5px' }}>Total</div>
          </Card>
        </div>

        <Card style={{ padding: '20px', marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>⏱️ Consultation Duration Settings</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: '#333' }}>Default consultation duration:</label>
            <select
              style={{ padding: '10px', border: '2px solid #43cea2', borderRadius: '5px', fontSize: '14px', minWidth: '150px' }}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="25">25 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
            <button
              className="btn"
              style={{ background: '#43cea2', color: 'white', border: 'none', padding: '10px 14px' }}
              type="button"
              onClick={saveDuration}
              disabled={durationSaving}
            >
              Save
            </button>
          </div>
          {durationError ? (
            <div className="text-muted" style={{ color: 'crimson', marginTop: '8px' }}>
              {durationError}
            </div>
          ) : null}
          <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>⚠️ This duration will be used as default when assigning time slots</p>
        </Card>

        <Card style={{ padding: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {statusOptions.map((status) => (
              <button
                key={status}
                style={{
                  padding: '10px 20px',
                  borderRadius: '25px',
                  border: `1px solid ${selectedStatus === status ? '#43cea2' : '#ddd'}`,
                  background: selectedStatus === status ? '#43cea2' : 'white',
                  color: selectedStatus === status ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'all 0.3s'
                }}
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'all' ? '📋 All' :
                  status === 'pending' ? '⏳ Pending' :
                    status === 'approved' ? '✅ Approved' :
                      status === 'completed' ? '✔️ Completed' :
                        status === 'emergency' ? '🚨 Emergency' : '📅 Today'}
              </button>
            ))}
          </div>
        </Card>

        <h1 style={{ color: '#333', marginBottom: '30px' }}>📋 Appointment Management</h1>

        {error ? (
          <div className="text-muted" style={{ color: 'crimson', marginBottom: '12px' }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredAppointments.map(appointment => (
            <div key={appointment.id} style={{
              background: appointment.emergency_level === 'emergency' ? '#fff5f5' : 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${appointment.emergency_level === 'emergency' ? '#f44336' : (appointment.status === 'approved' ? '#2196f3' : 'transparent')}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{appointment.patient_name}</span>
                  <div style={{ fontSize: '13px', color: '#666' }}>📞 {appointment.contact_number || 'N/A'}</div>
                  {appointment.emergency_level === 'emergency' && <span style={{ background: '#f44336', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, marginLeft: '10px', display: 'inline-block', marginTop: '4px' }}>🚨 EMERGENCY</span>}
                </div>
                <span style={{ padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', background: appointment.status === 'pending' ? '#fff3cd' : (appointment.status === 'approved' ? '#d4edda' : '#cce5ff'), color: appointment.status === 'pending' ? '#856404' : (appointment.status === 'approved' ? '#155724' : '#004085') }}>{appointment.status}</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                  <span style={{ width: '100px', color: '#666', fontWeight: 500 }}>Date:</span>
                  <span style={{ flex: 1, color: '#333' }}>{appointment.appointment_date || '—'}</span>
                </div>
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                  <span style={{ width: '100px', color: '#666', fontWeight: 500 }}>Time:</span>
                  <span style={{ flex: 1, color: '#333' }}>
                    {appointment.start_time ? (
                      <span style={{ background: '#e3f2fd', padding: '5px 10px', borderRadius: '15px', display: 'inline-block', fontSize: '14px', color: '#1976d2' }}>
                        {appointment.start_time} - {appointment.end_time}
                      </span>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </span>
                </div>
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px', margin: '10px 0', color: '#666', fontStyle: 'italic' }}>
                  <strong>Problem:</strong> "{appointment.problem}"
                </div>
              </div>

              {appointment.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    type="button"
                    onClick={() => openAssign(appointment.id)}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#4caf50', color: 'white' }}
                  >
                    ⏰ Assign Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(appointment.id, 'rejected')}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#f44336', color: 'white' }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
              {appointment.status === 'approved' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    type="button"
                    onClick={() => updateStatus(appointment.id, 'completed')}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, background: '#ff9800', color: 'white' }}
                  >
                    ✅ Mark Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {slotModal ? (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'grid',
              placeItems: 'center',
              padding: '20px',
              zIndex: 50,
            }}
            onClick={() => setSlotModal(null)}
          >
            <div
              style={{ background: 'white', borderRadius: '12px', padding: '18px', width: '100%', maxWidth: '520px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Assign time slot</h3>
              <form onSubmit={saveAssign}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      required
                      type="date"
                      className="form-control"
                      value={slotModal.date}
                      onChange={(e) => setSlotModal((p) => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Start time</label>
                    <input
                      required
                      type="time"
                      className="form-control"
                      value={slotModal.start_time}
                      onChange={(e) => setSlotModal((p) => ({ ...p, start_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    required
                    type="number"
                    min="5"
                    className="form-control"
                    value={slotModal.duration}
                    onChange={(e) => setSlotModal((p) => ({ ...p, duration: e.target.value }))}
                  />
                </div>

                {slotError ? (
                  <div className="text-muted" style={{ color: 'crimson', marginTop: '8px' }}>
                    {slotError}
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={slotSaving}>
                    Save slot
                  </button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSlotModal(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default DoctorDashboardPage;
