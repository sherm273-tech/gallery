package au.com.siac.gallery.slideshow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "slideshow_configurations")
public class SlideshowConfiguration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(name = "event_id", unique = true)
    private Long eventId;
    
    @Column(columnDefinition = "TEXT", name = "selected_folders")
    private String selectedFolders;  // JSON array of folder paths
    
    @Column(columnDefinition = "TEXT", name = "selected_music")
    private String selectedMusic;  // JSON array of music file paths
    
    @Column(name = "shuffle_all")
    private Boolean shuffleAll = false;
    
    @Column(name = "randomize_images")
    private Boolean randomizeImages = true;
    
    @Column(name = "randomize_music")
    private Boolean randomizeMusic = false;
    
    @Column(name = "start_folder")
    private String startFolder;
    
    @Column(name = "display_duration")
    private Integer displayDuration = 5000;  // milliseconds
    
    @Column(name = "mute_music_during_video")
    private Boolean muteMusicDuringVideo = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public SlideshowConfiguration() {
    }
    
    public SlideshowConfiguration(Long eventId) {
        this.eventId = eventId;
        this.shuffleAll = false;
        this.randomizeImages = true;
        this.randomizeMusic = false;
        this.displayDuration = 5000;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getEventId() {
        return eventId;
    }
    
    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }
    
    public String getSelectedFolders() {
        return selectedFolders;
    }
    
    public void setSelectedFolders(String selectedFolders) {
        this.selectedFolders = selectedFolders;
    }
    
    public String getSelectedMusic() {
        return selectedMusic;
    }
    
    public void setSelectedMusic(String selectedMusic) {
        this.selectedMusic = selectedMusic;
    }
    
    public Boolean getShuffleAll() {
        return shuffleAll;
    }
    
    public void setShuffleAll(Boolean shuffleAll) {
        this.shuffleAll = shuffleAll;
    }
    
    public Boolean getRandomizeImages() {
        return randomizeImages;
    }
    
    public void setRandomizeImages(Boolean randomizeImages) {
        this.randomizeImages = randomizeImages;
    }
    
    public Boolean getRandomizeMusic() {
        return randomizeMusic;
    }
    
    public void setRandomizeMusic(Boolean randomizeMusic) {
        this.randomizeMusic = randomizeMusic;
    }
    
    public String getStartFolder() {
        return startFolder;
    }
    
    public void setStartFolder(String startFolder) {
        this.startFolder = startFolder;
    }
    
    public Integer getDisplayDuration() {
        return displayDuration;
    }
    
    public void setDisplayDuration(Integer displayDuration) {
        this.displayDuration = displayDuration;
    }
    
    public Boolean getMuteMusicDuringVideo() {
        return muteMusicDuringVideo;
    }
    
    public void setMuteMusicDuringVideo(Boolean muteMusicDuringVideo) {
        this.muteMusicDuringVideo = muteMusicDuringVideo;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
