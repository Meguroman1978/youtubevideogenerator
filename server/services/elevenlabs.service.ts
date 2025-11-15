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
      console.log(`ElevenLabs: Generating speech (${text.length} characters)...`);
      
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

      if (!response.data) {
        throw new Error('ElevenLabsから音声データが返されませんでした');
      }

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write audio file
      fs.writeFileSync(outputPath, Buffer.from(response.data));
      
      const fileSize = fs.statSync(outputPath).size;
      console.log(`ElevenLabs: Speech generated successfully (${fileSize} bytes)`);

      return outputPath;
    } catch (error: any) {
      console.error('ElevenLabs API error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('ElevenLabs認証エラー: APIキーが無効または期限切れです');
      }
      if (error.response?.status === 429) {
        throw new Error('ElevenLabsレート制限エラー: 使用量制限に達しました。しばらく待ってから再試行してください');
      }
      if (error.response?.status === 500) {
        throw new Error('ElevenLabsサーバーエラー: サービスが一時的に利用できません');
      }
      if (error.code === 'ENOENT') {
        throw new Error(`ファイル書き込みエラー: ${outputPath} へのアクセスができません`);
      }
      if (error.message) {
        throw new Error(`ElevenLabs APIエラー: ${error.message}`);
      }
      throw new Error('ElevenLabs音声生成に失敗しました');
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
