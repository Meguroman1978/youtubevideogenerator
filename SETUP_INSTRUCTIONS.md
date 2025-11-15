# 📝 Complete Setup Instructions

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] Git installed (optional, for version control)

## 🔧 Step-by-Step Setup

### Step 1: Install Node.js

**macOS:**
\`\`\`bash
brew install node
\`\`\`

**Ubuntu/Debian:**
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

### Step 2: Install FFmpeg

**macOS:**
\`\`\`bash
brew install ffmpeg
\`\`\`

**Ubuntu/Debian:**
\`\`\`bash
sudo apt-get update
sudo apt-get install ffmpeg
\`\`\`

**Windows:**
1. Download from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract to `C:\\ffmpeg`
3. Add `C:\\ffmpeg\\bin` to PATH

**Verify Installation:**
\`\`\`bash
ffmpeg -version
\`\`\`

### Step 3: Install Project Dependencies

\`\`\`bash
cd /home/user/webapp
npm install
\`\`\`

This will install all required packages (~411 packages).

### Step 4: Get API Keys

#### 4.1 OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Name it "AI Video Generator"
5. Copy the key (starts with `sk-`)
6. **Important**: You'll need to add billing information

**Cost Estimate**: ~$0.01 per video

#### 4.2 ElevenLabs API Key

1. Go to https://elevenlabs.io/
2. Sign up for free account (free tier available)
3. Go to Profile → API Keys
4. Copy your API key
5. Free tier includes 10,000 characters/month

**Cost Estimate**: ~$0.03 per video (15-20 seconds)

#### 4.3 PiAPI Key

1. Go to https://piapi.ai/
2. Sign up and complete registration
3. Go to Dashboard → API Keys
4. Copy your API key
5. Add credits to your account

**Cost Estimate**: ~$1.38 per video
- Flux images: $0.075 (5 images × $0.015)
- Kling videos: $1.30 (5 videos × $0.26 std mode)

#### 4.4 Google Cloud / YouTube API

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name: "AI Video Generator"
   - Click "Create"

3. **Enable YouTube Data API v3**
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure consent screen:
     - User Type: External
     - App name: "AI Video Generator"
     - Add your email
     - Add scopes: `youtube.upload`, `youtube.force-ssl`
     - Add test users (your email)
     - Save and continue
   
5. **Configure OAuth Client**
   - Application type: "Web application"
   - Name: "AI Video Generator Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
   - Click "Create"

6. **Copy Credentials**
   - Copy "Client ID" (looks like: `xxxxx.apps.googleusercontent.com`)
   - Copy "Client Secret"
   - Download JSON (optional, for backup)

**Cost**: Free (within quota limits)

### Step 5: Configure Environment Variables

1. **Copy the example file:**
   \`\`\`bash
   cd /home/user/webapp
   cp .env.example .env
   \`\`\`

2. **Edit .env file:**
   \`\`\`bash
   nano .env
   # or use any text editor
   \`\`\`

3. **Add your API keys:**
   \`\`\`env
   # OpenAI API
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

   # ElevenLabs API
   ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

   # PiAPI
   PIAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

   # Google OAuth (YouTube API)
   GOOGLE_CLIENT_ID=xxxxx-xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   \`\`\`

4. **Save the file** (Ctrl+X, Y, Enter if using nano)

### Step 6: Verify Setup

Run a health check:

\`\`\`bash
cd /home/user/webapp
npm run dev:server
\`\`\`

In another terminal:
\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

Expected output:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "env": {
    "openai": true,
    "elevenlabs": true,
    "piapi": true,
    "google": true
  }
}
\`\`\`

All values should be `true`.

### Step 7: Start the Application

\`\`\`bash
npm run dev
\`\`\`

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

Open http://localhost:5173 in your browser.

## 🎯 First Video Generation

### Test with a Simple Keyword

1. Enter keyword: `"Artificial Intelligence"`
2. Click "Generate Video"
3. Wait for progress (8-12 minutes)
4. Preview the result
5. (Optional) Upload to YouTube

### Expected Timeline

- **Captions**: 10 seconds ✓
- **Images**: 2-3 minutes ⏳
- **Videos**: 5-8 minutes ⏳⏳
- **Audio**: 30 seconds ✓
- **Composition**: 1 minute ✓

**Total: ~8-12 minutes**

## 🐛 Troubleshooting

### Issue: "FFmpeg not found"

**Solution:**
\`\`\`bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Verify
ffmpeg -version
\`\`\`

### Issue: "API key invalid"

**Solution:**
1. Check `.env` file for typos
2. Ensure no extra spaces or quotes
3. Restart the server: `Ctrl+C` then `npm run dev`

### Issue: "Module not found"

**Solution:**
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Issue: "Port already in use"

**Solution:**
\`\`\`bash
# Change PORT in .env
PORT=3001

# Or kill existing process
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
\`\`\`

### Issue: "YouTube auth fails"

**Solution:**
1. Verify redirect URI matches exactly:
   - In Google Cloud Console
   - In `.env` file
2. Check OAuth consent screen is configured
3. Add your email as test user
4. Clear browser cookies and try again

### Issue: "Video generation timeout"

**Solution:**
1. PiAPI servers may be busy
2. Increase timeout in `server/services/piapi.service.ts`:
   \`\`\`typescript
   const maxAttempts = 300; // Increase this
   \`\`\`
3. Try again later

### Issue: "Out of memory"

**Solution:**
\`\`\`bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
\`\`\`

## 📊 Monitoring Costs

### Track API Usage

**OpenAI:**
- Dashboard: https://platform.openai.com/usage
- Check daily spending

**ElevenLabs:**
- Dashboard: https://elevenlabs.io/app/usage
- Monitor character usage

**PiAPI:**
- Dashboard: https://piapi.ai/dashboard
- Check credit balance

### Cost per Video

| Service | Cost |
|---------|------|
| OpenAI | $0.01 |
| ElevenLabs | $0.03 |
| PiAPI (Images) | $0.08 |
| PiAPI (Videos) | $1.30 |
| **Total** | **$1.42** |

**10 videos = ~$14.20**

## 🔒 Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore`
   - Keep API keys private

