package au.com.siac.gallery.events.service;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.events.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {
    
    @Autowired
    private EventRepository eventRepository;
    
    /**
     * Get all events ordered by date and time
     */
    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateAscEventTimeAsc();
    }
    
    /**
     * Get event by ID
     */
    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }
    
    /**
     * Get events for today
     */
    public List<Event> getTodayEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findByEventDateOrderByEventTimeAsc(today);
    }
    
    /**
     * Get upcoming events (today and future, not completed)
     */
    public List<Event> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        return eventRepository.findUpcomingEvents(today);
    }
    
    /**
     * Get events for this week
     */
    public List<Event> getThisWeekEvents() {
        LocalDate today = LocalDate.now();
        LocalDate endOfWeek = today.plusDays(7);
        return eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(today, endOfWeek);
    }
    
    /**
     * Get events for this month
     */
    public List<Event> getThisMonthEvents() {
        LocalDate today = LocalDate.now();
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        return eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(today, endOfMonth);
    }
    
    /**
     * Get events by type
     */
    public List<Event> getEventsByType(String eventType) {
        return eventRepository.findByEventTypeOrderByEventDateAscEventTimeAsc(eventType);
    }
    
    /**
     * Get completed events
     */
    public List<Event> getCompletedEvents() {
        return eventRepository.findByCompletedOrderByEventDateDesc(true);
    }
    
    /**
     * Get events in date range
     */
    public List<Event> getEventsByDateRange(LocalDate startDate, LocalDate endDate) {
        return eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(startDate, endDate);
    }
    
    /**
     * Create new event
     */
    @Transactional
    public Event createEvent(Event event) {
        // Set defaults if not provided
        if (event.getRecurring() == null) {
            event.setRecurring(false);
        }
        if (event.getNotificationEnabled() == null) {
            event.setNotificationEnabled(false);
        }
        if (event.getSmsEnabled() == null) {
            event.setSmsEnabled(false);
        }
        if (event.getCompleted() == null) {
            event.setCompleted(false);
        }
        
        return eventRepository.save(event);
    }
    
    /**
     * Update existing event
     */
    @Transactional
    public Event updateEvent(Long id, Event updatedEvent) {
        Event existing = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        
        existing.setTitle(updatedEvent.getTitle());
        existing.setDescription(updatedEvent.getDescription());
        existing.setEventDate(updatedEvent.getEventDate());
        existing.setEventTime(updatedEvent.getEventTime());
        existing.setEventType(updatedEvent.getEventType());
        
        if (updatedEvent.getRecurring() != null) {
            existing.setRecurring(updatedEvent.getRecurring());
        }
        if (updatedEvent.getRecurrencePattern() != null) {
            existing.setRecurrencePattern(updatedEvent.getRecurrencePattern());
        }
        if (updatedEvent.getNotificationEnabled() != null) {
            existing.setNotificationEnabled(updatedEvent.getNotificationEnabled());
        }
        if (updatedEvent.getNotificationLeadTime() != null) {
            existing.setNotificationLeadTime(updatedEvent.getNotificationLeadTime());
        }
        if (updatedEvent.getSmsEnabled() != null) {
            existing.setSmsEnabled(updatedEvent.getSmsEnabled());
        }
        if (updatedEvent.getCompleted() != null) {
            existing.setCompleted(updatedEvent.getCompleted());
        }
        
        return eventRepository.save(existing);
    }
    
    /**
     * Delete event
     */
    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        eventRepository.delete(event);
    }
    
    /**
     * Mark event as completed
     */
    @Transactional
    public Event markAsCompleted(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        event.setCompleted(true);
        return eventRepository.save(event);
    }
    
    /**
     * Mark event as not completed
     */
    @Transactional
    public Event markAsNotCompleted(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        event.setCompleted(false);
        return eventRepository.save(event);
    }
    
    /**
     * Get event statistics
     */
    public EventStatistics getStatistics() {
        LocalDate today = LocalDate.now();
        LocalDate weekFromNow = today.plusDays(7);
        
        long total = eventRepository.count();
        long upcoming = eventRepository.countUpcomingEvents(today);
        long completed = eventRepository.findByCompletedOrderByEventDateDesc(true).size();
        long todayCount = eventRepository.findByEventDateOrderByEventTimeAsc(today).stream()
                .filter(e -> !e.getCompleted())
                .count();
        long weekCount = eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(today, weekFromNow).stream()
                .filter(e -> !e.getCompleted())
                .count();
        
        return new EventStatistics(total, upcoming, completed, todayCount, weekCount);
    }
    
    /**
     * Inner class for statistics
     */
    public static class EventStatistics {
        private long totalEvents;
        private long upcomingEvents;
        private long completedEvents;
        private long todayEvents;
        private long weekEvents;
        
        public EventStatistics(long totalEvents, long upcomingEvents, long completedEvents, long todayEvents, long weekEvents) {
            this.totalEvents = totalEvents;
            this.upcomingEvents = upcomingEvents;
            this.completedEvents = completedEvents;
            this.todayEvents = todayEvents;
            this.weekEvents = weekEvents;
        }
        
        public long getTotalEvents() {
            return totalEvents;
        }
        
        public long getUpcomingEvents() {
            return upcomingEvents;
        }
        
        public long getCompletedEvents() {
            return completedEvents;
        }
        
        public long getTodayEvents() {
            return todayEvents;
        }
        
        public long getWeekEvents() {
            return weekEvents;
        }
    }
}
