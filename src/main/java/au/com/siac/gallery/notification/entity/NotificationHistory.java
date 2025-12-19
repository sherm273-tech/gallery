package au.com.siac.gallery.notification.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for tracking notification history
 * Records all notification attempts (successful and failed)
 */
@Entity
@Table(name = "notification_history")
public class NotificationHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    // Reference to the event
    @Column(nullable = false, name = "event_id")
    private Long eventId;
    
    @Column(name = "event_title", length = 255)
    private String eventTitle;  // Store title for history even if event is deleted
    
    // Notification details
    @Column(nullable = false, name = "notification_type", length = 20)
    private String notificationType;  // "BROWSER", "EMAIL", "SMS"
    
    @Column(nullable = false, name = "notification_timing", length = 50)
    private String notificationTiming;  // "1_day_before", "1_hour_before", etc.
    
    @Column(name = "recipient", length = 255)
    private String recipient;  // Email address or phone number
    
    // Status tracking
    @Column(nullable = false, length = 20)
    private String status;  // "SENT", "FAILED", "PENDING"
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;  // If failed, store the error
    
    // Timestamps
    @Column(nullable = false, name = "scheduled_time")
    private LocalDateTime scheduledTime;  // When it was supposed to be sent
    
    @Column(name = "sent_time")
    private LocalDateTime sentTime;  // When it was actually sent
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public NotificationHistory() {
    }
    
    public NotificationHistory(Long eventId, String eventTitle, String notificationType, 
                               String notificationTiming, String recipient, String status) {
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.notificationType = notificationType;
        this.notificationTiming = notificationTiming;
        this.recipient = recipient;
        this.status = status;
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
    
    public String getEventTitle() {
        return eventTitle;
    }
    
    public void setEventTitle(String eventTitle) {
        this.eventTitle = eventTitle;
    }
    
    public String getNotificationType() {
        return notificationType;
    }
    
    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }
    
    public String getNotificationTiming() {
        return notificationTiming;
    }
    
    public void setNotificationTiming(String notificationTiming) {
        this.notificationTiming = notificationTiming;
    }
    
    public String getRecipient() {
        return recipient;
    }
    
    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }
    
    public void setScheduledTime(LocalDateTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }
    
    public LocalDateTime getSentTime() {
        return sentTime;
    }
    
    public void setSentTime(LocalDateTime sentTime) {
        this.sentTime = sentTime;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
