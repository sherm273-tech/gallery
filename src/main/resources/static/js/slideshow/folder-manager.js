// ===== FOLDER MANAGER MODULE =====
// Handles folder loading, selection, search, and validation

const FolderManager = (() => {
    // ===== PRIVATE VARIABLES =====
    let folderFiles = [];
    let draggedElement = null;
    
    // DOM Elements
    let folderList;
    let startFolderSelect;
    let selectAllFoldersBtn;
    let selectNoFoldersBtn;
    let shuffleAllCheckbox;
    let randomizeCheckbox;
    let folderSearchInput;
    let folderError;
    let startBtn;
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Initialize DOM references
     */
    function initializeDOM() {
        folderList = document.getElementById('folderList');
        startFolderSelect = document.getElementById('startFolderSelect');
        selectAllFoldersBtn = document.getElementById('selectAllFolders');
        selectNoFoldersBtn = document.getElementById('selectNoFolders');
        shuffleAllCheckbox = document.getElementById('shuffleAllCheckbox');
        randomizeCheckbox = document.getElementById('randomizeCheckbox');
        folderSearchInput = document.getElementById('folderSearch');
        folderError = document.getElementById('folderError');
        startBtn = document.getElementById('startButton');
    }
    
    /**
     * Create a folder item in the list
     * @param {string} folder - Folder name
     * @param {number} idx - Index for checkbox ID
     */
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
        checkbox.addEventListener('change', () => validate());
        
        const label = document.createElement("label");
        label.htmlFor = `folder-${idx}`;
        label.textContent = folder;
        
        div.appendChild(dragHandle);
        div.appendChild(checkbox);
        div.appendChild(label);
        
        // Drag & drop will be handled by DragDrop module
        // Store reference for DragDrop module to access
        div.addEventListener('dragstart', (e) => {
            if (window.DragDrop && window.DragDrop.handleFolderDragStart) {
                window.DragDrop.handleFolderDragStart.call(div, e);
            }
        });
        
        folderList.appendChild(div);
    }
    
    /**
     * Validate folder selection
     * @returns {boolean} True if selection is valid
     */
    function validateSelection() {
        // Check current mode
        const currentModeCheck = window.currentMode;
        if (currentModeCheck === 'music') {
            if (startBtn) startBtn.disabled = false;
            return true;
        }
        
        // If shuffle all is checked, selection is valid
        if (shuffleAllCheckbox && shuffleAllCheckbox.checked) {
            if (startBtn) startBtn.disabled = false;
            if (folderError) folderError.classList.remove('show');
            return true;
        }
        
        // Check if at least one folder is selected
        const selected = getSelected();
        if (selected.length === 0) {
            if (startBtn) startBtn.disabled = true;
            if (folderError) folderError.classList.add('show');
            return false;
        } else {
            if (startBtn) startBtn.disabled = false;
            if (folderError) folderError.classList.remove('show');
            return true;
        }
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Select All button
        if (selectAllFoldersBtn) {
            selectAllFoldersBtn.addEventListener('click', () => {
                selectAll();
            });
        }
        
        // Select None button
        if (selectNoFoldersBtn) {
            selectNoFoldersBtn.addEventListener('click', () => {
                selectNone();
            });
        }
        
        // Shuffle All checkbox
        if (shuffleAllCheckbox) {
            shuffleAllCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    folderList.style.opacity = '0.5';
                    folderList.style.pointerEvents = 'none';
                    if (startFolderSelect) {
                        startFolderSelect.disabled = true;
                        startFolderSelect.style.opacity = '0.5';
                    }
                    if (randomizeCheckbox) randomizeCheckbox.disabled = true;
                    if (folderError) folderError.classList.remove('show');
                    if (startBtn) startBtn.disabled = false;
                } else {
                    folderList.style.opacity = '1';
                    folderList.style.pointerEvents = 'auto';
                    if (startFolderSelect) {
                        startFolderSelect.disabled = false;
                        startFolderSelect.style.opacity = '1';
                    }
                    if (randomizeCheckbox) randomizeCheckbox.disabled = false;
                    validateSelection();
                }
            });
        }
        
        // Search input
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
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize the folder manager module
     */
    function init() {
        initializeDOM();
        setupEventListeners();
        console.log('✅ Folder Manager module initialized');
    }
    
    /**
     * Load folders from server
     * @returns {Promise<Array<string>>} Array of folder names
     */
    async function loadFolders() {
        try {
            const response = await fetch("/api/folders/list");
            folderFiles = await response.json();
            
            folderList.innerHTML = '';
            if (startFolderSelect) {
                startFolderSelect.innerHTML = '<option value="">None (use folder order above)</option>';
            }
            
            if (folderFiles.length === 0) {
                folderList.innerHTML = '<p style="color: #aaa;">No folders found</p>';
                return folderFiles;
            }
            
            folderFiles.forEach((folder, idx) => {
                createFolderItem(folder, idx);
                
                if (startFolderSelect) {
                    const option = document.createElement("option");
                    option.value = folder;
                    option.textContent = folder;
                    startFolderSelect.appendChild(option);
                }
            });
            
            validateSelection();
            console.log(`✅ Loaded ${folderFiles.length} folders`);
            return folderFiles;
        } catch (err) {
            console.error("Error loading folders:", err);
            folderList.innerHTML = '<p style="color: #aaa;">Error loading folders</p>';
            return [];
        }
    }
    
    /**
     * Get selected folders (in current order)
     * @returns {Array<string>} Array of selected folder names
     */
    function getSelected() {
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
    
    /**
     * Select all visible folders
     */
    function selectAll() {
        const checkboxes = folderList.querySelectorAll('.folder-item:not(.hidden) input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
        validateSelection();
        console.log(`✅ Selected all visible folders (${checkboxes.length})`);
    }
    
    /**
     * Deselect all folders
     */
    function selectNone() {
        const checkboxes = folderList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        validateSelection();
        console.log('✅ Deselected all folders');
    }
    
    /**
     * Validate folder selection
     * @returns {boolean} True if selection is valid
     */
    function validate() {
        return validateSelection();
    }
    
    /**
     * Get total number of folders
     * @returns {number} Total number of folders
     */
    function getTotalFolders() {
        return folderFiles.length;
    }
    
    /**
     * Get number of selected folders
     * @returns {number} Number of selected folders
     */
    function getSelectedCount() {
        return getSelected().length;
    }
    
    /**
     * Check if shuffle all is enabled
     * @returns {boolean} True if shuffle all checkbox is checked
     */
    function isShuffleAllEnabled() {
        return shuffleAllCheckbox ? shuffleAllCheckbox.checked : false;
    }
    
    /**
     * Check if randomize is enabled
     * @returns {boolean} True if randomize checkbox is checked
     */
    function isRandomizeEnabled() {
        return randomizeCheckbox ? randomizeCheckbox.checked : false;
    }
    
    /**
     * Get start folder
     * @returns {string|null} Start folder name or null
     */
    function getStartFolder() {
        return startFolderSelect ? (startFolderSelect.value || null) : null;
    }
    
    /**
     * Get slideshow configuration
     * @returns {Object} Configuration object for API
     */
    function getConfig() {
        return {
            startFolder: getStartFolder(),
            randomize: isRandomizeEnabled(),
            shuffleAll: isShuffleAllEnabled(),
            selectedFolders: isShuffleAllEnabled() ? [] : getSelected()
        };
    }
    
    // Return public API
    return {
        init,
        loadFolders,
        getSelected,
        selectAll,
        selectNone,
        validate,
        getTotalFolders,
        getSelectedCount,
        isShuffleAllEnabled,
        isRandomizeEnabled,
        getStartFolder,
        getConfig
    };
})();

console.log('✅ Folder Manager module loaded');
