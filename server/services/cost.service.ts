import type { ApiCost } from '../types/index.js';

// Pricing information (as of 2024, adjust as needed)
// Note: These are estimates and should be updated based on actual API pricing

export class CostCalculationService {
  // OpenAI GPT-4o-mini pricing (per 1M tokens)
  private static readonly OPENAI_INPUT_COST = 0.15; // $0.15 per 1M input tokens
  private static readonly OPENAI_OUTPUT_COST = 0.60; // $0.60 per 1M output tokens
  
  // Estimated tokens per request
  private static readonly OPENAI_CAPTION_TOKENS = 500; // Input + output for captions
  private static readonly OPENAI_IMAGE_PROMPT_TOKENS = 300; // Per image prompt
  private static readonly OPENAI_SCRIPT_TOKENS = 800; // Script generation

  // PiAPI pricing (estimates)
  private static readonly PIAPI_IMAGE_COST = 0.02; // $0.02 per image (Flux)
  private static readonly PIAPI_VIDEO_COST = 0.15; // $0.15 per video (Kling standard)

  // ElevenLabs pricing (estimates per character)
  private static readonly ELEVENLABS_COST_PER_CHAR = 0.00003; // $0.03 per 1000 characters

  calculateOpenAICost(sceneCount: number): number {
    // Caption generation: 1 request
    const captionCost = (this.constructor as typeof CostCalculationService).OPENAI_CAPTION_TOKENS * 
      (this.constructor as typeof CostCalculationService).OPENAI_OUTPUT_COST / 1_000_000;
    
    // Image prompts: sceneCount requests
    const imagePromptCost = sceneCount * 
      (this.constructor as typeof CostCalculationService).OPENAI_IMAGE_PROMPT_TOKENS * 
      (this.constructor as typeof CostCalculationService).OPENAI_OUTPUT_COST / 1_000_000;
    
    // Script generation: 1 request
    const scriptCost = (this.constructor as typeof CostCalculationService).OPENAI_SCRIPT_TOKENS * 
      (this.constructor as typeof CostCalculationService).OPENAI_OUTPUT_COST / 1_000_000;
    
    return captionCost + imagePromptCost + scriptCost;
  }

  calculatePiAPICost(sceneCount: number): number {
    // Image generation
    const imageCost = sceneCount * (this.constructor as typeof CostCalculationService).PIAPI_IMAGE_COST;
    
    // Video generation
    const videoCost = sceneCount * (this.constructor as typeof CostCalculationService).PIAPI_VIDEO_COST;
    
    return imageCost + videoCost;
  }

  calculateElevenLabsCost(scriptLength: number): number {
    // Estimate based on script length
    return scriptLength * (this.constructor as typeof CostCalculationService).ELEVENLABS_COST_PER_CHAR;
  }

  calculateTotalCost(sceneCount: number, scriptLength: number): ApiCost {
    const openaiCost = this.calculateOpenAICost(sceneCount);
    const piapiCost = this.calculatePiAPICost(sceneCount);
    const elevenlabsCost = this.calculateElevenLabsCost(scriptLength);
    
    return {
      openai: Math.round(openaiCost * 100) / 100, // Round to 2 decimal places
      piapi: Math.round(piapiCost * 100) / 100,
      elevenlabs: Math.round(elevenlabsCost * 100) / 100,
      total: Math.round((openaiCost + piapiCost + elevenlabsCost) * 100) / 100,
    };
  }

  // Format cost for display
  formatCost(cost: number): string {
    if (cost < 0.01) {
      return `$${(cost * 100).toFixed(4)}c`; // Show in cents for small amounts
    }
    return `$${cost.toFixed(2)}`;
  }

  // Get detailed cost breakdown message
  getCostBreakdown(cost: ApiCost): string {
    return `
総コスト: ${this.formatCost(cost.total)}

内訳:
- OpenAI (GPT-4o-mini): ${this.formatCost(cost.openai)}
- PiAPI (Flux + Kling): ${this.formatCost(cost.piapi)}
- ElevenLabs (TTS): ${this.formatCost(cost.elevenlabs)}

※ これは推定コストです。実際の料金は各APIプロバイダーの請求書をご確認ください。
    `.trim();
  }

  // Estimate remaining credits (if user provides their budget)
  estimateRemainingBudget(currentBudget: number, spentCost: ApiCost): number {
    return Math.max(0, currentBudget - spentCost.total);
  }

  // Calculate how many more videos can be created with remaining budget
  estimateVideosRemaining(remainingBudget: number, avgSceneCount: number = 5, avgScriptLength: number = 500): number {
    const costPerVideo = this.calculateTotalCost(avgSceneCount, avgScriptLength).total;
    return Math.floor(remainingBudget / costPerVideo);
  }
}
