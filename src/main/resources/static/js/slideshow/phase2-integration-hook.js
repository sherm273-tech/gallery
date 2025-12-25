// ===== PHASE 2: SLIDESHOW VIDEO INTEGRATION HOOK =====
// This file integrates video support into the slideshow WITHOUT modifying existing slideshow-core.js
// It intercepts the image display flow to check if media is a video

(function() {
    'use strict';
    
    // Wait for DOM and all modules to load
    window.addEventListener('DOMContentLoaded', function() {
        console.log('[Phase2Hook] Initializing video slideshow integration...');
        
        // Initialize video support
        if (window.SlideshowVideoSupport) {
            window.SlideshowVideoSupport.init();
        }
        
        // Hook into ImageCache.loadAndDisplay to intercept video files
        if (window.ImageCache && window.ImageCache.loadAndDisplay) {
            const originalLoadAndDisplay = window.ImageCache.loadAndDisplay;
            
            window.ImageCache.loadAndDisplay = async function(imagePath, imgElement) {
                // Check if this is a video file
                if (window.SlideshowVideoSupport && window.SlideshowVideoSupport.isVideoFile(imagePath)) {
                    console.log('[Phase2Hook] Video detected in slideshow:', imagePath);
                    
                    // Try to display video
                    const handled = await window.SlideshowVideoSupport.displayMedia(imagePath);
                    
                    if (handled) {
                        // Video is playing, pause the slideshow timer
                        if (window.SlideshowCore && window.SlideshowCore.pause) {
                            window.SlideshowCore.pause();
                        }
                        return; // Don't call original function
                    }
                    // If not handled, fall through to try displaying as image
                    // (This will fail for videos but that's ok - slideshow will advance)
                }
                
                // Not a video or video not handled, use original function
                return originalLoadAndDisplay.call(this, imagePath, imgElement);
            };
            
            console.log('[Phase2Hook] ✅ Video intercept installed');
        }
        
        // Hook into SlideshowCore.stop to stop videos when slideshow ends
        if (window.SlideshowCore && window.SlideshowCore.stop) {
            const originalStop = window.SlideshowCore.stop;
            
            window.SlideshowCore.stop = function() {
                // Stop any playing video
                if (window.SlideshowVideoSupport) {
                    window.SlideshowVideoSupport.stop();
                }
                // Call original stop
                return originalStop.call(this);
            };
            
            console.log('[Phase2Hook] ✅ Stop hook installed');
        }
        
        // Add keyboard shortcut to skip videos (S key)
        document.addEventListener('keydown', function(e) {
            if (e.key === 's' || e.key === 'S') {
                if (window.SlideshowVideoSupport && window.SlideshowVideoSupport.isPlayingVideo()) {
                    console.log('[Phase2Hook] Skipping video (S key pressed)');
                    window.SlideshowVideoSupport.skipVideo();
                }
            }
        });
        
        console.log('[Phase2Hook] ✅ Phase 2 integration complete');
    });
})();
