#!/usr/bin/env python3
"""List available Gemini models"""

import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

print("Available models:")
for model in genai.list_models():
    print(f"  - {model.name}")
    if model.supported_generation_methods:
        print(f"    Supported methods: {', '.join(model.supported_generation_methods)}")
