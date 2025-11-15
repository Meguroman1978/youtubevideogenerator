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
          <li>各サービスで十分なクレジットがあることを確認してください</li>
          <li>バックエンドサーバーのテストは、サーバー側の設定（.envファイル）を確認します</li>
          <li>フロントエンドのテストは、ブラウザ側の設定（localStorage）を確認します</li>
          <li>動画生成には、すべてのテストに合格する必要があります</li>
        </ul>
      </div>
    </div>
  );
}
