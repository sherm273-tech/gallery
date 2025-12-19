// Calendar Event Notification Form Handler
// Handles notification configuration UI in event form

const EventNotificationForm = {
    // DOM Elements
    enableCheckbox: null,
    configContent: null,
    
    // Timing checkboxes
    timing1WeekBefore: null,
    timing3DaysBefore: null,
    timing1DayBefore: null,
    timingMorningOf: null,
    timing1HourBefore: null,
    timing30MinsBefore: null,
    
    // Channel checkboxes
    notifyBrowser: null,
    notifyEmail: null,
    notifySms: null,
    
    // Preset buttons
    presetLowPriority: null,
    presetStandard: null,
    presetCritical: null,
    
    init() {
        console.log('[EventNotificationForm] Initializing...');
        this.initializeDOM();
        this.attachEventListeners();
    },
    
    initializeDOM() {
        // Main controls
        this.enableCheckbox = document.getElementById('enableNotifications');
        this.configContent = document.getElementById('notificationConfigContent');
        
        // Timing checkboxes
        this.timing1WeekBefore = document.getElementById('timing1WeekBefore');
        this.timing3DaysBefore = document.getElementById('timing3DaysBefore');
        this.timing1DayBefore = document.getElementById('timing1DayBefore');
        this.timingMorningOf = document.getElementById('timingMorningOf');
        this.timing1HourBefore = document.getElementById('timing1HourBefore');
        this.timing30MinsBefore = document.getElementById('timing30MinsBefore');
        
        // Channel checkboxes
        this.notifyBrowser = document.getElementById('notifyBrowser');
        this.notifyEmail = document.getElementById('notifyEmail');
        this.notifySms = document.getElementById('notifySms');
        
        // Preset buttons
        this.presetLowPriority = document.getElementById('presetLowPriority');
        this.presetStandard = document.getElementById('presetStandard');
        this.presetCritical = document.getElementById('presetCritical');
    },
    
    attachEventListeners() {
        // Toggle notification config section
        if (this.enableCheckbox) {
            this.enableCheckbox.addEventListener('change', (e) => {
                this.toggleConfigSection(e.target.checked);
            });
        }
        
        // Preset buttons
        if (this.presetLowPriority) {
            this.presetLowPriority.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyPreset('low');
            });
        }
        
        if (this.presetStandard) {
            this.presetStandard.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyPreset('standard');
            });
        }
        
        if (this.presetCritical) {
            this.presetCritical.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyPreset('critical');
            });
        }
        
        console.log('[EventNotificationForm] Event listeners attached');
    },
    
    toggleConfigSection(show) {
        if (this.configContent) {
            this.configContent.style.display = show ? 'block' : 'none';
            console.log('[EventNotificationForm] Config section:', show ? 'shown' : 'hidden');
        }
    },
    
    applyPreset(presetType) {
        console.log('[EventNotificationForm] Applying preset:', presetType);
        
        // Clear all first
        this.clearAllSelections();
        
        switch(presetType) {
            case 'low':
                // Browser only, 1 day before
                this.timing1DayBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = false;
                this.notifySms.checked = false;
                break;
                
            case 'standard':
                // Browser + Email, 1 day before
                this.timing1DayBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = true;
                this.notifySms.checked = false;
                break;
                
            case 'critical':
                // All channels, multiple reminders
                this.timing3DaysBefore.checked = true;
                this.timing1DayBefore.checked = true;
                this.timing1HourBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = true;
                this.notifySms.checked = true;
                break;
        }
    },
    
    clearAllSelections() {
        // Clear timing
        this.timing1WeekBefore.checked = false;
        this.timing3DaysBefore.checked = false;
        this.timing1DayBefore.checked = false;
        this.timingMorningOf.checked = false;
        this.timing1HourBefore.checked = false;
        this.timing30MinsBefore.checked = false;
    },
    
    getNotificationData() {
        // Return null if notifications not enabled
        if (!this.enableCheckbox || !this.enableCheckbox.checked) {
            return {
                notificationsEnabled: false,
                notificationTimings: null,
                notifyBrowser: true,
                notifyEmail: false,
                notifySms: false
            };
        }
        
        // Collect selected timings
        const timings = [];
        if (this.timing1WeekBefore.checked) timings.push('1_week_before');
        if (this.timing3DaysBefore.checked) timings.push('3_days_before');
        if (this.timing1DayBefore.checked) timings.push('1_day_before');
        if (this.timingMorningOf.checked) timings.push('morning_of');
        if (this.timing1HourBefore.checked) timings.push('1_hour_before');
        if (this.timing30MinsBefore.checked) timings.push('30_mins_before');
        
        return {
            notificationsEnabled: true,
            notificationTimings: JSON.stringify(timings),
            notifyBrowser: this.notifyBrowser.checked,
            notifyEmail: this.notifyEmail.checked,
            notifySms: this.notifySms.checked
        };
    },
    
    loadNotificationData(event) {
        console.log('[EventNotificationForm] Loading notification data for event:', event);
        
        // Set enabled state
        if (this.enableCheckbox) {
            this.enableCheckbox.checked = event.notificationsEnabled || false;
            this.toggleConfigSection(event.notificationsEnabled || false);
        }
        
        // Load timings
        if (event.notificationTimings) {
            try {
                const timings = JSON.parse(event.notificationTimings);
                this.timing1WeekBefore.checked = timings.includes('1_week_before');
                this.timing3DaysBefore.checked = timings.includes('3_days_before');
                this.timing1DayBefore.checked = timings.includes('1_day_before');
                this.timingMorningOf.checked = timings.includes('morning_of');
                this.timing1HourBefore.checked = timings.includes('1_hour_before');
                this.timing30MinsBefore.checked = timings.includes('30_mins_before');
            } catch (e) {
                console.error('[EventNotificationForm] Error parsing notification timings:', e);
            }
        } else {
            this.clearAllSelections();
        }
        
        // Load channels
        this.notifyBrowser.checked = event.notifyBrowser !== false; // default true
        this.notifyEmail.checked = event.notifyEmail || false;
        this.notifySms.checked = event.notifySms || false;
    },
    
    clearForm() {
        console.log('[EventNotificationForm] Clearing form');
        
        if (this.enableCheckbox) {
            this.enableCheckbox.checked = false;
            this.toggleConfigSection(false);
        }
        
        this.clearAllSelections();
        
        // Reset channels to defaults
        this.notifyBrowser.checked = true;
        this.notifyEmail.checked = false;
        this.notifySms.checked = false;
    },
    
    applySuggestedSettings(eventType) {
        console.log('[EventNotificationForm] Applying suggested settings for:', eventType);
        
        // Clear first
        this.clearAllSelections();
        
        // Apply suggestions based on event type
        switch(eventType) {
            case 'birthday':
                this.timing1DayBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = false;
                this.notifySms.checked = false;
                break;
                
            case 'bill':
                this.timing3DaysBefore.checked = true;
                this.timing1DayBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = true;
                this.notifySms.checked = false;
                break;
                
            case 'appointment':
                this.timing1DayBefore.checked = true;
                this.timing1HourBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = true;
                this.notifySms.checked = false;
                break;
                
            case 'reminder':
                this.timingMorningOf.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = false;
                this.notifySms.checked = false;
                break;
                
            case 'holiday':
                this.timing1WeekBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = false;
                this.notifySms.checked = false;
                break;
                
            case 'val-athletics':
                this.timing1DayBefore.checked = true;
                this.timing1HourBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = true;
                this.notifySms.checked = false;
                break;
                
            default:
                // Default: 1 day before, browser only
                this.timing1DayBefore.checked = true;
                this.notifyBrowser.checked = true;
                this.notifyEmail.checked = false;
                this.notifySms.checked = false;
        }
    }
};

// Export to window
window.EventNotificationForm = EventNotificationForm;

console.log('✅ Event Notification Form module loaded');
