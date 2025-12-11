// ===== IMAGE CACHE MODULE =====
// Handles image preloading, caching, and cache management

const ImageCache = (() => {
    // ===== PRIVATE VARIABLES =====
    const cache = new Map();
    const PRELOAD_COUNT = 20;
    const MAX_CACHE_SIZE = 50;
    const MIN_CACHE_SIZE = 15;
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Preload a single image
     * @param {string} imagePath - Relative path to image
     * @returns {Promise<HTMLImageElement>} Loaded image element
     */
    function preloadSingleImage(imagePath) {
        return new Promise((resolve, reject) => {
            const url = "/images/" + imagePath;
            
            // Return cached if exists
            if (cache.has(url)) {
                resolve(cache.get(url));
                return;
            }
            
            const img = new Image();
            
            img.onload = () => {
                cache.set(url, img);
                console.log('✅ Preloaded:', imagePath);
                resolve(img);
            };
            
            img.onerror = () => {
                console.error('❌ Failed to preload:', imagePath);
                reject(new Error('Failed to load: ' + imagePath));
            };
            
            img.src = url;
        });
    }
    
    /**
     * Clean old cached images when cache is too large
     */
    function cleanCache() {
        if (cache.size <= MAX_CACHE_SIZE) return;
        
        const keysToDelete = [];
        let count = 0;
        
        for (const key of cache.keys()) {
            if (count++ < cache.size - MIN_CACHE_SIZE) {
                keysToDelete.push(key);
            } else {
                break;
            }
        }
        
        keysToDelete.forEach(key => cache.delete(key));
        console.log(`🗑️ Cleaned cache: removed ${keysToDelete.length} images, ${cache.size} remaining`);
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Preload multiple images
     * @param {Array<string>} imagePaths - Array of image paths
     * @returns {Promise<Array>} Promise that resolves when all images loaded
     */
    async function preloadImages(imagePaths) {
        if (!imagePaths || imagePaths.length === 0) {
            return [];
        }
        
        console.log(`📥 Preloading ${imagePaths.length} images...`);
        
        const promises = imagePaths.map(path => 
            preloadSingleImage(path).catch(err => {
                console.warn('Skipped image:', path);
                return null;
            })
        );
        
        const results = await Promise.all(promises);
        console.log(`✅ Preloaded ${results.filter(r => r !== null).length}/${imagePaths.length} images`);
        
        return results.filter(r => r !== null);
    }
    
    /**
     * Get image from cache
     * @param {string} imagePath - Relative path to image
     * @returns {HTMLImageElement|null} Cached image or null
     */
    function get(imagePath) {
        const url = "/images/" + imagePath;
        return cache.get(url) || null;
    }
    
    /**
     * Check if image is in cache
     * @param {string} imagePath - Relative path to image
     * @returns {boolean} True if image is cached
     */
    function has(imagePath) {
        const url = "/images/" + imagePath;
        return cache.has(url);
    }
    
    /**
     * Add image to cache
     * @param {string} imagePath - Relative path to image
     * @param {HTMLImageElement} img - Image element
     */
    function set(imagePath, img) {
        const url = "/images/" + imagePath;
        cache.set(url, img);
    }
    
    /**
     * Get cache size
     * @returns {number} Number of cached images
     */
    function size() {
        return cache.size;
    }
    
    /**
     * Clear entire cache
     */
    function clear() {
        cache.clear();
        console.log('🗑️ Cache cleared');
    }
    
    /**
     * Clean cache if it's too large
     */
    function clean() {
        cleanCache();
    }
    
    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    function getStats() {
        return {
            size: cache.size,
            maxSize: MAX_CACHE_SIZE,
            minSize: MIN_CACHE_SIZE,
            preloadCount: PRELOAD_COUNT
        };
    }
    
    /**
     * Load image with async/await (for display)
     * @param {string} imagePath - Relative path to image
     * @param {HTMLImageElement} imgElement - Image element to update
     * @returns {Promise<void>}
     */
    async function loadAndDisplay(imagePath, imgElement) {
        const url = "/images/" + imagePath;
        
        imgElement.classList.remove('loaded');
        
        if (cache.has(url)) {
            // Use cached image
            const cachedImg = cache.get(url);
            imgElement.src = cachedImg.src;
            
            setTimeout(() => {
                imgElement.classList.add('loaded');
            }, 50);
            
            return;
        }
        
        // Load new image
        try {
            const img = await preloadSingleImage(imagePath);
            imgElement.src = img.src;
            
            setTimeout(() => {
                imgElement.classList.add('loaded');
            }, 50);
        } catch (err) {
            // Fallback - display directly
            imgElement.src = url;
            imgElement.classList.add('loaded');
            throw err;
        }
    }
    
    // Return public API
    return {
        preloadImages,
        get,
        has,
        set,
        size,
        clear,
        clean,
        getStats,
        loadAndDisplay,
        // Constants
        get PRELOAD_COUNT() { return PRELOAD_COUNT; },
        get MAX_CACHE_SIZE() { return MAX_CACHE_SIZE; },
        get MIN_CACHE_SIZE() { return MIN_CACHE_SIZE; }
    };
})();

console.log('✅ Image Cache module loaded');
