#!/usr/bin/env python3
"""List available Gemini models"""

import google.generativeai as genai

GEMINI_API_KEY = 'AIzaSyA81_3WJr8C3-3wEXXD1RluIYyvf2lnLXc'
genai.configure(api_key=GEMINI_API_KEY)

print("Available models:")
for model in genai.list_models():
    print(f"  - {model.name}")
    if model.supported_generation_methods:
        print(f"    Supported methods: {', '.join(model.supported_generation_methods)}")
