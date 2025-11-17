import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface SubtitleSegment {
  text: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export class VideoService {
  private readonly fontPath: string;

  constructor() {
    // Path to the handwriting font
    this.fontPath = path.join(process.cwd(), 'public', 'fonts', 'handwriting.ttf');
    
    // Ensure font exists
    if (!fs.existsSync(this.fontPath)) {
      console.warn(`⚠️ Warning: Font file not found at ${this.fontPath}`);
    } else {
      console.log(`✅ Font loaded: ${this.fontPath}`);
    }
  }
  async downloadFile(url: string, outputPath: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    return outputPath;
  }

  async mergeVideosWithAudio(
    videoUrls: string[],
    audioPath: string,
    outputPath: string,
    subtitles?: SubtitleSegment[]
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp', uuidv4());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Download all videos
      const videoFiles: string[] = [];
      for (let i = 0; i < videoUrls.length; i++) {
        const videoPath = path.join(tempDir, `video_${i}.mp4`);
        await this.downloadFile(videoUrls[i], videoPath);
        videoFiles.push(videoPath);
      }

      // Create concat file list
      const concatListPath = path.join(tempDir, 'concat_list.txt');
      const concatContent = videoFiles.map(f => `file '${f}'`).join('\n');
      fs.writeFileSync(concatListPath, concatContent);

      // Merge videos
      const mergedVideoPath = path.join(tempDir, 'merged_video.mp4');
      await this.concatenateVideos(concatListPath, mergedVideoPath);

      // Add audio to merged video
      const videoWithAudioPath = path.join(tempDir, 'video_with_audio.mp4');
      await this.addAudioToVideo(mergedVideoPath, audioPath, videoWithAudioPath);

      // Add subtitles if provided
      if (subtitles && subtitles.length > 0) {
        console.log(`📝 Adding ${subtitles.length} subtitle segments...`);
        await this.addSubtitlesToVideo(videoWithAudioPath, subtitles, outputPath);
      } else {
        // No subtitles, just copy the file
        fs.copyFileSync(videoWithAudioPath, outputPath);
      }

      // Cleanup temp files
      this.cleanupDirectory(tempDir);

      return outputPath;
    } catch (error) {
      console.error('Video merge error:', error);
      this.cleanupDirectory(tempDir);
      throw error;
    }
  }

  private concatenateVideos(concatListPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  private addAudioToVideo(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  async getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
  }

  /**
   * Add subtitles to video using FFmpeg drawtext filter with custom font
   * This ensures all characters including 'O' are properly rendered
   */
  private async addSubtitlesToVideo(
    inputVideoPath: string,
    subtitles: SubtitleSegment[],
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Escape font path for FFmpeg (replace backslashes and special chars)
      const escapedFontPath = this.fontPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      
      // Build complex filter for all subtitle segments
      // Each subtitle gets its own drawtext filter with enable condition
      const drawtextFilters = subtitles.map((subtitle) => {
        // Escape text for FFmpeg (single quotes, colons, backslashes)
        const escapedText = subtitle.text
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\\\'")
          .replace(/:/g, '\\:')
          .replace(/%/g, '\\%');
        
        // Create drawtext filter with time-based enable condition
        return `drawtext=fontfile='${escapedFontPath}':text='${escapedText}':` +
               `fontsize=48:fontcolor=white:` +
               `borderw=3:bordercolor=black:` +
               `x=(w-text_w)/2:y=h-th-50:` +
               `enable='between(t,${subtitle.startTime},${subtitle.endTime})'`;
      }).join(',');
      
      console.log(`🎬 Applying subtitles with handwriting font...`);
      console.log(`   Font: ${this.fontPath}`);
      console.log(`   Segments: ${subtitles.length}`);
      
      ffmpeg()
        .input(inputVideoPath)
        .videoFilters(drawtextFilters)
        .outputOptions([
          '-c:a copy',  // Copy audio stream as-is
          '-preset fast', // Encoding preset
          '-crf 23',    // Quality setting (lower = better, 23 is good)
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`   Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Subtitles added successfully!');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg subtitle error:', err.message);
          reject(err);
        })
        .run();
    });
  }

  private cleanupDirectory(dir: string): void {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
