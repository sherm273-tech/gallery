// ===== UPDATE WEATHER FOR SPECIFIC LOCATION =====
// Add this function to your script.js

async function updateWeatherForLocation(locationId) {
    console.log(`🌤️ Updating weather for location ID: ${locationId}`);
    
    try {
        // Fetch current weather for this location
        const currentResponse = await fetch(`/api/weather/${locationId}/current`);
        const currentData = await currentResponse.json();
        
        if (currentData.error) {
            console.error('Error fetching current weather:', currentData.error);
            return;
        }
        
        // Fetch forecast for this location
        const forecastResponse = await fetch(`/api/weather/${locationId}/forecast`);
        const forecastData = await forecastResponse.json();
        
        if (forecastData.error) {
            console.error('Error fetching forecast:', forecastData.error);
            return;
        }
        
        // Update all weather displays with new data
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        
        console.log('✅ Weather updated for location:', currentData.name);
        
    } catch (error) {
        console.error('❌ Error updating weather for location:', error);
    }
}

// ===== UPDATE CURRENT WEATHER DISPLAY =====
function updateCurrentWeather(data) {
    // Update location name (already done by location manager)
    // document.getElementById('weatherLocation').textContent = data.name;
    
    // Update temperature
    const temp = Math.round(data.main.temp);
    document.getElementById('weatherTemp').textContent = temp + '°';
    
    // Update feels like
    const feelsLike = Math.round(data.main.feels_like);
    document.getElementById('weatherFeelsInline').textContent = `Feels like ${feelsLike}°`;
    
    // Update description
    const description = data.weather[0].description;
    document.getElementById('weatherDesc').textContent = description;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weatherIcon').src = iconUrl;
    
    // Update humidity
    document.getElementById('weatherHumidity').textContent = data.main.humidity + '%';
    
    // Update wind (convert m/s to km/h)
    const windKmh = Math.round(data.wind.speed * 3.6);
    document.getElementById('weatherWind').textContent = windKmh + ' km/h';
    
    // Update UV index
    const uvIndex = data.uv_index || 0;
    document.getElementById('weatherUV').textContent = `UV ${Math.round(uvIndex)}`;
    
    // Update wind icon based on speed
    const windIcon = document.getElementById('windIcon');
    if (windKmh > 50) {
        windIcon.textContent = '💨💨';
    } else if (windKmh > 30) {
        windIcon.textContent = '💨';
    } else {
        windIcon.textContent = '🍃';
    }
    
    // Update sunrise/sunset
    if (data.sys) {
        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);
        document.getElementById('weatherSunrise').textContent = formatTime(sunrise);
        document.getElementById('weatherSunset').textContent = formatTime(sunset);
    }
    
    // Update weather alerts
    updateWeatherAlerts(data.alerts || []);
}

// ===== UPDATE FORECAST DISPLAY =====
function updateForecast(data) {
    // Update hourly forecast
    updateHourlyForecast(data.list);
    
    // Update weekly forecast
    updateWeeklyForecast(data.daily);
    
    // Update precipitation chart
    updatePrecipitationChart(data.list);
    
    // Update summary widget (high/low temps)
    updateSummaryWidget(data);
}

// ===== UPDATE HOURLY FORECAST =====
function updateHourlyForecast(hourlyData) {
    const hourlyContainer = document.getElementById('hourlyForecast');
    if (!hourlyContainer) return;
    
    hourlyContainer.innerHTML = '';
    
    // Get current time
    const now = Date.now();
    
    // Filter to only show FUTURE hours (not past hours)
    const futureHours = hourlyData.filter(hour => {
        const hourTime = hour.dt * 1000; // Convert to milliseconds
        return hourTime > now; // Only times in the future
    });
    
    console.log('📊 Total hours from API:', hourlyData.length);
    console.log('📊 Future hours:', futureHours.length);
    
    // Show next 8 future hours
    const next24Hours = futureHours.slice(0, 8);
    
    console.log('📊 Displaying:', next24Hours.length, 'hours');
    
    next24Hours.forEach((hour, index) => {
        // Debug first item
        if (index === 0) {
            console.log('First future hour data:', hour);
            console.log('Timestamp (dt):', hour.dt);
        }
        
        const time = new Date(hour.dt * 1000);
        const temp = Math.round(hour.main.temp);
        const icon = hour.weather[0].icon;
        const pop = Math.round((hour.pop || 0) * 100);
        
        // Format time in Melbourne timezone
        const timeStr = time.toLocaleString('en-AU', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'Australia/Melbourne'
        });
        
        // Extract just the time (remove date if present)
        const timeOnly = timeStr.includes(',') ? timeStr.split(',').pop().trim() : timeStr;
        
        // Debug first time
        if (index === 0) {
            console.log('First time display:', timeOnly);
        }
        
        const hourDiv = document.createElement('div');
        hourDiv.className = 'hourly-item';
        hourDiv.innerHTML = `
            <div class="hourly-time">${timeOnly}</div>
            <img class="hourly-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather">
            <div class="hourly-temp">${temp}°</div>
            ${pop > 20 ? `<div class="hourly-rain">${pop}%</div>` : ''}
        `;
        
        hourlyContainer.appendChild(hourDiv);
    });
}


