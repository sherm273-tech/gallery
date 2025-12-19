package au.com.siac.gallery.notification.service;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.notification.entity.NotificationHistory;
import au.com.siac.gallery.notification.provider.BrowserNotificationProvider;
import au.com.siac.gallery.notification.provider.EmailNotificationProvider;
import au.com.siac.gallery.notification.provider.SmsNotificationProvider;
import au.com.siac.gallery.notification.repository.NotificationHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Main notification service
 * Coordinates sending notifications through different providers
 */
@Service
public class NotificationService {
    
    @Autowired
    private NotificationHistoryRepository historyRepository;
    
    @Autowired
    private NotificationSettingsService settingsService;
    
    @Autowired
    private BrowserNotificationProvider browserProvider;
    
    @Autowired
    private EmailNotificationProvider emailProvider;
    
    @Autowired
    private SmsNotificationProvider smsProvider;
    
    /**
     * Send notification for an event based on timing
     */
    public void sendNotification(Event event, String timing) {
        if (!event.getNotificationsEnabled()) {
            return;
        }
        
        // Check if we're in quiet hours
        if (settingsService.isQuietHours()) {
            System.out.println("[NotificationService] Skipping notification - quiet hours active");
            return;
        }
        
        // Send through enabled channels
        if (event.getNotifyBrowser()) {
            sendBrowserNotification(event, timing);
        }
        
        if (event.getNotifyEmail()) {
            sendEmailNotification(event, timing);
        }
        
        if (event.getNotifySms()) {
            sendSmsNotification(event, timing);
        }
    }
    
    /**
     * Send browser notification
     */
    private void sendBrowserNotification(Event event, String timing) {
        try {
            String recipient = "browser";
            
            // Check if already sent
            if (isAlreadySent(event.getId(), "BROWSER", timing)) {
                System.out.println("[NotificationService] Browser notification already sent for event: " + event.getId());
                return;
            }
            
            boolean success = browserProvider.sendNotification(event, timing);
            
            // Log to history
            logNotification(event, "BROWSER", timing, recipient, 
                success ? "SENT" : "FAILED", 
                success ? null : "Failed to queue browser notification");
                
        } catch (Exception e) {
            System.err.println("[NotificationService] Error sending browser notification: " + e.getMessage());
            logNotification(event, "BROWSER", timing, "browser", "FAILED", e.getMessage());
        }
    }
    
    /**
     * Send email notification
     */
    private void sendEmailNotification(Event event, String timing) {
        try {
            String recipient = settingsService.getSettings().getDefaultEmail();
            
            if (recipient == null || recipient.isEmpty()) {
                System.out.println("[NotificationService] No email configured - skipping email notification");
                return;
            }
            
            // Check if already sent
            if (isAlreadySent(event.getId(), "EMAIL", timing)) {
                System.out.println("[NotificationService] Email notification already sent for event: " + event.getId());
                return;
            }
            
            boolean success = emailProvider.sendNotification(event, timing, recipient);
            
            // Log to history
            logNotification(event, "EMAIL", timing, recipient, 
                success ? "SENT" : "FAILED", 
                success ? null : "Failed to send email via SNS");
                
        } catch (Exception e) {
            System.err.println("[NotificationService] Error sending email notification: " + e.getMessage());
            String recipient = settingsService.getSettings().getDefaultEmail();
            logNotification(event, "EMAIL", timing, recipient, "FAILED", e.getMessage());
        }
    }
    
    /**
     * Send SMS notification
     */
    private void sendSmsNotification(Event event, String timing) {
        try {
            String recipient = settingsService.getSettings().getDefaultPhone();
            
            if (recipient == null || recipient.isEmpty()) {
                System.out.println("[NotificationService] No phone configured - skipping SMS notification");
                return;
            }
            
            // Check if already sent
            if (isAlreadySent(event.getId(), "SMS", timing)) {
                System.out.println("[NotificationService] SMS notification already sent for event: " + event.getId());
                return;
            }
            
            boolean success = smsProvider.sendNotification(event, timing, recipient);
            
            // Log to history
            logNotification(event, "SMS", timing, recipient, 
                success ? "SENT" : "FAILED", 
                success ? null : "Failed to send SMS via SNS");
                
        } catch (Exception e) {
            System.err.println("[NotificationService] Error sending SMS notification: " + e.getMessage());
            String recipient = settingsService.getSettings().getDefaultPhone();
            logNotification(event, "SMS", timing, recipient, "FAILED", e.getMessage());
        }
    }
    
    /**
     * Check if notification already sent
     */
    private boolean isAlreadySent(Long eventId, String type, String timing) {
        List<NotificationHistory> existing = historyRepository
            .findByEventIdAndNotificationTypeAndNotificationTiming(eventId, type, timing);
        
        // Check if any were successfully sent
        return existing.stream().anyMatch(h -> "SENT".equals(h.getStatus()));
    }
    
    /**
     * Log notification to history
     */
    private void logNotification(Event event, String type, String timing, 
                                 String recipient, String status, String errorMessage) {
        NotificationHistory history = new NotificationHistory();
        history.setEventId(event.getId());
        history.setEventTitle(event.getTitle());
        history.setNotificationType(type);
        history.setNotificationTiming(timing);
        history.setRecipient(recipient);
        history.setStatus(status);
        history.setErrorMessage(errorMessage);
        history.setScheduledTime(LocalDateTime.now());
        
        if ("SENT".equals(status)) {
            history.setSentTime(LocalDateTime.now());
        }
        
        historyRepository.save(history);
        
        System.out.println("[NotificationService] Logged " + type + " notification: " + status);
    }
}
