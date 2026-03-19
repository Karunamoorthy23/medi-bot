from flask import Flask, request, redirect, url_for, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import google.generativeai as genai
from functools import wraps
import json
import re
import warnings
from patient_agent import PatientAgent
warnings.filterwarnings("ignore", category=FutureWarning)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# Ensure instance folder exists before opening SQLite file.
# Use an absolute path via Flask's instance folder to avoid Windows relative-path issues.
os.makedirs(app.instance_path, exist_ok=True)
db_path = os.path.join(app.instance_path, 'medical_chatbot.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path.replace('\\', '/')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Allow React (Vite) frontend to call Flask with session cookies
frontend_origin = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')
CORS(app, supports_credentials=True, resources={r"/*": {"origins": frontend_origin}})

# Initialize database
db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(100), default='123')
    consultation_duration = db.Column(db.Integer, default=30)

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    patient_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    contact_number = db.Column(db.String(20), nullable=False)
    problem = db.Column(db.Text, nullable=False)
    symptoms_analysis = db.Column(db.Text, nullable=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    appointment_date = db.Column(db.Date, nullable=True)
    start_time = db.Column(db.String(20), nullable=True)
    end_time = db.Column(db.String(20), nullable=True)
    duration = db.Column(db.Integer, default=30)
    status = db.Column(db.String(20), default='pending')
    emergency_level = db.Column(db.String(20), default='normal')
    severity_score = db.Column(db.Integer, default=0)
    auto_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    detected_symptoms = db.Column(db.Text, nullable=True)
    suggested_doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=True)
    emergency_detected = db.Column(db.Boolean, default=False)
    severity = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Create database tables
with app.app_context():
    db.create_all()
    
    # Add predefined doctors if not exists
    doctors_data = [
        {'name': 'Dr. Smith', 'specialization': 'General Physician', 'duration': 30},
        {'name': 'Dr. Johnson', 'specialization': 'Orthopedic Doctor', 'duration': 30},
        {'name': 'Dr. Williams', 'specialization': 'Pediatrician', 'duration': 30},
        {'name': 'Dr. Brown', 'specialization': 'Ophthalmologist', 'duration': 30},
        {'name': 'Dr. Jones', 'specialization': 'Dermatologist', 'duration': 30}
    ]
    
    for doc_data in doctors_data:
        doctor = Doctor.query.filter_by(name=doc_data['name']).first()
        if not doctor:
            doctor = Doctor(
                name=doc_data['name'],
                specialization=doc_data['specialization'],
                password='123',
                consultation_duration=doc_data['duration']
            )
            db.session.add(doctor)
    db.session.commit()

# Patient Agent Initialization
def get_doctors_for_agent(specialization=None):
    with app.app_context():
        if specialization:
            return Doctor.query.filter_by(specialization=specialization).all()
        return Doctor.query.all()

patient_agent = PatientAgent(
    db_models={'User': User, 'Doctor': Doctor, 'Appointment': Appointment, 'ChatHistory': ChatHistory},
    doctor_query_func=get_doctors_for_agent
)

# Login decorators
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/') or request.is_json:
                return jsonify({'success': False, 'error': 'Not authenticated'}), 401
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function

def doctor_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'doctor_id' not in session:
            if request.path.startswith('/api/') or request.is_json:
                return jsonify({'success': False, 'error': 'Not authenticated'}), 401
            return redirect('/doctor-login')
        return f(*args, **kwargs)
    return decorated_function

# Gemini-powered symptom analysis is now handled in patient_agent.py

def check_doctor_availability_status():
    """Check which doctors are currently available"""
    doctors = Doctor.query.all()
    now = datetime.now()
    current_time = now.strftime('%H:%M')
    today = now.date()
    
    availability = []
    for doctor in doctors:
        # Check if doctor has appointment right now
        current_appointment = Appointment.query.filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status == 'approved',
            Appointment.start_time <= current_time,
            Appointment.end_time >= current_time
        ).first()
        
        # Get next available slot
        next_appointment = Appointment.query.filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status == 'approved',
            Appointment.start_time > current_time
        ).order_by(Appointment.start_time).first()
        
        total_appointments_today = Appointment.query.filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today
        ).count()
        
        if current_appointment:
            status = f"Busy until {current_appointment.end_time}"
            available = False
        else:
            if next_appointment:
                status = f"Available now (next appointment at {next_appointment.start_time})"
            else:
                status = "Available now"
            available = True
        
        availability.append({
            'id': doctor.id,
            'name': doctor.name,
            'specialization': doctor.specialization,
            'available': available,
            'status': status,
            'total_appointments': total_appointments_today
        })
    
    return availability

