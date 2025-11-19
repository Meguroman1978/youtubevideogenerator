import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { VideoProject } from '../types';

interface StepItemProps {
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: string;
  outputLabel?: string;
  isFile?: boolean;
  details?: React.ReactNode;
}

function StepItem({ title, status, output, outputLabel, isFile, details }: StepItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'var(--success-color)';
      case 'processing': return 'var(--primary-color)';
      case 'failed': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '0.5rem',
      borderLeft: `4px solid ${getStatusColor()}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{getStatusIcon()}</span>
          <span style={{ fontWeight: '600' }}>{title}</span>
        </div>
        <span style={{ fontSize: '0.875rem', color: getStatusColor() }}>
          {status === 'pending' && '待機中'}
          {status === 'processing' && '処理中...'}
          {status === 'completed' && '完了'}
          {status === 'failed' && '失敗'}
        </span>
      </div>

      {output && status === 'completed' && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {outputLabel || 'アウトプット'}:
          </div>
          {isFile ? (
            <div style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              📁 {output}
            </div>
          ) : output.length > 100 ? (
            <div>
              <div style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                maxHeight: showDetails ? 'none' : '60px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {output}
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--primary-color)',
                  background: 'none',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {showDetails ? '▲ 閉じる' : '▼ 全文表示'}
              </button>
            </div>
          ) : (
            <div style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}>
              {output}
            </div>
          )}
        </div>
      )}

      {details && status === 'completed' && (
        <div style={{ marginTop: '0.75rem' }}>
          {details}
        </div>
      )}
    </div>
  );
}

function getStepStatus(project: VideoProject, stepName: string): 'pending' | 'processing' | 'completed' | 'failed' {
  // Map UI steps to backend status
  const stepMapping: Record<string, string[]> = {
    'script_generation': ['generating_captions'],
    'narration_generation': ['generating_audio'],
    'image_generation': ['generating_images'],
    'video_generation': ['generating_videos'],
    'final_composition': ['composing']
  };

  // Define step order for comparison
  const stepOrder = ['script_generation', 'image_generation', 'video_generation', 'narration_generation', 'final_composition'];
  
  if (project.status === 'failed') {
    // Check if this specific step failed
    const failedBackendSteps = stepMapping[stepName] || [];
    if (failedBackendSteps.includes(project.errorStep || '')) return 'failed';
    
    // Check if this step completed before failure
    const backendStepOrder = ['generating_captions', 'generating_images', 'generating_videos', 'generating_audio', 'composing'];
    const failedIndex = backendStepOrder.indexOf(project.errorStep || '');
    const thisBackendSteps = stepMapping[stepName] || [];
    const maxThisIndex = Math.max(...thisBackendSteps.map(s => backendStepOrder.indexOf(s)));
    
    if (maxThisIndex < failedIndex && maxThisIndex >= 0) return 'completed';
    return 'pending';
  }

  if (project.status === 'completed') return 'completed';

  // Check if currently processing this step
  const currentBackendSteps = stepMapping[stepName] || [];
  if (currentBackendSteps.includes(project.status)) return 'processing';

  // Check completion based on project data
  if (stepName === 'script_generation' && project.script) return 'completed';
  if (stepName === 'narration_generation' && project.audioUrl) return 'completed';
  if (stepName === 'image_generation' && project.scenes.some(s => s.imageUrl)) return 'completed';
  if (stepName === 'video_generation' && project.scenes.some(s => s.videoUrl)) return 'completed';
  if (stepName === 'final_composition' && project.finalVideoUrl) return 'completed';

  // Check step order
  const backendStepOrder = ['generating_captions', 'generating_images', 'generating_videos', 'generating_audio', 'composing'];
  const currentIndex = backendStepOrder.indexOf(project.status);
  const thisBackendSteps = stepMapping[stepName] || [];
  const minThisIndex = Math.min(...thisBackendSteps.map(s => backendStepOrder.indexOf(s)).filter(i => i >= 0));

  if (minThisIndex < currentIndex) return 'completed';
  if (minThisIndex === currentIndex) return 'processing';
  return 'pending';
}

export function VideoGenerator() {
  const [keyword, setKeyword] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [format, setFormat] = useState<'9:16' | '16:9'>('9:16');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [duration, setDuration] = useState<number>(5);
  const [useCustomScenes, setUseCustomScenes] = useState(false);
  const [customSceneDurations, setCustomSceneDurations] = useState<string>('');
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
      // Parse scene durations if custom scenes are enabled
      let sceneDurations: number[] | undefined;
      if (useCustomScenes && customSceneDurations.trim()) {
        sceneDurations = customSceneDurations
          .split(',')
          .map(d => parseInt(d.trim()))
          .filter(d => !isNaN(d) && d >= 2 && d <= 10);
      }

      const result = await api.generateVideo({ 
        keyword: keyword.trim(),
        format,
        language,
        duration,
        referenceUrl: referenceUrl.trim() || undefined,
        sceneDurations,
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
            <label htmlFor="referenceUrl">参照URL（オプション）</label>
            <input
              id="referenceUrl"
              type="url"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://example.com/article"
              disabled={isGenerating}
            />
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              URLを指定すると、そのページの内容も参考にして動画を生成します
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
            <label htmlFor="duration">動画の合計長さ（秒）</label>
            <input
              id="duration"
              type="number"
              min="1"
              max="120"
              step="1"
              value={duration}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setDuration(5);
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    setDuration(Math.max(1, Math.min(120, num)));
                  }
                }
              }}
              onBlur={(e) => {
                // Ensure valid value on blur
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1 || val > 120) {
                  setDuration(5);
                }
              }}
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
            />
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              1〜120秒の範囲で指定できます。自動的にシーン数が計算されます。
            </small>
          </div>

          <div className="input-group">
            <label>
              <input
                type="checkbox"
                checked={useCustomScenes}
                onChange={(e) => setUseCustomScenes(e.target.checked)}
                disabled={isGenerating}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              シーンごとの長さを個別に指定する
            </label>
          </div>

          {useCustomScenes && (
            <div className="input-group">
              <label htmlFor="customSceneDurations">各シーンの長さ（秒、カンマ区切り）</label>
              <input
                id="customSceneDurations"
                type="text"
                value={customSceneDurations}
                onChange={(e) => setCustomSceneDurations(e.target.value)}
                placeholder="例: 5,3,7,5,4"
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
                各シーン2〜10秒の範囲で指定してください。シーン数が自動決定されます。
              </small>
            </div>
          )}

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

          {/* Detailed Step Progress */}
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>📋 処理ステップ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Step 1: Script Generation */}
              <StepItem
                title="1. スクリプト生成"
                status={getStepStatus(currentProject, 'script_generation')}
                output={currentProject.script}
                outputLabel="生成されたスクリプト"
              />

              {/* Step 2: Image Generation */}
              <StepItem
                title="2. 画像生成"
                status={getStepStatus(currentProject, 'image_generation')}
                output={currentProject.scenes.length > 0 ? `${currentProject.scenes.filter(s => s.imageUrl).length}/${currentProject.scenes.length} 枚完了` : undefined}
                outputLabel="生成された画像"
                details={currentProject.scenes.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {currentProject.scenes.map((scene, idx) => scene.imageUrl && (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img src={scene.imageUrl} alt={`Scene ${idx + 1}`} style={{ width: '100%', borderRadius: '0.25rem' }} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          シーン {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : undefined}
              />

              {/* Step 3: Video Generation */}
              <StepItem
                title="3. 動画生成（画像アニメーション）"
                status={getStepStatus(currentProject, 'video_generation')}
                output={currentProject.scenes.length > 0 ? `${currentProject.scenes.filter(s => s.videoUrl).length}/${currentProject.scenes.length} 本完了` : undefined}
                outputLabel="生成された動画クリップ"
              />

              {/* Step 4: Narration Generation */}
              <StepItem
                title="4. ナレーション生成"
                status={getStepStatus(currentProject, 'narration_generation')}
                output={currentProject.audioUrl}
                outputLabel="音声ファイル"
                isFile={true}
              />

              {/* Step 5: Final Composition */}
              <StepItem
                title="5. 動画統合（ナレーション＋画像統合）"
                status={getStepStatus(currentProject, 'final_composition')}
                output={currentProject.finalVideoUrl}
                outputLabel="最終動画ファイル"
                isFile={true}
              />
            </div>
          </div>

          {currentProject.apiCosts && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>💰 推定コスト</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>OpenAI</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>${currentProject.apiCosts.openai.toFixed(4)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PiAPI</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>${currentProject.apiCosts.piapi.toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ElevenLabs</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>${currentProject.apiCosts.elevenlabs.toFixed(4)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>合計</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>${currentProject.apiCosts.total.toFixed(2)}</p>
                </div>
              </div>
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                ※ これは推定値です。実際の請求額は各APIプロバイダーの料金体系によって異なる場合があります。
              </small>
            </div>
          )}

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
                    {scene.duration && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>⏱️ {scene.duration}秒</p>
                    )}
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
              <h3 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.25rem' }}>
                ❌ エラーが発生しました
              </h3>
              
              {currentProject.errorStep && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  borderLeft: '4px solid #ef4444'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem' }}>🔴 失敗した工程:</strong>
                    <span style={{ fontSize: '1.1rem', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                      {getStatusLabel(currentProject.errorStep)}
                    </span>
                  </div>
                </div>
              )}
              
              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontFamily: 'monospace'
              }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>📝 エラーメッセージ:</strong>
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                  borderRadius: '0.25rem',
                  wordBreak: 'break-word',
                  color: '#fca5a5'
                }}>
                  {currentProject.error}
                </div>
              </div>

              {currentProject.errorDetails && currentProject.errorDetails.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  {currentProject.errorDetails.map((detail, idx) => (
                    <details key={idx} style={{ 
                      marginTop: '0.5rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <summary style={{ 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        userSelect: 'none',
                        marginBottom: '0.5rem'
                      }}>
                        🔍 詳細情報を表示
                      </summary>
                      
                      <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong>🎯 エラー発生元:</strong> {detail.api}
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong>⚙️ 処理内容:</strong> {detail.operation}
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong>🕐 発生時刻:</strong> {new Date(detail.timestamp).toLocaleString('ja-JP')}
                        </div>
                        {detail.errorCode && detail.errorCode !== 'UNKNOWN' && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong>🔢 エラーコード:</strong> {detail.errorCode}
                          </div>
                        )}
                        {detail.requestDetails && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong>📤 リクエスト情報:</strong>
                            <pre style={{ 
                              marginTop: '0.25rem',
                              padding: '0.5rem',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: '0.25rem',
                              overflow: 'auto',
                              fontSize: '0.85rem'
                            }}>
                              {JSON.stringify(detail.requestDetails, null, 2)}
                            </pre>
                          </div>
                        )}
                        {detail.aiPromptForAnalysis && (
                          <div style={{ marginTop: '1rem' }}>
                            <strong>💡 トラブルシューティング:</strong>
                            <div style={{ 
                              marginTop: '0.5rem',
                              padding: '1rem',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderRadius: '0.5rem',
                              borderLeft: '4px solid #3b82f6',
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.9rem',
                              lineHeight: '1.6'
                            }}>
                              {detail.aiPromptForAnalysis}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}

              <div style={{ 
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.5rem',
                borderLeft: '4px solid #3b82f6'
              }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>💡 次のステップ:</strong>
                <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>「APIの設定」タブでAPI キーが正しく設定されているか確認してください</li>
                  <li>「API診断」でサービスの接続状態を確認してください</li>
                  <li>問題が解決しない場合は、しばらく待ってから再試行してください</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
