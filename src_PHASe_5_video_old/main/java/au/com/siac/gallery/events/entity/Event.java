package au.com.siac.gallery.events.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, name = "event_start_datetime")
    private LocalDateTime eventStartDatetime;
    
    @Column(name = "event_end_datetime")
    private LocalDateTime eventEndDatetime;
    
    @Column(nullable = false, length = 50, name = "event_type")
    private String eventType;  // 'appointment', 'birthday', 'bill', 'reminder', 'holiday', 'other'
    
    @Column(nullable = false)
    private Boolean recurring = false;
    
    @Column(length = 50, name = "recurrence_pattern")
    private String recurrencePattern;  // 'daily', 'weekly', 'monthly', 'yearly'
    
    // Notification settings
    @Column(nullable = false, name = "notifications_enabled")
    private Boolean notificationsEnabled = false;
    
    @Column(name = "notification_timings", columnDefinition = "TEXT")
    private String notificationTimings;  // JSON array: ["1_week_before", "1_day_before", "1_hour_before"]
    
    @Column(nullable = false, name = "notify_browser")
    private Boolean notifyBrowser = true;
    
    @Column(nullable = false, name = "notify_email")
    private Boolean notifyEmail = false;
    
    @Column(nullable = false, name = "notify_sms")
    private Boolean notifySms = false;
    
    @Column(nullable = false)
    private Boolean completed = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Transient
    private Boolean hasSlideshowConfig = false;
    
    // Slideshow video settings
    @Column(nullable = false, name = "mute_music_during_video")
    private Boolean muteMusicDuringVideo = true;
    
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
    public Event() {
    }
    
    public Event(String title, String description, LocalDateTime eventStartDatetime, String eventType) {
        this.title = title;
        this.description = description;
        this.eventStartDatetime = eventStartDatetime;
        this.eventType = eventType;
        this.recurring = false;
        this.notificationsEnabled = false;
        this.notifyBrowser = true;
        this.notifyEmail = false;
        this.notifySms = false;
        this.completed = false;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDateTime getEventStartDatetime() {
        return eventStartDatetime;
    }
    
    public void setEventStartDatetime(LocalDateTime eventStartDatetime) {
        this.eventStartDatetime = eventStartDatetime;
    }
    
    public LocalDateTime getEventEndDatetime() {
        return eventEndDatetime;
    }
    
    public void setEventEndDatetime(LocalDateTime eventEndDatetime) {
        this.eventEndDatetime = eventEndDatetime;
    }
    
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public Boolean getRecurring() {
        return recurring;
    }
    
    public void setRecurring(Boolean recurring) {
        this.recurring = recurring;
    }
    
    public String getRecurrencePattern() {
        return recurrencePattern;
    }
    
    public void setRecurrencePattern(String recurrencePattern) {
        this.recurrencePattern = recurrencePattern;
    }
    
    public Boolean getNotificationsEnabled() {
        return notificationsEnabled;
    }
    
    public void setNotificationsEnabled(Boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }
    
    public String getNotificationTimings() {
        return notificationTimings;
    }
    
    public void setNotificationTimings(String notificationTimings) {
        this.notificationTimings = notificationTimings;
    }
    
    public Boolean getNotifyBrowser() {
        return notifyBrowser;
    }
    
    public void setNotifyBrowser(Boolean notifyBrowser) {
        this.notifyBrowser = notifyBrowser;
    }
    
    public Boolean getNotifyEmail() {
        return notifyEmail;
    }
    
    public void setNotifyEmail(Boolean notifyEmail) {
        this.notifyEmail = notifyEmail;
    }
    
    public Boolean getNotifySms() {
        return notifySms;
    }
    
    public void setNotifySms(Boolean notifySms) {
        this.notifySms = notifySms;
    }
    
    public Boolean getCompleted() {
        return completed;
    }
    
    public void setCompleted(Boolean completed) {
        this.completed = completed;
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
    
    public Boolean getHasSlideshowConfig() {
        return hasSlideshowConfig;
    }
    
    public void setHasSlideshowConfig(Boolean hasSlideshowConfig) {
        this.hasSlideshowConfig = hasSlideshowConfig;
    }
    
    public Boolean getMuteMusicDuringVideo() {
        return muteMusicDuringVideo;
    }
    
    public void setMuteMusicDuringVideo(Boolean muteMusicDuringVideo) {
        this.muteMusicDuringVideo = muteMusicDuringVideo;
    }
}
