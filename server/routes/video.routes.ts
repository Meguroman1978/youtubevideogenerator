import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { OpenAIService } from '../services/openai.service.js';
import { PiAPIService } from '../services/piapi.service.js';
import { ElevenLabsService } from '../services/elevenlabs.service.js';
import { VideoService } from '../services/video.service.js';
import type { VideoProject, VideoGenerationRequest } from '../types/index.js';

const router = express.Router();

// In-memory storage for demo (use database in production)
const projects = new Map<string, VideoProject>();

// Initialize services
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY || '');
const piapiService = new PiAPIService(process.env.PIAPI_KEY || '');
const elevenlabsService = new ElevenLabsService(process.env.ELEVENLABS_API_KEY || '');
const videoService = new VideoService();

router.post('/generate', async (req, res) => {
  try {
    const { keyword, language = 'en', style = 'educational' }: VideoGenerationRequest = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Create project
    const projectId = uuidv4();
    const project: VideoProject = {
      id: projectId,
      keyword,
      status: 'pending',
      scenes: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projects.set(projectId, project);

    // Start async generation
    generateVideo(projectId, keyword).catch((error) => {
      console.error('Video generation error:', error);
      const proj = projects.get(projectId);
      if (proj) {
        proj.status = 'failed';
        proj.error = error.message;
        projects.set(projectId, proj);
      }
    });

    res.json({ projectId, status: 'pending' });
  } catch (error: any) {
    console.error('Error starting video generation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/status/:projectId', (req, res) => {
  const { projectId } = req.params;
  const project = projects.get(projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json(project);
});

router.get('/projects', (req, res) => {
  const allProjects = Array.from(projects.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  res.json(allProjects);
});

async function generateVideo(projectId: string, keyword: string): Promise<void> {
  const project = projects.get(projectId);
  if (!project) return;

  try {
    // Step 1: Generate captions
    project.status = 'generating_captions';
    project.progress = 10;
    projects.set(projectId, project);

    const captions = await openaiService.generateVideoCaptions(keyword);

    // Step 2: Generate image prompts and scenes
    project.status = 'generating_images';
    project.progress = 20;
    projects.set(projectId, project);

    const scenes = await openaiService.generateImagePrompts(captions, keyword);
    project.scenes = scenes;
    projects.set(projectId, project);

    // Step 3: Generate images for each scene
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      project.progress = 20 + ((i + 1) / scenes.length) * 20;
      projects.set(projectId, project);

      const imageUrl = await piapiService.generateImage(scene.imagePrompt);
      scene.imageUrl = imageUrl;
      projects.set(projectId, project);
    }

    // Step 4: Generate videos from images
    project.status = 'generating_videos';
    project.progress = 40;
    projects.set(projectId, project);

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.imageUrl) continue;

      project.progress = 40 + ((i + 1) / scenes.length) * 30;
      projects.set(projectId, project);

      const videoUrl = await piapiService.generateVideoFromImage(
        scene.imageUrl,
        scene.imagePrompt
      );
      scene.videoUrl = videoUrl;
      projects.set(projectId, project);
    }

    // Step 5: Generate script and audio
    project.status = 'generating_audio';
    project.progress = 70;
    projects.set(projectId, project);

    const script = await openaiService.generateScript(captions, keyword);
    project.script = script;

    const audioPath = path.join(process.cwd(), 'uploads', `${projectId}-audio.mp3`);
    await elevenlabsService.generateSpeech(script, audioPath);
    project.audioUrl = audioPath;
    projects.set(projectId, project);

    // Step 6: Compose final video
    project.status = 'composing';
    project.progress = 80;
    projects.set(projectId, project);

    const videoUrls = scenes.map(s => s.videoUrl).filter(Boolean) as string[];
    const finalVideoPath = path.join(process.cwd(), 'uploads', `${projectId}-final.mp4`);

    await videoService.mergeVideosWithAudio(videoUrls, audioPath, finalVideoPath);
    project.finalVideoUrl = finalVideoPath;

    // Complete
    project.status = 'completed';
    project.progress = 100;
    project.updatedAt = new Date();
    projects.set(projectId, project);

  } catch (error: any) {
    console.error('Video generation failed:', error);
    project.status = 'failed';
    project.error = error.message;
    project.updatedAt = new Date();
    projects.set(projectId, project);
  }
}

export default router;
