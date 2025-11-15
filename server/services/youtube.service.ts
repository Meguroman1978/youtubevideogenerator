import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import type { YouTubeUploadRequest } from '../types/index.js';

const OAuth2 = google.auth.OAuth2;

export class YouTubeService {
  private oauth2Client: any;
  private youtube: any;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new OAuth2(clientId, clientSecret, redirectUri);
    this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  async setCredentials(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Save tokens to file for persistence
    const tokensPath = path.join(process.cwd(), 'tokens', 'youtube-tokens.json');
    const tokensDir = path.dirname(tokensPath);
    
    if (!fs.existsSync(tokensDir)) {
      fs.mkdirSync(tokensDir, { recursive: true });
    }
    
    fs.writeFileSync(tokensPath, JSON.stringify(tokens));
  }

  loadSavedTokens(): boolean {
    try {
      const tokensPath = path.join(process.cwd(), 'tokens', 'youtube-tokens.json');
      if (fs.existsSync(tokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
        this.oauth2Client.setCredentials(tokens);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load saved tokens:', error);
      return false;
    }
  }

  async uploadVideo(request: YouTubeUploadRequest): Promise<string> {
    try {
      const { videoPath, title, description, tags = [], privacyStatus = 'unlisted' } = request;

      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      const fileSize = fs.statSync(videoPath).size;

      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags,
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus,
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      return response.data.id;
    } catch (error) {
      console.error('YouTube upload error:', error);
      throw new Error('Failed to upload video to YouTube');
    }
  }

  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }
}
