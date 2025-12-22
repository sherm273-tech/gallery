// memories-notification.js - Handles daily memories notifications

const MemoriesNotificationModule = (function() {
    
    let notificationCheckInterval = null;
    let notificationShown = false;
    
    /**
     * Initialize memories notification system
     */
    function init() {
        console.log('[MemoriesNotification] Initializing memories notification system...');
        
        // Check immediately on page load
        checkForPendingNotification();
        
        // Check every 5 minutes for pending notifications
        notificationCheckInterval = setInterval(checkForPendingNotification, 5 * 60 * 1000);
    }
    
    /**
     * Check for pending memories notification
     */
    async function checkForPendingNotification() {
        if (notificationShown) {
            return; // Already shown today
        }
        
        try {
            const response = await fetch('/api/memories/notification/pending');
            if (!response.ok) {
                throw new Error('Failed to check for pending notification');
            }
            
            const data = await response.json();
            
            if (data.hasPending && data.count > 0) {
                console.log('[MemoriesNotification] Pending notification found:', data.count, 'memories');
                showMemoriesNotification(data.count, data.message);
                notificationShown = true;
                markNotificationAsShown();
            }
            
        } catch (error) {
            console.error('[MemoriesNotification] Error checking for pending notification:', error);
        }
    }
    
    /**
     * Show memories notification to user
     */
    function showMemoriesNotification(count, message) {
        console.log('[MemoriesNotification] Showing notification:', message);
        
        // Show browser notification if supported
        showBrowserNotification(count, message);
        
        // Show in-app notification banner
        showInAppNotification(count, message);
    }
    
    /**
     * Show browser notification
     */
    function showBrowserNotification(count, message) {
        // Check if browser notifications are supported and permitted
        if (!('Notification' in window)) {
            console.log('[MemoriesNotification] Browser notifications not supported');
            return;
        }
        
        if (Notification.permission === 'granted') {
            const notification = new Notification('📸 Memories', {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'memories-daily',
                requireInteraction: false
            });
            
            notification.onclick = function() {
                window.focus();
                if (window.MemoriesModule) {
                    window.MemoriesModule.openMemoriesView();
                }
                notification.close();
            };
            
            console.log('[MemoriesNotification] Browser notification shown');
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showBrowserNotification(count, message);
                }
            });
        }
    }
    
    /**
     * Show in-app notification banner
     */
    function showInAppNotification(count, message) {
        // Create notification banner
        const banner = document.createElement('div');
        banner.className = 'memories-notification-banner';
        banner.innerHTML = `
            <div class="memories-notification-content">
                <div class="memories-notification-icon">📸</div>
                <div class="memories-notification-text">
                    <div class="memories-notification-title">Memories</div>
                    <div class="memories-notification-message">${message}</div>
                </div>
                <button class="memories-notification-view-btn" onclick="MemoriesNotificationModule.viewMemories()">
                    View
                </button>
                <button class="memories-notification-close-btn" onclick="MemoriesNotificationModule.closeBanner()">
                    ✕
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(banner);
        
        // Animate in
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            closeBanner();
        }, 10000);
        
        console.log('[MemoriesNotification] In-app banner shown');
    }
    
    /**
     * View memories (from notification)
     */
    function viewMemories() {
        closeBanner();
        if (window.MemoriesModule) {
            window.MemoriesModule.openMemoriesView();
        }
    }
    
    /**
     * Close notification banner
     */
    function closeBanner() {
        const banner = document.querySelector('.memories-notification-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }
    
    /**
     * Mark notification as shown on server
     */
    async function markNotificationAsShown() {
        try {
            await fetch('/api/memories/notification/shown', {
                method: 'POST'
            });
            console.log('[MemoriesNotification] Notification marked as shown');
        } catch (error) {
            console.error('[MemoriesNotification] Error marking notification as shown:', error);
        }
    }
    
    /**
     * Cleanup
     */
    function cleanup() {
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
        }
    }
    
    // Public API
    return {
        init: init,
        viewMemories: viewMemories,
        closeBanner: closeBanner,
        cleanup: cleanup
    };
    
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MemoriesNotificationModule.init);
} else {
    MemoriesNotificationModule.init();
}

// Export for global access
window.MemoriesNotificationModule = MemoriesNotificationModule;