# Routes
FRONTEND_DIST_DIR = os.environ.get(
    'FRONTEND_DIST_DIR',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')
)


def serve_spa():
    index_path = os.path.join(FRONTEND_DIST_DIR, 'index.html')
    if not os.path.exists(index_path):
        return jsonify({
            'success': False,
            'error': 'Frontend build not found. Run `cd frontend && npm run build`.'
        }), 500
    return send_from_directory(FRONTEND_DIST_DIR, 'index.html')


@app.route('/assets/<path:filename>')
def spa_assets(filename):
    return send_from_directory(os.path.join(FRONTEND_DIST_DIR, 'assets'), filename)


@app.route('/')
def spa_root():
    return serve_spa()


@app.route('/<path:path>')
def spa_fallback(path):
    # Do not swallow API endpoints
    if path.startswith('api/') or path in {
        'send_message',
        'get_chat_history',
        'book_appointment',
        'assign_time_slot',
        'update_appointment_status',
        'update_doctor_duration',
        'check_doctors_status',
        'suggest_doctor_api',
    }:
        return jsonify({'success': False, 'error': 'Not found'}), 404
    return serve_spa()


def serialize_doctor(d):
    return {
        'id': d.id,
        'name': d.name,
        'specialization': d.specialization,
        'consultation_duration': d.consultation_duration,
    }


def serialize_appointment(a):
    doctor = Doctor.query.get(a.doctor_id) if a.doctor_id else None
    return {
        'id': a.id,
        'user_id': a.user_id,
        'patient_name': a.patient_name,
        'age': a.age,
        'gender': a.gender,
        'contact_number': a.contact_number,
        'problem': a.problem,
        'symptoms_analysis': a.symptoms_analysis,
        'doctor_id': a.doctor_id,
        'doctor': serialize_doctor(doctor) if doctor else None,
        'appointment_date': a.appointment_date.isoformat() if a.appointment_date else None,
        'start_time': a.start_time,
        'end_time': a.end_time,
        'duration': a.duration,
        'status': a.status,
        'emergency_level': a.emergency_level,
        'severity_score': a.severity_score,
        'auto_completed': a.auto_completed,
        'created_at': a.created_at.isoformat() if a.created_at else None,
    }


@app.route('/api/session', methods=['GET'])
def api_session():
    return jsonify({
        'success': True,
        'user': {
            'id': session.get('user_id'),
            'username': session.get('username'),
        } if session.get('user_id') else None,
        'doctor': {
            'id': session.get('doctor_id'),
            'name': session.get('doctor_name'),
        } if session.get('doctor_id') else None,
    })


@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(force=True, silent=True) or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({'success': False, 'error': 'username, email, password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'error': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email already registered'}), 409

    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'success': True})


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    identifier = (data.get('username') or data.get('email') or data.get('identifier') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'success': False, 'error': 'identifier and password are required'}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower()),
        User.password == password
    ).first()

    if not user:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    session.clear()
    session['user_id'] = user.id
    session['username'] = user.username

    return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username}})


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/api/doctor/login', methods=['POST'])
def api_doctor_login():
    data = request.get_json(force=True, silent=True) or {}
    doctor_name = (data.get('doctor_name') or data.get('name') or '').strip()
    password = data.get('password') or ''

    if not doctor_name or not password:
        return jsonify({'success': False, 'error': 'doctor_name and password are required'}), 400

    doctor = Doctor.query.filter_by(name=doctor_name, password=password).first()
    if not doctor:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    session.clear()
    session['doctor_id'] = doctor.id
    session['doctor_name'] = doctor.name

    return jsonify({'success': True, 'doctor': serialize_doctor(doctor)})


@app.route('/api/doctor/logout', methods=['POST'])
def api_doctor_logout():
    session.pop('doctor_id', None)
    session.pop('doctor_name', None)
    return jsonify({'success': True})


@app.route('/api/doctors', methods=['GET'])
@login_required
def api_doctors():
    availability = check_doctor_availability_status()
    return jsonify({'success': True, 'doctors': availability})


@app.route('/api/public/doctors', methods=['GET'])
def api_public_doctors():
    doctors = Doctor.query.order_by(Doctor.name.asc()).all()
    return jsonify({'success': True, 'doctors': [serialize_doctor(d) for d in doctors]})


@app.route('/api/appointments', methods=['GET'])
@login_required
def api_appointments():
    user_id = session.get('user_id')
    appts = Appointment.query.filter_by(user_id=user_id).order_by(Appointment.created_at.desc()).all()
    return jsonify({'success': True, 'appointments': [serialize_appointment(a) for a in appts]})


