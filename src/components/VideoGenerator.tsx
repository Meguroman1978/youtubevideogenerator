import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { VideoProject } from '../types';

export function VideoGenerator() {
  const [keyword, setKeyword] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [format, setFormat] = useState<'9:16' | '16:9'>('9:16');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [youtubeAuth, setYoutubeAuth] = useState(false);

  useEffect(() => {
    checkYouTubeAuth();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentProject && currentProject.status !== 'completed' && currentProject.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const updated = await api.getProjectStatus(currentProject.id);
          setCurrentProject(updated);

          if (updated.status === 'completed' || updated.status === 'failed') {
            setIsGenerating(false);
          }
        } catch (err) {
          console.error('Failed to fetch project status:', err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentProject]);

  const checkYouTubeAuth = async () => {
    try {
      const status = await api.getYouTubeAuthStatus();
      setYoutubeAuth(status.isAuthenticated);
    } catch (err) {
      console.error('Failed to check YouTube auth:', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('キーワードを入力してください');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await api.generateVideo({ 
        keyword: keyword.trim(),
        format,
        language,
        duration,
      });
      const project = await api.getProjectStatus(result.projectId);
      setCurrentProject(project);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const handleYouTubeAuth = async () => {
    try {
      const { authUrl } = await api.getYouTubeAuthUrl();
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
          checkYouTubeAuth();
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUploadToYouTube = async () => {
    if (!currentProject?.finalVideoUrl) return;

    try {
      setError(null);
      const result = await api.uploadToYouTube(
        currentProject.finalVideoUrl,
        currentProject.keyword,
        `この動画は「${currentProject.keyword}」について自動生成されました。\n\n${currentProject.script || ''}`
      );

      alert(`動画のアップロードが完了しました！\n視聴URL: ${result.url}`);
      window.open(result.url, '_blank');
    } catch (err: any) {
      setError(`YouTubeアップロード失敗: ${err.message}`);
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: '待機中',
      generating_captions: 'キャプション生成中',
      generating_images: '画像生成中',
      generating_videos: '動画生成中',
      generating_audio: '音声生成中',
      composing: '最終動画作成中',
      uploading: 'YouTubeにアップロード中',
      completed: '完了',
      failed: '失敗',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string): string => {
    if (status === 'completed') return 'status-completed';
    if (status === 'failed') return 'status-failed';
    if (status === 'pending') return 'status-pending';
    return 'status-processing';
  };

  return (
    <div className="video-generator">
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>AI動画を生成</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate}>
          <div className="input-group">
            <label htmlFor="keyword">キーワードまたはトピックを入力</label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="例: 人工知能、気候変動、機械学習..."
              disabled={isGenerating}
            />
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              このキーワードが動画のタイトルとして使用されます
            </small>
          </div>

          <div className="input-group">
            <label htmlFor="format">動画フォーマット</label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as '9:16' | '16:9')}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="9:16">9:16 (縦型 - スマートフォン向け)</option>
              <option value="16:9">16:9 (横型 - PC・TV向け)</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="language">言語</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="duration">動画の長さ（秒）</label>
            <input
              id="duration"
              type="number"
              min="2"
              max="10"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
            />
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              各シーンの長さ（2〜10秒）
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isGenerating || !keyword.trim()}
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                生成中...
              </>
            ) : (
              '🎬 動画を生成'
            )}
          </button>
        </form>
      </div>

      rm>
      </div>

      {currentProject && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>
            プロジェクト: {currentProject.keyword}
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <span className={`status-badge ${getStatusClass(currentProject.status)}`}>
              {getStatusLabel(currentProject.status)}
            </span>
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${currentProject.progress}%` }}
              ></div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {currentProject.progress}% 完了
            </p>
          </div>

          {currentProject.script && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>スクリプト:</h4>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {currentProject.script}
              </p>
            </div>
          )}

          {currentProject.scenes.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>シーン:</h4>
              <div className="scenes-grid">
                {currentProject.scenes.map((scene, index) => (
                  <div key={index} className="scene-card">
                    {scene.imageUrl && (
                      <img src={scene.imageUrl} alt={scene.title} />
                    )}
                    <h4>{scene.title}</h4>
                    {scene.videoUrl && (
                      <p style={{ color: 'var(--success-color)' }}>✓ 動画準備完了</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentProject.status === 'completed' && currentProject.finalVideoUrl && (
            <div style={{ marginTop: '2rem' }}>
              <h4>最終動画:</h4>
              <div className="video-player">
                <video controls src={`/${currentProject.finalVideoUrl}`}>
                  お使いのブラウザは動画タグをサポートしていません。
                </video>
              </div>

              <div style={{ marginTop: '1rem' }}>
                {!youtubeAuth ? (
                  <div className="youtube-auth">
                    <p>動画をアップロードするにはYouTubeを認証してください:</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleYouTubeAuth}
                    >
                      📺 YouTubeに接続
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={handleUploadToYouTube}
                  >
                    📤 YouTubeにアップロード
                  </button>
                )}
              </div>
            </div>
          )}

          {currentProject.error && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              <strong>エラー発生:</strong>
              {currentProject.errorStep && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>失敗した工程:</strong> {getStatusLabel(currentProject.errorStep)}
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <strong>詳細:</strong> {currentProject.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
