import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './routes/DashboardPage';
import DoctorDashboardPage from './routes/DoctorDashboardPage';
import LoginPage from './routes/LoginPage';
import RegisterPage from './routes/RegisterPage';
import DoctorLoginPage from './routes/DoctorLoginPage';
import DoctorRegisterPage from './routes/DoctorRegisterPage';
import ChatbotPage from './routes/ChatbotPage';
import AppointmentFormPage from './routes/AppointmentFormPage';
import DoctorsPage from './routes/DoctorsPage';
import DoctorChatbotPage from './routes/DoctorChatbotPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/doctor-chatbot" element={<DoctorChatbotPage />} />
        <Route path="/appointment" element={<AppointmentFormPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/doctor-login" element={<DoctorLoginPage />} />
        <Route path="/doctor-register" element={<DoctorRegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<div className="page-error">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
