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
        project.status = 'generating_captions';
        project.progress = 5;
        projects.set(projectId, project);
        
        console.log(`📄 Extracting content from URL: ${referenceUrl}`);
        referenceContent = await urlParser.extractContent(referenceUrl);
        console.log(`✅ Successfully extracted ${referenceContent.length} characters from URL`);
      } catch (error: any) {
        console.error('⚠️ Failed to extract reference content:', error);
        project.error = `URL解析エラー: ${error.message}`;
        project.errorStep = 'url_parsing';
        projects.set(projectId, project);
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

    console.log(`🤖 Generating captions for keyword: "${keyword}" (${sceneCount} scenes, ${language})`);
    const captions = await openaiSvc.generateVideoCaptions(keyword, language, referenceContent, sceneCount);
    console.log(`✅ Captions generated: ${captions.length} items`);

    // Step 2: Generate image prompts and scenes
    project.status = 'generating_images';
    project.progress = 20;
    projects.set(projectId, project);

    console.log(`🎨 Generating image prompts for ${captions.length} scenes...`);
    const scenes = await openaiSvc.generateImagePrompts(captions, keyword, language);
    console.log(`✅ Image prompts generated: ${scenes.length} scenes`);
    project.scenes = scenes;
    projects.set(projectId, project);

    // Step 3: Generate images for each scene
    console.log(`🖼️  Generating ${scenes.length} images (${format} format)...`);
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      project.progress = 20 + ((i + 1) / scenes.length) * 20;
      projects.set(projectId, project);

      console.log(`🖼️  [${i + 1}/${scenes.length}] Generating image: "${scene.title}"`);
      try {
        const imageUrl = await piapiSvc.generateImage(scene.imagePrompt, format);
        scene.imageUrl = imageUrl;
        console.log(`✅ [${i + 1}/${scenes.length}] Image generated successfully`);
        projects.set(projectId, project);
      } catch (error: any) {
        const errorMsg = `画像生成エラー (シーン${i + 1}/${scenes.length}: "${scene.title}"): ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }

    // Step 4: Generate videos from images
    project.status = 'generating_videos';
    project.progress = 40;
    projects.set(projectId, project);

    console.log(`🎬 Generating ${scenes.length} video clips...`);
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.imageUrl) {
        console.error(`⚠️ Skipping scene ${i + 1}: No image URL`);
        continue;
      }

      project.progress = 40 + ((i + 1) / scenes.length) * 30;
      projects.set(projectId, project);

      // Determine duration for this scene
      const sceneDuration = sceneDurations && sceneDurations[i] 
        ? sceneDurations[i] 
        : defaultSceneDuration;

      // Ensure duration is within valid range (2-10 seconds for Kling)
      const validDuration = Math.max(2, Math.min(10, Math.round(sceneDuration)));
      
      scene.duration = validDuration;

      console.log(`🎬 [${i + 1}/${scenes.length}] Generating ${validDuration}s video for: "${scene.title}"`);
      try {
        const videoUrl = await piapiSvc.generateVideoFromImage(
          scene.imageUrl,
          scene.imagePrompt,
          validDuration
        );
        scene.videoUrl = videoUrl;
        console.log(`✅ [${i + 1}/${scenes.length}] Video generated successfully`);
        projects.set(projectId, project);
      } catch (error: any) {
        const errorMsg = `動画生成エラー (シーン${i + 1}/${scenes.length}: "${scene.title}"): ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }

    // Step 5: Generate script and audio
    project.status = 'generating_audio';
    project.progress = 70;
    projects.set(projectId, project);

    console.log(`📝 Generating narration script...`);
    try {
      const script = await openaiSvc.generateScript(captions, keyword, language, referenceContent);
      project.script = script;
      console.log(`✅ Script generated: ${script.length} characters`);

      const audioPath = path.join(process.cwd(), 'uploads', `${projectId}-audio.mp3`);
      console.log(`🎙️  Generating speech audio...`);
      await elevenlabsSvc.generateSpeech(script, audioPath);
      console.log(`✅ Audio generated successfully`);
      project.audioUrl = audioPath;
      projects.set(projectId, project);
    } catch (error: any) {
      const errorMsg = `音声生成エラー: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Step 6: Compose final video
    project.status = 'composing';
    project.progress = 80;
    projects.set(projectId, project);

    const videoUrls = scenes.map(s => s.videoUrl).filter(Boolean) as string[];
    console.log(`🎞️  Composing final video from ${videoUrls.length} clips...`);
    
    if (videoUrls.length === 0) {
      throw new Error('動画クリップが生成されていません');
    }
    
    if (!project.audioUrl) {
      throw new Error('音声ファイルが生成されていません');
    }
    
    const finalVideoPath = path.join(process.cwd(), 'uploads', `${projectId}-final.mp4`);

    try {
      await videoService.mergeVideosWithAudio(videoUrls, project.audioUrl, finalVideoPath);
      console.log(`✅ Final video composed successfully`);
      project.finalVideoUrl = finalVideoPath;
    } catch (error: any) {
      const errorMsg = `動画合成エラー: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

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
    console.error('❌❌❌ Video generation failed ❌❌❌');
    console.error('Error details:', error);
    
    // Get the current step where error occurred
    const currentStep = project.status;
    const stepLabels: Record<string, string> = {
      'pending': '初期化',
      'generating_captions': 'キャプション生成',
      'generating_images': '画像生成',
      'generating_videos': '動画クリップ生成',
      'generating_audio': '音声生成',
      'composing': '動画合成',
    };
    
    project.status = 'failed';
    project.error = error.message || 'Unknown error';
    project.errorStep = currentStep;
    project.errorDetails = [{
      api: detectErrorSource(error.message),
      operation: stepLabels[currentStep] || currentStep,
      timestamp: new Date().toISOString(),
      errorMessage: error.message,
      errorCode: error.code || error.status || 'UNKNOWN',
      requestDetails: {
        keyword,
        format,
        language,
        duration: totalDuration,
        sceneCount: project.scenes.length,
      },
      responseDetails: error.response?.data || null,
      aiPromptForAnalysis: generateTroubleshootingPrompt(error, currentStep, keyword),
    }];
    project.updatedAt = new Date();
    projects.set(projectId, project);
    
    console.error(`\n📍 Failed at step: ${stepLabels[currentStep] || currentStep}`);
    console.error(`📍 Error message: ${error.message}`);
    console.error(`📍 Error source: ${detectErrorSource(error.message)}`);
  }
}

