// ===== SLIDESHOW VARIABLES =====
const imgEl = document.getElementById("slideshow");
const startBtn = document.getElementById("startButton");
const startFolderSelect = document.getElementById("startFolderSelect");
const randomizeCheckbox = document.getElementById("randomizeCheckbox");
const shuffleAllCheckbox = document.getElementById("shuffleAllCheckbox");
const randomizeMusicCheckbox = document.getElementById("randomizeMusicCheckbox");
const speedSelect = document.getElementById("speedSelect");
const controls = document.getElementById("controls");
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

let images = [];
let musicFiles = [];
let folderFiles = [];
let selectedMusic = [];
let currentMusicIndex = 0;
let index = 0;
let delay = 5000;
let intervalId;
let wakeLock = null;
let keepAwakeInterval;
let imageCache = new Map();
const PRELOAD_COUNT = 5;
let draggedElement = null;
let isPaused = false;
let slideshowStarted = false;
let mirrorVisible = true;

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

const compliments = {
    morning: ["Good morning!", "Enjoy your day!", "Have a great day!", "You look great today!"],
    afternoon: ["Good afternoon!", "Looking good!", "You're doing great!", "Enjoy your afternoon!"],
    evening: ["Good evening!", "Have a lovely evening!", "You did great today!", "Time to relax!"]
};

function updateCompliment() {
    const hour = new Date().getHours();
    let timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const complimentArray = compliments[timeOfDay];
    const randomCompliment = complimentArray[Math.floor(Math.random() * complimentArray.length)];
    document.getElementById('compliment').textContent = randomCompliment;
}

function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
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
        document.getElementById('weatherWind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        document.getElementById('weatherFeels').textContent = `${Math.round(data.main.feels_like)}°`;
    } catch (error) {
        console.error('Error fetching current weather:', error);
    }
}

async function updateForecast() {
    try {
        const response = await fetch('/api/weather/forecast');
        const data = await response.json();
        
        if (data.error) return;
        
        const dailyForecasts = processDailyForecast(data.list);
        displayDailyForecast(dailyForecasts);
        
        const hourlyForecasts = processHourlyForecast(data.list);
        displayHourlyForecast(hourlyForecasts);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

function processDailyForecast(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toLocaleDateString('en-AU');
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = { date: date, temps: [], weather: item.weather[0], items: [] };
        }
        
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].items.push(item);
    });
    
    return Object.values(dailyData).slice(0, 5).map(day => ({
        date: day.date,
        high: Math.round(Math.max(...day.temps)),
        low: Math.round(Math.min(...day.temps)),
        weather: day.items[Math.floor(day.items.length / 2)].weather[0]
    }));
}

