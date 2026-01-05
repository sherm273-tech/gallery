package au.com.siac.gallery.memories.service;

import au.com.siac.gallery.notification.entity.NotificationHistory;
import au.com.siac.gallery.notification.repository.NotificationHistoryRepository;
import au.com.siac.gallery.notification.service.NotificationSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for sending notifications about memories
 */
@Service
public class MemoriesNotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(MemoriesNotificationService.class);
    
    @Value("${memories.notifications.enabled:true}")
    private boolean notificationsEnabled;
    
    @Autowired
    private MemoriesService memoriesService;
    
    @Autowired
    private NotificationHistoryRepository historyRepository;
    
    @Autowired
    private NotificationSettingsService settingsService;
    
    /**
     * Check if there are memories today and send notification if not already sent
     */
    public void checkAndSendDailyMemoriesNotification() {
        if (!notificationsEnabled) {
            logger.debug("[MemoriesNotificationService] Memories notifications disabled");
            return;
        }
        
        // Check if already sent today
        if (wasNotificationSentToday()) {
            logger.debug("[MemoriesNotificationService] Memories notification already sent today");
            return;
        }
        
        // Check if in quiet hours
        if (settingsService.isQuietHours()) {
            logger.info("[MemoriesNotificationService] Skipping notification - quiet hours active");
            return;
        }
        
        // Get today's memories count
        long count = memoriesService.getTodaysMemoryCount();
        
        if (count == 0) {
            logger.debug("[MemoriesNotificationService] No memories for today, skipping notification");
            return;
        }
        
        // Send notification
        logger.info("[MemoriesNotificationService] Sending memories notification: {} memories found", count);
        sendMemoriesNotification(count);
        
        // Log to history
        logNotification(count, "SENT", null);
    }
    
    /**
     * Check if notification was already sent today
     */
    private boolean wasNotificationSentToday() {
        LocalDate today = LocalDate.now();
        List<NotificationHistory> history = historyRepository.findAll();
        
        return history.stream()
            .filter(h -> "MEMORIES_DAILY".equals(h.getNotificationType()))
            .filter(h -> "SENT".equals(h.getStatus()))
            .filter(h -> h.getSentTime() != null)
            .anyMatch(h -> h.getSentTime().toLocalDate().equals(today));
    }
    
    /**
     * Send the actual notification (browser notification)
     * This creates a browser notification that will be displayed to the user
     */
    private void sendMemoriesNotification(long count) {
        // The browser notification will be picked up by the frontend
        // when it polls /api/memories/notification/pending
        logger.info("[MemoriesNotificationService] Memories notification queued: {} photo{} from this day in previous years",
            count, count == 1 ? "" : "s");
    }
    
    /**
     * Log notification to history
     */
    private void logNotification(long count, String status, String errorMessage) {
        NotificationHistory history = new NotificationHistory();
        history.setEventId(null); // Not tied to specific event
        history.setEventTitle("Memories: " + count + " photo" + (count == 1 ? "" : "s") + " from this day");
        history.setNotificationType("MEMORIES_DAILY");
        history.setNotificationTiming("morning_of");
        history.setRecipient("browser");
        history.setStatus(status);
        history.setErrorMessage(errorMessage);
        history.setScheduledTime(LocalDateTime.now());
        
        if ("SENT".equals(status)) {
            history.setSentTime(LocalDateTime.now());
        }
        
        historyRepository.save(history);
        
        logger.debug("[MemoriesNotificationService] Logged memories notification: {}", status);
    }
    
    /**
     * Get pending memories notification for today
     * Returns null if no notification pending or already sent
     */
    public MemoriesNotificationDTO getPendingNotification() {
        // Check if already sent today
        if (wasNotificationSentToday()) {
            return null;
        }
        
        long count = memoriesService.getTodaysMemoryCount();
        
        if (count == 0) {
            return null;
        }
        
        // Check if current time is after 9 AM (when notification should be shown)
        LocalDateTime now = LocalDateTime.now();
        if (now.getHour() < 9) {
            return null;
        }
        
        return new MemoriesNotificationDTO(count);
    }
    
    /**
     * Mark notification as shown/acknowledged
     */
    public void markNotificationShown() {
        long count = memoriesService.getTodaysMemoryCount();
        logNotification(count, "SENT", null);
        logger.info("[MemoriesNotificationService] Memories notification marked as shown");
    }
    
    /**
     * DTO for memories notification
     */
    public static class MemoriesNotificationDTO {
        private long count;
        private String message;
        
        public MemoriesNotificationDTO(long count) {
            this.count = count;
            this.message = "You have " + count + " photo" + (count == 1 ? "" : "s") + 
                          " from this day in previous years!";
        }
        
        public long getCount() {
            return count;
        }
        
        public void setCount(long count) {
            this.count = count;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}
