package au.com.siac.gallery.events.controller;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.events.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {
    
    @Autowired
    private EventService eventService;
    
    /**
     * Get all events
     * GET /api/events/list
     */
    @GetMapping("/list")
    public ResponseEntity<List<Event>> getAllEvents() {
        try {
            List<Event> events = eventService.getAllEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get event by ID
     * GET /api/events/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        try {
            return eventService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get today's events
     * GET /api/events/today
     */
    @GetMapping("/today")
    public ResponseEntity<List<Event>> getTodayEvents() {
        try {
            List<Event> events = eventService.getTodayEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get upcoming events (today and future, not completed)
     * GET /api/events/upcoming
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<Event>> getUpcomingEvents() {
        try {
            List<Event> events = eventService.getUpcomingEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get this week's events
     * GET /api/events/this-week
     */
    @GetMapping("/this-week")
    public ResponseEntity<List<Event>> getThisWeekEvents() {
        try {
            List<Event> events = eventService.getThisWeekEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get this month's events
     * GET /api/events/this-month
     */
    @GetMapping("/this-month")
    public ResponseEntity<List<Event>> getThisMonthEvents() {
        try {
            List<Event> events = eventService.getThisMonthEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get events by type
     * GET /api/events/type/{eventType}
     */
    @GetMapping("/type/{eventType}")
    public ResponseEntity<List<Event>> getEventsByType(@PathVariable String eventType) {
        try {
            List<Event> events = eventService.getEventsByType(eventType);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get completed events
     * GET /api/events/completed
     */
    @GetMapping("/completed")
    public ResponseEntity<List<Event>> getCompletedEvents() {
        try {
            List<Event> events = eventService.getCompletedEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get events by date range
     * GET /api/events/range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/range")
    public ResponseEntity<List<Event>> getEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<Event> events = eventService.getEventsByDateRange(startDate, endDate);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Create new event
     * POST /api/events/create
     * Body: { "title": "Doctor Appointment", "eventDate": "2024-12-15", "eventTime": "14:30", "eventType": "appointment", ... }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        try {
            Event created = eventService.createEvent(event);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Update existing event
     * PUT /api/events/update/{id}
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Event event) {
        try {
            Event updated = eventService.updateEvent(id, event);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Delete event
     * DELETE /api/events/delete/{id}
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEvent(id);
            return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Mark event as completed
     * POST /api/events/complete/{id}
     */
    @PostMapping("/complete/{id}")
    public ResponseEntity<?> markAsCompleted(@PathVariable Long id) {
        try {
            Event updated = eventService.markAsCompleted(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Mark event as not completed
     * POST /api/events/uncomplete/{id}
     */
    @PostMapping("/uncomplete/{id}")
    public ResponseEntity<?> markAsNotCompleted(@PathVariable Long id) {
        try {
            Event updated = eventService.markAsNotCompleted(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get event statistics
     * GET /api/events/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            EventService.EventStatistics stats = eventService.getStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
