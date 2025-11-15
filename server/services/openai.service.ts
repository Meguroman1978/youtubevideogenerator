import OpenAI from 'openai';
import type { VideoScene } from '../types/index.js';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ 
      apiKey,
      baseURL: baseURL || 'https://api.openai.com/v1'
    });
  }

  async generateVideoCaptions(keyword: string, language: 'ja' | 'en' = 'ja', referenceContent?: string): Promise<string[]> {
    const referenceContext = referenceContent 
      ? `\n\n参考情報（提供されたURLのコンテンツ）:\n${referenceContent}\n\nこの参考情報も考慮してストーリーを作成してください。` 
      : '';

    const prompts = {
      ja: `あなたは創造的なストーリーテラーAIです。「${keyword}」に関する教育的な解説動画のための、魅力的な5つのシーンキャプションを生成してください。${referenceContext}

ガイドライン:
- 各キャプションは5〜10語程度
- 問題 > 行動 > 報酬の構造に従う
- 最初のキャプションは魅力的なフックにする
- 最後のキャプションは満足のいく結論を提供する
- 教育と説明に焦点を当てる
- すべての視聴者に適切な内容にする

あなたの回答は、「\\n」で区切られた5つの項目のリストにしてください（例: "item1\\nitem2\\nitem3\\nitem4\\nitem5"）`,
      en: `You are a creative storytelling AI. Generate 5 engaging video scene captions for an educational/explanatory video about "${keyword}".${referenceContent ? `\n\nReference Information (from provided URL):\n${referenceContent}\n\nPlease consider this reference information when creating the story.` : ''}

Guidelines:
- Each caption should be 5-10 words
- Follow a Problem > Action > Reward structure
- First caption should be a compelling hook
- Last caption should provide satisfying conclusion
- Focus on education and explanation
- Keep it appropriate for all audiences

Your response should be a list of 5 items separated by "\\n" (for example: "item1\\nitem2\\nitem3\\nitem4\\nitem5")`
    };

    const systemMessages = {
      ja: 'あなたは魅力的な教育動画のキャプションを作成する有能なアシスタントです。',
      en: 'You are a helpful assistant that creates engaging educational video captions.'
    };

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessages[language],
        },
        {
          role: 'user',
          content: prompts[language],
        },
      ],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';
    return content.split('\\n').filter(line => line.trim() !== '').slice(0, 5);
  }

  async generateImagePrompts(captions: string[], keyword: string, language: 'ja' | 'en' = 'ja'): Promise<VideoScene[]> {
    const scenes: VideoScene[] = [];

    for (const caption of captions) {
      const prompts = {
        ja: `このキャプション「${caption}」に基づいて、「${keyword}」に関する動画のための、AI画像生成（Fluxモデル）用の詳細で視覚的な画像プロンプトを生成してください。

要件:
- 映画的でプロフェッショナルなシーンの説明を作成
- 照明、構図、雰囲気の詳細を含める
- 教育的・説明的な内容に適したものにする
- 現実的で適切なものにする
- 最大200文字
- プロンプトは英語で生成してください

画像プロンプトのみを返してください。他のテキストは不要です。`,
        en: `Generate a detailed, visual image prompt for AI image generation (Flux model) based on this caption: "${caption}" for a video about "${keyword}".

Requirements:
- Create a cinematic, professional scene description
- Include lighting, composition, and mood details
- Make it suitable for educational/explanatory content
- Keep it realistic and appropriate
- Maximum 200 characters

Return only the image prompt, nothing else.`
      };

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompts[language],
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

  async generateScript(captions: string[], keyword: string, language: 'ja' | 'en' = 'ja', referenceContent?: string): Promise<string> {
    const referenceContext = referenceContent 
      ? `\n\n参考情報:\n${referenceContent}\n\nこの参考情報も考慮してスクリプトを作成してください。` 
      : '';

    const prompts = {
      ja: `「${keyword}」に関する動画のための、魅力的なナレーションスクリプトを作成してください。以下のシーンキャプションに基づいています:

${captions.map((caption, i) => `${i + 1}. ${caption}`).join('\\n')}${referenceContext}

要件:
- プロフェッショナルで教育的なトーン
- 合計約15〜20秒（シーンあたり3〜4秒）
- 自然で会話的な言葉遣い
- シーン間のスムーズな移行
- 魅力的で有益な内容

スクリプトテキストのみを提供してください。追加のフォーマットは不要です。`,
      en: `Create an engaging narration script for a video about "${keyword}" based on these scene captions:

${captions.map((caption, i) => `${i + 1}. ${caption}`).join('\\n')}${referenceContent ? `\n\nReference Information:\n${referenceContent}\n\nPlease consider this reference when creating the script.` : ''}

Requirements:
- Professional, educational tone
- Approximately 15-20 seconds total (3-4 seconds per scene)
- Natural, conversational language
- Smooth transitions between scenes
- Engaging and informative

Provide only the script text, no additional formatting.`
    };

    const systemMessages = {
      ja: 'あなたは教育動画のスクリプトライティングの専門家です。',
      en: 'You are an expert educational video script writer.'
    };

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessages[language],
        },
        {
          role: 'user',
          content: prompts[language],
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }
}
