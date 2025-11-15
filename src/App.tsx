import { useState } from 'react';
import { VideoGenerator } from './components/VideoGenerator';
import { ApiSettings } from './components/ApiSettings';
import { ApiDiagnostics } from './components/ApiDiagnostics';
import { ScheduleManager } from './components/ScheduleManager';
import './App.css';

type Tab = 'generate' | 'settings' | 'diagnostics' | 'schedule';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  return (
    <div className="app">
      <div className="header">
        <h1>🎬 AI動画ジェネレーター</h1>
        <p>
          キーワードを入力するだけで、AIがアニメーションとナレーション付きの教育動画を作成し、
          YouTubeに自動アップロードします
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
            🔑 API設定
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
            🔍 API診断
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              padding: '1rem 2rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'schedule' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'schedule' ? 'var(--primary-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'schedule' ? '600' : '400',
              transition: 'all 0.2s',
            }}
          >
            ⏰ 自動実行
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
            🎬 手動生成
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'settings' && <ApiSettings />}
        {activeTab === 'diagnostics' && <ApiDiagnostics />}
        {activeTab === 'schedule' && <ScheduleManager />}
        {activeTab === 'generate' && <VideoGenerator />}
      </div>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
        <p>OpenAI、ElevenLabs、PiAPI（Flux + Kling）、YouTube APIを使用</p>
      </footer>
    </div>
  );
}

export default App;