// Helper function to detect error source from error message
function detectErrorSource(errorMessage: string): string {
  if (!errorMessage) return 'Unknown';
  const msg = errorMessage.toLowerCase();
  if (msg.includes('openai') || msg.includes('gpt')) return 'OpenAI';
  if (msg.includes('piapi') || msg.includes('flux') || msg.includes('kling')) return 'PiAPI';
  if (msg.includes('elevenlabs') || msg.includes('speech') || msg.includes('audio')) return 'ElevenLabs';
  if (msg.includes('ffmpeg') || msg.includes('video') || msg.includes('merge')) return 'FFmpeg';
  if (msg.includes('url') || msg.includes('fetch') || msg.includes('parse')) return 'URLParser';
  return 'System';
}

// Helper function to generate AI troubleshooting prompt
function generateTroubleshootingPrompt(error: any, step: string, keyword: string): string {
  return `エラー解析:

状況:
- 動画生成プロセスが「${step}」ステップで失敗しました
- キーワード: "${keyword}"
- エラーメッセージ: ${error.message}
- エラーコード: ${error.code || error.status || 'なし'}

考えられる原因:
1. APIキーが無効または期限切れ
2. API使用量制限に達した
3. ネットワーク接続の問題
4. 入力データの形式が不正
5. サービス側の一時的な障害

推奨される対処法:
1. APIキーの設定を確認してください
2. API診断機能で各サービスの接続を確認してください
3. しばらく待ってから再試行してください
4. 問題が続く場合は、各APIプロバイダーのステータスページを確認してください`;
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
