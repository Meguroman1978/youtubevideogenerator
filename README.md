# 🎬 AI Video Generator - Automatic Video Creation & YouTube Upload

An intelligent web application that automatically generates educational videos from keywords using AI, complete with animated visuals, professional voiceover narration, and one-click YouTube upload functionality.

## ✨ Features

- **🤖 AI-Powered Story Generation**: Enter a keyword and AI creates a compelling 5-scene narrative
- **🎨 Automatic Image Generation**: AI generates high-quality images for each scene using Flux
- **🎥 Video Animation**: Converts static images into smooth animated videos using Kling
- **🎙️ Professional Voiceover**: Generates natural-sounding narration using ElevenLabs TTS
- **🎬 Video Composition**: Automatically merges scenes and synchronizes audio
- **📺 YouTube Integration**: One-click upload to YouTube with automatic metadata
- **📊 Real-time Progress**: Live progress tracking and status updates
- **🎯 Intuitive UI**: Clean, modern interface built with React

## 🏗️ Architecture

### Frontend (React + Vite + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI**: Custom CSS with modern design system
- **State Management**: React Hooks (useState, useEffect)

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Language**: TypeScript for type safety
- **Video Processing**: FFmpeg for video composition

### AI Services Integration
1. **OpenAI (GPT-4o-mini)**: Story generation and scene planning
2. **PiAPI**: 
   - Flux (txt2img): High-quality image generation
   - Kling (img2video): Image-to-video animation
3. **ElevenLabs**: Text-to-speech voice synthesis
4. **YouTube Data API v3**: Video upload and management

## 📋 Prerequisites

- Node.js 18+ and npm
- FFmpeg installed on your system
- API Keys for:
  - OpenAI
  - ElevenLabs
  - PiAPI (Flux + Kling)
  - Google Cloud (YouTube API)

## 🚀 Installation

### 1. Clone and Install Dependencies

