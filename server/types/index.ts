export interface SubtitleSegment {
  text: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface VideoScene {
  title: string;
  imagePrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number; // Individual scene duration in seconds
}

export interface ErrorDetail {
  api: string;
  operation: string;
  timestamp: string;
  errorMessage: string;
  errorCode?: string;
  requestDetails?: any;
  responseDetails?: any;
  aiPromptForAnalysis?: string;
}

export interface ApiCost {
  openai: number;
  piapi: number;
  elevenlabs: number;
  total: number;
}

export interface VideoProject {
  id: string;
  keyword: string;
  referenceUrl?: string;
  status: 'pending' | 'generating_captions' | 'generating_images' | 'generating_videos' | 'generating_audio' | 'composing' | 'uploading' | 'completed' | 'failed';
  scenes: VideoScene[];
  script?: string;
  audioUrl?: string;
  finalVideoUrl?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  error?: string;
  errorStep?: string;
  errorDetails?: ErrorDetail[];
  apiCosts?: ApiCost;
  progress: number;
  totalDuration?: number;
  sheetRowIndex?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface YouTubeAuthStatus {
  isAuthenticated: boolean;
}

export interface GenerateVideoRequest {
  keyword: string;
  format?: '9:16' | '16:9';
  language?: 'ja' | 'en';
  duration?: number; // Total video duration (1-120 seconds)
  sceneDurations?: number[]; // Individual scene durations
  referenceUrl?: string; // Optional reference URL for content
  mode?: 'manual' | 'auto'; // Manual input or auto from sheet
}

export interface ScheduleConfig {
  spreadsheetId: string;
  scheduleTime: string; // Cron format or specific time
  dayOfWeek?: number[]; // 0-6 (Sunday to Saturday)
  enabled: boolean;
}

export interface ApiEndpoints {
  openai?: string;
  elevenlabs?: string;
  piapi?: string;
}

export interface YouTubeUploadRequest {
  videoPath: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: 'public' | 'unlisted' | 'private';
}

export interface AIServiceConfig {
  openaiApiKey: string;
  elevenlabsApiKey: string;
  piapiKey: string;
}
