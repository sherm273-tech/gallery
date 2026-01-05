// ===== WEATHER API MODULE =====
// Handles all weather data fetching from backend API

const WeatherAPI = (() => {
    // ===== PRIVATE VARIABLES =====
    let currentLocationTimezone = 'Australia/Melbourne'; // Default timezone
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Fetch current weather for a location
     * @param {number} locationId - Location ID
     * @returns {Promise<Object>} Current weather data
     */
    async function fetchCurrent(locationId) {
        try {
            const response = await fetch(`/api/weather/${locationId}/current`);
            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Error fetching current weather:', data.error);
                return null;
            }
            
            // Set timezone if available
            if (data.timezone) {
                currentLocationTimezone = data.timezone;
                console.log('🌍 Timezone set to:', currentLocationTimezone);
            }
            
            console.log('✅ Current weather fetched for:', data.name);
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching current weather:', error);
            return null;
        }
    }
    
    /**
     * Fetch forecast for a location
     * @param {number} locationId - Location ID
     * @returns {Promise<Object>} Forecast data
     */
    async function fetchForecast(locationId) {
        try {
            const response = await fetch(`/api/weather/${locationId}/forecast`);
            const data = await response.json();
            
            if (data.error) {
                console.error('❌ Error fetching forecast:', data.error);
                return null;
            }
            
            // Set timezone if available in forecast response
            if (data.timezone) {
                currentLocationTimezone = data.timezone;
                console.log('🌍 Timezone set from forecast to:', currentLocationTimezone);
            }
            
            console.log('✅ Forecast fetched');
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching forecast:', error);
            return null;
        }
    }
    
    /**
     * Fetch both current and forecast data
     * @param {number} locationId - Location ID
     * @returns {Promise<Object>} Combined weather data
     */
    async function fetchAll(locationId) {
        console.log(`🌤️ Fetching weather for location ID: ${locationId}`);
        
        const [current, forecast] = await Promise.all([
            fetchCurrent(locationId),
            fetchForecast(locationId)
        ]);
        
        if (!current || !forecast) {
            return null;
        }
        
        return {
            current,
            forecast,
            timezone: currentLocationTimezone
        };
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Get current timezone
     * @returns {string} Current location timezone
     */
    function getTimezone() {
        return currentLocationTimezone;
    }
    
    /**
     * Set timezone
     * @param {string} timezone - Timezone string (e.g. 'America/New_York')
     */
    function setTimezone(timezone) {
        currentLocationTimezone = timezone;
        console.log('🌍 Timezone updated to:', timezone);
    }
    
    /**
     * Update weather for location
     * @param {number} locationId - Location ID
     * @returns {Promise<Object>} Weather data
     */
    async function updateWeather(locationId) {
        return await fetchAll(locationId);
    }
    
    /**
     * Get current weather only
     * @param {number} locationId - Location ID
     * @returns {Promise<Object>} Current weather data
     */
    async function getCurrent(locationId) {
        return await fetchCurrent(locationId);
    }
    
    /**
     * Get forecast only
     * @param {number} locationId - Location ID
     * @returns {Promise<Object>} Forecast data
     */
    async function getForecast(locationId) {
        return await fetchForecast(locationId);
    }
    
    // Return public API
    return {
        updateWeather,
        getCurrent,
        getForecast,
        getTimezone,
        setTimezone
    };
})();

console.log('✅ Weather API module loaded');
