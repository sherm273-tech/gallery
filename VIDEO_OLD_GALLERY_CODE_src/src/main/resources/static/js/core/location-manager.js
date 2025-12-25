// ===== LOCATION MANAGER =====
// Now uses WeatherDisplay module for weather updates

// ===== COMPLETE LOCATION MANAGER WITH ENHANCED DROPDOWN =====
// This is a standalone file that replaces location-manager.js entirely

// Global state
let allLocations = [];
let currentLocationId = null;
let locationWeatherCache = {};
let searchTimeout = null;
let isSearching = false;

// DOM Elements - Use weatherLocationClickable instead of locationSelector
const weatherLocationClickable = document.getElementById('weatherLocationClickable');
const locationDropdown = document.getElementById('locationDropdown');
const weatherLocationText = document.getElementById('weatherLocation');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Initializing enhanced location manager...');
    
    if (weatherLocationClickable && locationDropdown) {
        buildEnhancedDropdown();
        setupLocationSelector();
    }
});

// ===== BUILD ENHANCED DROPDOWN =====
function buildEnhancedDropdown() {
    locationDropdown.className = 'location-dropdown-enhanced';
    
    locationDropdown.innerHTML = `
        <div class="location-dropdown-search">
            <input 
                type="text" 
                class="location-dropdown-search-input" 
                id="locationSearchInline" 
                placeholder="🔍 Search for a location..."
                autocomplete="off"
            />
        </div>
        <div class="location-dropdown-list" id="locationDropdownList">
            <div class="location-dropdown-empty">
                <div class="location-dropdown-empty-text">Loading locations...</div>
            </div>
        </div>
    `;
    
    // Setup search handler
    const searchInput = document.getElementById('locationSearchInline');
    if (searchInput) {
        searchInput.addEventListener('input', handleInlineSearch);
    }
    
    // Prevent dropdown from closing when clicking inside
    locationDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    console.log('✅ Enhanced dropdown built');
}

// ===== SETUP LOCATION SELECTOR =====
function setupLocationSelector() {
    // Show/hide dropdown when clicking weather location
    weatherLocationClickable.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = locationDropdown.classList.toggle('active');
        weatherLocationClickable.classList.toggle('active', isActive);
        
        if (isActive) {
            // Clear search and show saved locations
            const searchInput = document.getElementById('locationSearchInline');
            if (searchInput) {
                searchInput.value = '';
                isSearching = false;
            }
            updateEnhancedDropdown();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        locationDropdown.classList.remove('active');
        weatherLocationClickable.classList.remove('active');
    });
    
    console.log('✅ Location selector setup complete');
}

// ===== LOAD LOCATIONS =====
async function loadLocations() {
    try {
        console.log('🌍 Loading weather locations...');
        const response = await fetch('/api/locations');
        allLocations = await response.json();
        
        console.log(`✅ Locations loaded: ${allLocations.length}`);
        
        // Get default location
        const defaultLocation = allLocations.find(loc => loc.isDefault);
        if (defaultLocation) {
            currentLocationId = defaultLocation.id;
            if (weatherLocationText) {
                weatherLocationText.textContent = defaultLocation.locationName;
            }
        }
        
        return allLocations;
    } catch (error) {
        console.error('❌ Error loading locations:', error);
        return [];
    }
}

