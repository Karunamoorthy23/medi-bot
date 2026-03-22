import Card from './Widget/Card';
import { FaCalendarAlt, FaHospital, FaMapMarkerAlt } from 'react-icons/fa';

function DoctorCard({ doctor }) {
  return (
    <Card className="doctor-card">
      <div className="doctor-header">
        <div className="flex-center gap-sm">
          <div className="doctor-icon-wrapper">
            <span style={{ fontWeight: 'bold' }}>{doctor.name.split(' ')[doctor.name.split(' ').length - 1].charAt(0)}</span>
          </div>
          <div className="doctor-info">
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{doctor.name}</h3>
            <p style={{ margin: '2px 0 4px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{doctor.specialization}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {doctor.hospital && (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaHospital style={{ color: '#64748b' }} /> {doctor.hospital}
                </p>
              )}
              {doctor.city && (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaMapMarkerAlt style={{ color: '#64748b' }} /> {doctor.city}
                </p>
              )}
            </div>
            {doctor.email && (
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {doctor.email}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span className={`badge ${doctor.available ? 'badge-success' : 'badge-danger'}`}>
            {doctor.available ? 'Available' : 'Busy'}
          </span>
          <div className="pulse-indicator" style={{ color: doctor.available ? 'var(--success-color)' : 'var(--danger-color)' }}></div>
        </div>
      </div>
      {doctor.available_slots && (
        <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Available Slots</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {doctor.available_slots.split('|').map((slot, i) => (
              <span key={i} style={{ fontSize: '0.8rem', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                {slot}
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        State: {doctor.status}
      </div>
      <div className="doctor-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaCalendarAlt style={{ fontSize: '1rem', color: 'var(--text-muted)' }} />
          {doctor.total_appointments} appointments today
        </span>
      </div>
    </Card>
  );
}

export default DoctorCard;
