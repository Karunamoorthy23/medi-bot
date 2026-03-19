import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/Widget/Card';
import { apiGet, apiPost } from '../api/client';

function AppointmentFormPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [problem, setProblem] = useState('');
  const [symptomsAnalysis, setSymptomsAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGet('/api/doctors')
      .then((data) => {
        if (cancelled) return;
        setDoctors(data?.doctors ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setDoctors([]);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiPost('/book_appointment', {
        patient_name: patientName.trim(),
        age: Number(age),
        gender,
        contact_number: contactNumber.trim(),
        problem,
        doctor_id: Number(doctorId),
        symptoms_analysis: symptomsAnalysis,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-wrapper" style={{ maxWidth: '600px' }}>
        <Card title="Book an Appointment">
          <p className="text-muted mb-md">Fill in the required patient details and select a doctor to request an appointment.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Specialist</label>
              <select required className="form-control" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">-- Choose a Doctor --</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name} ({doctor.specialization})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  required
                  type="text"
                  className="form-control"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  required
                  type="text"
                  className="form-control"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 555-0101"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label>Age</label>
                <input
                  required
                  type="number"
                  min="0"
                  className="form-control"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select required className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Visit</label>
              <textarea
                required
                className="form-control"
                placeholder="Briefly describe your symptoms or reason for visit..."
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Symptoms analysis (optional)</label>
              <textarea
                className="form-control"
                placeholder="If you used the chatbot, paste any analysis here..."
                value={symptomsAnalysis}
                onChange={(e) => setSymptomsAnalysis(e.target.value)}
              />
            </div>

            {error ? (
              <div className="text-muted" style={{ color: 'crimson', marginTop: '8px' }}>
                {error}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--spacing-md)' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Submit Appointment Request</button>
              <Link to="/dashboard" className="btn btn-outline" style={{ flex: 1 }}>Cancel</Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

export default AppointmentFormPage;