\`\`\`bash
cd /home/user/webapp
npm install
\`\`\`

### 2. Configure Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and add your API keys:

\`\`\`env
# OpenAI API
OPENAI_API_KEY=sk-...

# ElevenLabs API
ELEVENLABS_API_KEY=...

# PiAPI (for Flux image generation and Kling video)
PIAPI_KEY=...

# Google OAuth (YouTube API)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Server
PORT=3000
NODE_ENV=development
\`\`\`

### 3. Set Up Google Cloud for YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: \`http://localhost:3000/api/auth/google/callback\`
5. Copy Client ID and Client Secret to your \`.env\` file

### 4. Install FFmpeg

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
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

## 🎮 Usage

### Development Mode

Run both frontend and backend concurrently:

\`\`\`bash
npm run dev
\`\`\`

This starts:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Production Build

\`\`\`bash
npm run build
npm start
\`\`\`

## 📖 API Documentation

### Video Generation Endpoints

#### POST /api/video/generate
Generate a new AI video project

**Request Body:**
\`\`\`json
{
  "keyword": "Artificial Intelligence",
  "language": "en",
  "style": "educational"
}
\`\`\`

**Response:**
\`\`\`json
{
  "projectId": "uuid-here",
  "status": "pending"
}
\`\`\`

#### GET /api/video/status/:projectId
Get project status and progress

**Response:**
\`\`\`json
{
  "id": "uuid",
  "keyword": "Artificial Intelligence",
  "status": "generating_videos",
  "progress": 65,
  "scenes": [...],
  "script": "...",
  "createdAt": "2025-11-15T..."
}
\`\`\`

#### GET /api/video/projects
List all video projects

### YouTube Integration Endpoints

#### GET /api/youtube/auth/url
Get YouTube OAuth authorization URL

#### GET /api/youtube/auth/status
Check YouTube authentication status

#### POST /api/youtube/upload
Upload video to YouTube

**Request Body:**
\`\`\`json
{
  "videoPath": "/path/to/video.mp4",
  "title": "My AI Generated Video",
  "description": "Video description...",
  "tags": ["AI", "Education"],
  "privacyStatus": "unlisted"
}
\`\`\`

## 🔧 Project Structure

\`\`\`
webapp/
├── server/                 # Backend (Express + TypeScript)
│   ├── index.ts           # Server entry point
│   ├── routes/            # API route handlers
│   │   ├── video.routes.ts
│   │   └── youtube.routes.ts
│   ├── services/          # Business logic & AI integrations
│   │   ├── openai.service.ts
│   │   ├── piapi.service.ts
│   │   ├── elevenlabs.service.ts
│   │   ├── youtube.service.ts
│   │   └── video.service.ts
│   └── types/             # TypeScript type definitions
│       └── index.ts
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # React components
│   │   └── VideoGenerator.tsx
│   ├── services/          # API client
│   │   └── api.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── App.tsx            # Main app component
│   ├── App.css            # Global styles
│   └── main.tsx           # React entry point
├── uploads/               # Generated files (videos, audio)
├── package.json
├── tsconfig.json          # TypeScript config (frontend)
├── tsconfig.server.json   # TypeScript config (backend)
├── vite.config.ts         # Vite configuration
└── .env                   # Environment variables (create from .env.example)
\`\`\`

## 🎯 How It Works

1. **User Input**: User enters a keyword (e.g., "Climate Change")

2. **Caption Generation**: OpenAI generates 5 engaging scene captions following Problem→Action→Reward structure

3. **Image Prompt Creation**: AI creates detailed visual prompts for each scene

4. **Image Generation**: PiAPI (Flux) generates high-quality images (540x960px) for each scene

5. **Video Animation**: PiAPI (Kling) converts each image into a 5-second animated video

6. **Script Writing**: OpenAI creates a cohesive narration script

7. **Voice Generation**: ElevenLabs synthesizes professional voiceover audio

8. **Video Composition**: FFmpeg merges all video clips and synchronizes with audio

9. **YouTube Upload**: One-click upload to YouTube with auto-generated metadata

## 🎨 Customization

### Change Voice

Edit \`server/services/elevenlabs.service.ts\`:
\`\`\`typescript
private voiceId = 'your-voice-id-here';
\`\`\`

Find available voices at [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)

### Adjust Video Quality

Edit \`server/services/piapi.service.ts\`:
\`\`\`typescript
mode: 'pro', // Change to 'std' for faster/cheaper generation
\`\`\`

### Modify Prompt Style

Edit prompts in \`server/services/openai.service.ts\` to customize:
- Caption generation style
- Image prompt structure
- Script narration tone

## 💰 Cost Estimation (per video)

- **OpenAI GPT-4o-mini**: ~$0.01 (captions + prompts + script)
- **PiAPI Flux**: ~$0.075 (5 images × $0.015)
- **PiAPI Kling**: ~$1.30 (5 videos × $0.26 std mode)
- **ElevenLabs**: ~$0.03 (15-20 seconds of audio)
- **Total**: ~$1.42 per video (using standard quality)

💡 **Tip**: Use Kling 'std' mode instead of 'pro' to reduce cost by ~50%

## 🐛 Troubleshooting

### FFmpeg Not Found
Ensure FFmpeg is installed and in your system PATH:
\`\`\`bash
ffmpeg -version
\`\`\`

### Video Generation Timeout
Increase timeout limits in \`server/services/piapi.service.ts\`:
\`\`\`typescript
const maxAttempts = 300; // Increase for longer waits
\`\`\`

### YouTube Upload Fails
- Verify OAuth credentials are correct
- Check redirect URI matches exactly
- Ensure YouTube Data API v3 is enabled
- Re-authorize if tokens expired

### Memory Issues
Large video files may cause memory issues. Adjust Node.js memory:
\`\`\`bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
\`\`\`

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🔗 Links

- [OpenAI API](https://platform.openai.com/)
- [ElevenLabs](https://elevenlabs.io/)
- [PiAPI](https://piapi.ai/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

Made with ❤️ using AI-powered technologies
