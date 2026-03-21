import Card from './Widget/Card';
import { FaCalendarAlt } from 'react-icons/fa';

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
            {doctor.email && (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
