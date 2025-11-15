# 🚀 Quick Start Guide

## ⚡ Fast Setup (5 minutes)

### 1. Configure API Keys

Edit `.env` file and add your API keys:

\`\`\`bash
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
PIAPI_KEY=your-piapi-key

# YouTube OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
\`\`\`

### 2. Install FFmpeg

**macOS:**
\`\`\`bash
brew install ffmpeg
\`\`\`

**Ubuntu/Debian:**
\`\`\`bash
sudo apt-get install ffmpeg
\`\`\`

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### 3. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### 4. Use the App

1. Open http://localhost:5173 in your browser
2. Enter a keyword (e.g., "Artificial Intelligence")
3. Click "Generate Video"
4. Wait for the AI to create your video (3-10 minutes)
5. Preview the result
6. Click "Connect YouTube" to authorize
7. Upload your video to YouTube!

## 📝 Getting API Keys

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `.env` as `OPENAI_API_KEY`

### ElevenLabs
1. Visit https://elevenlabs.io/
2. Sign up for free account
3. Go to Profile → API Keys
4. Copy to `.env` as `ELEVENLABS_API_KEY`

### PiAPI
1. Visit https://piapi.ai/
2. Sign up and get API key
3. Copy to `.env` as `PIAPI_KEY`

### Google Cloud (YouTube)
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

## 🎯 First Video Generation

**Example Keywords:**
- "Artificial Intelligence"
- "Climate Change"
- "Machine Learning"
- "Quantum Computing"
- "Space Exploration"

**Expected Timeline:**
1. Captions: 10 seconds
2. Images: 2-3 minutes (5 images)
3. Videos: 5-8 minutes (5 videos)
4. Audio: 30 seconds
5. Composition: 1 minute

**Total: ~8-12 minutes**

## 💡 Tips

- Start with shorter keywords for faster generation
- Use "std" mode in Kling for lower cost ($0.26 vs $0.46 per 5s video)
- Generated videos are saved in `uploads/` folder
- Check progress in real-time on the UI
- First run may take longer due to AI model loading

## 🐛 Common Issues

**"FFmpeg not found"**
- Install FFmpeg and ensure it's in your PATH
- Test: `ffmpeg -version`

**"API key invalid"**
- Double-check your API keys in `.env`
- Restart the server after editing `.env`

**"Video generation timeout"**
- PiAPI servers may be busy
- Wait and try again
- Or increase timeout in `server/services/piapi.service.ts`

**"YouTube auth failed"**
- Verify redirect URI matches exactly
- Check OAuth credentials
- Enable YouTube Data API v3 in Google Cloud

## 📊 Cost per Video

Approximate costs (using standard quality):
- OpenAI: $0.01
- PiAPI Images: $0.075
- PiAPI Videos: $1.30
- ElevenLabs: $0.03
- **Total: ~$1.42 per video**

## 🎬 Next Steps

Once your first video is generated:
1. Download the video from the UI
2. Preview in the built-in player
3. Authorize YouTube
4. Upload with one click
5. Share your AI-generated content!

## 📞 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review API documentation for each service
- Open an issue on GitHub for bugs
- Contact support for integration help

Happy video generation! 🎉
