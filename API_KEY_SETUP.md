# 🔐 API Key Setup Guide

## Your API Key Was Compromised ⚠️

Your Gemini API key (`apikey`) has been reported as leaked to Google and has been **disabled for security reasons**.

You need to generate a **new API key** from Google Cloud Console.

## Step 1: Generate a New API Key

### Option A: Using Google Cloud Console (Recommended for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select existing one
   - Click on project dropdown at the top
   - Click "NEW PROJECT"
   - Enter project name (e.g., "Medical Chatbot")
   - Click "CREATE"
4. Enable the Generative AI API
   - Search for "Generative AI" in the search bar
   - Click "Generative AI API"
   - Click "ENABLE"
5. Create API Key
   - Go to **Credentials** (left sidebar)
   - Click **"+ CREATE CREDENTIALS"**
   - Select **"API Key"**
   - Copy the generated key

### Option B: Using Google AI Studio (Easier for Development)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Get API Key"**
3. Click **"Create API key in new project"**
4. Copy the generated key

## Step 2: Add API Key to .env File

The `.env` file has already been created in your project root. Edit it:

```
.env
────────────────────────────
GEMINI_API_KEY=your-new-key-here
SECRET_KEY=your-secret-key
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:3000
```

Replace `your-new-key-here` with your actual new API key from Step 1.

## Step 3: Restart Your Application

1. Stop Flask: Press **Ctrl+C** in the terminal
2. Install new dependencies (if needed):
   ```bash
   pip install -r requirements.txt
   ```
3. Restart Flask:
   ```bash
   python app.py
   ```

## Step 4: Test the Chatbot

The chatbot should now work correctly! Try the full appointment booking flow.

## Security Best Practices ✅

- ✅ **Never** commit `.env` to GitHub
- ✅ **Never** hardcode API keys in your code
- ✅ Use environment variables for sensitive data
- ✅ Regenerate keys if they're ever exposed
- ✅ Use `.gitignore` to exclude `.env` files

## .gitignore Entry

Make sure your `.gitignore` includes:

```
.env
.env.local
instance/
__pycache__/
.DS_Store
```

This prevents accidental commits of sensitive files.

## Troubleshooting

### "GEMINI_API_KEY environment variable is not set"
- Check `.env` file exists in project root
- Check key is set: `GEMINI_API_KEY=your-key-here`
- Restart Flask after changing `.env`

### "403 API key reported as leaked"
- The key has been compromised
- Generate a new key from Google Cloud Console
- Update `.env` with new key
- Restart Flask

### "Invalid API Key"
- Check the key is copied correctly (no extra spaces)
- Verify the API is enabled in Google Cloud Console
- Generate a new key and try again

## Questions?

If you continue having issues:
1. Verify the API key is correct
2. Check that the `.env` file is in the project root directory
3. Make sure Flask is restarted after changing `.env`
4. Check browser console for any other errors (F12)

Good luck! 🚀
