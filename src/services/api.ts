import type { VideoProject, YouTubeAuthStatus, GenerateVideoRequest } from '../types';

const API_BASE = '/api';

function getApiKeys() {
  const savedKeys = localStorage.getItem('apiKeys');
  return savedKeys ? JSON.parse(savedKeys) : null;
}

function getApiEndpoints() {
  const savedEndpoints = localStorage.getItem('apiEndpoints');
  return savedEndpoints ? JSON.parse(savedEndpoints) : null;
}

export const api = {
  async generateVideo(request: GenerateVideoRequest): Promise<{ projectId: string; status: string }> {
    const apiKeys = getApiKeys();
    const apiEndpoints = getApiEndpoints();
    const response = await fetch(`${API_BASE}/video/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        apiKeys,
        apiEndpoints,
      }),
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to generate video';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`サーバーが無効なレスポンスを返しました。Vite開発サーバー（ポート5173）にアクセスしていることを確認してください。`);
    }
  },

  async getProjectStatus(projectId: string): Promise<VideoProject> {
    const response = await fetch(`${API_BASE}/video/status/${projectId}`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch project status';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`サーバーが無効なレスポンスを返しました。Vite開発サーバー（ポート5173）にアクセスしていることを確認してください。`);
    }
  },

  async getAllProjects(): Promise<VideoProject[]> {
    const response = await fetch(`${API_BASE}/video/projects`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch projects';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`サーバーが無効なレスポンスを返しました。Vite開発サーバー（ポート5173）にアクセスしていることを確認してください。`);
    }
  },

  async getYouTubeAuthUrl(): Promise<{ authUrl: string }> {
    const response = await fetch(`${API_BASE}/youtube/auth/url`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to get auth URL';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`サーバーが無効なレスポンスを返しました。Vite開発サーバー（ポート5173）にアクセスしていることを確認してください。`);
    }
  },

  async getYouTubeAuthStatus(): Promise<YouTubeAuthStatus> {
    const response = await fetch(`${API_BASE}/youtube/auth/status`);
    
    if (!response.ok) {
      let errorMessage = 'Failed to check auth status';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`サーバーが無効なレスポンスを返しました。Vite開発サーバー（ポート5173）にアクセスしていることを確認してください。`);
    }
  },

  async uploadToYouTube(videoPath: string, title: string, description: string): Promise<{ success: boolean; videoId: string; url: string }> {
    const response = await fetch(`${API_BASE}/youtube/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoPath,
        title,
        description,
        privacyStatus: 'unlisted',
      }),
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to upload to YouTube';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await response.json();
    } catch (e) {
      throw new Error(`サーバーが無効なレスポンスを返しました。Vite開発サーバー（ポート5173）にアクセスしていることを確認してください。`);
    }
  },
};
