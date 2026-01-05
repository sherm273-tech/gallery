// video-library.js - Video library browsing and management

const VideoLibrary = (function() {
    
    let videos = [];
    let currentFilter = 'all';
    let currentSort = 'date-desc';
    let selectedVideos = new Set();
    
    /**
     * Initialize video library
     */
    function init() {
        console.log('[VideoLibrary] Initializing...');
        setupEventListeners();
        loadVideos();
        loadPlaylists();
    }
    
    /**
     * Setup event listeners (can be called multiple times safely)
     */
    function setupEventListeners() {
        // Index Videos button
        const indexBtn = document.getElementById('indexVideosBtn');
        if (indexBtn && !indexBtn._hasIndexListener) {
            indexBtn.addEventListener('click', indexVideos);
            indexBtn._hasIndexListener = true;
        }
        
        // View toggle
        const gridViewBtn = document.getElementById('videoGridView');
        const listViewBtn = document.getElementById('videoListView');
        if (gridViewBtn && !gridViewBtn._hasViewListener) {
            gridViewBtn.addEventListener('click', () => setView('grid'));
            gridViewBtn._hasViewListener = true;
        }
        if (listViewBtn && !listViewBtn._hasViewListener) {
            listViewBtn.addEventListener('click', () => setView('list'));
            listViewBtn._hasViewListener = true;
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('videoSortSelect');
        if (sortSelect && !sortSelect._hasSortListener) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                loadVideos();
            });
            sortSelect._hasSortListener = true;
        }
        
        // Filter buttons
        const filterAll = document.getElementById('filterAllVideos');
        const filterShort = document.getElementById('filterShort');
        const filterMedium = document.getElementById('filterMedium');
        const filterLong = document.getElementById('filterLong');
        
        if (filterAll && !filterAll._hasFilterListener) {
            filterAll.addEventListener('click', () => filterVideos('all'));
            filterAll._hasFilterListener = true;
        }
        if (filterShort && !filterShort._hasFilterListener) {
            filterShort.addEventListener('click', () => filterVideos('short'));
            filterShort._hasFilterListener = true;
        }
        if (filterMedium && !filterMedium._hasFilterListener) {
            filterMedium.addEventListener('click', () => filterVideos('medium'));
            filterMedium._hasFilterListener = true;
        }
        if (filterLong && !filterLong._hasFilterListener) {
            filterLong.addEventListener('click', () => filterVideos('long'));
            filterLong._hasFilterListener = true;
        }
        
        // Selection actions
        const selectAllBtn = document.getElementById('selectAllVideos');
        const clearSelectionBtn = document.getElementById('clearSelection');
        const addToPlaylistBtn = document.getElementById('addToPlaylist');
        
        if (selectAllBtn && !selectAllBtn._hasSelectAllListener) {
            selectAllBtn.addEventListener('click', selectAll);
            selectAllBtn._hasSelectAllListener = true;
        }
        if (clearSelectionBtn && !clearSelectionBtn._hasClearListener) {
            clearSelectionBtn.addEventListener('click', clearSelection);
            clearSelectionBtn._hasClearListener = true;
        }
        if (addToPlaylistBtn && !addToPlaylistBtn._hasAddToPlaylistListener) {
            addToPlaylistBtn.addEventListener('click', showAddToPlaylistDialog);
            addToPlaylistBtn._hasAddToPlaylistListener = true;
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshVideos');
        if (refreshBtn && !refreshBtn._hasRefreshListener) {
            refreshBtn.addEventListener('click', loadVideos);
            refreshBtn._hasRefreshListener = true;
        }
    }
    
    /**
     * Load videos from server
     */
    async function loadVideos() {
        try {
            const response = await fetch(`/api/videos/list?sortBy=${currentSort}`);
            if (!response.ok) {
                throw new Error('Failed to load videos');
            }
            
            videos = await response.json();
            console.log('[VideoLibrary] Loaded', videos.length, 'videos');
            
            renderVideos();
            updateStats();
            
        } catch (error) {
            console.error('[VideoLibrary] Error loading videos:', error);
            alert('Failed to load videos. Please try again.');
        }
    }
    
    /**
     * Index videos from photo directories
     */
    async function indexVideos() {
        const btn = document.getElementById('indexVideosBtn');
        if (!btn) return;
        
        // Show loading state
        const originalText = btn.textContent;
        btn.textContent = '⏳ Indexing...';
        btn.disabled = true;
        
        try {
            const response = await fetch('/api/memories/index', {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Indexing failed');
            }
            
            const result = await response.json();
            console.log('[VideoLibrary] Indexing complete:', result);
            
            // Show success message
            alert(`Indexing complete!\n\nTotal files: ${result.totalFiles}\nPhotos indexed: ${result.photosIndexed}\nVideos indexed: ${result.videosIndexed}\nSkipped: ${result.skipped}`);
            
            // Reload videos
            await loadVideos();
            
        } catch (error) {
            console.error('[VideoLibrary] Error indexing:', error);
            alert('Failed to index videos. Check console for details.');
        } finally {
            // Restore button state
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
    
    /**
     * Render video grid
     */
    function renderVideos() {
        const container = document.getElementById('videoGrid');
        if (!container) return;
        
        // Apply current filter
        let filteredVideos = videos;
        if (currentFilter !== 'all') {
            filteredVideos = videos.filter(v => {
                const duration = v.videoDuration || 0;
                if (currentFilter === 'short') return duration < 60;
                if (currentFilter === 'medium') return duration >= 60 && duration < 300;
                if (currentFilter === 'long') return duration >= 300;
                return true;
            });
        }
        
        if (filteredVideos.length === 0) {
            container.innerHTML = '<p class="no-videos">No videos found</p>';
            return;
        }
        
        container.innerHTML = filteredVideos.map(video => createVideoCard(video)).join('');
        
        // Attach click handlers
        container.querySelectorAll('.video-card').forEach(card => {
            const filePath = card.dataset.filepath;
            
            // Play video on click
            card.querySelector('.video-thumbnail')?.addEventListener('click', () => {
                playVideo(filePath);
            });
            
            // Checkbox selection
            const checkbox = card.querySelector('.video-select-checkbox');
            checkbox?.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedVideos.add(filePath);
                } else {
                    selectedVideos.delete(filePath);
                }
                updateSelectionUI();
            });
        });
    }
    
    /**
     * Create video card HTML
     */
    function createVideoCard(video) {
        const duration = formatDuration(video.videoDuration || 0);
        const fileName = video.filePath.split('/').pop();
        const isSelected = selectedVideos.has(video.filePath);
        
        // Check if video has a generated thumbnail
        const hasThumbnail = video.thumbnailPath && video.thumbnailPath.trim() !== '';
        const thumbnailUrl = hasThumbnail ? `/images/${video.thumbnailPath}` : null;
        
        return `
            <div class="video-card" data-filepath="${video.filePath}">
                <div class="video-checkbox-container">
                    <input type="checkbox" class="video-select-checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="video-thumbnail">
                    ${hasThumbnail 
                        ? `<img src="${thumbnailUrl}" alt="${fileName}" loading="lazy" onerror="this.parentElement.classList.add('thumbnail-error');">` 
                        : `<div class="video-thumbnail-placeholder">
                               <div class="video-icon">🎬</div>
                               <div class="video-filename">${fileName}</div>
                           </div>`
                    }
                    <div class="video-play-overlay">
                        <div class="video-play-icon">▶</div>
                    </div>
                    <div class="video-duration-badge">${duration}</div>
                </div>
                <div class="video-card-info">
                    <div class="video-title">${fileName}</div>
                    <div class="video-meta">
                        ${video.videoResolution || 'Unknown'} • ${formatFileSize(video.fileSize || 0)}
                    </div>
                    <div class="video-date">${formatDate(video.captureDate)}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Play video
     */
    function playVideo(filePath) {
        if (!window.VideoPlayer) {
            console.error('[VideoLibrary] VideoPlayer not available');
            return;
        }
        
        const fileName = filePath.split('/').pop();
        const videoPath = `/api/videos/${filePath}`;
        
        window.VideoPlayer.openVideo(videoPath, fileName);
    }
    
    /**
     * Filter videos
     */
    function filterVideos(filter) {
        currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}${filter === 'all' ? 'Videos' : ''}`)?.classList.add('active');
        
        renderVideos();
    }
    
    /**
     * Set view mode
     */
    function setView(view) {
        const container = document.getElementById('videoGrid');
        if (view === 'grid') {
            container?.classList.remove('list-view');
            document.getElementById('videoGridView')?.classList.add('active');
            document.getElementById('videoListView')?.classList.remove('active');
        } else {
            container?.classList.add('list-view');
            document.getElementById('videoListView')?.classList.add('active');
            document.getElementById('videoGridView')?.classList.remove('active');
        }
    }
    
    /**
     * Select all videos
     */
    function selectAll() {
        videos.forEach(v => selectedVideos.add(v.filePath));
        renderVideos();
        updateSelectionUI();
    }
    
    /**
     * Clear selection
     */
    function clearSelection() {
        selectedVideos.clear();
        renderVideos();
        updateSelectionUI();
    }
    
    /**
     * Update selection UI
     */
    function updateSelectionUI() {
        const count = selectedVideos.size;
        const selectionInfo = document.getElementById('selectionInfo');
        if (selectionInfo) {
            selectionInfo.textContent = count > 0 ? `${count} selected` : '';
        }
        
        const addToPlaylistBtn = document.getElementById('addToPlaylist');
        if (addToPlaylistBtn) {
            addToPlaylistBtn.disabled = count === 0;
        }
    }
    
    /**
     * Show add to playlist dialog
     */
    function showAddToPlaylistDialog() {
        if (selectedVideos.size === 0) return;
        
        if (window.VideoPlaylists) {
            window.VideoPlaylists.showAddToPlaylistDialog(Array.from(selectedVideos));
        }
    }
    
    /**
     * Update statistics display
     */
    function updateStats() {
        const statsEl = document.getElementById('videoLibraryStats');
        if (!statsEl) return;
        
        const totalDuration = videos.reduce((sum, v) => sum + (v.videoDuration || 0), 0);
        const totalSize = videos.reduce((sum, v) => sum + (v.fileSize || 0), 0);
        
        statsEl.innerHTML = `
            <span class="stat-item">📹 ${videos.length} videos</span>
            <span class="stat-item">⏱️ ${formatDuration(totalDuration)}</span>
            <span class="stat-item">💾 ${formatFileSize(totalSize)}</span>
        `;
    }
    
    /**
     * Load playlists
     */
    async function loadPlaylists() {
        // Delegate to VideoPlaylists module
        if (window.VideoPlaylists) {
            await window.VideoPlaylists.loadPlaylists();
        }
    }
    
    // Helper functions
    
    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    // Public API
    return {
        init,
        loadVideos,
        getSelectedVideos: () => Array.from(selectedVideos),
        clearSelection
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VideoLibrary.init);
} else {
    VideoLibrary.init();
}

// Export for use by other modules
window.VideoLibrary = VideoLibrary;
