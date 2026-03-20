import StatusBadge from './StatusBadge';

function AppointmentTable({ appointments = [] }) {
  if (!appointments.length) {
    return (
      <div className="text-center text-muted" style={{ padding: 'var(--spacing-xl)' }}>
        No appointments found in this category.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Problem & Location</th>
            <th>Priority</th>
            <th>Date & Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((item) => {
            const doctor = item.doctor || {};
            return (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--primary-color)' }}>{doctor.name || 'Unassigned'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{doctor.specialization}</div>
                </td>
                <td>
                  <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {item.problem}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    📍 {item.location || 'Not Specified'}
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', padding: '4px 8px', borderRadius: '12px', background: item.emergency_level === 'high' ? '#fef2f2' : (item.emergency_level === 'medium' ? '#fff7ed' : '#f0fdf4'), color: item.emergency_level === 'high' ? '#ef4444' : (item.emergency_level === 'medium' ? '#ea580c' : '#16a34a'), border: '1px solid #e2e8f0' }}>
                    {item.emergency_level || 'normal checkup'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.appointment_date || '—'}</div>
                  <div style={{ marginTop: '4px' }}>
                    {item.start_time ? (
                      <span style={{ background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {item.start_time} - {item.end_time}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Pending</span>
                    )}
                  </div>
                </td>
                <td><StatusBadge status={item.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AppointmentTable;
