// video-playlists.js - Video playlist management

const VideoPlaylists = (function() {
    
    let playlists = [];
    let currentPlaylist = null;
    
    /**
     * Initialize playlists module
     */
    function init() {
        console.log('[VideoPlaylists] Initializing...');
        setupEventListeners();
        loadPlaylists();
    }
    
    /**
     * Setup event listeners (can be called multiple times safely)
     */
    function setupEventListeners() {
        // Create new playlist
        const createBtn = document.getElementById('createPlaylistBtn');
        if (createBtn && !createBtn._hasPlaylistListener) {
            createBtn.addEventListener('click', showCreatePlaylistDialog);
            createBtn._hasPlaylistListener = true;
        }
        
        // Close dialogs
        document.querySelectorAll('.dialog-close').forEach(btn => {
            if (!btn._hasCloseListener) {
                btn.addEventListener('click', () => {
                    closeAllDialogs();
                });
                btn._hasCloseListener = true;
            }
        });
        
        // Save new playlist
        const saveNewBtn = document.getElementById('saveNewPlaylist');
        if (saveNewBtn && !saveNewBtn._hasSaveListener) {
            saveNewBtn.addEventListener('click', createPlaylist);
            saveNewBtn._hasSaveListener = true;
        }
        
        // Save playlist updates
        const saveChangesBtn = document.getElementById('savePlaylistChanges');
        if (saveChangesBtn && !saveChangesBtn._hasSaveChangesListener) {
            saveChangesBtn.addEventListener('click', savePlaylistChanges);
            saveChangesBtn._hasSaveChangesListener = true;
        }
    }
    
    /**
     * Load all playlists
     */
    async function loadPlaylists() {
        try {
            const response = await fetch('/api/videos/playlists');
            if (!response.ok) {
                throw new Error('Failed to load playlists');
            }
            
            playlists = await response.json();
            console.log('[VideoPlaylists] Loaded', playlists.length, 'playlists');
            
            renderPlaylists();
            
        } catch (error) {
            console.error('[VideoPlaylists] Error loading playlists:', error);
        }
    }
    
    /**
     * Render playlists list
     */
    function renderPlaylists() {
        const container = document.getElementById('playlistsList');
        if (!container) return;
        
        if (playlists.length === 0) {
            container.innerHTML = '<p class="no-playlists">No playlists yet. Create one to get started!</p>';
            return;
        }
        
        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-item" data-id="${playlist.id}">
                <div class="playlist-icon">🎬</div>
                <div class="playlist-info">
                    <div class="playlist-name">${playlist.name}</div>
                    <div class="playlist-meta">
                        ${playlist.videoCount} videos • ${formatDuration(playlist.totalDuration)}
                    </div>
                </div>
                <div class="playlist-actions">
                    <button class="btn-icon" onclick="VideoPlaylists.playPlaylist(${playlist.id})" title="Play">▶</button>
                    <button class="btn-icon" onclick="VideoPlaylists.editPlaylist(${playlist.id})" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="VideoPlaylists.deletePlaylist(${playlist.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Show create playlist dialog
     */
    function showCreatePlaylistDialog() {
        const dialog = document.getElementById('createPlaylistDialog');
        if (dialog) {
            dialog.style.display = 'flex';
            document.getElementById('newPlaylistName').value = '';
            document.getElementById('newPlaylistDescription').value = '';
        }
    }
    
    /**
     * Create new playlist
     */
    async function createPlaylist() {
        const name = document.getElementById('newPlaylistName').value.trim();
        const description = document.getElementById('newPlaylistDescription').value.trim();
        
        if (!name) {
            alert('Please enter a playlist name');
            return;
        }
        
        try {
            const response = await fetch('/api/videos/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create playlist');
            }
            
            await loadPlaylists();
            closeAllDialogs();
            
        } catch (error) {
            console.error('[VideoPlaylists] Error creating playlist:', error);
            alert('Failed to create playlist. Name might already exist.');
        }
    }
    
    /**
     * Edit playlist
     */
    async function editPlaylist(id) {
        try {
            const response = await fetch(`/api/videos/playlists/${id}`);
            if (!response.ok) {
                throw new Error('Failed to load playlist');
            }
            
            currentPlaylist = await response.json();
            
            // Load playlist videos
            const videosResponse = await fetch(`/api/videos/playlists/${id}/videos`);
            const videos = await videosResponse.json();
            
            // Show edit dialog
            const dialog = document.getElementById('editPlaylistDialog');
            if (dialog) {
                dialog.style.display = 'flex';
                document.getElementById('editPlaylistName').value = currentPlaylist.name;
                document.getElementById('editPlaylistDescription').value = currentPlaylist.description || '';
                
                renderPlaylistVideos(videos);
            }
            
        } catch (error) {
            console.error('[VideoPlaylists] Error loading playlist:', error);
            alert('Failed to load playlist');
        }
    }
    
    /**
     * Render videos in playlist editor
     */
    function renderPlaylistVideos(videos) {
        const container = document.getElementById('playlistVideosEditor');
        if (!container) return;
        
        if (videos.length === 0) {
            container.innerHTML = '<p class="no-videos">No videos in this playlist</p>';
            return;
        }
        
        container.innerHTML = videos.map((video, index) => `
            <div class="playlist-video-item" data-filepath="${video.filePath}">
                <span class="drag-handle">☰</span>
                <img src="/images/${video.filePath}" alt="${video.filePath.split('/').pop()}">
                <div class="video-info">
                    <div class="video-name">${video.filePath.split('/').pop()}</div>
                    <div class="video-duration">${formatDuration(video.videoDuration || 0)}</div>
                </div>
                <button class="btn-remove" onclick="VideoPlaylists.removeFromPlaylist('${video.filePath}')">✕</button>
            </div>
        `).join('');
    }
    
    /**
     * Save playlist changes
     */
    async function savePlaylistChanges() {
        if (!currentPlaylist) return;
        
        const name = document.getElementById('editPlaylistName').value.trim();
        const description = document.getElementById('editPlaylistDescription').value.trim();
        
        // Get current video order from UI
        const videoItems = document.querySelectorAll('.playlist-video-item');
        const videoPaths = Array.from(videoItems).map(item => item.dataset.filepath);
        
        try {
            const response = await fetch(`/api/videos/playlists/${currentPlaylist.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, videoPaths })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update playlist');
            }
            
            await loadPlaylists();
            closeAllDialogs();
            
        } catch (error) {
            console.error('[VideoPlaylists] Error updating playlist:', error);
            alert('Failed to update playlist');
        }
    }
    
    /**
     * Delete playlist
     */
    async function deletePlaylist(id) {
        const playlist = playlists.find(p => p.id === id);
        if (!playlist) return;
        
        if (!confirm(`Delete playlist "${playlist.name}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/videos/playlists/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete playlist');
            }
            
            await loadPlaylists();
            
        } catch (error) {
            console.error('[VideoPlaylists] Error deleting playlist:', error);
            alert('Failed to delete playlist');
        }
    }
    
    /**
     * Play entire playlist
     */
    async function playPlaylist(id) {
        try {
            const response = await fetch(`/api/videos/playlists/${id}/videos`);
            const videos = await response.json();
            
            if (videos.length === 0) {
                alert('Playlist is empty');
                return;
            }
            
            // Play first video (could be enhanced to queue all videos)
            const firstVideo = videos[0];
            const videoPath = `/api/videos/${firstVideo.filePath}`;
            const fileName = firstVideo.filePath.split('/').pop();
            
            if (window.VideoPlayer) {
                window.VideoPlayer.openVideo(videoPath, fileName);
            }
            
        } catch (error) {
            console.error('[VideoPlaylists] Error playing playlist:', error);
        }
    }
    
    /**
     * Show add to playlist dialog
     */
    function showAddToPlaylistDialog(videoPaths) {
        console.log('[VideoPlaylists] showAddToPlaylistDialog called with', videoPaths.length, 'videos');
        
        if (!videoPaths || videoPaths.length === 0) {
            console.log('[VideoPlaylists] No video paths provided');
            return;
        }
        
        const dialog = document.getElementById('addToPlaylistDialog');
        if (!dialog) {
            console.error('[VideoPlaylists] addToPlaylistDialog element not found');
            return;
        }
        
        // Store selected videos
        dialog.dataset.videos = JSON.stringify(videoPaths);
        
        console.log('[VideoPlaylists] Available playlists:', playlists.length);
        
        // Render playlist selection
        const container = document.getElementById('playlistSelectList');
        if (container) {
            if (playlists.length === 0) {
                container.innerHTML = `
                    <p style="text-align: center; color: #aaa; padding: 20px;">
                        No playlists yet. Create a playlist first!
                    </p>
                `;
            } else {
                container.innerHTML = playlists.map(playlist => `
                    <div class="playlist-select-item" data-id="${playlist.id}">
                        <span class="playlist-icon">🎬</span>
                        <span class="playlist-name">${playlist.name}</span>
                        <span class="playlist-count">${playlist.videoCount} videos</span>
                    </div>
                `).join('');
                
                // Add click handlers
                container.querySelectorAll('.playlist-select-item').forEach(item => {
                    item.addEventListener('click', () => {
                        addVideosToPlaylist(parseInt(item.dataset.id), videoPaths);
                    });
                });
            }
        }
        
        console.log('[VideoPlaylists] Showing dialog');
        dialog.style.display = 'flex';
    }
    
    /**
     * Add videos to playlist
     */
    async function addVideosToPlaylist(playlistId, videoPaths) {
        try {
            // Get current playlist
            const response = await fetch(`/api/videos/playlists/${playlistId}`);
            const playlist = await response.json();
            
            // Get current videos
            const videosResponse = await fetch(`/api/videos/playlists/${playlistId}/videos`);
            const currentVideos = await videosResponse.json();
            const currentPaths = currentVideos.map(v => v.filePath);
            
            // Merge with new videos (avoid duplicates)
            const updatedPaths = [...new Set([...currentPaths, ...videoPaths])];
            
            // Update playlist
            await fetch(`/api/videos/playlists/${playlistId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: playlist.name,
                    description: playlist.description,
                    videoPaths: updatedPaths 
                })
            });
            
            await loadPlaylists();
            closeAllDialogs();
            
            // Clear selection in library
            if (window.VideoLibrary) {
                window.VideoLibrary.clearSelection();
            }
            
        } catch (error) {
            console.error('[VideoPlaylists] Error adding to playlist:', error);
            alert('Failed to add videos to playlist');
        }
    }
    
    /**
     * Remove video from current playlist
     */
    function removeFromPlaylist(filePath) {
        const item = document.querySelector(`.playlist-video-item[data-filepath="${filePath}"]`);
        if (item) {
            item.remove();
        }
    }
    
    /**
     * Close all dialogs
     */
    function closeAllDialogs() {
        document.querySelectorAll('.video-dialog').forEach(dialog => {
            dialog.style.display = 'none';
        });
        currentPlaylist = null;
    }
    
    // Helper functions
    
    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Public API
    return {
        init,
        loadPlaylists,
        showAddToPlaylistDialog,
        editPlaylist,
        deletePlaylist,
        playPlaylist,
        removeFromPlaylist
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VideoPlaylists.init);
} else {
    VideoPlaylists.init();
}

// Export for use by other modules
window.VideoPlaylists = VideoPlaylists;
