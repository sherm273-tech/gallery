// ===== GLOBAL VARIABLES =====
const imgEl = document.getElementById("slideshow");
const startBtn = document.getElementById("startButton");
const startButtonText = document.getElementById("startButtonText");
const startFolderSelect = document.getElementById("startFolderSelect");
const randomizeCheckbox = document.getElementById("randomizeCheckbox");
const shuffleAllCheckbox = document.getElementById("shuffleAllCheckbox");
const randomizeMusicCheckbox = document.getElementById("randomizeMusicCheckbox");
const speedSelect = document.getElementById("speedSelect");
const controls = document.getElementById("controls");
const controlsTitle = document.getElementById("controlsTitle");
const musicList = document.getElementById("musicList");
const folderList = document.getElementById("folderList");
const selectAllMusicBtn = document.getElementById("selectAllMusic");
const selectNoMusicBtn = document.getElementById("selectNoMusic");
const selectAllFoldersBtn = document.getElementById("selectAllFolders");
const selectNoFoldersBtn = document.getElementById("selectNoFolders");
const audioPlayer = document.getElementById("audioPlayer");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");
const folderError = document.getElementById("folderError");
const mirrorOverlay = document.getElementById("mirrorOverlay");
const folderSearchInput = document.getElementById('folderSearch');
const musicSearchInput = document.getElementById('musicSearch');
const tabNav = document.getElementById('tabNav');
const photosTab = document.getElementById('photos-tab');

// Initial Menu
const initialMenu = document.getElementById('initialMenu');
const photoSlideshowBtn = document.getElementById('photoSlideshowBtn');
const musicOnlyBtn = document.getElementById('musicOnlyBtn');
const weatherDisplayBtn = document.getElementById('weatherDisplayBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Music Player
const musicPlayerOverlay = document.getElementById('musicPlayerOverlay');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const trackTitle = document.getElementById('trackTitle');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const playlistPosition = document.getElementById('playlistPosition');
const editPlaylistBtn = document.getElementById('editPlaylistBtn');

// Weather Display
const weatherDisplayOverlay = document.getElementById('weatherDisplayOverlay');
const closeWeatherBtn = document.getElementById('closeWeatherBtn');

let musicFiles = [];
let folderFiles = [];
let selectedMusic = [];
let currentMusicIndex = 0;
let delay = 5000;
let intervalId;
let wakeLock = null;
let keepAwakeInterval;
let imageCache = new Map();
const PRELOAD_COUNT = 20;
const MAX_CACHE_SIZE = 50;
const MIN_CACHE_SIZE = 15;
let draggedElement = null;
let isPaused = false;
let slideshowStarted = false;
let currentMode = null;
let isPlaying = false;

// Session-based tracking
let currentRequestParams = null;
let imageHistory = [];
let totalImages = 0;

// Global variable to store the chart instance
let precipitationChartInstance = null;

// ===== INITIAL MENU HANDLERS =====
photoSlideshowBtn.addEventListener('click', () => {
    currentMode = 'slideshow';
    initialMenu.classList.add('hidden');
    controls.classList.remove('hidden');
    controlsTitle.textContent = 'Photo Slideshow Setup';
    startButtonText.textContent = 'Start Slideshow';
    tabNav.style.display = 'flex';
    photosTab.classList.add('active');
});

musicOnlyBtn.addEventListener('click', () => {
    currentMode = 'music';
    initialMenu.classList.add('hidden');
    controls.classList.remove('hidden');
    controlsTitle.textContent = 'Music Player Setup';
    startButtonText.textContent = 'Start Music Player';
    tabNav.style.display = 'none';
    photosTab.classList.remove('active');
    document.getElementById('music-tab').classList.add('active');
});

weatherDisplayBtn.addEventListener('click', async () => {
    currentMode = 'weather';
    initialMenu.classList.add('hidden');
    weatherDisplayOverlay.classList.add('active');
    mirrorOverlay.classList.remove('hidden');
    
    // Immediately update weather and background
    updateCurrentWeather();
    updateForecast();
    updateWeatherSummary();
    
    await requestWakeLock();
});

backToMenuBtn.addEventListener('click', () => {
    controls.classList.add('hidden');
    initialMenu.classList.remove('hidden');
    currentMode = null;
    // Reset tabs
    tabNav.style.display = 'flex';
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    photosTab.classList.add('active');
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-button[data-tab="photos"]').classList.add('active');
});

// ===== MAGIC MIRROR FUNCTIONS =====
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clockTime').textContent = `${hours}:${minutes}`;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-AU', options);
    document.getElementById('clockDate').textContent = dateStr;
}

function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function displayWeatherAlerts(alerts) {
    const alertsContainer = document.getElementById('weatherAlerts');
    
    if (!alerts || alerts.length === 0) {
        alertsContainer.style.display = 'none';
        return;
    }
    
    alertsContainer.style.display = 'block';
    alertsContainer.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `weather-alert alert-${alert.severity}`;
        
        const icon = getAlertIcon(alert.type);
        
        alertDiv.innerHTML = `
            <span class="alert-icon">${icon}</span>
            <div class="alert-content">
                <div class="alert-type">${alert.type} ${capitalizeFirst(alert.severity)}</div>
                <div class="alert-message">${alert.message}</div>
            </div>
        `;
        
        alertsContainer.appendChild(alertDiv);
    });
}

