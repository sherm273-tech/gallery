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
        
        // Set the timezone for this location
        if (currentData.timezone) {
            currentLocationTimezone = currentData.timezone;
            console.log('🌍 Timezone set to:', currentLocationTimezone);
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
        
        // Format time in LOCATION'S timezone (not hardcoded Melbourne)
        const timeStr = time.toLocaleString('en-AU', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: currentLocationTimezone  // ← Use location's timezone!
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
    
    // Find max UV and max rain probability from FUTURE hourly data
    if (data.list) {
        let maxUV = 0;
        let maxRain = 0;
        
        // Get current time to filter future hours
        const now = Date.now();
        
        // Filter to only future hours
        const futureHours = data.list.filter(hour => {
            const hourTime = hour.dt * 1000;
            return hourTime > now;
        });
        
        // Look at next 24 HOURS ONLY (not days away) for UV and rain
        // This gives relevant "today/tonight" recommendations
        const next24Hours = futureHours.slice(0, 24);
        
        next24Hours.forEach((hour, index) => {
            // Debug first hour
            if (index === 0) {
                console.log('📊 First future hour for summary:', {
                    dt: hour.dt,
                    time: new Date(hour.dt * 1000).toLocaleString('en-AU', {timeZone: 'Australia/Melbourne'}),
                    temp: hour.main?.temp,
                    pop: hour.pop,
                    uv_index: hour.uv_index,
                    rain: hour.rain
                });
            }
            
            if (hour.uv_index && hour.uv_index > maxUV) maxUV = hour.uv_index;
            if (hour.pop != null && hour.pop > maxRain) maxRain = hour.pop;
        });
        
        console.log('📊 Found max rain from next', next24Hours.length, 'hours:', maxRain);
        
        // Display rain percentage
        // Note: Open-Meteo returns precipitation_probability as 0-100, not 0-1
        const rainPercent = maxRain; // Already a percentage (0-100)
        document.getElementById('summaryUV').querySelector('.summary-text').textContent = `UV Peak: ${Math.round(maxUV)}`;
        document.getElementById('summaryRain').querySelector('.summary-text').textContent = `Rain: ${Math.round(rainPercent)}%`;
        
        // Update recommendations based on future weather
        // Convert to 0-1 decimal for recommendations function
        updateRecommendations(maxUV, maxRain / 100);
        
        console.log('📊 Summary widget updated - UV:', maxUV, 'Rain:', rainPercent + '%');
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

// Store current location timezone
let currentLocationTimezone = 'Australia/Melbourne';

// ===== HELPER: FORMAT TIME =====
function formatTime(date) {
    // Use the location's timezone
    return date.toLocaleTimeString('en-AU', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: currentLocationTimezone
    });
}

// ===== UPDATE PRECIPITATION CHART =====
function updatePrecipitationChart(hourlyData) {
    console.log('📊 Updating temperature chart with', hourlyData.length, 'data points');
    
    // Get current time to filter future hours
    const now = Date.now();
    
    // Filter to only future hours
    const futureHours = hourlyData.filter(hour => {
        const hourTime = hour.dt * 1000;
        return hourTime > now;
    });
    
    // Take next 24 hours (or up to 8 data points if 3-hourly)
    const chartData = futureHours.slice(0, 8);
    
    // Extract data for chart labels (use location's timezone)
    const labels = chartData.map(hour => {
        const time = new Date(hour.dt * 1000);
        return time.toLocaleString('en-AU', { 
            hour: 'numeric',
            hour12: true,
            timeZone: currentLocationTimezone  // ← Use location's timezone!
        });
    });
    
    const temps = chartData.map(hour => Math.round(hour.main.temp));
    
    // Get the chart instance
    const chartCanvas = document.getElementById('precipitationChart');
    if (!chartCanvas) {
        console.error('❌ precipitationChart canvas not found');
        return;
    }
    
    // Extract rain probability
    const rainProb = chartData.map(hour => Math.round((hour.pop || 0)));
    
    // Extract UV data
    const uvData = chartData.map(hour => hour.uv_index || 0);
    
    // Check if chart already exists
    let chart = Chart.getChart('precipitationChart');
    
    if (chart) {
        // Update existing chart - all 3 datasets
        chart.data.labels = labels;
        
        // Update Rain Chance (dataset 0)
        if (chart.data.datasets[0]) {
            chart.data.datasets[0].data = rainProb;
        }
        
        // Update Temperature (dataset 1)
        if (chart.data.datasets[1]) {
            chart.data.datasets[1].data = temps;
        }
        
        // Update UV Index (dataset 2)
        if (chart.data.datasets[2]) {
            chart.data.datasets[2].data = uvData;
        }
        
        chart.update();
        console.log('✅ Chart updated - Rain, Temperature, UV');
    } else {
        // Create new chart if it doesn't exist
        console.log('⚠️ Chart not found - it should be created by script.js on initial load');
    }
}

console.log('✅ updateWeatherForLocation function loaded');
