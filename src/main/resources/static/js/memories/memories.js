// memories.js - Handles "On This Day" memories functionality

const MemoriesModule = (function() {
    
    let memoriesData = null;
    let BATCH_SIZE = 12; // Default, will be loaded from server config
    
    /**
     * Initialize the memories module
     */
    function init() {
        console.log('Initializing Memories Module...');
        loadConfig();
        loadTodaysMemories();
        setupEventListeners();
    }
    
    /**
     * Load configuration from server
     */
    async function loadConfig() {
        try {
            const response = await fetch('/api/memories/config');
            if (response.ok) {
                const config = await response.json();
                BATCH_SIZE = config.batchSize || 12;
                console.log(`[MemoriesModule] Loaded config - Batch size: ${BATCH_SIZE}`);
            }
        } catch (error) {
            console.error('Error loading memories config:', error);
            // Keep default value of 12
        }
    }
    
    /**
     * Load today's memories from the server
     */
    async function loadTodaysMemories() {
        try {
            const response = await fetch('/api/memories/today');
            if (!response.ok) {
                throw new Error('Failed to fetch memories');
            }
            
            memoriesData = await response.json();
            console.log('Memories loaded:', memoriesData);
            
            updateMemoriesWidget();
            
        } catch (error) {
            console.error('Error loading memories:', error);
        }
    }
    
    /**
     * Update the memories widget on the home screen
     */
    function updateMemoriesWidget() {
        const widget = document.getElementById('memoriesWidget');
        if (!widget) {
            console.log('Memories widget not found');
            return;
        }
        
        if (!memoriesData || memoriesData.count === 0) {
            widget.style.display = 'none';
            return;
        }
        
        widget.style.display = 'block';
        
        // Update count
        const countElement = widget.querySelector('.memories-count');
        if (countElement) {
            const count = memoriesData.count;
            const yearText = count === 1 ? 'year' : 'years';
            countElement.textContent = `${count} ${count === 1 ? 'photo' : 'photos'} from previous ${yearText}`;
        }
        
        // Show random memory photo
        if (memoriesData.memories && memoriesData.memories.length > 0) {
            const randomMemory = memoriesData.memories[Math.floor(Math.random() * memoriesData.memories.length)];
            updateMemoryPreview(randomMemory);
        }
    }
    
    /**
     * Update the memory preview image
     */
    function updateMemoryPreview(memory) {
        const previewImg = document.getElementById('memoryPreviewImg');
        const yearsAgoText = document.getElementById('memoryYearsAgo');
        
        if (previewImg && memory.filePath) {
            // Use thumbnail for widget preview (faster loading)
            const imagePath = memory.thumbnailPath || memory.filePath;
            const imageUrl = `/images/${imagePath}`;
            previewImg.src = imageUrl;
            previewImg.alt = `Memory from ${memory.year}`;
        }
        
        if (yearsAgoText) {
            const yearsAgo = memory.yearsAgo;
            if (yearsAgo === 0) {
                yearsAgoText.textContent = 'Today';
            } else if (yearsAgo === 1) {
                yearsAgoText.textContent = '1 year ago';
            } else {
                yearsAgoText.textContent = `${yearsAgo} years ago`;
            }
        }
    }
    
    /**
     * Open the full memories view
     */
    function openMemoriesView() {
        if (!memoriesData || memoriesData.count === 0) {
            return;
        }
        
        const modal = document.getElementById('memoriesModal');
        if (modal) {
            modal.style.display = 'flex';
            renderMemoriesGallery();
        }
    }
    
    /**
     * Open memories for a specific date
     */
    async function openMemoriesForDate(month, day) {
        console.log('[MemoriesModule] Opening memories for date:', month, day);
        
        try {
            const response = await fetch(`/api/memories/date/${month}/${day}`);
            if (!response.ok) {
                throw new Error('Failed to fetch memories for date');
            }
            
            memoriesData = await response.json();
            
            if (memoriesData.count === 0) {
                console.log('[MemoriesModule] No memories for this date');
                return;
            }
            
            openMemoriesView();
            
        } catch (error) {
            console.error('[MemoriesModule] Error loading memories for date:', error);
        }
    }
    
    /**
     * Close the memories view
     */
    function closeMemoriesView() {
        const modal = document.getElementById('memoriesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Render the full memories gallery with lazy loading
     */
    let allMemoriesFlattened = [];
    let currentIndex = 0;
    let isLoadingBatch = false;
    
    function renderMemoriesGallery() {
        const gallery = document.getElementById('memoriesGallery');
        if (!gallery || !memoriesData) {
            return;
        }
        
        // Reset state
        currentIndex = 0;
        isLoadingBatch = false;
        gallery.innerHTML = '';
        
        // Group memories by year
        const groupedByYear = {};
        memoriesData.memories.forEach(memory => {
            if (!groupedByYear[memory.year]) {
                groupedByYear[memory.year] = [];
            }
            groupedByYear[memory.year].push(memory);
        });
        
        // Flatten into array with year info
        allMemoriesFlattened = [];
        const years = Object.keys(groupedByYear).sort((a, b) => b - a);
        years.forEach(year => {
            const yearsAgo = new Date().getFullYear() - parseInt(year);
            const yearTitle = yearsAgo === 0 ? `${year} (Today)` : 
                            yearsAgo === 1 ? `${year} (1 year ago)` : 
                            `${year} (${yearsAgo} years ago)`;
            
            groupedByYear[year].forEach(memory => {
                allMemoriesFlattened.push({
                    ...memory,
                    yearTitle: yearTitle,
                    year: year
                });
            });
        });
        
        console.log(`[MemoriesModule] Total memories to load: ${allMemoriesFlattened.length}`);
        
        // Create main container for all photos (single grid)
        const allPhotosContainer = document.createElement('div');
        allPhotosContainer.id = 'memoriesPhotosContainer';
        allPhotosContainer.className = 'memory-photos-grid';
        gallery.appendChild(allPhotosContainer);
        
        // Create loading spinner
        const spinner = document.createElement('div');
        spinner.id = 'memoriesSpinner';
        spinner.className = 'memories-loading-spinner';
        spinner.style.display = 'none';
        spinner.innerHTML = '<div class="spinner"></div><p>Loading memories...</p>';
        gallery.appendChild(spinner);
        
        // Load first batch immediately
        loadNextBatch();
        
        // Setup scroll listener for infinite scroll
        const modal = document.getElementById('memoriesModal');
        if (modal) {
            // Remove old listener if exists
            modal.removeEventListener('scroll', handleMemoriesScroll);
            modal.addEventListener('scroll', handleMemoriesScroll);
        }
    }
    
    /**
     * Handle scroll event for lazy loading
     */
    function handleMemoriesScroll(e) {
        if (isLoadingBatch || currentIndex >= allMemoriesFlattened.length) {
            return;
        }
        
        const modal = e.target;
        const scrollTop = modal.scrollTop;
        const scrollHeight = modal.scrollHeight;
        const clientHeight = modal.clientHeight;
        
        // Load more when within 500px of bottom
        if (scrollTop + clientHeight >= scrollHeight - 500) {
            loadNextBatch();
        }
    }
    
    /**
     * Load next batch of images
     */
    function loadNextBatch() {
        if (isLoadingBatch || currentIndex >= allMemoriesFlattened.length) {
            return;
        }
        
        isLoadingBatch = true;
        const spinner = document.getElementById('memoriesSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
        
        console.log(`[MemoriesModule] Loading batch starting at index ${currentIndex}`);
        
        const container = document.getElementById('memoriesPhotosContainer');
        if (!container) return;
        
        // Get next batch
        const batch = allMemoriesFlattened.slice(currentIndex, currentIndex + BATCH_SIZE);
        let lastYear = null;
        
        batch.forEach((memory, idx) => {
            // Add year header if this is a new year
            if (memory.year !== lastYear) {
                const yearHeader = document.createElement('div');
                yearHeader.className = 'memory-year-divider';
                yearHeader.textContent = memory.yearTitle;
                container.appendChild(yearHeader);
                lastYear = memory.year;
            }
            
            // Create photo card
            const photoCard = createMemoryPhotoCard(memory);
            container.appendChild(photoCard);
        });
        
        currentIndex += batch.length;
        
        console.log(`[MemoriesModule] Loaded ${batch.length} images. Total loaded: ${currentIndex}/${allMemoriesFlattened.length}`);
        
        // Hide spinner after a short delay
        setTimeout(() => {
            if (spinner) {
                spinner.style.display = 'none';
            }
            isLoadingBatch = false;
        }, 300);
    }
    
    /**
     * Create a photo card for a memory
     */
    function createMemoryPhotoCard(memory) {
        const card = document.createElement('div');
        card.className = 'memory-photo-card';
        
        const img = document.createElement('img');
        // Use thumbnail for grid display (faster loading)
        const imagePath = memory.thumbnailPath || memory.filePath;
        img.src = `/images/${imagePath}`;
        img.alt = `Memory from ${memory.year}`;
        img.className = 'memory-photo-img';
        
        const overlay = document.createElement('div');
        overlay.className = 'memory-photo-overlay';
        
        const info = document.createElement('div');
        info.className = 'memory-photo-info';
        
        if (memory.cameraModel) {
            const camera = document.createElement('div');
            camera.className = 'memory-camera';
            camera.textContent = memory.cameraModel;
            info.appendChild(camera);
        }
        
        const source = document.createElement('div');
        source.className = 'memory-source';
        source.textContent = memory.dateSource === 'EXIF' ? '📷 EXIF Data' : 
                            memory.dateSource === 'FILE_CREATION' ? '📁 File Date' : 
                            '🕒 Modified Date';
        info.appendChild(source);
        
        overlay.appendChild(info);
        card.appendChild(img);
        card.appendChild(overlay);
        
        // Click to view full size
        card.addEventListener('click', () => {
            viewMemoryFullSize(memory);
        });
        
        return card;
    }
    
    /**
     * View a memory in full size - opens lightbox viewer
     */
    let currentLightboxIndex = 0;
    let isAutoPlaying = false;
    let autoPlayInterval = null;
    const AUTO_PLAY_INTERVAL = 3000; // 3 seconds per image
    
    function viewMemoryFullSize(memory) {
        // Find index of this memory in the flattened array
        currentLightboxIndex = allMemoriesFlattened.findIndex(m => m.id === memory.id);
        if (currentLightboxIndex === -1) {
            currentLightboxIndex = 0;
        }
        
        openLightbox();
    }
    
    /**
     * Open lightbox with current image
     */
    function openLightbox() {
        const lightbox = document.getElementById('memoriesLightbox');
        if (!lightbox) return;
        
        lightbox.style.display = 'flex';
        updateLightboxImage();
        
        // Add keyboard navigation
        document.addEventListener('keydown', handleLightboxKeyboard);
    }
    
    /**
     * Close lightbox
     */
    function closeLightbox() {
        const lightbox = document.getElementById('memoriesLightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
        }
        
        // Stop auto-play if running
        stopAutoPlay();
        
        // Remove keyboard listener
        document.removeEventListener('keydown', handleLightboxKeyboard);
    }
    
    /**
     * Toggle auto-play
     */
    function toggleAutoPlay() {
        if (isAutoPlaying) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }
    
    /**
     * Start auto-play slideshow
     */
    function startAutoPlay() {
        isAutoPlaying = true;
        const playBtn = document.getElementById('lightboxPlayBtn');
        if (playBtn) {
            playBtn.innerHTML = '⏸';
            playBtn.title = 'Pause slideshow';
            playBtn.classList.add('playing');
        }
        
        autoPlayInterval = setInterval(() => {
            if (currentLightboxIndex < allMemoriesFlattened.length - 1) {
                showNextImage();
            } else {
                // Loop back to start
                currentLightboxIndex = -1;
                showNextImage();
            }
        }, AUTO_PLAY_INTERVAL);
        
        console.log('[MemoriesModule] Auto-play started');
    }
    
    /**
     * Stop auto-play slideshow
     */
    function stopAutoPlay() {
        isAutoPlaying = false;
        const playBtn = document.getElementById('lightboxPlayBtn');
        if (playBtn) {
            playBtn.innerHTML = '▶';
            playBtn.title = 'Auto-play slideshow';
            playBtn.classList.remove('playing');
        }
        
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
        
        console.log('[MemoriesModule] Auto-play stopped');
    }
    
    /**
     * Show previous image in lightbox
     */
    function showPreviousImage() {
        // Stop auto-play when manually navigating
        if (isAutoPlaying) {
            stopAutoPlay();
        }
        
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
            updateLightboxImage();
        }
    }
    
    /**
     * Show next image in lightbox
     */
    function showNextImage() {
        if (currentLightboxIndex < allMemoriesFlattened.length - 1) {
            currentLightboxIndex++;
            updateLightboxImage();
        } else if (isAutoPlaying) {
            // If auto-playing and at end, loop back to start
            currentLightboxIndex = 0;
            updateLightboxImage();
        }
    }
    
    /**
     * Update lightbox image and info
     */
    function updateLightboxImage() {
        const memory = allMemoriesFlattened[currentLightboxIndex];
        if (!memory) return;
        
        const img = document.getElementById('lightboxImage');
        const year = document.getElementById('lightboxYear');
        const meta = document.getElementById('lightboxMeta');
        const counter = document.getElementById('lightboxCounter');
        const prevBtn = document.getElementById('lightboxPrevBtn');
        const nextBtn = document.getElementById('lightboxNextBtn');
        
        if (img) {
            img.src = `/images/${memory.filePath}`;
            img.alt = `Memory from ${memory.year}`;
        }
        
        if (year) {
            year.textContent = memory.yearTitle;
        }
        
        if (meta) {
            let metaText = '';
            if (memory.cameraModel) {
                metaText += `📷 ${memory.cameraModel}`;
            }
            if (memory.dateSource) {
                if (metaText) metaText += ' • ';
                metaText += `Source: ${memory.dateSource}`;
            }
            meta.textContent = metaText;
        }
        
        if (counter) {
            counter.textContent = `${currentLightboxIndex + 1} / ${allMemoriesFlattened.length}`;
        }
        
        // Enable/disable navigation buttons
        if (prevBtn) {
            prevBtn.disabled = currentLightboxIndex === 0;
            prevBtn.style.opacity = currentLightboxIndex === 0 ? '0.3' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentLightboxIndex === allMemoriesFlattened.length - 1;
            nextBtn.style.opacity = currentLightboxIndex === allMemoriesFlattened.length - 1 ? '0.3' : '1';
        }
    }
    
    /**
     * Handle keyboard navigation in lightbox
     */
    function handleLightboxKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
                showPreviousImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
            case ' ':
            case 'Spacebar':
                e.preventDefault(); // Prevent page scroll
                toggleAutoPlay();
                break;
            case 'Escape':
                closeLightbox();
                break;
        }
    }
    
    /**
     * Start a slideshow with all today's memories folders
     * REMOVED - No longer supported
     */
    function startMemoriesSlideshow() {
        // Removed - slideshow functionality not supported for memories
        console.log('[MemoriesModule] Slideshow functionality removed');
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Widget click
        const widget = document.getElementById('memoriesWidget');
        if (widget) {
            widget.addEventListener('click', openMemoriesView);
        }
        
        // Close button
        const closeBtn = document.getElementById('closeMemoriesBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMemoriesView);
        }
        
        // Lightbox controls
        const closeLightboxBtn = document.getElementById('closeLightboxBtn');
        if (closeLightboxBtn) {
            closeLightboxBtn.addEventListener('click', closeLightbox);
        }
        
        const prevBtn = document.getElementById('lightboxPrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', showPreviousImage);
        }
        
        const nextBtn = document.getElementById('lightboxNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', showNextImage);
        }
        
        const playBtn = document.getElementById('lightboxPlayBtn');
        if (playBtn) {
            playBtn.addEventListener('click', toggleAutoPlay);
        }
        
        // Close lightbox on background click
        const lightbox = document.getElementById('memoriesLightbox');
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    closeLightbox();
                }
            });
        }
        
        // Close on background click
        const modal = document.getElementById('memoriesModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeMemoriesView();
                }
            });
        }
    }
    
    // Public API
    return {
        init: init,
        loadTodaysMemories: loadTodaysMemories,
        openMemoriesView: openMemoriesView,
        openMemoriesForDate: openMemoriesForDate,
        closeMemoriesView: closeMemoriesView
    };
    
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MemoriesModule.init);
} else {
    MemoriesModule.init();
}

// Export for global access
window.MemoriesModule = MemoriesModule;
