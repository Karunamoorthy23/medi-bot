from flask import Flask, request, redirect, url_for, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta
import os
import time
import google.generativeai as genai
from functools import wraps
import json
import re
import warnings
from dotenv import load_dotenv
from patient_agent import PatientAgent
from doctor_query_agent import DoctorAgent
warnings.filterwarnings("ignore", category=FutureWarning)

# Load environment variables from .env file
load_dotenv()

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
frontend_origin_env = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5174,http://localhost:5173')
frontend_origins = [origin.strip() for origin in frontend_origin_env.split(',')]

CORS(app, 
     supports_credentials=True,
     resources={r"/*": {
         "origins": frontend_origins,
         "allow_headers": ['Content-Type', 'Authorization'],
         "methods": ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
         "expose_headers": ['Content-Type']
     }})

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
    email = db.Column(db.String(100), unique=True, nullable=True)
    specialization = db.Column(db.String(100), nullable=False)
    hospital = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(50), nullable=True)
    available_slots = db.Column(db.String(255), nullable=True)
    password = db.Column(db.String(100), default='123')
    consultation_duration = db.Column(db.Integer, default=30)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    patient_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    contact_number = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(100), nullable=True)
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
    chat_id = db.Column(db.String(50), nullable=True)  # Link to conversation
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=True)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    detected_symptoms = db.Column(db.Text, nullable=True)
    suggested_doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=True)
    emergency_detected = db.Column(db.Boolean, default=False)
    severity = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=True)
    title = db.Column(db.String(255), default='New Conversation')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create database tables
