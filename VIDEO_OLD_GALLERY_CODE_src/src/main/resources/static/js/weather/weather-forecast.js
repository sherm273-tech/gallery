// ===== WEATHER FORECAST MODULE =====
// Handles hourly and weekly forecast display

const WeatherForecast = (() => {
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Update hourly forecast display
     * @param {Array} hourlyData - Hourly forecast data
     */
    function updateHourly(hourlyData) {
        const container = document.getElementById('hourlyForecast');
        if (!container) {
            console.warn('⚠️ hourlyForecast container not found');
            return;
        }
        
        container.innerHTML = '';
        
        // Filter to future hours only
        const futureHours = WeatherUtils.filterFutureHours(hourlyData);
        
        console.log('📊 Total hours from API:', hourlyData.length);
        console.log('📊 Future hours:', futureHours.length);
        
        // Show next 8 future hours
        const next8Hours = futureHours.slice(0, 8);
        
        console.log('📊 Displaying:', next8Hours.length, 'hours');
        
        const timezone = WeatherAPI.getTimezone();
        
        next8Hours.forEach((hour, index) => {
            // Debug first item
            if (index === 0) {
                console.log('First future hour data:', hour);
                console.log('Timestamp (dt):', hour.dt);
            }
            
            const temp = Math.round(hour.main.temp);
            const icon = hour.weather[0].icon;
            const pop = Math.round((hour.pop || 0) * 100);
            
            // Format time in location's timezone
            const timeStr = WeatherUtils.formatHourlyTime(hour.dt, timezone);
            
            // Debug first time
            if (index === 0) {
                console.log('First time display:', timeStr);
            }
            
            const hourDiv = document.createElement('div');
            hourDiv.className = 'hourly-item';
            hourDiv.innerHTML = `
                <div class="hourly-time">${timeStr}</div>
                <img class="hourly-icon" src="${WeatherUtils.getWeatherIconUrl(icon)}" alt="Weather">
                <div class="hourly-temp">${temp}°</div>
                ${pop > 20 ? `<div class="hourly-rain">${pop}%</div>` : ''}
            `;
            
            container.appendChild(hourDiv);
        });
        
        console.log('✅ Hourly forecast updated');
    }
    
    /**
     * Update weekly forecast display
     * @param {Array} dailyData - Daily forecast data
     */
    function updateWeekly(dailyData) {
        const container = document.getElementById('weeklyForecast');
        if (!container) {
            console.warn('⚠️ weeklyForecast container not found');
            return;
        }
        
        container.innerHTML = '';
        
        dailyData.forEach((day, index) => {
            const dayName = WeatherUtils.getDayName(day.dt, index);
            const high = Math.round(day.temp.max);
            const low = Math.round(day.temp.min);
            const icon = day.weather[0].icon;
            const desc = day.weather[0].description;
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'weekly-item';
            dayDiv.innerHTML = `
                <div class="weekly-day">${dayName}</div>
                <img class="weekly-icon" src="${WeatherUtils.getWeatherIconUrl(icon)}" alt="${desc}">
                <div class="weekly-temps">
                    <span class="weekly-high">${high}°</span>
                    <span class="weekly-low">${low}°</span>
                </div>
            `;
            
            container.appendChild(dayDiv);
        });
        
        console.log('✅ Weekly forecast updated');
    }
    
    /**
     * Update summary widget (high/low temps, UV, rain)
     * @param {Object} data - Forecast data
     */
    function updateSummary(data) {
        // Update high/low temps
        if (data.daily && data.daily.length > 0) {
            const today = data.daily[0];
            const high = Math.round(today.temp.max);
            const low = Math.round(today.temp.min);
            
            const highEl = document.getElementById('summaryHigh');
            const lowEl = document.getElementById('summaryLow');
            
            if (highEl) highEl.textContent = high + '°';
            if (lowEl) lowEl.textContent = low + '°';
        }
        
        // Find max UV and max rain from future hourly data
        if (data.list) {
            let maxUV = 0;
            let maxRain = 0;
            
            // Filter to future hours
            const futureHours = WeatherUtils.filterFutureHours(data.list);
            
            // Look at next 24 hours only
            const next24Hours = futureHours.slice(0, 24);
            
            next24Hours.forEach((hour, index) => {
                // Debug first hour
                if (index === 0) {
                    console.log('📊 First future hour for summary:', {
                        dt: hour.dt,
                        temp: hour.main?.temp,
                        pop: hour.pop,
                        uv_index: hour.uv_index,
                        rain: hour.rain
                    });
                }
                
                // Track max UV
                if (hour.uv_index !== undefined) {
                    maxUV = Math.max(maxUV, hour.uv_index);
                }
                
                // Track max rain probability
                if (hour.pop !== undefined) {
                    maxRain = Math.max(maxRain, hour.pop);
                }
            });
            
            console.log(`📊 Max UV (next 24h): ${maxUV}`);
            console.log(`📊 Max Rain (next 24h): ${(maxRain * 100).toFixed(0)}%`);
            
            // Update UV display
            const uvEl = document.getElementById('summaryUV');
            if (uvEl) {
                const uvInfo = WeatherUtils.getUVInfo(maxUV);
                uvEl.innerHTML = `
                    <span style="color: ${uvInfo.color}">UV ${Math.round(maxUV)}</span>
                    <span style="font-size: 0.9em; opacity: 0.8">${uvInfo.level}</span>
                `;
            }
            
            // Update rain probability
            const rainEl = document.getElementById('summaryRain');
            if (rainEl) {
                const rainPercent = Math.round(maxRain * 100);
                rainEl.innerHTML = `
                    <span>${rainPercent}%</span>
                    <span style="font-size: 0.9em; opacity: 0.8">${WeatherUtils.getPrecipMessage(maxRain)}</span>
                `;
            }
            
            // Update recommendations
            updateRecommendations(maxUV, maxRain);
        }
        
        console.log('✅ Summary updated');
    }
    
    /**
     * Update recommendations based on UV and rain
     * @param {number} maxUV - Maximum UV index
     * @param {number} maxRain - Maximum rain probability (0-1)
     */
    function updateRecommendations(maxUV, maxRain) {
        const container = document.getElementById('summaryRecommendations');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (maxUV >= 8) {
            const rec = document.createElement('div');
            rec.className = 'summary-recommendation';
            rec.textContent = '☀️ Very high UV - wear sunscreen';
            container.appendChild(rec);
        }
        
        if (maxRain > 0.5) {
            const rec = document.createElement('div');
            rec.className = 'summary-recommendation';
            rec.textContent = '🌧️ Rain expected - bring umbrella';
            container.appendChild(rec);
        }
        
        if (container.children.length === 0) {
            const rec = document.createElement('div');
            rec.className = 'summary-recommendation';
            rec.textContent = '✨ Great weather today!';
            container.appendChild(rec);
        }
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Update all forecast displays
     * @param {Object} forecastData - Complete forecast data
     */
    function update(forecastData) {
        if (!forecastData) {
            console.warn('⚠️ No forecast data provided');
            return;
        }
        
        // Update hourly forecast
        if (forecastData.list) {
            updateHourly(forecastData.list);
        }
        
        // Update weekly forecast
        if (forecastData.daily) {
            updateWeekly(forecastData.daily);
        }
        
        // Update chart
        if (forecastData.list) {
            WeatherChart.update(forecastData.list);
        }
        
        // Update summary widget
        updateSummary(forecastData);
        
        console.log('✅ All forecasts updated');
    }
    
    /**
     * Clear all forecast displays
     */
    function clear() {
        const hourly = document.getElementById('hourlyForecast');
        const weekly = document.getElementById('weeklyForecast');
        const recommendations = document.getElementById('summaryRecommendations');
        
        if (hourly) hourly.innerHTML = '';
        if (weekly) weekly.innerHTML = '';
        if (recommendations) recommendations.innerHTML = '';
        
        console.log('🗑️ Forecasts cleared');
    }
    
    // Return public API
    return {
        update,
        updateHourly,
        updateWeekly,
        updateSummary,
        clear
    };
})();

console.log('✅ Weather Forecast module loaded');
