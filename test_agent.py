#!/usr/bin/env python3
"""Test the PatientAgent with actual chatbot logic"""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from patient_agent import PatientAgent

# Mock doctor query function
def mock_doctor_query(specialization=None):
    class MockDoctor:
        def __init__(self, name, spec):
            self.name = name
            self.specialization = spec
    
    doctors = [
        MockDoctor('Dr. Smith', 'General Physician'),
        MockDoctor('Dr. Johnson', 'Orthopedic Doctor'),
    ]
    return doctors

# Initialize agent
agent = PatientAgent(
    db_models={},
    doctor_query_func=mock_doctor_query
)

# Test queries
test_messages = [
    "I have a headache and fever",
    "My arm is broken",
    "Hello"
]

print("Testing PatientAgent responses:\n")

for msg in test_messages:
    print(f"User: {msg}")
    result = agent.process_message(msg, {'state': 'IDLE'}, user_id=1)
    print(f"Response: {result['response']}\n")
    
    if result.get('analysis'):
        analysis = result['analysis']
        print(f"Analysis:")
        print(f"  - Emergency Level: {analysis.get('emergency_level')}")
        print(f"  - Severity: {analysis.get('severity_score')}")
        print(f"  - Suggested Doctor: {analysis.get('suggested_specialization')}")
        print(f"  - Needs Appointment: {analysis.get('needs_appointment')}")
        print(f"  - Symptoms: {analysis.get('symptoms_detected')}")
        print()
    print("-" * 80)
    print()
