package au.com.siac.gallery.notification.provider;

import au.com.siac.gallery.events.entity.Event;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Browser notification provider
 * Queues notifications that will be fetched by frontend JavaScript
 */
@Component
public class BrowserNotificationProvider {
    
    // In-memory queue of pending browser notifications
    // Key: notification ID, Value: notification data
    private final ConcurrentHashMap<String, BrowserNotification> pendingNotifications = new ConcurrentHashMap<>();
    
    /**
     * Send (queue) a browser notification
     */
    public boolean sendNotification(Event event, String timing) {
        try {
            String notificationId = event.getId() + "_" + timing + "_" + System.currentTimeMillis();
            
            BrowserNotification notification = new BrowserNotification(
                notificationId,
                formatTitle(event, timing),
                formatBody(event),
                event.getId(),
                LocalDateTime.now()
            );
            
            pendingNotifications.put(notificationId, notification);
            
            System.out.println("[BrowserNotificationProvider] Queued notification: " + notification.getTitle());
            return true;
            
        } catch (Exception e) {
            System.err.println("[BrowserNotificationProvider] Error queueing notification: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Get all pending notifications and clear them
     */
    public List<BrowserNotification> getPendingNotifications() {
        List<BrowserNotification> notifications = new ArrayList<>(pendingNotifications.values());
        pendingNotifications.clear();
        return notifications;
    }
    
    /**
     * Format notification title based on timing
     */
    private String formatTitle(Event event, String timing) {
        String when = formatTiming(timing);
        return event.getTitle() + " - " + when;
    }
    
    /**
     * Format notification body
     */
    private String formatBody(Event event) {
        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("EEE, MMM d");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("h:mm a");
        
        LocalDateTime eventDateTime = event.getEventStartDatetime();
        String dateStr = eventDateTime.format(dateFormat);
        String timeStr = eventDateTime.format(timeFormat);
        
        return dateStr + " at " + timeStr;
    }
    
    /**
     * Convert timing code to readable text
     */
    private String formatTiming(String timing) {
        switch (timing) {
            case "1_week_before": return "in 1 week";
            case "3_days_before": return "in 3 days";
            case "1_day_before": return "tomorrow";
            case "morning_of": return "today";
            case "1_hour_before": return "in 1 hour";
            case "30_mins_before": return "in 30 minutes";
            default: return "soon";
        }
    }
    
    /**
     * Inner class for browser notification data
     */
    public static class BrowserNotification {
        private String id;
        private String title;
        private String body;
        private Long eventId;
        private LocalDateTime createdAt;
        
        public BrowserNotification(String id, String title, String body, Long eventId, LocalDateTime createdAt) {
            this.id = id;
            this.title = title;
            this.body = body;
            this.eventId = eventId;
            this.createdAt = createdAt;
        }
        
        // Getters
        public String getId() { return id; }
        public String getTitle() { return title; }
        public String getBody() { return body; }
        public Long getEventId() { return eventId; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}
