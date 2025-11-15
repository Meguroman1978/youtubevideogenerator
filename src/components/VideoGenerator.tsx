import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { VideoProject } from '../types';

export function VideoGenerator() {
  const [keyword, setKeyword] = useState('');
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
      setError('Please enter a keyword');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await api.generateVideo({ keyword: keyword.trim() });
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
        `AI Generated Video: ${currentProject.keyword}`,
        `This video was automatically generated about: ${currentProject.keyword}\n\n${currentProject.script || ''}`
      );

      alert(`Video uploaded successfully! View at: ${result.url}`);
      window.open(result.url, '_blank');
    } catch (err: any) {
      setError(`YouTube upload failed: ${err.message}`);
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      generating_captions: 'Generating Captions',
      generating_images: 'Generating Images',
      generating_videos: 'Generating Videos',
      generating_audio: 'Generating Audio',
      composing: 'Composing Final Video',
      uploading: 'Uploading to YouTube',
      completed: 'Completed',
      failed: 'Failed',
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
        <h2 style={{ marginBottom: '1.5rem' }}>Generate AI Video</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate}>
          <div className="input-group">
            <label htmlFor="keyword">Enter a keyword or topic</label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., Artificial Intelligence, Climate Change, Machine Learning..."
              disabled={isGenerating}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isGenerating || !keyword.trim()}
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                Generating...
              </>
            ) : (
              '🎬 Generate Video'
            )}
          </button>
        </form>
      </div>

      {currentProject && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>
            Project: {currentProject.keyword}
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
              {currentProject.progress}% Complete
            </p>
          </div>

          {currentProject.script && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>Script:</h4>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {currentProject.script}
              </p>
            </div>
          )}

          {currentProject.scenes.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>Scenes:</h4>
              <div className="scenes-grid">
                {currentProject.scenes.map((scene, index) => (
                  <div key={index} className="scene-card">
                    {scene.imageUrl && (
                      <img src={scene.imageUrl} alt={scene.title} />
                    )}
                    <h4>{scene.title}</h4>
                    {scene.videoUrl && (
                      <p style={{ color: 'var(--success-color)' }}>✓ Video Ready</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentProject.status === 'completed' && currentProject.finalVideoUrl && (
            <div style={{ marginTop: '2rem' }}>
              <h4>Final Video:</h4>
              <div className="video-player">
                <video controls src={`/${currentProject.finalVideoUrl}`}>
                  Your browser does not support the video tag.
                </video>
              </div>

              <div style={{ marginTop: '1rem' }}>
                {!youtubeAuth ? (
                  <div className="youtube-auth">
                    <p>Authorize YouTube to upload your video:</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleYouTubeAuth}
                    >
                      📺 Connect YouTube
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={handleUploadToYouTube}
                  >
                    📤 Upload to YouTube
                  </button>
                )}
              </div>
            </div>
          )}

          {currentProject.error && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              Error: {currentProject.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
