// video-player.js - Video Player Module for Phase 1
// Handles video playback in modal overlay

const VideoPlayer = (function() {
    
    let currentVideoPath = null;
    let videoModal = null;
    let videoElement = null;
    
    /**
     * Initialize video player
     */
    function init() {
        console.log('[VideoPlayer] Initializing...');
        
        // Create modal if it doesn't exist
        if (!document.getElementById('videoPlayerModal')) {
            createVideoModal();
        }
        
        videoModal = document.getElementById('videoPlayerModal');
        videoElement = document.getElementById('videoPlayerElement');
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('[VideoPlayer] Initialized');
    }
    
    /**
     * Create video player modal HTML
     */
    function createVideoModal() {
        const modalHTML = `
            <div id="videoPlayerModal" class="video-player-modal" style="display: none;">
                <div class="video-player-overlay"></div>
                <div class="video-player-container">
                    <button class="video-close-btn" id="videoCloseBtn">✕</button>
                    <video id="videoPlayerElement" class="video-player-element" 
                           controls 
                           preload="auto" 
                           playsinline
                           autobuffer>
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-info" id="videoInfo">
                        <span id="videoFileName"></span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('videoCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }
        
        // Close on overlay click
        const overlay = document.querySelector('.video-player-overlay');
        if (overlay) {
            overlay.addEventListener('click', close);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
        
        // Video events
        if (videoElement) {
            videoElement.addEventListener('loadedmetadata', handleVideoLoaded);
            videoElement.addEventListener('error', handleVideoError);
        }
    }
    
    /**
     * Open video player with specific video
     */
    function openVideo(videoPath, fileName) {
        if (!videoModal || !videoElement) {
            console.error('[VideoPlayer] Modal not initialized');
            return;
        }
        
        console.log('[VideoPlayer] Opening video:', videoPath);
        
        currentVideoPath = videoPath;
        
        // Determine MIME type from filename
        let mimeType = 'video/mp4'; // Default
        const lowerFileName = fileName.toLowerCase();
        
        if (lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.m4v')) {
            mimeType = 'video/mp4';
        } else if (lowerFileName.endsWith('.mov')) {
            mimeType = 'video/quicktime';
        } else if (lowerFileName.endsWith('.webm')) {
            mimeType = 'video/webm';
        } else if (lowerFileName.endsWith('.avi')) {
            mimeType = 'video/x-msvideo';
        } else if (lowerFileName.endsWith('.mkv')) {
            mimeType = 'video/x-matroska';
        }
        
        console.log('[VideoPlayer] File:', fileName, 'MIME type:', mimeType);
        
        // Clear existing video element content
        videoElement.innerHTML = '';
        videoElement.removeAttribute('src');
        
        // Create and append source element
        const sourceElement = document.createElement('source');
        sourceElement.src = videoPath;
        sourceElement.type = mimeType;
        videoElement.appendChild(sourceElement);
        
        console.log('[VideoPlayer] Source element created:', sourceElement.src, sourceElement.type);
        
        // Show modal FIRST (better UX - instant feedback)
        videoModal.style.display = 'flex';
        
        // Set filename
        const fileNameEl = document.getElementById('videoFileName');
        if (fileNameEl && fileName) {
            fileNameEl.textContent = fileName;
        }
        
        // Load and buffer the video
        videoElement.load();
        
        // Start playing as soon as we have enough data
        const playWhenReady = () => {
            console.log('[VideoPlayer] Video ready, starting playback');
            videoElement.play().catch(err => {
                console.error('[VideoPlayer] Error playing video:', err);
            });
        };
        
        // Try to play as soon as we can
        if (videoElement.readyState >= 3) {
            // Already have enough data
            playWhenReady();
        } else {
            // Wait for enough data
            videoElement.addEventListener('canplay', playWhenReady, { once: true });
        }
    }
    
    /**
     * Close video player
     */
    function close() {
        if (!videoModal || !videoElement) {
            return;
        }
        
        console.log('[VideoPlayer] Closing');
        
        // Remove error listener temporarily to prevent spurious errors
        videoElement.removeEventListener('error', handleVideoError);
        
        // Pause and reset video
        videoElement.pause();
        videoElement.currentTime = 0;
        
        // Clear the video source properly
        videoElement.removeAttribute('src');
        videoElement.innerHTML = ''; // Remove any <source> elements
        videoElement.load(); // Reset to initial state
        
        // Re-attach error listener
        videoElement.addEventListener('error', handleVideoError);
        
        // Hide modal
        videoModal.style.display = 'none';
        
        currentVideoPath = null;
    }
    
    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboard(e) {
        // Only handle if modal is open
        if (!videoModal || videoModal.style.display === 'none') {
            return;
        }
        
        switch(e.key) {
            case 'Escape':
                close();
                break;
            case ' ':
            case 'Spacebar':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'ArrowLeft':
                seek(-5); // Seek back 5 seconds
                break;
            case 'ArrowRight':
                seek(5); // Seek forward 5 seconds
                break;
        }
    }
    
    /**
     * Toggle play/pause
     */
    function togglePlayPause() {
        if (!videoElement) return;
        
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    }
    
    /**
     * Toggle fullscreen
     */
    function toggleFullscreen() {
        if (!videoElement) return;
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            videoElement.requestFullscreen().catch(err => {
                console.error('[VideoPlayer] Fullscreen error:', err);
            });
        }
    }
    
    /**
     * Seek video by seconds
     */
    function seek(seconds) {
        if (!videoElement) return;
        
        videoElement.currentTime = Math.max(0, videoElement.currentTime + seconds);
    }
    
    /**
     * Handle video loaded
     */
    function handleVideoLoaded() {
        console.log('[VideoPlayer] Video loaded, duration:', videoElement.duration);
    }
    
    /**
     * Handle video error
     */
    function handleVideoError(e) {
        console.error('[VideoPlayer] Video error:', e);
        
        // Don't show errors if modal is hidden (cleanup errors)
        if (!videoModal || videoModal.style.display === 'none') {
            console.log('[VideoPlayer] Ignoring error - modal is closed');
            return;
        }
        
        // Don't show errors if there's no current video (cleanup phase)
        if (!currentVideoPath) {
            console.log('[VideoPlayer] Ignoring error - no active video');
            return;
        }
        
        // Get detailed error info
        if (videoElement && videoElement.error) {
            const error = videoElement.error;
            let errorMessage = 'Error loading video.';
            
            switch(error.code) {
                case 1: // MEDIA_ERR_ABORTED
                    errorMessage = 'Video loading aborted. Please try again.';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorMessage = 'Network error while loading video.';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorMessage = 'Video format not supported by your browser. The video codec may not be compatible.';
                    console.error('[VideoPlayer] DECODE ERROR - Codec not supported');
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    // Only show this if it's not an empty src (which happens on cleanup)
                    if (videoElement.src && videoElement.src !== window.location.href) {
                        errorMessage = 'Video format not supported.';
                    } else {
                        console.log('[VideoPlayer] Ignoring empty src error');
                        return; // Don't show alert for empty src
                    }
                    break;
            }
            
            console.error('[VideoPlayer] Error code:', error.code, 'Message:', error.message);
            alert(errorMessage + '\n\nTry opening the video file directly in your browser to check codec compatibility.');
        } else {
            alert('Error loading video. The video format may not be supported by your browser.');
        }
    }
    
    // Public API
    return {
        init: init,
        openVideo: openVideo,
        close: close
    };
    
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VideoPlayer.init);
} else {
    VideoPlayer.init();
}

// Export for global access
window.VideoPlayer = VideoPlayer;

console.log('✅ Video Player module loaded');
