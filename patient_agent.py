import google.generativeai as genai
import os
import re
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash') 

class PatientAgent:
    def __init__(self, db_models, doctor_query_func):
        self.db_models = db_models
        self.doctor_query_func = doctor_query_func
        self.states = {
            'IDLE': 'IDLE',
            'ASK_BOOKING': 'ASK_BOOKING',
            'COLLECT_NAME': 'COLLECT_NAME',
            'COLLECT_AGE': 'COLLECT_AGE',
            'COLLECT_GENDER': 'COLLECT_GENDER',
            'COLLECT_CONTACT': 'COLLECT_CONTACT',
            'COLLECT_LOCATION': 'COLLECT_LOCATION',
            'COLLECT_EMERGENCY': 'COLLECT_EMERGENCY',
            'COLLECT_SYMPTOMS': 'COLLECT_SYMPTOMS',
            'COLLECT_DOCTOR': 'COLLECT_DOCTOR',
            'COLLECT_DATE': 'COLLECT_DATE',
            'COLLECT_TIME': 'COLLECT_TIME',
            'CONFIRM_BOOKING': 'CONFIRM_BOOKING'
        }

    def analyze_with_gemini(self, user_message, doctor_info):
        """Use Gemini to analyze symptoms and provide medical guidance in a caring way"""
        
        system_prompt = f"""You are a virtual hospital assistant, a polite and caring patient support assistant.
Follow these rules STRICTLY:

1. ONLY respond to medical/health-related queries. For non-medical questions, respond politely that you can only help with health concerns.

2. Always be empathetic, caring, and professional.

3. Map user symptoms to the most appropriate doctor specialization. Examples:
   - Eye/Vision problems -> Ophthalmologist
   - Heart/Chest pain -> Cardiologist
   - Skin problems -> Dermatologist
   - Bone/Fracture/Joint pain -> Orthopedic Doctor
   - Children/Infant health -> Pediatrician
   - General fever/Flu -> General Physician
   - Nerve/Brain/Headache -> Neurologist
   - Pregnancy/Women health -> Gynecologist
   - Ear/Nose/Throat -> ENT Specialist
   - Teeth/Gums -> Dentist

4. Current available doctors for context:
{chr(10).join([f"   - {d['name']} ({d['specialization']}) in {d.get('city', 'Unknown City')}" for d in doctor_info])}

5. If the user's query is health-related or they describe symptoms, provide brief helpful advice and then ALWAYS ask:
   "Would you like me to book a doctor appointment for you?"

User query: {user_message}

Provide your response in JSON format with these fields:
- response_text: Your polite and caring response. (Include the appointment question if relevant).
- emergency_level: "normal"/"urgent"/"emergency"
- severity_score: 1-10
- suggested_specialization: Suggested specialization (e.g., General Physician, Ophthalmologist, etc.)
- needs_appointment: true/false
- symptoms_detected: List of symptoms found
- intent_to_book: true/false
"""
        try:
            response = model.generate_content(system_prompt)
            # Find JSON part
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {
                'response_text': response.text,
                'emergency_level': 'normal',
                'severity_score': 5,
                'suggested_specialization': 'General Physician',
                'needs_appointment': False,
                'symptoms_detected': [],
                'intent_to_book': False
            }
        except Exception as e:
            error_msg = f"Gemini API error in agent: {str(e)}"
            import traceback
            print(error_msg)
            print(f"Full error: {traceback.format_exc()}")
            return {
                'response_text': f"I'm sorry, I'm having trouble processing that. How can I help with your health today? (Error: {str(e)[:50]})",
                'emergency_level': 'normal',
                'severity_score': 0,
                'suggested_specialization': 'General Physician',
                'needs_appointment': False,
                'symptoms_detected': [],
                'intent_to_book': False
            }

    def process_message(self, user_message, session_context, user_id):
        """Main entry point for processing user messages through the agent's states"""
        state = session_context.get('state', 'IDLE')
        user_message_lower = user_message.lower().strip()

        # If we are in the middle of a booking flow
        if state != 'IDLE':
            return self.handle_booking_flow(user_message, session_context, user_id)

        # Normal Healthcare Interaction
        # Get doctor info for Gemini context
        doctors = self.doctor_query_func()
        doctor_info = [{'name': d.name, 'specialization': d.specialization, 'city': d.city} for d in doctors]
        
        analysis = self.analyze_with_gemini(user_message, doctor_info)
        
        # If user wants to book or Gemini suggested it
        if analysis.get('intent_to_book'):
            session_context['state'] = 'COLLECT_NAME'
            session_context['emergency_level'] = analysis.get('emergency_level', 'normal')
            session_context['severity_score'] = analysis.get('severity_score', 5)
            session_context['suggested_specialization'] = analysis.get('suggested_specialization', 'General Physician')
            return {
                'response': analysis['response_text'] + "\n\nCertainly! Let's start the booking process. What is the **Patient's Full Name**?",
                'session_context': session_context,
                'analysis': analysis
            }
        elif analysis.get('needs_appointment'):
            session_context['state'] = 'ASK_BOOKING'
            session_context['emergency_level'] = analysis.get('emergency_level', 'normal')
            session_context['severity_score'] = analysis.get('severity_score', 5)
            session_context['suggested_specialization'] = analysis.get('suggested_specialization', 'General Physician')
            return {
                'response': analysis['response_text'], # Gemini prompt ensures it asks the question
                'session_context': session_context,
                'analysis': analysis
            }
        
        return {
            'response': analysis['response_text'],
            'session_context': session_context,
            'analysis': analysis
        }

    def handle_booking_flow(self, user_message, session_context, user_id):
        state = session_context.get('state')
        msg = user_message.strip()
        msg_lower = msg.lower()

        if state == 'ASK_BOOKING':
            if any(word in msg_lower for word in ['yes', 'yeah', 'sure', 'ok', 'book', 'please']):
                session_context['state'] = 'COLLECT_NAME'
                return {
                    'response': "Great! I'll help you book that. First, what is the **Patient's Full Name**?",
                    'session_context': session_context
                }
            else:
                session_context.clear()
                session_context['state'] = 'IDLE'
                return {
                    'response': "No problem. I'm still here if you have any other health questions. Take care! ❤️",
                    'session_context': session_context
                }

        elif state == 'COLLECT_NAME':
            if len(msg) < 2:
                return {'response': "Please provide a valid name. What is the patient's full name?", 'session_context': session_context}
            session_context['patient_name'] = msg
            session_context['state'] = 'COLLECT_AGE'
            return {'response': f"Got it, {msg}. How old is the patient?", 'session_context': session_context}

        elif state == 'COLLECT_AGE':
            try:
                # Find digits in message
                match = re.search(r'\d+', msg)
                if not match: raise ValueError()
                age = int(match.group())
                if age < 0 or age > 150: raise ValueError()
                session_context['age'] = age
                session_context['state'] = 'COLLECT_GENDER'
                
                return {
                    'response': "Thank you. What is the patient's gender?",
                    'session_context': session_context,
                    'ui_type': 'gender_selection',
                    'options': [
                        {'label': 'Male', 'value': 'Male'},
                        {'label': 'Female', 'value': 'Female'},
                        {'label': 'Other', 'value': 'Other'}
                    ]
                }
            except:
                return {'response': "Please provide a valid age (number between 0-150).", 'session_context': session_context}

        elif state == 'COLLECT_GENDER':
            gender = msg.capitalize()
            if 'male' in msg_lower and 'female' not in msg_lower: gender = 'Male'
            elif 'female' in msg_lower: gender = 'Female'
            elif 'other' in msg_lower: gender = 'Other'
            
            if gender not in ['Male', 'Female', 'Other']:
                return {'response': "Please specify: Male, Female, or Other.", 'session_context': session_context}
            
            session_context['gender'] = gender
            session_context['state'] = 'COLLECT_CONTACT'
            return {'response': "Understood. What is the **Contact Number** we can reach you at?", 'session_context': session_context}

        elif state == 'COLLECT_CONTACT':
            # Basic validation: at least 10 digits
            clean_phone = re.sub(r'\D', '', msg)
            if len(clean_phone) < 10:
                return {'response': "Please enter a valid contact number (at least 10 digits).", 'session_context': session_context}
            session_context['contact_number'] = msg
            session_context['state'] = 'COLLECT_LOCATION'
            return {'response': "Thank you. Where are you located? (e.g., Chennai, Madurai, Coimbatore etc.)", 'session_context': session_context}

        elif state == 'COLLECT_LOCATION':
            if len(msg) < 2:
                return {'response': "Please provide a valid location.", 'session_context': session_context}
            session_context['location'] = msg
            session_context['state'] = 'COLLECT_EMERGENCY'
            
            return {
                'response': "Got it. How would you rate the emergency level of your visit?",
                'session_context': session_context,
                'ui_type': 'emergency_selection',
                'options': [
                    {'label': '🔴 High', 'value': 'high'},
                    {'label': '🟠 Medium', 'value': 'medium'},
                    {'label': '🟡 Low', 'value': 'low'},
                    {'label': '🟢 Normal Checkup', 'value': 'normal checkup'}
                ]
            }

        elif state == 'COLLECT_EMERGENCY':
            clean_msg = msg_lower.replace('🔴', '').replace('🟠', '').replace('🟡', '').replace('🟢', '').strip()
            
            valid_levels = ['high', 'medium', 'low', 'normal checkup']
            level = 'normal checkup'
            for v in valid_levels:
                if v in clean_msg:
                    level = v
                    break
                    
            session_context['emergency_level'] = level
            session_context['state'] = 'COLLECT_SYMPTOMS'
            return {'response': "Thank you. Can you briefly describe the **Symptoms or Health Concern** for this appointment?", 'session_context': session_context}

        elif state == 'COLLECT_SYMPTOMS':
            if len(msg) < 5:
                return {'response': "Please describe the symptoms in a bit more detail.", 'session_context': session_context}
            session_context['symptoms'] = msg
            
            # RE-ANALYZE Symptoms here – crucial for cases where user didn't mention symptoms initially
            try:
                # Get current doctor info for context
                doctors_all = self.doctor_query_func()
                doctor_info = [{'name': d.name, 'specialization': d.specialization, 'city': d.city} for d in doctors_all]
                analysis = self.analyze_with_gemini(msg, doctor_info)
                spec = analysis.get('suggested_specialization', 'General Physician')
            except:
                spec = 'General Physician'

            session_context['suggested_specialization'] = spec
            city = session_context.get('location')
            
            # Logic Step 1: Specific Specialist in patient's City
            doctors = self.doctor_query_func(spec, city)
            
            # Logic Step 2: Fallback to General Physician in SAME City
            if not doctors and spec != 'General Physician':
                doctors = self.doctor_query_func('General Physician', city)
                if doctors:
                    spec = 'General Physician (Recommended Alternative)'
            
            # Logic Step 3: Fallback to specific Specialist in ANY City
            if not doctors:
                doctors = self.doctor_query_func(spec)
                
            # Logic Step 4: Fallback to anything in same city
            if not doctors:
                doctors = self.doctor_query_func(city=city)[:5]
                
            # Logic Step 5: Absolute fallback
            if not doctors:
                doctors = self.doctor_query_func()[:5]

            doc_list = "\n".join([f"• {d.name} ({d.specialization}) in {d.city}" for d in doctors])
            session_context['state'] = 'COLLECT_DOCTOR'
            
            # Store doctors info for frontend UI
            session_context['available_doctors'] = [
                {'id': d.id, 'name': d.name, 'specialization': d.specialization, 'city': d.city}
                for d in doctors
            ]
            
            return {
                'response': f"Based on your symptoms, I recommend seeing a **{spec}**. \n\nHere are the available doctors in **{city}** (or nearby):\n{doc_list}\n\nWhich doctor would you prefer?",
                'session_context': session_context,
                'ui_type': 'doctor_selection',
                'options': [
                    {'label': f"{d.name} ({d.specialization}) - {d.city}", 'value': str(d.id)}
                    for d in doctors
                ] + [{'label': 'Any Available Doctor', 'value': 'any'}]
            }

        elif state == 'COLLECT_DOCTOR':
            selected_doc = None
            if msg == 'any' or 'any' in msg_lower:
                spec = session_context.get('suggested_specialization')
                selected_doc = self.doctor_query_func(spec)[0] if self.doctor_query_func(spec) else self.doctor_query_func()[0]
            else:
                # Try to match by ID first (from button click)
                try:
                    doc_id = int(msg)
                    all_docs = self.doctor_query_func()
                    for d in all_docs:
                        if d.id == doc_id:
                            selected_doc = d
                            break
                except:
                    # Try to match by name
                    all_docs = self.doctor_query_func()
                    for d in all_docs:
                        if d.name.lower() in msg_lower:
                            selected_doc = d
                            break
            
            if not selected_doc:
                return {'response': "I couldn't find that doctor. Please choose one from the list.", 'session_context': session_context}
            
            session_context['doctor_id'] = selected_doc.id
            session_context['doctor_name'] = selected_doc.name
            session_context['state'] = 'COLLECT_DATE'
            
            # Generate date options (next 7 days)
            date_options = []
            today = datetime.now().date()
            for i in range(7):
                future_date = today + timedelta(days=i)
                label = 'Today' if i == 0 else 'Tomorrow' if i == 1 else future_date.strftime('%a, %b %d')
                date_options.append({'label': label, 'value': future_date.isoformat()})
            
            session_context['date_options'] = date_options
            
            return {
                'response': f"Great! I've selected **{selected_doc.name}**. What **Date** would you like the appointment for?",
                'session_context': session_context,
                'ui_type': 'date_selection',
                'options': date_options
            }

        elif state == 'COLLECT_DATE':
            # Try to parse date from selection
            target_date = None
            try:
                # If it looks like ISO format (from button click)
                if re.match(r'\d{4}-\d{2}-\d{2}', msg):
                    target_date = datetime.strptime(msg, '%Y-%m-%d').date()
                else:
                    raise ValueError()
            except:
                # Try natural language
                if 'today' in msg_lower: target_date = datetime.now().date()
                elif 'tomorrow' in msg_lower: target_date = datetime.now().date() + timedelta(days=1)
                else:
                    try:
                        match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', msg)
                        if match:
                            target_date = datetime.strptime(match.group(1), '%Y-%m-%d').date()
                    except: pass
            
            if not target_date:
                return {'response': "Please provide the date or select from the options.", 'session_context': session_context}
            
            session_context['appointment_date'] = target_date.isoformat()
            session_context['state'] = 'COLLECT_TIME'
            
            # Generate time options (9 AM to 5 PM, 30 min intervals)
            time_options = []
            for hour in range(9, 17):
                for minute in [0, 30]:
                    time_str = f"{hour:02d}:{minute:02d}"
                    display_str = datetime.strptime(time_str, '%H:%M').strftime('%I:%M %p')
                    time_options.append({'label': display_str, 'value': time_str})
            
            session_context['time_options'] = time_options
            
            return {
                'response': f"Perfect! Appointment set for **{target_date.strftime('%A, %B %d, %Y')}**. What **Time** would you prefer?",
                'session_context': session_context,
                'ui_type': 'time_selection',
                'options': time_options
            }

        elif state == 'COLLECT_TIME':
            # Validate time format
            if not re.search(r'\d{2}:\d{2}', msg):
                return {'response': "Please select a time from the options or specify time in HH:MM format.", 'session_context': session_context}
            
            session_context['start_time'] = msg
            session_context['state'] = 'CONFIRM_BOOKING'
            
            # Format date nicely
            appt_date = datetime.fromisoformat(session_context['appointment_date'])
            formatted_date = appt_date.strftime('%A, %B %d, %Y')
            
            summary = f"""### 🏥 Appointment Confirmation
**Patient:** {session_context.get('patient_name', '')} ({session_context.get('age', '')}y, {session_context.get('gender', '')})
**Contact:** {session_context.get('contact_number', '')}
**Location:** {session_context.get('location', '')}
**Emergency Level:** {str(session_context.get('emergency_level', '')).capitalize()}
**Symptoms:** {session_context.get('symptoms', '')}
**Doctor:** {session_context.get('doctor_name', '')}
**Date:** {formatted_date}
**Time:** {msg}

Please confirm this appointment."""
            return {
                'response': summary,
                'session_context': session_context,
                'ui_type': 'confirmation',
                'options': [
                    {'label': '✅ Confirm & Book', 'value': 'yes'},
                    {'label': '❌ Cancel', 'value': 'no'}
                ]
            }

        elif state == 'CONFIRM_BOOKING':
            if any(word in msg_lower for word in ['yes', 'yeah', 'correct', 'ok', 'sure']):
                # Signal to app.py to finalize the booking in DB
                return {
                    'response': 'FINALIZING',
                    'session_context': session_context,
                    'complete': True
                }
            else:
                session_context.clear()
                session_context['state'] = 'IDLE'
                return {
                    'response': "I've canceled the booking process. We can start over if you like, or you can ask me other questions.",
                    'session_context': session_context
                }

        return {'response': "I'm sorry, I got confused. Let's start over.", 'session_context': {'state': 'IDLE'}}
