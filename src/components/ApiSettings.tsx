import { useState, useEffect } from 'react';

interface ApiKeys {
  openai: string;
  elevenlabs: string;
  piapi: string;
  googleClientId: string;
  googleClientSecret: string;
}

export function ApiSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    elevenlabs: '',
    piapi: '',
    googleClientId: '',
    googleClientSecret: '',
  });

  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Load API keys from localStorage
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys({ ...apiKeys, [key]: value });
    setSaved(false);
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>🔑 API Key Settings</h2>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Configure your API keys. Keys are stored securely in your browser's local storage.
      </p>

      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          ✅ API keys saved successfully!
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
          Show API keys
        </label>
      </div>

      <div className="input-group">
        <label htmlFor="openai">
          OpenAI API Key
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            Get Key →
          </a>
        </label>
        <input
          id="openai"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.openai}
          onChange={(e) => handleChange('openai', e.target.value)}
          placeholder="sk-proj-..."
        />
        {!showKeys && apiKeys.openai && (
          <small style={{ color: 'var(--text-secondary)' }}>
            Current: {maskKey(apiKeys.openai)}
          </small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="elevenlabs">
          ElevenLabs API Key
          <a 
            href="https://elevenlabs.io/app/settings/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            Get Key →
          </a>
        </label>
        <input
          id="elevenlabs"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.elevenlabs}
          onChange={(e) => handleChange('elevenlabs', e.target.value)}
          placeholder="Enter your ElevenLabs API key"
        />
        {!showKeys && apiKeys.elevenlabs && (
          <small style={{ color: 'var(--text-secondary)' }}>
            Current: {maskKey(apiKeys.elevenlabs)}
          </small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="piapi">
          PiAPI Key
          <a 
            href="https://piapi.ai/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            Get Key →
          </a>
        </label>
        <input
          id="piapi"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.piapi}
          onChange={(e) => handleChange('piapi', e.target.value)}
          placeholder="Enter your PiAPI key"
        />
        {!showKeys && apiKeys.piapi && (
          <small style={{ color: 'var(--text-secondary)' }}>
            Current: {maskKey(apiKeys.piapi)}
          </small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="googleClientId">
          Google Client ID (for YouTube)
          <a 
            href="https://console.cloud.google.com/apis/credentials" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ marginLeft: '0.5rem', color: 'var(--primary-color)', fontSize: '0.875rem' }}
          >
            Get Credentials →
          </a>
        </label>
        <input
          id="googleClientId"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.googleClientId}
          onChange={(e) => handleChange('googleClientId', e.target.value)}
          placeholder="xxxxx.apps.googleusercontent.com"
        />
      </div>

      <div className="input-group">
        <label htmlFor="googleClientSecret">Google Client Secret</label>
        <input
          id="googleClientSecret"
          type={showKeys ? 'text' : 'password'}
          value={apiKeys.googleClientSecret}
          onChange={(e) => handleChange('googleClientSecret', e.target.value)}
          placeholder="GOCSPX-xxxxx"
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSave}
        style={{ marginTop: '1rem' }}
      >
        💾 Save API Keys
      </button>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>🔒 Security Notes</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '1.5rem' }}>
          <li>API keys are stored in your browser's local storage</li>
          <li>Keys are sent directly to the backend server</li>
          <li>Never share your API keys with others</li>
          <li>Clear browser data will remove saved keys</li>
        </ul>
      </div>
    </div>
  );
}

export function getStoredApiKeys(): ApiKeys | null {
  const savedKeys = localStorage.getItem('apiKeys');
  return savedKeys ? JSON.parse(savedKeys) : null;
}
