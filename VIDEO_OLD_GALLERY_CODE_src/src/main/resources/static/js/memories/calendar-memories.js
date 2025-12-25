// calendar-memories.js - Integrates memories with calendar view

const CalendarMemoriesModule = (function() {
    
    let currentMonth = null;
    let currentYear = null;
    let memoryCounts = {};
    
    /**
     * Initialize calendar memories integration
     */
    function init() {
        console.log('[CalendarMemories] Initializing calendar memories integration...');
        
        // Listen for calendar month changes
        document.addEventListener('calendarMonthChanged', handleMonthChange);
        
        // Listen for calendar rendered events
        document.addEventListener('calendarRendered', handleCalendarRendered);
    }
    
    /**
     * Handle calendar month change
     */
    function handleMonthChange(event) {
        const { year, month } = event.detail;
        currentYear = year;
        currentMonth = month;
        
        console.log('[CalendarMemories] Month changed:', year, month);
        loadMemoryCountsForMonth(year, month);
    }
    
    /**
     * Handle calendar rendered
     */
    function handleCalendarRendered(event) {
        console.log('[CalendarMemories] Calendar rendered, adding memory indicators');
        addMemoryIndicators();
    }
    
    /**
     * Load memory counts for a month
     */
    async function loadMemoryCountsForMonth(year, month) {
        try {
            const response = await fetch(`/api/memories/calendar/${year}/${month}`);
            if (!response.ok) {
                throw new Error('Failed to fetch memory counts');
            }
            
            const data = await response.json();
            memoryCounts = data.counts || {};
            
            console.log('[CalendarMemories] Loaded memory counts:', memoryCounts);
            
            // Trigger re-render of indicators
            addMemoryIndicators();
            
        } catch (error) {
            console.error('[CalendarMemories] Error loading memory counts:', error);
        }
    }
    
    /**
     * Add memory indicators to calendar dates
     */
    function addMemoryIndicators() {
        // Remove existing indicators
        document.querySelectorAll('.memory-indicator').forEach(el => el.remove());
        
        // Add indicators for dates with memories
        Object.entries(memoryCounts).forEach(([day, count]) => {
            addIndicatorToDate(parseInt(day), count);
        });
    }
    
    /**
     * Add indicator to a specific date
     */
    function addIndicatorToDate(day, count) {
        // Find the date cell in FullCalendar
        const dateCells = document.querySelectorAll('.fc-daygrid-day');
        
        dateCells.forEach(cell => {
            const dateAttr = cell.getAttribute('data-date');
            if (!dateAttr) return;
            
            const cellDate = new Date(dateAttr);
            if (cellDate.getDate() === day && 
                cellDate.getMonth() + 1 === currentMonth &&
                cellDate.getFullYear() === currentYear) {
                
                // Create memory indicator
                const indicator = createMemoryIndicator(count, currentMonth, day);
                
                // Find the day number element
                const dayTop = cell.querySelector('.fc-daygrid-day-top');
                if (dayTop) {
                    dayTop.appendChild(indicator);
                }
            }
        });
    }
    
    /**
     * Create memory indicator element
     */
    function createMemoryIndicator(count, month, day) {
        const indicator = document.createElement('div');
        indicator.className = 'memory-indicator';
        indicator.innerHTML = `📸 ${count}`;
        indicator.title = `${count} photo${count === 1 ? '' : 's'} from this day in previous years`;
        
        // Add click handler to the badge only
        indicator.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling to date cell
            handleDateClick(month, day, count);
        });
        
        return indicator;
    }
    
    /**
     * Handle date click with memories
     */
    function handleDateClick(month, day, count) {
        console.log('[CalendarMemories] Date clicked:', month, day, 'Count:', count);
        
        // Open memories modal for this date
        if (window.MemoriesModule) {
            window.MemoriesModule.openMemoriesForDate(month, day);
        }
    }
    
    /**
     * Get current memory counts
     */
    function getMemoryCounts() {
        return memoryCounts;
    }
    
    // Public API
    return {
        init: init,
        loadMemoryCountsForMonth: loadMemoryCountsForMonth,
        getMemoryCounts: getMemoryCounts
    };
    
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', CalendarMemoriesModule.init);
} else {
    CalendarMemoriesModule.init();
}

// Export for global access
window.CalendarMemoriesModule = CalendarMemoriesModule;
