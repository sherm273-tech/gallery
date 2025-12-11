// ===== SHARED UTILITY FUNCTIONS =====
// Common utilities used across multiple modules

/**
 * Format seconds into MM:SS time string (for music player)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (e.g., "3:45")
 */
function formatMusicTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) {
        return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format Date object into time string (for weather)
 * @param {Date} date - Date object
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @returns {string} Formatted time string (e.g., "10:30 am")
 */
function formatWeatherTime(date, timezone = 'Australia/Melbourne') {
    return date.toLocaleTimeString('en-AU', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
    });
}

/**
 * Get weather icon URL from OpenWeatherMap
 * @param {string} iconCode - Icon code from API
 * @returns {string} Full URL to weather icon
 */
function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Get UV Index information (level, color, description)
 * @param {number} uvIndex - UV index value
 * @returns {Object} UV information { level, color, description }
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
 * @returns {string} Compass direction (e.g., "NW")
 */
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Get wind direction arrow
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Arrow character
 */
function getWindArrow(degrees) {
    const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    const index = Math.round(((degrees + 180) % 360) / 45) % 8;
    return arrows[index];
}

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format sun time from Unix timestamp
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted time (HH:MM)
 */
function formatSunTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

console.log('✅ Shared utilities loaded');
