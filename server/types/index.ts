export interface VideoGenerationRequest {
  keyword: string;
  language?: string;
  style?: string;
}

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
  progress: number;
  createdAt: Date;
  updatedAt: Date;
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
