// ===== WEATHER DISPLAY MODULE =====
// Main weather display controller - coordinates all weather modules

const WeatherDisplay = (() => {
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Update current weather display
     * @param {Object} data - Current weather data
     */
    function updateCurrent(data) {
        if (!data) {
            console.warn('⚠️ No current weather data');
            return;
        }
        
        // Update temperature
        const temp = Math.round(data.main.temp);
        const tempEl = document.getElementById('weatherTemp');
        if (tempEl) tempEl.textContent = temp + '°';
        
        // Update feels like
        const feelsLike = Math.round(data.main.feels_like);
        const feelsEl = document.getElementById('weatherFeelsInline');
        if (feelsEl) feelsEl.textContent = `Feels like ${feelsLike}°`;
        
        // Update description
        const description = WeatherUtils.capitalizeFirst(data.weather[0].description);
        const descEl = document.getElementById('weatherDesc');
        if (descEl) descEl.textContent = description;
        
        // Update weather icon
        const iconCode = data.weather[0].icon;
        const iconUrl = WeatherUtils.getWeatherIconUrl(iconCode, true); // Large icon
        const iconEl = document.getElementById('weatherIcon');
        if (iconEl) iconEl.src = iconUrl;
        
        // Update humidity
        const humidityEl = document.getElementById('weatherHumidity');
        if (humidityEl) humidityEl.textContent = data.main.humidity + '%';
        
        // Update wind
        const windKmh = WeatherUtils.msToKmh(data.wind.speed);
        const windEl = document.getElementById('weatherWind');
        if (windEl) windEl.textContent = windKmh + ' km/h';
        
        // Update UV index
        const uvIndex = data.uv_index || 0;
        const uvEl = document.getElementById('weatherUV');
        if (uvEl) uvEl.textContent = `UV ${Math.round(uvIndex)}`;
        
        // Update wind icon
        const windIcon = document.getElementById('windIcon');
        if (windIcon) {
            windIcon.textContent = WeatherUtils.getWindArrow(windKmh);
        }
        
        // Update sunrise/sunset
        if (data.sys) {
            const timezone = WeatherAPI.getTimezone();
            
            const sunriseEl = document.getElementById('weatherSunrise');
            if (sunriseEl) {
                sunriseEl.textContent = WeatherUtils.formatSunTime(data.sys.sunrise, timezone);
            }
            
            const sunsetEl = document.getElementById('weatherSunset');
            if (sunsetEl) {
                sunsetEl.textContent = WeatherUtils.formatSunTime(data.sys.sunset, timezone);
            }
        }
        
        // Update weather alerts
        updateAlerts(data.alerts || []);
        
        console.log('✅ Current weather display updated for:', data.name);
    }
    
    /**
     * Update weather alerts
     * @param {Array} alerts - Weather alerts
     */
    function updateAlerts(alerts) {
        const container = document.getElementById('weatherAlerts');
        if (!container) return;
        
        if (alerts.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        container.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `weather-alert alert-${alert.severity}`;
            alertDiv.innerHTML = `
                <span class="alert-icon">${getAlertIcon(alert.type)}</span>
                <span class="alert-message">${alert.message}</span>
            `;
            container.appendChild(alertDiv);
        });
        
        console.log('✅ Alerts updated:', alerts.length);
    }
    
    /**
     * Get alert icon for alert type
     * @param {string} type - Alert type
     * @returns {string} Icon emoji
     */
    function getAlertIcon(type) {
        switch (type) {
            case 'UV': return '☀️';
            case 'Wind': return '💨';
            case 'Heat': return '🔥';
            case 'Cold': return '❄️';
            case 'Thunderstorm': return '⛈️';
            default: return '⚠️';
        }
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize weather display
     */
    function init() {
        // Initialize chart
        WeatherChart.init();
        console.log('✅ Weather Display module initialized');
    }
    
    /**
     * Update weather for a location
     * @param {number} locationId - Location ID
     * @returns {Promise<void>}
     */
    async function updateWeather(locationId) {
        console.log(`🌤️ Updating weather for location ID: ${locationId}`);
        
        try {
            // Fetch weather data
            const weatherData = await WeatherAPI.updateWeather(locationId);
            
            if (!weatherData) {
                console.error('❌ Failed to fetch weather data');
                return;
            }
            
            // Update displays
            updateCurrent(weatherData.current);
            WeatherForecast.update(weatherData.forecast);
            
            console.log('✅ Weather display updated successfully');
            
        } catch (error) {
            console.error('❌ Error updating weather display:', error);
        }
    }
    
    /**
     * Clear all weather displays
     */
    function clear() {
        WeatherForecast.clear();
        
        // Clear current weather
        const elements = [
            'weatherTemp',
            'weatherFeelsInline',
            'weatherDesc',
            'weatherHumidity',
            'weatherWind',
            'weatherUV',
            'weatherSunrise',
            'weatherSunset'
        ];
        
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '--';
        });
        
        const iconEl = document.getElementById('weatherIcon');
        if (iconEl) iconEl.src = '';
        
        console.log('🗑️ Weather displays cleared');
    }
    
    /**
     * Show weather overlay
     */
    function show() {
        const overlay = document.getElementById('weatherOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            console.log('👁️ Weather overlay shown');
        }
    }
    
    /**
     * Hide weather overlay
     */
    function hide() {
        const overlay = document.getElementById('weatherOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            console.log('👁️ Weather overlay hidden');
        }
    }
    
    // Return public API
    return {
        init,
        updateWeather,
        updateCurrent,
        clear,
        show,
        hide
    };
})();

console.log('✅ Weather Display module loaded');