@app.route('/api/doctor/appointments', methods=['GET'])
@doctor_login_required
def api_doctor_appointments():
    doctor_id = session.get('doctor_id')
    appts = Appointment.query.filter_by(doctor_id=doctor_id).order_by(Appointment.created_at.desc()).all()
    return jsonify({'success': True, 'appointments': [serialize_appointment(a) for a in appts]})

@app.route('/get_chat_history')
@login_required
def get_chat_history():
    user_id = session.get('user_id')
    history = ChatHistory.query.filter_by(user_id=user_id).order_by(ChatHistory.timestamp).all()
    chats = []
    for h in history:
        # Get doctor name if suggested
        doctor_name = None
        if h.suggested_doctor_id:
            doctor = Doctor.query.get(h.suggested_doctor_id)
            doctor_name = doctor.name if doctor else None
        
        chats.append({
            'message': h.message,
            'response': h.response,
            'emergency': h.emergency_detected,
            'severity': h.severity,
            'suggested_doctor': doctor_name,
            'timestamp': h.timestamp.strftime('%Y-%m-%d %H:%M')
        })
    return jsonify({'success': True, 'history': chats})

@app.route('/check_doctors_status', methods=['GET'])
@login_required
def check_doctors_status():
    """API endpoint to check which doctors are available"""
    availability = check_doctor_availability_status()
    return jsonify({'success': True, 'doctors': availability})

@app.route('/send_message', methods=['POST'])
@login_required
def send_message():
    data = request.get_json()
    user_message = data.get('message', '')
    user_id = session.get('user_id')
    
    # Get current session context for the agent
    session_context = session.get('agent_context', {'state': 'IDLE'})
    
    # Process message through agent
    result = patient_agent.process_message(user_message, session_context, user_id)
    
    # Update session context
    session['agent_context'] = result.get('session_context')
    
    # Handle finalized booking from agent
    if result.get('complete') and result.get('response') == 'FINALIZING':
        ctx = result.get('session_context')
        
        # Create Appointment in DB
        appt = Appointment(
            user_id=user_id,
            patient_name=ctx['patient_name'],
            age=ctx['age'],
            gender=ctx['gender'],
            contact_number=ctx['contact_number'],
            problem=ctx['symptoms'],
            doctor_id=ctx['doctor_id'],
            appointment_date=datetime.strptime(ctx['appointment_date'], '%Y-%m-%d').date(),
            start_time=ctx['start_time'],
            emergency_level=ctx.get('emergency_level', 'normal'),
            severity_score=ctx.get('severity_score', 5),
            status='pending'
        )
        db.session.add(appt)
        db.session.commit()
        
        confirmation = f"""✅ **Your appointment has been booked successfully.**

**Appointment Details:**
- **Patient Name:** {ctx['patient_name']}
- **Appointment Date:** {ctx['appointment_date']}
- **Appointment Time:** {ctx['start_time']}
- **Doctor Name:** {ctx['doctor_name']}
- **Symptoms:** {ctx['symptoms']}
- **Contact Number:** {ctx['contact_number']}

I have sent your request to the doctor. Is there anything else I can help you with? ❤️"""

        # Clear agent context after completion
        session.pop('agent_context', None)
        
        return jsonify({
            'success': True,
            'response': confirmation,
            'booking_complete': True
        })

    # Save to chat history if it's a normal interaction
    if result.get('analysis'):
        analysis = result['analysis']
        chat = ChatHistory(
            user_id=user_id,
            message=user_message,
            response=result['response'],
            detected_symptoms=','.join(analysis['symptoms_detected']) if analysis.get('symptoms_detected') else None,
            emergency_detected=(analysis.get('emergency_level') == 'emergency'),
            severity=analysis.get('severity_score', 0)
        )
        db.session.add(chat)
        db.session.commit()
    
    return jsonify({
        'success': True,
        'response': result['response'],
        'booking_active': session_context.get('state') != 'IDLE'
    })

