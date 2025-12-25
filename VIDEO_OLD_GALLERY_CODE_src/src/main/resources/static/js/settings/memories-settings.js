// memories-settings.js - Memories Settings Tab

const MemoriesSettings = (function() {
    
    let isIndexing = false;
    
    function init() {
        console.log('[MemoriesSettings] Initializing...');
        
        // Set up event listeners
        const indexBtn = document.getElementById('runIndexingBtn');
        if (indexBtn) {
            indexBtn.addEventListener('click', runIndexing);
        }
        
        // Load gallery statistics
        loadGalleryStats();
        
        console.log('[MemoriesSettings] Initialized');
    }
    
    /**
     * Run manual indexing
     */
    async function runIndexing() {
        if (isIndexing) {
            return;
        }
        
        const button = document.getElementById('runIndexingBtn');
        const statusDiv = document.getElementById('indexingStatus');
        const progressDiv = document.getElementById('indexingProgress');
        
        // Disable button
        isIndexing = true;
        button.disabled = true;
        button.innerHTML = '⏳ Indexing in progress...';
        
        statusDiv.innerHTML = '<div class="loading">Starting indexing...</div>';
        progressDiv.innerHTML = '';
        
        try {
            const response = await fetch('/api/memories/debug/index');
            const result = await response.json();
            
            // Show results
            const successColor = '#10b981';
            const warningColor = '#f59e0b';
            const errorColor = '#ef4444';
            
            let statusHTML = '<div style="margin-top: 20px;">';
            statusHTML += `<h3 style="color: ${successColor};">✅ Indexing Complete!</h3>`;
            statusHTML += `<div class="stat-item">
                <span class="stat-label">Photos/Videos Indexed</span>
                <span class="stat-value" style="color: ${successColor};">${result.indexed || 0}</span>
            </div>`;
            statusHTML += `<div class="stat-item">
                <span class="stat-label">Skipped (already indexed)</span>
                <span class="stat-value" style="color: ${warningColor};">${result.skipped || 0}</span>
            </div>`;
            statusHTML += `<div class="stat-item">
                <span class="stat-label">Errors</span>
                <span class="stat-value" style="color: ${errorColor};">${result.errors || 0}</span>
            </div>`;
            statusHTML += `<div class="stat-item">
                <span class="stat-label">Time Taken</span>
                <span class="stat-value">${((result.durationMs || 0) / 1000).toFixed(1)}s</span>
            </div>`;
            statusHTML += '</div>';
            
            statusDiv.innerHTML = statusHTML;
            
            // Show details if available
            if (result.details) {
                progressDiv.innerHTML = `<pre style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 5px; margin-top: 10px; overflow-x: auto;">${JSON.stringify(result.details, null, 2)}</pre>`;
            }
            
            // Re-enable button
            isIndexing = false;
            button.disabled = false;
            button.innerHTML = '🔄 Index All Photos & Videos';
            
            // Reload stats
            await loadGalleryStats();
            
        } catch (error) {
            statusDiv.innerHTML = `<div style="color: #ef4444;">❌ Error during indexing: ${error.message}</div>`;
            isIndexing = false;
            button.disabled = false;
            button.innerHTML = '🔄 Index All Photos & Videos';
        }
    }
    
    /**
     * Load gallery statistics
     */
    async function loadGalleryStats() {
        try {
            const response = await fetch('/api/memories/debug');
            const data = await response.json();
            
            const totalIndexed = data.total_photos_indexed || 0;
            
            // Count photos vs videos from sample or metadata
            const photosBySource = data.photos_by_source || {};
            
            document.getElementById('totalIndexed').textContent = totalIndexed.toLocaleString();
            
            // Try to get photo/video breakdown
            // For now, show total (we'd need to add a field to distinguish in the API)
            document.getElementById('totalPhotos').textContent = totalIndexed.toLocaleString();
            document.getElementById('totalVideos').textContent = '-';
            
        } catch (error) {
            console.error('[MemoriesSettings] Error loading stats:', error);
            document.getElementById('totalIndexed').textContent = 'Error';
        }
    }
    
    // Public API
    return {
        init: init
    };
    
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MemoriesSettings.init);
} else {
    MemoriesSettings.init();
}

console.log('✅ Memories Settings module loaded');
