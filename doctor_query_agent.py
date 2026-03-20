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

class DoctorAgent:
    def __init__(self, db_models, query_appointments_func):
        self.db_models = db_models
        self.query_appointments_func = query_appointments_func
        self.states = {
            'IDLE': 'IDLE',
            'PROCESSING': 'PROCESSING'
        }

    def process_doctor_query(self, user_message, session_context, doctor_id):
        """Process a message from a doctor to query patient data or get medical AI help"""
        
        # Get doctor info for context
        doctor = self.db_models['Doctor'].query.get(doctor_id)
        doctor_name = doctor.name if doctor else "Doctor"
        
        # Determine intent using Gemini
        intent_prompt = f"""You are a professional medical assistant for {doctor_name}.
Your job is to analyze the doctor's query and decide if they want to:
1. "QUERY_PATIENTS": List or filter patients/appointments (e.g., "show me high priority patients", "list appointments in Chennai", "recent patients").
2. "MEDICAL_AI": Discuss medical concerns, get a second opinion, or ask general medical questions.
3. "GENERAL": Anything else.

Doctor's query: "{user_message}"

Respond ONLY with a JSON object:
{{
  "intent": "QUERY_PATIENTS" | "MEDICAL_AI" | "GENERAL",
  "filters": {{
    "location": "string or null",
    "emergency_level": "high" | "medium" | "low" | "normal checkup" | null,
    "recent": boolean,
    "patient_name": "string or null"
  }},
  "medical_query": "The cleaned up medical question if intent is MEDICAL_AI"
}}
"""
        try:
            intent_response = model.generate_content(intent_prompt)
            json_match = re.search(r'\{.*\}', intent_response.text, re.DOTALL)
            intent_data = json.loads(json_match.group()) if json_match else {"intent": "GENERAL"}
            
            if intent_data.get('intent') == "QUERY_PATIENTS":
                # Call the query function
                filters = intent_data.get('filters', {})
                appointments = self.query_appointments_func(
                    doctor_id=doctor_id,
                    location=filters.get('location'),
                    emergency_level=filters.get('emergency_level'),
                    recent=filters.get('recent', False)
                )
                
                if not appointments:
                    return {
                        'response': f"I couldn't find any appointments matching those criteria for you, {doctor_name}.",
                        'session_context': session_context
                    }
                
                # Format the results using Gemini for a natural response
                results_str = "\n".join([
                    f"- Patient: {a.patient_name}\n  Age: {a.age}\n  Problem: {a.problem}\n  Location: {a.location}\n  Priority: {a.emergency_level}\n  Date: {a.appointment_date}\n  Time: {a.start_time}\n"
                    for a in appointments
                ])
                
                summary_prompt = f"""You are a professional medical coordinator assistant.
Format the following appointment data for {doctor_name} in a structured, easy-to-read list.
Categorize them if possible and highlight 'high' or 'urgent' priority cases at the top.

Appointments to summarize:
{results_str}
"""
                summary_response = model.generate_content(summary_prompt)
                return {
                    'response': summary_response.text,
                    'session_context': session_context,
                    'is_query': True,
                    'count': len(appointments)
                }
                
            elif intent_data.get('intent') == "MEDICAL_AI":
                medical_prompt = f"""You are a senior medical AI research consultant assisting {doctor_name}.
Discuss the medical concern below professionally. Provide evidence-based insights, possible differential diagnoses, or general guidance while reminding the doctor that this is AI assistance.

Doctor's Question: {intent_data.get('medical_query', user_message)}
"""
                medical_response = model.generate_content(medical_prompt)
                return {
                    'response': medical_response.text,
                    'session_context': session_context
                }
            
            else:
                # Default general response
                general_prompt = f"You are an AI assistant for {doctor_name}. Respond politely to their message: {user_message}"
                general_response = model.generate_content(general_prompt)
                return {
                    'response': general_response.text,
                    'session_context': session_context
                }
                
        except Exception as e:
            return {
                'response': f"I'm sorry, I encountered an error while processing your request: {str(e)}",
                'session_context': session_context
            }
