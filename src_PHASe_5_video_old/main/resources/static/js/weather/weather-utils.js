// ===== WEATHER UTILITIES MODULE =====
// Weather-specific utility functions

const WeatherUtils = (() => {
    // ===== PUBLIC UTILITY FUNCTIONS =====
    
    /**
     * Format time for weather display
     * @param {Date} date - Date object
     * @param {string} timezone - Optional timezone (uses API timezone if not provided)
     * @returns {string} Formatted time string
     */
    function formatTime(date, timezone) {
        if (!timezone) {
            timezone = WeatherAPI.getTimezone();
        }
        
        return date.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone
        });
    }
    
    /**
     * Format sun time (sunrise/sunset)
     * @param {number} timestamp - Unix timestamp
     * @param {string} timezone - Optional timezone
     * @returns {string} Formatted time string
     */
    function formatSunTime(timestamp, timezone) {
        const date = new Date(timestamp * 1000);
        return formatTime(date, timezone);
    }
    
    /**
     * Get UV index information
     * @param {number} uvIndex - UV index value
     * @returns {Object} UV info with level, color, description
     */
    function getUVInfo(uvIndex) {
        const uv = Math.round(uvIndex * 10) / 10;
        
        if (uv < 3) {
            return { level: 'Low', color: '#4CAF50', description: 'No protection needed' };
        } else if (uv < 6) {
            return { level: 'Moderate', color: '#FFC107', description: 'Wear sunscreen' };
        } else if (uv < 8) {
            return { level: 'High', color: '#FF9800', description: 'Protection required' };
        } else if (uv < 11) {
            return { level: 'Very High', color: '#F44336', description: 'Extra protection' };
        } else {
            return { level: 'Extreme', color: '#9C27B0', description: 'Avoid sun exposure' };
        }
    }
    
    /**
     * Get wind direction from degrees
     * @param {number} degrees - Wind direction in degrees
     * @returns {string} Direction abbreviation (N, NE, E, etc.)
     */
    function getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(((degrees % 360) / 45)) % 8;
        return directions[index];
    }
    
    /**
     * Get wind arrow based on wind speed
     * @param {number} windKmh - Wind speed in km/h
     * @returns {string} Wind icon
     */
    function getWindArrow(windKmh) {
        if (windKmh > 50) {
            return '💨💨';
        } else if (windKmh > 30) {
            return '💨';
        } else {
            return '🍃';
        }
    }
    
    /**
     * Convert m/s to km/h
     * @param {number} ms - Speed in meters per second
     * @returns {number} Speed in km/h
     */
    function msToKmh(ms) {
        return Math.round(ms * 3.6);
    }
    
    /**
     * Get weather icon URL
     * @param {string} iconCode - Weather icon code
     * @param {boolean} large - Use large (2x) icon
     * @returns {string} Icon URL
     */
    function getWeatherIconUrl(iconCode, large = false) {
        const size = large ? '@2x' : '';
        return `https://openweathermap.org/img/wn/${iconCode}${size}.png`;
    }
    
    /**
     * Capitalize first letter of each word
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    function capitalizeFirst(str) {
        return str.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Filter future hours from hourly data
     * @param {Array} hourlyData - Array of hourly forecast data
     * @returns {Array} Future hours only
     */
    function filterFutureHours(hourlyData) {
        const now = Date.now();
        return hourlyData.filter(hour => {
            const hourTime = hour.dt * 1000;
            return hourTime > now;
        });
    }
    
    /**
     * Get day name from timestamp
     * @param {number} timestamp - Unix timestamp
     * @param {number} index - Day index (0 = Today)
     * @returns {string} Day name
     */
    function getDayName(timestamp, index) {
        if (index === 0) return 'Today';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    /**
     * Format hourly time
     * @param {number} timestamp - Unix timestamp
     * @param {string} timezone - Timezone
     * @returns {string} Formatted time (e.g. "2:00 PM")
     */
    function formatHourlyTime(timestamp, timezone) {
        const time = new Date(timestamp * 1000);
        const timeStr = time.toLocaleString('en-AU', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: timezone
        });
        
        // Extract just the time (remove date if present)
        return timeStr.includes(',') ? timeStr.split(',').pop().trim() : timeStr;
    }
    
    /**
     * Get temperature color based on value
     * @param {number} temp - Temperature in Celsius
     * @returns {string} Color code
     */
    function getTempColor(temp) {
        if (temp >= 35) return '#d32f2f'; // Very hot - dark red
        if (temp >= 30) return '#f44336'; // Hot - red
        if (temp >= 25) return '#ff9800'; // Warm - orange
        if (temp >= 20) return '#ffc107'; // Pleasant - yellow
        if (temp >= 15) return '#4caf50'; // Cool - green
        if (temp >= 10) return '#2196f3'; // Cold - blue
        return '#1976d2'; // Very cold - dark blue
    }
    
    /**
     * Get precipitation probability message
     * @param {number} pop - Probability (0-1)
     * @returns {string} Message
     */
    function getPrecipMessage(pop) {
        const percent = Math.round(pop * 100);
        if (percent >= 80) return 'Very likely';
        if (percent >= 60) return 'Likely';
        if (percent >= 40) return 'Possible';
        if (percent >= 20) return 'Slight chance';
        return 'Unlikely';
    }
    
    // Return public API
    return {
        formatTime,
        formatSunTime,
        getUVInfo,
        getWindDirection,
        getWindArrow,
        msToKmh,
        getWeatherIconUrl,
        capitalizeFirst,
        filterFutureHours,
        getDayName,
        formatHourlyTime,
        getTempColor,
        getPrecipMessage
    };
})();

console.log('✅ Weather Utils module loaded');