2. **Use environment-specific keys**
   - Development keys for testing
   - Production keys for live app

3. **Set API usage limits**
   - OpenAI: Set monthly budget
   - PiAPI: Set credit alerts

4. **Secure OAuth tokens**
   - Stored in `tokens/` directory
   - Not committed to Git

## 🚀 Production Deployment

### Option 1: Traditional VPS

1. **Prepare server:**
   \`\`\`bash
   # Install Node.js and FFmpeg
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs ffmpeg
   \`\`\`

2. **Deploy code:**
   \`\`\`bash
   git clone <your-repo>
   cd webapp
   npm install
   npm run build
   \`\`\`

3. **Set environment variables:**
   \`\`\`bash
   nano .env
   # Add production API keys
   \`\`\`

4. **Start with PM2:**
   \`\`\`bash
   npm install -g pm2
   pm2 start npm --name "ai-video-generator" -- start
   pm2 save
   pm2 startup
   \`\`\`

### Option 2: Docker

\`\`\`dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Update Google OAuth Redirect URI

For production, update in:
1. Google Cloud Console
2. `.env` file:
   \`\`\`env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   \`\`\`

## 📚 Additional Resources

- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical overview
- [OpenAI API Docs](https://platform.openai.com/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [PiAPI Docs](https://piapi.ai/docs)
- [YouTube API Docs](https://developers.google.com/youtube/v3)

## ✅ Setup Complete!

You're now ready to generate AI videos! 🎉

Start with:
\`\`\`bash
npm run dev
\`\`\`

Then open http://localhost:5173

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.
