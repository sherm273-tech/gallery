package au.com.siac.gallery.memories.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "photo_metadata", indexes = {
    @Index(name = "idx_month_day", columnList = "photo_month,photo_day"),
    @Index(name = "idx_capture_date", columnList = "capture_date")
})
public class PhotoMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 500)
    private String filePath;
    
    @Column(name = "thumbnail_path", length = 500)
    private String thumbnailPath;
    
    @Column(name = "capture_date")
    private LocalDate captureDate;
    
    @Column(name = "date_source", length = 20)
    private String dateSource;  // 'EXIF', 'FILE_CREATION', 'FILE_MODIFIED', 'FILENAME'
    
    // Renamed columns to avoid H2 reserved keywords
    @Column(name = "photo_year")
    private Integer year;
    
    @Column(name = "photo_month")
    private Integer month;
    
    @Column(name = "photo_day")
    private Integer day;
    
    @Column(name = "camera_model", length = 100)
    private String cameraModel;
    
    @Column(name = "last_scanned")
    private LocalDateTime lastScanned;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    // Video-specific fields (null for images)
    @Column(name = "media_type", length = 10)
    private String mediaType = "IMAGE";  // 'IMAGE' or 'VIDEO'
    
    @Column(name = "video_duration")
    private Integer videoDuration;  // Duration in seconds (null for images)
    
    @Column(name = "video_resolution", length = 20)
    private String videoResolution;  // e.g., "1920x1080" (null for images)
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastScanned = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastScanned = LocalDateTime.now();
    }
    
    // Constructors
    public PhotoMetadata() {
    }
    
    public PhotoMetadata(String filePath, LocalDate captureDate, String dateSource) {
        this.filePath = filePath;
        this.captureDate = captureDate;
        this.dateSource = dateSource;
        if (captureDate != null) {
            this.year = captureDate.getYear();
            this.month = captureDate.getMonthValue();
            this.day = captureDate.getDayOfMonth();
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    
    public String getThumbnailPath() {
        return thumbnailPath;
    }
    
    public void setThumbnailPath(String thumbnailPath) {
        this.thumbnailPath = thumbnailPath;
    }
    
    public LocalDate getCaptureDate() {
        return captureDate;
    }
    
    public void setCaptureDate(LocalDate captureDate) {
        this.captureDate = captureDate;
        if (captureDate != null) {
            this.year = captureDate.getYear();
            this.month = captureDate.getMonthValue();
            this.day = captureDate.getDayOfMonth();
        }
    }
    
    public String getDateSource() {
        return dateSource;
    }
    
    public void setDateSource(String dateSource) {
        this.dateSource = dateSource;
    }
    
    public Integer getYear() {
        return year;
    }
    
    public void setYear(Integer year) {
        this.year = year;
    }
    
    public Integer getMonth() {
        return month;
    }
    
    public void setMonth(Integer month) {
        this.month = month;
    }
    
    public Integer getDay() {
        return day;
    }
    
    public void setDay(Integer day) {
        this.day = day;
    }
    
    public String getCameraModel() {
        return cameraModel;
    }
    
    public void setCameraModel(String cameraModel) {
        this.cameraModel = cameraModel;
    }
    
    public LocalDateTime getLastScanned() {
        return lastScanned;
    }
    
    public void setLastScanned(LocalDateTime lastScanned) {
        this.lastScanned = lastScanned;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
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
    
    public String getMediaType() {
        return mediaType;
    }
    
    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }
    
    public Integer getVideoDuration() {
        return videoDuration;
    }
    
    public void setVideoDuration(Integer videoDuration) {
        this.videoDuration = videoDuration;
    }
    
    public String getVideoResolution() {
        return videoResolution;
    }
    
    public void setVideoResolution(String videoResolution) {
        this.videoResolution = videoResolution;
    }
    
    public boolean isVideo() {
        return "VIDEO".equals(mediaType);
    }
}
