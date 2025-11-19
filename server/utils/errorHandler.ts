import type { ErrorDetail } from '../types/index.js';

export class ErrorHandler {
  static createErrorDetail(
    api: string,
    operation: string,
    error: any,
    requestDetails?: any,
    responseDetails?: any
  ): ErrorDetail {
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.status || error.statusCode;

    // Generate AI analysis prompt
    const aiPrompt = this.generateAIAnalysisPrompt(
      api,
      operation,
      errorMessage,
      errorCode,
      requestDetails,
      responseDetails
    );

    return {
      api,
      operation,
      timestamp: new Date().toISOString(),
      errorMessage,
      errorCode: errorCode ? String(errorCode) : undefined,
      requestDetails: this.sanitizeDetails(requestDetails),
      responseDetails: this.sanitizeDetails(responseDetails),
      aiPromptForAnalysis: aiPrompt,
    };
  }

  private static sanitizeDetails(details: any): any {
    if (!details) return undefined;

    // Remove sensitive information like API keys
    const sanitized = JSON.parse(JSON.stringify(details));
    
    if (sanitized.headers) {
      if (sanitized.headers.Authorization) {
        sanitized.headers.Authorization = '[REDACTED]';
      }
      if (sanitized.headers['X-API-Key']) {
        sanitized.headers['X-API-Key'] = '[REDACTED]';
      }
      if (sanitized.headers['xi-api-key']) {
        sanitized.headers['xi-api-key'] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private static generateAIAnalysisPrompt(
    api: string,
    operation: string,
    errorMessage: string,
    errorCode: string | undefined,
    requestDetails: any,
    responseDetails: any
  ): string {
    const prompt = `
# API エラー分析リクエスト

以下のAPIエラーについて、原因と対策を分析してください。

## エラー情報
- **API**: ${api}
- **操作**: ${operation}
- **エラーメッセージ**: ${errorMessage}
${errorCode ? `- **エラーコード**: ${errorCode}` : ''}
- **発生日時**: ${new Date().toISOString()}

## リクエスト詳細
\`\`\`json
${JSON.stringify(requestDetails, null, 2)}
\`\`\`

## レスポンス詳細
\`\`\`json
${JSON.stringify(responseDetails, null, 2)}
\`\`\`

## 求める分析内容
1. このエラーの根本原因は何か？
2. どのような設定ミスや入力ミスが考えられるか？
3. 修正方法や回避策は何か？
4. 同様のエラーを防ぐためのベストプラクティスは？
5. APIのドキュメントやサポートページへのリンク（もしあれば）

このプロンプトをChatGPTやGeminiなどのAIアシスタントに貼り付けて、詳細な分析を得ることができます。
`.trim();

    return prompt;
  }

  static formatErrorForDisplay(errorDetail: ErrorDetail): string {
    let display = `❌ **${errorDetail.api}** エラー\n`;
    display += `📍 **操作**: ${errorDetail.operation}\n`;
    display += `⏰ **発生時刻**: ${new Date(errorDetail.timestamp).toLocaleString('ja-JP')}\n`;
    display += `💬 **メッセージ**: ${errorDetail.errorMessage}\n`;
    
    if (errorDetail.errorCode) {
      display += `🔢 **コード**: ${errorDetail.errorCode}\n`;
    }

    return display;
  }
}
