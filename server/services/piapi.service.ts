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

    const taskId = createResponse.data.data.task_id;

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes (3 second intervals)

    while (attempts < maxAttempts) {
      await this.sleep(3000);
      
      const statusResponse = await axios.get<PiAPITaskResponse>(
        `${this.baseUrl}/task/${taskId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      const status = statusResponse.data.data.status;

      if (status === 'completed' && statusResponse.data.data.output?.image_url) {
        return statusResponse.data.data.output.image_url;
      }

      if (status === 'failed') {
        throw new Error('Image generation failed');
      }

      attempts++;
    }

    throw new Error('Image generation timeout');
  }

  async generateVideoFromImage(imageUrl: string, prompt: string, duration: number = 5): Promise<string> {
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

    const taskId = createResponse.data.data.task_id;

    // Poll for completion (video takes longer)
    let attempts = 0;
    const maxAttempts = 200; // 10 minutes

    while (attempts < maxAttempts) {
      await this.sleep(3000);
      
      const statusResponse = await axios.get<PiAPITaskResponse>(
        `${this.baseUrl}/task/${taskId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      const status = statusResponse.data.data.status;

      if (status === 'completed' && statusResponse.data.data.output?.video_url) {
        return statusResponse.data.data.output.video_url;
      }

      if (status === 'failed') {
        throw new Error('Video generation failed');
      }

      attempts++;
    }

    throw new Error('Video generation timeout');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