@app.route('/suggest_doctor_api', methods=['POST'])
@login_required
def suggest_doctor_api():
    """Get doctor suggestion based on symptoms using Agent's analysis"""
    data = request.get_json()
    symptoms = data.get('symptoms', '')
    
    # Use agent's internal analysis logic
    doctors = get_doctors_for_agent()
    doctor_info = [{'name': d.name, 'specialization': d.specialization} for d in doctors]
    analysis = patient_agent.analyze_with_gemini(symptoms, doctor_info)
    
    suggested_doctor = None
    if analysis.get('suggested_specialization'):
        suggested_doctor = Doctor.query.filter_by(
            specialization=analysis['suggested_specialization']
        ).first()
    
    if suggested_doctor:
        return jsonify({
            'success': True,
            'doctor': {
                'id': suggested_doctor.id,
                'name': suggested_doctor.name,
                'specialization': suggested_doctor.specialization
            },
            'emergency_level': analysis.get('emergency_level', 'normal'),
            'severity': analysis.get('severity_score', 5)
        })
    else:
        # Default to General Physician
        default = Doctor.query.filter_by(specialization='General Physician').first()
        return jsonify({
            'success': True,
            'doctor': {
                'id': default.id,
                'name': default.name,
                'specialization': default.specialization
            },
            'emergency_level': analysis.get('emergency_level', 'normal'),
            'severity': analysis.get('severity_score', 5)
        })

@app.route('/book_appointment', methods=['POST'])
@login_required
def book_appointment():
    data = request.get_json()
    
    user_id = session.get('user_id')
    patient_name = data.get('patient_name')
    age = data.get('age')
    gender = data.get('gender')
    contact_number = data.get('contact_number')
    problem = data.get('problem')
    doctor_id = data.get('doctor_id')
    symptoms_analysis = data.get('symptoms_analysis', '')
    emergency_level = data.get('emergency_level', 'normal')
    severity = data.get('severity', 5)
    
    # Create appointment
    appointment = Appointment(
        user_id=user_id,
        patient_name=patient_name,
        age=age,
        gender=gender,
        contact_number=contact_number,
        problem=problem,
        symptoms_analysis=symptoms_analysis,
        doctor_id=doctor_id,
        status='pending',
        emergency_level=emergency_level,
        severity_score=severity
    )
    
    db.session.add(appointment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Appointment request sent successfully!',
        'appointment_id': appointment.id
    })

@app.route('/assign_time_slot', methods=['POST'])
@doctor_login_required
def assign_time_slot():
    data = request.get_json()
    appointment_id = data.get('appointment_id')
    date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
    start_time = data.get('start_time')
    duration = data.get('duration', 30)
    
    # Calculate end time
    start = datetime.strptime(start_time, '%H:%M')
    end = start + timedelta(minutes=duration)
    end_time = end.strftime('%H:%M')
    
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({'success': False, 'error': 'Appointment not found'}), 404
    
    # Check availability
    available, message = check_doctor_availability(
        appointment.doctor_id, date, start_time, duration
    )
    
    if not available:
        return jsonify({'success': False, 'error': message})
    
    # Assign time slot
    appointment.appointment_date = date
    appointment.start_time = start_time
    appointment.end_time = end_time
    appointment.duration = duration
    appointment.status = 'approved'
    db.session.commit()
    
    return jsonify({'success': True})


@app.route('/update_appointment_status', methods=['POST'])
@doctor_login_required
def update_appointment_status():
    data = request.get_json()
    appointment_id = data.get('appointment_id')
    status = data.get('status')
    
    appointment = Appointment.query.get(appointment_id)
    if appointment:
        appointment.status = status
        if status == 'completed':
            appointment.auto_completed = True
        db.session.commit()
        return jsonify({'success': True})
    
    return jsonify({'success': False}), 404

@app.route('/update_doctor_duration', methods=['POST'])
@doctor_login_required
def update_doctor_duration():
    data = request.get_json()
    doctor_id = session.get('doctor_id')
    duration = data.get('duration')
    
    doctor = Doctor.query.get(doctor_id)
    if doctor:
        doctor.consultation_duration = duration
        db.session.commit()
        return jsonify({'success': True})
    
    return jsonify({'success': False}), 404


def check_doctor_availability(doctor_id, date, start_time, duration):
    """Check if doctor is available for the requested time slot"""
    try:
        start = datetime.strptime(start_time, '%H:%M')
        end = start + timedelta(minutes=duration)
        end_time = end.strftime('%H:%M')
        
        existing = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == date,
            Appointment.status.in_(['approved', 'pending']),
            Appointment.start_time.isnot(None)
        ).all()
        
        for apt in existing:
            apt_start = datetime.strptime(apt.start_time, '%H:%M')
            apt_end = datetime.strptime(apt.end_time, '%H:%M')
            
            if (start < apt_end and end > apt_start):
                return False, f"Doctor is busy from {apt.start_time} to {apt.end_time}"
        
        return True, f"Doctor is available from {start_time} to {end_time}"
    except Exception as e:
        return False, str(e)

if __name__ == '__main__':
    app.run(debug=True)