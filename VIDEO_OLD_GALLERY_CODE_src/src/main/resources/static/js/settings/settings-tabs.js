// settings-tabs.js - Tab Switching for Settings Page

const SettingsTabs = (function() {
    
    function init() {
        console.log('[SettingsTabs] Initializing...');
        
        const tabButtons = document.querySelectorAll('.settings-tab');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                switchTab(tabName);
            });
        });
        
        console.log('[SettingsTabs] Initialized with', tabButtons.length, 'tabs');
    }
    
    function switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Add active class to selected tab and content
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}-tab`);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');
        
        console.log('[SettingsTabs] Switched to:', tabName);
    }
    
    return {
        init: init,
        switchTab: switchTab
    };
    
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SettingsTabs.init);
} else {
    SettingsTabs.init();
}

console.log('✅ Settings Tabs module loaded');
