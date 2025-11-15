import { VideoGenerator } from './components/VideoGenerator';
import './App.css';

function App() {
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
        <VideoGenerator />
      </div>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
        <p>Powered by OpenAI, ElevenLabs, PiAPI (Flux + Kling), and YouTube API</p>
      </footer>
    </div>
  );
}

export default App;
