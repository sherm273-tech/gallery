# VIDEO SUPPORT - PHASE 1 IMPLEMENTATION

## Overview
Phase 1 adds core video support to Sang's and Sherm's Station, allowing videos to be displayed alongside photos in the memories gallery.

## What's New in Phase 1

### Backend Changes

**1. Database Schema Updates**
- `PhotoMetadata` entity now supports both images and videos
- New fields:
  - `mediaType` (VARCHAR) - "IMAGE" or "VIDEO"
  - `videoDuration` (INTEGER) - Duration in seconds
  - `videoResolution` (VARCHAR) - e.g., "1920x1080"

**2. New Utility Classes**
- `VideoThumbnailGenerator` - Generates placeholder thumbnails for videos
  - Location: `src/main/java/au/com/siac/gallery/video/util/VideoThumbnailGenerator.java`
  - Creates attractive play button thumbnails
  - Future: Will extract actual frames using FFmpeg
  
- `VideoMetadataExtractor` - Extracts metadata from video files
  - Location: `src/main/java/au/com/siac/gallery/video/util/VideoMetadataExtractor.java`
  - Detects video file types
  - Extracts capture date from file creation time
  - Future: Will extract actual duration/resolution using FFmpeg

**3. Service Updates**
- `MemoriesService` now detects and indexes both photos and videos
- Separate methods: `indexImageFile()` and `indexVideoFile()`
- API responses include video metadata (mediaType, isVideo, duration, resolution)

**4. Supported Video Formats**
- MP4, MOV, AVI, MKV, WEBM, M4V, WMV

### Frontend Changes

**1. Video Player Module** (NEW)
- Location: `src/main/resources/static/js/video/video-player.js`
- Full-screen modal video player
- Keyboard shortcuts:
  - `Space` - Play/Pause
  - `Esc` - Close player
  - `F` - Toggle fullscreen
  - `←/→` - Seek backward/forward 5 seconds
- Auto-initializes on page load

**2. Memories Gallery Updates**
- Videos display with 🎬 icon overlay
- Duration badge (e.g., "2:35") on video thumbnails
- Click video thumbnail → Opens video player modal
- Click photo thumbnail → Opens image lightbox (unchanged)

**3. Styling**
- Video indicator and duration badges
- Responsive design for mobile
- Hover effects on video cards

### Configuration

Added to `application.properties`:
```properties
# Video Support (Phase 1)
media.video.formats=mp4,mov,avi,mkv,webm,m4v,wmv
media.video.thumbnails.enabled=true
media.video.thumbnails.frame-time=3
```

## Files Modified

### Backend (6 files)
1. `PhotoMetadata.java` - Added video fields
2. `MemoriesService.java` - Video detection and indexing
3. `application.properties` - Video configuration

### Backend New Files (2 files)
4. `VideoThumbnailGenerator.java` - NEW
5. `VideoMetadataExtractor.java` - NEW

### Frontend (4 files)
6. `memories.js` - Video card creation and player integration
7. `memories.css` - Video indicator styles
8. `index.html` - Include video CSS
9. `scripts.html` - Include video player script

### Frontend New Files (2 files)
10. `video-player.js` - NEW
11. `video-player.css` - NEW

## How to Use

### 1. Place Videos in Your Gallery
Put video files in your image folder alongside photos:
```
C:/gallery/
├── Tasmania2021/
│   ├── beach.jpg
│   ├── beach_swim.mp4  ← Video file
│   ├── sunset.jpg
│   └── dinner.mov      ← Video file
```

### 2. Index Videos
Videos are automatically indexed when you run the indexing:
- Manual: Click "Index Photos" in memories settings
- Automatic: Runs daily at 2 AM (if enabled)

### 3. View Videos
- Open "On This Day" in calendar
- Videos appear with 🎬 icon and duration
- Click video thumbnail to play

## Database Migration

The new columns are added automatically on first run (JPA auto-update).

Existing photos will have:
- `mediaType` = "IMAGE" (default)
- `videoDuration` = NULL
- `videoResolution` = NULL

## Testing Phase 1

### Test Checklist
- [ ] Place test video files in gallery folder
- [ ] Run indexing
- [ ] Check database - videos should appear in `photo_metadata` table
- [ ] View "On This Day" - videos should show with 🎬 icon
- [ ] Click video thumbnail - player should open
- [ ] Test keyboard shortcuts (Space, Esc, F, arrows)
- [ ] Test on mobile device
- [ ] Verify existing photo functionality still works

### Expected Behavior
- **Videos**: Click → Video player modal opens
- **Photos**: Click → Image lightbox opens (unchanged)
- **Mixed gallery**: Photos and videos display together
- **Thumbnails**: Videos have placeholder with play icon

## Known Limitations (Phase 1)

1. **Placeholder Thumbnails**: Videos show generated thumbnails (not actual frames)
   - Will be improved in future with FFmpeg integration

2. **Estimated Duration**: Duration is estimated from file size
   - Will be improved in future with actual metadata extraction

3. **No Slideshow Integration**: Videos don't play in slideshow yet
   - Coming in Phase 2

4. **Resolution**: Shows "Unknown" for now
   - Will be extracted with FFmpeg later

## Future Phases

### Phase 2: Slideshow Integration
- Videos play automatically during slideshows
- Music ducking during video audio
- Configuration options

### Phase 3: Event Slideshow Support
- Videos in calendar event slideshows
- Per-event video settings

### Phase 4: Memories Enhancement
- Videos in "On This Day" lightbox
- Navigate through mixed photo/video galleries

### Phase 5: Advanced Features
- Dedicated videos section
- Video playlists
- Video statistics
- FFmpeg integration for real thumbnails and metadata

## Troubleshooting

### Videos Not Appearing
1. Check file extensions are supported
2. Verify files are in `C:/gallery` folder
3. Run indexing manually
4. Check browser console for errors

### Video Won't Play
1. Check browser supports video format (MP4 most compatible)
2. Try different browser
3. Check file isn't corrupted
4. Verify file path in browser network tab

### Thumbnail Issues
1. Thumbnails are generated during indexing
2. Check `.thumbnails` folder exists
3. Check write permissions on gallery folder

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check server logs
3. Verify database schema updated correctly
4. Test with known-good MP4 file first

## Next Steps

After testing Phase 1:
1. Report any issues found
2. Confirm all videos are being indexed
3. Ready to proceed with Phase 2 (Slideshow Integration)
