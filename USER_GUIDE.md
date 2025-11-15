# 👤 User Guide - AI Video Generator

## 🎬 Welcome!

This guide will help you use the AI Video Generator to create amazing educational videos automatically.

---

## 🚀 Getting Started

### 1. Launch the Application

Open your terminal and run:

\`\`\`bash
cd /home/user/webapp
npm run dev
\`\`\`

Wait for the messages:
- ✓ Frontend running: http://localhost:5173
- ✓ Backend running: http://localhost:3000

Open http://localhost:5173 in your web browser.

---

## 📝 Creating Your First Video

### Step 1: Enter a Keyword

In the input field, type a keyword or topic. Examples:

**Good Keywords:**
- ✅ "Artificial Intelligence"
- ✅ "Climate Change"
- ✅ "Machine Learning"
- ✅ "Solar Energy"
- ✅ "Ocean Conservation"

**Tips:**
- Keep it simple (1-3 words)
- Choose educational topics
- Be specific enough for clear content

### Step 2: Click "Generate Video"

Click the **🎬 Generate Video** button.

The system will:
1. Generate a 5-scene story structure
2. Create images for each scene
3. Animate images into videos
4. Generate a narration script
5. Synthesize professional voiceover
6. Compose everything into a final video

### Step 3: Monitor Progress

Watch the progress bar as your video is created:

- **0-20%**: Generating captions and image prompts
- **20-40%**: Creating images with AI
- **40-70%**: Converting images to animated videos
- **70-80%**: Generating voiceover narration
- **80-100%**: Composing final video

**⏱️ Expected Time**: 8-12 minutes

### Step 4: Preview Your Video

Once complete (100%), you'll see:

1. **Script**: The narration text
2. **Scenes**: Thumbnail previews of each scene
3. **Video Player**: Watch your final video!

Click play to preview your creation.

---

## 📺 Uploading to YouTube

### First Time Setup

1. **Connect YouTube Account**
   - Click the **📺 Connect YouTube** button
   - A popup window will open
   - Sign in with your Google account
   - Authorize the app to upload videos
   - The popup will close automatically

2. **Confirmation**
   - You'll see "YouTube Connected" ✓
   - You're now ready to upload!

### Uploading a Video

1. **After video generation completes**, click:
   **📤 Upload to YouTube**

2. **Upload Process**
   - Video is uploaded to your YouTube channel
   - Set as "Unlisted" (not public by default)
   - Title: "AI Generated Video: [Your Keyword]"
   - Description: Auto-generated with script

3. **Success!**
   - A link to your YouTube video opens
   - Share it with friends or make it public!

---

## 🎨 Understanding Your Video

### Video Structure

Each video has **5 scenes**, each lasting **5 seconds**:

1. **Hook** (0-5s): Attention-grabbing intro
2. **Problem** (5-10s): What challenge exists
3. **Action** (10-15s): How it's being addressed
4. **Impact** (15-20s): What difference it makes
5. **Conclusion** (20-25s): Satisfying wrap-up

**Total Length**: ~25 seconds

### Scene Components

Each scene includes:
- **Title**: Short caption overlay
- **Visual**: AI-generated animated video
- **Narration**: Professional voiceover

---

## 📊 Project History

### Viewing Past Projects

The app shows all your generated videos in the projects list.

For each project, you can see:
- **Keyword**: Original topic
- **Status**: Current state (pending, generating, completed, failed)
- **Progress**: Percentage complete
- **Date**: When it was created

---

## ⚙️ Customization Options

### Want Different Results?

If you're not satisfied with a video:

1. **Try Again**: Generate with the same keyword for different results
2. **Modify Keyword**: Adjust wording for different focus
3. **Be More Specific**: "AI in Healthcare" vs "Artificial Intelligence"

### Voice Customization

To change the narrator voice:

1. Visit [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Find a voice you like
3. Note the Voice ID
4. Edit `server/services/elevenlabs.service.ts`:
   \`\`\`typescript
   private voiceId = 'your-chosen-voice-id';
   \`\`\`
5. Restart the server

---

## 💡 Tips for Best Results

### Choosing Topics

**Great Topics:**
- ✅ Educational subjects (Science, Technology, History)
- ✅ How-to concepts (How AI Works, What is Blockchain)
- ✅ Current events (Climate Change, Space Exploration)
- ✅ Explanatory content (Quantum Computing, DNA)

**Avoid:**
- ❌ Too broad ("Everything")
- ❌ Too narrow ("My cat's birthday")
- ❌ Offensive content
- ❌ Copyrighted material

### Optimizing Generation Time

**Faster Generation:**
- Use simpler topics
- Generate during off-peak hours
- Ensure stable internet connection

**Better Quality:**
- Use specific, clear keywords
- Wait patiently for completion
- Preview before uploading

---

## 🎯 Use Cases

### 1. Educational Content
Create explainer videos for:
- School projects
- Online courses
- Tutorial series
- Knowledge sharing

### 2. Social Media
Share on:
- YouTube Shorts
- TikTok
- Instagram Reels
- Twitter/X

### 3. Marketing
Generate content for:
- Product explainers
- Service introductions
- Brand awareness
- Quick demos

### 4. Personal Learning
- Summarize research topics
- Create study aids
- Visual note-taking
- Concept reinforcement

---

## 🐛 What If Something Goes Wrong?

### Generation Fails

**If status shows "Failed":**

1. Check the error message
2. Common causes:
   - API rate limits reached
   - Network connectivity issues
   - Invalid API keys
3. **Solution**: Wait a few minutes and try again

### Video Quality Issues

**If video looks off:**

1. AI-generated content varies
2. Try generating again for different results
3. Adjust your keyword for clarity

### Upload Fails

**If YouTube upload doesn't work:**

1. Re-authorize YouTube:
   - Click "Connect YouTube" again
   - Sign in when prompted
2. Check your internet connection
3. Verify your YouTube account is in good standing

---

## 📱 Supported Browsers

**Recommended:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Note**: Older browsers may have issues with video playback.

---

## 💰 Understanding Costs

Each video generation costs approximately **$1.42**:

- OpenAI (captions, script): $0.01
- PiAPI Images: $0.08
- PiAPI Videos: $1.30
- ElevenLabs (audio): $0.03

**Budget Planning:**
- 10 videos = ~$14
- 50 videos = ~$71
- 100 videos = ~$142

**Free Trials:**
- Most services offer free credits to start
- Test the system before committing

---

## 📋 Keyboard Shortcuts

- **Enter**: Submit keyword (when focused on input)
- **Esc**: Close modals/popups
- **Space**: Play/pause video preview
- **F5**: Refresh page (if stuck)

---

## 🔒 Privacy & Data

### What We Store

**Locally (on your computer):**
- Generated videos (in `uploads/` folder)
- Audio files
- Project metadata

**We DO NOT:**
- Upload your data to external servers (except to generate videos)
- Store your videos permanently online
- Share your content without permission

### Your YouTube Videos

- Videos are uploaded as "Unlisted" by default
- Only people with the link can view them
- You control the privacy setting
- You can delete them anytime from YouTube

---

## 🆘 Getting Help

### Self-Help Resources

1. **README.md**: Technical documentation
2. **SETUP_INSTRUCTIONS.md**: Setup guide
3. **PROJECT_SUMMARY.md**: Architecture details
4. **QUICKSTART.md**: Fast setup guide

### Common Questions

**Q: How long does generation take?**
A: 8-12 minutes on average

**Q: Can I generate multiple videos at once?**
A: Currently one at a time per session

**Q: Can I download the video?**
A: Yes! Videos are saved in the `uploads/` folder

**Q: Can I edit the generated video?**
A: Generated videos are final, but you can:
- Download and edit externally
- Generate again for different results

**Q: What languages are supported?**
A: Currently optimized for English

---

## 🎓 Learning Resources

### Understanding AI Video Generation

**Image Generation (Flux):**
- Creates unique visuals from text descriptions
- No two images are exactly the same
- Quality depends on prompt clarity

**Video Animation (Kling):**
- Adds motion to static images
- Camera movements (zoom, pan)
- Natural-looking transitions

**Voice Synthesis (ElevenLabs):**
- Text-to-speech technology
- Multiple voice options
- Natural intonation and pacing

### Improving Your Videos

**Better Prompts = Better Results:**
- Be specific: "Climate change effects on polar bears"
- Use descriptive language
- Focus on visual concepts

**Experiment:**
- Try different phrasings
- Test various topics
- Learn what works best

---

## ✅ Success Checklist

Before generating your first video:

- [ ] Server is running (`npm run dev`)
- [ ] Browser is open to http://localhost:5173
- [ ] All API keys are configured in `.env`
- [ ] Internet connection is stable
- [ ] You have a clear topic in mind

Ready? Let's create amazing videos! 🎬

---

## 🎉 Congratulations!

You're now ready to generate professional AI videos!

Start with a simple topic, watch the magic happen, and share your creation with the world.

**Happy Creating!** 🚀✨

---

*For technical support or questions, refer to the main README.md or open an issue on GitHub.*
