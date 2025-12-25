# Video Thumbnail Generation with FFmpeg

## Overview

The application now generates real video thumbnails by extracting frames from video files using FFmpeg.

## Features

✅ **Real Frame Extraction** - Extracts actual frame from video at 5 seconds
✅ **Automatic Fallback** - Uses placeholder if FFmpeg is not available
✅ **Smart Caching** - Only regenerates if video is newer than thumbnail
✅ **Play Button Overlay** - Shows ▶️ icon on video thumbnails
✅ **Optimized Size** - Generates 640px wide thumbnails for fast loading

## Installation

### On Raspberry Pi (Raspberry Pi OS):

```bash
# Update package list
sudo apt update

# Install FFmpeg
sudo apt install ffmpeg -y

# Verify installation
ffmpeg -version
```

**Expected output:**
```
ffmpeg version 4.3.x
```

### On Other Linux Distributions:

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**Fedora/RHEL:**
```bash
sudo dnf install ffmpeg
```

**Arch:**
```bash
sudo pacman -S ffmpeg
```

### On macOS:

```bash
brew install ffmpeg
```

### On Windows:

1. Download from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to System PATH
4. Restart terminal

## How It Works

### During Indexing:

When the application indexes video files, it:

1. **Detects Video Files** - Identifies MP4, MOV, AVI, MKV files
2. **Checks for Existing Thumbnail** - Skips if thumbnail exists and is up-to-date
3. **Calls FFmpeg** - Extracts frame at 5 seconds
4. **Saves Thumbnail** - Stores in `/thumbnails` directory
5. **Falls Back if Needed** - Creates placeholder if FFmpeg fails

### FFmpeg Command Used:

```bash
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 -vf scale=640:-1 -q:v 2 thumbnail.jpg -y
```

**Parameters:**
- `-i video.mp4` - Input video file
- `-ss 00:00:05` - Seek to 5 seconds
- `-vframes 1` - Extract only 1 frame
- `-vf scale=640:-1` - Scale to 640px width, maintain aspect ratio
- `-q:v 2` - High quality JPEG (1-31, lower = better)
- `-y` - Overwrite existing file

### Performance on Raspberry Pi 3B+:

- **Per Video:** ~5-10 seconds
- **100 Videos:** ~8-15 minutes total
- **One-time Cost:** Thumbnails are cached!

### Storage:

- **Per Thumbnail:** ~30-80 KB (depending on video content)
- **100 Thumbnails:** ~3-8 MB total
- Stored in: `{gallery.image.folder}/thumbnails/`

## Frontend Display

### Video Thumbnails Show:

✅ **Real frame from video** (not placeholder)
✅ **Play button icon** (▶️ in top-left corner)
✅ **Duration badge** (e.g., "5:23" in top-right)
✅ **Hover effect** - Play icon scales up

### CSS Classes:

```css
.memory-video-indicator    /* Play button icon */
.memory-video-duration     /* Duration badge */
.memory-video-card         /* Video card container */
```

## Troubleshooting

### FFmpeg Not Found

**Symptom:** Application logs show "FFmpeg is not available"

**Solution:**
```bash
# Check if FFmpeg is installed
which ffmpeg

# If not found, install it
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

### Thumbnails Not Generating

**Check logs for:**
```
✅ FFmpeg thumbnail generated: filename.jpg (45 KB)
```

**Or:**
```
⚠️ FFmpeg failed, generating placeholder thumbnail
```

**Common issues:**
1. FFmpeg not in PATH
2. Video file corrupted
3. Insufficient disk space
4. Permission issues

### Placeholder Thumbnails Still Showing

**If you see dark thumbnails with play icons instead of real frames:**

1. Check FFmpeg is installed: `ffmpeg -version`
2. Re-run indexing: Settings → Memories → Index All Photos & Videos
3. Check application logs for errors
4. Verify write permissions on thumbnails directory

## Manual Thumbnail Generation

### Via API:

```bash
curl http://localhost:8080/api/memories/debug/index
```

### Via Settings Page:

1. Go to Settings (⚙️)
2. Click "Memories" tab
3. Click "Index All Photos & Videos"
4. Wait for completion

### Via Command Line (Manual):

```bash
cd /path/to/gallery

# Generate thumbnail for single video
ffmpeg -i europe/MVI_9317.MP4 -ss 00:00:05 -vframes 1 -vf scale=640:-1 -q:v 2 thumbnails/europe_MVI_9317.jpg -y

# Batch generate for all videos
for video in **/*.MP4; do
    output="thumbnails/$(echo $video | tr '/' '_' | sed 's/.MP4/.jpg/')"
    ffmpeg -i "$video" -ss 00:00:05 -vframes 1 -vf scale=640:-1 -q:v 2 "$output" -y
done
```

## Configuration

### application.properties:

```properties
# Gallery folder (where videos are stored)
gallery.image.folder=C:/gallery

# Thumbnails are automatically stored in:
# ${gallery.image.folder}/thumbnails/
```

### No additional configuration needed!

## Technical Details

### Class: `VideoThumbnailGenerator`

**Location:** `au.com.siac.gallery.video.util.VideoThumbnailGenerator`

**Methods:**
- `generateVideoThumbnail(videoPath, thumbnailPath)` - Main generation method
- `generateWithFFmpeg(videoPath, thumbnailPath)` - FFmpeg extraction
- `generatePlaceholderThumbnail(videoPath, thumbnailPath)` - Fallback
- `isFFmpegAvailable()` - Check if FFmpeg is installed
- `thumbnailExists(videoPath, thumbnailPath)` - Check if thumbnail is cached

### Thumbnail Naming:

**Video:** `europe/MVI_9317.MP4`
**Thumbnail:** `thumbnails/europe_MVI_9317.jpg`

Slashes are replaced with underscores to create flat structure in thumbnails folder.

## Future Enhancements

🔮 **Possible improvements:**
- Multiple thumbnail sizes (small, medium, large)
- Extract frame from different timestamps (start, middle, end)
- Video sprite sheets (hover preview)
- Async thumbnail generation (background jobs)
- Progress bar during batch generation
- Retry failed thumbnails

## Support

**Check Application Logs:**
```bash
tail -f logs/application.log | grep VideoThumbnail
```

**Check FFmpeg Logs:**
```bash
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 test.jpg -y
```

**Common Error Messages:**
- ❌ "FFmpeg is not available" → Install FFmpeg
- ❌ "FFmpeg failed with exit code 1" → Video might be corrupted
- ❌ "Failed to generate video thumbnail" → Check permissions
- ✅ "FFmpeg thumbnail generated" → Success!
