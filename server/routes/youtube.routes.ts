import express from 'express';
import { YouTubeService } from '../services/youtube.service.js';
import type { YouTubeUploadRequest } from '../types/index.js';

const router = express.Router();

const youtubeService = new YouTubeService(
  process.env.GOOGLE_CLIENT_ID || '',
  process.env.GOOGLE_CLIENT_SECRET || '',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// Load saved tokens on startup
youtubeService.loadSavedTokens();

router.get('/auth/url', (req, res) => {
  try {
    const authUrl = youtubeService.getAuthUrl();
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).send('Authorization code missing');
    }

    await youtubeService.setCredentials(code);
    res.send('<html><body><h1>Authorization successful!</h1><p>You can close this window and return to the app.</p><script>window.close();</script></body></html>');
  } catch (error: any) {
    console.error('YouTube auth error:', error);
    res.status(500).send('Authorization failed: ' + error.message);
  }
});

router.get('/auth/status', (req, res) => {
  const isAuthenticated = youtubeService.isAuthenticated();
  res.json({ isAuthenticated });
});

router.post('/upload', async (req, res) => {
  try {
    const { videoPath, title, description, tags, privacyStatus }: YouTubeUploadRequest = req.body;

    if (!videoPath || !title) {
      return res.status(400).json({ error: 'Video path and title are required' });
    }

    if (!youtubeService.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated with YouTube' });
    }

    const videoId = await youtubeService.uploadVideo({
      videoPath,
      title,
      description: description || '',
      tags: tags || [],
      privacyStatus: privacyStatus || 'unlisted',
    });

    res.json({ 
      success: true, 
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
