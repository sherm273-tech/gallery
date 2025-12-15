package au.com.siac.gallery.events.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, name = "event_date")
    private LocalDate eventDate;
    
    @Column(name = "event_end_date")
    private LocalDate eventEndDate;
    
    @Column(name = "event_time")
    private LocalTime eventTime;
    
    @Column(nullable = false, length = 50, name = "event_type")
    private String eventType;  // 'appointment', 'birthday', 'bill', 'reminder', 'holiday', 'other'
    
    @Column(nullable = false)
    private Boolean recurring = false;
    
    @Column(length = 50, name = "recurrence_pattern")
    private String recurrencePattern;  // 'daily', 'weekly', 'monthly', 'yearly'
    
    @Column(nullable = false, name = "notification_enabled")
    private Boolean notificationEnabled = false;
    
    @Column(name = "notification_lead_time")
    private Integer notificationLeadTime;  // minutes before event to notify
    
    @Column(nullable = false, name = "sms_enabled")
    private Boolean smsEnabled = false;
    
    @Column(nullable = false)
    private Boolean completed = false;
    
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
    public Event() {
    }
    
    public Event(String title, String description, LocalDate eventDate, LocalTime eventTime, String eventType) {
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.eventTime = eventTime;
        this.eventType = eventType;
        this.recurring = false;
        this.notificationEnabled = false;
        this.smsEnabled = false;
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
    
    public LocalDate getEventDate() {
        return eventDate;
    }
    
    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }    
    public LocalDate getEventEndDate() {
        return eventEndDate;
    }
    
    public void setEventEndDate(LocalDate eventEndDate) {
        this.eventEndDate = eventEndDate;
    }
    
    
    public LocalTime getEventTime() {
        return eventTime;
    }
    
    public void setEventTime(LocalTime eventTime) {
        this.eventTime = eventTime;
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
    
    public Boolean getNotificationEnabled() {
        return notificationEnabled;
    }
    
    public void setNotificationEnabled(Boolean notificationEnabled) {
        this.notificationEnabled = notificationEnabled;
    }
    
    public Integer getNotificationLeadTime() {
        return notificationLeadTime;
    }
    
    public void setNotificationLeadTime(Integer notificationLeadTime) {
        this.notificationLeadTime = notificationLeadTime;
    }
    
    public Boolean getSmsEnabled() {
        return smsEnabled;
    }
    
    public void setSmsEnabled(Boolean smsEnabled) {
        this.smsEnabled = smsEnabled;
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
}
