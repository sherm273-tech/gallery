// ===== HEARTBEAT KEEP-ALIVE SYSTEM =====
// Add this code to the END of your script.js file
// This prevents connection timeouts when playing music or slideshow from remote computers

let heartbeatInterval = null;

/**
 * Start sending heartbeat pings to keep session alive
 */
function startHeartbeat() {
    // Clear any existing heartbeat
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    console.log('🔄 Starting heartbeat keep-alive...');
    
    // Send a ping every 30 seconds
    heartbeatInterval = setInterval(() => {
        fetch('/api/heartbeat')
            .then(() => {
                // Uncomment next line for debugging
                // console.log('💓 Heartbeat sent at ' + new Date().toLocaleTimeString());
            })
            .catch(err => {
                console.error('❌ Heartbeat failed:', err);
            });
    }, 30000); // 30 seconds
}

/**
 * Stop heartbeat when no longer needed
 */
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('⏸️ Heartbeat stopped');
    }
}

// ===== INTEGRATE WITH EXISTING CODE =====

// Store original playCurrentTrack function
const originalPlayCurrentTrack = playCurrentTrack;

// Override playCurrentTrack to start heartbeat
playCurrentTrack = function() {
    startHeartbeat();
    originalPlayCurrentTrack();
};

// Store original closeMusicPlayer function
const originalClosePlayerBtn = closePlayerBtn.onclick;

// Override close button to stop heartbeat
closePlayerBtn.onclick = function() {
    stopHeartbeat();
    if (originalClosePlayerBtn) originalClosePlayerBtn();
};

// Start heartbeat when slideshow starts
const originalStartBtn = startBtn.onclick;
startBtn.onclick = async function() {
    if (originalStartBtn) await originalStartBtn();
    if (currentMode === 'slideshow' || currentMode === 'music') {
        startHeartbeat();
    }
};

// Stop heartbeat when stopping slideshow
const originalStopSlideshow = stopSlideshow;
stopSlideshow = function() {
    stopHeartbeat();
    originalStopSlideshow();
};

// Stop heartbeat on page unload
window.addEventListener('beforeunload', stopHeartbeat);

// Re-establish heartbeat if page becomes visible again (mobile/tablet)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (isPlaying || slideshowStarted)) {
        console.log('👁️ Page visible again, restarting heartbeat');
        startHeartbeat();
    }
});

console.log('✅ Heartbeat keep-alive system loaded');
