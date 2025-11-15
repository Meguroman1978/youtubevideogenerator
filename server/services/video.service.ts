import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class VideoService {
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
    outputPath: string
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
      await this.addAudioToVideo(mergedVideoPath, audioPath, outputPath);

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
