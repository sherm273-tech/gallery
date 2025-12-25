// Event Slideshow Configuration Manager
// Handles slideshow configuration UI within event form

const EventSlideshowConfig = {
    folders: [],
    music: [],
    selectedFolders: [],
    selectedMusic: [],
    currentEventId: null,
    listenersAttached: false,
    currentFolderFilter: '',
    currentMusicFilter: '',

    async init() {
        console.log('[EventSlideshowConfig] Initialising...');
        await this.loadFolders();
        await this.loadMusic();
    },

    ensureListenersAttached() {
        // Only attach listeners once
        if (this.listenersAttached) return;
        
        console.log('[EventSlideshowConfig] Attaching event listeners...');
        this.attachEventListeners();
        this.listenersAttached = true;
    },

    renderLists() {
        console.log('[EventSlideshowConfig] Rendering folder and music lists...');
        
        // Show loading spinner immediately
        const folderListElement = document.getElementById('folderListEvent');
        const musicListElement = document.getElementById('musicListEvent');
        
        const spinnerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 10px; min-height: 100px;">
                <div class="spinner" style="width: 30px; height: 30px; border-width: 3px;"></div>
                <p style="color: #aaa; margin-top: 15px; font-size: 13px;">Loading...</p>
            </div>
        `;
        
        if (folderListElement) {
            folderListElement.innerHTML = spinnerHTML;
        }
        if (musicListElement) {
            musicListElement.innerHTML = spinnerHTML;
        }
        
        // Load data asynchronously without blocking
        this.loadAndRenderAsync();
    },
    
    async loadAndRenderAsync() {
        // Wait for data to load if not already loaded
        if (this.folders.length === 0 || this.music.length === 0) {
            console.log('[EventSlideshowConfig] Loading data from API...');
            await this.loadFolders();
            await this.loadMusic();
        }
        
        // Now render with actual data
        this.renderFolderList();
        this.renderMusicList();
        this.populateStartFolderDropdown();
    },

    attachEventListeners() {
        // Toggle slideshow config section
        const enableCheckbox = document.getElementById('enableSlideshowConfig');
        
        if (enableCheckbox) {
            enableCheckbox.addEventListener('change', (e) => {
                const configContent = document.getElementById('slideshowConfigContent');
                if (configContent) {
                    configContent.style.display = e.target.checked ? 'block' : 'none';
                    console.log('[EventSlideshowConfig] Toggled display:', configContent.style.display);
                } else {
                    console.error('[EventSlideshowConfig] slideshowConfigContent element not found');
                }
            });
            console.log('[EventSlideshowConfig] Toggle listener attached');
        } else {
            console.error('[EventSlideshowConfig] enableSlideshowConfig checkbox not found');
        }

        // Folder controls
        document.getElementById('selectAllFoldersEvent')?.addEventListener('click', () => {
            this.selectAllFolders();
        });
        
        document.getElementById('selectNoFoldersEvent')?.addEventListener('click', () => {
            this.clearFolderSelection();
        });

        // Music controls
        document.getElementById('selectAllMusicEvent')?.addEventListener('click', () => {
            this.selectAllMusic();
        });
        
        document.getElementById('selectNoMusicEvent')?.addEventListener('click', () => {
            this.clearMusicSelection();
        });

        // Search inputs
        document.getElementById('folderSearchEvent')?.addEventListener('input', (e) => {
            this.filterFolders(e.target.value);
        });
        
        document.getElementById('musicSearchEvent')?.addEventListener('input', (e) => {
            this.filterMusic(e.target.value);
        });
    },

    async loadFolders() {
        try {
            const response = await fetch('/api/folders/list');
            this.folders = await response.json();
            console.log('[EventSlideshowConfig] Loaded', this.folders.length, 'folders');
            // Don't render yet - will render when form opens
        } catch (error) {
            console.error('[EventSlideshowConfig] Error loading folders:', error);
        }
    },

    async loadMusic() {
        try {
            const response = await fetch('/api/music/list');
            this.music = await response.json();
            console.log('[EventSlideshowConfig] Loaded', this.music.length, 'music files');
            // Don't render yet - will render when form opens
        } catch (error) {
            console.error('[EventSlideshowConfig] Error loading music:', error);
        }
    },

    renderFolderList(filter = '') {
        console.log('[EventSlideshowConfig] renderFolderList called, folders.length:', this.folders.length);
        const folderListElement = document.getElementById('folderListEvent');
        
        if (!folderListElement) {
            console.error('[EventSlideshowConfig] folderListEvent element not found!');
            return;
        }

        const filteredFolders = filter 
            ? this.folders.filter(f => f.toLowerCase().includes(filter.toLowerCase()))
            : this.folders;

        console.log('[EventSlideshowConfig] filteredFolders.length:', filteredFolders.length);

        if (filteredFolders.length === 0) {
            folderListElement.innerHTML = '<p style="color: #aaa;">No folders found</p>';
            return;
        }

        folderListElement.innerHTML = filteredFolders.map(folder => {
            const isSelected = this.selectedFolders.includes(folder);
            return `
                <div class="folder-item ${isSelected ? 'selected' : ''}" data-folder="${folder}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} data-folder="${folder}">
                    <span class="item-name">${folder}</span>
                </div>
            `;
        }).join('');

        console.log('[EventSlideshowConfig] Rendered', filteredFolders.length, 'folders');

        // Attach click handlers
        folderListElement.querySelectorAll('.folder-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const folder = item.dataset.folder;
            
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    checkbox.checked = !checkbox.checked;
                }
                this.toggleFolderSelection(folder, checkbox.checked);
            });
            
            checkbox.addEventListener('change', (e) => {
                this.toggleFolderSelection(folder, e.target.checked);
            });
        });
    },

    renderMusicList(filter = '') {
        console.log('[EventSlideshowConfig] renderMusicList called, music.length:', this.music.length);
        const musicListElement = document.getElementById('musicListEvent');
        
        if (!musicListElement) {
            console.error('[EventSlideshowConfig] musicListEvent element not found!');
            return;
        }

        const filteredMusic = filter 
            ? this.music.filter(m => m.toLowerCase().includes(filter.toLowerCase()))
            : this.music;

        console.log('[EventSlideshowConfig] filteredMusic.length:', filteredMusic.length);

        if (filteredMusic.length === 0) {
            musicListElement.innerHTML = '<p style="color: #aaa;">No music found</p>';
            return;
        }

        musicListElement.innerHTML = filteredMusic.map(track => {
            const isSelected = this.selectedMusic.includes(track);
            const displayName = track.split('/').pop();
            return `
                <div class="music-item ${isSelected ? 'selected' : ''}" data-music="${track}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} data-music="${track}">
                    <span class="item-name">${displayName}</span>
                </div>
            `;
        }).join('');

        console.log('[EventSlideshowConfig] Rendered', filteredMusic.length, 'music tracks');

        // Attach click handlers
        musicListElement.querySelectorAll('.music-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const track = item.dataset.music;
            
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    checkbox.checked = !checkbox.checked;
                }
                this.toggleMusicSelection(track, checkbox.checked);
            });
            
            checkbox.addEventListener('change', (e) => {
                this.toggleMusicSelection(track, e.target.checked);
            });
        });
    },

    toggleFolderSelection(folder, selected) {
        if (selected) {
            if (!this.selectedFolders.includes(folder)) {
                this.selectedFolders.push(folder);
            }
        } else {
            this.selectedFolders = this.selectedFolders.filter(f => f !== folder);
        }
        this.renderFolderList(this.currentFolderFilter);
        this.populateStartFolderDropdown();
    },

    toggleMusicSelection(track, selected) {
        if (selected) {
            if (!this.selectedMusic.includes(track)) {
                this.selectedMusic.push(track);
            }
        } else {
            this.selectedMusic = this.selectedMusic.filter(m => m !== track);
        }
        this.renderMusicList(this.currentMusicFilter);
    },

    selectAllFolders() {
        this.selectedFolders = [...this.folders];
        this.renderFolderList(this.currentFolderFilter);
        this.populateStartFolderDropdown();
    },

    clearFolderSelection() {
        this.selectedFolders = [];
        this.renderFolderList(this.currentFolderFilter);
        this.populateStartFolderDropdown();
    },

    selectAllMusic() {
        this.selectedMusic = [...this.music];
        this.renderMusicList(this.currentMusicFilter);
    },

    clearMusicSelection() {
        this.selectedMusic = [];
        this.renderMusicList(this.currentMusicFilter);
    },

    filterFolders(query) {
        this.currentFolderFilter = query;
        this.renderFolderList(query);
    },

    filterMusic(query) {
        this.currentMusicFilter = query;
        this.renderMusicList(query);
    },

    populateStartFolderDropdown() {
        const select = document.getElementById('startFolderSelectEvent');
        if (!select) return;

        select.innerHTML = '<option value="">None</option>';
        this.selectedFolders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
            select.appendChild(option);
        });
    },

    async loadConfigForEvent(eventId) {
        console.log('[EventSlideshowConfig] Loading config for event:', eventId);
        this.currentEventId = eventId;

        try {
            const response = await fetch(`/api/slideshow-config/event/${eventId}`);
            
            if (response.ok) {
                const config = await response.json();
                this.applyConfig(config);
                return true;
            } else {
                // No config exists
                this.clearConfig();
                return false;
            }
        } catch (error) {
            console.error('[EventSlideshowConfig] Error loading config:', error);
            this.clearConfig();
            return false;
        }
    },

    applyConfig(config) {
        console.log('[EventSlideshowConfig] Applying config:', config);

        // Enable slideshow config section
        const enableCheckbox = document.getElementById('enableSlideshowConfig');
        const configContent = document.getElementById('slideshowConfigContent');
        if (enableCheckbox) {
            enableCheckbox.checked = true;
            configContent.style.display = 'block';
        }

        // Parse JSON fields
        this.selectedFolders = config.selectedFolders ? JSON.parse(config.selectedFolders) : [];
        this.selectedMusic = config.selectedMusic ? JSON.parse(config.selectedMusic) : [];

        // Apply settings
        document.getElementById('shuffleAllCheckboxEvent').checked = config.shuffleAll || false;
        document.getElementById('randomizeCheckboxEvent').checked = config.randomizeImages !== false;
        document.getElementById('randomizeMusicCheckboxEvent').checked = config.randomizeMusic || false;
        document.getElementById('speedSelectEvent').value = config.displayDuration || 5000;
        document.getElementById('muteMusicDuringVideoEvent').checked = config.muteMusicDuringVideo !== false;
        
        // Re-render lists with selections
        this.renderFolderList();
        this.renderMusicList();
        this.populateStartFolderDropdown();
        
        // Set start folder
        if (config.startFolder) {
            document.getElementById('startFolderSelectEvent').value = config.startFolder;
        }
    },

    clearConfig() {
        console.log('[EventSlideshowConfig] Clearing config');
        
        const enableCheckbox = document.getElementById('enableSlideshowConfig');
        const configContent = document.getElementById('slideshowConfigContent');
        if (enableCheckbox) {
            enableCheckbox.checked = false;
            configContent.style.display = 'none';
        }

        this.selectedFolders = [];
        this.selectedMusic = [];
        this.currentEventId = null;
        this.currentFolderFilter = '';
        this.currentMusicFilter = '';

        // Reset form
        document.getElementById('shuffleAllCheckboxEvent').checked = false;
        document.getElementById('randomizeCheckboxEvent').checked = true;
        document.getElementById('randomizeMusicCheckboxEvent').checked = false;
        document.getElementById('speedSelectEvent').value = 5000;
        document.getElementById('muteMusicDuringVideoEvent').checked = true;
        document.getElementById('startFolderSelectEvent').value = '';
        
        // Clear search inputs
        const folderSearch = document.getElementById('folderSearchEvent');
        const musicSearch = document.getElementById('musicSearchEvent');
        if (folderSearch) folderSearch.value = '';
        if (musicSearch) musicSearch.value = '';

        this.renderFolderList();
        this.renderMusicList();
        this.populateStartFolderDropdown();
    },

    getConfigData() {
        const enableCheckbox = document.getElementById('enableSlideshowConfig');
        
        if (!enableCheckbox || !enableCheckbox.checked) {
            return null; // No config to save
        }

        return {
            selectedFolders: JSON.stringify(this.selectedFolders),
            selectedMusic: JSON.stringify(this.selectedMusic),
            shuffleAll: document.getElementById('shuffleAllCheckboxEvent').checked,
            randomizeImages: document.getElementById('randomizeCheckboxEvent').checked,
            randomizeMusic: document.getElementById('randomizeMusicCheckboxEvent').checked,
            startFolder: document.getElementById('startFolderSelectEvent').value || null,
            muteMusicDuringVideo: document.getElementById('muteMusicDuringVideoEvent').checked,
            displayDuration: parseInt(document.getElementById('speedSelectEvent').value)
        };
    },

    async saveConfig(eventId) {
        const configData = this.getConfigData();
        
        if (!configData) {
            // Delete config if exists
            if (this.currentEventId) {
                try {
                    await fetch(`/api/slideshow-config/event/${eventId}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error('[EventSlideshowConfig] Error deleting config:', error);
                }
            }
            return;
        }

        try {
            const response = await fetch(`/api/slideshow-config/event/${eventId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });

            if (response.ok) {
                console.log('[EventSlideshowConfig] Config saved successfully');
            } else {
                console.error('[EventSlideshowConfig] Failed to save config');
            }
        } catch (error) {
            console.error('[EventSlideshowConfig] Error saving config:', error);
        }
    }
};

// Export for use in calendar-form.js
window.EventSlideshowConfig = EventSlideshowConfig;
