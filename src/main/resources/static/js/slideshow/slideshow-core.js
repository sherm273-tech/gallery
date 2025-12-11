// ===== SLIDESHOW CORE MODULE =====
// Handles slideshow playback, image display, and control

const SlideshowCore = (() => {
    // ===== PRIVATE VARIABLES =====
    let intervalId = null;
    let isPaused = false;
    let started = false;
    let delay = 5000;
    let imageHistory = [];
    let totalImages = 0;
    let currentRequestParams = null;
    
    // DOM Elements
    let imgEl;
    let loadingOverlay;
    let loadingText;
    let controls;
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Initialize DOM references
     */
    function initializeDOM() {
        imgEl = document.getElementById('slideshow');
        loadingOverlay = document.getElementById('loadingOverlay');
        loadingText = document.getElementById('loadingText');
        controls = document.getElementById('controls');
    }
    
    /**
     * Fetch next image from server
     * @returns {Promise<Object>} Next image data
     */
    async function fetchNextImage() {
        try {
            const response = await fetch('/api/images/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentRequestParams)
            });
            
            const data = await response.json();
            
            if (data.cycleComplete) {
                imageHistory = [];
                console.log('🔄 Cycle complete, starting over');
            }
            
            return data;
        } catch (err) {
            console.error('❌ Error fetching next image:', err);
            return null;
        }
    }
    
    /**
     * Preload next batch of images
     * @param {number} currentIndex - Current image index
     * @param {number} total - Total images
     */
    async function preloadNextBatch(currentIndex, total) {
        if (ImageCache.size() >= ImageCache.MIN_CACHE_SIZE) return;
        
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
                await ImageCache.preloadImages(upcomingImages);
            }
        } catch (err) {
            console.log('⚠️ Background preload skipped:', err.message);
        }
    }
    
    /**
     * Display next image
     */
    async function displayNext() {
        try {
            const data = await fetchNextImage();
            
            if (!data || !data.image) {
                console.warn('⚠️ No image data returned');
                return;
            }
            
            imageHistory.push(data.image);
            await ImageCache.loadAndDisplay(data.image, imgEl);
            
            // Preload next batch
            preloadNextBatch(data.totalShown, data.totalImages);
            
            // Clean cache if needed
            ImageCache.clean();
            
        } catch (err) {
            console.error('❌ Error displaying next image:', err);
        }
    }
    
    /**
     * Display previous image from history
     */
    function displayPrevious() {
        if (imageHistory.length > 1) {
            imageHistory.pop(); // Remove current
            const prevImage = imageHistory[imageHistory.length - 1];
            
            const url = "/images/" + prevImage;
            imgEl.src = url;
            
            console.log('⬅️ Previous image:', prevImage);
        } else {
            console.log('⚠️ No previous image in history');
        }
    }
    
    /**
     * Initialize slideshow (preload initial images)
     */
    async function initialize() {
        currentRequestParams = FolderManager.getConfig();
        
        try {
            const response = await fetch('/api/images/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentRequestParams)
            });
            
            const initialImages = await response.json();
            totalImages = initialImages.length;
            
            console.log(`📚 Total images: ${totalImages}`);
            
            // Preload initial batch
            const toPreload = initialImages.slice(0, ImageCache.PRELOAD_COUNT);
            await ImageCache.preloadImages(toPreload);
            
            return totalImages;
        } catch (err) {
            console.error('❌ Error initialising slideshow:', err);
            throw err;
        }
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize the slideshow module
     */
    function init() {
        initializeDOM();
        console.log('✅ Slideshow Core module initialized');
    }
    
    /**
     * Start slideshow
     * @param {number} speed - Delay between images in milliseconds
     * @returns {Promise<void>}
     */
    async function start(speed = 5000) {
        if (started) {
            console.warn('⚠️ Slideshow already started');
            return;
        }
        
        delay = speed;
        
        // Show loading
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
            if (loadingText) loadingText.textContent = 'Initialising slideshow...';
        }
        
        try {
            // Initialize and preload
            const total = await initialize();
            
            // Monitor preload progress
            let checkCount = 0;
            const checkInterval = setInterval(() => {
                const cached = ImageCache.size();
                const target = Math.min(ImageCache.PRELOAD_COUNT, total);
                
                if (loadingText) {
                    loadingText.textContent = `Preloading images... (${cached}/${target})`;
                }
                
                if (cached >= target || cached >= total || checkCount++ > 50) {
                    clearInterval(checkInterval);
                    
                    // Hide loading
                    if (loadingOverlay) loadingOverlay.classList.remove('active');
                    
                    // Start slideshow
                    if (total > 0) {
                        started = true;
                        imageHistory = [];
                        
                        // Display first image
                        displayNext().then(() => {
                            // Start interval
                            intervalId = setInterval(displayNext, delay);
                            console.log(`▶️ Slideshow started (${delay}ms delay)`);
                        });
                    } else {
                        console.warn('⚠️ No images to display');
                    }
                }
            }, 100);
            
        } catch (err) {
            console.error('❌ Failed to start slideshow:', err);
            if (loadingOverlay) loadingOverlay.classList.remove('active');
            throw err;
        }
    }
    
    /**
     * Stop slideshow
     */
    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        
        isPaused = false;
        started = false;
        imageHistory = [];
        
        console.log('⏹️ Slideshow stopped');
    }
    
    /**
     * Pause slideshow
     */
    function pause() {
        if (!started) return;
        
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        
        isPaused = true;
        console.log('⏸️ Slideshow paused');
    }
    
    /**
     * Resume slideshow
     */
    function resume() {
        if (!started || !isPaused) return;
        
        intervalId = setInterval(displayNext, delay);
        isPaused = false;
        console.log('▶️ Slideshow resumed');
    }
    
    /**
     * Toggle pause/resume
     */
    function togglePause() {
        if (isPaused) {
            resume();
        } else {
            pause();
        }
    }
    
    /**
     * Go to next image (manual)
     */
    async function next() {
        await displayNext();
    }
    
    /**
     * Go to previous image (manual)
     */
    function previous() {
        displayPrevious();
    }
    
    /**
     * Check if slideshow is started
     * @returns {boolean} True if started
     */
    function isStarted() {
        return started;
    }
    
    /**
     * Check if slideshow is paused
     * @returns {boolean} True if paused
     */
    function isPausedState() {
        return isPaused;
    }
    
    /**
     * Get current delay
     * @returns {number} Delay in milliseconds
     */
    function getDelay() {
        return delay;
    }
    
    /**
     * Set delay
     * @param {number} newDelay - New delay in milliseconds
     */
    function setDelay(newDelay) {
        delay = newDelay;
        
        // Restart interval if running
        if (started && !isPaused && intervalId) {
            clearInterval(intervalId);
            intervalId = setInterval(displayNext, delay);
            console.log(`⏱️ Delay changed to ${delay}ms`);
        }
    }
    
    /**
     * Show slideshow image element
     */
    function show() {
        if (imgEl) {
            document.body.classList.add('slideshow-active');
        }
        if (controls) {
            controls.classList.add('hidden');
        }
    }
    
    /**
     * Hide slideshow image element
     */
    function hide() {
        if (imgEl) {
            document.body.classList.remove('slideshow-active');
        }
        if (controls) {
            controls.classList.remove('hidden');
        }
    }
    
    /**
     * Get slideshow stats
     * @returns {Object} Stats object
     */
    function getStats() {
        return {
            started,
            paused: isPaused,
            delay,
            totalImages,
            historyLength: imageHistory.length,
            cacheSize: ImageCache.size()
        };
    }
    
    // Return public API
    return {
        init,
        start,
        stop,
        pause,
        resume,
        togglePause,
        next,
        previous,
        isStarted,
        isPaused: isPausedState,
        getDelay,
        setDelay,
        show,
        hide,
        getStats
    };
})();

console.log('✅ Slideshow Core module loaded');
