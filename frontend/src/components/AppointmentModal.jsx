import React from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';

function AppointmentModal({ isOpen, appointmentData, onClose }) {
  if (!isOpen || !appointmentData) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <style>
            {`
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateY(-30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <FaTimes />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
            <FaCheckCircle size={28} color='#28a745' />
            <h2 style={{ margin: 0, fontSize: '1.8em', color: '#333' }}>Appointment Confirmed! 🎉</h2>
          </div>

          {/* Appointment Details */}
          <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Patient Name</label>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#333' }}>{appointmentData.patient_name}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Age & Gender</label>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#333' }}>{appointmentData.age} years, {appointmentData.gender}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Contact Number</label>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#333' }}>{appointmentData.contact_number}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Doctor</label>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#333' }}><strong>{appointmentData.doctor_name}</strong></p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Date</label>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#333' }}>📅 {appointmentData.appointment_date}</p>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Time</label>
              <p style={{ margin: 0, fontSize: '1.1em', color: '#333' }}>🕐 {appointmentData.start_time}</p>
            </div>

            {appointmentData.symptoms && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
                <label style={{ fontWeight: '600', color: '#666', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Symptoms</label>
                <p style={{ margin: 0, fontSize: '1em', color: '#666', lineHeight: '1.5' }}>{appointmentData.symptoms}</p>
              </div>
            )}
          </div>

          {/* Message */}
          <div style={{ backgroundColor: '#e7f3ff', borderLeft: '4px solid #2196F3', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#1565c0', fontSize: '0.95em', lineHeight: '1.6' }}>
              Your appointment has been successfully booked! Please arrive 10 minutes early. If you need to reschedule, please contact us at least 24 hours in advance.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

export default AppointmentModal;
