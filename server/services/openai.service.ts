import OpenAI from 'openai';
import type { VideoScene } from '../types/index.js';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateVideoCaptions(keyword: string): Promise<string[]> {
    const prompt = `You are a creative storytelling AI. Generate 5 engaging video scene captions for an educational/explanatory video about "${keyword}".

Guidelines:
- Each caption should be 5-10 words
- Follow a Problem > Action > Reward structure
- First caption should be a compelling hook
- Last caption should provide satisfying conclusion
- Focus on education and explanation
- Keep it appropriate for all audiences

Your response should be a list of 5 items separated by "\\n" (for example: "item1\\nitem2\\nitem3\\nitem4\\nitem5")`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates engaging educational video captions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';
    return content.split('\\n').filter(line => line.trim() !== '').slice(0, 5);
  }

  async generateImagePrompts(captions: string[], keyword: string): Promise<VideoScene[]> {
    const scenes: VideoScene[] = [];

    for (const caption of captions) {
      const prompt = `Generate a detailed, visual image prompt for AI image generation (Flux model) based on this caption: "${caption}" for a video about "${keyword}".

Requirements:
- Create a cinematic, professional scene description
- Include lighting, composition, and mood details
- Make it suitable for educational/explanatory content
- Keep it realistic and appropriate
- Maximum 200 characters

Return only the image prompt, nothing else.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const imagePrompt = response.choices[0]?.message?.content?.trim() || caption;

      scenes.push({
        title: caption,
        imagePrompt,
      });
    }

    return scenes;
  }

  async generateScript(captions: string[], keyword: string): Promise<string> {
    const prompt = `Create an engaging narration script for a video about "${keyword}" based on these scene captions:

${captions.map((caption, i) => `${i + 1}. ${caption}`).join('\\n')}

Requirements:
- Professional, educational tone
- Approximately 15-20 seconds total (3-4 seconds per scene)
- Natural, conversational language
- Smooth transitions between scenes
- Engaging and informative

Provide only the script text, no additional formatting.`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational video script writer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }
}
