package au.com.siac.gallery.events.repository;

import au.com.siac.gallery.events.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    /**
     * Find all events ordered by start datetime
     */
    List<Event> findAllByOrderByEventStartDatetimeAsc();
    
    /**
     * Find events by date (for a specific day - between start and end of that day)
     */
    @Query("SELECT e FROM Event e WHERE DATE(e.eventStartDatetime) = :date ORDER BY e.eventStartDatetime ASC")
    List<Event> findByEventDate(@Param("date") java.time.LocalDate date);
    
    /**
     * Find events between datetime range
     */
    @Query("SELECT e FROM Event e WHERE e.eventStartDatetime >= :startDateTime AND e.eventStartDatetime <= :endDateTime ORDER BY e.eventStartDatetime ASC")
    List<Event> findByEventStartDatetimeBetween(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);
    
    /**
     * Find events on or after a datetime
     */
    List<Event> findByEventStartDatetimeGreaterThanEqualOrderByEventStartDatetimeAsc(LocalDateTime dateTime);
    
    /**
     * Find upcoming incomplete events (from now onwards)
     */
    @Query("SELECT e FROM Event e WHERE e.eventStartDatetime >= :now AND e.completed = false ORDER BY e.eventStartDatetime ASC")
    List<Event> findUpcomingEvents(@Param("now") LocalDateTime now);
    
    /**
     * Find events by type
     */
    List<Event> findByEventTypeOrderByEventStartDatetimeAsc(String eventType);
    
    /**
     * Find completed events
     */
    List<Event> findByCompletedOrderByEventStartDatetimeDesc(Boolean completed);
    
    /**
     * Find recurring events
     */
    List<Event> findByRecurringOrderByEventStartDatetimeAsc(Boolean recurring);
    
    /**
     * Count total events
     */
    long count();
    
    /**
     * Count upcoming events (incomplete and from now onwards)
     */
    @Query("SELECT COUNT(e) FROM Event e WHERE e.eventStartDatetime >= :now AND e.completed = false")
    long countUpcomingEvents(@Param("now") LocalDateTime now);
}
