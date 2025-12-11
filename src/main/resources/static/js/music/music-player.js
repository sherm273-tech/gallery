// ===== MUSIC PLAYER MODULE =====
// Handles music playback, UI controls, time display, volume, and progress

const MusicPlayer = (() => {
    // ===== PRIVATE VARIABLES =====
    let currentIndex = 0;
    let playlist = [];
    let playing = false;
    
    // DOM Elements
    let audioPlayer;
    let playPauseBtn;
    let prevBtn;
    let nextBtn;
    let volumeSlider;
    let volumeValue;
    let trackTitle;
    let currentTime;
    let duration;
    let progressBar;
    let progressFill;
    let playlistPosition;
    let musicPlayerOverlay;
    let closePlayerBtn;
    let editPlaylistBtn;
    
    // ===== PRIVATE FUNCTIONS =====
    
    /**
     * Initialize DOM references
     */
    function initializeDOM() {
        audioPlayer = document.getElementById('audioPlayer');
        playPauseBtn = document.getElementById('playPauseBtn');
        prevBtn = document.getElementById('prevBtn');
        nextBtn = document.getElementById('nextBtn');
        volumeSlider = document.getElementById('volumeSlider');
        volumeValue = document.getElementById('volumeValue');
        trackTitle = document.getElementById('trackTitle');
        currentTime = document.getElementById('currentTime');
        duration = document.getElementById('duration');
        progressBar = document.getElementById('progressBar');
        progressFill = document.getElementById('progressFill');
        playlistPosition = document.getElementById('playlistPosition');
        musicPlayerOverlay = document.getElementById('musicPlayerOverlay');
        closePlayerBtn = document.getElementById('closePlayerBtn');
        editPlaylistBtn = document.getElementById('editPlaylistBtn');
    }
    
    /**
     * Update player UI (track title, play/pause button, position)
     */
    function updateUI() {
        if (playlist.length === 0) return;
        
        const currentTrack = playlist[currentIndex];
        trackTitle.textContent = currentTrack;
        playlistPosition.textContent = `Track ${currentIndex + 1} of ${playlist.length}`;
        
        if (playing) {
            playPauseBtn.textContent = '⏸';
        } else {
            playPauseBtn.textContent = '▶';
        }
    }
    
    /**
     * Load and play track at current index
     */
    function loadTrack() {
        if (playlist.length === 0) return;
        
        const track = playlist[currentIndex];
        audioPlayer.src = '/music/' + track;
        audioPlayer.load();
        audioPlayer.play().then(() => {
            playing = true;
            updateUI();
        }).catch(err => console.error('Audio play error:', err));
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Audio metadata loaded
        audioPlayer.addEventListener('loadedmetadata', () => {
            console.log('Audio loaded:', audioPlayer.duration);
            if (duration && audioPlayer.duration) {
                duration.textContent = formatMusicTime(audioPlayer.duration);
            }
        });
        
        // Time update (progress)
        audioPlayer.addEventListener('timeupdate', () => {
            if (currentTime && audioPlayer.currentTime) {
                currentTime.textContent = formatMusicTime(audioPlayer.currentTime);
            }
            
            if (progressFill && audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = progress + '%';
            }
        });
        
        // Audio starts playing
        audioPlayer.addEventListener('play', () => {
            if (duration && audioPlayer.duration) {
                duration.textContent = formatMusicTime(audioPlayer.duration);
            }
        });
        
        // Audio paused
        audioPlayer.addEventListener('pause', () => {
            if (currentTime && audioPlayer.currentTime) {
                currentTime.textContent = formatMusicTime(audioPlayer.currentTime);
            }
        });
        
        // Audio ended - play next track
        audioPlayer.addEventListener('ended', () => {
            next();
        });
        
        // Progress bar click - seek
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = percent * audioPlayer.duration;
        });
        
        // Volume slider
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audioPlayer.volume = volume;
            volumeValue.textContent = e.target.value + '%';
        });
        
        // Play/Pause button
        playPauseBtn.addEventListener('click', () => {
            if (playing) {
                pause();
            } else {
                play();
            }
        });
        
        // Previous button
        prevBtn.addEventListener('click', () => {
            prev();
        });
        
        // Next button
        nextBtn.addEventListener('click', () => {
            next();
        });
        
        // Close button
        closePlayerBtn.addEventListener('click', () => {
            close();
        });
        
        // Edit playlist button
        editPlaylistBtn.addEventListener('click', () => {
            hide();
            
            // Update button text based on playback state
            const startButtonText = document.getElementById('startButtonText');
            if (startButtonText) {
                if (playing) {
                    startButtonText.textContent = 'Save & Return to Player';
                } else {
                    startButtonText.textContent = 'Start Music Player';
                }
            }
            
            // Trigger tab switch
            const musicTab = document.querySelector('.tab-button[data-tab="music"]');
            if (musicTab) musicTab.click();
        });
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize the music player module
     */
    function init() {
        initializeDOM();
        setupEventListeners();
        console.log('✅ Music Player module initialized');
    }
    
    /**
     * Set the playlist
     * @param {Array<string>} tracks - Array of music file names
     */
    function setPlaylist(tracks) {
        playlist = tracks;
        currentIndex = 0;
        playing = false;
        console.log(`🎵 Playlist set: ${tracks.length} tracks`);
    }
    
    /**
     * Update the playlist while preserving playback state
     * @param {Array<string>} tracks - Array of music file names
     */
    function updatePlaylist(tracks) {
        const currentTrack = playlist[currentIndex];
        const wasPlaying = playing;
        
        playlist = tracks;
        console.log(`🎵 Playlist updated: ${tracks.length} tracks`);
        
        // Try to find the current track in the new playlist
        const newIndex = tracks.indexOf(currentTrack);
        
        if (newIndex !== -1) {
            // Current track still exists in new playlist
            currentIndex = newIndex;
            console.log(`✅ Continuing playback at track ${currentIndex + 1}: ${currentTrack}`);
        } else {
            // Current track was removed, keep current index if valid
            if (currentIndex >= tracks.length) {
                currentIndex = Math.max(0, tracks.length - 1);
            }
            console.log(`⚠️ Current track removed, switching to track ${currentIndex + 1}`);
            
            // Load the new track if music was playing
            if (wasPlaying && tracks.length > 0) {
                loadTrack();
            }
        }
        
        updateUI();
    }
    
    /**
     * Play current track or resume if paused
     */
    function play() {
        if (playlist.length === 0) {
            console.warn('⚠️ No tracks in playlist');
            return;
        }
        
        if (audioPlayer.paused) {
            audioPlayer.play().then(() => {
                playing = true;
                updateUI();
            }).catch(err => console.error('Audio play error:', err));
        }
    }
    
    /**
     * Pause playback
     */
    function pause() {
        audioPlayer.pause();
        playing = false;
        updateUI();
    }
    
    /**
     * Go to next track
     */
    function next() {
        if (playlist.length === 0) return;
        currentIndex = (currentIndex + 1) % playlist.length;
        loadTrack();
        updateUI();
    }
    
    /**
     * Go to previous track
     */
    function prev() {
        if (playlist.length === 0) return;
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadTrack();
        updateUI();
    }
    
    /**
     * Start playing from beginning of playlist
     */
    function start() {
        if (playlist.length === 0) {
            console.warn('⚠️ Cannot start: No tracks in playlist');
            return;
        }
        currentIndex = 0;
        loadTrack();
    }
    
    /**
     * Show music player overlay
     */
    function show() {
        if (musicPlayerOverlay) {
            musicPlayerOverlay.classList.add('active');
        }
    }
    
    /**
     * Hide music player overlay
     */
    function hide() {
        if (musicPlayerOverlay) {
            musicPlayerOverlay.classList.remove('active');
        }
        const controls = document.getElementById('controls');
        if (controls) {
            controls.classList.remove('hidden');
        }
    }
    
    /**
     * Close player and stop playback
     */
    function close() {
        hide();
        audioPlayer.pause();
        playing = false;
        
        // Return to initial menu if in music-only mode
        const currentModeCheck = window.currentMode;
        if (currentModeCheck === 'music') {
            const initialMenu = document.getElementById('initialMenu');
            if (initialMenu) {
                initialMenu.classList.remove('hidden');
            }
        }
    }
    
    /**
     * Get current playing status
     * @returns {boolean} True if currently playing
     */
    function isPlaying() {
        return playing;
    }
    
    /**
     * Get current track name
     * @returns {string|null} Current track filename or null
     */
    function getCurrentTrack() {
        if (playlist.length === 0) return null;
        return playlist[currentIndex];
    }
    
    /**
     * Get playlist length
     * @returns {number} Number of tracks in playlist
     */
    function getPlaylistLength() {
        return playlist.length;
    }
    
    // Return public API
    return {
        init,
        setPlaylist,
        updatePlaylist,
        play,
        pause,
        next,
        prev,
        start,
        show,
        hide,
        close,
        isPlaying,
        getCurrentTrack,
        getPlaylistLength
    };
})();

console.log('✅ Music Player module loaded');
