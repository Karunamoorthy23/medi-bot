import google.generativeai as genai
import os
import re
import json
from datetime import datetime, timedelta

# Configure Gemini API
GEMINI_API_KEY = 'AIzaSyA81_3WJr8C3-3wEXXD1RluIYyvf2lnLXc'
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

2. Always be empathetic, caring, and professional. Use phrases like "I understand," "I'm here to help," and "Take care."

3. Analyze symptoms and determine:
   - Emergency level (normal/urgent/emergency)
   - Severity score (1-10)
   - Suggested doctor specialization based on symptoms
   - Whether an appointment is recommended.

4. Current available doctors for context:
{chr(10).join([f"   - {d['name']} ({d['specialization']})" for d in doctor_info])}

5. If the user's query is health-related or they describe symptoms, provide brief helpful advice and then ALWAYS ask:
   "Would you like me to book a doctor appointment for you?"

6. If the user explicitly wants to book, set 'intent_to_book' to true.

User query: {user_message}

Provide your response in JSON format with these fields:
- response_text: Your polite and caring response. (Include the appointment question if relevant).
- emergency_level: "normal"/"urgent"/"emergency"
- severity_score: 1-10
- suggested_specialization: Suggested specialization (e.g., General Physician, Orthopedic Doctor, etc.)
- needs_appointment: true/false (true if health-related)
- symptoms_detected: List of symptoms found
- intent_to_book: true/false (if user said yes or wants to book)
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
        doctor_info = [{'name': d.name, 'specialization': d.specialization} for d in doctors]
        
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
                return {'response': "Thank you. What is the patient's gender? (Male/Female/Other)", 'session_context': session_context}
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
            session_context['state'] = 'COLLECT_SYMPTOMS'
            return {'response': "Thank you. Can you briefly describe the **Symptoms or Health Concern** for this appointment?", 'session_context': session_context}

        elif state == 'COLLECT_SYMPTOMS':
            if len(msg) < 5:
                return {'response': "Please describe the symptoms in a bit more detail.", 'session_context': session_context}
            session_context['symptoms'] = msg
            
            # Offer optional doctor selection
            spec = session_context.get('suggested_specialization', 'General Physician')
            doctors = self.doctor_query_func(spec)
            if not doctors: doctors = self.doctor_query_func()[:3]
            
            doc_list = "\n".join([f"• {d.name} ({d.specialization})" for d in doctors])
            session_context['state'] = 'COLLECT_DOCTOR'
            return {
                'response': f"Based on your symptoms, I recommend a **{spec}**. \n\nOur available doctors are:\n{doc_list}\n\nWhich doctor would you prefer? (You can also say 'any' or provide a name)",
                'session_context': session_context
            }

        elif state == 'COLLECT_DOCTOR':
            selected_doc = None
            if 'any' in msg_lower:
                spec = session_context.get('suggested_specialization')
                selected_doc = self.doctor_query_func(spec)[0] if self.doctor_query_func(spec) else self.doctor_query_func()[0]
            else:
                all_docs = self.doctor_query_func()
                for d in all_docs:
                    if d.name.lower() in msg_lower:
                        selected_doc = d
                        break
            
            if not selected_doc:
                return {'response': "I couldn't find that doctor. Please choose one from the list or say 'any'.", 'session_context': session_context}
            
            session_context['doctor_id'] = selected_doc.id
            session_context['doctor_name'] = selected_doc.name
            session_context['state'] = 'COLLECT_DATE'
            return {'response': f"Great, I've noted {selected_doc.name}. What **Date** would you like the appointment for? (e.g., YYYY-MM-DD or 'tomorrow')", 'session_context': session_context}

        elif state == 'COLLECT_DATE':
            target_date = None
            if 'today' in msg_lower: target_date = datetime.now().date()
            elif 'tomorrow' in msg_lower: target_date = datetime.now().date() + timedelta(days=1)
            else:
                try:
                    match = re.search(r'(\d{4}-\d{1,2}-\d{1,2})', msg)
                    if match:
                        target_date = datetime.strptime(match.group(1), '%Y-%m-%d').date()
                except: pass
            
            if not target_date:
                return {'response': "Please provide the date in YYYY-MM-DD format (e.g., 2024-12-25) or say 'tomorrow'.", 'session_context': session_context}
            
            session_context['appointment_date'] = target_date.isoformat()
            session_context['state'] = 'COLLECT_TIME'
            return {'response': "And what **Time** would you prefer? (e.g., 10:00 AM)", 'session_context': session_context}

        elif state == 'COLLECT_TIME':
            # Simple time validation (check for AM/PM or HH:MM)
            if not re.search(r'\d{1,2}:\d{2}', msg) and 'am' not in msg_lower and 'pm' not in msg_lower:
                return {'response': "Please specify a clear time, e.g., '10:30 AM' or '14:00'.", 'session_context': session_context}
            
            session_context['start_time'] = msg
            session_context['state'] = 'CONFIRM_BOOKING'
            
            summary = f"""### 🏥 Appointment Summary
**Patient:** {session_context['patient_name']} ({session_context['age']}y, {session_context['gender']})
**Contact:** {session_context['contact_number']}
**Symptoms:** {session_context['symptoms']}
**Doctor:** {session_context['doctor_name']}
**Date:** {session_context['appointment_date']}
**Time:** {session_context['start_time']}

Does this look correct? (Yes/No)"""
            return {'response': summary, 'session_context': session_context}

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
