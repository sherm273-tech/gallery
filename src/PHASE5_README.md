# Phase 5: Advanced Video Features - Implementation Guide

## Overview
Phase 5 adds a comprehensive video management system with library browsing, playlists, and statistics.

## What Was Created

### Backend (5 new files):
1. **VideoPlaylist.java** - Entity for storing playlists
2. **VideoPlaylistRepository.java** - JPA repository for playlists
3. **VideoService.java** - Business logic for video operations
4. **VideoController.java** - REST API endpoints
5. **VideoStreamingController.java** - Already exists from Phase 1

### Frontend (4 new files):
1. **video-library.js** - Video browsing interface
2. **video-playlists.js** - Playlist management
3. **video-stats.js** - Statistics dashboard
4. **videos.css** - Complete styling

---

## Integration Steps

### Step 1: Add Videos Tab to Your UI

Add this to your main navigation (wherever you have Photos, Music, Calendar tabs):

```html
<button class="tab-button" data-tab="videos">
    📹 Videos
</button>
```

### Step 2: Add Videos Tab Content

Add this section to your main content area (alongside photos-tab, music-tab, etc):

```html
<div id="videos-tab" class="tab-content">
    <div class="video-library-container">
        <!-- Header -->
        <div class="video-library-header">
            <h1 class="video-library-title">📹 Video Library</h1>
            <div id="videoLibraryStats" class="video-library-stats"></div>
        </div>
        
        <!-- Toolbar -->
        <div class="video-toolbar">
            <div class="toolbar-section">
                <button id="filterAllVideos" class="filter-btn active">All</button>
                <button id="filterShort" class="filter-btn">Short (&lt;1min)</button>
                <button id="filterMedium" class="filter-btn">Medium (1-5min)</button>
                <button id="filterLong" class="filter-btn">Long (&gt;5min)</button>
            </div>
            
            <div class="toolbar-section">
                <select id="videoSortSelect" class="video-sort">
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="duration-desc">Longest First</option>
                    <option value="duration-asc">Shortest First</option>
                </select>
                
                <div class="view-toggle">
                    <button id="videoGridView" class="view-btn active">⊞ Grid</button>
                    <button id="videoListView" class="view-btn">☰ List</button>
                </div>
                
                <button id="refreshVideos" class="btn-icon">🔄</button>
            </div>
        </div>
        
        <!-- Selection Info -->
        <div class="toolbar-section" style="margin-bottom: 10px;">
            <span id="selectionInfo" style="color: #aaa;"></span>
            <button id="selectAllVideos" class="btn-secondary">Select All</button>
            <button id="clearSelection" class="btn-secondary">Clear</button>
            <button id="addToPlaylist" class="btn-primary" disabled>Add to Playlist</button>
        </div>
        
        <!-- Video Grid -->
        <div id="videoGrid" class="video-grid"></div>
        
        <!-- Playlists Section -->
        <div class="playlists-section">
            <div class="playlists-header">
                <h2>🎬 Playlists</h2>
                <button id="createPlaylistBtn" class="btn-primary">+ Create Playlist</button>
            </div>
            <div id="playlistsList" class="playlists-list"></div>
        </div>
        
        <!-- Statistics Dashboard -->
        <div class="stats-dashboard">
            <h2 style="color: #fff; margin-bottom: 20px;">📊 Statistics</h2>
            <div id="statsOverview"></div>
            <div id="folderBreakdown" class="breakdown-section"></div>
            <div id="yearBreakdown" class="breakdown-section"></div>
            <div id="durationBreakdown" class="breakdown-section"></div>
        </div>
    </div>
</div>

<!-- Create Playlist Dialog -->
<div id="createPlaylistDialog" class="video-dialog">
    <div class="dialog-content">
        <div class="dialog-header">
            <h3>Create New Playlist</h3>
            <button class="dialog-close">✕</button>
        </div>
        <div class="form-group">
            <label>Playlist Name</label>
            <input type="text" id="newPlaylistName" placeholder="My Playlist">
        </div>
        <div class="form-group">
            <label>Description (optional)</label>
            <textarea id="newPlaylistDescription" placeholder="Playlist description..."></textarea>
        </div>
        <div class="dialog-actions">
            <button class="btn-secondary dialog-close">Cancel</button>
            <button id="saveNewPlaylist" class="btn-primary">Create</button>
        </div>
    </div>
</div>

<!-- Edit Playlist Dialog -->
<div id="editPlaylistDialog" class="video-dialog">
    <div class="dialog-content" style="max-width: 700px;">
        <div class="dialog-header">
            <h3>Edit Playlist</h3>
            <button class="dialog-close">✕</button>
        </div>
        <div class="form-group">
            <label>Playlist Name</label>
            <input type="text" id="editPlaylistName">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="editPlaylistDescription"></textarea>
        </div>
        <div class="form-group">
            <label>Videos</label>
            <div id="playlistVideosEditor" style="max-height: 300px; overflow-y: auto;"></div>
        </div>
        <div class="dialog-actions">
            <button class="btn-secondary dialog-close">Cancel</button>
            <button id="savePlaylistChanges" class="btn-primary">Save Changes</button>
        </div>
    </div>
</div>

<!-- Add to Playlist Dialog -->
<div id="addToPlaylistDialog" class="video-dialog">
    <div class="dialog-content">
        <div class="dialog-header">
            <h3>Add to Playlist</h3>
            <button class="dialog-close">✕</button>
        </div>
        <div id="playlistSelectList"></div>
        <div class="dialog-actions">
            <button class="btn-secondary dialog-close">Cancel</button>
        </div>
    </div>
</div>
```