// ===== UPDATE ENHANCED DROPDOWN =====
async function updateEnhancedDropdown() {
    const listContainer = document.getElementById('locationDropdownList');
    
    if (!listContainer) {
        console.error('❌ locationDropdownList not found');
        return;
    }
    
    if (isSearching) return; // Don't update while searching
    
    if (allLocations.length === 0) {
        listContainer.innerHTML = `
            <div class="location-dropdown-empty">
                <div class="location-dropdown-empty-icon">📍</div>
                <div class="location-dropdown-empty-text">
                    No locations saved yet.<br>
                    Search above to add your first location!
                </div>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = '';
    
    // Load weather for all locations
    for (const location of allLocations) {
        const card = await createLocationCard(location);
        listContainer.appendChild(card);
    }
}

// ===== CREATE LOCATION CARD WITH WEATHER =====
async function createLocationCard(location) {
    const card = document.createElement('div');
    card.className = 'location-card';
    if (location.id === currentLocationId) {
        card.classList.add('active');
    }
    
    // Get weather icon for location
    const weatherIcon = getWeatherIconForLocation(location);
    
    // Initial card HTML (will update with weather)
    card.innerHTML = `
        <div class="location-card-icon">${weatherIcon}</div>
        <div class="location-card-info">
            <div class="location-card-name">
                ${location.locationName}
                ${location.isDefault ? '<span class="location-card-default-badge">Default</span>' : ''}
            </div>
            <div class="location-card-weather location-card-loading">
                <span class="location-card-temp">--°</span>
                <span class="location-card-desc">Loading...</span>
            </div>
        </div>
        <div class="location-card-actions">
            ${allLocations.length > 1 ? `
                <button class="location-card-delete" onclick="deleteLocationFromCard(${location.id}, event)">
                    🗑️ Delete
                </button>
            ` : ''}
        </div>
    `;
    
    // Click to switch location
    card.addEventListener('click', (e) => {
        // Don't switch if clicking delete button
        if (!e.target.closest('.location-card-delete')) {
            switchToLocation(location.id);
            locationDropdown.classList.remove('active');
        }
    });
    
    // Load weather data
    loadWeatherForCard(location, card);
    
    return card;
}

// ===== LOAD WEATHER FOR CARD =====
async function loadWeatherForCard(location, card) {
    try {
        // Check cache first
        if (locationWeatherCache[location.id]) {
            updateCardWeather(card, locationWeatherCache[location.id]);
            return;
        }
        
        // Fetch weather
        const response = await fetch(`/api/weather/${location.id}/current`);
        const data = await response.json();
        
        if (!data.error) {
            // Cache it
            locationWeatherCache[location.id] = data;
            
            // Update card
            updateCardWeather(card, data);
        } else {
            updateCardWeatherError(card);
        }
    } catch (error) {
        console.error('Error loading weather for card:', error);
        updateCardWeatherError(card);
    }
}

// ===== UPDATE CARD WITH WEATHER DATA =====
function updateCardWeather(card, weatherData) {
    const weatherContainer = card.querySelector('.location-card-weather');
    const temp = Math.round(weatherData.main.temp);
    const desc = weatherData.weather[0].description;
    
    weatherContainer.classList.remove('location-card-loading');
    weatherContainer.innerHTML = `
        <span class="location-card-temp">${temp}°</span>
        <span class="location-card-desc">${desc}</span>
    `;
    
    // Update icon
    const iconContainer = card.querySelector('.location-card-icon');
    const weatherIcon = getWeatherIcon(weatherData.weather[0].main);
    iconContainer.textContent = weatherIcon;
}

function updateCardWeatherError(card) {
    const weatherContainer = card.querySelector('.location-card-weather');
    weatherContainer.classList.remove('location-card-loading');
    weatherContainer.innerHTML = `
        <span class="location-card-desc" style="color: rgba(244, 67, 54, 0.7);">
            Weather unavailable
        </span>
    `;
}

// ===== GET WEATHER ICON =====
function getWeatherIcon(weatherMain) {
    switch (weatherMain) {
        case 'Clear': return '☀️';
        case 'Clouds': return '☁️';
        case 'Rain': return '🌧️';
        case 'Drizzle': return '🌦️';
        case 'Thunderstorm': return '⛈️';
        case 'Snow': return '❄️';
        case 'Fog': return '🌫️';
        case 'Mist': return '🌫️';
        default: return '🌤️';
    }
}

function getWeatherIconForLocation(location) {
    if (locationWeatherCache[location.id]) {
        const weather = locationWeatherCache[location.id].weather[0].main;
        return getWeatherIcon(weather);
    }
    return '📍'; // Default
}

// ===== SWITCH TO LOCATION =====
async function switchToLocation(locationId) {
    console.log(`🔄 Switching to location ID: ${locationId}`);
    
    const location = allLocations.find(loc => loc.id === locationId);
    if (!location) {
        console.error('❌ Location not found:', locationId);
        return;
    }
    
    // Update current location
    currentLocationId = locationId;
    
    // Update location name in UI
    if (weatherLocationText) {
        weatherLocationText.textContent = location.locationName;
        console.log('📍 Updated location text to:', location.locationName);
    }
    
    // Close dropdown and reset arrow
    if (locationDropdown) {
        locationDropdown.classList.remove('active');
    }
    if (weatherLocationClickable) {
        weatherLocationClickable.classList.remove('active');
    }
    
    // Update all weather displays for this location
    console.log('🌤️ Calling updateWeatherForLocation...');
    if (typeof updateWeatherForLocation === 'function') {
        await updateWeatherForLocation(locationId);
        console.log('✅ Weather updated successfully for:', location.locationName);
    } else {
        console.error('❌ updateWeatherForLocation function not found!');
        console.log('Available functions:', Object.keys(window).filter(k => k.includes('weather')));
    }
}

// ===== INLINE SEARCH HANDLER =====
function handleInlineSearch(e) {
    const query = e.target.value.trim();
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    const listContainer = document.getElementById('locationDropdownList');
    
    if (query.length < 2) {
        // Show saved locations
        isSearching = false;
        updateEnhancedDropdown();
        return;
    }
    
    isSearching = true;
    listContainer.innerHTML = `
        <div class="location-dropdown-empty">
            <div class="location-dropdown-empty-text">Searching...</div>
        </div>
    `;
    
    searchTimeout = setTimeout(() => {
        searchLocationsInline(query);
    }, 500);
}

// ===== SEARCH LOCATIONS INLINE =====
async function searchLocationsInline(query) {
    const listContainer = document.getElementById('locationDropdownList');
    
    try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            listContainer.innerHTML = '<div class="location-search-results-inline"></div>';
            const resultsContainer = listContainer.querySelector('.location-search-results-inline');
            
            data.results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'location-search-result-inline';
                
                const admin = result.admin1 ? `, ${result.admin1}` : '';
                const country = result.country || '';
                
                resultItem.innerHTML = `
                    <div class="location-search-result-name">${result.name}${admin}</div>
                    <div class="location-search-result-details">
                        ${country} • ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}
                    </div>
                `;
                
                resultItem.addEventListener('click', () => {
                    addLocationFromSearch(result);
                });
                
                resultsContainer.appendChild(resultItem);
            });
        } else {
            listContainer.innerHTML = `
                <div class="location-dropdown-empty">
                    <div class="location-dropdown-empty-icon">🔍</div>
                    <div class="location-dropdown-empty-text">
                        No results found for "${query}"<br>
                        Try a different search term
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching locations:', error);
        listContainer.innerHTML = `
            <div class="location-dropdown-empty">
                <div class="location-dropdown-empty-text" style="color: #f44336;">
                    Error searching. Please try again.
                </div>
            </div>
        `;
    }
}

