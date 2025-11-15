import { useState, useEffect } from 'react';

interface ApiKeys {
  openai: string;
  elevenlabs: string;
  piapi: string;
  googleClientId: string;
  googleClientSecret: string;
}

interface ApiEndpoints {
  openai: string;
  elevenlabs: string;
  piapi: string;
}

export function ApiSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    elevenlabs: '',
    piapi: '',
    googleClientId: '',
    googleClientSecret: '',
  });

  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoints>({
    openai: 'https://api.openai.com/v1',
    elevenlabs: 'https://api.elevenlabs.io/v1',
    piapi: 'https://api.piapi.ai/api/v1',
  });

  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Load API keys from localStorage
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }

    // Load API endpoints from localStorage
    const savedEndpoints = localStorage.getItem('apiEndpoints');
    if (savedEndpoints) {
      setApiEndpoints(JSON.parse(savedEndpoints));
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    localStorage.setItem('apiEndpoints', JSON.stringify(apiEndpoints));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleKeyChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys({ ...apiKeys, [key]: value });
    setSaved(false);
  };

  const handleEndpointChange = (key: keyof ApiEndpoints, value: string) => {
    setApiEndpoints({ ...apiEndpoints, [key]: value });
    setSaved(false);
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>🔑 API設定</h2>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        APIキーとエンドポイントURLを設定してください。設定はブラウザのローカルストレージに安全に保存されます。
      </p>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          ✅ API設定が保存されました！
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input
            type="checkbox"
            checked={showKeys}
            onChange={(e) => setShowKeys(e.target.checked)}
            style={{ width: 'auto', marginRight: '0.5rem' }}
          />
          APIキーを表示
        </label>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        APIキー
      </h3>

      <div className="input-group">
        <label htmlFor="openai">
          OpenAI APIキー
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            キーを取得 →
          </a>
        </label>
        <input
          id="openai"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.openai}
          onChange={(e) => handleKeyChange('openai', e.target.value)}
          placeholder="sk-proj-..."
        />
        {!showKeys && apiKeys.openai && (
          <small style={{ color: 'var(--text-secondary)' }}>
            現在: {maskKey(apiKeys.openai)}
          </small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="elevenlabs">
          ElevenLabs APIキー
          <a 
            href="https://elevenlabs.io/app/settings/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            キーを取得 →
          </a>
        </label>
        <input
          id="elevenlabs"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.elevenlabs}
          onChange={(e) => handleKeyChange('elevenlabs', e.target.value)}
          placeholder="ElevenLabs APIキーを入力"
        />
        {!showKeys && apiKeys.elevenlabs && (
          <small style={{ color: 'var(--text-secondary)' }}>
            現在: {maskKey(apiKeys.elevenlabs)}
          </small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="piapi">
          PiAPI キー
          <a 
            href="https://piapi.ai/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            キーを取得 →
          </a>
        </label>
        <input
          id="piapi"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.piapi}
          onChange={(e) => handleKeyChange('piapi', e.target.value)}
          placeholder="PiAPI キーを入力"
        />
        {!showKeys && apiKeys.piapi && (
          <small style={{ color: 'var(--text-secondary)' }}>
            現在: {maskKey(apiKeys.piapi)}
          </small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="googleClientId">
          Google クライアントID（YouTube用）
          <a 
            href="https://console.cloud.google.com/apis/credentials" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            認証情報を取得 →
          </a>
        </label>
        <input
          id="googleClientId"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.googleClientId}
          onChange={(e) => handleKeyChange('googleClientId', e.target.value)}
          placeholder="xxxxx.apps.googleusercontent.com"
        />
      </div>

      <div className="input-group">
        <label htmlFor="googleClientSecret">Google クライアントシークレット</label>
        <input
          id="googleClientSecret"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.googleClientSecret}
          onChange={(e) => handleKeyChange('googleClientSecret', e.target.value)}
          placeholder="GOCSPX-xxxxx"
        />
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        APIエンドポイントURL
      </h3>

      <div className="input-group">
        <label htmlFor="openaiEndpoint">OpenAI エンドポイント</label>
        <input
          id="openaiEndpoint"
          type="text"
          value={apiEndpoints.openai}
          onChange={(e) => handleEndpointChange('openai', e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          デフォルト: https://api.openai.com/v1
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="elevenlabsEndpoint">ElevenLabs エンドポイント</label>
        <input
          id="elevenlabsEndpoint"
          type="text"
          value={apiEndpoints.elevenlabs}
          onChange={(e) => handleEndpointChange('elevenlabs', e.target.value)}
          placeholder="https://api.elevenlabs.io/v1"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          デフォルト: https://api.elevenlabs.io/v1
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="piapiEndpoint">PiAPI エンドポイント</label>
        <input
          id="piapiEndpoint"
          type="text"
          value={apiEndpoints.piapi}
          onChange={(e) => handleEndpointChange('piapi', e.target.value)}
          placeholder="https://api.piapi.ai/api/v1"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          デフォルト: https://api.piapi.ai/api/v1
        </small>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        style={{ marginTop: '1rem' }}
      >
        💾 設定を保存
      </button>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>🔒 セキュリティ情報</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '1.5rem' }}>
          <li>APIキーはブラウザのローカルストレージに保存されます</li>
          <li>キーはバックエンドサーバーに直接送信されます</li>
          <li>APIキーを他の人と共有しないでください</li>
          <li>ブラウザのデータをクリアすると保存されたキーは削除されます</li>
        </ul>
      </div>
    </div>
  );
}

export function getStoredApiKeys(): ApiKeys | null {
  const savedKeys = localStorage.getItem('apiKeys');
  return savedKeys ? JSON.parse(savedKeys) : null;
}

export function getStoredApiEndpoints(): ApiEndpoints {
  const savedEndpoints = localStorage.getItem('apiEndpoints');
  if (savedEndpoints) {
    return JSON.parse(savedEndpoints);
  }
  // Return defaults
  return {
    openai: 'https://api.openai.com/v1',
    elevenlabs: 'https://api.elevenlabs.io/v1',
    piapi: 'https://api.piapi.ai/api/v1',
  };
}
