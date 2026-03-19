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
            <th>Problem</th>
            <th>Date</th>
            <th>Time Slot</th>
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
                  <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.problem}
                  </div>
                </td>
                <td>{item.appointment_date || '—'}</td>
                <td>
                  {item.start_time ? (
                    <span style={{ background: 'var(--primary-light)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 500 }}>
                      {item.start_time} - {item.end_time}
                    </span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>Pending</span>
                  )}
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
