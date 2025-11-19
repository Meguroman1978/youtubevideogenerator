import { useState } from 'react';
import { getStoredApiKeys } from './ApiSettings';

interface DiagnosticResult {
  service: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  details?: string;
}

export function ApiDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { service: 'OpenAI', status: 'idle', message: '未テスト' },
    { service: 'ElevenLabs', status: 'idle', message: '未テスト' },
    { service: 'PiAPI', status: 'idle', message: '未テスト' },
    { service: 'Creatomate', status: 'idle', message: '未テスト' },
    { service: 'FAL AI', status: 'idle', message: '未テスト' },
    { service: 'Google Sheets', status: 'idle', message: '未テスト' },
    { service: 'YouTube Upload', status: 'idle', message: '未テスト' },
    { service: 'バックエンドサーバー', status: 'idle', message: '未テスト' },
  ]);

  const updateResult = (service: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setResults(prev =>
      prev.map(r => r.service === service ? { ...r, status, message, details } : r)
    );
  };

  const testOpenAI = async () => {
    updateResult('OpenAI', 'testing', '接続テスト中...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.openai) {
      updateResult('OpenAI', 'error', 'APIキーが設定されていません', '設定画面でOpenAI APIキーを設定してください');
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKeys.openai}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        updateResult('OpenAI', 'success', `接続成功！ ${data.data?.length || 0}個のモデルが見つかりました`, 'APIキーは有効です');
      } else {
        const error = await response.text();
        updateResult('OpenAI', 'error', `失敗: ${response.status}`, error);
      }
    } catch (error: any) {
      updateResult('OpenAI', 'error', '接続に失敗しました', error.message);
    }
  };

  const testElevenLabs = async () => {
    updateResult('ElevenLabs', 'testing', '接続テスト中...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.elevenlabs) {
      updateResult('ElevenLabs', 'error', 'APIキーが設定されていません', '設定画面でElevenLabs APIキーを設定してください');
      return;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKeys.elevenlabs,
        },
      });

      if (response.ok) {
        const data = await response.json();
        updateResult('ElevenLabs', 'success', `接続成功！ ${data.voices?.length || 0}個の音声が見つかりました`, 'APIキーは有効です');
      } else {
        const error = await response.text();
        updateResult('ElevenLabs', 'error', `失敗: ${response.status}`, error);
      }
    } catch (error: any) {
      updateResult('ElevenLabs', 'error', '接続に失敗しました', error.message);
    }
  };

  const testPiAPI = async () => {
    updateResult('PiAPI', 'testing', '接続テスト中...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.piapi) {
      updateResult('PiAPI', 'error', 'APIキーが設定されていません', '設定画面でPiAPI キーを設定してください');
      return;
    }

    try {
      // Test with a simple request to check API key validity
      const response = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKeys.piapi,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'test',
          task_type: 'test',
        }),
      });

      // Even if the request fails due to invalid parameters, we can check if the API key is accepted
      if (response.status === 401) {
        updateResult('PiAPI', 'error', '無効なAPIキー', 'PiAPI キーを確認してください');
      } else {
        updateResult('PiAPI', 'success', 'APIキーは有効です', '接続成功');
      }
    } catch (error: any) {
      updateResult('PiAPI', 'error', '接続に失敗しました', error.message);
    }
  };

  const testCreatomate = async () => {
    updateResult('Creatomate', 'testing', '接続テスト中...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.creatomate) {
      updateResult('Creatomate', 'error', 'APIキーが設定されていません', '設定画面でCreatomate APIキーを設定してください');
      return;
    }

    try {
      // Test Creatomate API by fetching templates
      const response = await fetch('https://api.creatomate.com/v1/templates', {
        headers: {
          'Authorization': `Bearer ${apiKeys.creatomate}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        updateResult('Creatomate', 'success', `接続成功！ ${data.length || 0}個のテンプレートが見つかりました`, 'APIキーは有効です');
      } else {
        const error = await response.text();
        updateResult('Creatomate', 'error', `失敗: ${response.status}`, error);
      }
    } catch (error: any) {
      updateResult('Creatomate', 'error', '接続に失敗しました', error.message);
    }
  };

  const testFalAI = async () => {
    updateResult('FAL AI', 'testing', '接続テスト中...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.falai) {
      updateResult('FAL AI', 'error', 'APIキーが設定されていません', '設定画面でFAL AI APIキーを設定してください');
      return;
    }

    try {
      // Test FAL AI API with a simple model list or status check
      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKeys.falai}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test connection',
          image_size: 'square_hd',
          num_images: 1,
        }),
      });

      if (response.ok || response.status === 400) {
        // 400 is acceptable here - means API key is valid but request parameters might be incomplete for a test
        updateResult('FAL AI', 'success', 'APIキーは有効です', '接続成功（認証形式: Key YOUR_KEY）');
      } else if (response.status === 401 || response.status === 403) {
        updateResult('FAL AI', 'error', '無効なAPIキー', 'FAL AI APIキーを確認してください\n形式: USER_ID:PASSWORD');
      } else {
        const error = await response.text();
        updateResult('FAL AI', 'error', `失敗: ${response.status}`, error);
      }
    } catch (error: any) {
      updateResult('FAL AI', 'error', '接続に失敗しました', error.message);
    }
  };

  const testYouTubeUpload = async () => {
    updateResult('YouTube Upload', 'testing', '接続テスト中...');
    
    try {
      // Check authentication status
      const authResponse = await fetch('/api/youtube/auth/status');

      if (!authResponse.ok) {
        updateResult('YouTube Upload', 'error', `認証確認失敗: ${authResponse.status}`, 'バックエンドサーバーエラー');
        return;
      }

      const authData = await authResponse.json();
      if (!authData.isAuthenticated) {
        updateResult('YouTube Upload', 'error', 'YouTubeに未接続', 'API設定画面で認証してください');
        return;
      }

      updateResult(
        'YouTube Upload', 
        'success', 
        '✅ YouTubeに認証済み！',
        '動画のYouTubeアップロードが可能です'
      );
    } catch (error: any) {
      updateResult('YouTube Upload', 'error', '接続に失敗しました', error.message);
    }
  };

  const testGoogleSheets = async () => {
    updateResult('Google Sheets', 'testing', '接続テスト中...');
    
    const apiKeys = getStoredApiKeys();
    const sheetId = apiKeys?.googleSheetId;
    
    try {
      // First check authentication status
      const authResponse = await fetch('/api/googlesheets/auth/status');

      if (!authResponse.ok) {
        updateResult('Google Sheets', 'error', `認証確認失敗: ${authResponse.status}`, 'バックエンドサーバーエラー');
        return;
      }

      const authData = await authResponse.json();
      if (!authData.isAuthenticated) {
        updateResult('Google Sheets', 'error', 'Google Sheetsに未接続', 'API設定画面で認証してください');
        return;
      }

      // If Sheet ID is provided, test reading from it
      if (sheetId && sheetId.trim()) {
        updateResult('Google Sheets', 'testing', `シートに接続中... (ID: ${sheetId.substring(0, 20)}...)`);
        
        const testResponse = await fetch('/api/googlesheets/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spreadsheetId: sheetId }),
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          updateResult(
            'Google Sheets', 
            'success', 
            `✅ シート接続成功！`,
            `シート名: ${testData.sheetTitle || 'N/A'}\n行数: ${testData.rowCount || 0}行\n認証: 完了`
          );
        } else {
          const errorData = await testResponse.json().catch(() => ({}));
          updateResult(
            'Google Sheets', 
            'error', 
            `シート読み取りエラー: ${errorData.error || testResponse.statusText}`,
            `ステータス: ${testResponse.status}\nシートIDが正しいか、アクセス権限があるか確認してください`
          );
        }
      } else {
        updateResult('Google Sheets', 'success', 'Google Sheetsに認証済み', 'API設定画面でGoogle Sheet IDを設定すると、シート接続もテストできます');
      }
    } catch (error: any) {
      updateResult('Google Sheets', 'error', '接続に失敗しました', error.message);
    }
  };

  const testBackend = async () => {
    updateResult('バックエンドサーバー', 'testing', '接続テスト中...');
    
    try {
      const response = await fetch('/api/health');

      if (response.ok) {
        const data = await response.json();
        const envCheck = data.env || {};
        const allConfigured = Object.values(envCheck).every(v => v === true);
        
        if (allConfigured) {
          updateResult('バックエンドサーバー', 'success', 'すべてのAPIキーがバックエンドで設定されています', JSON.stringify(envCheck, null, 2));
        } else {
          updateResult('バックエンドサーバー', 'error', '一部のAPIキーがバックエンドで不足しています', JSON.stringify(envCheck, null, 2));
        }
      } else {
        updateResult('バックエンドサーバー', 'error', `失敗: ${response.status}`, 'バックエンドサーバーエラー');
      }
    } catch (error: any) {
      updateResult('バックエンドサーバー', 'error', '接続に失敗しました', error.message);
    }
  };

  const runAllTests = async () => {
    await testBackend();
    await testOpenAI();
    await testElevenLabs();
    await testPiAPI();
    await testCreatomate();
    await testFalAI();
    await testGoogleSheets();
    await testYouTubeUpload();
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'idle': return '⚪';
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusClass = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'status-completed';
      case 'error': return 'status-failed';
      case 'testing': return 'status-processing';
      default: return 'status-pending';
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>🔍 API診断</h2>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        API接続をテストして、すべてが正しく設定されていることを確認します。
      </p>

      <button
        className="btn btn-primary"
        onClick={runAllTests}
        style={{ marginBottom: '1.5rem' }}
      >
        🧪 すべてのテストを実行
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((result) => (
          <div
            key={result.service}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>
                {getStatusIcon(result.status)} {result.service}
              </h4>
              <span className={`status-badge ${getStatusClass(result.status)}`}>
                {result.status === 'idle' ? '待機中' : result.status === 'testing' ? 'テスト中' : result.status === 'success' ? '成功' : 'エラー'}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
              {result.message}
            </p>

            {result.details && (
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>
                  詳細を表示
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '150px',
                }}>
                  {result.details}
                </pre>
              </details>
            )}

            {result.service === 'OpenAI' && (
              <button
                className="btn btn-primary"
                onClick={testOpenAI}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                OpenAIをテスト
              </button>
            )}
            
            {result.service === 'ElevenLabs' && (
              <button
                className="btn btn-primary"
                onClick={testElevenLabs}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                ElevenLabsをテスト
              </button>
            )}
            
            {result.service === 'PiAPI' && (
              <button
                className="btn btn-primary"
                onClick={testPiAPI}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                PiAPIをテスト
              </button>
            )}
            
            {result.service === 'Creatomate' && (
              <button
                className="btn btn-primary"
                onClick={testCreatomate}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Creatomateをテスト
              </button>
            )}
            
            {result.service === 'FAL AI' && (
              <button
                className="btn btn-primary"
                onClick={testFalAI}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                FAL AIをテスト
              </button>
            )}
            
            {result.service === 'Google Sheets' && (
              <button
                className="btn btn-primary"
                onClick={testGoogleSheets}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Google Sheetsをテスト
              </button>
            )}
            
            {result.service === 'YouTube Upload' && (
              <button
                className="btn btn-primary"
                onClick={testYouTubeUpload}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                YouTube Uploadをテスト
              </button>
            )}
            
            {result.service === 'バックエンドサーバー' && (
              <button
                className="btn btn-primary"
                onClick={testBackend}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                バックエンドをテスト
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>💡 トラブルシューティングのヒント</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '1.5rem' }}>
          <li>OpenAIテストが失敗した場合は、platform.openai.comでAPIキーを確認してください</li>
          <li>Creatomateテストが失敗した場合は、creatomate.com/dashboardでAPIキーを確認してください</li>
          <li><strong>FAL AIテスト</strong>: APIキーの形式は <code>USER_ID:PASSWORD</code> です。認証ヘッダーは <code>Key YOUR_KEY</code> として送信されます</li>
          <li>各サービスで十分なクレジットがあることを確認してください</li>
          <li><strong>Google OAuth2</strong>: 「Error 400: invalid_request」が出る場合、Google Cloud Consoleで「承認済みのリダイレクトURI」を設定してください</li>
          <li>バックエンドサーバーのテストは、サーバー側の設定（.envファイル）を確認します</li>
          <li>フロントエンドのテストは、ブラウザ側の設定（localStorage）を確認します</li>
          <li>動画生成には、すべてのテストに合格する必要があります</li>
        </ul>
      </div>
    </div>
  );
}
