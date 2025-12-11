// ===== DRAG & DROP MODULE =====
// Handles drag and drop functionality for folders and music items

const DragDrop = (() => {
    // ===== PRIVATE VARIABLES =====
    let draggedElement = null;
    
    // ===== DRAG & DROP HANDLERS =====
    
    /**
     * Handle drag start for folder items
     */
    function handleFolderDragStart(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
    
    /**
     * Handle drop for folder items
     */
    function handleFolderDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        
        if (draggedElement !== this) {
            const folderList = document.getElementById('folderList');
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
    
    /**
     * Handle drag start for music items
     */
    function handleMusicDragStart(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
    
    /**
     * Handle drop for music items
     */
    function handleMusicDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        
        if (draggedElement !== this) {
            const musicList = document.getElementById('musicList');
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
    
    /**
     * Handle drag over (common for all)
     */
    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    /**
     * Handle drag enter (common for all)
     */
    function handleDragEnter(e) {
        if (this !== draggedElement) this.classList.add('drag-over');
    }
    
    /**
     * Handle drag leave (common for all)
     */
    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }
    
    /**
     * Handle drag end (common for all)
     */
    function handleDragEnd(e) {
        this.classList.remove('dragging');
        const items = this.parentNode.querySelectorAll('.music-item, .folder-item');
        items.forEach(item => item.classList.remove('drag-over'));
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize drag & drop for folder items
     */
    function initFolders() {
        const folderList = document.getElementById('folderList');
        if (!folderList) return;
        
        // Use event delegation for dynamically created items
        folderList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('folder-item')) {
                handleFolderDragStart.call(e.target, e);
            }
        });
        
        folderList.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('folder-item') || e.target.closest('.folder-item')) {
                const item = e.target.closest('.folder-item') || e.target;
                handleDragOver.call(item, e);
            }
        });
        
        folderList.addEventListener('drop', (e) => {
            if (e.target.classList.contains('folder-item') || e.target.closest('.folder-item')) {
                const item = e.target.closest('.folder-item') || e.target;
                handleFolderDrop.call(item, e);
            }
        });
        
        folderList.addEventListener('dragenter', (e) => {
            if (e.target.classList.contains('folder-item') || e.target.closest('.folder-item')) {
                const item = e.target.closest('.folder-item') || e.target;
                handleDragEnter.call(item, e);
            }
        });
        
        folderList.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('folder-item') || e.target.closest('.folder-item')) {
                const item = e.target.closest('.folder-item') || e.target;
                handleDragLeave.call(item, e);
            }
        });
        
        folderList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('folder-item')) {
                handleDragEnd.call(e.target, e);
            }
        });
        
        console.log('✅ Drag & Drop initialized for folders');
    }
    
    /**
     * Initialize drag & drop for music items
     */
    function initMusic() {
        const musicList = document.getElementById('musicList');
        if (!musicList) return;
        
        // Use event delegation for dynamically created items
        musicList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('music-item')) {
                handleMusicDragStart.call(e.target, e);
            }
        });
        
        musicList.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('music-item') || e.target.closest('.music-item')) {
                const item = e.target.closest('.music-item') || e.target;
                handleDragOver.call(item, e);
            }
        });
        
        musicList.addEventListener('drop', (e) => {
            if (e.target.classList.contains('music-item') || e.target.closest('.music-item')) {
                const item = e.target.closest('.music-item') || e.target;
                handleMusicDrop.call(item, e);
            }
        });
        
        musicList.addEventListener('dragenter', (e) => {
            if (e.target.classList.contains('music-item') || e.target.closest('.music-item')) {
                const item = e.target.closest('.music-item') || e.target;
                handleDragEnter.call(item, e);
            }
        });
        
        musicList.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('music-item') || e.target.closest('.music-item')) {
                const item = e.target.closest('.music-item') || e.target;
                handleDragLeave.call(item, e);
            }
        });
        
        musicList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('music-item')) {
                handleDragEnd.call(e.target, e);
            }
        });
        
        console.log('✅ Drag & Drop initialized for music');
    }
    
    /**
     * Initialize all drag & drop
     */
    function init() {
        initFolders();
        initMusic();
        console.log('✅ Drag & Drop module initialized');
    }
    
    // Expose handlers for external use (e.g., folder-manager.js)
    // This allows newly created elements to use these handlers
    window.DragDrop = {
        handleFolderDragStart,
        handleFolderDrop,
        handleMusicDragStart,
        handleMusicDrop,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDragEnd
    };
    
    // Return public API
    return {
        init,
        initFolders,
        initMusic
    };
})();

console.log('✅ Drag & Drop module loaded');
