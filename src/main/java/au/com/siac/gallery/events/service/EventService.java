package au.com.siac.gallery.events.service;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.events.repository.EventRepository;
import au.com.siac.gallery.slideshow.service.SlideshowConfigurationService;
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
    
    @Autowired
    private SlideshowConfigurationService slideshowConfigService;
    
    /**
     * Populate slideshow config flag for a single event
     */
    private void populateSlideshowConfig(Event event) {
        if (event != null && event.getId() != null) {
            event.setHasSlideshowConfig(slideshowConfigService.existsByEventId(event.getId()));
        }
    }
    
    /**
     * Populate slideshow config flag for a list of events
     */
    private void populateSlideshowConfigs(List<Event> events) {
        events.forEach(this::populateSlideshowConfig);
    }
    
    /**
     * Get all events ordered by date and time
     */
    public List<Event> getAllEvents() {
        List<Event> events = eventRepository.findAllByOrderByEventDateAscEventTimeAsc();
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get event by ID
     */
    public Optional<Event> getEventById(Long id) {
        Optional<Event> event = eventRepository.findById(id);
        event.ifPresent(this::populateSlideshowConfig);
        return event;
    }
    
    /**
     * Get events for today
     */
    public List<Event> getTodayEvents() {
        LocalDate today = LocalDate.now();
        List<Event> events = eventRepository.findByEventDateOrderByEventTimeAsc(today);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get upcoming events (today and future, not completed)
     */
    public List<Event> getUpcomingEvents() {
        LocalDate today = LocalDate.now();
        List<Event> events = eventRepository.findUpcomingEvents(today);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events for this week
     */
    public List<Event> getThisWeekEvents() {
        LocalDate today = LocalDate.now();
        LocalDate endOfWeek = today.plusDays(7);
        List<Event> events = eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(today, endOfWeek);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events for this month
     */
    public List<Event> getThisMonthEvents() {
        LocalDate today = LocalDate.now();
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        List<Event> events = eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(today, endOfMonth);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events by type
     */
    public List<Event> getEventsByType(String eventType) {
        List<Event> events = eventRepository.findByEventTypeOrderByEventDateAscEventTimeAsc(eventType);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get completed events
     */
    public List<Event> getCompletedEvents() {
        List<Event> events = eventRepository.findByCompletedOrderByEventDateDesc(true);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events in date range
     */
    public List<Event> getEventsByDateRange(LocalDate startDate, LocalDate endDate) {
        List<Event> events = eventRepository.findByEventDateBetweenOrderByEventDateAscEventTimeAsc(startDate, endDate);
        populateSlideshowConfigs(events);
        return events;
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
        // If eventEndDate is null, default to eventDate (single-day event)
        if (event.getEventEndDate() == null) {
            event.setEventEndDate(event.getEventDate());
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
        // If eventEndDate is null, default to eventDate
        if (updatedEvent.getEventEndDate() != null) {
            existing.setEventEndDate(updatedEvent.getEventEndDate());
        } else {
            existing.setEventEndDate(updatedEvent.getEventDate());
        }
        
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