### Step 3: Add Script References

Add these scripts to your HTML (in the `<head>` or before `</body>`):

```html
<link rel="stylesheet" href="/css/videos.css">
<script src="/js/video/video-library.js"></script>
<script src="/js/video/video-playlists.js"></script>
<script src="/js/video/video-stats.js"></script>
```

### Step 4: Initialize Tab Switching

Make sure your existing tab switching code includes the videos tab:

```javascript
// In your existing tab switching code
document.querySelectorAll('[data-tab="videos"]').forEach(btn => {
    btn.addEventListener('click', () => {
        // Hide other tabs
        document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
        // Show videos tab
        document.getElementById('videos-tab').style.display = 'block';
        // Load videos if not already loaded
        if (window.VideoLibrary) {
            VideoLibrary.loadVideos();
        }
    });
});
```

---

## Features

### 1. Video Library
- Browse all videos in your collection
- Grid or list view
- Sort by date, duration, name
- Filter by duration (short/medium/long)
- Multi-select videos
- Play videos in modal player

### 2. Playlists
- Create custom playlists
- Add/remove videos
- Edit playlist name and description
- Play entire playlist
- Reorder videos (manual drag-drop can be added)

### 3. Statistics
- Total videos count
- Total duration and file size
- Videos by folder (top 10)
- Videos by year
- Duration breakdown (short/medium/long)

---

## API Endpoints

All endpoints are prefixed with `/api/videos`:

### Videos
- `GET /list` - Get all videos (with optional filters)
  - Query params: `sortBy`, `folder`
- `GET /stats` - Get statistics

### Playlists
- `GET /playlists` - Get all playlists
- `GET /playlists/{id}` - Get playlist by ID
- `GET /playlists/{id}/videos` - Get videos in playlist
- `POST /playlists` - Create new playlist
  - Body: `{name, description}`
- `PUT /playlists/{id}` - Update playlist
  - Body: `{name, description, videoPaths}`
- `DELETE /playlists/{id}` - Delete playlist

---

## Database

H2 will automatically create the `video_playlists` table with these columns:
- `id` (Long)
- `name` (String, 255)
- `description` (TEXT)
- `video_paths` (TEXT, JSON array)
- `video_count` (Integer)
- `total_duration` (Long, seconds)
- `created_at` (LocalDateTime)
- `updated_at` (LocalDateTime)

---

## Testing

1. **Restart your application** - Database table will be created automatically
2. **Click Videos tab** - Should load all videos
3. **Try sorting/filtering** - Test different options
4. **Create a playlist** - Click "Create Playlist"
5. **Add videos** - Select videos and click "Add to Playlist"
6. **View statistics** - Scroll down to see stats dashboard

---

## Optional Enhancements

### Drag-and-Drop Reordering
To add drag-and-drop reordering in playlists, add this library:
```html
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
```

Then in `video-playlists.js`:
```javascript
const sortable = Sortable.create(document.getElementById('playlistVideosEditor'), {
    handle: '.drag-handle',
    animation: 150
});
```

### Video Favorites
Add a `favorites` boolean field to `PhotoMetadata` entity and add star/unstar functionality.

### Video Tags
Add a `tags` TEXT field to `PhotoMetadata` and implement tag management.

---

## Troubleshooting

**Videos not loading:**
- Check browser console for errors
- Verify `/api/videos/list` returns data
- Make sure videos are indexed (Phase 1)

**Playlists not saving:**
- Check browser console for errors
- Verify backend logs for exceptions
- Ensure playlist names are unique

**Statistics not showing:**
- Verify `/api/videos/stats` returns data
- Check that videos have duration metadata

---

## What's Next?

Phase 5 is complete! You now have:
- ✅ Phase 1: Core video infrastructure
- ✅ Phase 2: Video slideshow integration
- ✅ Phase 3: Event slideshow videos
- ✅ Phase 4: Memories lightbox videos
- ✅ Phase 5: Advanced video management

Your multimedia station is fully feature-complete! 🎉
