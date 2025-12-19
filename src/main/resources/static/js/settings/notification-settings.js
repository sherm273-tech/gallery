/**
 * Notification Settings Manager
 * Handles settings page functionality
 */
const NotificationSettingsManager = {
    currentPage: 0,
    pageSize: 20,
    
    /**
     * Initialize the settings page
     */
    init() {
        console.log('[NotificationSettingsManager] Initializing...');
        
        this.attachEventListeners();
        this.loadSettings();
        this.loadStatistics();
        this.loadHistory();
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Save settings button
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Test buttons
        document.getElementById('testEmailBtn')?.addEventListener('click', () => {
            this.sendTestEmail();
        });
        
        document.getElementById('testSmsBtn')?.addEventListener('click', () => {
            this.sendTestSms();
        });
        
        // History controls
        document.getElementById('refreshHistoryBtn')?.addEventListener('click', () => {
            this.currentPage = 0;
            this.loadHistory();
        });
        
        document.getElementById('filterType')?.addEventListener('change', () => {
            this.currentPage = 0;
            this.loadHistory();
        });
        
        document.getElementById('filterStatus')?.addEventListener('change', () => {
            this.currentPage = 0;
            this.loadHistory();
        });
        
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            this.currentPage++;
            this.loadHistory(true);
        });
        
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
            this.clearHistory();
        });
    },
    
    /**
     * Load current settings
     */
    async loadSettings() {
        try {
            const response = await fetch('/api/notifications/settings');
            if (!response.ok) throw new Error('Failed to load settings');
            
            const settings = await response.json();
            console.log('[NotificationSettingsManager] Loaded settings:', settings);
            
            // Populate form
            document.getElementById('defaultEmail').value = settings.defaultEmail || '';
            document.getElementById('defaultPhone').value = settings.defaultPhone || '';
            document.getElementById('defaultBrowserEnabled').checked = settings.defaultBrowserEnabled ?? true;
            document.getElementById('defaultEmailEnabled').checked = settings.defaultEmailEnabled ?? false;
            document.getElementById('defaultSmsEnabled').checked = settings.defaultSmsEnabled ?? false;
            document.getElementById('quietHoursEnabled').checked = settings.quietHoursEnabled ?? true;
            document.getElementById('quietHoursStart').value = settings.quietHoursStart || '22:00:00';
            document.getElementById('quietHoursEnd').value = settings.quietHoursEnd || '07:00:00';
            
        } catch (error) {
            console.error('[NotificationSettingsManager] Error loading settings:', error);
        }
    },
    
    /**
     * Save settings
     */
    async saveSettings() {
        const settings = {
            defaultEmail: document.getElementById('defaultEmail').value.trim() || null,
            defaultPhone: document.getElementById('defaultPhone').value.trim() || null,
            defaultBrowserEnabled: document.getElementById('defaultBrowserEnabled').checked,
            defaultEmailEnabled: document.getElementById('defaultEmailEnabled').checked,
            defaultSmsEnabled: document.getElementById('defaultSmsEnabled').checked,
            quietHoursEnabled: document.getElementById('quietHoursEnabled').checked,
            quietHoursStart: document.getElementById('quietHoursStart').value,
            quietHoursEnd: document.getElementById('quietHoursEnd').value
        };
        
        try {
            const response = await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            if (!response.ok) throw new Error('Failed to save settings');
            
            this.showSaveStatus('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('[NotificationSettingsManager] Error saving settings:', error);
            this.showSaveStatus('Failed to save settings', 'error');
        }
    },
    
    /**
     * Show save status message
     */
    showSaveStatus(message, type) {
        const statusEl = document.getElementById('saveStatus');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.className = `save-status ${type}`;
        
        setTimeout(() => {
            statusEl.className = 'save-status';
        }, 3000);
    },
    
    /**
     * Send test email
     */
    async sendTestEmail() {
        const email = document.getElementById('defaultEmail').value.trim();
        
        if (!email) {
            alert('Please enter an email address first');
            return;
        }
        
        // Note: Test email would need backend implementation
        alert('Test email functionality coming soon!\nWould send to: ' + email);
    },
    
    /**
     * Send test SMS
     */
    async sendTestSms() {
        const phone = document.getElementById('defaultPhone').value.trim();
        
        if (!phone) {
            alert('Please enter a phone number first');
            return;
        }
        
        const confirm = window.confirm('This will send a test SMS (~$0.08 AUD).\n\nContinue?');
        if (!confirm) return;
        
        // Note: Test SMS would need backend implementation
        alert('Test SMS functionality coming soon!\nWould send to: ' + phone);
    },
    
    /**
     * Load notification statistics
     */
    async loadStatistics() {
        try {
            const response = await fetch('/api/notifications/history/stats');
            if (!response.ok) throw new Error('Failed to load stats');
            
            const stats = await response.json();
            console.log('[NotificationSettingsManager] Loaded stats:', stats);
            
            // Update stats display
            document.getElementById('statTodayNotifs').textContent = stats.todayCount || 0;
            document.getElementById('statWeekNotifs').textContent = stats.weekCount || 0;
            document.getElementById('statTotalSent').textContent = stats.totalSent || 0;
            document.getElementById('statTotalFailed').textContent = stats.totalFailed || 0;
            
            // Update SMS cost tracking
            document.getElementById('smsMonthCount').textContent = stats.smsSentThisMonth || 0;
            document.getElementById('smsMonthCost').textContent = `$${(stats.monthSmsCost || 0).toFixed(2)} AUD`;
            document.getElementById('smsAllTimeCount').textContent = stats.smsSentAllTime || 0;
            document.getElementById('smsAllTimeCost').textContent = `$${(stats.totalSmsCost || 0).toFixed(2)} AUD`;
            
        } catch (error) {
            console.error('[NotificationSettingsManager] Error loading stats:', error);
        }
    },
    
    /**
     * Load notification history
     */
    async loadHistory(append = false) {
        const type = document.getElementById('filterType')?.value || '';
        const status = document.getElementById('filterStatus')?.value || '';
        
        const params = new URLSearchParams({
            page: this.currentPage,
            size: this.pageSize
        });
        
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        
        try {
            const response = await fetch(`/api/notifications/history?${params}`);
            if (!response.ok) throw new Error('Failed to load history');
            
            const history = await response.json();
            console.log('[NotificationSettingsManager] Loaded history:', history);
            
            this.displayHistory(history, append);
            
            // Show/hide load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = history.length === this.pageSize ? 'block' : 'none';
            }
            
        } catch (error) {
            console.error('[NotificationSettingsManager] Error loading history:', error);
            const historyList = document.getElementById('historyList');
            if (historyList && !append) {
                historyList.innerHTML = '<div class="empty-history">Failed to load history</div>';
            }
        }
    },
    
    /**
     * Display notification history
     */
    displayHistory(history, append = false) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (!append) {
            historyList.innerHTML = '';
        }
        
        if (history.length === 0 && !append) {
            historyList.innerHTML = '<div class="empty-history">No notification history found</div>';
            return;
        }
        
        history.forEach(item => {
            const historyItem = this.createHistoryItem(item);
            historyList.appendChild(historyItem);
        });
    },
    
    /**
     * Create history item element
     */
    createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const icon = this.getNotificationIcon(item.notificationType);
        const timing = this.formatTiming(item.notificationTiming);
        const time = new Date(item.sentTime || item.createdAt).toLocaleString();
        
        div.innerHTML = `
            <div class="history-icon">${icon}</div>
            <div class="history-details">
                <div class="history-event-title">${item.eventTitle || 'Unknown Event'}</div>
                <div class="history-meta">${timing} • ${time}</div>
            </div>
            <div class="history-status ${item.status.toLowerCase()}">${item.status}</div>
        `;
        
        return div;
    },
    
    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        switch (type) {
            case 'BROWSER': return '🔔';
            case 'EMAIL': return '📧';
            case 'SMS': return '📱';
            default: return '📬';
        }
    },
    
    /**
     * Format timing for display
     */
    formatTiming(timing) {
        const map = {
            '1_week_before': '1 week before',
            '3_days_before': '3 days before',
            '1_day_before': '1 day before',
            'morning_of': 'morning of',
            '1_hour_before': '1 hour before',
            '30_mins_before': '30 minutes before'
        };
        return map[timing] || timing;
    },
    
    /**
     * Clear old notification history
     */
    async clearHistory() {
        const confirm = window.confirm('Clear old notification history?\n\n(Keeps last 100 notifications)');
        if (!confirm) return;
        
        try {
            const response = await fetch('/api/notifications/history/clear?keep=100', {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to clear history');
            
            const result = await response.json();
            alert(result.message + '\n\nDeleted: ' + result.deleted);
            
            // Reload history and stats
            this.currentPage = 0;
            this.loadHistory();
            this.loadStatistics();
            
        } catch (error) {
            console.error('[NotificationSettingsManager] Error clearing history:', error);
            alert('Failed to clear history');
        }
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    NotificationSettingsManager.init();
});
