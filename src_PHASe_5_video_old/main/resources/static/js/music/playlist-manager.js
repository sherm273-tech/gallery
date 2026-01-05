// ===== PLAYLIST MANAGER MODULE =====
// Handles music file loading, selection, drag & drop, and playlist management

const PlaylistManager = (() => {
    // ===== PRIVATE VARIABLES =====
    let musicFiles = [];
    let draggedElement = null;
    
    // DOM Elements
    let musicList;
    let selectAllMusicBtn;
    let selectNoMusicBtn;
    let randomizeMusicCheckbox;
    let musicSearchInput;
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Initialize DOM references
     */
    function initializeDOM() {
        musicList = document.getElementById('musicList');
        selectAllMusicBtn = document.getElementById('selectAllMusic');
        selectNoMusicBtn = document.getElementById('selectNoMusic');
        randomizeMusicCheckbox = document.getElementById('randomizeMusicCheckbox');
        musicSearchInput = document.getElementById('musicSearch');
    }
    
    /**
     * Create a music item in the list
     * @param {string} file - Music filename
     * @param {number} idx - Index for checkbox ID
     */
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
        
        // Drag & drop event listeners
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('dragend', handleDragEnd);
        div.addEventListener('dragenter', handleDragEnter);
        div.addEventListener('dragleave', handleDragLeave);
        
        musicList.appendChild(div);
    }
    
    /**
     * Drag & Drop Handlers
     */
    function handleDragStart(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
    
    function handleDrop(e) {
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
        const items = this.parentNode.querySelectorAll('.music-item');
        items.forEach(item => item.classList.remove('drag-over'));
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Select All button
        if (selectAllMusicBtn) {
            selectAllMusicBtn.addEventListener('click', () => {
                selectAll();
            });
        }
        
        // Select None button
        if (selectNoMusicBtn) {
            selectNoMusicBtn.addEventListener('click', () => {
                selectNone();
            });
        }
        
        // Search input
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
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize the playlist manager module
     */
    function init() {
        initializeDOM();
        setupEventListeners();
        console.log('✅ Playlist Manager module initialized');
    }
    
    /**
     * Show loading spinner in music list
     */
    function showLoadingSpinner() {
        musicList.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px;">
                <div class="spinner" style="border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #4a9eff; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
                <p style="color: #aaa; font-size: 14px;">Loading music files...</p>
            </div>
        `;
    }
    
    /**
     * Load music files from server
     * @returns {Promise<Array<string>>} Array of music filenames
     */
    async function loadFiles() {
        try {
            // Show loading spinner
            showLoadingSpinner();
            
            const response = await fetch("/api/music/list");
            musicFiles = await response.json();
            
            musicList.innerHTML = '';
            
            if (musicFiles.length === 0) {
                musicList.innerHTML = '<p style="color: #aaa;">No music files found</p>';
                return musicFiles;
            }
            
            musicFiles.forEach((file, idx) => {
                createMusicItem(file, idx);
            });
            
            console.log(`✅ Loaded ${musicFiles.length} music files`);
            return musicFiles;
        } catch (err) {
            console.error("Error loading music:", err);
            musicList.innerHTML = '<p style="color: #aaa;">Error loading music files</p>';
            return [];
        }
    }
    
    /**
     * Get selected music tracks (in current order, optionally shuffled)
     * @returns {Array<string>} Array of selected music filenames
     */
    function getSelectedMusic() {
        const items = musicList.querySelectorAll('.music-item');
        const selected = [];
        
        items.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked && !item.classList.contains('hidden')) {
                selected.push(checkbox.value);
            }
        });
        
        // Apply randomization if checkbox is checked
        if (randomizeMusicCheckbox && randomizeMusicCheckbox.checked && selected.length > 0) {
            console.log('🔀 Shuffling playlist...');
            for (let i = selected.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [selected[i], selected[j]] = [selected[j], selected[i]];
            }
        }
        
        console.log(`🎵 Selected ${selected.length} tracks`);
        return selected;
    }
    
    /**
     * Select all visible music tracks
     */
    function selectAll() {
        const checkboxes = musicList.querySelectorAll('.music-item:not(.hidden) input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        console.log(`✅ Selected all visible tracks (${checkboxes.length})`);
    }
    
    /**
     * Deselect all music tracks
     */
    function selectNone() {
        const checkboxes = musicList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        console.log('✅ Deselected all tracks');
    }
    
    /**
     * Get total number of music files
     * @returns {number} Total number of music files
     */
    function getTotalFiles() {
        return musicFiles.length;
    }
    
    /**
     * Get number of selected tracks
     * @returns {number} Number of selected tracks
     */
    function getSelectedCount() {
        const checkboxes = musicList.querySelectorAll('.music-item:not(.hidden) input[type="checkbox"]:checked');
        return checkboxes.length;
    }
    
    /**
     * Check if randomize is enabled
     * @returns {boolean} True if randomize checkbox is checked
     */
    function isRandomizeEnabled() {
        return randomizeMusicCheckbox ? randomizeMusicCheckbox.checked : false;
    }
    
    // Return public API
    return {
        init,
        loadFiles,
        getSelectedMusic,
        selectAll,
        selectNone,
        getTotalFiles,
        getSelectedCount,
        isRandomizeEnabled
    };
})();

console.log('✅ Playlist Manager module loaded');
