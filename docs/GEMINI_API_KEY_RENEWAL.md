# Gemini Service Account Setup (COMPLETED)

## ✅ Migration Complete

As of **February 10, 2026**, Thynkr now uses **Google Cloud service account authentication** for Gemini, eliminating API key expiration issues.

### Current Setup
- **Authentication Method**: Service account JSON credentials (same as TTS)
- **Credentials File**: `/root/gemini-credentials.json` (mounted into Docker at `/app/gemini-credentials.json`)
- **Service Account**: `thynkr-gemini@gen-lang-client-0140949948.iam.gserviceaccount.com`
- **Permissions**: Generative Language User
- **Benefits**: No expiration, transparent billing, better monitoring

### Previous Issue (Resolved)
~~The Gemini API key was expiring periodically, causing YouTube video processing failures.~~

**Fixed:** Service accounts never expire and provide production-grade reliability.

## How It Works Now

### Backend
```typescript
// Uses GoogleAuth with service account JSON file
const auth = new GoogleAuth({
  keyFilename: process.env.GEMINI_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/generative-language']
});
const genai = new GoogleGenAI({ authClient: await auth.getClient() });
```

### Docker Configuration
```yaml
volumes:
  - /root/gemini-credentials.json:/app/gemini-credentials.json:ro
environment:
  GEMINI_APPLICATION_CREDENTIALS: /app/gemini-credentials.json
```

## If You Need to Regenerate Credentials

### 1. Go to Service Accounts
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find `thynkr-gemini@...`

### 2. Create New Key
1. Click the service account
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key** → **JSON**
4. Download the new JSON file

### 3. Upload to Server
```powershell
scp path\to\new-credentials.json root@138.197.208.81:/root/gemini-credentials.json
ssh root@138.197.208.81 "chmod 600 /root/gemini-credentials.json"
```

### 4. Restart Backend
```bash
cd /root
docker compose -f docker-compose.prod.yml restart backend
```

## Cost Monitoring

**Gemini 2.0 Flash Pricing:**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- Video: $0.075 per 1M tokens

**View usage:**
- [Google Cloud Console](https://console.cloud.google.com) → **Billing** → **Reports**
- Filter by: "Generative Language API"

**Set budget alerts:**
- **Billing** → **Budgets & alerts** → **CREATE BUDGET**
- Recommended: Alert at $5/month threshold

## Related Files
- Backend YouTube handler: [backend/src/routes/study.routes.ts](../backend/src/routes/study.routes.ts#L473)
- Docker config: [docker-compose.prod.yml](../docker-compose.prod.yml)
- Credentials: `/root/gemini-credentials.json` (on DigitalOcean droplet)

## Migration History
- **Before**: Free API keys (`GEMINI_API_KEY`) that expired periodically
- **After**: Service account credentials (billing-based, never expires)
- **Deploy Date**: February 10, 2026
- **Commit**: [3dd4796]
