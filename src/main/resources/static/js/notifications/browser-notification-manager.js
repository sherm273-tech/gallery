/**
 * Browser Notification Manager
 * Polls for pending notifications and displays native browser notifications
 */
const BrowserNotificationManager = {
    pollingInterval: null,
    permissionGranted: false,
    
    /**
     * Initialize the notification manager
     */
    init() {
        console.log('[BrowserNotificationManager] Initializing...');
        this.checkPermission();
        this.startPolling();
        this.updateStatusUI();
        this.attachEventHandlers();
    },
    
    /**
     * Attach event handlers
     */
    attachEventHandlers() {
        // Click on notification status to request permission
        const statusElement = document.getElementById('notificationStatus');
        if (statusElement) {
            statusElement.addEventListener('click', async () => {
                if (Notification.permission !== 'granted') {
                    await this.checkPermission();
                    this.updateStatusUI();
                }
            });
        }
    },
    
    /**
     * Update the notification status UI
     */
    updateStatusUI() {
        const statusElement = document.getElementById('notificationStatus');
        const textElement = document.getElementById('notifPermissionText');
        
        if (!statusElement || !textElement) {
            return;
        }
        
        // Remove all status classes
        statusElement.classList.remove('granted', 'denied', 'default');
        
        if (!('Notification' in window)) {
            textElement.textContent = 'Not Supported';
            statusElement.classList.add('denied');
            statusElement.title = 'Browser notifications are not supported';
        } else if (Notification.permission === 'granted') {
            textElement.textContent = 'Enabled ✓';
            statusElement.classList.add('granted');
            statusElement.title = 'Browser notifications are enabled';
        } else if (Notification.permission === 'denied') {
            textElement.textContent = 'Blocked';
            statusElement.classList.add('denied');
            statusElement.title = 'Browser notifications are blocked. Enable in browser settings.';
        } else {
            textElement.textContent = 'Click to Enable';
            statusElement.classList.add('default');
            statusElement.title = 'Click to enable browser notifications';
        }
    },
    
    /**
     * Check and request notification permission
     */
    async checkPermission() {
        if (!('Notification' in window)) {
            console.warn('[BrowserNotificationManager] This browser does not support notifications');
            return;
        }
        
        if (Notification.permission === 'granted') {
            console.log('[BrowserNotificationManager] Notification permission already granted');
            this.permissionGranted = true;
        } else if (Notification.permission !== 'denied') {
            console.log('[BrowserNotificationManager] Requesting notification permission...');
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            
            if (this.permissionGranted) {
                console.log('[BrowserNotificationManager] Permission granted!');
            } else {
                console.warn('[BrowserNotificationManager] Permission denied');
            }
        } else {
            console.warn('[BrowserNotificationManager] Notifications are blocked');
        }
        
        this.updateStatusUI();
    },
    
    /**
     * Start polling for pending notifications
     * Polls every 30 seconds
     */
    startPolling() {
        console.log('[BrowserNotificationManager] Starting polling (every 30 seconds)');
        
        // Poll immediately
        this.pollNotifications();
        
        // Then poll every 30 seconds
        this.pollingInterval = setInterval(() => {
            this.pollNotifications();
        }, 30000); // 30 seconds
    },
    
    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            console.log('[BrowserNotificationManager] Polling stopped');
        }
    },
    
    /**
     * Poll the backend for pending notifications
     */
    async pollNotifications() {
        try {
            const response = await fetch('/api/notifications/browser/pending');
            
            if (!response.ok) {
                console.error('[BrowserNotificationManager] Error fetching notifications:', response.status);
                return;
            }
            
            const notifications = await response.json();
            
            if (notifications && notifications.length > 0) {
                console.log(`[BrowserNotificationManager] Received ${notifications.length} pending notification(s)`);
                notifications.forEach(notif => this.displayNotification(notif));
            }
        } catch (error) {
            console.error('[BrowserNotificationManager] Error polling notifications:', error);
        }
    },
    
    /**
     * Display a browser notification
     */
    displayNotification(notification) {
        if (!this.permissionGranted) {
            console.warn('[BrowserNotificationManager] Cannot display notification - permission not granted');
            // Fallback: show in-page notification
            this.showInPageNotification(notification);
            return;
        }
        
        console.log('[BrowserNotificationManager] Displaying notification:', notification.title);
        
        // Create browser notification
        const browserNotif = new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico', // Use your app icon
            badge: '/favicon.ico',
            tag: notification.id, // Prevents duplicates
            requireInteraction: false, // Auto-dismiss after ~4 seconds
            silent: false
        });
        
        // Handle click - navigate to calendar
        browserNotif.onclick = () => {
            window.focus();
            // Navigate to calendar page if not already there
            if (!window.location.pathname.includes('index')) {
                window.location.href = '/index';
            }
            browserNotif.close();
        };
        
        // Auto-close after 10 seconds if user doesn't interact
        setTimeout(() => {
            browserNotif.close();
        }, 10000);
    },
    
    /**
     * Fallback: Show in-page notification if browser notifications not available
     */
    showInPageNotification(notification) {
        console.log('[BrowserNotificationManager] Showing in-page notification');
        
        // Create notification element
        const notifElement = document.createElement('div');
        notifElement.className = 'in-page-notification';
        notifElement.innerHTML = `
            <div class="in-page-notif-header">
                <strong>🔔 ${notification.title}</strong>
                <button class="in-page-notif-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="in-page-notif-body">${notification.body}</div>
        `;
        
        // Add to page
        document.body.appendChild(notifElement);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notifElement.parentElement) {
                notifElement.remove();
            }
        }, 10000);
    },
    
    /**
     * Manually trigger a test notification
     */
    async testNotification(eventId) {
        try {
            const response = await fetch(`/api/notifications/test/${eventId}?timing=1_day_before`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('[BrowserNotificationManager] Test notification triggered');
                // Wait a moment then poll
                setTimeout(() => this.pollNotifications(), 1000);
            }
        } catch (error) {
            console.error('[BrowserNotificationManager] Error triggering test notification:', error);
        }
    }
};

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    BrowserNotificationManager.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserNotificationManager;
}
