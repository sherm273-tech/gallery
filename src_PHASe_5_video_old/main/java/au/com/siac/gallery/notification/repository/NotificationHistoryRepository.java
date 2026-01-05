package au.com.siac.gallery.notification.repository;

import au.com.siac.gallery.notification.entity.NotificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {
    
    /**
     * Find all notification history for a specific event
     */
    List<NotificationHistory> findByEventIdOrderByCreatedAtDesc(Long eventId);
    
    /**
     * Find history by event, type, and timing (to check if already sent)
     */
    List<NotificationHistory> findByEventIdAndNotificationTypeAndNotificationTiming(
        Long eventId, String notificationType, String notificationTiming
    );
    
    /**
     * Find all notifications with a specific status
     */
    List<NotificationHistory> findByStatus(String status);
    
    /**
     * Find all notifications by type
     */
    List<NotificationHistory> findByNotificationType(String notificationType);
    
    /**
     * Find notifications by type and status
     */
    List<NotificationHistory> findByNotificationTypeAndStatus(String notificationType, String status);
    
    /**
     * Find notifications sent within a date range (for reporting/cost tracking)
     */
    List<NotificationHistory> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find notifications created after a certain time
     */
    List<NotificationHistory> findByCreatedAtAfter(LocalDateTime after);
    
    /**
     * Find notifications by type created after a certain time
     */
    List<NotificationHistory> findByNotificationTypeAndCreatedAtAfter(String notificationType, LocalDateTime after);
    
    /**
     * Count SMS notifications sent in a date range (for cost estimation)
     */
    Long countByNotificationTypeAndCreatedAtBetween(String notificationType, LocalDateTime start, LocalDateTime end);
    
    /**
     * Count notifications by status
     */
    Long countByStatus(String status);
    
    /**
     * Count notifications by type and status
     */
    Long countByNotificationTypeAndStatus(String notificationType, String status);
}
