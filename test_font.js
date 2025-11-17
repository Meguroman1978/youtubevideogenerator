const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const fontPath = path.join(__dirname, 'public', 'fonts', 'handwriting.ttf');
const outputPath = path.join(__dirname, 'public', 'fonts', 'font_test_video.mp4');

// Test strings with all alphabets including problematic 'O'
const testSubtitles = [
  { text: 'abcdefghijklmnopqrstuvwxyz', start: 0, end: 3 },
  { text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', start: 3, end: 6 },
  { text: '0123456789', start: 6, end: 9 },
  { text: 'The quick brown fox jumps Over the lazy dOg', start: 9, end: 12 },
  { text: 'HELLO WORLD - Testing O and o characters', start: 12, end: 15 }
];

// Escape font path for FFmpeg
const escapedFontPath = fontPath.replace(/\\/g, '/').replace(/:/g, '\\:');

// Build drawtext filters
const filters = testSubtitles.map(sub => {
  const escapedText = sub.text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\\\'")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%');
  
  return `drawtext=fontfile='${escapedFontPath}':text='${escapedText}':` +
         `fontsize=48:fontcolor=white:` +
         `borderw=3:bordercolor=black:` +
         `x=(w-text_w)/2:y=h-th-50:` +
         `enable='between(t,${sub.start},${sub.end})'`;
}).join(',');

console.log('Creating test video with handwriting font...');
console.log('Font:', fontPath);
console.log('Output:', outputPath);

// Create a blank video and add text
ffmpeg()
  .input('color=c=blue:s=1280x720:d=15')
  .inputFormat('lavfi')
  .videoFilters(filters)
  .outputOptions([
    '-r 30',
    '-pix_fmt yuv420p',
    '-c:v libx264',
    '-preset fast',
    '-crf 23'
  ])
  .output(outputPath)
  .on('start', (cmd) => {
    console.log('FFmpeg command:', cmd);
  })
  .on('progress', (progress) => {
    if (progress.percent) {
      console.log(`Progress: ${Math.round(progress.percent)}%`);
    }
  })
  .on('end', () => {
    console.log('✅ Test video created successfully!');
    console.log('Location:', outputPath);
    process.exit(0);
  })
  .on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  })
  .run();
