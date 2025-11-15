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
    { service: 'OpenAI', status: 'idle', message: 'Not tested' },
    { service: 'ElevenLabs', status: 'idle', message: 'Not tested' },
    { service: 'PiAPI', status: 'idle', message: 'Not tested' },
    { service: 'Backend Server', status: 'idle', message: 'Not tested' },
  ]);

  const updateResult = (service: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setResults(prev =>
      prev.map(r => r.service === service ? { ...r, status, message, details } : r)
    );
  };

  const testOpenAI = async () => {
    updateResult('OpenAI', 'testing', 'Testing connection...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.openai) {
      updateResult('OpenAI', 'error', 'API key not configured', 'Please set your OpenAI API key in settings');
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
        updateResult('OpenAI', 'success', `Connected! Found ${data.data?.length || 0} models`, 'API key is valid');
      } else {
        const error = await response.text();
        updateResult('OpenAI', 'error', `Failed: ${response.status}`, error);
      }
    } catch (error: any) {
      updateResult('OpenAI', 'error', 'Connection failed', error.message);
    }
  };

  const testElevenLabs = async () => {
    updateResult('ElevenLabs', 'testing', 'Testing connection...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.elevenlabs) {
      updateResult('ElevenLabs', 'error', 'API key not configured', 'Please set your ElevenLabs API key in settings');
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
        updateResult('ElevenLabs', 'success', `Connected! Found ${data.voices?.length || 0} voices`, 'API key is valid');
      } else {
        const error = await response.text();
        updateResult('ElevenLabs', 'error', `Failed: ${response.status}`, error);
      }
    } catch (error: any) {
      updateResult('ElevenLabs', 'error', 'Connection failed', error.message);
    }
  };

  const testPiAPI = async () => {
    updateResult('PiAPI', 'testing', 'Testing connection...');
    
    const apiKeys = getStoredApiKeys();
    if (!apiKeys?.piapi) {
      updateResult('PiAPI', 'error', 'API key not configured', 'Please set your PiAPI key in settings');
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
        updateResult('PiAPI', 'error', 'Invalid API key', 'Please check your PiAPI key');
      } else {
        updateResult('PiAPI', 'success', 'API key is valid', 'Connection successful');
      }
    } catch (error: any) {
      updateResult('PiAPI', 'error', 'Connection failed', error.message);
    }
  };

  const testBackend = async () => {
    updateResult('Backend Server', 'testing', 'Testing connection...');
    
    try {
      const response = await fetch('/api/health');

      if (response.ok) {
        const data = await response.json();
        const envCheck = data.env || {};
        const allConfigured = Object.values(envCheck).every(v => v === true);
        
        if (allConfigured) {
          updateResult('Backend Server', 'success', 'All API keys configured on backend', JSON.stringify(envCheck, null, 2));
        } else {
          updateResult('Backend Server', 'error', 'Some API keys missing on backend', JSON.stringify(envCheck, null, 2));
        }
      } else {
        updateResult('Backend Server', 'error', `Failed: ${response.status}`, 'Backend server error');
      }
    } catch (error: any) {
      updateResult('Backend Server', 'error', 'Connection failed', error.message);
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
      <h2 style={{ marginBottom: '1rem' }}>🔍 API Diagnostics</h2>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Test your API connections to ensure everything is configured correctly.
      </p>

      <button
        className="btn btn-primary"
        onClick={runAllTests}
        style={{ marginBottom: '1.5rem' }}
      >
        🧪 Run All Tests
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
                {result.status}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
              {result.message}
            </p>

            {result.details && (
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>
                  Show details
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
                Test OpenAI
              </button>
            )}
            
            {result.service === 'ElevenLabs' && (
              <button
                className="btn btn-primary"
                onClick={testElevenLabs}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Test ElevenLabs
              </button>
            )}
            
            {result.service === 'PiAPI' && (
              <button
                className="btn btn-primary"
                onClick={testPiAPI}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Test PiAPI
              </button>
            )}
            
            {result.service === 'Backend Server' && (
              <button
                className="btn btn-primary"
                onClick={testBackend}
                style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Test Backend
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>💡 Troubleshooting Tips</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '1.5rem' }}>
          <li>If OpenAI test fails, verify your API key at platform.openai.com</li>
          <li>Ensure you have sufficient credits in each service</li>
          <li>Backend server tests check server-side configuration (.env file)</li>
          <li>Frontend tests check browser-side configuration (localStorage)</li>
          <li>For video generation, all tests must pass</li>
        </ul>
      </div>
    </div>
  );
}
