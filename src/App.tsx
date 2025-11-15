import { useState } from 'react';
import { VideoGenerator } from './components/VideoGenerator';
import { ApiSettings } from './components/ApiSettings';
import { ApiDiagnostics } from './components/ApiDiagnostics';
import './App.css';

type Tab = 'generate' | 'settings' | 'diagnostics';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  return (
    <div className="app">
      <div className="header">
        <h1>🎬 AI Video Generator</h1>
        <p>
          Enter a keyword and let AI create an educational video with animations and voiceover,
          then automatically upload it to YouTube
        </p>
      </div>
      
      <div className="container">
        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border-color)',
        }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'settings' ? '600' : '400',
              transition: 'all 0.2s',
            }}
          >
            🔑 API Settings
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'diagnostics' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'diagnostics' ? 'var(--primary-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'diagnostics' ? '600' : '400',
              transition: 'all 0.2s',
            }}
          >
            🔍 API Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'generate' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'generate' ? 'var(--primary-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'generate' ? '600' : '400',
              transition: 'all 0.2s',
            }}
          >
            🎬 Generate Video
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'settings' && <ApiSettings />}
        {activeTab === 'diagnostics' && <ApiDiagnostics />}
        {activeTab === 'generate' && <VideoGenerator />}
      </div>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
        <p>Powered by OpenAI, ElevenLabs, PiAPI (Flux + Kling), and YouTube API</p>
      </footer>
    </div>
  );
}

export default App;
