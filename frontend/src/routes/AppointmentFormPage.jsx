import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaPhone, FaCalendarAlt, FaStethoscope, FaArrowRight, FaTimes, FaRegCalendarAlt, FaRegClock, FaCommentMedical } from 'react-icons/fa';
import Navbar from '../components/Layout/Navbar';
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
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
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
        problem: problem.trim() || "Routine Appointment",
        doctor_id: Number(doctorId),
        symptoms_analysis: symptomsAnalysis,
        appointment_date: appointmentDate,
        start_time: startTime
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <style>
        {`
          .glass-panel {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            padding: 40px;
            width: 100%;
            transition: all 0.3s ease;
          }
          
          .form-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          .form-subtitle {
            font-size: 15px;
            color: #64748b;
            margin-bottom: 32px;
          }
          
          .custom-input-group {
            position: relative;
            margin-bottom: 24px;
          }
          
          .custom-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
          }
          
          .custom-input, .custom-select, .custom-textarea {
            width: 100%;
            padding: 14px 16px 14px 44px;
            font-size: 15px;
            color: #0f172a;
            background-color: #f1f5f9;
            border: 2px solid transparent;
            border-radius: 10px;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }
          
          .custom-input:focus, .custom-select:focus, .custom-textarea:focus {
            outline: none;
            background-color: #ffffff;
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          }
          
          .custom-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 16px center;
            background-size: 20px;
            padding-right: 48px;
          }
          
          .input-icon {
            position: absolute;
            left: 16px;
            top: 40px;
            color: #64748b;
            font-size: 16px;
          }
          
          .btn-gradient {
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            font-weight: 600;
            font-size: 16px;
            padding: 14px 24px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
            transition: all 0.2s ease;
          }
          
          .btn-gradient:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
          }
          
          .btn-gradient:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }
          
          .btn-cancel {
            background: #ffffff;
            color: #64748b;
            font-weight: 600;
            font-size: 16px;
            padding: 14px 24px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            cursor: pointer;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s ease;
            text-decoration: none;
          }
          
          .btn-cancel:hover {
            border-color: #cbd5e1;
            color: #334155;
            background: #f8fafc;
          }
          
          .error-banner {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #ef4444;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: '650px', width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
          <div className="glass-panel">
            <h1 className="form-title">Consult a Specialist</h1>
            <p className="form-subtitle">Complete the details below to schedule your appointment.</p>

            {error && (
              <div className="error-banner">
                <FaTimes />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="custom-input-group">
                <label className="custom-label">Select Specialist</label>
                <select required className="custom-select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                  <option value="" disabled>-- Choose a Doctor --</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name} ({doctor.specialization})</option>
                  ))}
                </select>
                <FaStethoscope className="input-icon" style={{ top: '40px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="custom-input-group" style={{ marginBottom: 0 }}>
                  <label className="custom-label">Patient Name</label>
                  <input
                    required
                    type="text"
                    className="custom-input"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                  />
                  <FaUserPlus className="input-icon" />
                </div>

                <div className="custom-input-group" style={{ marginBottom: 0 }}>
                  <label className="custom-label">Contact Number</label>
                  <input
                    required
                    type="text"
                    className="custom-input"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +1 555-0101"
                  />
                  <FaPhone className="input-icon" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '24px' }}>
                <div className="custom-input-group" style={{ marginBottom: 0 }}>
                  <label className="custom-label">Age</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="custom-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 25"
                  />
                  <FaCalendarAlt className="input-icon" />
                </div>
                <div className="custom-input-group" style={{ marginBottom: 0 }}>
                  <label className="custom-label">Gender</label>
                  <select required className="custom-select" value={gender} onChange={(e) => setGender(e.target.value)} style={{ paddingLeft: '16px' }}>
                    <option value="" disabled>-- Select --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '24px' }}>
                <div className="custom-input-group" style={{ marginBottom: 0 }}>
                  <label className="custom-label">Preferred Date</label>
                  <input
                    required
                    type="date"
                    className="custom-input"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                  <FaRegCalendarAlt className="input-icon" />
                </div>
                <div className="custom-input-group" style={{ marginBottom: 0 }}>
                  <label className="custom-label">Preferred Time</label>
                  <input
                    required
                    type="time"
                    className="custom-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <FaRegClock className="input-icon" />
                </div>
              </div>

              <div className="custom-input-group" style={{ marginTop: '24px' }}>
                <label className="custom-label">Reason for Visit (Problem)</label>
                <textarea
                  required
                  className="custom-textarea"
                  style={{ minHeight: '80px', resize: 'vertical', paddingLeft: '44px' }}
                  placeholder="Briefly describe your symptoms or reason for visit..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />
                <FaCommentMedical className="input-icon" />
              </div>

              <div className="custom-input-group" style={{ marginTop: '24px' }}>
                <label className="custom-label">Additional Notes (Optional)</label>
                <textarea
                  className="custom-textarea"
                  style={{ minHeight: '100px', resize: 'vertical', paddingLeft: '16px' }}
                  placeholder="Include any previous diagnosis or AI chatbot analysis here..."
                  value={symptomsAnalysis}
                  onChange={(e) => setSymptomsAnalysis(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                <Link to="/dashboard" style={{ flex: 1, textDecoration: 'none' }}>
                  <button type="button" className="btn-cancel">
                    Cancel
                  </button>
                </Link>
                <button type="submit" className="btn-gradient" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Confirming...' : 'Request Appointment'}
                  {!loading && <FaArrowRight />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppointmentFormPage;
