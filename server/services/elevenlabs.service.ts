import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;
  private voiceId = 'onwK4e9ZLuTAKqWW03F9'; // Default voice ID

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.elevenlabs.io/v1';
  }

  async generateSpeech(text: string, outputPath: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        }
      );

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write audio file
      fs.writeFileSync(outputPath, Buffer.from(response.data));

      return outputPath;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      return response.data.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [];
    }
  }
}
