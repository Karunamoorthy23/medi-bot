import { FaCheckCircle, FaExclamationCircle, FaRegClock, FaTimesCircle } from 'react-icons/fa';

function StatusBadge({ status }) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'approved') {
    return <span className="badge badge-success"><FaCheckCircle style={{ marginRight: '4px' }} /> APPROVED</span>;
  }
  if (normalizedStatus === 'pending') {
    return <span className="badge badge-warning"><FaRegClock style={{ marginRight: '4px' }} /> PENDING</span>;
  }
  if (normalizedStatus === 'completed') {
    return <span className="badge badge-info"><FaCheckCircle style={{ marginRight: '4px' }} /> COMPLETED</span>;
  }
  if (normalizedStatus === 'rejected') {
    return <span className="badge badge-danger"><FaTimesCircle style={{ marginRight: '4px' }} /> REJECTED</span>;
  }

  return <span className="badge badge-default">{status.toUpperCase()}</span>;
}

export default StatusBadge;
