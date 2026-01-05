// video-stats.js - Video statistics dashboard

const VideoStats = (function() {
    
    let stats = null;
    
    /**
     * Initialize statistics module
     */
    function init() {
        console.log('[VideoStats] Initializing...');
        loadStatistics();
    }
    
    /**
     * Load statistics from server
     */
    async function loadStatistics() {
        try {
            const response = await fetch('/api/videos/stats');
            if (!response.ok) {
                throw new Error('Failed to load statistics');
            }
            
            stats = await response.json();
            console.log('[VideoStats] Loaded statistics:', stats);
            
            renderStatistics();
            
        } catch (error) {
            console.error('[VideoStats] Error loading statistics:', error);
        }
    }
    
    /**
     * Render statistics dashboard
     */
    function renderStatistics() {
        if (!stats) return;
        
        renderOverview();
        renderFolderBreakdown();
        renderYearBreakdown();
        renderDurationBreakdown();
    }
    
    /**
     * Render overview stats
     */
    function renderOverview() {
        const container = document.getElementById('statsOverview');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">📹</div>
                <div class="stat-value">${stats.totalVideos}</div>
                <div class="stat-label">Total Videos</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">${stats.totalDurationFormatted}</div>
                <div class="stat-label">Total Duration</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-value">${stats.totalSizeFormatted}</div>
                <div class="stat-label">Total Size</div>
            </div>
        `;
    }
    
    /**
     * Render folder breakdown
     */
    function renderFolderBreakdown() {
        const container = document.getElementById('folderBreakdown');
        if (!container || !stats.byFolder) return;
        
        const folders = Object.entries(stats.byFolder)
            .sort((a, b) => b[1] - a[1])  // Sort by count descending
            .slice(0, 10);  // Top 10
        
        if (folders.length === 0) {
            container.innerHTML = '<p class="no-data">No folder data available</p>';
            return;
        }
        
        const maxCount = Math.max(...folders.map(f => f[1]));
        
        container.innerHTML = `
            <h3>Videos by Folder</h3>
            <div class="breakdown-list">
                ${folders.map(([folder, count]) => {
                    const percentage = (count / maxCount) * 100;
                    return `
                        <div class="breakdown-item">
                            <div class="breakdown-label">${folder}</div>
                            <div class="breakdown-bar">
                                <div class="breakdown-fill" style="width: ${percentage}%"></div>
                                <span class="breakdown-count">${count}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    /**
     * Render year breakdown
     */
    function renderYearBreakdown() {
        const container = document.getElementById('yearBreakdown');
        if (!container || !stats.byYear) return;
        
        const years = Object.entries(stats.byYear)
            .sort((a, b) => a[0].localeCompare(b[0]));  // Sort by year
        
        if (years.length === 0) {
            container.innerHTML = '<p class="no-data">No year data available</p>';
            return;
        }
        
        const maxCount = Math.max(...years.map(y => y[1]));
        
        container.innerHTML = `
            <h3>Videos by Year</h3>
            <div class="breakdown-list">
                ${years.map(([year, count]) => {
                    const percentage = (count / maxCount) * 100;
                    return `
                        <div class="breakdown-item">
                            <div class="breakdown-label">${year}</div>
                            <div class="breakdown-bar">
                                <div class="breakdown-fill" style="width: ${percentage}%"></div>
                                <span class="breakdown-count">${count}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    /**
     * Render duration breakdown
     */
    function renderDurationBreakdown() {
        const container = document.getElementById('durationBreakdown');
        if (!container || !stats.durationBreakdown) return;
        
        const { short, medium, long } = stats.durationBreakdown;
        const total = short + medium + long;
        
        if (total === 0) {
            container.innerHTML = '<p class="no-data">No duration data available</p>';
            return;
        }
        
        const shortPct = (short / total) * 100;
        const mediumPct = (medium / total) * 100;
        const longPct = (long / total) * 100;
        
        container.innerHTML = `
            <h3>Videos by Duration</h3>
            <div class="duration-chart">
                <div class="duration-segment short" style="width: ${shortPct}%">
                    <div class="segment-label">Short (&lt;1min)</div>
                    <div class="segment-count">${short}</div>
                </div>
                <div class="duration-segment medium" style="width: ${mediumPct}%">
                    <div class="segment-label">Medium (1-5min)</div>
                    <div class="segment-count">${medium}</div>
                </div>
                <div class="duration-segment long" style="width: ${longPct}%">
                    <div class="segment-label">Long (&gt;5min)</div>
                    <div class="segment-count">${long}</div>
                </div>
            </div>
            <div class="duration-legend">
                <div class="legend-item">
                    <span class="legend-color short"></span>
                    <span>Short: ${short} videos (${shortPct.toFixed(1)}%)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color medium"></span>
                    <span>Medium: ${medium} videos (${mediumPct.toFixed(1)}%)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color long"></span>
                    <span>Long: ${long} videos (${longPct.toFixed(1)}%)</span>
                </div>
            </div>
        `;
    }
    
    // Public API
    return {
        init,
        loadStatistics
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VideoStats.init);
} else {
    VideoStats.init();
}

// Export for use by other modules
window.VideoStats = VideoStats;
