import express from 'express';
import { GoogleSheetsService } from '../services/googlesheets.service.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const TOKENS_PATH = path.join(process.cwd(), 'google-sheets-tokens.json');

// Initialize service
let sheetsService: GoogleSheetsService | null = null;

function initializeService() {
  const clientId = process.env.GOOGLE_SHEETS_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_SHEETS_CLIENT_SECRET || '';
  
  if (!clientId || !clientSecret) {
    console.warn('Google Sheets credentials not configured');
    return null;
  }
  
  const service = new GoogleSheetsService(clientId, clientSecret);
  
  // Load saved tokens if they exist
  if (fs.existsSync(TOKENS_PATH)) {
    try {
      const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));
      service.setCredentials(tokens);
    } catch (error) {
      console.error('Failed to load Google Sheets tokens:', error);
    }
  }
  
  return service;
}

sheetsService = initializeService();

// Get authentication URL
router.get('/auth/url', (_req, res) => {
  try {
    if (!sheetsService) {
      sheetsService = initializeService();
    }
    
    if (!sheetsService) {
      return res.status(400).json({ error: 'Google Sheets credentials not configured' });
    }
    
    const authUrl = sheetsService.getAuthUrl();
    res.json({ authUrl });
  } catch (error: any) {
    console.error('Failed to generate auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
router.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    if (!sheetsService) {
      sheetsService = initializeService();
    }
    
    if (!sheetsService) {
      return res.status(400).json({ error: 'Google Sheets credentials not configured' });
    }
    
    const tokens = await sheetsService.getTokenFromCode(code);
    
    // Save tokens
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
    
    res.send('<html><body><h1>認証成功！</h1><p>このウィンドウを閉じてアプリに戻ってください。</p><script>window.close();</script></body></html>');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check authentication status
router.get('/auth/status', (_req, res) => {
  const isAuthenticated = sheetsService && fs.existsSync(TOKENS_PATH);
  res.json({ isAuthenticated });
});

// Read pending keywords from sheet
router.get('/keywords/:spreadsheetId', async (req, res) => {
  try {
    if (!sheetsService) {
      return res.status(400).json({ error: 'Google Sheets not authenticated' });
    }
    
    const { spreadsheetId } = req.params;
    const keywords = await sheetsService.readPendingKeywords(spreadsheetId);
    
    res.json({ keywords, count: keywords.length });
  } catch (error: any) {
    console.error('Failed to read keywords:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update row status
router.post('/update-status', async (req, res) => {
  try {
    if (!sheetsService) {
      return res.status(400).json({ error: 'Google Sheets not authenticated' });
    }
    
    const { spreadsheetId, rowIndex, status, youtubeUrl } = req.body;
    
    await sheetsService.updateRowStatus(spreadsheetId, rowIndex, status, youtubeUrl);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export service for use in other routes
export function getSheetsService(): GoogleSheetsService | null {
  return sheetsService;
}

export default router;