with app.app_context():
    db.create_all()
    
    # Add predefined doctors if not exists
    doctors_data = [
        {"name": "Dr. Rajesh Kumar", "email": "rajesh.kumar1@gmail.com", "specialization": "Cardiologist", "hospital": "Apollo Hospital", "city": "Chennai", "slots": "10:00 AM|2:00 PM"},
        {"name": "Dr. Priya Sharma", "email": "priya.sharma2@gmail.com", "specialization": "Dermatologist", "hospital": "Fortis Malar Hospital", "city": "Chennai", "slots": "11:00 AM|3:00 PM"},
        {"name": "Dr. Arjun Reddy", "email": "arjun.reddy3@gmail.com", "specialization": "Orthopedic", "hospital": "MIOT Hospital", "city": "Chennai", "slots": "9:00 AM|1:00 PM"},
        {"name": "Dr. Meena Lakshmi", "email": "meena.lakshmi4@gmail.com", "specialization": "Gynecologist", "hospital": "Kauvery Hospital", "city": "Chennai", "slots": "10:30 AM|4:00 PM"},
        {"name": "Dr. Karthik Narayan", "email": "karthik.narayan5@gmail.com", "specialization": "Neurologist", "hospital": "Global Hospital", "city": "Chennai", "slots": "12:00 PM|5:00 PM"},
        {"name": "Dr. Suresh Babu", "email": "suresh.babu6@gmail.com", "specialization": "Pediatrician", "hospital": "Rainbow Hospital", "city": "Chennai", "slots": "9:30 AM|2:30 PM"},
        {"name": "Dr. Divya Nair", "email": "divya.nair7@gmail.com", "specialization": "ENT Specialist", "hospital": "SRM Hospital", "city": "Kanchipuram", "slots": "10:00 AM|1:00 PM"},
        {"name": "Dr. Vignesh Kumar", "email": "vignesh.kumar8@gmail.com", "specialization": "General Physician", "hospital": "GH Hospital", "city": "Madurai", "slots": "8:00 AM|12:00 PM"},
        {"name": "Dr. Lavanya R", "email": "lavanya.r9@gmail.com", "specialization": "Cardiologist", "hospital": "Meenakshi Mission Hospital", "city": "Madurai", "slots": "11:00 AM|3:00 PM"},
        {"name": "Dr. Mohan Das", "email": "mohan.das10@gmail.com", "specialization": "Dentist", "hospital": "Smile Care Clinic", "city": "Coimbatore", "slots": "10:00 AM|6:00 PM"},
        {"name": "Dr. Anitha S", "email": "anitha.s11@gmail.com", "specialization": "Pediatrician", "hospital": "Ganga Hospital", "city": "Coimbatore", "slots": "9:00 AM|1:00 PM"},
        {"name": "Dr. Sanjay Kumar", "email": "sanjay.kumar12@gmail.com", "specialization": "Orthopedic", "hospital": "Kovai Medical Center", "city": "Coimbatore", "slots": "2:00 PM|6:00 PM"},
        {"name": "Dr. Rekha Menon", "email": "rekha.menon13@gmail.com", "specialization": "Dermatologist", "hospital": "PSG Hospital", "city": "Coimbatore", "slots": "11:30 AM|4:30 PM"},
        {"name": "Dr. Harish K", "email": "harish.k14@gmail.com", "specialization": "Neurologist", "hospital": "KMCH Hospital", "city": "Coimbatore", "slots": "10:00 AM|3:00 PM"},
        {"name": "Dr. Ashok Kumar", "email": "ashok.kumar15@gmail.com", "specialization": "Cardiologist", "hospital": "CMC Hospital", "city": "Vellore", "slots": "9:00 AM|12:00 PM"},
        {"name": "Dr. Preethi J", "email": "preethi.j16@gmail.com", "specialization": "Gynecologist", "hospital": "CMC Hospital", "city": "Vellore", "slots": "1:00 PM|5:00 PM"},
        {"name": "Dr. Ramesh Babu", "email": "ramesh.babu17@gmail.com", "specialization": "General Physician", "hospital": "GH Hospital", "city": "Salem", "slots": "8:30 AM|12:30 PM"},
        {"name": "Dr. Nisha P", "email": "nisha.p18@gmail.com", "specialization": "Dermatologist", "hospital": "Vinayaka Mission Hospital", "city": "Salem", "slots": "10:00 AM|2:00 PM"},
        {"name": "Dr. Kiran S", "email": "kiran.s19@gmail.com", "specialization": "Orthopedic", "hospital": "SKS Hospital", "city": "Salem", "slots": "3:00 PM|7:00 PM"},
        {"name": "Dr. Deepa R", "email": "deepa.r20@gmail.com", "specialization": "Pediatrician", "hospital": "Lotus Hospital", "city": "Erode", "slots": "9:00 AM|1:00 PM"},
        {"name": "Dr. Manikandan T", "email": "manikandan.t21@gmail.com", "specialization": "Cardiologist", "hospital": "GH Hospital", "city": "Erode", "slots": "11:00 AM|4:00 PM"},
        {"name": "Dr. Shalini M", "email": "shalini.m22@gmail.com", "specialization": "Gynecologist", "hospital": "Sudha Hospital", "city": "Erode", "slots": "10:30 AM|3:30 PM"},
        {"name": "Dr. Prakash V", "email": "prakash.v23@gmail.com", "specialization": "Neurologist", "hospital": "KG Hospital", "city": "Erode", "slots": "2:00 PM|6:00 PM"},
        {"name": "Dr. Sangeetha K", "email": "sangeetha.k24@gmail.com", "specialization": "ENT Specialist", "hospital": "City Hospital", "city": "Tiruppur", "slots": "9:30 AM|1:30 PM"},
        {"name": "Dr. Dinesh Kumar", "email": "dinesh.kumar25@gmail.com", "specialization": "Dentist", "hospital": "Smile Dental", "city": "Tiruppur", "slots": "10:00 AM|5:00 PM"},
        {"name": "Dr. Balaji R", "email": "balaji.r26@gmail.com", "specialization": "General Physician", "hospital": "GH Hospital", "city": "Tirunelveli", "slots": "8:00 AM|12:00 PM"},
        {"name": "Dr. Revathi S", "email": "revathi.s27@gmail.com", "specialization": "Pediatrician", "hospital": "Annai Hospital", "city": "Tirunelveli", "slots": "1:00 PM|5:00 PM"},
        {"name": "Dr. Saravanan M", "email": "saravanan.m28@gmail.com", "specialization": "Orthopedic", "hospital": "Shifa Hospital", "city": "Tirunelveli", "slots": "2:30 PM|6:30 PM"},
        {"name": "Dr. Kavitha R", "email": "kavitha.r29@gmail.com", "specialization": "Gynecologist", "hospital": "Rajaji Hospital", "city": "Madurai", "slots": "10:00 AM|3:00 PM"},
        {"name": "Dr. Ajith Kumar", "email": "ajith.kumar30@gmail.com", "specialization": "Cardiologist", "hospital": "Apollo Hospital", "city": "Madurai", "slots": "11:00 AM|4:00 PM"},
        {"name": "Dr. Naveen Raj", "email": "naveen.raj31@gmail.com", "specialization": "Neurologist", "hospital": "Global Hospital", "city": "Trichy", "slots": "12:00 PM|5:00 PM"},
        {"name": "Dr. Keerthi S", "email": "keerthi.s32@gmail.com", "specialization": "Dermatologist", "hospital": "KMC Hospital", "city": "Trichy", "slots": "10:30 AM|2:30 PM"},
        {"name": "Dr. Pradeep K", "email": "pradeep.k33@gmail.com", "specialization": "General Physician", "hospital": "GH Hospital", "city": "Trichy", "slots": "9:00 AM|1:00 PM"},
        {"name": "Dr. Uma Maheshwari", "email": "uma.maheshwari34@gmail.com", "specialization": "Gynecologist", "hospital": "Kauvery Hospital", "city": "Trichy", "slots": "2:00 PM|6:00 PM"},
        {"name": "Dr. Karthika R", "email": "karthika.r35@gmail.com", "specialization": "Pediatrician", "hospital": "Child Care Hospital", "city": "Trichy", "slots": "9:30 AM|1:30 PM"},
        {"name": "Dr. Siva Kumar", "email": "siva.kumar36@gmail.com", "specialization": "Orthopedic", "hospital": "Ortho Care Hospital", "city": "Nagercoil", "slots": "3:00 PM|7:00 PM"},
        {"name": "Dr. Anbu Selvan", "email": "anbu.selvan37@gmail.com", "specialization": "Cardiologist", "hospital": "Heart Care", "city": "Nagercoil", "slots": "10:00 AM|2:00 PM"},
        {"name": "Dr. Raji P", "email": "raji.p38@gmail.com", "specialization": "Dermatologist", "hospital": "Skin Clinic", "city": "Nagercoil", "slots": "11:00 AM|3:00 PM"},
        {"name": "Dr. Vinoth K", "email": "vinoth.k39@gmail.com", "specialization": "ENT Specialist", "hospital": "ENT Care", "city": "Nagercoil", "slots": "9:00 AM|12:00 PM"},
        {"name": "Dr. Hari Prasad", "email": "hari.prasad40@gmail.com", "specialization": "Dentist", "hospital": "Dental Hub", "city": "Nagercoil", "slots": "2:00 PM|6:00 PM"},
        {"name": "Dr. Suresh Kumar", "email": "suresh.kumar41@gmail.com", "specialization": "General Physician", "hospital": "GH Hospital", "city": "Kanyakumari", "slots": "8:00 AM|11:00 AM"},
        {"name": "Dr. Divya Priya", "email": "divya.priya42@gmail.com", "specialization": "Pediatrician", "hospital": "Child Health", "city": "Kanyakumari", "slots": "1:00 PM|4:00 PM"},
        {"name": "Dr. Mohan Raj", "email": "mohan.raj43@gmail.com", "specialization": "Orthopedic", "hospital": "Ortho Center", "city": "Kanyakumari", "slots": "3:00 PM|6:00 PM"},
        {"name": "Dr. Nivetha R", "email": "nivetha.r44@gmail.com", "specialization": "Gynecologist", "hospital": "Women's Care", "city": "Kanyakumari", "slots": "10:00 AM|2:00 PM"},
        {"name": "Dr. Lokesh B", "email": "lokesh.b45@gmail.com", "specialization": "Cardiologist", "hospital": "Heart Clinic", "city": "Kanyakumari", "slots": "11:00 AM|3:00 PM"},
        {"name": "Dr. Arun Kumar", "email": "arun.kumar46@gmail.com", "specialization": "Neurologist", "hospital": "Brain Care", "city": "Hosur", "slots": "12:00 PM|5:00 PM"},
        {"name": "Dr. Swathi S", "email": "swathi.s47@gmail.com", "specialization": "Dermatologist", "hospital": "Skin Plus", "city": "Hosur", "slots": "10:00 AM|2:00 PM"},
        {"name": "Dr. Praveen Raj", "email": "praveen.raj48@gmail.com", "specialization": "Orthopedic", "hospital": "Ortho Hospital", "city": "Hosur", "slots": "3:00 PM|7:00 PM"},
        {"name": "Dr. Gayathri M", "email": "gayathri.m49@gmail.com", "specialization": "Pediatrician", "hospital": "Kids Care", "city": "Hosur", "slots": "9:00 AM|1:00 PM"},
        {"name": "Dr. Vasanth K", "email": "vasanth.k50@gmail.com", "specialization": "General Physician", "hospital": "City Clinic", "city": "Hosur", "slots": "8:30 AM|12:30 PM"}
    ]
    
    for doc_data in doctors_data:
        doctor = Doctor.query.filter_by(name=doc_data['name']).first()
        if not doctor:
            doctor = Doctor(
                name=doc_data['name'],
                email=doc_data['email'],
                specialization=doc_data['specialization'],
                hospital=doc_data['hospital'],
                city=doc_data['city'],
                available_slots=doc_data['slots'],
                password='123'
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

def get_appointments_for_doctor_agent(doctor_id, location=None, emergency_level=None, recent=False):
    with app.app_context():
        query = Appointment.query.filter_by(doctor_id=doctor_id)
        if location:
            query = query.filter(Appointment.location.ilike(f"%{location}%"))
        if emergency_level:
            # Handle user typing priority/priority_level etc.
            query = query.filter(Appointment.emergency_level == emergency_level)
            
        if recent:
            today = datetime.now().date()
            query = query.filter(Appointment.appointment_date >= today - timedelta(days=7))
        
        return query.order_by(Appointment.created_at.desc()).all()

doctor_agent = DoctorAgent(
    db_models={'Doctor': Doctor, 'Appointment': Appointment, 'User': User},
    query_appointments_func=get_appointments_for_doctor_agent
)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS preflight requests from CORS
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
            
        if 'user_id' not in session:
            if request.path.startswith('/api/') or request.is_json:
                return jsonify({'success': False, 'error': 'Not authenticated'}), 401
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function

def doctor_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS preflight requests from CORS
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

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
        'email': d.email,
        'specialization': d.specialization,
        'hospital': d.hospital,
        'city': d.city,
        'available_slots': d.available_slots,
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
        'location': a.location,
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
    identifier = (data.get('doctor_name') or data.get('name') or data.get('identifier') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'success': False, 'error': 'identifier and password are required'}), 400

    doctor = Doctor.query.filter(
        (Doctor.name == identifier) | (Doctor.email == identifier.lower()),
        Doctor.password == password
    ).first()
    
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


