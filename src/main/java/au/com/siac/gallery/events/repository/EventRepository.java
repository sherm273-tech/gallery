package au.com.siac.gallery.events.repository;

import au.com.siac.gallery.events.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    /**
     * Find all events ordered by date and time
     */
    List<Event> findAllByOrderByEventDateAscEventTimeAsc();
    
    /**
     * Find events by date
     */
    List<Event> findByEventDateOrderByEventTimeAsc(LocalDate date);
    
    /**
     * Find events between date range
     */
    List<Event> findByEventDateBetweenOrderByEventDateAscEventTimeAsc(LocalDate startDate, LocalDate endDate);
    
    /**
     * Find events on or after a date
     */
    List<Event> findByEventDateGreaterThanEqualOrderByEventDateAscEventTimeAsc(LocalDate date);
    
    /**
     * Find upcoming incomplete events (today onwards)
     */
    @Query("SELECT e FROM Event e WHERE e.eventDate >= :today AND e.completed = false ORDER BY e.eventDate ASC, e.eventTime ASC")
    List<Event> findUpcomingEvents(@Param("today") LocalDate today);
    
    /**
     * Find events by type
     */
    List<Event> findByEventTypeOrderByEventDateAscEventTimeAsc(String eventType);
    
    /**
     * Find completed events
     */
    List<Event> findByCompletedOrderByEventDateDesc(Boolean completed);
    
    /**
     * Find recurring events
     */
    List<Event> findByRecurringOrderByEventDateAscEventTimeAsc(Boolean recurring);
    
    /**
     * Count total events
     */
    long count();
    
    /**
     * Count upcoming events (incomplete and today or later)
     */
    @Query("SELECT COUNT(e) FROM Event e WHERE e.eventDate >= :today AND e.completed = false")
    long countUpcomingEvents(@Param("today") LocalDate today);
}
