package au.com.siac.gallery.notification.controller;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.events.repository.EventRepository;
import au.com.siac.gallery.notification.provider.BrowserNotificationProvider;
import au.com.siac.gallery.notification.service.NotificationService;
import au.com.siac.gallery.notification.entity.NotificationSettings;
import au.com.siac.gallery.notification.entity.NotificationHistory;
import au.com.siac.gallery.notification.repository.NotificationHistoryRepository;
import au.com.siac.gallery.notification.service.NotificationSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for notification operations
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private NotificationSettingsService settingsService;
    
    @Autowired
    private BrowserNotificationProvider browserProvider;
    
    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private NotificationHistoryRepository historyRepository;
    
    /**
     * Get pending browser notifications
     * Frontend will poll this endpoint
     */
    @GetMapping("/browser/pending")
    public ResponseEntity<List<BrowserNotificationProvider.BrowserNotification>> getPendingBrowserNotifications() {
        List<BrowserNotificationProvider.BrowserNotification> notifications = 
            browserProvider.getPendingNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Test notification for an event
     * For manual testing during development
     */
    @PostMapping("/test/{eventId}")
    public ResponseEntity<Map<String, String>> testNotification(
            @PathVariable Long eventId,
            @RequestParam(required = false, defaultValue = "1_day_before") String timing) {
        
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        
        notificationService.sendNotification(event, timing);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Test notification sent for event: " + event.getTitle());
        response.put("timing", timing);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get notification settings
     */
    @GetMapping("/settings")
    public ResponseEntity<NotificationSettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }
    
    /**
     * Update notification settings
     */
    @PutMapping("/settings")
    public ResponseEntity<NotificationSettings> updateSettings(@RequestBody NotificationSettings settings) {
        NotificationSettings updated = settingsService.updateSettings(settings);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Get notification history with pagination and filtering
     */
    @GetMapping("/history")
    public ResponseEntity<List<NotificationHistory>> getHistory(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<NotificationHistory> history;
        
        if (type != null && status != null) {
            history = historyRepository.findByNotificationTypeAndStatus(type, status);
        } else if (type != null) {
            history = historyRepository.findByNotificationType(type);
        } else if (status != null) {
            history = historyRepository.findByStatus(status);
        } else {
            history = historyRepository.findAll(
                Sort.by(Sort.Direction.DESC, "createdAt")
            );
        }
        
        // Simple pagination (return subset)
        int start = page * size;
        int end = Math.min(start + size, history.size());
        
        if (start >= history.size()) {
            return ResponseEntity.ok(List.of());
        }
        
        return ResponseEntity.ok(history.subList(start, end));
    }
    
    /**
     * Get notification history statistics
     */
    @GetMapping("/history/stats")
    public ResponseEntity<Map<String, Object>> getHistoryStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime weekStart = now.minusDays(7);
        LocalDateTime monthStart = now.minusMonths(1);
        
        long totalSent = historyRepository.countByStatus("SENT");
        long totalFailed = historyRepository.countByStatus("FAILED");
        long todayCount = historyRepository.findByCreatedAtAfter(todayStart).size();
        long weekCount = historyRepository.findByCreatedAtAfter(weekStart).size();
        
        // SMS cost tracking
        long smsSentAllTime = historyRepository.countByNotificationTypeAndStatus("SMS", "SENT");
        long smsSentThisMonth = historyRepository.findByNotificationTypeAndCreatedAtAfter("SMS", monthStart)
            .stream()
            .filter(h -> "SENT".equals(h.getStatus()))
            .count();
        
        double smsCostPerMessage = 0.08; // AUD
        double totalSmsCost = smsSentAllTime * smsCostPerMessage;
        double monthSmsCost = smsSentThisMonth * smsCostPerMessage;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSent", totalSent);
        stats.put("totalFailed", totalFailed);
        stats.put("todayCount", todayCount);
        stats.put("weekCount", weekCount);
        stats.put("smsSentAllTime", smsSentAllTime);
        stats.put("smsSentThisMonth", smsSentThisMonth);
        stats.put("totalSmsCost", totalSmsCost);
        stats.put("monthSmsCost", monthSmsCost);
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Clear old notification history (keep last N records)
     */
    @DeleteMapping("/history/clear")
    public ResponseEntity<Map<String, String>> clearOldHistory(
            @RequestParam(defaultValue = "100") int keep) {
        
        List<NotificationHistory> allHistory = historyRepository.findAll(
            Sort.by(Sort.Direction.DESC, "createdAt")
        );
        
        if (allHistory.size() <= keep) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "No old history to clear");
            response.put("kept", String.valueOf(allHistory.size()));
            return ResponseEntity.ok(response);
        }
        
        List<NotificationHistory> toDelete = allHistory.subList(keep, allHistory.size());
        historyRepository.deleteAll(toDelete);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cleared old notification history");
        response.put("deleted", String.valueOf(toDelete.size()));
        response.put("kept", String.valueOf(keep));
        
        return ResponseEntity.ok(response);
    }
}
