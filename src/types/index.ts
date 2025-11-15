export interface VideoScene {
  title: string;
  imagePrompt: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface VideoProject {
  id: string;
  keyword: string;
  status: 'pending' | 'generating_captions' | 'generating_images' | 'generating_videos' | 'generating_audio' | 'composing' | 'uploading' | 'completed' | 'failed';
  scenes: VideoScene[];
  script?: string;
  audioUrl?: string;
  finalVideoUrl?: string;
  youtubeVideoId?: string;
  error?: string;
  errorStep?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeAuthStatus {
  isAuthenticated: boolean;
}

export interface GenerateVideoRequest {
  keyword: string;
  format?: '9:16' | '16:9';
  language?: 'ja' | 'en';
  duration?: number;
}

export interface ApiEndpoints {
  openai: string;
  elevenlabs: string;
  piapi: string;
}
