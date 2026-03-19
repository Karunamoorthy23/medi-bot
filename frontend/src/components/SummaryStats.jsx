import { FaUserMd, FaCheckCircle, FaRegClock } from 'react-icons/fa';

function SummaryStats({ summary }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
      <div className="card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ padding: '12px', background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '50%' }}>
          <FaUserMd size={24} />
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Doctors</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.total}</div>
        </div>
      </div>

      <div className="card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ padding: '12px', background: 'var(--success-light)', color: 'var(--success-color)', borderRadius: '50%' }}>
          <FaCheckCircle size={24} />
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Available Now</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.available}</div>
        </div>
      </div>

      <div className="card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ padding: '12px', background: 'var(--danger-light)', color: 'var(--danger-color)', borderRadius: '50%' }}>
          <FaRegClock size={24} />
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>Busy</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{summary.busy}</div>
        </div>
      </div>
    </div>
  );
}

export default SummaryStats;