function getAlertIcon(type) {
    const icons = {
        'UV': '☀️',
        'Wind': '💨',
        'Heat': '🌡️',
        'Cold': '❄️',
        'Thunderstorm': '⚡',
        'Rain': '🌧️',
        'Snow': '🌨️'
    };
    return icons[type] || '⚠️';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatSunTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

async function updateCurrentWeather() {
    try {
        const response = await fetch('/api/weather/current');
        const data = await response.json();
        
        if (data.error) return;
        
        document.getElementById('weatherLocation').textContent = data.name || 'Essendon';
        document.getElementById('weatherTemp').textContent = Math.round(data.main.temp) + '°';
        document.getElementById('weatherDesc').textContent = data.weather[0].description;
        document.getElementById('weatherIcon').src = getWeatherIconUrl(data.weather[0].icon);
        document.getElementById('weatherHumidity').textContent = `${data.main.humidity}%`;
        
        // Update Feels Like inline
        updateFeelsLikeInline(data.main.temp, data.main.feels_like);
        
        // Update Wind with direction
        const windSpeed = Math.round(data.wind.speed * 3.6);
        const windDeg = data.wind.deg || 0;
        const windDir = getWindDirection(windDeg);
        const windArrow = getWindArrow(windDeg);
        
        document.getElementById('windIcon').textContent = windArrow;
        document.getElementById('weatherWind').textContent = `${windDir} ${windSpeed} km/h`;
        
        // Update UV Index
        if (data.uv_index !== undefined) {
            const uvInfo = getUVInfo(data.uv_index);
            const uvElement = document.getElementById('weatherUV');
            uvElement.textContent = `UV ${Math.round(data.uv_index * 10) / 10}`;
            uvElement.style.color = uvInfo.color;
            uvElement.title = `${uvInfo.level} - ${uvInfo.description}`;
        }
        
        // Update sunrise and sunset
        if (data.sys) {
            document.getElementById('weatherSunrise').textContent = formatSunTime(data.sys.sunrise);
            document.getElementById('weatherSunset').textContent = formatSunTime(data.sys.sunset);
        }
        
        // Display weather alerts
        if (data.alerts) {
            displayWeatherAlerts(data.alerts);
        }
        
        // Update weather background
        updateWeatherBackground(data.weather[0].main);
    } catch (error) {
        console.error('Error fetching current weather:', error);
    }
}

function updateFeelsLikeInline(currentTemp, feelsLike) {
    const feelsLikeElement = document.getElementById('weatherFeelsInline');
    const diff = Math.abs(currentTemp - feelsLike);
    
    // Always show feels like temperature
    if (diff > 2) {
        // Significant difference - highlight it
        if (feelsLike > currentTemp) {
            feelsLikeElement.textContent = `Feels ${Math.round(feelsLike)}° (warmer)`;
        } else {
            feelsLikeElement.textContent = `Feels ${Math.round(feelsLike)}° (cooler)`;
        }
        feelsLikeElement.style.color = 'rgba(255, 255, 255, 0.95)';
    } else {
        // Small difference - still show but less emphasis
        feelsLikeElement.textContent = `Feels like ${Math.round(feelsLike)}°`;
        feelsLikeElement.style.color = 'rgba(255, 255, 255, 0.75)';
    }
    
    feelsLikeElement.style.display = 'block';
}

function updateWeatherBackground(weatherCondition) {
    const overlay = document.getElementById('weatherDisplayOverlay');
    
    const weatherBackgrounds = {
        'Clear': 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%), url(\'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=1920&q=80\') center/cover no-repeat',
        'Clouds': 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%), url(\'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80\') center/cover no-repeat',
        'Rain': 'linear-gradient(135deg, rgba(67, 67, 67, 0.5) 0%, rgba(0, 0, 0, 0.6) 100%), url(\'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1920&q=80\') center/cover no-repeat',
        'Drizzle': 'linear-gradient(135deg, rgba(83, 105, 118, 0.4) 0%, rgba(41, 46, 73, 0.5) 100%), url(\'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1920&q=80\') center/cover no-repeat',
        'Thunderstorm': 'linear-gradient(135deg, rgba(20, 30, 48, 0.6) 0%, rgba(36, 59, 85, 0.6) 100%), url(\'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1920&q=80\') center/cover no-repeat',
        'Snow': 'linear-gradient(135deg, rgba(224, 234, 252, 0.3) 0%, rgba(207, 222, 243, 0.3) 100%), url(\'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1920&q=80\') center/cover no-repeat',
        'Fog': 'linear-gradient(135deg, rgba(189, 195, 199, 0.4) 0%, rgba(44, 62, 80, 0.5) 100%), url(\'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1920&q=80\') center/cover no-repeat'
    };
    
    const background = weatherBackgrounds[weatherCondition] || 'linear-gradient(135deg, rgba(10, 10, 10, 0.7) 0%, rgba(26, 26, 42, 0.85) 100%), url(\'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80\') center/cover no-repeat';
    overlay.style.background = background;
}

// Create precipitation chart - UPDATED: NO BLUE BARS, KEEP 3 LINES
function createPrecipitationChart(forecastData) {
    const ctx = document.getElementById('precipitationChart');
    
    if (!ctx || !forecastData || forecastData.length === 0) {
        return;
    }
    
    const now = new Date();
    
    const futureForecasts = forecastData.filter(item => {
        const forecastTime = new Date(item.dt * 1000);
        return forecastTime >= now;
    });
    
    const next24Hours = futureForecasts.slice(0, 24);
    
    if (next24Hours.length === 0) {
        console.warn('No future forecast data available');
        return;
    }
    
    const labels = next24Hours.map((item, index) => {
        const date = new Date(item.dt * 1000);
        const timeDiff = Math.abs(date - now);
        if (index === 0 && timeDiff < 30 * 60 * 1000) {
            return 'Now';
        }
        return date.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
    });
    
    const precipProbability = next24Hours.map(item => {
        if (item.pop !== undefined && item.pop !== null) {
            return item.pop <= 1 ? item.pop * 100 : item.pop;
        }
        return 0;
    });
    
    const temperatures = next24Hours.map(item => {
        return item.main ? item.main.temp : 0;
    });
    
    const uvIndex = next24Hours.map(item => {
        return item.uv_index || 0;
    });
    
    if (window.precipitationChartInstance) {
        window.precipitationChartInstance.destroy();
    }
    
    window.precipitationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                // REMOVED: Blue Precipitation bars
                {
                    label: 'Rain Chance (%)',
                    data: precipProbability,
                    type: 'line',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(255, 193, 7, 1)',
                    yAxisID: 'yPercent',
                    order: 2
                },
                {
                    label: 'Temperature (°C)',
                    data: temperatures,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 71, 1)',
                    backgroundColor: 'rgba(255, 99, 71, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgba(255, 99, 71, 1)',
                    yAxisID: 'yTemp',
                    order: 1
                },
                {
                    label: 'UV Index',
                    data: uvIndex,
                    type: 'line',
                    borderColor: 'rgba(138, 43, 226, 1)',
                    backgroundColor: 'rgba(138, 43, 226, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(138, 43, 226, 1)',
                    yAxisID: 'yUV',
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: { size: 11 },
                        padding: 10,
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(74, 158, 255, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                if (label.includes('Chance') || label.includes('%')) {
                                    label += context.parsed.y.toFixed(0) + '%';
                                } else if (label.includes('Temperature')) {
                                    label += context.parsed.y.toFixed(1) + '°C';
                                } else if (label.includes('UV')) {
                                    label += context.parsed.y.toFixed(1);
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#ffffff',
                        font: { size: 9 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                // REMOVED: yPrecip axis (blue bars)
                yTemp: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temp (°C)',
                        color: '#ff6347',
                        font: { size: 10, weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#ffffff',
                        font: { size: 10 }
                    },
                    // Force reasonable temperature range
                    suggestedMin: 0,
                    suggestedMax: 40
                },
                yPercent: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Rain %',
                        color: '#ffc107',
                        font: { size: 10, weight: 'bold' }
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#ffffff',
                        font: { size: 10 }
                    }
                },
                yUV: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'UV',
                        color: '#8a2be2',
                        font: { size: 10, weight: 'bold' }
                    },
                    min: 0,
                    max: 12,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#ffffff',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

async function updateForecast() {
    try {
        const response = await fetch('/api/weather/forecast');
        const data = await response.json();
        
        if (data.error) return;
        
        const hourlyForecasts = processHourlyForecast(data.list);
        displayHourlyForecast(hourlyForecasts);
        
        if (data.daily && data.daily.length > 0) {
            const container = document.getElementById('weeklyForecast');
            container.innerHTML = '';
            
            data.daily.slice(0, 5).forEach((day, index) => {
                const item = document.createElement('div');
                item.className = 'weekly-item';
                
                const date = new Date(day.dt * 1000);
                const dayStr = index === 0 ? 'Today' : date.toLocaleDateString('en-AU', { weekday: 'short' });
                
                item.innerHTML = `
                    <span class="weekly-day">${dayStr}</span>
                    <img class="weekly-icon" src="${getWeatherIconUrl(day.weather[0].icon)}" alt="${day.weather[0].description}">
                    <span class="weekly-desc">${day.weather[0].description}</span>
                    <div class="weekly-temps">
                        <div class="temp-high-group">
                            <span class="temp-label">High</span>
                            <span class="temp-high">${Math.round(day.temp.max)}°</span>
                        </div>
                        <div class="temp-low-group">
                            <span class="temp-label">Low</span>
                            <span class="temp-low">${Math.round(day.temp.min)}°</span>
                        </div>
                    </div>
                `;
                
                container.appendChild(item);
            });
        } else {
            const weeklyForecasts = processWeeklyForecast(data.list);
            displayWeeklyForecast(weeklyForecasts);
        }
        
        createPrecipitationChart(data.list);
        
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

// ===== WEATHER SUMMARY WIDGET =====
async function updateWeatherSummary() {
    try {
        const response = await fetch('/api/weather/forecast');
        const data = await response.json();
        
        if (data.error || !data.daily || data.daily.length === 0) {
            return;
        }
        
        const today = data.daily[0];
        const hourlyData = data.list || [];
        
        // Update High/Low temps
        const highTemp = Math.round(today.temp.max);
        const lowTemp = Math.round(today.temp.min);
        document.getElementById('summaryHigh').textContent = `${highTemp}°`;
        document.getElementById('summaryLow').textContent = `${lowTemp}°`;
        
        // Find UV peak and time
        const uvPeakData = findUVPeak(hourlyData);
        const uvElement = document.getElementById('summaryUV');
        if (uvPeakData.peak > 0) {
            uvElement.innerHTML = `
                <span class="summary-icon">☀️</span>
                <span class="summary-text">UV Peak: ${uvPeakData.peak.toFixed(1)} at ${uvPeakData.time}</span>
            `;
        } else {
            uvElement.innerHTML = `
                <span class="summary-icon">🌙</span>
                <span class="summary-text">No UV (nighttime)</span>
            `;
        }
        
        // Find rain probability and time
        const rainData = findMaxRain(hourlyData);
        const rainElement = document.getElementById('summaryRain');
        if (rainData.probability > 20) {
            rainElement.innerHTML = `
                <span class="summary-icon">🌧️</span>
                <span class="summary-text">Rain: ${rainData.probability}% at ${rainData.time}</span>
            `;
        } else {
            rainElement.innerHTML = `
                <span class="summary-icon">☀️</span>
                <span class="summary-text">No rain expected</span>
            `;
        }
        
        // Generate smart recommendations
        const recommendations = generateRecommendations(highTemp, lowTemp, uvPeakData, rainData);
        displayRecommendations(recommendations);
        
    } catch (error) {
        console.error('Error updating weather summary:', error);
    }
}

// Find UV peak time
function findUVPeak(hourlyData) {
    const now = new Date();
    const futureHours = hourlyData.filter(item => {
        const time = new Date(item.dt * 1000);
        return time >= now && time.getHours() >= 6 && time.getHours() <= 18;
    }).slice(0, 12);
    
    if (futureHours.length === 0) {
        return { peak: 0, time: '--' };
    }
    
    let maxUV = 0;
    let maxTime = '';
    
    futureHours.forEach(item => {
        const uv = item.uv_index || 0;
        if (uv > maxUV) {
            maxUV = uv;
            const time = new Date(item.dt * 1000);
            maxTime = time.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
        }
    });
    
    return { peak: maxUV, time: maxTime };
}

// Find maximum rain probability
function findMaxRain(hourlyData) {
    const now = new Date();
    const futureHours = hourlyData.filter(item => {
        const time = new Date(item.dt * 1000);
        return time >= now;
    }).slice(0, 12);
    
    if (futureHours.length === 0) {
        return { probability: 0, time: '--' };
    }
    
    let maxRain = 0;
    let maxTime = '';
    
    futureHours.forEach(item => {
        let rain = item.pop || 0;
        if (rain <= 1) rain = rain * 100;
        
        if (rain > maxRain) {
            maxRain = rain;
            const time = new Date(item.dt * 1000);
            maxTime = time.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
        }
    });
    
    return { probability: Math.round(maxRain), time: maxTime };
}

// Generate smart recommendations based on weather data
function generateRecommendations(highTemp, lowTemp, uvData, rainData) {
    const recommendations = [];
    const tempDiff = highTemp - lowTemp;
    
    // Temperature recommendations
    if (tempDiff > 12) {
        recommendations.push({
            icon: '🧥',
            text: `Cool morning (${lowTemp}°), warm afternoon (${highTemp}°) - Layer up!`
        });
    } else if (highTemp >= 30) {
        recommendations.push({
            icon: '🥵',
            text: 'Very hot day - Stay hydrated and avoid midday sun'
        });
    } else if (highTemp <= 15) {
        recommendations.push({
            icon: '🧥',
            text: 'Cold day - Dress warmly'
        });
    } else if (highTemp >= 20 && highTemp <= 25) {
        recommendations.push({
            icon: '😊',
            text: 'Perfect temperature for outdoor activities'
        });
    }
    
    // UV recommendations
    if (uvData.peak >= 8) {
        recommendations.push({
            icon: '☀️',
            text: `Very High UV at ${uvData.time} - Wear sunscreen & hat`
        });
    } else if (uvData.peak >= 6) {
        recommendations.push({
            icon: '🕶️',
            text: `High UV at ${uvData.time} - Sun protection recommended`
        });
    } else if (uvData.peak >= 3) {
        recommendations.push({
            icon: '☀️',
            text: 'Moderate UV - Light sun protection advised'
        });
    }
    
    // Rain recommendations
    if (rainData.probability >= 70) {
        recommendations.push({
            icon: '☂️',
            text: `${rainData.probability}% rain at ${rainData.time} - Bring umbrella`
        });
    } else if (rainData.probability >= 40) {
        recommendations.push({
            icon: '🌂',
            text: `${rainData.probability}% rain at ${rainData.time} - May need umbrella`
        });
    } else if (rainData.probability < 20) {
        recommendations.push({
            icon: '☀️',
            text: 'No rain expected - Great day to be outside!'
        });
    }
    
    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour < 9 && tempDiff > 10) {
        recommendations.push({
            icon: '🌅',
            text: 'Chilly morning - Warm up gradually'
        });
    } else if (hour >= 18 && lowTemp < 15) {
        recommendations.push({
            icon: '🌙',
            text: 'Cold evening ahead - Bring a jacket'
        });
    }
    
    // Default if no specific recommendations
    if (recommendations.length === 0) {
        recommendations.push({
            icon: '🌤️',
            text: 'Pleasant weather expected today'
        });
    }
    
    return recommendations.slice(0, 3);
}

// Display recommendations in the widget
function displayRecommendations(recommendations) {
    const container = document.getElementById('summaryRecommendations');
    container.innerHTML = '';
    
    recommendations.forEach(rec => {
        const div = document.createElement('div');
        div.className = 'summary-recommendation';
        div.innerHTML = `${rec.icon} ${rec.text}`;
        container.appendChild(div);
    });
}

// Helper function to convert wind direction degrees to compass direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Helper function to get wind direction arrow
function getWindArrow(degrees) {
    const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    const index = Math.round(((degrees + 180) % 360) / 45) % 8;
    return arrows[index];
}

function processHourlyForecast(forecastList) {
    const now = new Date();
    
    const futureForecasts = forecastList.filter(item => {
        const forecastTime = new Date(item.dt * 1000);
        return forecastTime >= now;
    });
    
    return futureForecasts.slice(0, 8).map(item => ({
        time: new Date(item.dt * 1000),
        temp: Math.round(item.main.temp),
        weather: item.weather[0],
        uv_index: item.uv_index !== undefined ? item.uv_index : 0
    }));
}

function processWeeklyForecast(forecastList) {    
    const dailyData = {};
    
    forecastList.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().split('T')[0];
        const hour = date.getHours();
        
        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                date: date,
                temps: [],
                weatherItems: [],
                middayWeather: null
            };
        }
        
        dailyData[dayKey].temps.push(item.main.temp);
        dailyData[dayKey].weatherItems.push(item.weather[0]);
        
        if (hour >= 11 && hour <= 13 && !dailyData[dayKey].middayWeather) {
            dailyData[dayKey].middayWeather = item.weather[0];
        }
    });
    
    const weeklyForecasts = Object.values(dailyData).map(day => ({
        date: day.date,
        tempHigh: Math.round(Math.max(...day.temps)),
        tempLow: Math.round(Math.min(...day.temps)),
        weather: day.middayWeather || day.weatherItems[Math.floor(day.weatherItems.length / 2)] || day.weatherItems[0]
    }));
    
    return weeklyForecasts.slice(0, 5);
}

