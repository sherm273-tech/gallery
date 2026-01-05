// ===== PHASE 2: VIDEO SLIDESHOW SUPPORT =====
// Handles video playback in slideshows with music ducking

const SlideshowVideoSupport = (() => {
    // ===== CONFIGURATION =====
    const CONFIG = {
        FADE_DURATION: 500,        // 500ms fade in/out
        ENABLED: true,             // Videos enabled by default
        MUTE_MUSIC_DURING_VIDEO: true  // Mute music when video plays
    };
    
    // ===== PRIVATE VARIABLES =====
    let videoElement = null;
    let originalMusicVolume = 1.0;
    let isFading = false;
    let currentVideoPath = null;
    let wasMusicPlaying = false;  // Track if music was playing before video
    let shouldMusicBePlaying = false;  // Track if music should be playing (user selected music)
    let failedVideos = new Set();  // Track failed video paths to avoid retry loops
    let consecutiveErrors = 0;  // Track consecutive errors
    let lastErrorTime = 0;  // Track last error time to detect rapid failures
    let videoEndedSuccessfully = false;  // Track if video ended normally to ignore subsequent errors
    let isStopped = true;  // Track if video system is stopped
    const MAX_CONSECUTIVE_ERRORS = 3;  // Maximum consecutive errors before stopping
    const ERROR_TIMEOUT = 1000;  // If errors happen within 1 second, consider them consecutive
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Initialize video element for slideshow
     */
    function init() {
        // Create video element if it doesn't exist
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = 'slideshow-video';
            videoElement.style.display = 'none';
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'contain';
            videoElement.style.position = 'absolute';
            videoElement.style.top = '0';
            videoElement.style.left = '0';
            videoElement.controls = false;
            videoElement.autoplay = false;
            
            // Insert video element into slideshow container
            const slideshow = document.getElementById('slideshow');
            if (slideshow && slideshow.parentElement) {
                slideshow.parentElement.insertBefore(videoElement, slideshow);
            }
            
            // Video event listeners
            videoElement.addEventListener('ended', handleVideoEnded);
            videoElement.addEventListener('error', handleVideoError);
            videoElement.addEventListener('loadeddata', handleVideoLoaded);
            
            console.log('[SlideshowVideoSupport] Initialized');
        }
    }
    
    /**
     * Check if a file is a video based on extension
     */
    function isVideoFile(filepath) {
        if (!filepath) return false;
        const videoExtensions = /\.(mp4|mov|avi|mkv|webm|m4v|wmv)$/i;
        return videoExtensions.test(filepath);
    }
    
    /**
     * Fade music volume
     */
    async function fadeMusicVolume(fromVolume, toVolume, duration) {
        if (!window.MusicPlayer || isFading) return;
        
        isFading = true;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = (toVolume - fromVolume) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const newVolume = fromVolume + (volumeStep * i);
            setMusicVolume(Math.max(0, Math.min(1, newVolume)));
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
        
        isFading = false;
    }
    
    /**
     * Set music volume (create audio element volume control if needed)
     */
    function setMusicVolume(volume) {
        // Find audio element used by music player
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.volume = volume;
        });
    }
    
    /**
     * Get current music volume
     */
    function getMusicVolume() {
        const audioElements = document.querySelectorAll('audio');
        if (audioElements.length > 0) {
            return audioElements[0].volume;
        }
        return 1.0;
    }
    
    /**
     * Handle video ended event
     */
    function handleVideoEnded() {
        console.log('[SlideshowVideoSupport] Video ended');
        
        // Set flag to ignore subsequent error events
        videoEndedSuccessfully = true;
        
        // Reset consecutive errors on successful completion
        consecutiveErrors = 0;
        
        hideVideo();
        resumeSlideshow();
    }
    
    /**
     * Handle video error
     */
    function handleVideoError(e) {
        // Ignore ALL errors if system is stopped (prevents re-disabling after stop() re-enables)
        if (isStopped) {
            console.log('[SlideshowVideoSupport] Ignoring error - system is stopped');
            return;
        }
        
        // Ignore errors if video ended successfully (spurious error events after playback)
        if (videoEndedSuccessfully) {
            console.log('[SlideshowVideoSupport] Ignoring error after successful video completion');
            return;
        }
        
        // If video support is already disabled, ignore errors and clean up
        if (!CONFIG.ENABLED) {
            if (videoElement) {
                videoElement.pause();
                videoElement.src = '';
                videoElement.style.display = 'none';
            }
            return;
        }
        
        const now = Date.now();
        const isRapidError = (now - lastErrorTime) < ERROR_TIMEOUT;
        
        // Track consecutive errors
        if (isRapidError) {
            consecutiveErrors++;
        } else {
            consecutiveErrors = 1;
        }
        lastErrorTime = now;
        
        // Add this video to failed list
        if (currentVideoPath) {
            failedVideos.add(currentVideoPath);
            console.error('[SlideshowVideoSupport] Video error for:', currentVideoPath, e);
        } else {
            console.error('[SlideshowVideoSupport] Video error:', e);
        }
        
        // If we've had too many consecutive errors, stop trying
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error(`[SlideshowVideoSupport] Too many consecutive errors (${consecutiveErrors}), disabling video support for this session`);
            CONFIG.ENABLED = false;
            
            // IMPORTANT: Clean up video element completely to stop error events
            hideVideo();
            
            // Resume slideshow without calling resumeSlideshow() to avoid next video
            const slideshow = document.getElementById('slideshow');
            if (slideshow) {
                slideshow.style.display = 'block';
            }
            
            // Resume music if needed
            if (CONFIG.MUTE_MUSIC_DURING_VIDEO && window.MusicPlayer && (wasMusicPlaying || shouldMusicBePlaying)) {
                setMusicVolume(0);
                window.MusicPlayer.play();
                setTimeout(async () => {
                    await fadeMusicVolume(0, originalMusicVolume || 1.0, CONFIG.FADE_DURATION);
                }, 100);
            }
            
            // Resume slideshow timer
            if (window.SlideshowCore && window.SlideshowCore.resume) {
                window.SlideshowCore.resume();
            }
            
            return;
        }
        
        hideVideo();
        resumeSlideshow();
    }
    
    /**
     * Handle video loaded
     */
    function handleVideoLoaded() {
        console.log('[SlideshowVideoSupport] Video loaded, starting playback');
        // Reset consecutive errors on successful load
        consecutiveErrors = 0;
        
        videoElement.play().catch(err => {
            console.error('[SlideshowVideoSupport] Playback error:', err);
            hideVideo();
            resumeSlideshow();
        });
    }
    
    /**
     * Show video and hide image slideshow
     */
    async function showVideo(videoPath) {
        if (!CONFIG.ENABLED || !videoElement) return false;
        
        // Check if this video has previously failed
        if (failedVideos.has(videoPath)) {
            console.warn('[SlideshowVideoSupport] Skipping previously failed video:', videoPath);
            return false;
        }
        
        // Reset success flag for new video
        videoEndedSuccessfully = false;
        // Mark system as active (not stopped)
        isStopped = false;
        currentVideoPath = videoPath;
        
        // Hide image slideshow
        const slideshow = document.getElementById('slideshow');
        if (slideshow) {
            slideshow.style.display = 'none';
        }
        
        // Fade out and pause music
        if (CONFIG.MUTE_MUSIC_DURING_VIDEO && window.MusicPlayer) {
            // Check if music is currently playing by checking the actual audio element
            const audioElements = document.querySelectorAll('audio');
            let currentlyPlaying = false;
            
            // Check if ANY audio element is playing
            audioElements.forEach(audio => {
                if (!audio.paused && !audio.ended && audio.currentTime > 0) {
                    currentlyPlaying = true;
                }
            });
            
            // Update wasMusicPlaying ONLY if music is currently playing
            // This preserves the flag across consecutive videos
            if (currentlyPlaying) {
                wasMusicPlaying = true;
            }
            
            // If music is playing OR MusicPlayer has tracks loaded, music should be playing
            const playlistLength = window.MusicPlayer.getPlaylistLength ? window.MusicPlayer.getPlaylistLength() : 0;
            if (wasMusicPlaying || playlistLength > 0) {
                shouldMusicBePlaying = true;
            }
            
            console.log('[SlideshowVideoSupport] CONFIG.MUTE_MUSIC_DURING_VIDEO:', CONFIG.MUTE_MUSIC_DURING_VIDEO);
            console.log('[SlideshowVideoSupport] MusicPlayer exists:', !!window.MusicPlayer);
            console.log('[SlideshowVideoSupport] Playlist length:', playlistLength);
            console.log('[SlideshowVideoSupport] Should music be playing:', shouldMusicBePlaying);
            console.log('[SlideshowVideoSupport] Audio elements found:', audioElements.length);
            console.log('[SlideshowVideoSupport] Currently playing:', currentlyPlaying);
            console.log('[SlideshowVideoSupport] Music was playing:', wasMusicPlaying);
            console.log('[SlideshowVideoSupport] Original volume:', getMusicVolume());
            
            if (currentlyPlaying) {
                originalMusicVolume = getMusicVolume();
                console.log('[SlideshowVideoSupport] Fading music from', originalMusicVolume, 'to 0');
                await fadeMusicVolume(originalMusicVolume, 0, CONFIG.FADE_DURATION);
                window.MusicPlayer.pause();
                console.log('[SlideshowVideoSupport] Music paused (was playing at volume ' + originalMusicVolume + ')');
            } else {
                console.log('[SlideshowVideoSupport] Music currently not playing, skipping fade');
            }
        } else {
            console.log('[SlideshowVideoSupport] Music muting disabled or MusicPlayer not available');
        }
        
        // Load and show video
        videoElement.src = videoPath;
        videoElement.style.display = 'block';
        videoElement.load();
        
        console.log('[SlideshowVideoSupport] Playing video:', videoPath);
        return true;
    }
    
    /**
     * Hide video and show image slideshow
     */
    function hideVideo() {
        if (!videoElement) return;
        
        videoElement.style.display = 'none';
        videoElement.pause();
        videoElement.src = '';
        currentVideoPath = null;
        
        // Show image slideshow
        const slideshow = document.getElementById('slideshow');
        if (slideshow) {
            slideshow.style.display = 'block';
        }
        
        console.log('[SlideshowVideoSupport] Video hidden');
    }
    
    /**
     * Resume slideshow and music after video
     */
    async function resumeSlideshow() {
        console.log('[SlideshowVideoSupport] 🔍 DEBUG resumeSlideshow called');
        console.log('[SlideshowVideoSupport] 🔍 CONFIG.MUTE_MUSIC_DURING_VIDEO:', CONFIG.MUTE_MUSIC_DURING_VIDEO);
        console.log('[SlideshowVideoSupport] 🔍 window.MusicPlayer exists:', !!window.MusicPlayer);
        console.log('[SlideshowVideoSupport] 🔍 wasMusicPlaying:', wasMusicPlaying);
        console.log('[SlideshowVideoSupport] 🔍 shouldMusicBePlaying:', shouldMusicBePlaying);
        console.log('[SlideshowVideoSupport] 🔍 Condition result:', CONFIG.MUTE_MUSIC_DURING_VIDEO && window.MusicPlayer && (wasMusicPlaying || shouldMusicBePlaying));
        
        // Resume music if it SHOULD be playing (user selected music)
        // OR if it WAS playing before video started
        if (CONFIG.MUTE_MUSIC_DURING_VIDEO && window.MusicPlayer && (wasMusicPlaying || shouldMusicBePlaying)) {
            console.log('[SlideshowVideoSupport] ✅ Resuming music (wasMusicPlaying:', wasMusicPlaying, ', shouldMusicBePlaying:', shouldMusicBePlaying, ')');
            
            // Check if there are actually tracks to play
            const playlistLength = window.MusicPlayer.getPlaylistLength ? window.MusicPlayer.getPlaylistLength() : 0;
            console.log('[SlideshowVideoSupport] 🔍 Playlist length:', playlistLength);
            
            if (playlistLength === 0) {
                console.log('[SlideshowVideoSupport] ℹ️ No music tracks loaded - add music in the Music tab to enable background music during slideshows');
            } else {
                console.log('[SlideshowVideoSupport] ✅ Playlist has tracks, proceeding with resume');
            }
            
            // Set volume to 0 first
            console.log('[SlideshowVideoSupport] 🔍 Setting volume to 0');
            setMusicVolume(0);
            
            // Start playing
            console.log('[SlideshowVideoSupport] 🔍 Calling MusicPlayer.play()');
            window.MusicPlayer.play();
            
            // Wait a tiny bit for playback to start
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if music actually started
            const audioElements = document.querySelectorAll('audio');
            let musicStarted = false;
            audioElements.forEach(audio => {
                if (!audio.paused) {
                    musicStarted = true;
                    console.log('[SlideshowVideoSupport] ✅ Audio element is playing');
                }
            });
            if (!musicStarted) {
                console.log('[SlideshowVideoSupport] ⚠️ Audio element is NOT playing after play() call');
            }
            
            // Fade volume back in
            console.log('[SlideshowVideoSupport] 🔍 Fading volume from 0 to', originalMusicVolume || 1.0);
            await fadeMusicVolume(0, originalMusicVolume || 1.0, CONFIG.FADE_DURATION);
            console.log('[SlideshowVideoSupport] ✅ Volume fade complete');
        } else {
            console.log('[SlideshowVideoSupport] ⚠️ NOT resuming music - condition not met');
        }
        
        // Resume the slideshow timer (it was paused when video started)
        if (window.SlideshowCore && window.SlideshowCore.resume) {
            console.log('[SlideshowVideoSupport] 🔍 Calling SlideshowCore.resume()');
            window.SlideshowCore.resume();
        }
        
        console.log('[SlideshowVideoSupport] ✅ Resumed slideshow');
    }
    
    /**
     * Handle media item display (called by slideshow-core)
     */
    async function displayMedia(mediaPath) {
        if (!CONFIG.ENABLED) return false;
        
        // Check if this is a video
        if (isVideoFile(mediaPath)) {
            const fullPath = '/api/videos/' + mediaPath;
            return await showVideo(fullPath);
        }
        
        return false; // Not a video, let normal slideshow handle it
    }
    
    /**
     * Enable/disable video support
     */
    function setEnabled(enabled) {
        CONFIG.ENABLED = enabled;
        console.log('[SlideshowVideoSupport] Videos in slideshow:', enabled ? 'ENABLED' : 'DISABLED');
    }
    
    /**
     * Configure music behavior during videos
     */
    function setMuteMusicDuringVideo(shouldMute) {
        CONFIG.MUTE_MUSIC_DURING_VIDEO = shouldMute;
        console.log('[SlideshowVideoSupport] Mute music during video:', shouldMute);
    }
    
    /**
     * Set fade duration
     */
    function setFadeDuration(duration) {
        CONFIG.FADE_DURATION = duration;
    }
    
    /**
     * Check if currently playing video
     */
    function isPlayingVideo() {
        return videoElement && videoElement.style.display === 'block' && !videoElement.paused;
    }
    
    /**
     * Skip current video
     */
    function skipVideo() {
        if (isPlayingVideo()) {
            handleVideoEnded();
        }
    }
    
    /**
     * Stop video playback (called when slideshow stops)
     */
    function stop() {
        // Mark system as stopped FIRST to prevent error events from re-disabling
        isStopped = true;
        
        if (videoElement) {
            // Pause video playback
            videoElement.pause();
            // Mute the video to stop audio immediately
            videoElement.muted = true;
            // Clear the source to fully stop playback
            videoElement.src = '';
            videoElement.load(); // Force reload to clear any buffers
            // Hide the video element
            videoElement.style.display = 'none';
            // Unmute for next time
            videoElement.muted = false;
        }
        currentVideoPath = null;
        // Clear error tracking when stopping
        failedVideos.clear();
        consecutiveErrors = 0;
        // Re-enable video support for next slideshow
        CONFIG.ENABLED = true;
        console.log('[SlideshowVideoSupport] Stopped');
    }
    
    /**
     * Reset error tracking (for debugging or manual reset)
     */
    function resetErrors() {
        failedVideos.clear();
        consecutiveErrors = 0;
        CONFIG.ENABLED = true;
        console.log('[SlideshowVideoSupport] Error tracking reset, video support re-enabled');
    }
    
    // ===== PUBLIC API =====
    return {
        init,
        displayMedia,
        isVideoFile,
        setEnabled,
        setMuteMusicDuringVideo,
        setFadeDuration,
        isPlayingVideo,
        skipVideo,
        hideVideo,
        stop,
        resetErrors
    };
})();

// Export to window
window.SlideshowVideoSupport = SlideshowVideoSupport;

console.log('✅ Slideshow Video Support module loaded (Phase 2)');
