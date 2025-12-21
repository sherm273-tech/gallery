package au.com.siac.gallery.events.service;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.events.repository.EventRepository;
import au.com.siac.gallery.slideshow.service.SlideshowConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
     * Get all events ordered by start datetime
     */
    public List<Event> getAllEvents() {
        List<Event> events = eventRepository.findAllByOrderByEventStartDatetimeAsc();
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
        List<Event> events = eventRepository.findByEventDate(today);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get upcoming events (from now onwards, not completed)
     */
    public List<Event> getUpcomingEvents() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findUpcomingEvents(now);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events for this week
     */
    public List<Event> getThisWeekEvents() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endOfWeek = now.plusDays(7);
        List<Event> events = eventRepository.findByEventStartDatetimeBetween(now, endOfWeek);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events for this month
     */
    public List<Event> getThisMonthEvents() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endOfMonth = now.toLocalDate().withDayOfMonth(now.toLocalDate().lengthOfMonth()).atTime(23, 59, 59);
        List<Event> events = eventRepository.findByEventStartDatetimeBetween(now, endOfMonth);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events by type
     */
    public List<Event> getEventsByType(String eventType) {
        List<Event> events = eventRepository.findByEventTypeOrderByEventStartDatetimeAsc(eventType);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get completed events
     */
    public List<Event> getCompletedEvents() {
        List<Event> events = eventRepository.findByCompletedOrderByEventStartDatetimeDesc(true);
        populateSlideshowConfigs(events);
        return events;
    }
    
    /**
     * Get events in date range
     */
    public List<Event> getEventsByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        List<Event> events = eventRepository.findByEventStartDatetimeBetween(startDateTime, endDateTime);
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
        if (event.getNotificationsEnabled() == null) {
            event.setNotificationsEnabled(false);
        }
        if (event.getNotifyBrowser() == null) {
            event.setNotifyBrowser(true);
        }
        if (event.getNotifyEmail() == null) {
            event.setNotifyEmail(false);
        }
        if (event.getNotifySms() == null) {
            event.setNotifySms(false);
        }
        if (event.getCompleted() == null) {
            event.setCompleted(false);
        }
        // If eventEndDatetime is null, default to eventStartDatetime (single-point event)
        if (event.getEventEndDatetime() == null) {
            event.setEventEndDatetime(event.getEventStartDatetime());
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
        existing.setEventStartDatetime(updatedEvent.getEventStartDatetime());
        existing.setEventType(updatedEvent.getEventType());
        
        // If eventEndDatetime is null, default to eventStartDatetime
        if (updatedEvent.getEventEndDatetime() != null) {
            existing.setEventEndDatetime(updatedEvent.getEventEndDatetime());
        } else {
            existing.setEventEndDatetime(updatedEvent.getEventStartDatetime());
        }
        
        if (updatedEvent.getRecurring() != null) {
            existing.setRecurring(updatedEvent.getRecurring());
        }
        if (updatedEvent.getRecurrencePattern() != null) {
            existing.setRecurrencePattern(updatedEvent.getRecurrencePattern());
        }
        if (updatedEvent.getNotificationsEnabled() != null) {
            existing.setNotificationsEnabled(updatedEvent.getNotificationsEnabled());
        }
        if (updatedEvent.getNotificationTimings() != null) {
            existing.setNotificationTimings(updatedEvent.getNotificationTimings());
        }
        if (updatedEvent.getNotifyBrowser() != null) {
            existing.setNotifyBrowser(updatedEvent.getNotifyBrowser());
        }
        if (updatedEvent.getNotifyEmail() != null) {
            existing.setNotifyEmail(updatedEvent.getNotifyEmail());
        }
        if (updatedEvent.getNotifySms() != null) {
            existing.setNotifySms(updatedEvent.getNotifySms());
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
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekFromNow = now.plusDays(7);
        LocalDate today = now.toLocalDate();
        
        long total = eventRepository.count();
        long upcoming = eventRepository.countUpcomingEvents(now);
        long completed = eventRepository.findByCompletedOrderByEventStartDatetimeDesc(true).size();
        long todayCount = eventRepository.findByEventDate(today).stream()
                .filter(e -> e != null && !e.getCompleted())
                .count();
        long weekCount = eventRepository.findByEventStartDatetimeBetween(now, weekFromNow).stream()
                .filter(e -> e != null && !e.getCompleted())
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