@app.route('/api/doctor/register', methods=['POST'])
def api_doctor_register():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    specialization = (data.get('specialization') or '').strip()
    password = data.get('password') or ''
    hospital = (data.get('hospital') or '').strip()
    city = (data.get('city') or '').strip()
    available_slots = (data.get('available_slots') or '').strip()
    consultation_duration = int(data.get('consultation_duration') or 30)

    if not name or not email or not specialization or not password:
        return jsonify({'success': False, 'error': 'name, email, specialization, and password are required'}), 400

    if Doctor.query.filter_by(name=name).first():
        return jsonify({'success': False, 'error': 'A doctor with this name already exists'}), 409
    if Doctor.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email already registered'}), 409

    new_doctor = Doctor(
        name=name,
        email=email,
        specialization=specialization,
        password=password,
        hospital=hospital,
        city=city,
        available_slots=available_slots,
        consultation_duration=consultation_duration
    )
    db.session.add(new_doctor)
    db.session.commit()

    return jsonify({'success': True, 'doctor': serialize_doctor(new_doctor)})


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
    chat_id = data.get('chat_id')
    user_id = session.get('user_id')
    
    # Create a new chat if chat_id not provided or doesn't exist
    if not chat_id:
        chat_id = str(int(time.time() * 1000))
        
    chat_record = Chat.query.get(chat_id)
    if not chat_record:
        # Create Chat record with title from first message
        # Always use the message content as title (up to 50 chars)
        chat_title = user_message.strip()[:50] if user_message.strip() else 'New Conversation'
        
        new_chat = Chat(
            id=chat_id,
            user_id=user_id,
            title=chat_title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(new_chat)
        db.session.commit()
    
    # Get agent context for THIS SPECIFIC CHAT (isolated per chat_id)
    # Initialize agent_contexts dict if not exists
    if 'agent_contexts' not in session:
        session['agent_contexts'] = {}
    
    # Get context for this chat, default to IDLE if new chat
    session_context = session['agent_contexts'].get(chat_id, {'state': 'IDLE'})
    
    # Process message through agent
    result = patient_agent.process_message(user_message, session_context, user_id)
    
    # Update session context for THIS SPECIFIC CHAT
    session['agent_contexts'][chat_id] = result.get('session_context')
    session.modified = True  # Mark session as modified so Flask saves it
    
    # Always save to chat history (both normal and booking flow)
    # Extract response info
    response_text = result.get('response', '')
    analysis = result.get('analysis', {})
    
    # Only save if response is not a system message like 'FINALIZING'
    if response_text != 'FINALIZING':
        chat_history = ChatHistory(
            user_id=user_id,
            chat_id=chat_id,
            message=user_message,
            response=response_text,
            detected_symptoms=','.join(analysis.get('symptoms_detected', [])) if analysis.get('symptoms_detected') else None,
            emergency_detected=(analysis.get('emergency_level') == 'emergency') if analysis.get('emergency_level') else False,
            severity=analysis.get('severity_score', 0) if analysis.get('severity_score') else 0
        )
        db.session.add(chat_history)
        db.session.commit()
        
        # Update chat timestamp to mark as recently updated
        chat = Chat.query.get(chat_id)
        if chat:
            chat.updated_at = datetime.utcnow()
            db.session.commit()
    
    # Handle finalized booking from agent
    if result.get('complete') and response_text == 'FINALIZING':
        ctx = result.get('session_context', {})
        
        # Create Appointment in DB
        appt = Appointment(
            user_id=user_id,
            patient_name=ctx.get('patient_name', ''),
            age=ctx.get('age', 0),
            gender=ctx.get('gender', 'Other'),
            contact_number=ctx.get('contact_number', ''),
            location=ctx.get('location', ''),
            problem=ctx.get('symptoms', ''),
            doctor_id=ctx.get('doctor_id', 1),
            appointment_date=datetime.strptime(ctx.get('appointment_date', ''), '%Y-%m-%d').date(),
            start_time=ctx.get('start_time', ''),
            emergency_level=ctx.get('emergency_level', 'normal'),
            severity_score=ctx.get('severity_score', 5),
            status='pending'
        )
        db.session.add(appt)
        db.session.commit()
        
        # Save booking confirmation to chat history
        confirmation = f"""✅ **Your appointment has been booked successfully.**

**Appointment Details:**
- **Patient Name:** {ctx.get('patient_name', '')}
- **Appointment Date:** {ctx.get('appointment_date', '')}
- **Appointment Time:** {ctx.get('start_time', '')}
- **Doctor Name:** {ctx.get('doctor_name', '')}
- **Symptoms:** {ctx.get('symptoms', '')}
- **Contact Number:** {ctx.get('contact_number', '')}

I have sent your request to the doctor. Is there anything else I can help you with? ❤️"""

        # Save confirmation message to history
        chat_history = ChatHistory(
            user_id=user_id,
            chat_id=chat_id,
            message=user_message,
            response=confirmation,
            detected_symptoms=ctx.get('symptoms', ''),
            emergency_detected=False,
            severity=ctx.get('severity_score', 5)
        )
        db.session.add(chat_history)
        db.session.commit()
        
        # Clear agent context ONLY FOR THIS CHAT after completion
        if 'agent_contexts' in session:
            session['agent_contexts'].pop(chat_id, None)
            session.modified = True
        
        return jsonify({
            'success': True,
            'response': confirmation,
            'complete': True,
            'session_context': ctx,
            'ui_type': None,
            'options': [],
            'chat_id': chat_id,
            'booking_active': False
        })
    
    # Build response with all necessary fields for frontend
    response_data = {
        'success': True,
        'response': result.get('response', ''),
        'ui_type': result.get('ui_type'),
        'options': result.get('options', []),
        'session_context': result.get('session_context', {}),
        'emergency_level': analysis.get('emergency_level') if analysis else None,
        'severity': analysis.get('severity_score') if analysis else None,
        'complete': result.get('complete', False),
        'chat_id': chat_id,
        'chat_title': Chat.query.get(chat_id).title if Chat.query.get(chat_id) else 'Chat',
        'booking_active': result.get('session_context', {}).get('state', 'IDLE') != 'IDLE'
    }
    
    return jsonify(response_data)

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
    location = data.get('location', '')
    problem = data.get('problem')
    doctor_id = data.get('doctor_id')
    symptoms_analysis = data.get('symptoms_analysis', '')
    emergency_level = data.get('emergency_level', 'normal checkup')
    severity = data.get('severity', 5)
    
    appointment_date_str = data.get('appointment_date')
    start_time = data.get('start_time')
    
    appointment_date = None
    if appointment_date_str:
        try:
            appointment_date = datetime.strptime(appointment_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    # Create appointment
    appointment = Appointment(
        user_id=user_id,
        patient_name=patient_name,
        age=age,
        gender=gender,
        contact_number=contact_number,
        location=location,
        problem=problem,
        symptoms_analysis=symptoms_analysis,
        doctor_id=doctor_id,
        appointment_date=appointment_date,
        start_time=start_time,
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



# Chat Management Endpoints (for ChatGPT-like sidebar)

@app.route('/get_all_chats', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def get_all_chats():
    """Get all chats for the current user that have messages, ordered by most recent"""
    user_id = session.get('user_id')
    
    # Use a JOIN to reliably get only chats with messages
    # This prevents empty chats from appearing in the list
    chats = db.session.query(Chat).join(
        ChatHistory, Chat.id == ChatHistory.chat_id
    ).filter(
        Chat.user_id == user_id,
        ChatHistory.user_id == user_id
    ).distinct().order_by(Chat.updated_at.desc()).all()
    
    print(f"DEBUG get_all_chats: user_id={user_id}, found {len(chats)} chats")
    for chat in chats:
        print(f"  - chat_id={chat.id}, title={chat.title}")
    
    return jsonify({
        'success': True,
        'chats': [
            {
                'id': chat.id,
                'title': chat.title,
                'created_at': chat.created_at.isoformat()
            }
            for chat in chats
        ]
    })

@app.route('/get_chat_messages/<chat_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
@login_required
def get_chat_messages(chat_id):
    """Get all messages for a specific chat"""
    user_id = session.get('user_id')
    
    # Verify chat belongs to user OR chat has messages from this user
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
    chat_messages = ChatHistory.query.filter_by(chat_id=chat_id, user_id=user_id).all()
    
    # Debug logging
    print(f"DEBUG get_chat_messages: chat_id={chat_id}, user_id={user_id}")
    print(f"  Chat exists: {chat is not None}")
    print(f"  ChatHistory count: {len(chat_messages)}")
    
    # If no chat record exists but there are messages, or chat exists, allow access
    if not chat and not chat_messages:
        print(f"  ERROR: Neither Chat nor ChatHistory found for chat_id={chat_id}, user_id={user_id}")
        return jsonify({'success': False, 'error': 'Chat not found'}), 404
    
    # Get all messages ordered by timestamp
    messages = ChatHistory.query.filter_by(chat_id=chat_id, user_id=user_id).order_by(ChatHistory.timestamp.asc()).all()
    
    return jsonify({
        'success': True,
        'messages': [
            {
                'message': msg.message,
                'response': msg.response,
                'timestamp': msg.timestamp.isoformat()
            }
            for msg in messages
        ]
    })

@app.route('/delete_chat/<chat_id>', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def delete_chat(chat_id):
    """Delete a chat and all its messages"""
    user_id = session.get('user_id')
    
    # Verify chat belongs to user
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
    if not chat:
        return jsonify({'success': False, 'error': 'Chat not found'}), 404
    
    # Delete all messages in the chat
    ChatHistory.query.filter_by(chat_id=chat_id).delete()
    
    # Delete the chat
    db.session.delete(chat)
    db.session.commit()
    
    return jsonify({'success': True})

# DOCTOR CHAT ENDPOINTS
@app.route('/api/doctor/get_all_chats', methods=['GET'])
@cross_origin(supports_credentials=True)
@doctor_login_required
def api_doctor_get_all_chats():
    doctor_id = session.get('doctor_id')
    chats = Chat.query.filter_by(doctor_id=doctor_id).order_by(Chat.updated_at.desc()).all()
    return jsonify({
        'success': True,
        'chats': [{'id': c.id, 'title': c.title, 'created_at': c.created_at.isoformat()} for c in chats]
    })

@app.route('/api/doctor/get_chat_messages/<chat_id>', methods=['GET'])
@cross_origin(supports_credentials=True)
@doctor_login_required
def api_doctor_get_chat_messages(chat_id):
    doctor_id = session.get('doctor_id')
    messages = ChatHistory.query.filter_by(chat_id=chat_id, doctor_id=doctor_id).order_by(ChatHistory.timestamp.asc()).all()
    return jsonify({
        'success': True,
        'messages': [{'message': m.message, 'response': m.response, 'timestamp': m.timestamp.isoformat()} for m in messages]
    })

@app.route('/api/doctor/delete_chat/<chat_id>', methods=['POST'])
@cross_origin(supports_credentials=True)
@doctor_login_required
def api_doctor_delete_chat(chat_id):
    doctor_id = session.get('doctor_id')
    ChatHistory.query.filter_by(chat_id=chat_id, doctor_id=doctor_id).delete()
    Chat.query.filter_by(id=chat_id, doctor_id=doctor_id).delete()
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/doctor/send_message', methods=['POST'])
@cross_origin(supports_credentials=True)
@doctor_login_required
def api_doctor_send_message():
    data = request.get_json()
    user_message = data.get('message', '')
    chat_id = data.get('chat_id')
    doctor_id = session.get('doctor_id')
    
    if not chat_id:
        chat_id = "doc_" + str(int(time.time() * 1000))
        
    chat_record = Chat.query.get(chat_id)
    if not chat_record:
        chat_title = user_message.strip()[:50] if user_message.strip() else 'Doctor Consultation'
        new_chat = Chat(id=chat_id, doctor_id=doctor_id, title=chat_title)
        db.session.add(new_chat)
        db.session.commit()
    
    if 'doctor_contexts' not in session:
        session['doctor_contexts'] = {}
    
    session_context = session['doctor_contexts'].get(chat_id, {'state': 'IDLE'})
    
    # Process through DoctorAgent
    result = doctor_agent.process_doctor_query(user_message, session_context, doctor_id)
    
    session['doctor_contexts'][chat_id] = result.get('session_context')
    session.modified = True
    
    response_text = result.get('response', '')
    
    chat_history = ChatHistory(
        doctor_id=doctor_id,
        chat_id=chat_id,
        message=user_message,
        response=response_text
    )
    db.session.add(chat_history)
    
    chat = Chat.query.get(chat_id)
    if chat:
        chat.updated_at = datetime.utcnow()
        
    db.session.commit()
    
    return jsonify({
        'success': True,
        'response': response_text,
        'chat_id': chat_id,
        'chat_title': chat.title if chat else 'Chat'
    })


@app.route('/api/appointments/delete/<int:appointment_id>', methods=['POST', 'DELETE'])
@cross_origin(supports_credentials=True)
@login_required
def api_delete_appointment(appointment_id):
    user_id = session.get('user_id')
    appointment = Appointment.query.filter_by(id=appointment_id, user_id=user_id).first()
    
    if not appointment:
        return jsonify({'success': False, 'message': 'Appointment not found'}), 404
        
    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Appointment deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/doctor/appointments/delete/<int:appointment_id>', methods=['POST', 'DELETE'])
@cross_origin(supports_credentials=True)
@doctor_login_required
def api_doctor_delete_appointment(appointment_id):
    doctor_id = session.get('doctor_id')
    appointment = Appointment.query.filter_by(id=appointment_id, doctor_id=doctor_id).first()
    
    if not appointment:
        return jsonify({'success': False, 'message': 'Appointment not found'}), 404
        
    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Appointment deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)