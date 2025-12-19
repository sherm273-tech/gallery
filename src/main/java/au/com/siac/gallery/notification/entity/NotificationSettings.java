package au.com.siac.gallery.notification.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Entity for storing global notification settings
 * Singleton pattern - should only have one record
 */
@Entity
@Table(name = "notification_settings")
public class NotificationSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    // Contact Information
    @Column(name = "default_email", length = 255)
    private String defaultEmail;
    
    @Column(name = "default_phone", length = 20)
    private String defaultPhone;
    
    // Default Notification Preferences
    @Column(nullable = false, name = "default_browser_enabled")
    private Boolean defaultBrowserEnabled = true;
    
    @Column(nullable = false, name = "default_email_enabled")
    private Boolean defaultEmailEnabled = false;
    
    @Column(nullable = false, name = "default_sms_enabled")
    private Boolean defaultSmsEnabled = false;
    
    // Quiet Hours
    @Column(nullable = false, name = "quiet_hours_enabled")
    private Boolean quietHoursEnabled = false;
    
    @Column(name = "quiet_hours_start")
    private LocalTime quietHoursStart;  // e.g., 22:00
    
    @Column(name = "quiet_hours_end")
    private LocalTime quietHoursEnd;    // e.g., 07:00
    
    // AWS SNS Configuration (optional - can be stored in application.properties instead)
    @Column(name = "aws_sns_region", length = 50)
    private String awsSnsRegion;
    
    // Timestamps
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
    public NotificationSettings() {
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getDefaultEmail() {
        return defaultEmail;
    }
    
    public void setDefaultEmail(String defaultEmail) {
        this.defaultEmail = defaultEmail;
    }
    
    public String getDefaultPhone() {
        return defaultPhone;
    }
    
    public void setDefaultPhone(String defaultPhone) {
        this.defaultPhone = defaultPhone;
    }
    
    public Boolean getDefaultBrowserEnabled() {
        return defaultBrowserEnabled;
    }
    
    public void setDefaultBrowserEnabled(Boolean defaultBrowserEnabled) {
        this.defaultBrowserEnabled = defaultBrowserEnabled;
    }
    
    public Boolean getDefaultEmailEnabled() {
        return defaultEmailEnabled;
    }
    
    public void setDefaultEmailEnabled(Boolean defaultEmailEnabled) {
        this.defaultEmailEnabled = defaultEmailEnabled;
    }
    
    public Boolean getDefaultSmsEnabled() {
        return defaultSmsEnabled;
    }
    
    public void setDefaultSmsEnabled(Boolean defaultSmsEnabled) {
        this.defaultSmsEnabled = defaultSmsEnabled;
    }
    
    public Boolean getQuietHoursEnabled() {
        return quietHoursEnabled;
    }
    
    public void setQuietHoursEnabled(Boolean quietHoursEnabled) {
        this.quietHoursEnabled = quietHoursEnabled;
    }
    
    public LocalTime getQuietHoursStart() {
        return quietHoursStart;
    }
    
    public void setQuietHoursStart(LocalTime quietHoursStart) {
        this.quietHoursStart = quietHoursStart;
    }
    
    public LocalTime getQuietHoursEnd() {
        return quietHoursEnd;
    }
    
    public void setQuietHoursEnd(LocalTime quietHoursEnd) {
        this.quietHoursEnd = quietHoursEnd;
    }
    
    public String getAwsSnsRegion() {
        return awsSnsRegion;
    }
    
    public void setAwsSnsRegion(String awsSnsRegion) {
        this.awsSnsRegion = awsSnsRegion;
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
