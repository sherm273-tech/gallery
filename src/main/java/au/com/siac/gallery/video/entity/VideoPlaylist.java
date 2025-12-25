package au.com.siac.gallery.video.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "video_playlists")
public class VideoPlaylist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT", name = "video_paths")
    private String videoPaths;  // JSON array of video file paths
    
    @Column(name = "video_count")
    private Integer videoCount = 0;
    
    @Column(name = "total_duration")
    private Long totalDuration = 0L;  // Total duration in seconds
    
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
    public VideoPlaylist() {
    }
    
    public VideoPlaylist(String name) {
        this.name = name;
        this.videoCount = 0;
        this.totalDuration = 0L;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getVideoPaths() {
        return videoPaths;
    }
    
    public void setVideoPaths(String videoPaths) {
        this.videoPaths = videoPaths;
    }
    
    public Integer getVideoCount() {
        return videoCount;
    }
    
    public void setVideoCount(Integer videoCount) {
        this.videoCount = videoCount;
    }
    
    public Long getTotalDuration() {
        return totalDuration;
    }
    
    public void setTotalDuration(Long totalDuration) {
        this.totalDuration = totalDuration;
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
