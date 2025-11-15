import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import videoRoutes from './routes/video.routes.js';
import youtubeRoutes from './routes/youtube.routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded videos, audio)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/video', videoRoutes);
app.use('/api/youtube', youtubeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      piapi: !!process.env.PIAPI_KEY,
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📹 Video API: http://localhost:${PORT}/api/video`);
  console.log(`📺 YouTube API: http://localhost:${PORT}/api/youtube`);
  console.log('\n⚙️  Environment check:');
  console.log(`   OpenAI API: ${process.env.OPENAI_API_KEY ? '✓' : '✗'}`);
  console.log(`   ElevenLabs API: ${process.env.ELEVENLABS_API_KEY ? '✓' : '✗'}`);
  console.log(`   PiAPI: ${process.env.PIAPI_KEY ? '✓' : '✗'}`);
  console.log(`   Google OAuth: ${(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '✓' : '✗'}`);
});

export default app;