// ===== ADD LOCATION FROM SEARCH =====
async function addLocationFromSearch(result) {
    try {
        const admin = result.admin1 ? `, ${result.admin1}` : '';
        const locationName = `${result.name}${admin}`;
        
        const response = await fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locationName: locationName,
                latitude: result.latitude,
                longitude: result.longitude,
                isDefault: false
            })
        });
        
        if (response.ok) {
            const newLocation = await response.json();
            
            // Reload locations
            await loadLocations();
            
            // Clear search
            document.getElementById('locationSearchInline').value = '';
            isSearching = false;
            
            // Refresh dropdown
            await updateEnhancedDropdown();
            
            // Switch to new location
            await switchToLocation(newLocation.id);
            
            console.log('✅ Location added:', locationName);
        } else {
            alert('❌ Failed to add location. Please try again.');
        }
    } catch (error) {
        console.error('Error adding location:', error);
        alert('❌ Error adding location. Please try again.');
    }
}

// ===== DELETE LOCATION FROM CARD =====
async function deleteLocationFromCard(locationId, event) {
    event.stopPropagation(); // Prevent card click
    
    const location = allLocations.find(loc => loc.id === locationId);
    
    if (!location) return;
    
    // Don't allow deleting the last location
    if (allLocations.length === 1) {
        alert('❌ Cannot delete the last location.');
        return;
    }
    
    console.log('🗑️ DELETE REQUEST:');
    console.log('  Deleting location ID:', locationId, 'Type:', typeof locationId);
    console.log('  Current location ID:', currentLocationId, 'Type:', typeof currentLocationId);
    console.log('  Are they equal?', locationId === currentLocationId);
    console.log('  Loose equal?', locationId == currentLocationId);
    
    try {
        const response = await fetch(`/api/locations/${locationId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            console.log('✅ Location deleted from server');
            
            // Remove from cache
            delete locationWeatherCache[locationId];
            console.log('🗑️ Removed from cache');
            
            // Reload locations
            await loadLocations();
            console.log('📋 Locations reloaded, count:', allLocations.length);
            
            // Refresh dropdown
            await updateEnhancedDropdown();
            console.log('🔄 Dropdown refreshed');
            
            // ALWAYS switch to a location after delete (to ensure display is fresh)
            // If we deleted the current location, switch to first available
            // If we deleted a different location, just refresh the current one
            if (locationId === currentLocationId) {
                console.log('⚠️ Deleted current location, switching to new location');
                
                // Try to find default location first
                let newLocation = allLocations.find(loc => loc.isDefault);
                
                // If no default, use first location
                if (!newLocation && allLocations.length > 0) {
                    newLocation = allLocations[0];
                }
                
                if (newLocation) {
                    console.log('🔄 Switching to new location:', newLocation.locationName, 'ID:', newLocation.id);
                    await switchToLocation(newLocation.id);
                    console.log('✅ Switch complete');
                } else {
                    console.error('❌ No location to switch to!');
                }
            } else {
                console.log('ℹ️ Deleted different location, refreshing current display');
                // Refresh the current location's weather to ensure display is updated
                if (currentLocationId) {
                    await switchToLocation(currentLocationId);
                }
            }
            
            console.log('✅ Delete operation completed');
        } else {
            alert('❌ Failed to delete location.');
        }
    } catch (error) {
        console.error('Error deleting location:', error);
        alert('❌ Error deleting location.');
    }
}

// ===== INITIALIZE ON WEATHER DISPLAY =====
// This is called from script.js when weather display is shown
window.initializeLocationUI = async function() {
    console.log('🌍 Initializing location UI for weather display...');
    
    try {
        await loadLocations();
        
        if (currentLocationId) {
            // Weather display will call updateWeatherForLocation from script.js
            console.log('✅ Location UI initialized with location:', currentLocationId);
        }
    } catch (error) {
        console.error('❌ Error initializing location UI:', error);
    }
};

// ===== AUTO-INITIALIZE WHEN WEATHER DISPLAY OPENS =====
// Use setTimeout to ensure script.js loads first and avoid conflicts
setTimeout(() => {
    const weatherDisplayBtn = document.getElementById('weatherDisplayBtn');
    const closeWeatherBtn = document.getElementById('closeWeatherBtn');

    if (weatherDisplayBtn) {
        weatherDisplayBtn.addEventListener('click', async () => {
            console.log('🌤️ Weather display opened (from location-manager)');
            
            // Load locations first
            await loadLocations();
            
            // Then update weather for the default location
            if (currentLocationId && typeof updateWeatherForLocation === 'function') {
                console.log('🌤️ Loading initial weather for default location');
                await updateWeatherForLocation(currentLocationId);
            }
        });
    }

    if (closeWeatherBtn) {
        closeWeatherBtn.addEventListener('click', () => {
            // Close dropdown if open
            if (locationDropdown) {
                locationDropdown.classList.remove('active');
            }
            if (weatherLocationClickable) {
                weatherLocationClickable.classList.remove('active');
            }
        });
    }
}, 100);

console.log('✅ Enhanced location manager loaded');
