# Gemini API Key Renewal Guide

## Issue
The current Gemini API key has expired, causing YouTube video processing to fail with 500 errors.

## Log Evidence
```
{"error":{"code":400,"message":"API key expired. Please renew the API key.","status":"INVALID_ARGUMENT"}}
```

## Fix Steps

### 1. Get a New API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the new API key (starts with `AIza...`)

### 2. Update Server Environment
SSH into the server and update the `.env` file:

```powershell
ssh root@138.197.208.81
nano /root/.env
```

Find the line:
```
GEMINI_API_KEY=AIzaSyAm5Kj_e-M8Jxop72KpKOP-JgvvY7KMur8
```

Replace it with your new key:
```
GEMINI_API_KEY=YOUR_NEW_KEY_HERE
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### 3. Restart Backend Container
```bash
cd /root
docker compose -f docker-compose.prod.yml restart backend
```

### 4. Verify
Test a YouTube upload at https://thynkr.ca to confirm it works.

## Current Setup
- **GEMINI_API_KEY**: Used for YouTube video transcription (Gemini 2.5 Flash Lite)
- **GOOGLE_API_KEY**: Used for TTS (Google Cloud Text-to-Speech)
- Both are configured in `/root/.env` and mounted into the backend container

## Notes
- Gemini API keys from Google AI Studio are free tier but may have expiration/rate limits
- For production, consider using a service account with Cloud billing for better reliability
- The improved error handling (deployed 2026-02-10) now shows user-friendly messages instead of 500 errors

## Related Files
- Backend YouTube handler: [backend/src/routes/study.routes.ts](../backend/src/routes/study.routes.ts#L464)
- Docker config: [docker-compose.prod.yml](../docker-compose.prod.yml)
- Server env vars: `/root/.env` (on DigitalOcean droplet)
