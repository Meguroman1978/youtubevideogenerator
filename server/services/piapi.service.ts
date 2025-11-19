import axios from 'axios';

interface PiAPITaskResponse {
  data: {
    task_id: string;
    status: string;
    output?: {
      image_url?: string;
      video_url?: string;
    };
  };
}

export class PiAPIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.piapi.ai/api/v1';
  }

  async generateImage(prompt: string, format: '9:16' | '16:9' = '9:16'): Promise<string> {
    try {
      // Determine dimensions based on format
      const dimensions = format === '9:16' 
        ? { width: 540, height: 960 } 
        : { width: 960, height: 540 };

      // Request image generation
      const createResponse = await axios.post<PiAPITaskResponse>(
        `${this.baseUrl}/task`,
        {
          model: 'Qubico/flux1-dev',
          task_type: 'txt2img',
          input: {
            prompt: `${prompt} realistic, high quality, detailed`,
            negative_prompt: 'blurry, low quality, distorted, ugly, bad anatomy',
            ...dimensions,
          },
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!createResponse.data?.data?.task_id) {
        throw new Error(`PiAPI画像生成リクエスト失敗: タスクIDを取得できませんでした`);
      }

      const taskId = createResponse.data.data.task_id;
      console.log(`PiAPI: Image task created with ID: ${taskId}`);

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes (3 second intervals)

      while (attempts < maxAttempts) {
        await this.sleep(3000);
        attempts++;
        
        try {
          const statusResponse = await axios.get<PiAPITaskResponse>(
            `${this.baseUrl}/task/${taskId}`,
            {
              headers: {
                'X-API-Key': this.apiKey,
              },
            }
          );

          const status = statusResponse.data.data.status;
          console.log(`PiAPI: Image task ${taskId} status: ${status} (attempt ${attempts}/${maxAttempts})`);

          if (status === 'completed' && statusResponse.data.data.output?.image_url) {
            console.log(`PiAPI: Image generated successfully`);
            return statusResponse.data.data.output.image_url;
          }

          if (status === 'failed') {
            const errorMsg = statusResponse.data.data.output || 'Unknown error';
            throw new Error(`PiAPI画像生成失敗: ${JSON.stringify(errorMsg)}`);
          }
        } catch (pollError: any) {
          if (pollError.response?.status === 401) {
            throw new Error('PiAPI認証エラー: APIキーが無効です');
          }
          if (pollError.response?.status === 500) {
            throw new Error('PiAPIサーバーエラー: サービスが一時的に利用できません');
          }
          if (attempts >= maxAttempts) {
            throw pollError;
          }
          console.warn(`PiAPI polling attempt ${attempts} failed:`, pollError.message);
        }
      }

      throw new Error(`PiAPI画像生成タイムアウト: ${maxAttempts * 3 / 60}分以内に完了しませんでした`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('PiAPI認証エラー: APIキーが無効または期限切れです');
      }
      if (error.response?.status === 429) {
        throw new Error('PiAPIレート制限エラー: 使用量制限に達しました。しばらく待ってから再試行してください');
      }
      if (error.response?.status === 500) {
        throw new Error('PiAPIサーバーエラー: サービスが一時的に利用できません');
      }
      if (error.message) {
        throw error;
      }
      throw new Error(`PiAPI画像生成エラー: ${error.message || 'Unknown error'}`);
    }
  }

  async generateVideoFromImage(imageUrl: string, prompt: string, duration: number = 5): Promise<string> {
    try {
      // Ensure duration is within valid range (2-10 seconds)
      const validDuration = Math.min(Math.max(duration, 2), 10);

      // Request video generation from image
      const createResponse = await axios.post<PiAPITaskResponse>(
        `${this.baseUrl}/task`,
        {
          model: 'kling',
          task_type: 'video_generation',
          input: {
            prompt: prompt,
            negative_prompt: 'blurry motion, distorted faces, unnatural lighting, bad quality',
            cfg_scale: 0.5,
            duration: validDuration,
            mode: 'std', // Use 'std' for lower cost, 'pro' for higher quality
            image_url: imageUrl,
            version: '1.6',
            camera_control: {
              type: 'simple',
              config: {
                horizontal: 0,
                vertical: 0,
                pan: 0,
                tilt: 0,
                roll: 0,
                zoom: 3,
              },
            },
          },
          config: {},
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!createResponse.data?.data?.task_id) {
        throw new Error(`PiAPI動画生成リクエスト失敗: タスクIDを取得できませんでした`);
      }

      const taskId = createResponse.data.data.task_id;
      console.log(`PiAPI: Video task created with ID: ${taskId}, duration: ${validDuration}s`);

      // Poll for completion (video takes longer)
      let attempts = 0;
      const maxAttempts = 200; // 10 minutes

      while (attempts < maxAttempts) {
        await this.sleep(3000);
        attempts++;
        
        try {
          const statusResponse = await axios.get<PiAPITaskResponse>(
            `${this.baseUrl}/task/${taskId}`,
            {
              headers: {
                'X-API-Key': this.apiKey,
              },
            }
          );

          const status = statusResponse.data.data.status;
          if (attempts % 10 === 0) { // Log every 30 seconds
            console.log(`PiAPI: Video task ${taskId} status: ${status} (attempt ${attempts}/${maxAttempts}, ~${Math.floor(attempts * 3 / 60)}min)`);
          }

          if (status === 'completed' && statusResponse.data.data.output?.video_url) {
            console.log(`PiAPI: Video generated successfully after ${Math.floor(attempts * 3 / 60)} minutes`);
            return statusResponse.data.data.output.video_url;
          }

          if (status === 'failed') {
            const errorMsg = statusResponse.data.data.output || 'Unknown error';
            throw new Error(`PiAPI動画生成失敗: ${JSON.stringify(errorMsg)}`);
          }
        } catch (pollError: any) {
          if (pollError.response?.status === 401) {
            throw new Error('PiAPI認証エラー: APIキーが無効です');
          }
          if (pollError.response?.status === 500) {
            throw new Error('PiAPIサーバーエラー: サービスが一時的に利用できません');
          }
          if (attempts >= maxAttempts) {
            throw pollError;
          }
          if (attempts % 10 === 0) {
            console.warn(`PiAPI polling attempt ${attempts} had an issue:`, pollError.message);
          }
        }
      }

      throw new Error(`PiAPI動画生成タイムアウト: ${maxAttempts * 3 / 60}分以内に完了しませんでした`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('PiAPI認証エラー: APIキーが無効または期限切れです');
      }
      if (error.response?.status === 429) {
        throw new Error('PiAPIレート制限エラー: 使用量制限に達しました。しばらく待ってから再試行してください');
      }
      if (error.response?.status === 500) {
        throw new Error('PiAPIサーバーエラー: サービスが一時的に利用できません');
      }
      if (error.message) {
        throw error;
      }
      throw new Error(`PiAPI動画生成エラー: ${error.message || 'Unknown error'}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
