import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { OpenAIService } from '../services/openai.service.js';
import { PiAPIService } from '../services/piapi.service.js';
import { ElevenLabsService } from '../services/elevenlabs.service.js';
import { VideoService } from '../services/video.service.js';
import { CostCalculationService } from '../services/cost.service.js';
import type { VideoProject, GenerateVideoRequest } from '../types/index.js';

const router = express.Router();

// In-memory storage for demo (use database in production)
const projects = new Map<string, VideoProject>();

// Initialize services
const videoService = new VideoService();
const costService = new CostCalculationService();

router.post('/generate', async (req, res) => {
  try {
    const request = req.body as GenerateVideoRequest & { apiKeys?: any; apiEndpoints?: any };
    const { keyword, format, language, duration, referenceUrl, sceneDurations, apiKeys, apiEndpoints } = request;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Use provided API keys or fall back to environment variables
    const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY || '';
    const piapiKey = apiKeys?.piapi || process.env.PIAPI_KEY || '';
    const elevenlabsKey = apiKeys?.elevenlabs || process.env.ELEVENLABS_API_KEY || '';

    if (!openaiKey || !piapiKey || !elevenlabsKey) {
      return res.status(400).json({ 
        error: 'API keys are required. Please configure them in settings.',
        missing: {
          openai: !openaiKey,
          piapi: !piapiKey,
          elevenlabs: !elevenlabsKey,
        }
      });
    }

    // Create project
    const projectId = uuidv4();
    const project: VideoProject = {
      id: projectId,
      keyword,
      referenceUrl,
      status: 'pending',
      scenes: [],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projects.set(projectId, project);

    // Start async generation with provided parameters
    generateVideo(
      projectId, 
      keyword, 
      openaiKey, 
      piapiKey, 
      elevenlabsKey,
      apiEndpoints || {},
      format || '9:16',
      language || 'ja',
      duration || 5,
      referenceUrl,
      sceneDurations
    ).catch((error) => {
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

router.get('/projects', (_req, res) => {
  const allProjects = Array.from(projects.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  res.json(allProjects);
});

async function generateVideo(
  projectId: string, 
  keyword: string, 
  openaiKey: string, 
  piapiKey: string, 
  elevenlabsKey: string,
  apiEndpoints: any,
  format: '9:16' | '16:9',
  language: 'ja' | 'en',
  totalDuration: number,
  referenceUrl?: string,
  sceneDurations?: number[]
): Promise<void> {
  const project = projects.get(projectId);
  if (!project) return;

  // Create service instances with provided API keys and endpoints
  const openaiSvc = new OpenAIService(openaiKey, apiEndpoints?.openai);
  const piapiSvc = new PiAPIService(piapiKey, apiEndpoints?.piapi);
  const elevenlabsSvc = new ElevenLabsService(elevenlabsKey, apiEndpoints?.elevenlabs);

  // Import URL parser service dynamically
  const { URLParserService } = await import('../services/urlparser.service.js');
  const urlParser = new URLParserService();

  try {
    // Extract reference content if URL provided
    let referenceContent: string | undefined;
    if (referenceUrl) {
      try {
        referenceContent = await urlParser.extractContent(referenceUrl);
      } catch (error) {
        console.error('Failed to extract reference content:', error);
        // Continue without reference content
      }
    }

    // Calculate number of scenes based on total duration
    // Each scene can be 2-10 seconds, prefer 5 seconds per scene
    let sceneCount: number;
    let defaultSceneDuration: number;
    
    if (sceneDurations && sceneDurations.length > 0) {
      // Use custom scene durations
      sceneCount = sceneDurations.length;
      defaultSceneDuration = 5; // Default for any additional scenes
    } else {
      // Auto-calculate: aim for 5 seconds per scene, min 2, max 24 scenes (120/5)
      sceneCount = Math.max(2, Math.min(24, Math.ceil(totalDuration / 5)));
      defaultSceneDuration = Math.max(2, Math.min(10, totalDuration / sceneCount));
    }

    project.totalDuration = totalDuration;
    projects.set(projectId, project);

    // Step 1: Generate captions
    project.status = 'generating_captions';
    project.progress = 10;
    projects.set(projectId, project);

    const captions = await openaiSvc.generateVideoCaptions(keyword, language, referenceContent, sceneCount);

    // Step 2: Generate image prompts and scenes
    project.status = 'generating_images';
    project.progress = 20;
    projects.set(projectId, project);

    const scenes = await openaiSvc.generateImagePrompts(captions, keyword, language);
    project.scenes = scenes;
    projects.set(projectId, project);

    // Step 3: Generate images for each scene
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      project.progress = 20 + ((i + 1) / scenes.length) * 20;
      projects.set(projectId, project);

      const imageUrl = await piapiSvc.generateImage(scene.imagePrompt, format);
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

      // Determine duration for this scene
      const sceneDuration = sceneDurations && sceneDurations[i] 
        ? sceneDurations[i] 
        : defaultSceneDuration;

      // Ensure duration is within valid range (2-10 seconds for Kling)
      const validDuration = Math.max(2, Math.min(10, Math.round(sceneDuration)));
      
      scene.duration = validDuration;

      const videoUrl = await piapiSvc.generateVideoFromImage(
        scene.imageUrl,
        scene.imagePrompt,
        validDuration
      );
      scene.videoUrl = videoUrl;
      projects.set(projectId, project);
    }

    // Step 5: Generate script and audio
    project.status = 'generating_audio';
    project.progress = 70;
    projects.set(projectId, project);

    const script = await openaiSvc.generateScript(captions, keyword, language, referenceContent);
    project.script = script;

    const audioPath = path.join(process.cwd(), 'uploads', `${projectId}-audio.mp3`);
    await elevenlabsSvc.generateSpeech(script, audioPath);
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

    // Calculate and store API costs
    const finalSceneCount = project.scenes.length;
    const scriptLength = project.script?.length || 0;
    project.apiCosts = costService.calculateTotalCost(finalSceneCount, scriptLength);

    // Complete
    project.status = 'completed';
    project.progress = 100;
    project.updatedAt = new Date();
    projects.set(projectId, project);

    console.log(`✅ Video generation completed. Estimated cost: $${project.apiCosts.total}`);
    console.log(costService.getCostBreakdown(project.apiCosts));

  } catch (error: any) {
    console.error('Video generation failed:', error);
    project.status = 'failed';
    project.error = error.message;
    project.errorStep = project.status; // Track which step failed
    project.updatedAt = new Date();
    projects.set(projectId, project);
  }
}

// Batch process videos from Google Sheets
export async function processSheetsKeywords(spreadsheetId: string): Promise<void> {
  console.log(`📊 Processing keywords from sheet: ${spreadsheetId}`);
  
  // Import Google Sheets service
  const { getSheetsService } = await import('./googlesheets.routes.js');
  const sheetsService = getSheetsService();
  
  if (!sheetsService) {
    throw new Error('Google Sheets service not available');
  }

  // Import YouTube service
  const { getYouTubeService } = await import('./youtube.routes.js');
  const youtubeService = getYouTubeService();

  // Get API keys from environment
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const piapiKey = process.env.PIAPI_KEY || '';
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY || '';

  if (!openaiKey || !piapiKey || !elevenlabsKey) {
    throw new Error('API keys not configured in environment variables');
  }

  try {
    // Read pending keywords from sheet
    const rows = await sheetsService.readPendingKeywords(spreadsheetId);
    
    console.log(`📝 Found ${rows.length} pending keyword(s)`);

    // Process each keyword
    for (const row of rows) {
      try {
        console.log(`🎬 Processing: ${row.keyword} (Row ${row.rowIndex})`);
        
        // Update status to Pending
        await sheetsService.updateRowStatus(spreadsheetId, row.rowIndex, 'Pending');

        // Create project
        const projectId = uuidv4();
        const project: VideoProject = {
          id: projectId,
          keyword: row.keyword,
          referenceUrl: row.referenceUrl,
          status: 'pending',
          scenes: [],
          progress: 0,
          sheetRowIndex: row.rowIndex,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        projects.set(projectId, project);

        // Generate video
        await generateVideo(
          projectId,
          row.keyword,
          openaiKey,
          piapiKey,
          elevenlabsKey,
          {},
          '9:16', // Default format
          'ja', // Default language
          5, // Default duration
          row.referenceUrl
        );

        // Check if generation succeeded
        const completedProject = projects.get(projectId);
        if (completedProject && completedProject.status === 'completed' && completedProject.finalVideoUrl) {
          // Upload to YouTube if service is available
          if (youtubeService) {
            try {
              project.status = 'uploading';
              projects.set(projectId, project);

              const videoId = await youtubeService.uploadVideo({
                videoPath: completedProject.finalVideoUrl,
                title: completedProject.keyword,
                description: `この動画は「${completedProject.keyword}」について自動生成されました。\n\n${completedProject.script || ''}`,
                privacyStatus: 'unlisted'
              });

              const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
              completedProject.youtubeUrl = youtubeUrl;
              completedProject.youtubeVideoId = videoId;
              projects.set(projectId, completedProject);

              // Update sheet with YouTube URL
              await sheetsService.updateRowStatus(spreadsheetId, row.rowIndex, 'Finished', youtubeUrl);
              
              console.log(`✅ Successfully processed: ${row.keyword} → ${youtubeUrl}`);
            } catch (uploadError: any) {
              console.error(`Failed to upload to YouTube: ${uploadError.message}`);
              await sheetsService.updateRowStatus(spreadsheetId, row.rowIndex, 'Error');
            }
          } else {
            // No YouTube service, mark as finished without URL
            await sheetsService.updateRowStatus(spreadsheetId, row.rowIndex, 'Finished');
            console.log(`✅ Successfully generated: ${row.keyword} (YouTube upload skipped)`);
          }
        } else {
          // Generation failed
          await sheetsService.updateRowStatus(spreadsheetId, row.rowIndex, 'Error');
          console.error(`❌ Failed to generate: ${row.keyword}`);
        }

      } catch (error: any) {
        console.error(`Error processing ${row.keyword}:`, error);
        await sheetsService.updateRowStatus(spreadsheetId, row.rowIndex, 'Error');
      }
    }

    console.log(`🎉 Batch processing completed for sheet: ${spreadsheetId}`);
  } catch (error: any) {
    console.error(`Failed to process sheet ${spreadsheetId}:`, error);
    throw error;
  }
}

export default router;