function displayHourlyForecast(forecasts) {
    const container = document.getElementById('hourlyForecast');
    container.innerHTML = '';
    
    const now = new Date();
    
    if (forecasts.length === 0) {
        container.innerHTML = '<p style="color: red;">No forecast data available</p>';
        return;
    }
    
    forecasts.forEach((forecast) => {
        const item = document.createElement('div');
        item.className = 'hourly-item';
        
        const timeDiff = Math.abs(forecast.time - now);
        const isNow = timeDiff < 30 * 60 * 1000;
        
        const timeStr = isNow ? 'Now' : forecast.time.toLocaleTimeString('en-AU', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        const uvValue = forecast.uv_index || 0;
        const uvInfo = getUVInfo(uvValue);
        
        item.innerHTML = `
            <span class="hourly-time">${timeStr}</span>
            <img class="forecast-icon-small" src="${getWeatherIconUrl(forecast.weather.icon)}" alt="${forecast.weather.description}">
            <span class="forecast-desc">${forecast.weather.description}</span>
            <span class="hourly-temp">${forecast.temp}°</span>
            <span class="hourly-uv" style="color: ${uvInfo.color};" title="${uvInfo.level} - ${uvInfo.description}">
                ☀️ ${Math.round(uvValue * 10) / 10}
            </span>
        `;
        
        container.appendChild(item);
    });
}

function displayWeeklyForecast(forecasts) {
    const container = document.getElementById('weeklyForecast');
    container.innerHTML = '';
    
    forecasts.forEach((forecast, index) => {
        const item = document.createElement('div');
        item.className = 'weekly-item';
        
        const dayStr = index === 0 ? 'Today' : forecast.date.toLocaleDateString('en-AU', { weekday: 'short' });
        
        item.innerHTML = `
            <span class="weekly-day">${dayStr}</span>
            <img class="weekly-icon" src="${getWeatherIconUrl(forecast.weather.icon)}" alt="${forecast.weather.description}">
            <span class="weekly-desc">${forecast.weather.description}</span>
            <div class="weekly-temps">
                <div class="temp-high-group">
                    <span class="temp-label">High</span>
                    <span class="temp-high">${forecast.tempHigh}°</span>
                </div>
                <div class="temp-low-group">
                    <span class="temp-label">Low</span>
                    <span class="temp-low">${forecast.tempLow}°</span>
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// ===== WEATHER DISPLAY HANDLERS =====
closeWeatherBtn.addEventListener('click', () => {
    weatherDisplayOverlay.classList.remove('active');
    mirrorOverlay.classList.add('hidden');
    initialMenu.classList.remove('hidden');
    
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
});

// ===== MUSIC PLAYER FUNCTIONS =====
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updatePlayerUI() {
    if (selectedMusic.length === 0) return;
    
    const currentTrack = selectedMusic[currentMusicIndex];
    trackTitle.textContent = currentTrack;
    playlistPosition.textContent = `Track ${currentMusicIndex + 1} of ${selectedMusic.length}`;
    
    if (isPlaying) {
        playPauseBtn.textContent = '⏸';
    } else {
        playPauseBtn.textContent = '▶';
    }
}

audioPlayer.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('timeupdate', () => {
    currentTime.textContent = formatTime(audioPlayer.currentTime);
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = progress + '%';
});

audioPlayer.addEventListener('ended', () => {
    if (currentMode === 'music') {
        nextTrack();
    } else {
        currentMusicIndex = (currentMusicIndex + 1) % selectedMusic.length;
        playCurrentTrack();
    }
});

progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
});

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audioPlayer.volume = volume;
    volumeValue.textContent = e.target.value + '%';
});

playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
    updatePlayerUI();
});

prevBtn.addEventListener('click', () => {
    prevTrack();
});

nextBtn.addEventListener('click', () => {
    nextTrack();
});

function prevTrack() {
    if (selectedMusic.length === 0) return;
    currentMusicIndex = (currentMusicIndex - 1 + selectedMusic.length) % selectedMusic.length;
    playCurrentTrack();
    updatePlayerUI();
}

function nextTrack() {
    if (selectedMusic.length === 0) return;
    currentMusicIndex = (currentMusicIndex + 1) % selectedMusic.length;
    playCurrentTrack();
    updatePlayerUI();
}

closePlayerBtn.addEventListener('click', () => {
    musicPlayerOverlay.classList.remove('active');
    audioPlayer.pause();
    isPlaying = false;
    
    if (currentMode === 'music') {
        initialMenu.classList.remove('hidden');
    }
});

editPlaylistBtn.addEventListener('click', () => {
    musicPlayerOverlay.classList.remove('active');
    controls.classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="music"]').click();
});

// ===== SLIDESHOW FUNCTIONS =====
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(targetTab + '-tab').classList.add('active');
    });
});

shuffleAllCheckbox.addEventListener('change', function() {
    if (this.checked) {
        folderList.style.opacity = '0.5';
        folderList.style.pointerEvents = 'none';
        startFolderSelect.disabled = true;
        randomizeCheckbox.disabled = true;
        startFolderSelect.style.opacity = '0.5';
        folderError.classList.remove('show');
        startBtn.disabled = false;
    } else {
        folderList.style.opacity = '1';
        folderList.style.pointerEvents = 'auto';
        startFolderSelect.disabled = false;
        randomizeCheckbox.disabled = false;
        startFolderSelect.style.opacity = '1';
        validateFolderSelection();
    }
});

function validateFolderSelection() {
    if (currentMode === 'music') {
        startBtn.disabled = false;
        return true;
    }
    
    if (shuffleAllCheckbox.checked) {
        startBtn.disabled = false;
        folderError.classList.remove('show');
        return true;
    }
    
    const selectedFolders = getSelectedFolders();
    if (selectedFolders.length === 0) {
        startBtn.disabled = true;
        folderError.classList.add('show');
        return false;
    } else {
        startBtn.disabled = false;
        folderError.classList.remove('show');
        return true;
    }
}

async function loadFolders() {
    try {
        const response = await fetch("/api/folders/list");
        folderFiles = await response.json();
        
        folderList.innerHTML = '';
        startFolderSelect.innerHTML = '<option value="">None (use folder order above)</option>';
        
        if (folderFiles.length === 0) {
            folderList.innerHTML = '<p style="color: #aaa;">No folders found</p>';
            return;
        }
        
        folderFiles.forEach((folder, idx) => {
            createFolderItem(folder, idx);
            const option = document.createElement("option");
            option.value = folder;
            option.textContent = folder;
            startFolderSelect.appendChild(option);
        });
        
        validateFolderSelection();
    } catch (err) {
        console.error("Error loading folders:", err);
    }
}

if (folderSearchInput) {
    folderSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const folderItems = folderList.querySelectorAll('.folder-item');
        
        folderItems.forEach(item => {
            const label = item.querySelector('label');
            const folderName = label ? label.textContent.toLowerCase() : '';
            
            if (folderName.includes(searchTerm)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });
}

function createFolderItem(folder, idx) {
    const div = document.createElement("div");
    div.className = "folder-item";
    div.draggable = true;
    div.dataset.folder = folder;
    
    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `folder-${idx}`;
    checkbox.value = folder;
    checkbox.checked = true;
    checkbox.addEventListener('change', validateFolderSelection);
    
    const label = document.createElement("label");
    label.htmlFor = `folder-${idx}`;
    label.textContent = folder;
    
    div.appendChild(dragHandle);
    div.appendChild(checkbox);
    div.appendChild(label);
    
    div.addEventListener('dragstart', handleFolderDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleFolderDrop);
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('dragenter', handleDragEnter);
    div.addEventListener('dragleave', handleDragLeave);
    
    folderList.appendChild(div);
}

function getSelectedFolders() {
    const items = folderList.querySelectorAll('.folder-item');
    const selected = [];
    
    items.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked && !item.classList.contains('hidden')) {
            selected.push(checkbox.value);
        }
    });
    
    return selected;
}

selectAllFoldersBtn.addEventListener('click', () => {
    const checkboxes = folderList.querySelectorAll('.folder-item:not(.hidden) input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    validateFolderSelection();
});

selectNoFoldersBtn.addEventListener('click', () => {
    const checkboxes = folderList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    validateFolderSelection();
});

async function loadMusicFiles() {
    try {
        const response = await fetch("/api/music/list");
        musicFiles = await response.json();
        
        musicList.innerHTML = '';
        
        if (musicFiles.length === 0) {
            musicList.innerHTML = '<p style="color: #aaa;">No music files found</p>';
            return;
        }
        
        musicFiles.forEach((file, idx) => {
            createMusicItem(file, idx);
        });
    } catch (err) {
        console.error("Error loading music:", err);
        musicList.innerHTML = '<p style="color: #aaa;">Error loading music files</p>';
    }
}

if (musicSearchInput) {
    musicSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const musicItems = musicList.querySelectorAll('.music-item');
        
        musicItems.forEach(item => {
            const label = item.querySelector('label');
            const musicName = label ? label.textContent.toLowerCase() : '';
            
            if (musicName.includes(searchTerm)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    });
}

function createMusicItem(file, idx) {
    const div = document.createElement("div");
    div.className = "music-item";
    div.draggable = true;
    div.dataset.file = file;
    
    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "⋮⋮";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `music-${idx}`;
    checkbox.value = file;
    
    const label = document.createElement("label");
    label.htmlFor = `music-${idx}`;
    label.textContent = file;
    
    div.appendChild(dragHandle);
    div.appendChild(checkbox);
    div.appendChild(label);
    
    div.addEventListener('dragstart', handleMusicDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleMusicDrop);
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('dragenter', handleDragEnter);
    div.addEventListener('dragleave', handleDragLeave);
    
    musicList.appendChild(div);
}

function handleFolderDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleFolderDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    
    if (draggedElement !== this) {
        const allItems = [...folderList.querySelectorAll('.folder-item')];
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

function handleMusicDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleMusicDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    
    if (draggedElement !== this) {
        const allItems = [...musicList.querySelectorAll('.music-item')];
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    const items = this.parentNode.querySelectorAll('.music-item, .folder-item');
    items.forEach(item => item.classList.remove('drag-over'));
}

selectAllMusicBtn.addEventListener('click', () => {
    const checkboxes = musicList.querySelectorAll('.music-item:not(.hidden) input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
});

selectNoMusicBtn.addEventListener('click', () => {
    const checkboxes = musicList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
});

function getSelectedMusic() {
    const items = musicList.querySelectorAll('.music-item');
    const selected = [];
    
    items.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked && !item.classList.contains('hidden')) {
            selected.push(checkbox.value);
        }
    });
    
    if (randomizeMusicCheckbox.checked && selected.length > 0) {
        for (let i = selected.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selected[i], selected[j]] = [selected[j], selected[i]];
        }
    }
    
    return selected;
}

function playMusic() {
    selectedMusic = getSelectedMusic();
    
    if (selectedMusic.length === 0) {
        return;
    }
    
    currentMusicIndex = 0;
    playCurrentTrack();
}

function playCurrentTrack() {
    if (selectedMusic.length === 0) return;
    
    const track = selectedMusic[currentMusicIndex];
    audioPlayer.src = '/music/' + track;
    audioPlayer.load();
    audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayerUI();
    }).catch(err => console.error('Audio play error:', err));
}

function stopSlideshow() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    
    if (!audioPlayer.paused) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        isPlaying = false;
    }
    
    isPaused = false;
    slideshowStarted = false;
    
    if (wakeLock) {
        wakeLock.release().then(() => {
            wakeLock = null;
        });
    }
    
    if (keepAwakeInterval) {
        clearInterval(keepAwakeInterval);
        keepAwakeInterval = null;
    }
}

function togglePause() {
    if (!slideshowStarted) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        clearInterval(intervalId);
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            isPlaying = false;
        }
    } else {
        intervalId = setInterval(nextImage, delay);
        if (selectedMusic.length > 0) {
            audioPlayer.play().then(() => {
                isPlaying = true;
            }).catch(err => console.error('Audio resume error:', err));
        }
    }
}

document.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field - if so, don't interfere
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.isContentEditable
    );
    
    // Allow typing in input fields without triggering shortcuts (except Escape)
    if (isTyping && e.key !== 'Escape') {
        return;
    }
    
    if (currentMode === 'weather') {
        const weatherOverlay = document.getElementById('weatherDisplayOverlay');
        const scrollAmount = 100;
        
        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                closeWeatherBtn.click();
                break;
            case 'ArrowDown':
                e.preventDefault();
                weatherOverlay.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                break;
            case 'ArrowUp':
                e.preventDefault();
                weatherOverlay.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
                break;
            case 'PageDown':
                e.preventDefault();
                weatherOverlay.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                break;
            case 'PageUp':
                e.preventDefault();
                weatherOverlay.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                break;
        }
        return;
    }
    
    if (!slideshowStarted && currentMode !== 'music') return;
    
    switch(e.key) {
        case 'Escape':
            e.preventDefault();
            if (currentMode === 'slideshow') {
                stopSlideshow();
                controls.classList.remove('hidden');
                document.body.classList.remove('slideshow-active');
                slideshowStarted = false;
            } else if (currentMode === 'music') {
                closeMusicPlayer();
            }
            break;
        case ' ':
        case 'p':
        case 'P':
            e.preventDefault();
            if (currentMode === 'music') {
                playPauseBtn.click();
            } else {
                togglePause();
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentMode === 'music') {
                nextTrack();
            } else if (isPaused) {
                nextImage();
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (currentMode === 'music') {
                prevTrack();
            } else if (isPaused) {
                previousImage();
            }
            break;
    }
});

function previousImage() {
    if (imageHistory.length > 1) {
        imageHistory.pop();
        const prevImage = imageHistory[imageHistory.length - 1];
        showImageByPath(prevImage);
    }
}

async function initializeSlideshow() {
    currentRequestParams = {
        startFolder: startFolderSelect.value || null,
        randomize: randomizeCheckbox.checked,
        shuffleAll: shuffleAllCheckbox.checked,
        selectedFolders: shuffleAllCheckbox.checked ? [] : getSelectedFolders()
    };
    
    const response = await fetch('/api/images/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRequestParams)
    });
    
    const initialImages = await response.json();
    totalImages = initialImages.length;
    
    for (let i = 0; i < Math.min(PRELOAD_COUNT, initialImages.length); i++) {
        preloadImage(initialImages[i]);
    }
}

function preloadImage(imagePath) {
    const url = "/images/" + imagePath;
    
    if (imageCache.has(url)) return;
    
    const img = new Image();
    img.onload = () => console.log('Preloaded:', imagePath);
    img.onerror = () => console.error('Failed to preload:', imagePath);
    img.src = url;
    imageCache.set(url, img);
}

function showImageByPath(imagePath) {
    const url = "/images/" + imagePath;
    
    if (imageCache.has(url)) {
        imgEl.src = imageCache.get(url).src;
    } else {
        imgEl.src = url;
        preloadImage(imagePath);
    }
}

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

function showImageByPathAsync(imagePath) {
    return new Promise((resolve, reject) => {
        const url = "/images/" + imagePath;
        
        imgEl.classList.remove('loaded');
        
        if (imageCache.has(url)) {
            const cachedImg = imageCache.get(url);
            imgEl.src = cachedImg.src;
            
            setTimeout(() => {
                imgEl.classList.add('loaded');
            }, 50);
            
            resolve();
        } else {
            const img = new Image();
            
            img.onload = () => {
                imgEl.src = img.src;
                imageCache.set(url, img);
                
                setTimeout(() => {
                    imgEl.classList.add('loaded');
                }, 50);
                
                resolve();
            };
            
            img.onerror = () => {
                imgEl.src = url;
                imgEl.classList.add('loaded');
                reject(new Error('Failed to load image: ' + imagePath));
            };
            
            img.src = url;
        }
    });
}

async function nextImage() {
    try {
        const response = await fetch('/api/images/next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentRequestParams)
        });
        
        const data = await response.json();
        
        if (data.cycleComplete) {
            imageHistory = [];
        }
        
        if (data.image) {
            imageHistory.push(data.image);
            await showImageByPathAsync(data.image);
            preloadNextImages(data.totalShown, data.totalImages);
        }
        
        if (imageCache.size > MAX_CACHE_SIZE) {
            const keysToDelete = [];
            let count = 0;
            for (const key of imageCache.keys()) {
                if (count++ < imageCache.size - MIN_CACHE_SIZE) {
                    keysToDelete.push(key);
                } else {
                    break;
                }
            }
            keysToDelete.forEach(key => imageCache.delete(key));
        }
    } catch (err) {
        console.error('Error fetching next image:', err);
    }
}

async function preloadNextImages(currentIndex, totalImages) {
    if (imageCache.size >= MIN_CACHE_SIZE) return;
    
    try {
        const response = await fetch('/api/images/peek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...currentRequestParams,
                count: 10
            })
        });
        
        if (response.ok) {
            const upcomingImages = await response.json();
            upcomingImages.forEach(imagePath => preloadImage(imagePath));
        }
    } catch (err) {
        console.log('Background preload skipped:', err.message);
    }
}

async function requestFullscreen() {
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
        }
    } catch (err) {
        console.log('Fullscreen error:', err);
    }
}

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('Wake Lock error:', err);
    }
}

function simulateActivity() {
    const event = new MouseEvent('mousemove', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: 1,
        clientY: 1
    });
    document.dispatchEvent(event);
}

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

startBtn.addEventListener("click", async () => {
    if (currentMode === 'slideshow') {
        if (!validateFolderSelection()) return;
        
        delay = parseInt(speedSelect.value);
        
        mirrorOverlay.classList.add("hidden");
        controls.classList.add("hidden");
        loadingOverlay.classList.add("active");
        document.body.classList.add("slideshow-active");
        document.body.style.cursor = "none";
        
        await requestFullscreen();
        await requestWakeLock();
        
        keepAwakeInterval = setInterval(simulateActivity, 30000);
        
        playMusic();
        await initializeSlideshow();
        
        let preloadedCount = 0;
        const checkInterval = setInterval(() => {
            preloadedCount = imageCache.size;
            loadingText.textContent = `Preloading images... (${preloadedCount}/${Math.min(PRELOAD_COUNT, totalImages)})`;
            
            if (preloadedCount >= Math.min(PRELOAD_COUNT, totalImages) || preloadedCount >= totalImages) {
                clearInterval(checkInterval);
                loadingOverlay.classList.remove("active");
                
                if (totalImages > 0) {
                    slideshowStarted = true;
                    imageHistory = [];
                    
                    nextImage().then(() => {
                        intervalId = setInterval(nextImage, delay);
                    });
                }
            }
        }, 100);
        
    } else if (currentMode === 'music') {
        selectedMusic = getSelectedMusic();
        
        if (selectedMusic.length === 0) {
            alert('Please select at least one music track');
            return;
        }
        
        controls.classList.add("hidden");
        mirrorOverlay.classList.add("hidden");
        musicPlayerOverlay.classList.add("active");
        
        currentMusicIndex = 0;
        playCurrentTrack();
        updatePlayerUI();
        
        await requestWakeLock();
    }
});

window.addEventListener('beforeunload', () => {
    if (wakeLock !== null) wakeLock.release();
    if (keepAwakeInterval) clearInterval(keepAwakeInterval);
    document.body.style.cursor = "default";
});

// ===== INITIALIZATION =====
loadFolders();
loadMusicFiles();

updateClock();
updateCurrentWeather();
updateForecast();

setInterval(updateClock, 1000);
setInterval(updateCurrentWeather, 600000);
setInterval(updateForecast, 1800000);
