#!/usr/bin/env python3
"""Test script to verify Gemini API connectivity and key validity"""

import google.generativeai as genai
import os
import json

# Configure Gemini API
GEMINI_API_KEY = 'AIzaSyA81_3WJr8C3-3wEXXD1RluIYyvf2lnLXc'
print(f"API Key: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-10:]}")

try:
    print("\n1. Configuring API...")
    genai.configure(api_key=GEMINI_API_KEY)
    print("✓ API configured successfully")
except Exception as e:
    print(f"✗ API configuration failed: {e}")
    exit(1)

try:
    print("\n2. Initializing model (gemini-2.5-flash)...")
    model = genai.GenerativeModel('gemini-2.5-flash')
    print("✓ Model initialized successfully")
except Exception as e:
    print(f"✗ Model initialization failed: {e}")
    exit(1)

try:
    print("\n3. Testing simple API call...")
    response = model.generate_content("Hello, respond with just 'OK'")
    print(f"✓ API call successful!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"✗ API call failed: {e}")
    import traceback
    print(traceback.format_exc())
    exit(1)

try:
    print("\n4. Testing medical JSON response...")
    test_prompt = """Respond ONLY with valid JSON:
{
  "response_text": "Hello",
  "emergency_level": "normal",
  "severity_score": 5,
  "suggested_specialization": "General Physician",
  "needs_appointment": false,
  "symptoms_detected": [],
  "intent_to_book": false
}"""
    response = model.generate_content(test_prompt)
    print(f"✓ JSON API call successful!")
    print(f"Response:\n{response.text}")
    
    # Try to parse JSON
    import re
    json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
    if json_match:
        parsed = json.loads(json_match.group())
        print(f"✓ JSON parsed successfully!")
        print(f"Parsed data: {json.dumps(parsed, indent=2)}")
    else:
        print("✗ No JSON found in response")
except Exception as e:
    print(f"✗ JSON API call failed: {e}")
    import traceback
    print(traceback.format_exc())
    exit(1)

print("\n✓ All tests passed! Gemini API is working correctly.")
