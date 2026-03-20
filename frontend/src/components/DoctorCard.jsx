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
            <h3>{doctor.name}</h3>
            <p>{doctor.specialization}</p>
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
