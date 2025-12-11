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

// Start heartbeat when music starts playing
const originalAudioPlayerPlay = audioPlayer.addEventListener('play', () => {
    startHeartbeat();
});

// Start heartbeat when slideshow or music mode starts
// Monitor the start button (already has event listener, so we add another one)
const startBtnElement = document.getElementById('startButton');
if (startBtnElement) {
    startBtnElement.addEventListener('click', () => {
        // Slight delay to let currentMode be set
        setTimeout(() => {
            if (currentMode === 'slideshow' || currentMode === 'music') {
                startHeartbeat();
            }
        }, 100);
    });
}

// Stop heartbeat when music player closes
const closeMusicBtn = document.getElementById('closePlayerBtn');
if (closeMusicBtn) {
    closeMusicBtn.addEventListener('click', () => {
        stopHeartbeat();
    });
}

// Stop heartbeat when returning to menu (ESC key during slideshow)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Delay to ensure slideshow/music has stopped
        setTimeout(() => {
            if (currentMode !== 'slideshow' && currentMode !== 'music') {
                stopHeartbeat();
            }
        }, 100);
    }
});

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
