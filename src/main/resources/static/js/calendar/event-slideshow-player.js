// Event Slideshow Player
// Handles playing slideshows from event configurations

const EventSlideshowPlayer = {
    
    async playEventSlideshow(eventId) {
        console.log('[EventSlideshowPlayer] Playing slideshow for event:', eventId);
        
        try {
            // Load slideshow configuration
            const response = await fetch(`/api/slideshow-config/event/${eventId}`);
            
            if (!response.ok) {
                alert('No slideshow configured for this event.');
                return;
            }
            
            const config = await response.json();
            console.log('[EventSlideshowPlayer] Loaded config:', config);
            
            // Validate configuration
            const selectedFolders = config.selectedFolders ? JSON.parse(config.selectedFolders) : [];
            
            if (selectedFolders.length === 0) {
                alert('No folders configured for this slideshow.');
                return;
            }
            
            // Parse configuration
            const selectedMusic = config.selectedMusic ? JSON.parse(config.selectedMusic) : [];
            
            const slideshowSettings = {
                selectedFolders: selectedFolders,
                startFolder: config.startFolder || '',
                randomize: config.randomizeImages !== false,
                shuffleAll: config.shuffleAll || false,
                speed: config.displayDuration || 5000
            };
            
            const musicSettings = {
                selectedMusic: selectedMusic,
                randomizeMusic: config.randomizeMusic || false
            };
            
            console.log('[EventSlideshowPlayer] Starting slideshow with settings:', { slideshowSettings, musicSettings });
            
            // Close calendar overlay
            const calendarOverlay = document.getElementById('calendarDisplayOverlay');
            if (calendarOverlay) {
                calendarOverlay.style.display = 'none';
            }
            
            // Start the slideshow
            await this.startConfiguredSlideshow(slideshowSettings, musicSettings);
            
        } catch (error) {
            console.error('[EventSlideshowPlayer] Error playing slideshow:', error);
            alert('Error loading slideshow configuration. Please try again.');
        }
    },
    
    async startConfiguredSlideshow(slideshowSettings, musicSettings) {
        // Check if required modules are available
        if (!window.SlideshowCore || !window.ImageCache) {
            console.error('[EventSlideshowPlayer] Slideshow modules not available');
            alert('Slideshow system is not ready. Please refresh the page.');
            return;
        }

        // Set launch source to calendar so escape returns to calendar
        window.slideshowLaunchSource = 'calendar';
        window.currentMode = 'slideshow';
        window.slideshowStarted = true;
        console.log('[EventSlideshowPlayer] Set slideshowLaunchSource to:', window.slideshowLaunchSource);
        console.log('[EventSlideshowPlayer] Set currentMode to: slideshow, slideshowStarted to: true');

        // Reset any existing session
        try {
            await fetch('/api/images/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('[EventSlideshowPlayer] Error resetting session:', error);
        }
        
        // Build the request params
        const requestParams = {
            selectedFolders: slideshowSettings.selectedFolders,
            startFolder: slideshowSettings.startFolder,
            randomize: slideshowSettings.randomize,
            shuffleAll: slideshowSettings.shuffleAll
        };
        
        console.log('[EventSlideshowPlayer] Request params:', requestParams);
        
        // Store request params globally so SlideshowCore can use them for /api/images/next calls
        window.currentRequestParams = requestParams;
        
        // Initialize the session by calling /api/images/list
        let imageList;
        try {
            const response = await fetch('/api/images/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestParams)
            });
            
            if (!response.ok) {
                throw new Error('Failed to load images');
            }
            
            imageList = await response.json();
            console.log('[EventSlideshowPlayer] Loaded images:', imageList.length);
            
            if (imageList.length === 0) {
                alert('No images found in selected folders.');
                return;
            }
        } catch (error) {
            console.error('[EventSlideshowPlayer] Error loading images:', error);
            alert('Failed to load images. Please try again.');
            return;
        }
        
        // Prepare UI - hide controls, menus, and calendar
        const controls = document.getElementById('controls');
        const initialMenu = document.getElementById('initialMenu');
        const mirrorOverlay = document.getElementById('mirrorOverlay');
        const calendarOverlay = document.getElementById('calendarDisplayOverlay');
        const calendarMirror = document.getElementById('calendarMirrorOverlay');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (controls) controls.classList.add('hidden');
        if (initialMenu) initialMenu.classList.add('hidden');
        if (mirrorOverlay) mirrorOverlay.classList.add('hidden');
        if (calendarOverlay) calendarOverlay.classList.remove('active');
        if (calendarMirror) calendarMirror.classList.add('hidden');
        console.log('[EventSlideshowPlayer] Hidden calendar overlay and mirror');
        
        // Show loading
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
            if (loadingText) loadingText.textContent = 'Preloading images...';
        }
        
        // Activate slideshow mode
        document.body.classList.add('slideshow-active');
        document.body.style.cursor = 'none';
        
        // Request fullscreen and wake lock
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
        } catch (err) {
            console.log('[EventSlideshowPlayer] Fullscreen request failed:', err);
        }
        
        try {
            // Initialize SlideshowCore DOM elements
            if (typeof SlideshowCore.init === 'function') {
                SlideshowCore.init();
            }
            
            // Preload initial batch of images
            const preloadCount = Math.min(20, imageList.length);
            const toPreload = imageList.slice(0, preloadCount);
            
            console.log('[EventSlideshowPlayer] Preloading', preloadCount, 'images...');
            await ImageCache.preloadImages(toPreload);
            console.log('[EventSlideshowPlayer] Preload complete');
            
            // Hide loading
            if (loadingOverlay) {
                loadingOverlay.classList.remove('active');
            }
            
            // Show slideshow
            SlideshowCore.show();
            
            // Manually start the slideshow by calling the internal displayNext function
            // We need to trigger the slideshow manually since we bypassed SlideshowCore.start()
            
            // Get the slideshow image element
            const imgEl = document.getElementById('slideshow');
            if (!imgEl) {
                throw new Error('Slideshow image element not found');
            }
            
            // Function to display next image (mimics SlideshowCore's internal displayNext)
            const displayNextImage = async () => {
                try {
                    const response = await fetch('/api/images/next', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestParams)
                    });
                    
                    const data = await response.json();
                    
                    if (data && data.image) {
                        const imageUrl = '/images/' + encodeURIComponent(data.image);
                        
                        // Use ImageCache if available
                        if (ImageCache && ImageCache.loadAndDisplay) {
                            await ImageCache.loadAndDisplay(data.image, imgEl);
                        } else {
                            // Fallback: direct load
                            imgEl.src = imageUrl;
                        }
                        
                        console.log('[EventSlideshowPlayer] Displayed image:', data.image);
                    }
                } catch (error) {
                    console.error('[EventSlideshowPlayer] Error displaying next image:', error);
                }
            };
            
            // Display first image immediately
            await displayNextImage();
            
            // Set up interval for subsequent images
            const intervalId = setInterval(displayNextImage, slideshowSettings.speed);
            
            // Store interval ID globally so it can be stopped if needed
            window.slideshowIntervalId = intervalId;
            
            console.log('[EventSlideshowPlayer] Slideshow started successfully with', slideshowSettings.speed, 'ms interval');
            
            // Start music if configured
            if (musicSettings.selectedMusic && musicSettings.selectedMusic.length > 0) {
                this.startMusic(musicSettings);
            }
            
        } catch (error) {
            console.error('[EventSlideshowPlayer] Error starting slideshow:', error);
            alert('Failed to start slideshow. Please try again.');
            
            // Hide loading
            if (loadingOverlay) {
                loadingOverlay.classList.remove('active');
            }
            
            // Reset state
            document.body.classList.remove('slideshow-active');
            document.body.style.cursor = 'default';
            if (controls) controls.classList.remove('hidden');
        }
    },
    
    startMusic(musicSettings) {
        // Get audio element
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) {
            console.error('[EventSlideshowPlayer] Audio player not available');
            return;
        }
        
        // Prepare playlist
        let playlist = [...musicSettings.selectedMusic];
        
        if (musicSettings.randomizeMusic) {
            // Shuffle playlist
            for (let i = playlist.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
            }
        }
        
        console.log('[EventSlideshowPlayer] Starting music with', playlist.length, 'tracks');
        
        // Use MusicPlayer if available
        if (window.MusicPlayer && typeof MusicPlayer.loadPlaylist === 'function') {
            MusicPlayer.loadPlaylist(playlist);
            MusicPlayer.play();
        } else {
            // Fallback: play first track directly
            if (playlist.length > 0) {
                audioPlayer.src = '/music/' + encodeURIComponent(playlist[0]);
                audioPlayer.play().catch(err => {
                    console.error('[EventSlideshowPlayer] Error playing music:', err);
                });
            }
        }
        
        // DO NOT show music player overlay for event slideshows
        // Music plays in the background while slideshow is displayed
        console.log('[EventSlideshowPlayer] Music started (background mode)');
    }
};

// Make globally available
window.EventSlideshowPlayer = EventSlideshowPlayer;