// ===== UPDATE WEEKLY FORECAST =====
function updateWeeklyForecast(dailyData) {
    const weeklyContainer = document.getElementById('weeklyForecast');
    if (!weeklyContainer) return;
    
    weeklyContainer.innerHTML = '';
    
    dailyData.forEach((day, index) => {
        const date = new Date(day.dt * 1000);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const high = Math.round(day.temp.max);
        const low = Math.round(day.temp.min);
        const icon = day.weather[0].icon;
        const desc = day.weather[0].description;
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'weekly-item';
        dayDiv.innerHTML = `
            <div class="weekly-day">${dayName}</div>
            <img class="weekly-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
            <div class="weekly-temps">
                <span class="weekly-high">${high}°</span>
                <span class="weekly-low">${low}°</span>
            </div>
        `;
        
        weeklyContainer.appendChild(dayDiv);
    });
}

// ===== UPDATE SUMMARY WIDGET =====
function updateSummaryWidget(data) {
    if (data.daily && data.daily.length > 0) {
        const today = data.daily[0];
        const high = Math.round(today.temp.max);
        const low = Math.round(today.temp.min);
        
        document.getElementById('summaryHigh').textContent = high + '°';
        document.getElementById('summaryLow').textContent = low + '°';
    }
    
    // Find max UV and max rain probability from hourly data
    if (data.list) {
        let maxUV = 0;
        let maxRain = 0;
        
        data.list.slice(0, 8).forEach(hour => {
            if (hour.uv_index && hour.uv_index > maxUV) maxUV = hour.uv_index;
            if (hour.pop && hour.pop > maxRain) maxRain = hour.pop;
        });
        
        document.getElementById('summaryUV').querySelector('.summary-text').textContent = `UV Peak: ${Math.round(maxUV)}`;
        document.getElementById('summaryRain').querySelector('.summary-text').textContent = `Rain: ${Math.round(maxRain * 100)}%`;
        
        // Update recommendations
        updateRecommendations(maxUV, maxRain);
    }
}

// ===== UPDATE RECOMMENDATIONS =====
function updateRecommendations(maxUV, maxRain) {
    const recommendationsContainer = document.getElementById('summaryRecommendations');
    if (!recommendationsContainer) return;
    
    recommendationsContainer.innerHTML = '';
    
    if (maxUV >= 8) {
        const rec = document.createElement('div');
        rec.className = 'summary-recommendation';
        rec.textContent = '☀️ Very high UV - wear sunscreen';
        recommendationsContainer.appendChild(rec);
    }
    
    if (maxRain > 0.5) {
        const rec = document.createElement('div');
        rec.className = 'summary-recommendation';
        rec.textContent = '🌧️ Rain expected - bring umbrella';
        recommendationsContainer.appendChild(rec);
    }
    
    if (recommendationsContainer.children.length === 0) {
        const rec = document.createElement('div');
        rec.className = 'summary-recommendation';
        rec.textContent = '✨ Great weather today!';
        recommendationsContainer.appendChild(rec);
    }
}

// ===== UPDATE WEATHER ALERTS =====
function updateWeatherAlerts(alerts) {
    const alertsContainer = document.getElementById('weatherAlerts');
    if (!alertsContainer) return;
    
    if (alerts.length === 0) {
        alertsContainer.style.display = 'none';
        return;
    }
    
    alertsContainer.style.display = 'block';
    alertsContainer.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `weather-alert alert-${alert.severity}`;
        alertDiv.innerHTML = `
            <span class="alert-icon">${getAlertIcon(alert.type)}</span>
            <span class="alert-message">${alert.message}</span>
        `;
        alertsContainer.appendChild(alertDiv);
    });
}

// ===== HELPER: GET ALERT ICON =====
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

// ===== HELPER: FORMAT TIME =====
function formatTime(date) {
    // Ensure we're displaying in Melbourne time (AEDT/AEST)
    return date.toLocaleTimeString('en-AU', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Australia/Melbourne'
    });
}

// ===== UPDATE PRECIPITATION CHART =====
function updatePrecipitationChart(hourlyData) {
    // Your existing chart update code
    // This depends on how you currently update the chart
    // If you have this function already, it will be called
    // If not, you can add Chart.js update code here
    console.log('📊 Precipitation chart update - implement if needed');
}

console.log('✅ updateWeatherForLocation function loaded');