function displayDailyForecast(forecasts) {
    const container = document.getElementById('dailyForecast');
    container.innerHTML = '';
    
    forecasts.forEach((forecast, index) => {
        const item = document.createElement('div');
        item.className = 'forecast-item';
        
        const dayName = index === 0 ? 'Today' : forecast.date.toLocaleDateString('en-AU', { weekday: 'short' });
        
        item.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <img class="forecast-icon-small" src="${getWeatherIconUrl(forecast.weather.icon)}" alt="${forecast.weather.description}">
            <span class="forecast-desc">${forecast.weather.description}</span>
            <div class="forecast-temps">
                <span class="forecast-high">${forecast.high}°</span>
                <span class="forecast-low">${forecast.low}°</span>
            </div>
        `;
        
        container.appendChild(item);
    });
}

function processHourlyForecast(forecastList) {
    return forecastList.slice(0, 8).map(item => ({
        time: new Date(item.dt * 1000),
        temp: Math.round(item.main.temp),
        weather: item.weather[0]
    }));
}

function displayHourlyForecast(forecasts) {
    const container = document.getElementById('hourlyForecast');
    container.innerHTML = '';
    
    forecasts.forEach((forecast, index) => {
        const item = document.createElement('div');
        item.className = 'hourly-item';
        
        const timeStr = index === 0 ? 'Now' : forecast.time.toLocaleTimeString('en-AU', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        item.innerHTML = `
            <span class="hourly-time">${timeStr}</span>
            <img class="forecast-icon-small" src="${getWeatherIconUrl(forecast.weather.icon)}" alt="${forecast.weather.description}">
            <span class="forecast-desc">${forecast.weather.description}</span>
            <span class="hourly-temp">${forecast.temp}°</span>
        `;
        
        container.appendChild(item);
    });
}

function toggleMirror() {
    mirrorVisible = !mirrorVisible;
    mirrorOverlay.classList.toggle('hidden');
}

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
        if (checkbox && checkbox.checked) {
            selected.push(checkbox.value);
        }
    });
    
    return selected;
}

selectAllFoldersBtn.addEventListener('click', () => {
    const checkboxes = folderList.querySelectorAll('input[type="checkbox"]');
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
    e.dataTransfer.setData('text/html', this.innerHTML);
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
    e.dataTransfer.setData('text/html', this.innerHTML);
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
    const checkboxes = musicList.querySelectorAll('input[type="checkbox"]');
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
        if (checkbox && checkbox.checked) {
            selected.push(checkbox.value);
        }
    });
    
    if (randomizeMusicCheckbox.checked && selected.length > 0) {
        for (let i = selected.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selected[i], selected[j]] = [selected[j], selected[i]];
        }
        console.log('Music randomized');
    }
    
    return selected;
}

function playMusic() {
    selectedMusic = getSelectedMusic();
    
    if (selectedMusic.length === 0) {
        console.log('No music selected');
        return;
    }
    
    console.log('Playlist order:', selectedMusic);
    currentMusicIndex = 0;
    playCurrentTrack();
    
    audioPlayer.addEventListener('ended', () => {
        currentMusicIndex = (currentMusicIndex + 1) % selectedMusic.length;
        playCurrentTrack();
    });
}

function playCurrentTrack() {
    if (selectedMusic.length === 0) return;
    
    const track = selectedMusic[currentMusicIndex];
    audioPlayer.src = '/music/' + track;
    audioPlayer.load();
    audioPlayer.play().catch(err => console.error('Audio play error:', err));
    console.log('Playing:', track);
}

function togglePause() {
    if (!slideshowStarted) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        clearInterval(intervalId);
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            console.log('Music paused');
        }
        console.log('Slideshow paused');
    } else {
        intervalId = setInterval(nextImage, delay);
        if (selectedMusic.length > 0) {
            audioPlayer.play().catch(err => console.error('Audio resume error:', err));
            console.log('Music resumed');
        }
        console.log('Slideshow resumed');
    }
}

document.addEventListener('keydown', (e) => {
    if (!slideshowStarted) return;
    
    switch(e.key) {
        case ' ':
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (isPaused) nextImage();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (isPaused) previousImage();
            break;
        case 'm':
        case 'M':
            e.preventDefault();
            toggleMirror();
            break;
    }
});

function previousImage() {
    index = (index - 1 + images.length) % images.length;
    showImage(index);
}

async function loadImages() {
    console.log('Loading images...');
    const startFolder = startFolderSelect.value;
    const randomize = randomizeCheckbox.checked;
    const shuffleAll = shuffleAllCheckbox.checked;
    const selectedFolders = getSelectedFolders();
    
    const requestBody = {
        startFolder: startFolder || null,
        randomize: randomize,
        shuffleAll: shuffleAll,
        selectedFolders: shuffleAll ? [] : selectedFolders
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch('/api/images/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    
    images = await response.json();
    console.log('Images loaded:', images.length);
    
    preloadImages(0, Math.min(PRELOAD_COUNT, images.length));
}

function preloadImages(startIndex, count) {
    for (let i = 0; i < count; i++) {
        const imageIndex = (startIndex + i) % images.length;
        const url = "/images/" + images[imageIndex];
        
        if (imageCache.has(url)) continue;
        
        const img = new Image();
        img.onload = () => console.log('Preloaded:', images[imageIndex]);
        img.onerror = () => console.error('Failed to preload:', images[imageIndex]);
        img.src = url;
        imageCache.set(url, img);
    }
    
    if (imageCache.size > PRELOAD_COUNT * 2) {
        const keysToDelete = [];
        let deleteCount = 0;
        for (const key of imageCache.keys()) {
            if (deleteCount++ < imageCache.size - PRELOAD_COUNT * 2) {
                keysToDelete.push(key);
            } else {
                break;
            }
        }
        keysToDelete.forEach(key => imageCache.delete(key));
    }
}

function showImage(i) {
    const url = "/images/" + images[i];
    
    if (imageCache.has(url)) {
        imgEl.src = imageCache.get(url).src;
    } else {
        imgEl.src = url;
    }
    
    const nextBatchStart = (i + 1) % images.length;
    preloadImages(nextBatchStart, PRELOAD_COUNT);
}

function nextImage() {
    index = (index + 1) % images.length;
    showImage(index);
}

async function requestFullscreen() {
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            await document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
        }
        console.log('Fullscreen active');
    } catch (err) {
        console.log('Fullscreen error:', err);
    }
}

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active');
            wakeLock.addEventListener('release', () => console.log('Wake Lock released'));
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

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        console.log('Exited fullscreen');
    }
});

startBtn.addEventListener("click", async () => {
    if (!validateFolderSelection()) return;
    
    delay = parseInt(speedSelect.value);
    mirrorOverlay.classList.add("hidden");

    // Hide controls and activate slideshow
    controls.classList.add("hidden");
    loadingOverlay.classList.add("active");
    document.body.classList.add("slideshow-active");
    
    await requestFullscreen();
    await requestWakeLock();
    
    keepAwakeInterval = setInterval(simulateActivity, 30000);
    
    playMusic();
    await loadImages();
    
    let preloadedCount = 0;
    const checkInterval = setInterval(() => {
        preloadedCount = imageCache.size;
        loadingText.textContent = `Preloading images... (${preloadedCount}/${Math.min(PRELOAD_COUNT, images.length)})`;
        
        if (preloadedCount >= Math.min(PRELOAD_COUNT, images.length) || preloadedCount >= images.length) {
            clearInterval(checkInterval);
            loadingOverlay.classList.remove("active");
            
            if (images.length > 0) {
                slideshowStarted = true;
                showImage(0);
                intervalId = setInterval(nextImage, delay);
            }
        }
    }, 100);
});

window.addEventListener('beforeunload', () => {
    if (wakeLock !== null) wakeLock.release();
    if (keepAwakeInterval) clearInterval(keepAwakeInterval);
});

// ===== INITIALIZATION =====
loadFolders();
loadMusicFiles();

// Start Magic Mirror updates
updateClock();
updateCompliment();
updateCurrentWeather();
updateForecast();

setInterval(updateClock, 1000);
setInterval(updateCompliment, 30000);
setInterval(updateCurrentWeather, 600000);
setInterval(updateForecast, 1800000);