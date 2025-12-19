package au.com.siac.gallery.notification.service;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.events.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Notification Scheduler
 * Runs every minute to check for events that need notifications
 */
@Service
public class NotificationScheduler {
    
    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Check for notifications every minute
     * Runs at the top of each minute (0 seconds)
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void checkPendingNotifications() {
        System.out.println("[NotificationScheduler] Checking for pending notifications at " + LocalDateTime.now());
        
        try {
            // Get all events with notifications enabled that are not completed
            List<Event> events = eventRepository.findAll().stream()
                .filter(event -> event != null && event.getNotificationsEnabled() && !event.getCompleted())
                .toList();
            
            System.out.println("[NotificationScheduler] Found " + events.size() + " events with notifications enabled");
            
            for (Event event : events) {
                checkEventNotifications(event);
            }
        } catch (Exception e) {
            System.err.println("[NotificationScheduler] Error checking notifications: " + e.getMessage());
        }
    }
    
    /**
     * Check if an event needs any notifications sent
     */
    private void checkEventNotifications(Event event) {
        // Parse notification timings
        List<String> timings = parseTimings(event.getNotificationTimings());
        
        if (timings.isEmpty()) {
            return;
        }
        
        LocalDate eventDate = event.getEventDate();
        LocalTime eventTime = event.getEventTime();
        LocalDateTime now = LocalDateTime.now();
        
        for (String timing : timings) {
            if (shouldSendNotification(timing, eventDate, eventTime, now)) {
                System.out.println("[NotificationScheduler] Sending " + timing + " notification for: " + event.getTitle());
                notificationService.sendNotification(event, timing);
            }
        }
    }
    
    /**
     * Determine if a notification should be sent based on timing
     */
    private boolean shouldSendNotification(String timing, LocalDate eventDate, LocalTime eventTime, LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        switch (timing) {
            case "1_week_before":
                // Send 1 week before at 9 AM
                LocalDate weekBefore = eventDate.minusWeeks(1);
                return today.equals(weekBefore) && 
                       currentTime.getHour() == 9 && 
                       currentTime.getMinute() == 0;
                
            case "3_days_before":
                // Send 3 days before at 9 AM
                LocalDate threeDaysBefore = eventDate.minusDays(3);
                return today.equals(threeDaysBefore) && 
                       currentTime.getHour() == 9 && 
                       currentTime.getMinute() == 0;
                
            case "1_day_before":
                // Send 1 day before at 9 AM
                LocalDate oneDayBefore = eventDate.minusDays(1);
                return today.equals(oneDayBefore) && 
                       currentTime.getHour() == 9 && 
                       currentTime.getMinute() == 0;
                
            case "morning_of":
                // Send on event day at 9 AM
                return today.equals(eventDate) && 
                       currentTime.getHour() == 9 && 
                       currentTime.getMinute() == 0;
                
            case "1_hour_before":
                // Send 1 hour before event time (only if event has a time)
                if (eventTime == null) return false;
                
                LocalDateTime eventDateTime = LocalDateTime.of(eventDate, eventTime);
                LocalDateTime oneHourBefore = eventDateTime.minusHours(1);
                
                // Check if we're within the same minute as 1 hour before
                return now.toLocalDate().equals(oneHourBefore.toLocalDate()) &&
                       now.getHour() == oneHourBefore.getHour() &&
                       now.getMinute() == oneHourBefore.getMinute();
                
            case "30_mins_before":
                // Send 30 minutes before event time (only if event has a time)
                if (eventTime == null) return false;
                
                LocalDateTime eventDateTime30 = LocalDateTime.of(eventDate, eventTime);
                LocalDateTime thirtyMinsBefore = eventDateTime30.minusMinutes(30);
                
                // Check if we're within the same minute as 30 mins before
                return now.toLocalDate().equals(thirtyMinsBefore.toLocalDate()) &&
                       now.getHour() == thirtyMinsBefore.getHour() &&
                       now.getMinute() == thirtyMinsBefore.getMinute();
                
            default:
                return false;
        }
    }
    
    /**
     * Parse notification timings from JSON string
     * Simple parser - expects format: ["timing1","timing2"]
     */
    private List<String> parseTimings(String timingsJson) {
        if (timingsJson == null || timingsJson.isEmpty()) {
            return new ArrayList<>();
        }
        
        try {
            // Remove brackets and quotes: ["1_day_before","1_hour_before"] -> 1_day_before,1_hour_before
            String cleaned = timingsJson
                .replace("[", "")
                .replace("]", "")
                .replace("\"", "")
                .replace("'", "")
                .trim();
            
            if (cleaned.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Split by comma and trim
            return Arrays.stream(cleaned.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            System.err.println("[NotificationScheduler] Error parsing timings: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
