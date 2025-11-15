import type { VideoProject, YouTubeAuthStatus, GenerateVideoRequest } from '../types';

const API_BASE = '/api';

export const api = {
  async generateVideo(request: GenerateVideoRequest): Promise<{ projectId: string; status: string }> {
    const response = await fetch(`${API_BASE}/video/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate video');
    }
    
    return response.json();
  },

  async getProjectStatus(projectId: string): Promise<VideoProject> {
    const response = await fetch(`${API_BASE}/video/status/${projectId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project status');
    }
    
    return response.json();
  },

  async getAllProjects(): Promise<VideoProject[]> {
    const response = await fetch(`${API_BASE}/video/projects`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    return response.json();
  },

  async getYouTubeAuthUrl(): Promise<{ authUrl: string }> {
    const response = await fetch(`${API_BASE}/youtube/auth/url`);
    
    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }
    
    return response.json();
  },

  async getYouTubeAuthStatus(): Promise<YouTubeAuthStatus> {
    const response = await fetch(`${API_BASE}/youtube/auth/status`);
    
    if (!response.ok) {
      throw new Error('Failed to check auth status');
    }
    
    return response.json();
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
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload to YouTube');
    }
    
    return response.json();
  },
};
