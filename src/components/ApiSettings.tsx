import { useState, useEffect } from 'react';

// FAL AI Text-to-Image Models with pricing
const FAL_AI_MODELS = [
  { id: 'fal-ai/flux/schnell', name: 'FLUX.1 [schnell]', cost: '$0.003/image', speed: 'Fast' },
  { id: 'fal-ai/flux/dev', name: 'FLUX.1 [dev]', cost: '$0.025/image', speed: 'Medium' },
  { id: 'fal-ai/flux-pro', name: 'FLUX.1 [pro]', cost: '$0.055/image', speed: 'Slow', quality: 'Highest' },
  { id: 'fal-ai/stable-diffusion-v3-medium', name: 'Stable Diffusion 3 Medium', cost: '$0.035/image', speed: 'Medium' },
  { id: 'fal-ai/aura-flow', name: 'AuraFlow', cost: '$0.008/image', speed: 'Fast' },
  { id: 'fal-ai/fast-sdxl', name: 'Fast SDXL', cost: '$0.0035/image', speed: 'Very Fast' },
];

function YouTubeAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/youtube/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch (err) {
      console.error('Failed to check YouTube auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      setError(null);
      const response = await fetch('/api/youtube/auth/url');
      if (!response.ok) {
        throw new Error('認証URLの取得に失敗しました');
      }
      const { authUrl } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        authUrl,
        'YouTube Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          checkAuth();
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>認証状態を確認中...</div>;
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
            ✅ YouTubeに接続済み
          </span>
          <button
            className="btn"
            onClick={checkAuth}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            🔄 再確認
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            ❌ YouTubeに未接続
          </p>
          <button
            className="btn btn-primary"
            onClick={handleAuth}
          >
            📺 YouTubeを認証
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleSheetsAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/googlesheets/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
    } catch (err) {
      console.error('Failed to check Google Sheets auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      setError(null);
      const response = await fetch('/api/googlesheets/auth/url');
      if (!response.ok) {
        throw new Error('認証URLの取得に失敗しました');
      }
      const { authUrl } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        authUrl,
        'Google Sheets Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          checkAuth();
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>認証状態を確認中...</div>;
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
            ✅ Google Sheetsに接続済み
          </span>
          <button
            className="btn"
            onClick={checkAuth}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            🔄 再確認
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            ❌ Google Sheetsに未接続
          </p>
          <button
            className="btn btn-primary"
            onClick={handleAuth}
          >
            📊 Google Sheetsを認証
          </button>
        </div>
      )}
    </div>
  );
}

interface ApiKeys {
  openai: string;
  elevenlabs: string;
  piapi: string;
  creatomate: string;
  falai: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleAccessToken: string;
  googleSheetId: string;
}

interface ApiEndpoints {
  openai: string;
  elevenlabs: string;
  piapi: string;
  creatomate: string;
  falai: string;
}

interface ServiceSelections {
  videoEditingService: 'piapi' | 'creatomate';
  videoGenerationService: 'openai' | 'falai';
  falaiModel?: string;
}

export function ApiSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    elevenlabs: '',
    piapi: '',
    creatomate: '',
    falai: '',
    googleClientId: '',
    googleClientSecret: '',
    googleRefreshToken: '',
    googleAccessToken: '',
    googleSheetId: '',
  });

  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoints>({
    openai: 'https://api.openai.com/v1',
    elevenlabs: 'https://api.elevenlabs.io/v1',
    piapi: 'https://api.piapi.ai/api/v1',
    creatomate: 'https://api.creatomate.com/v1',
    falai: 'https://fal.run',
  });

  const [serviceSelections, setServiceSelections] = useState<ServiceSelections>({
    videoEditingService: 'creatomate',
    videoGenerationService: 'openai',
    falaiModel: 'fal-ai/flux/schnell',
  });

  const [googleRedirectUri, setGoogleRedirectUri] = useState<string>('');
  const [youtubeRedirectUri, setYoutubeRedirectUri] = useState<string>('');

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

    // Load service selections from localStorage
    const savedSelections = localStorage.getItem('serviceSelections');
    if (savedSelections) {
      setServiceSelections(JSON.parse(savedSelections));
    }

    // Fetch redirect URIs
    fetch('/api/googlesheets/auth/redirect-uri')
      .then(res => res.json())
      .then(data => setGoogleRedirectUri(data.redirectUri))
      .catch(err => console.error('Failed to fetch Google Sheets redirect URI:', err));

    fetch('/api/youtube/auth/redirect-uri')
      .then(res => res.json())
      .then(data => setYoutubeRedirectUri(data.redirectUri))
      .catch(err => console.error('Failed to fetch YouTube redirect URI:', err));
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    localStorage.setItem('apiEndpoints', JSON.stringify(apiEndpoints));
    localStorage.setItem('serviceSelections', JSON.stringify(serviceSelections));
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

  const handleSelectionChange = (key: keyof ServiceSelections, value: string) => {
    setServiceSelections({ ...serviceSelections, [key]: value as any });
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
        <label htmlFor="creatomate">
          Creatomate APIキー
          <a 
            href="https://creatomate.com/docs/api/introduction" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            キーを取得 →
          </a>
        </label>
        <input
          id="creatomate"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.creatomate}
          onChange={(e) => handleKeyChange('creatomate', e.target.value)}
          placeholder="Creatomate APIキーを入力"
        />
        {!showKeys && apiKeys.creatomate && (
          <small style={{ color: 'var(--text-secondary)' }}>
            現在: {maskKey(apiKeys.creatomate)}
          </small>
        )}
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          動画編集&レンダリングサービスで使用（下記で選択可能）
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="falai">
          FAL AI APIキー
          <a 
            href="https://fal.ai/dashboard/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            キーを取得 →
          </a>
        </label>
        <input
          id="falai"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.falai}
          onChange={(e) => handleKeyChange('falai', e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        {!showKeys && apiKeys.falai && (
          <small style={{ color: 'var(--text-secondary)' }}>
            現在: {maskKey(apiKeys.falai)}
          </small>
        )}
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          形式: USER_ID:PASSWORD（コロンを含む一つの文字列として入力）
        </small>
        <small style={{ color: 'var(--warning-color)', marginTop: '0.25rem', display: 'block' }}>
          ⚠️ 認証形式: <code style={{ backgroundColor: 'var(--bg-color)', padding: '0.25rem' }}>Key YOUR_FAL_KEY</code> として送信されます
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="googleClientId">
          Google クライアントID
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
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          YouTube APIとGoogle Sheets APIの両方で使用されます
        </small>
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
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          YouTube APIとGoogle Sheets APIの両方で使用されます
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="googleRefreshToken">
          Google Refresh Token
          <a 
            href="https://developers.google.com/oauthplayground" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            トークンを取得 →
          </a>
        </label>
        <input
          id="googleRefreshToken"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.googleRefreshToken}
          onChange={(e) => handleKeyChange('googleRefreshToken', e.target.value)}
          placeholder="1//xxxxx"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          YouTube APIとGoogle Sheets APIの長期認証に使用されます（オプション）
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="googleAccessToken">
          Google Access Token
        </label>
        <input
          id="googleAccessToken"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.googleAccessToken}
          onChange={(e) => handleKeyChange('googleAccessToken', e.target.value)}
          placeholder="ya29.xxxxx"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          YouTube APIとGoogle Sheets APIの一時認証に使用されます（オプション）
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="googleSheetId">
          Google Sheet ID
          <a 
            href="https://support.google.com/docs/answer/183965" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            IDの見つけ方 →
          </a>
        </label>
        <input
          id="googleSheetId"
          type="text"
          value={apiKeys.googleSheetId}
          onChange={(e) => handleKeyChange('googleSheetId', e.target.value)}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          自動実行で使用するGoogle SheetのID（URLから取得）
        </small>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        YouTube認証
      </h3>

      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          生成した動画をYouTubeに自動アップロードするには、YouTube Data APIの認証が必要です。
        </p>
        {youtubeRedirectUri && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>📋 承認済みのリダイレクトURI:</strong>
            <code style={{ 
              display: 'block', 
              padding: '0.5rem', 
              backgroundColor: 'var(--bg-color)', 
              borderRadius: '0.25rem',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              color: 'var(--success-color)'
            }}>
              {youtubeRedirectUri}
            </code>
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              このURIをGoogle Cloud Consoleの「承認済みのリダイレクトURI」に登録してください
            </small>
          </div>
        )}
        <YouTubeAuth />
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        Google Sheets認証
      </h3>

      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Google Sheetsからキーワードを自動取得して動画生成を行うには、Google Sheets APIの認証が必要です。
        </p>
        {googleRedirectUri && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>📋 承認済みのリダイレクトURI:</strong>
            <code style={{ 
              display: 'block', 
              padding: '0.5rem', 
              backgroundColor: 'var(--bg-color)', 
              borderRadius: '0.25rem',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              color: 'var(--success-color)'
            }}>
              {googleRedirectUri}
            </code>
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              このURIをGoogle Cloud Consoleの「承認済みのリダイレクトURI」に登録してください
            </small>
          </div>
        )}
        <GoogleSheetsAuth />
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        🎬 動画編集&レンダリング
      </h3>

      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          動画の編集とレンダリング処理に使用するサービスを選択してください。
        </p>
        <div className="input-group">
          <label htmlFor="videoEditingService">使用サービス</label>
          <select
            id="videoEditingService"
            value={serviceSelections.videoEditingService}
            onChange={(e) => handleSelectionChange('videoEditingService', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-color)'
            }}
          >
            <option value="creatomate">Creatomate（推奨）</option>
            <option value="piapi">PiAPI</option>
          </select>
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            デフォルト: Creatomate
          </small>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
        🎨 動画生成サービス
      </h3>

      <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          動画生成処理に使用するサービスとモデルを選択してください。
        </p>
        <div className="input-group">
          <label htmlFor="videoGenerationService">使用サービス</label>
          <select
            id="videoGenerationService"
            value={serviceSelections.videoGenerationService}
            onChange={(e) => handleSelectionChange('videoGenerationService', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-color)'
            }}
          >
            <option value="openai">OpenAI DALL-E（推奨）</option>
            <option value="falai">FAL AI</option>
          </select>
          <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            デフォルト: OpenAI
          </small>
        </div>

        {serviceSelections.videoGenerationService === 'falai' && (
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="falaiModel">FAL AI モデル</label>
            <select
              id="falaiModel"
              value={serviceSelections.falaiModel}
              onChange={(e) => handleSelectionChange('falaiModel', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '0.25rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)'
              }}
            >
              {FAL_AI_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.cost} ({model.speed}{model.quality ? `, ${model.quality}` : ''})
                </option>
              ))}
            </select>
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
              推奨: FLUX.1 [schnell] - 高速で低コスト
            </small>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--card-bg)', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>選択中のモデル:</strong>
              {FAL_AI_MODELS.find(m => m.id === serviceSelections.falaiModel) && (
                <div>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                    <strong>{FAL_AI_MODELS.find(m => m.id === serviceSelections.falaiModel)!.name}</strong>
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    💰 コスト: {FAL_AI_MODELS.find(m => m.id === serviceSelections.falaiModel)!.cost}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ⚡ 速度: {FAL_AI_MODELS.find(m => m.id === serviceSelections.falaiModel)!.speed}
                  </p>
                  {FAL_AI_MODELS.find(m => m.id === serviceSelections.falaiModel)!.quality && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      ✨ 品質: {FAL_AI_MODELS.find(m => m.id === serviceSelections.falaiModel)!.quality}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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

      <div className="input-group">
        <label htmlFor="creatomateEndpoint">Creatomate エンドポイント</label>
        <input
          id="creatomateEndpoint"
          type="text"
          value={apiEndpoints.creatomate}
          onChange={(e) => handleEndpointChange('creatomate', e.target.value)}
          placeholder="https://api.creatomate.com/v1"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          デフォルト: https://api.creatomate.com/v1
        </small>
      </div>

      <div className="input-group">
        <label htmlFor="falaiEndpoint">FAL AI エンドポイント</label>
        <input
          id="falaiEndpoint"
          type="text"
          value={apiEndpoints.falai}
          onChange={(e) => handleEndpointChange('falai', e.target.value)}
          placeholder="https://fal.run"
        />
        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
          デフォルト: https://fal.run
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
    creatomate: 'https://api.creatomate.com/v1',
    falai: 'https://fal.run',
  };
}

export function getStoredServiceSelections(): ServiceSelections {
  const savedSelections = localStorage.getItem('serviceSelections');
  if (savedSelections) {
    return JSON.parse(savedSelections);
  }
  // Return defaults
  return {
    videoEditingService: 'creatomate',
    videoGenerationService: 'openai',
    falaiModel: 'fal-ai/flux/schnell',
  };
}

// Export types for use in other components
export type { ServiceSelections };
